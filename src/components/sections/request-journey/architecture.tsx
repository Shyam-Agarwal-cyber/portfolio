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

const RAIL_X = 15; // px, center of the left rail

export function Architecture({
  statuses,
  activeNode,
  phase,
  running,
  stepDuration,
}: ArchitectureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeEls = useRef(new Map<NodeId, HTMLDivElement>());
  const [centers, setCenters] = useState<Partial<Record<NodeId, number>>>({});
  const reduce = useReducedMotion();

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const top = container.getBoundingClientRect().top;
    const next: Partial<Record<NodeId, number>> = {};
    for (const id of NODE_IDS) {
      const el = nodeEls.current.get(id);
      if (el) {
        const r = el.getBoundingClientRect();
        next[id] = r.top - top + r.height / 2;
      }
    }
    setCenters(next);
  }, []);

  useLayoutEffect(() => {
    measure();
    const container = containerRef.current;
    const ro = new ResizeObserver(measure);
    if (container) ro.observe(container);
    window.addEventListener('resize', measure);
    const t = window.setTimeout(measure, 300); // catch late font/layout shifts
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.clearTimeout(t);
    };
  }, [measure]);

  const values = Object.values(centers).filter((v): v is number => typeof v === 'number');
  const firstY = values.length ? Math.min(...values) : 0;
  const lastY = values.length ? Math.max(...values) : 0;
  const packetY = activeNode ? (centers[activeNode] ?? firstY) : firstY;
  const measured = values.length === NODE_IDS.length;
  const showPacket = measured && activeNode !== null;
  const isAsync = phase === 'async';

  // Scale travel time with distance so long jumps feel deliberate instead of
  // snapping — but never longer than ~70% of the step's dwell, so the packet
  // always arrives at a node before the next step fires.
  const prevYRef = useRef(firstY);
  const distance = Math.abs(packetY - prevYRef.current);
  const distanceDur = Math.min(0.85, 0.26 + distance * 0.002);
  const dwellDur = (stepDuration / 1000) * 0.7;
  const travelDur = reduce ? 0 : Math.max(0.2, Math.min(distanceDur, dwellDur));
  useEffect(() => {
    prevYRef.current = packetY;
  }, [packetY]);

  return (
    <div ref={containerRef} className="relative flex gap-3 sm:gap-4">
      {/* Left rail: spine, progress fill, traveling packet */}
      <div className="relative w-8 shrink-0" aria-hidden>
        {measured ? (
          <>
            <div
              className="absolute w-px -translate-x-1/2 bg-border"
              style={{ left: RAIL_X, top: firstY, height: Math.max(0, lastY - firstY) }}
            />
            <motion.div
              className={cn(
                'absolute w-px -translate-x-1/2',
                isAsync ? 'bg-accent/30' : 'bg-accent',
              )}
              style={{ left: RAIL_X, top: firstY }}
              animate={{ height: Math.max(0, packetY - firstY) }}
              transition={{ duration: travelDur, ease: [0.16, 1, 0.3, 1] }}
            />
            {showPacket ? (
              <motion.div
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: RAIL_X }}
                animate={{ top: packetY }}
                transition={{ duration: travelDur, ease: [0.16, 1, 0.3, 1] }}
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
                      isAsync ? 'bg-accent/60' : 'bg-accent',
                    )}
                    style={{ boxShadow: '0 0 12px 2px hsl(172 66% 50% / 0.6)' }}
                  />
                </span>
              </motion.div>
            ) : null}
          </>
        ) : null}
      </div>

      {/* Node column */}
      <div className="flex flex-1 flex-col gap-2.5">
        {NODE_IDS.map((id) => (
          <ServiceNode
            key={id}
            ref={(el) => {
              if (el) nodeEls.current.set(id, el);
              else nodeEls.current.delete(id);
            }}
            node={NODES[id]}
            status={statuses[id]}
            active={activeNode === id}
            phase={phase}
          />
        ))}
      </div>
    </div>
  );
}
