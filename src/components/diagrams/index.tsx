import { ArrowDefs, DiagramFrame, Edge, Node } from './primitives';

/*
 * All diagrams share a 360 x 180 viewBox. Content is centered on the
 * vertical axis (y = 90) and balanced horizontally so every card reads
 * as a centered figure.
 */

const LABEL_FILL = 'hsl(240 5% 45%)';
const ACCENT_FILL = 'hsl(172 66% 55%)';
const MONO = 'var(--font-mono), monospace';

/** Call-webhook event pipeline with fan-out. */
export function PipelineDiagram() {
  return (
    <DiagramFrame label="Dialer emits events to Kafka; an idempotent consumer fans out to three downstream topics">
      <ArrowDefs />
      <Edge d="M 66 90 H 96" animated />
      <Edge d="M 174 90 H 204" animated />
      <Edge d="M 282 90 C 293 90, 296 63, 304 63" />
      <Edge d="M 282 90 H 304" />
      <Edge d="M 282 90 C 293 90, 296 117, 304 117" />
      <Node x={0} y={70} w={66} h={40} title="Dialer" sub="producer" />
      <Node x={96} y={70} w={78} h={40} title="Kafka" sub="log" accent />
      <Node x={204} y={70} w={78} h={40} title="Consumer" sub="idempotent" accent />
      <Node x={304} y={52} w={56} h={22} title="recording" />
      <Node x={304} y={79} w={56} h={22} title="webhook" />
      <Node x={304} y={106} w={56} h={22} title="borrower" />
    </DiagramFrame>
  );
}

/** Redis-fronted read path with Postgres as source of truth. */
export function CacheDiagram() {
  return (
    <DiagramFrame label="Requests hit Redis first; on a miss, Postgres serves the query and warms the cache">
      <ArrowDefs />
      <Edge d="M 101 90 H 135" animated />
      <Edge d="M 213 90 H 247" dashed />
      <Edge d="M 286 110 C 286 142, 174 142, 174 110" />
      <Node x={35} y={70} w={66} h={40} title="Request" />
      <Node x={135} y={70} w={78} h={40} title="Redis" sub="hit?" accent />
      <Node x={247} y={70} w={78} h={40} title="Postgres" sub="source of truth" />
      <text x={230} y={82} textAnchor="middle" fontSize="6.5" fontFamily={MONO} fill={LABEL_FILL}>
        miss
      </text>
      <text x={230} y={136} textAnchor="middle" fontSize="6.5" fontFamily={MONO} fill={ACCENT_FILL}>
        warm cache
      </text>
    </DiagramFrame>
  );
}

/** Auto-churn re-engagement loop. */
export function LoopDiagram() {
  return (
    <DiagramFrame label="A cycle-end event triggers validation, which re-enqueues eligible leads for the next cycle">
      <ArrowDefs />
      <Edge d="M 100 90 H 132" animated />
      <Edge d="M 228 90 H 260" animated />
      <Edge d="M 308 110 C 308 148, 52 148, 52 110" dashed />
      <Node x={4} y={70} w={96} h={40} title="cycle-end" sub="event" accent />
      <Node x={132} y={70} w={96} h={40} title="validation" sub="eligible?" />
      <Node x={260} y={70} w={96} h={40} title="re-enqueue" sub="next cycle" accent />
      <text x={180} y={142} textAnchor="middle" fontSize="6.5" fontFamily={MONO} fill={LABEL_FILL}>
        retryable loop
      </text>
    </DiagramFrame>
  );
}

/** API consolidation: fragmented vendor surface to two unified endpoints. */
export function ApiDiagram() {
  const legacyY = [15, 41, 67, 93, 119, 145];
  const targets = [65, 65, 65, 115, 115, 115];
  return (
    <DiagramFrame label="Six fragmented vendor APIs consolidated into two unified in-house endpoints">
      <ArrowDefs />
      {legacyY.map((y, i) => (
        <Edge
          key={`e-${y}`}
          d={`M 108 ${y + 10} C 170 ${y + 10}, 180 ${targets[i]}, 240 ${targets[i]}`}
        />
      ))}
      {legacyY.map((y, i) => (
        <Node key={`n-${y}`} x={30} y={y} w={78} h={20} title={`legacy ${i + 1}`} />
      ))}
      <Node x={240} y={52} w={90} h={26} title="/v2/calls" accent />
      <Node x={240} y={102} w={90} h={26} title="/v2/campaigns" accent />
    </DiagramFrame>
  );
}

export const diagramMap = {
  pipeline: PipelineDiagram,
  cache: CacheDiagram,
  loop: LoopDiagram,
  api: ApiDiagram,
} as const;
