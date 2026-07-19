'use client';

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
import type { IconKey, NodeId, NodeStatus, Phase, ServiceNodeMeta } from '@/lib/simulation';
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
  onHover: (id: NodeId | null) => void;
};

/** Compact node used inside the architecture graph. */
export function ServiceNode({ node, status, active, phase, onHover }: ServiceNodeProps) {
  const Icon = ICONS[node.icon];
  const asyncActive = active && phase === 'async';

  return (
    <button
      type="button"
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
      aria-label={`${node.name}: ${node.why}`}
      className={cn(
        'group flex w-[92px] flex-col items-center gap-1.5 rounded-xl border bg-surface px-2 py-2.5 text-center outline-none transition-all duration-300 sm:w-[104px]',
        active
          ? asyncActive
            ? 'border-accent/50 ring-1 ring-accent/30'
            : 'border-accent bg-accent/[0.07] ring-1 ring-accent/40'
          : 'border-border hover:border-border-strong',
        status === 'down' && 'border-red-500/60',
        status === 'degraded' && 'border-amber-400/60',
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors duration-300',
          active
            ? 'border-accent/50 bg-accent/10 text-accent'
            : 'border-border bg-bg text-fg-secondary',
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold leading-tight text-fg">{node.name}</span>
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full transition-colors',
            STATUS_DOT[status],
            status === 'healthy' && active && !asyncActive && 'animate-accent-pulse',
          )}
          aria-hidden
        />
      </span>
    </button>
  );
}
