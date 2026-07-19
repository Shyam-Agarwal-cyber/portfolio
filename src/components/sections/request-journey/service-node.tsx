'use client';

import { forwardRef, useId } from 'react';
import {
  Cpu,
  Database,
  Monitor,
  PhoneCall,
  Radio,
  Server,
  Share2,
  Split,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { IconKey, NodeStatus, Phase, ServiceNodeMeta } from '@/lib/simulation';
import { cn } from '@/lib/utils';

const ICONS: Record<IconKey, LucideIcon> = {
  monitor: Monitor,
  split: Split,
  server: Server,
  zap: Zap,
  database: Database,
  phone: PhoneCall,
  radio: Radio,
  cpu: Cpu,
  share: Share2,
};

const STATUS_DOT: Record<NodeStatus, string> = {
  healthy: 'bg-emerald-400',
  down: 'bg-red-500',
  degraded: 'bg-amber-400',
};

type ServiceNodeProps = {
  node: ServiceNodeMeta;
  status: NodeStatus;
  active: boolean;
  phase: Phase;
};

export const ServiceNode = forwardRef<HTMLDivElement, ServiceNodeProps>(function ServiceNode(
  { node, status, active, phase },
  ref,
) {
  const Icon = ICONS[node.icon];
  const tooltipId = useId();
  const asyncActive = active && phase === 'async';

  return (
    <div
      ref={ref}
      tabIndex={0}
      aria-label={`${node.name}: ${node.purpose}`}
      aria-describedby={tooltipId}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl border bg-surface px-3.5 py-3 outline-none transition-all duration-300',
        active
          ? asyncActive
            ? 'border-accent/40 ring-1 ring-accent/30'
            : 'border-accent bg-accent/[0.06] ring-1 ring-accent/40'
          : 'border-border hover:border-border-strong',
        status === 'down' && 'border-red-500/50',
        status === 'degraded' && 'border-amber-400/50',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors duration-300',
          active
            ? 'border-accent/50 bg-accent/10 text-accent'
            : 'border-border bg-bg text-fg-secondary',
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-fg">{node.name}</span>
          <span
            className={cn(
              'h-1.5 w-1.5 shrink-0 rounded-full transition-colors',
              STATUS_DOT[status],
              status === 'healthy' && active && !asyncActive && 'animate-accent-pulse',
            )}
            aria-hidden
          />
        </div>
        <span className="block truncate font-mono text-[11px] text-fg-muted">{node.purpose}</span>
      </div>

      {/* Educational tooltip — shown on hover and keyboard focus */}
      <div
        role="tooltip"
        id={tooltipId}
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 translate-y-1 rounded-lg border border-border-strong bg-surface-raised p-3 text-xs leading-relaxed text-fg-secondary opacity-0 shadow-xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
      >
        <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-accent">
          {node.name}
        </span>
        {node.why}
      </div>
    </div>
  );
});
