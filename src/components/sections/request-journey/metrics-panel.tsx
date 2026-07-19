'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { ConsumerStatus, Metrics } from '@/lib/simulation';
import { cn } from '@/lib/utils';

type MetricsPanelProps = {
  metrics: Metrics;
  running: boolean;
};

const CONSUMER_STYLES: Record<ConsumerStatus, string> = {
  idle: 'text-fg-secondary',
  consuming: 'text-amber-400',
  scaling: 'text-accent',
};

function latencyTone(ms: number): string {
  if (ms === 0) return 'text-fg-muted';
  if (ms >= 1000) return 'text-red-400';
  if (ms >= 500) return 'text-amber-400';
  return 'text-accent';
}

/** A single animated metric readout. Numbers re-key so they crossfade on change. */
function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg/60 px-3 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">{label}</div>
      <div className="tabular mt-1 h-6 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={value}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn('font-mono text-lg font-semibold', tone ?? 'text-fg')}
          >
            {value}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function MetricsPanel({ metrics, running }: MetricsPanelProps) {
  return (
    <div className="card-hairline p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-fg-secondary">
          Live Metrics
        </h3>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-fg-muted">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              running ? 'animate-accent-pulse bg-accent' : 'bg-emerald-400',
            )}
          />
          {running ? 'streaming' : 'idle'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Stat
          label="Latency"
          value={metrics.latencyMs === 0 ? '—' : `${metrics.latencyMs}ms`}
          tone={latencyTone(metrics.latencyMs)}
        />
        <Stat label="Cache Hit Rate" value={`${metrics.cacheHitRate}%`} tone="text-accent" />
        <Stat label="Redis Hits" value={metrics.redisHits.toLocaleString()} />
        <Stat label="DB Queries" value={metrics.dbQueries.toLocaleString()} />
        <Stat label="Events Consumed" value={metrics.eventsConsumed.toLocaleString()} />
        <Stat
          label="Consumer Lag"
          value={metrics.consumerLag > 0 ? `${metrics.consumerLag}k` : '0'}
          tone={metrics.consumerLag > 0 ? 'text-amber-400' : 'text-fg'}
        />
        <div className="col-span-2 rounded-lg border border-border bg-bg/60 px-3 py-2.5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
            Consumer Status
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                metrics.consumer === 'idle' && 'bg-emerald-400',
                metrics.consumer === 'consuming' && 'bg-amber-400',
                metrics.consumer === 'scaling' && 'animate-accent-pulse bg-accent',
              )}
            />
            <span
              className={cn(
                'font-mono text-sm font-semibold capitalize',
                CONSUMER_STYLES[metrics.consumer],
              )}
            >
              {metrics.consumer}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
