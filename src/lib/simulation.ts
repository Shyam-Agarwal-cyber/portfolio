/**
 * Request-journey simulation engine.
 *
 * Models the two decoupled ingestion paths of the dialer platform:
 *   1. Synchronous REST — the platform UI sends call-create / call-update
 *      (Postgres writes, no cache) and voicebot campaign creation (guarded by a
 *      Redis distributed lock) to FastAPI. Cached reads (agent availability) go
 *      through Redis, falling back to Postgres and writing the result back.
 *   2. Asynchronous events — the in-house dialer produces call webhooks to a
 *      Kafka topic; a Kafka consumer processes them (9M+ events/day), made
 *      idempotent by a Postgres unique constraint (ON CONFLICT). Row-level lock
 *      contention shows up here, on the consumer's Postgres writes.
 *
 * FastAPI (REST) and the Kafka consumer (async) are the orchestrators: the data
 * stores never talk to each other, so every store call returns to its caller
 * before the next one begins (e.g. FastAPI → Postgres → FastAPI → Redis).
 *
 * Pure and presentation-agnostic: components read `NODES` for layout and
 * `buildScenario()` for a deterministic-per-run list of animation steps.
 */

/* ------------------------------------------------------------------ */
/* Topology                                                            */
/* ------------------------------------------------------------------ */

export const NODE_IDS = [
  'ui',
  'lb',
  'fastapi',
  'redis',
  'postgres',
  'dialer',
  'kafka',
  'consumer',
  'downstream',
] as const;

export type NodeId = (typeof NODE_IDS)[number];

export type IconKey =
  'monitor' | 'split' | 'server' | 'zap' | 'database' | 'phone' | 'radio' | 'cpu' | 'share';

export type ServiceNodeMeta = {
  id: NodeId;
  name: string;
  purpose: string;
  /** Concise, technically accurate "why this exists" for the hover tooltip. */
  why: string;
  icon: IconKey;
};

export const NODES: Record<NodeId, ServiceNodeMeta> = {
  ui: {
    id: 'ui',
    name: 'Platform UI',
    purpose: 'ReactJS · agents & admins',
    why: 'The dialer platform UI. Agents and admins use it to create a call record, update it with disposition and committed amount, and create voicebot campaigns — driving the REST path. It also holds a live socket to the in-house dialer for real-time call state.',
    icon: 'monitor',
  },
  lb: {
    id: 'lb',
    name: 'Load Balancer',
    purpose: 'Routes REST to replicas',
    why: 'Spreads REST traffic across healthy FastAPI replicas and health-checks them, so no single instance is a bottleneck or a single point of failure.',
    icon: 'split',
  },
  fastapi: {
    id: 'fastapi',
    name: 'FastAPI',
    purpose: 'Async REST API',
    why: 'Orchestrates call-create, call-update, and campaign creation. Every DB/cache call is made from here and returns here — the stores never call each other. Voicebot campaign creation takes a Redis distributed lock so concurrent creates wait. Why async: the work is I/O-bound.',
    icon: 'server',
  },
  redis: {
    id: 'redis',
    name: 'Redis',
    purpose: 'Cache + distributed locks',
    why: 'Sub-millisecond cached reads (agent availability): on a miss FastAPI reads Postgres and writes the result back here. Also holds distributed locks — e.g. serializing voicebot campaign creation. Postgres stays authoritative.',
    icon: 'zap',
  },
  postgres: {
    id: 'postgres',
    name: 'PostgreSQL',
    purpose: 'Call records · source of truth',
    why: 'Stores every call and its updates (disposition, committed amount), written by both FastAPI (REST) and the Kafka consumer (webhooks). Webhook idempotency is enforced with a unique constraint (ON CONFLICT); the consumer’s hot updated row is where lock contention shows up.',
    icon: 'database',
  },
  dialer: {
    id: 'dialer',
    name: 'In-house Dialer',
    purpose: 'Live calls · webhooks',
    why: 'Our in-house dialer. It streams live call state to the platform UI over a socket, and produces a webhook to the Kafka topic for every call event — decoupled ingestion that never touches the REST API.',
    icon: 'phone',
  },
  kafka: {
    id: 'kafka',
    name: 'Kafka Topic',
    purpose: 'dialer.webhooks',
    why: 'The dialer produces call webhooks to this topic. A durable, replayable log lets a separate consumer process 9M+ events/day independently of the REST API.',
    icon: 'radio',
  },
  consumer: {
    id: 'consumer',
    name: 'Kafka Consumer',
    purpose: 'Idempotent event processor',
    why: 'My consumer for the dialer webhook topic. Exactly-once via a Postgres unique constraint (idempotent upsert); it writes to Postgres, then fans out to recording-sync, webhook-forwarding, and borrower-type updates.',
    icon: 'cpu',
  },
  downstream: {
    id: 'downstream',
    name: 'Fan-out',
    purpose: 'Recording · forwarding · analytics',
    why: 'Supplementary topics and downstream updates the consumer fans out to after the DB write — all off the request path so reporting never touches hot traffic.',
    icon: 'share',
  },
};

/* ------------------------------------------------------------------ */
/* Metrics                                                             */
/* ------------------------------------------------------------------ */

export type ConsumerStatus = 'idle' | 'consuming' | 'scaling';

export type Metrics = {
  latencyMs: number;
  cacheHitRate: number;
  redisHits: number;
  dbQueries: number;
  eventsConsumed: number;
  consumerLag: number;
  consumer: ConsumerStatus;
};

/** Seeded to look like an already-running production service. */
export const initialMetrics: Metrics = {
  latencyMs: 0,
  cacheHitRate: 87,
  redisHits: 128,
  dbQueries: 19,
  eventsConsumed: 64,
  consumerLag: 0,
  consumer: 'idle',
};

/* ------------------------------------------------------------------ */
/* Steps & scenarios                                                   */
/* ------------------------------------------------------------------ */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
export type Phase = 'request' | 'async';
export type Outcome = 'ok' | 'degraded' | 'error';
export type NodeStatus = 'healthy' | 'down' | 'degraded';
export type BannerLevel = 'info' | 'warn' | 'error';
export type Banner = { level: BannerLevel; text: string };

export type MetricPatch = {
  latencyAdd?: number;
  incRedisHits?: number;
  incDbQueries?: number;
  incEventsConsumed?: number;
  consumerLag?: number;
  consumer?: ConsumerStatus;
  cache?: 'hit' | 'miss';
};

export type Step = {
  node: NodeId;
  phase: Phase;
  level: LogLevel;
  service: string;
  message: string;
  duration: number;
  patch?: MetricPatch;
  status?: Partial<Record<NodeId, NodeStatus>>;
  /** `undefined` = leave banner unchanged; `null` = clear it. */
  banner?: Banner | null;
  outcome?: Outcome;
};

export const SCENARIOS = [
  { id: 'callCreate', label: 'Call Create', entry: 'POST /api/v2/calls' },
  { id: 'callUpdate', label: 'Call Update', entry: 'PATCH /api/v2/calls/88214' },
  { id: 'campaignLock', label: 'Voicebot Campaign', entry: 'POST /api/v2/campaigns' },
  { id: 'availabilityHit', label: 'Agent Availability', entry: 'GET /api/v2/agents/availability' },
  { id: 'cacheMiss', label: 'Cache Miss', entry: 'GET /api/v2/agents/availability' },
  { id: 'webhookEvent', label: 'Webhook Event', entry: 'topic: dialer.webhooks' },
  { id: 'duplicateWebhook', label: 'Duplicate Webhook', entry: 'topic: dialer.webhooks (dup)' },
  { id: 'lockContention', label: 'Lock Contention', entry: 'topic: dialer.webhooks' },
  { id: 'slowQuery', label: 'Slow Query', entry: 'GET /api/v2/agents/availability' },
  { id: 'consumerLag', label: 'Consumer Lag', entry: 'topic: dialer.webhooks (burst)' },
  { id: 'retryDlq', label: 'Retry → DLQ', entry: 'topic: dialer.webhooks' },
  { id: 'redisDown', label: 'Redis Down', entry: 'GET /api/v2/agents/availability' },
] as const;

export type ScenarioId = (typeof SCENARIOS)[number]['id'];

// Step dwell times (ms). JUMP is used for a step that follows a long vertical
// packet jump so the packet has time to arrive before the next step fires.
const T = { THINK: 320, HOP: 440, DB: 640, SLOW: 950, LOCK: 900, RETRY: 480, JUMP: 1000 };

/** REST entry from the platform UI: ui → load balancer → FastAPI. */
function restPrefix(method: string, path: string, body?: string): Step[] {
  return [
    {
      node: 'ui',
      phase: 'request',
      level: 'INFO',
      service: 'ui',
      message: `${method} ${path}${body ? `  ${body}` : ''}`,
      duration: T.JUMP,
    },
    {
      node: 'lb',
      phase: 'request',
      level: 'INFO',
      service: 'lb',
      message: '→ fastapi-7c9d2 (healthy)',
      duration: T.HOP,
      patch: { latencyAdd: 1 },
    },
    {
      node: 'fastapi',
      phase: 'request',
      level: 'INFO',
      service: 'fastapi',
      message: `validate · ${method} ${path}`,
      duration: T.HOP,
      patch: { latencyAdd: 2 },
    },
  ];
}

const BUILDERS: Record<ScenarioId, () => Step[]> = {
  // Pure DB write — no cache.
  callCreate: () => [
    ...restPrefix('POST', '/api/v2/calls', '{call_uuid, campaign_id}'),
    {
      node: 'postgres',
      phase: 'request',
      level: 'INFO',
      service: 'postgres',
      message: 'INSERT INTO calls (call_uuid, campaign_id, status=NEW) → id=88214',
      duration: T.DB,
      patch: { incDbQueries: 1, latencyAdd: 22 },
    },
    {
      node: 'fastapi',
      phase: 'request',
      level: 'INFO',
      service: 'fastapi',
      message: 'inserted id=88214 · serialize · 201 Created',
      duration: T.HOP,
      patch: { latencyAdd: 2 },
    },
    {
      node: 'ui',
      phase: 'request',
      level: 'INFO',
      service: 'ui',
      message: '201 Created · id=88214 · {lat}ms',
      duration: T.JUMP,
      outcome: 'ok',
    },
  ],

  // Pure DB write — no cache.
  callUpdate: () => [
    ...restPrefix('PATCH', '/api/v2/calls/88214', '{disposition, committed_amount}'),
    {
      node: 'postgres',
      phase: 'request',
      level: 'INFO',
      service: 'postgres',
      message: 'UPDATE calls SET disposition=$1, committed_amount=$2 WHERE id=88214',
      duration: T.DB,
      patch: { incDbQueries: 1, latencyAdd: 24 },
    },
    {
      node: 'fastapi',
      phase: 'request',
      level: 'INFO',
      service: 'fastapi',
      message: 'updated · disposition=PTP · committed=₹15,000 · serialize · 200',
      duration: T.HOP,
      patch: { latencyAdd: 2 },
    },
    {
      node: 'ui',
      phase: 'request',
      level: 'INFO',
      service: 'ui',
      message: '200 OK · {lat}ms',
      duration: T.JUMP,
      outcome: 'ok',
    },
  ],

  // FastAPI takes a Redis distributed lock around the campaign-creation workflow.
  campaignLock: () => [
    ...restPrefix('POST', '/api/v2/campaigns', '{type: voicebot}'),
    {
      node: 'redis',
      phase: 'request',
      level: 'INFO',
      service: 'redis',
      message: 'SET lock:campaign:acct-142:voicebot NX EX 30 → acquired',
      duration: T.HOP,
      patch: { latencyAdd: 2 },
      banner: {
        level: 'info',
        text: 'Distributed lock: voicebot campaign creation is serialized per account via a Redis lock. Concurrent requests wait for the lock so two identical campaigns can never be created at once.',
      },
    },
    {
      node: 'fastapi',
      phase: 'request',
      level: 'WARN',
      service: 'fastapi',
      message: 'lock held · concurrent create for acct-142 waits · running workflow',
      duration: T.HOP,
    },
    {
      node: 'postgres',
      phase: 'request',
      level: 'INFO',
      service: 'postgres',
      message: 'INSERT INTO campaigns (…) + workflow rows · 34ms',
      duration: T.DB,
      patch: { incDbQueries: 1, latencyAdd: 38 },
    },
    {
      node: 'fastapi',
      phase: 'request',
      level: 'INFO',
      service: 'fastapi',
      message: 'workflow done → releasing lock',
      duration: T.HOP,
    },
    {
      node: 'redis',
      phase: 'request',
      level: 'INFO',
      service: 'redis',
      message: 'DEL lock:campaign:acct-142:voicebot → released · waiter proceeds',
      duration: T.HOP,
      patch: { latencyAdd: 2 },
    },
    {
      node: 'fastapi',
      phase: 'request',
      level: 'INFO',
      service: 'fastapi',
      message: 'serialize · 201 Created',
      duration: T.HOP,
      patch: { latencyAdd: 2 },
    },
    {
      node: 'ui',
      phase: 'request',
      level: 'INFO',
      service: 'ui',
      message: '201 Created · campaign_id=5521 · {lat}ms',
      duration: T.JUMP,
      outcome: 'ok',
      banner: null,
    },
  ],

  availabilityHit: () => [
    ...restPrefix('GET', '/api/v2/agents/availability', '?campaign=77'),
    {
      node: 'redis',
      phase: 'request',
      level: 'INFO',
      service: 'redis',
      message: 'GET slots:campaign:77 → HIT (0.4ms)',
      duration: T.HOP,
      patch: { incRedisHits: 1, cache: 'hit', latencyAdd: 1 },
    },
    {
      node: 'fastapi',
      phase: 'request',
      level: 'INFO',
      service: 'fastapi',
      message: 'cache hit · serialize (no DB hit)',
      duration: T.HOP,
      patch: { latencyAdd: 2 },
    },
    {
      node: 'ui',
      phase: 'request',
      level: 'INFO',
      service: 'ui',
      message: '200 OK · {lat}ms (p99 target: 500ms)',
      duration: T.JUMP,
      outcome: 'ok',
    },
  ],

  // Miss → read Postgres → write result back to Redis.
  cacheMiss: () => [
    ...restPrefix('GET', '/api/v2/agents/availability', '?campaign=77'),
    {
      node: 'redis',
      phase: 'request',
      level: 'INFO',
      service: 'redis',
      message: 'GET slots:campaign:77 → MISS',
      duration: T.HOP,
      patch: { cache: 'miss', latencyAdd: 1 },
    },
    {
      node: 'fastapi',
      phase: 'request',
      level: 'INFO',
      service: 'fastapi',
      message: 'cache miss → query Postgres',
      duration: T.HOP,
    },
    {
      node: 'postgres',
      phase: 'request',
      level: 'INFO',
      service: 'postgres',
      message: 'SELECT per-campaign slots (composite index) · 18ms',
      duration: T.DB,
      patch: { incDbQueries: 1, latencyAdd: 42 },
    },
    {
      node: 'fastapi',
      phase: 'request',
      level: 'INFO',
      service: 'fastapi',
      message: 'got 42 rows → write to cache',
      duration: T.HOP,
    },
    {
      node: 'redis',
      phase: 'request',
      level: 'INFO',
      service: 'redis',
      message: 'SETEX slots:campaign:77 ttl=60s (cache filled)',
      duration: T.HOP,
      patch: { latencyAdd: 3 },
    },
    {
      node: 'fastapi',
      phase: 'request',
      level: 'INFO',
      service: 'fastapi',
      message: 'serialize · 200 OK',
      duration: T.HOP,
      patch: { latencyAdd: 2 },
    },
    {
      node: 'ui',
      phase: 'request',
      level: 'INFO',
      service: 'ui',
      message: '200 OK · {lat}ms',
      duration: T.JUMP,
      outcome: 'ok',
    },
  ],

  webhookEvent: () => [
    {
      node: 'dialer',
      phase: 'async',
      level: 'INFO',
      service: 'dialer',
      message: 'produce call.webhook → topic dialer.webhooks p3',
      duration: T.JUMP,
      patch: { consumer: 'consuming' },
    },
    {
      node: 'kafka',
      phase: 'async',
      level: 'INFO',
      service: 'kafka',
      message: 'append offset 5,142,880 · partition 3',
      duration: T.HOP,
      patch: { consumerLag: 1 },
    },
    {
      node: 'consumer',
      phase: 'async',
      level: 'INFO',
      service: 'consumer',
      message: 'poll 1 record · call.webhook (call_uuid=a1f…)',
      duration: T.HOP,
    },
    {
      node: 'postgres',
      phase: 'async',
      level: 'INFO',
      service: 'postgres',
      message: 'INSERT processed_events (call_uuid, event_seq) ON CONFLICT DO NOTHING → 1 row',
      duration: T.JUMP,
      patch: { incDbQueries: 1 },
    },
    {
      node: 'postgres',
      phase: 'async',
      level: 'INFO',
      service: 'postgres',
      message: 'UPDATE calls SET recording_url=…, last_event=… WHERE call_uuid=a1f…',
      duration: T.DB,
      patch: { incDbQueries: 1 },
    },
    {
      node: 'consumer',
      phase: 'async',
      level: 'INFO',
      service: 'consumer',
      message: 'call updated · publishing fan-out events',
      duration: T.DB,
    },
    {
      node: 'downstream',
      phase: 'async',
      level: 'INFO',
      service: 'consumer',
      message: 'fan-out → recording-sync · webhook-forward · borrower-type',
      duration: T.JUMP,
      patch: { incEventsConsumed: 1, consumerLag: 0 },
    },
    {
      node: 'consumer',
      phase: 'async',
      level: 'INFO',
      service: 'consumer',
      message: 'commit offset 5,142,880 · exactly-once ✓',
      duration: T.JUMP,
      patch: { consumer: 'idle' },
      outcome: 'ok',
    },
  ],

  duplicateWebhook: () => [
    {
      node: 'dialer',
      phase: 'async',
      level: 'WARN',
      service: 'dialer',
      message: 're-delivered call.webhook (at-least-once)',
      duration: T.JUMP,
      patch: { consumer: 'consuming' },
    },
    {
      node: 'kafka',
      phase: 'async',
      level: 'INFO',
      service: 'kafka',
      message: 'append offset 5,142,881 (duplicate of evt42)',
      duration: T.HOP,
      patch: { consumerLag: 1 },
    },
    {
      node: 'consumer',
      phase: 'async',
      level: 'INFO',
      service: 'consumer',
      message: 'poll 1 record · call.webhook (call_uuid=a1f…)',
      duration: T.HOP,
    },
    {
      node: 'postgres',
      phase: 'async',
      level: 'INFO',
      service: 'postgres',
      message: 'INSERT processed_events … ON CONFLICT DO NOTHING → 0 rows (duplicate)',
      duration: T.JUMP,
      patch: { incDbQueries: 1 },
      banner: {
        level: 'info',
        text: 'Exactly-once via a DB unique constraint: the duplicate INSERT hits ON CONFLICT DO NOTHING → 0 rows, so the update and all side-effects are skipped.',
      },
    },
    {
      node: 'consumer',
      phase: 'async',
      level: 'INFO',
      service: 'consumer',
      message: 'duplicate (0 rows) → skip update · commit offset 5,142,881',
      duration: T.JUMP,
      patch: { consumer: 'idle', consumerLag: 0 },
      outcome: 'ok',
      banner: null,
    },
  ],

  // Row-level lock contention happens on the CONSUMER's Postgres write.
  lockContention: () => [
    {
      node: 'dialer',
      phase: 'async',
      level: 'INFO',
      service: 'dialer',
      message: 'produce call.webhook (cycle-end) → dialer.webhooks p3',
      duration: T.JUMP,
      patch: { consumer: 'consuming' },
    },
    {
      node: 'kafka',
      phase: 'async',
      level: 'INFO',
      service: 'kafka',
      message: 'append offset 5,142,905 · partition 3',
      duration: T.HOP,
      patch: { consumerLag: 1 },
    },
    {
      node: 'consumer',
      phase: 'async',
      level: 'INFO',
      service: 'consumer',
      message: 'poll batch · updating campaign_instances',
      duration: T.HOP,
    },
    {
      node: 'postgres',
      phase: 'async',
      level: 'WARN',
      service: 'postgres',
      message: 'UPDATE campaign_instances … · waiting for row lock (hot row)',
      duration: T.LOCK,
      patch: { incDbQueries: 1 },
      banner: {
        level: 'warn',
        text: 'Row-level lock contention: campaign_instances updates were batched with other writes in the consumer, creating a hot row under concurrency. Fix: decouple that update from the bulk batch — throughput restored same day.',
      },
    },
    {
      node: 'postgres',
      phase: 'async',
      level: 'INFO',
      service: 'postgres',
      message: 'lock acquired · rows updated · 612ms',
      duration: T.THINK,
    },
    {
      node: 'consumer',
      phase: 'async',
      level: 'WARN',
      service: 'consumer',
      message: 'batch processed · 612ms · commit offset',
      duration: T.JUMP,
      patch: { consumer: 'idle', consumerLag: 0 },
      outcome: 'degraded',
    },
  ],

  // Miss → read Postgres (slow) → write result back to Redis.
  slowQuery: () => [
    ...restPrefix('GET', '/api/v2/agents/availability', '?campaign=77'),
    {
      node: 'redis',
      phase: 'request',
      level: 'INFO',
      service: 'redis',
      message: 'GET slots:campaign:77 → MISS',
      duration: T.HOP,
      patch: { cache: 'miss', latencyAdd: 1 },
    },
    {
      node: 'fastapi',
      phase: 'request',
      level: 'INFO',
      service: 'fastapi',
      message: 'cache miss → query Postgres',
      duration: T.HOP,
    },
    {
      node: 'postgres',
      phase: 'request',
      level: 'WARN',
      service: 'postgres',
      message: 'SELECT … seq scan (no usable index) · 840ms',
      duration: T.SLOW,
      patch: { incDbQueries: 1, latencyAdd: 840 },
      banner: {
        level: 'warn',
        text: 'Slow query 840ms — sequential scan. Fix: composite index on (campaign_id, status). Most latency dies at the index before you reach for a cache.',
      },
    },
    {
      node: 'fastapi',
      phase: 'request',
      level: 'INFO',
      service: 'fastapi',
      message: 'got rows → write to cache',
      duration: T.HOP,
      banner: null,
    },
    {
      node: 'redis',
      phase: 'request',
      level: 'INFO',
      service: 'redis',
      message: 'SETEX slots:campaign:77 ttl=60s (protects the next request)',
      duration: T.HOP,
      patch: { latencyAdd: 3 },
    },
    {
      node: 'fastapi',
      phase: 'request',
      level: 'INFO',
      service: 'fastapi',
      message: 'serialize · 200 OK',
      duration: T.HOP,
    },
    {
      node: 'ui',
      phase: 'request',
      level: 'WARN',
      service: 'ui',
      message: '200 OK · {lat}ms  (slow)',
      duration: T.JUMP,
      outcome: 'degraded',
    },
  ],

  consumerLag: () => [
    {
      node: 'dialer',
      phase: 'async',
      level: 'INFO',
      service: 'dialer',
      message: 'burst: 12,480 call webhooks produced',
      duration: T.JUMP,
      patch: { consumer: 'consuming' },
    },
    {
      node: 'kafka',
      phase: 'async',
      level: 'WARN',
      service: 'kafka',
      message: 'consumer lag 12,480 · partition 3',
      duration: T.HOP,
      patch: { consumerLag: 12 },
      banner: {
        level: 'warn',
        text: 'Consumer lag rising — the REST API is unaffected (ingestion is decoupled). KEDA scales the consumer on lag, not CPU.',
      },
    },
    {
      node: 'consumer',
      phase: 'async',
      level: 'INFO',
      service: 'keda',
      message: 'lag > threshold → scaling consumers 3 → 8',
      duration: T.DB,
      patch: { consumer: 'scaling' },
    },
    {
      node: 'consumer',
      phase: 'async',
      level: 'INFO',
      service: 'consumer',
      message: 'draining backlog · exactly-once maintained',
      duration: T.DB,
      patch: { consumerLag: 4, incEventsConsumed: 1 },
    },
    {
      node: 'downstream',
      phase: 'async',
      level: 'INFO',
      service: 'consumer',
      message: 'backlog cleared · lag 0 · offsets committed',
      duration: T.JUMP,
      patch: { consumerLag: 0, consumer: 'idle' },
      banner: null,
      outcome: 'ok',
    },
  ],

  retryDlq: () => [
    {
      node: 'dialer',
      phase: 'async',
      level: 'INFO',
      service: 'dialer',
      message: 'produce call.webhook → topic dialer.webhooks p3',
      duration: T.JUMP,
      patch: { consumer: 'consuming' },
    },
    {
      node: 'kafka',
      phase: 'async',
      level: 'INFO',
      service: 'kafka',
      message: 'append offset 5,142,900 · partition 3',
      duration: T.HOP,
      patch: { consumerLag: 1 },
    },
    {
      node: 'consumer',
      phase: 'async',
      level: 'ERROR',
      service: 'consumer',
      message: 'process failed · downstream 503 (attempt 1/3)',
      duration: T.RETRY,
      banner: {
        level: 'warn',
        text: 'Transient downstream failure — retry with backoff. If it keeps failing, route to the DLQ so one poison message never blocks the partition.',
      },
    },
    {
      node: 'consumer',
      phase: 'async',
      level: 'WARN',
      service: 'consumer',
      message: 'retry 2/3 after 200ms · still failing',
      duration: T.RETRY,
    },
    {
      node: 'downstream',
      phase: 'async',
      level: 'ERROR',
      service: 'consumer',
      message: 'max retries → publish to dialer.webhooks.DLQ',
      duration: T.JUMP,
      patch: { consumerLag: 0, consumer: 'idle' },
      banner: {
        level: 'error',
        text: 'Message moved to the Dead Letter Queue after 3 attempts. The partition keeps flowing; the failed event is quarantined for replay.',
      },
      outcome: 'degraded',
    },
  ],

  // Cache offline → fall back to Postgres (no write-back possible).
  redisDown: () => [
    ...restPrefix('GET', '/api/v2/agents/availability', '?campaign=77'),
    {
      node: 'redis',
      phase: 'request',
      level: 'ERROR',
      service: 'redis',
      message: 'GET slots:campaign:77 → ECONNREFUSED',
      duration: T.HOP,
      patch: { cache: 'miss', latencyAdd: 2 },
      status: { redis: 'down' },
      banner: {
        level: 'warn',
        text: 'Redis unreachable → falling back to PostgreSQL. Latency rises, but the request still succeeds — the cache is an accelerator, never the source of truth.',
      },
    },
    {
      node: 'fastapi',
      phase: 'request',
      level: 'WARN',
      service: 'fastapi',
      message: 'cache bypass → read from source of truth',
      duration: T.HOP,
    },
    {
      node: 'postgres',
      phase: 'request',
      level: 'INFO',
      service: 'postgres',
      message: 'per-campaign slots · 58ms (cold, uncached)',
      duration: T.DB,
      patch: { incDbQueries: 1, latencyAdd: 61 },
    },
    {
      node: 'fastapi',
      phase: 'request',
      level: 'WARN',
      service: 'fastapi',
      message: 'serialize · degraded (cache offline, no write-back)',
      duration: T.HOP,
    },
    {
      node: 'ui',
      phase: 'request',
      level: 'WARN',
      service: 'ui',
      message: '200 OK · {lat}ms',
      duration: T.JUMP,
      outcome: 'degraded',
    },
  ],
};

export type BuiltScenario = {
  id: ScenarioId;
  label: string;
  steps: Step[];
};

/** Build the concrete step list for a scenario, formatting latency tokens. */
export function buildScenario(id: ScenarioId): BuiltScenario {
  const build = BUILDERS[id] ?? BUILDERS.callCreate;
  const raw = build();

  let lat = 0;
  const steps = raw.map((step) => {
    lat += step.patch?.latencyAdd ?? 0;
    return { ...step, message: step.message.replace('{lat}', String(Math.round(lat))) };
  });

  const label = SCENARIOS.find((s) => s.id === id)?.label ?? 'Request';
  return { id, label, steps };
}
