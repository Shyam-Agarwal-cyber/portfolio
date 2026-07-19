/**
 * Request-journey simulation engine.
 *
 * Models the two decoupled ingestion paths of the dialer platform:
 *   1. Synchronous REST — the platform UI sends call-create (ingest a row),
 *      call-update (disposition, committed amount), and voicebot campaign
 *      creation (guarded by a Redis distributed lock) requests to the API.
 *   2. Asynchronous events — the dialer produces call webhooks to Kafka; a
 *      separate consumer processes that topic (9M+ events/day), made idempotent
 *      by a Postgres unique constraint (ON CONFLICT).
 *
 * The UI and the Dialer are distinct upstreams: webhook ingestion bypasses the
 * UI, load balancer, and REST API entirely.
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
    why: 'Handles call-create, call-update, and campaign creation from the UI. Why async: the work is I/O-bound (DB, cache), so one worker holds thousands of concurrent awaits instead of a thread per request.',
    icon: 'server',
  },
  redis: {
    id: 'redis',
    name: 'Redis',
    purpose: 'Cache + distributed locks',
    why: 'Sub-millisecond reads for hot data (agent availability) and distributed locks — e.g. serializing voicebot campaign creation so concurrent requests wait for the lock instead of double-creating. Postgres stays authoritative.',
    icon: 'zap',
  },
  postgres: {
    id: 'postgres',
    name: 'PostgreSQL',
    purpose: 'Call records · source of truth',
    why: 'Stores every call and its updates (disposition, committed amount), written by both the UI (REST) and the consumer (webhooks). Webhook idempotency is enforced here with a unique constraint (ON CONFLICT); the hot updated row is where lock contention shows up.',
    icon: 'database',
  },
  dialer: {
    id: 'dialer',
    name: 'In-house Dialer',
    purpose: 'Live calls · webhooks',
    why: 'Our in-house dialer. It streams live call state to the platform UI over a socket, and produces a webhook to Kafka for every call event — decoupled ingestion that never touches the REST API.',
    icon: 'phone',
  },
  kafka: {
    id: 'kafka',
    name: 'Kafka',
    purpose: 'Dialer webhook topic',
    why: 'The dialer produces call webhooks here. A durable, replayable log lets a separate consumer process 9M+ events/day independently of the REST API.',
    icon: 'radio',
  },
  consumer: {
    id: 'consumer',
    name: 'Webhook Consumer',
    purpose: 'Idempotent Kafka consumer',
    why: 'My consumer for the dialer webhook topic. Exactly-once via a Postgres unique constraint (idempotent upsert); fans out to recording-sync, webhook-forwarding, and borrower-type updates.',
    icon: 'cpu',
  },
  downstream: {
    id: 'downstream',
    name: 'Fan-out',
    purpose: 'Recording · forwarding · analytics',
    why: 'Supplementary topics and downstream updates fed from the webhook stream — all off the request path so reporting never touches hot traffic.',
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
  { id: 'callCreate', label: 'Call Create' },
  { id: 'callUpdate', label: 'Call Update' },
  { id: 'campaignLock', label: 'Voicebot Campaign' },
  { id: 'availabilityHit', label: 'Agent Availability' },
  { id: 'cacheMiss', label: 'Cache Miss' },
  { id: 'webhookEvent', label: 'Webhook Event' },
  { id: 'duplicateWebhook', label: 'Duplicate Webhook' },
  { id: 'lockContention', label: 'Lock Contention' },
  { id: 'slowQuery', label: 'Slow Query' },
  { id: 'consumerLag', label: 'Consumer Lag' },
  { id: 'retryDlq', label: 'Retry → DLQ' },
  { id: 'redisDown', label: 'Redis Down' },
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
  callCreate: () => [
    ...restPrefix('POST', '/api/v2/calls', '{call_uuid, campaign_id}'),
    {
      node: 'postgres',
      phase: 'request',
      level: 'INFO',
      service: 'postgres',
      message: 'INSERT INTO calls (call_uuid, campaign_id, status=NEW)',
      duration: T.DB,
      patch: { incDbQueries: 1, latencyAdd: 22 },
    },
    {
      node: 'postgres',
      phase: 'request',
      level: 'INFO',
      service: 'postgres',
      message: '1 row inserted · id=88214 · 6ms',
      duration: T.THINK,
    },
    {
      node: 'redis',
      phase: 'request',
      level: 'INFO',
      service: 'redis',
      message: 'SETEX call:88214 ttl=300s',
      duration: T.HOP,
      patch: { latencyAdd: 3 },
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
      node: 'postgres',
      phase: 'request',
      level: 'INFO',
      service: 'postgres',
      message: '1 row updated · disposition=PTP · committed=₹15,000 · 7ms',
      duration: T.THINK,
    },
    {
      node: 'redis',
      phase: 'request',
      level: 'INFO',
      service: 'redis',
      message: 'DEL call:88214 (invalidate stale cache)',
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
      node: 'redis',
      phase: 'request',
      level: 'WARN',
      service: 'redis',
      message: 'concurrent create for acct-142 → blocked, awaiting lock',
      duration: T.THINK,
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
      node: 'redis',
      phase: 'request',
      level: 'INFO',
      service: 'redis',
      message: 'DEL lock:campaign:acct-142:voicebot → released · waiter proceeds',
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
      message: 'serialize slot map (cached, no DB hit)',
      duration: T.HOP,
      patch: { latencyAdd: 2 },
    },
    {
      node: 'ui',
      phase: 'request',
      level: 'INFO',
      service: 'ui',
      message: '200 OK · {lat}ms (p99 target: 500ms)',
      duration: T.DB,
      outcome: 'ok',
    },
  ],

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
      node: 'postgres',
      phase: 'request',
      level: 'INFO',
      service: 'postgres',
      message: 'SELECT per-campaign slots (composite index)',
      duration: T.DB,
      patch: { incDbQueries: 1, latencyAdd: 42 },
    },
    {
      node: 'redis',
      phase: 'request',
      level: 'INFO',
      service: 'redis',
      message: 'SETEX slots:campaign:77 ttl=60s (warm cache)',
      duration: T.HOP,
      patch: { latencyAdd: 3 },
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

  lockContention: () => [
    ...restPrefix('PATCH', '/api/v2/calls/88214', '{disposition, committed_amount}'),
    {
      node: 'postgres',
      phase: 'request',
      level: 'WARN',
      service: 'postgres',
      message: 'UPDATE calls … WHERE id=88214 · waiting for row lock',
      duration: T.LOCK,
      patch: { incDbQueries: 1, latencyAdd: 612 },
      banner: {
        level: 'warn',
        text: 'Row-level lock contention: campaign_instances updates were batched with other writes, creating a hot row under concurrency. Fix: decouple that update from the bulk batch.',
      },
    },
    {
      node: 'postgres',
      phase: 'request',
      level: 'INFO',
      service: 'postgres',
      message: 'lock acquired · 1 row updated · 612ms',
      duration: T.THINK,
    },
    {
      node: 'ui',
      phase: 'request',
      level: 'WARN',
      service: 'ui',
      message: '200 OK · {lat}ms  (degraded: lock wait)',
      duration: T.JUMP,
      outcome: 'degraded',
      banner: null,
    },
  ],

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
      node: 'redis',
      phase: 'request',
      level: 'INFO',
      service: 'redis',
      message: 'SETEX ttl=60s (protects the next request)',
      duration: T.HOP,
      patch: { latencyAdd: 3 },
    },
    {
      node: 'ui',
      phase: 'request',
      level: 'WARN',
      service: 'ui',
      message: '200 OK · {lat}ms  (slow)',
      duration: T.JUMP,
      outcome: 'degraded',
      banner: null,
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
      duration: T.HOP,
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
      duration: T.DB,
      patch: { consumerLag: 0, consumer: 'idle' },
      banner: {
        level: 'error',
        text: 'Message moved to the Dead Letter Queue after 3 attempts. The partition keeps flowing; the failed event is quarantined for replay.',
      },
      outcome: 'degraded',
    },
  ],

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
      node: 'postgres',
      phase: 'request',
      level: 'WARN',
      service: 'fastapi',
      message: 'cache bypass · reading from source of truth',
      duration: T.DB,
      patch: { incDbQueries: 1, latencyAdd: 61 },
    },
    {
      node: 'postgres',
      phase: 'request',
      level: 'INFO',
      service: 'postgres',
      message: 'per-campaign slots · 58ms (cold, uncached)',
      duration: T.THINK,
    },
    {
      node: 'ui',
      phase: 'request',
      level: 'WARN',
      service: 'ui',
      message: '200 OK · {lat}ms  (degraded: cache offline)',
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
