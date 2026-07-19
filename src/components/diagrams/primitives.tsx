import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Shared SVG frame for every architecture diagram. */
export function DiagramFrame({
  children,
  viewBox = '0 0 360 180',
  label,
  className,
}: {
  children: ReactNode;
  viewBox?: string;
  label: string;
  className?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      role="img"
      aria-label={label}
      className={cn('h-full w-full', className)}
      preserveAspectRatio="xMidYMid meet"
    >
      {children}
    </svg>
  );
}

type NodeProps = {
  x: number;
  y: number;
  w?: number;
  h?: number;
  title: string;
  sub?: string;
  accent?: boolean;
};

/** A system node: hairline rounded rect with a label. */
export function Node({ x, y, w = 78, h = 40, title, sub, accent = false }: NodeProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill={accent ? 'hsl(172 66% 50% / 0.10)' : 'hsl(240 5% 9%)'}
        stroke={accent ? 'hsl(172 66% 50% / 0.55)' : 'hsl(240 5% 22%)'}
        strokeWidth={1}
      />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 3 : y + h / 2 + 3.5}
        textAnchor="middle"
        fontSize="9"
        fontFamily="var(--font-mono), monospace"
        fontWeight="600"
        fill={accent ? 'hsl(172 66% 60%)' : 'hsl(240 9% 93%)'}
      >
        {title}
      </text>
      {sub ? (
        <text
          x={x + w / 2}
          y={y + h / 2 + 9}
          textAnchor="middle"
          fontSize="6.5"
          fontFamily="var(--font-mono), monospace"
          fill="hsl(240 5% 45%)"
        >
          {sub}
        </text>
      ) : null}
    </g>
  );
}

type EdgeProps = {
  d: string;
  animated?: boolean;
  dashed?: boolean;
};

/** A connection between nodes. Optional animated accent flow overlay. */
export function Edge({ d, animated = false, dashed = false }: EdgeProps) {
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="hsl(240 5% 22%)"
        strokeWidth={1.25}
        strokeDasharray={dashed ? '3 3' : undefined}
        markerEnd="url(#arrow)"
      />
      {animated ? (
        <path
          d={d}
          fill="none"
          stroke="hsl(172 66% 50%)"
          strokeWidth={1.5}
          strokeDasharray="4 12"
          className="animate-flow-dash"
          opacity={0.9}
        />
      ) : null}
    </g>
  );
}

/** Arrowhead marker definition — include once per diagram. */
export function ArrowDefs() {
  return (
    <defs>
      <marker
        id="arrow"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="5"
        markerHeight="5"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(240 5% 35%)" />
      </marker>
    </defs>
  );
}
