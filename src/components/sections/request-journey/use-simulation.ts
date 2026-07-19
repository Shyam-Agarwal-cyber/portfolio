'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildScenario,
  initialMetrics,
  NODE_IDS,
  type Banner,
  type Metrics,
  type NodeId,
  type NodeStatus,
  type Phase,
  type ScenarioId,
  type Step,
} from '@/lib/simulation';

export type LogLine = {
  id: number;
  time: string;
  level: Step['level'];
  service: string;
  message: string;
};

const MAX_LOGS = 60;

const baseStatuses = (): Record<NodeId, NodeStatus> =>
  NODE_IDS.reduce(
    (acc, id) => {
      acc[id] = 'healthy';
      return acc;
    },
    {} as Record<NodeId, NodeStatus>,
  );

function formatClock(base: number, offset: number): string {
  const d = new Date(base + offset);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

export function useSimulation() {
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);
  const [statuses, setStatuses] = useState<Record<NodeId, NodeStatus>>(baseStatuses);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [activeNode, setActiveNode] = useState<NodeId | null>(null);
  const [stepDuration, setStepDuration] = useState(500);
  const [phase, setPhase] = useState<Phase>('request');
  const [banner, setBanner] = useState<Banner | null>(null);
  const [outcome, setOutcome] = useState<Step['outcome'] | null>(null);
  const [running, setRunning] = useState(false);
  const [lastScenario, setLastScenario] = useState<string | null>(null);

  const runIdRef = useRef(0);
  const logIdRef = useRef(0);
  const cacheRef = useRef({ hits: 52, total: 60 });
  const reducedRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedRef.current = mq.matches;
    const onChange = () => (reducedRef.current = mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    // Cancel any in-flight run on unmount.
    return () => {
      runIdRef.current += 1;
    };
  }, []);

  const run = useCallback(async (scenario: ScenarioId) => {
    const myRun = runIdRef.current + 1;
    runIdRef.current = myRun;

    const reduced = reducedRef.current;
    const speed = reduced ? 0.22 : 1;
    const clockBase = Date.now();
    let clockOffset = 0;

    // Reset transient state for a fresh run; counters persist across runs.
    setRunning(true);
    setStatuses(baseStatuses());
    setBanner(null);
    setOutcome(null);
    setPhase('request');
    setMetrics((m) => ({ ...m, latencyMs: 0, consumerLag: 0, consumer: 'idle' }));

    const built = buildScenario(scenario);
    setLastScenario(built.label);

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, Math.max(60, ms * speed)));

    for (const step of built.steps) {
      if (runIdRef.current !== myRun) return;

      setActiveNode(step.node);
      setStepDuration(Math.max(60, step.duration * speed));
      setPhase(step.phase);

      if (step.status) {
        setStatuses((prev) => ({ ...prev, ...step.status }));
      }
      if (step.banner !== undefined) {
        setBanner(step.banner);
      }
      if (step.outcome) {
        setOutcome(step.outcome);
      }

      const patch = step.patch;
      if (patch) {
        if (patch.cache) {
          cacheRef.current.total += 1;
          if (patch.cache === 'hit') cacheRef.current.hits += 1;
        }
        setMetrics((m) => {
          const next: Metrics = { ...m };
          if (patch.latencyAdd) next.latencyMs = m.latencyMs + patch.latencyAdd;
          if (patch.incRedisHits) next.redisHits = m.redisHits + patch.incRedisHits;
          if (patch.incDbQueries) next.dbQueries = m.dbQueries + patch.incDbQueries;
          if (patch.incEventsConsumed)
            next.eventsConsumed = m.eventsConsumed + patch.incEventsConsumed;
          if (patch.consumerLag !== undefined) next.consumerLag = patch.consumerLag;
          if (patch.consumer) next.consumer = patch.consumer;
          if (patch.cache) {
            next.cacheHitRate = Math.round((cacheRef.current.hits / cacheRef.current.total) * 100);
          }
          return next;
        });
      }

      const line: LogLine = {
        id: (logIdRef.current += 1),
        time: formatClock(clockBase, clockOffset),
        level: step.level,
        service: step.service,
        message: step.message,
      };
      setLogs((prev) => [...prev, line].slice(-MAX_LOGS));

      clockOffset += step.duration;
      await sleep(step.duration);
    }

    if (runIdRef.current !== myRun) return;
    setRunning(false);
    setPhase('request');
    // Let the final node stay highlighted briefly, then settle.
    setTimeout(() => {
      if (runIdRef.current === myRun) setActiveNode(null);
    }, 600);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return {
    metrics,
    statuses,
    logs,
    activeNode,
    stepDuration,
    phase,
    banner,
    outcome,
    running,
    lastScenario,
    run,
    clearLogs,
  };
}
