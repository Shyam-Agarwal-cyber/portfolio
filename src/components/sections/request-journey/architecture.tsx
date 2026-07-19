'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { NODE_IDS, NODES, type NodeId, type NodeStatus, type Phase } from '@/lib/simulation';
import { cn } from '@/lib/utils';
import { ServiceNode } from './service-node';

type ArchitectureProps = {
  statuses: Record<NodeId, NodeStatus>;
  activeNode: NodeId | null;
  phase: Phase;
  running: boolean;
  /** Dwell of the current step (ms); travel is bounded by it so the packet always arrives. */
  stepDuration: number;
};

/** Node positions as percentages of the graph canvas. Two mirrored ingress
 *  lanes (UI top, Dialer bottom) both connect to the shared data layer —
 *  Redis + PostgreSQL — centered on the vertical axis, with fan-out on the right. */
const POS: Record<NodeId, { x: number; y: number }> = {
  ui: { x: 10, y: 20 },
  lb: { x: 30, y: 20 },
  fastapi: { x: 50, y: 20 },
  dialer: { x: 10, y: 80 },
  kafka: { x: 30, y: 80 },
  consumer: { x: 50, y: 80 },
  redis: { x: 72, y: 34 },
  postgres: { x: 72, y: 66 },
  downstream: { x: 91, y: 50 },
};

const EDGES: ReadonlyArray<readonly [NodeId, NodeId]> = [
  ['ui', 'lb'],
  ['lb', 'fastapi'],
  ['dialer', 'kafka'],
  ['kafka', 'consumer'],
  ['fastapi', 'redis'],
  ['fastapi', 'postgres'],
  ['consumer', 'redis'],
  ['consumer', 'postgres'],
  ['postgres', 'downstream'],
];

type Point = { x: number; y: number };

/** Pull an endpoint back toward its source by `pad` px so it clears the card. */
function trim(from: Point, to: Point, pad: number): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: to.x - (dx / len) * pad, y: to.y - (dy / len) * pad };
}

export function Architecture({
  statuses,
  activeNode,
  phase,
  running,
  stepDuration,
}: ArchitectureProps) {
  const graphRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hovered, setHovered] = useState<NodeId | null>(null);
  const reduce = useReducedMotion();

  const measure = useCallback(() => {
    const el = graphRef.current;
    if (el) setSize({ w: el.clientWidth, h: el.clientHeight });
  }, []);

  useLayoutEffect(() => {
    measure();
    const el = graphRef.current;
    const ro = new ResizeObserver(measure);
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const center = useCallback(
    (id: NodeId): Point => ({ x: (POS[id].x / 100) * size.w, y: (POS[id].y / 100) * size.h }),
    [size],
  );

  const measured = size.w > 0;
  const isAsync = phase === 'async';

  // Track the previous active node to highlight the traversed edge and to
  // bound travel time by distance.
  const prevRef = useRef<NodeId | null>(null);
  const prev = prevRef.current;
  useEffect(() => {
    prevRef.current = activeNode;
  }, [activeNode]);

  const packet = activeNode ? center(activeNode) : center('ui');
  let travelDur = 0.3;
  if (activeNode && prev && prev !== activeNode) {
    const a = center(prev);
    const dist = Math.hypot(packet.x - a.x, packet.y - a.y);
    const distanceDur = Math.min(0.85, 0.26 + dist * 0.0016);
    const dwellDur = (stepDuration / 1000) * 0.7;
    travelDur = Math.max(0.2, Math.min(distanceDur, dwellDur));
  }

  const activeEdge = (a: NodeId, b: NodeId) =>
    !!activeNode &&
    !!prev &&
    ((prev === a && activeNode === b) || (prev === b && activeNode === a));

  const detail = hovered ? NODES[hovered] : null;

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div ref={graphRef} className="relative h-[360px] min-w-[560px] sm:h-[400px]">
          {/* Edges */}
          {measured ? (
            <svg
              width={size.w}
              height={size.h}
              className="absolute inset-0"
              style={{ overflow: 'visible' }}
              aria-hidden
            >
              <defs>
                <marker
                  id="rj-arrow"
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
              {EDGES.map(([f, t]) => {
                const cf = center(f);
                const ct = center(t);
                const p1 = trim(ct, cf, 46);
                const p2 = trim(cf, ct, 50);
                const on = activeEdge(f, t);
                return (
                  <g key={`${f}-${t}`}>
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="hsl(240 5% 20%)"
                      strokeWidth={1.25}
                      markerEnd="url(#rj-arrow)"
                    />
                    {on ? (
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke="hsl(172 66% 50%)"
                        strokeWidth={1.75}
                        strokeDasharray="4 10"
                        className={reduce ? undefined : 'animate-flow-dash'}
                        opacity={0.9}
                      />
                    ) : null}
                  </g>
                );
              })}
            </svg>
          ) : null}

          {/* Packet */}
          {measured && activeNode ? (
            <motion.div
              className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
              initial={false}
              animate={{ left: packet.x, top: packet.y }}
              transition={
                reduce ? { duration: 0 } : { duration: travelDur, ease: [0.16, 1, 0.3, 1] }
              }
            >
              <span className="relative flex h-3 w-3">
                {running && !reduce ? (
                  <span
                    className={cn(
                      'absolute inline-flex h-full w-full animate-ping rounded-full opacity-70',
                      isAsync ? 'bg-accent/40' : 'bg-accent',
                    )}
                  />
                ) : null}
                <span
                  className={cn(
                    'relative inline-flex h-3 w-3 rounded-full',
                    isAsync ? 'bg-accent/70' : 'bg-accent',
                  )}
                  style={{ boxShadow: '0 0 12px 2px hsl(172 66% 50% / 0.6)' }}
                />
              </span>
            </motion.div>
          ) : null}

          {/* Nodes */}
          {NODE_IDS.map((id) => (
            <div
              key={id}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${POS[id].x}%`, top: `${POS[id].y}%` }}
            >
              <ServiceNode
                node={NODES[id]}
                status={statuses[id]}
                active={activeNode === id}
                phase={phase}
                onHover={setHovered}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Details strip — replaces per-node popovers, avoids clipping */}
      <div className="mt-3 min-h-[56px] rounded-lg border border-border bg-bg/50 px-4 py-3">
        {detail ? (
          <p className="text-sm leading-relaxed text-fg-secondary">
            <span className="font-mono text-xs uppercase tracking-wider text-accent">
              {detail.name}
            </span>
            <span className="mx-2 text-fg-muted">·</span>
            {detail.why}
          </p>
        ) : (
          <p className="text-sm text-fg-muted">
            Hover a component to see why it&apos;s in the architecture. Two ingress paths — the
            platform UI (REST) and the dialer (webhooks) — converge on the shared data layer.
          </p>
        )}
      </div>
    </div>
  );
}
