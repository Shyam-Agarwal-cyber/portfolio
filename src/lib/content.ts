/**
 * Content model for the portfolio.
 * Everything the visitor reads lives here so sections stay presentational.
 */

/* ------------------------------------------------------------------ */
/* Hero metrics                                                        */
/* ------------------------------------------------------------------ */

export type HeroMetric = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  note: string;
};

export const heroMetrics: readonly HeroMetric[] = [
  { value: 9, suffix: 'M+', label: 'Kafka events / day', note: 'exactly-once, idempotent' },
  { value: 87, suffix: '%', label: 'p99 latency reduced', note: '4s → 500ms' },
  {
    value: 2.66,
    suffix: 'M',
    decimals: 2,
    label: 'leads automated / day',
    note: 'across 142 companies',
  },
  {
    value: 22.8,
    prefix: '₹',
    suffix: 'L',
    decimals: 1,
    label: 'infra cost saved',
    note: 'first run alone',
  },
] as const;

/* ------------------------------------------------------------------ */
/* Experience timeline                                                 */
/* ------------------------------------------------------------------ */

export type ExperienceEntry = {
  role: string;
  company: string;
  location: string;
  period: string;
  current?: boolean;
  summary: string;
  focus: readonly string[];
};

export const experience: readonly ExperienceEntry[] = [
  {
    role: 'Software Engineer',
    company: 'Credgenics',
    location: 'Noida, India',
    period: 'Jul 2024 — Present',
    current: true,
    summary:
      'Own the event-streaming backbone of the dialer platform — the Kafka consumers, data model, and autoscaling that keep the service reliable while it scales from 1M to 9M calls a day.',
    focus: [
      'Event streaming',
      'Distributed systems',
      'Performance',
      'Feature ownership',
      'Production RCA',
    ],
  },
  {
    role: 'Software Engineer Intern',
    company: 'Credgenics',
    location: 'Noida, India',
    period: 'Jan 2024 — Jun 2024',
    summary:
      'Shipped full-stack modules for the dialer platform — React + MUI on the front, FastAPI endpoints and PostgreSQL queries on the back — across the calling and campaign-management surfaces.',
    focus: ['Full-stack', 'REST APIs', 'React', 'PostgreSQL'],
  },
  {
    role: 'B.Tech, Computer Science',
    company: 'IIIT Nagpur',
    location: 'Nagpur, India',
    period: 'Dec 2020 — Jun 2024',
    summary:
      'Computer Science, CGPA 8.07. Active competitive programmer on Codeforces and CodeChef.',
    focus: ['Algorithms', 'Systems', 'Competitive programming'],
  },
] as const;

/* ------------------------------------------------------------------ */
/* Selected engineering achievements (Problem / Approach / Decision /  */
/* Impact)                                                             */
/* ------------------------------------------------------------------ */

export type Achievement = {
  id: string;
  title: string;
  metric: string;
  problem: string;
  approach: string;
  decision: string;
  impact: string;
  stack: readonly string[];
};

export const achievements: readonly Achievement[] = [
  {
    id: 'latency',
    title: 'Cut p99 latency 8× on a hot endpoint',
    metric: '4s → 500ms',
    problem:
      'The agent-availability endpoint sat on the critical path of every calling decision, yet its p99 hit 4s under load — recomputing per-campaign user slots on every request.',
    approach:
      'Profiled with Elastic APM to isolate the cost, cached per-campaign slot state in Redis, tuned a composite PostgreSQL index for the residual query, and batched reads.',
    decision:
      'Cached the derived slot map — not raw rows — so invalidation stayed cheap and correct, and kept Postgres as the source of truth rather than trusting the cache blindly.',
    impact:
      'p99 dropped from 4s to 500ms, validated pre/post release with APM. No correctness regressions.',
    stack: ['Redis', 'PostgreSQL', 'Elastic APM'],
  },
  {
    id: 'auto-churn',
    title: 'Auto Churn — event-driven lead re-engagement',
    metric: '85% adoption',
    problem:
      'Leads that finished a calling cycle went cold. Re-engaging them meant manual re-enqueueing, so most were never called again.',
    approach:
      'Designed an event-driven loop: the dialer emits a lead-cycle-end event, a consumer applies campaign-validation rules to find eligible leads and re-enqueues them for the next cycle across predictive and voicebot campaigns.',
    decision:
      'Modeled it as an append-only event flow rather than a cron sweep — decoupled from the dialer, naturally retryable, and scales with the existing Kafka backbone.',
    impact:
      'Adopted by 794/934 campaigns across 142 companies, automating 2.66M leads daily — the most-adopted optional feature on the platform. Architected end-to-end independently.',
    stack: ['Kafka', 'Python', 'FastAPI', 'PostgreSQL'],
  },
  {
    id: 'kafka',
    title: 'Kafka event-streaming backbone',
    metric: '9M+ events/day',
    problem:
      'Every call generates webhooks that must be processed exactly once and fanned out to recording sync, webhook forwarding, and borrower-type updates — without double-processing.',
    approach:
      'Own all consumers across the dialer service. The primary call-webhook consumer enforces exactly-once semantics via application-level idempotency and fans out to supplementary topics.',
    decision:
      'Chose application-level idempotency keys over broker transactions — simpler operationally, resilient to redelivery, and portable across the Kafka/Redpanda boundary.',
    impact:
      '9M+ events/day processed reliably. Consumer lag monitored on Grafana with KEDA autoscaling on AWS EKS.',
    stack: ['Kafka', 'Redpanda', 'KEDA', 'AWS EKS', 'Grafana'],
  },
  {
    id: 'lock-contention',
    title: 'Diagnosed a production throughput regression',
    metric: 'same-day fix',
    problem:
      'Throughput regressed in production under concurrent load. Symptoms pointed everywhere; the cause was not obvious.',
    approach:
      'Traced it to PostgreSQL row-level lock contention: campaign-instance updates were batched together with other table writes, creating hot-row contention when concurrency rose.',
    decision:
      'Decoupled the campaign-instance update from the bulk batch so it no longer serialized behind unrelated writes — a targeted fix instead of a broad rewrite.',
    impact:
      'Restored throughput the same day and authored an RCA shared with the DBA and engineering team.',
    stack: ['PostgreSQL', 'Lock analysis', 'RCA'],
  },
  {
    id: 'did-reclaim',
    title: 'Automated telecom-number reclamation',
    metric: '₹22.8L saved',
    problem:
      'The platform had accumulated 7,600+ idle DIDs (telecom numbers) — paid for but unused — while new campaigns kept procuring more.',
    approach:
      'Built an Airflow DAG that detects inactive numbers and returns them to the allocation pool automatically, before any new procurement.',
    decision:
      'Made reclamation a scheduled, idempotent pipeline rather than a one-off script — so savings compound every month instead of decaying.',
    impact:
      '₹22.8L in procurement saved on the first run; 800+ DIDs/month reclaimed ongoing (₹2.4L/month).',
    stack: ['Airflow', 'Python', 'PostgreSQL'],
  },
  {
    id: 'reporting-split',
    title: 'Decomposed the monolith into a reporting service',
    metric: '3–30 replicas',
    problem:
      'Heavy report exports shared the dialer’s runtime, causing 503s on the export path and coupling two workloads with very different scaling curves.',
    approach:
      'Proposed and led extraction of a dedicated reporting service. Authored the design doc, secured EM sign-off, and configured KEDA HTTP autoscaling (3–30 replicas) on AWS EKS.',
    decision:
      'Split along the workload boundary, not the code boundary — so calling and reporting scale independently on their own signals.',
    impact:
      'Eliminated 503 errors on the export consumer and unlocked independent scaling of both workloads.',
    stack: ['AWS EKS', 'KEDA', 'FastAPI', 'System design'],
  },
] as const;

/* ------------------------------------------------------------------ */
/* Projects / systems (architecture cards)                            */
/* ------------------------------------------------------------------ */

export type SystemProject = {
  id: string;
  name: string;
  tagline: string;
  diagram: 'pipeline' | 'cache' | 'loop' | 'api';
  stack: readonly string[];
  scale: string;
  performance: string;
  challenge: string;
};

export const projects: readonly SystemProject[] = [
  {
    id: 'event-pipeline',
    name: 'Call-Webhook Event Pipeline',
    tagline: 'The exactly-once ingestion path for every call event on the platform.',
    diagram: 'pipeline',
    stack: ['Kafka', 'Python', 'FastAPI', 'KEDA', 'AWS EKS'],
    scale: '9M+ events/day',
    performance: 'Exactly-once via idempotency keys',
    challenge: 'Fan-out to 3 downstream topics without double-processing under redelivery.',
  },
  {
    id: 'availability-cache',
    name: 'Agent-Availability Cache',
    tagline: 'Redis-backed slot resolution on the critical path of every calling decision.',
    diagram: 'cache',
    stack: ['Redis', 'PostgreSQL', 'FastAPI', 'Elastic APM'],
    scale: 'Every calling decision',
    performance: 'p99 4s → 500ms',
    challenge: 'Cache derived state cheaply while keeping Postgres authoritative.',
  },
  {
    id: 'churn-loop',
    name: 'Auto-Churn Re-engagement Loop',
    tagline: 'Event-driven workflow that recycles eligible leads into new calling cycles.',
    diagram: 'loop',
    stack: ['Kafka', 'Python', 'PostgreSQL'],
    scale: '2.66M leads/day · 142 cos',
    performance: '85% campaign adoption',
    challenge: 'Model re-engagement as a retryable event flow, not a fragile cron.',
  },
  {
    id: 'api-consolidation',
    name: 'Unified Dialer API',
    tagline: 'Consolidation of a fragmented vendor surface into a clean in-house contract.',
    diagram: 'api',
    stack: ['FastAPI', 'PostgreSQL', 'REST', 'Docker'],
    scale: '1M → 9M calls/day',
    performance: '6 APIs → 2 (−67% surface)',
    challenge: '30-day parallel production window to migrate with zero downtime.',
  },
] as const;

/* ------------------------------------------------------------------ */
/* Engineering decisions ("Why X?")                                    */
/* ------------------------------------------------------------------ */

export type Decision = {
  question: string;
  answer: string;
  tradeoff: string;
};

export const decisions: readonly Decision[] = [
  {
    question: 'Why Kafka over a task queue?',
    answer:
      'Call events need durable, replayable, ordered-per-key delivery with multiple independent consumers. A log gives me fan-out and replay for free; a task queue would couple producers to a single consumer’s pace.',
    tradeoff:
      'Rejected: Celery/RabbitMQ — simpler, but no replay and awkward multi-consumer fan-out at this volume.',
  },
  {
    question: 'Why application-level idempotency instead of Kafka transactions?',
    answer:
      'Exactly-once via idempotency keys is operationally simpler, survives redelivery, and stays portable across the Kafka↔Redpanda boundary. The consumer stays correct even when the broker retries.',
    tradeoff:
      'Rejected: broker transactions — stronger guarantee on paper, heavier to operate and reason about.',
  },
  {
    question: 'Why Redis here — and when NOT to cache?',
    answer:
      'I cache derived, read-heavy state with a clear invalidation trigger (per-campaign slot maps). I don’t cache when writes dominate, when staleness is unsafe, or when the query is already index-fast — a cache there just adds a second source of truth to keep honest.',
    tradeoff: 'Postgres stays authoritative; Redis is an accelerator, never the record of truth.',
  },
  {
    question: 'Why async / asyncio for the backend?',
    answer:
      'The workload is I/O-bound — Postgres, Redis, Kafka, downstream HTTP. Async lets one worker hold thousands of in-flight awaits instead of blocking a thread per call, which is what makes 9M events/day affordable.',
    tradeoff:
      'CPU-bound work is offloaded — async is a concurrency model, not a speed-up for compute.',
  },
  {
    question: 'Why split the monolith by workload, not by module?',
    answer:
      'Calling and reporting have opposite scaling curves. Splitting along the workload boundary let each scale on its own signal via KEDA and killed the 503s where export starved the dialer.',
    tradeoff:
      'More services to operate — justified only because the scaling curves genuinely diverged.',
  },
  {
    question: 'Why a composite index, not just more caching?',
    answer:
      'Before reaching for Redis I make the database earn its keep. A well-ordered composite index on the residual query removed most of the latency; caching handled only what indexing couldn’t.',
    tradeoff: 'Indexes cost write throughput — worth it when the read pattern is stable and hot.',
  },
] as const;

/* ------------------------------------------------------------------ */
/* Skills                                                              */
/* ------------------------------------------------------------------ */

export type SkillGroup = {
  category: string;
  items: readonly { name: string; note: string }[];
};

export const skillGroups: readonly SkillGroup[] = [
  {
    category: 'Backend',
    items: [
      { name: 'Python', note: 'primary language' },
      { name: 'FastAPI', note: 'async REST services' },
      { name: 'asyncio', note: 'high-concurrency I/O' },
      { name: 'Quartz', note: 'job scheduling' },
      { name: 'REST API design', note: 'contracts & versioning' },
    ],
  },
  {
    category: 'Databases',
    items: [
      { name: 'PostgreSQL', note: 'indexing, lock analysis, query tuning' },
      { name: 'Redis', note: 'caching & derived state' },
      { name: 'SQL', note: 'query optimization' },
    ],
  },
  {
    category: 'Messaging & Streaming',
    items: [
      { name: 'Apache Kafka', note: 'consumers at 9M+/day' },
      { name: 'Redpanda', note: 'Kafka-compatible broker' },
      { name: 'Airflow', note: 'orchestrated pipelines' },
    ],
  },
  {
    category: 'Infrastructure & DevOps',
    items: [
      { name: 'AWS EKS', note: 'production Kubernetes' },
      { name: 'Kubernetes', note: 'workload orchestration' },
      { name: 'KEDA', note: 'event-driven autoscaling' },
      { name: 'Docker', note: 'containerization' },
      { name: 'Jenkins', note: 'CI pipelines' },
    ],
  },
  {
    category: 'Observability',
    items: [
      { name: 'Elastic APM', note: 'latency profiling' },
      { name: 'Grafana', note: 'consumer-lag dashboards' },
    ],
  },
  {
    category: 'Frontend',
    items: [
      { name: 'React', note: 'platform UI modules' },
      { name: 'Redux', note: 'state management' },
      { name: 'MUI', note: 'component system' },
    ],
  },
] as const;

/* ------------------------------------------------------------------ */
/* Engineering principles                                              */
/* ------------------------------------------------------------------ */

export type Principle = { title: string; body: string };

export const principles: readonly Principle[] = [
  {
    title: 'How I design APIs',
    body: 'Start from the contract, not the code. Few endpoints, consistent shapes, explicit versioning, and a deprecation path — I consolidated 6 fragmented APIs into 2 by designing the contract first and running a parallel production window.',
  },
  {
    title: 'How I optimize databases',
    body: 'Measure before touching anything. Read the query plan, fix the index, understand the lock behavior under concurrency — then, and only then, consider a cache. Most latency dies at the index.',
  },
  {
    title: 'My approach to scalability',
    body: 'Scale on the real signal. Split workloads that have different scaling curves, autoscale on queue depth or lag (KEDA) rather than CPU guesses, and design flows to be replayable and idempotent so scaling out never means processing twice.',
  },
  {
    title: 'My debugging philosophy',
    body: 'Reproduce, isolate, prove. A production regression is a hypothesis to be tested with data (APM, lock stats, lag), not a guess to be patched. Fix the smallest thing that restores correctness — then write the RCA so it never recurs.',
  },
];

/* ------------------------------------------------------------------ */
/* System design interests                                            */
/* ------------------------------------------------------------------ */

export const systemDesignInterests: readonly string[] = [
  'Exactly-once & idempotent consumers',
  'Backpressure & consumer-lag-driven autoscaling',
  'Event-driven architecture & the log as source of truth',
  'Cache invalidation & derived-state consistency',
  'PostgreSQL concurrency & lock contention',
  'Multi-tenant data isolation at scale',
  'Zero-downtime migrations & parallel run windows',
  'Observability-first service design',
] as const;

/* ------------------------------------------------------------------ */
/* Achievements / competitive programming                             */
/* ------------------------------------------------------------------ */

export const competitive: readonly { platform: string; detail: string }[] = [
  { platform: 'Codeforces', detail: 'Rank 2059 — Round 908 Div. 2 (10k+ participants)' },
  {
    platform: 'CodeChef',
    detail: 'Rank 69 (Starters 45 Div. 2) · Rank 33 (Starters 41 Div. 3), both rated',
  },
] as const;
