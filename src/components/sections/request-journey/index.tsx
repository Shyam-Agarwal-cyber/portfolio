'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Info, XOctagon } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { Reveal } from '@/components/ui/reveal';
import type { BannerLevel, ScenarioId } from '@/lib/simulation';
import { cn } from '@/lib/utils';
import { Architecture } from './architecture';
import { Controls } from './controls';
import { LogStream } from './log-stream';
import { MetricsPanel } from './metrics-panel';
import { useSimulation } from './use-simulation';

const BANNER_ICON = { info: Info, warn: AlertTriangle, error: XOctagon } as const;
const BANNER_STYLE: Record<BannerLevel, string> = {
  info: 'border-accent/40 bg-accent/[0.07] text-accent',
  warn: 'border-amber-400/40 bg-amber-400/[0.07] text-amber-300',
  error: 'border-red-500/40 bg-red-500/[0.07] text-red-300',
};

export function RequestJourney() {
  const sim = useSimulation();
  const [scenario, setScenario] = useState<ScenarioId>('callCreate');

  const handleSend = useCallback(() => {
    void sim.run(scenario);
  }, [sim, scenario]);

  const BannerIcon = sim.banner ? BANNER_ICON[sim.banner.level] : null;

  return (
    <section id="request-journey" className="scroll-mt-24 border-t border-border py-24 sm:py-28">
      <div className="container">
        <SectionHeader
          index="04"
          label="Signature · Interactive"
          title="Request Journey"
          description="A live model of the dialer platform I own — two decoupled ingestion paths: synchronous REST from the platform UI (call-create ingests a row, call-update patches disposition & committed amount) and an idempotent Kafka consumer for the dialer's webhook topic. Pick a scenario and trace it end-to-end with real logs and metrics."
        />

        <Reveal>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* Architecture playground */}
            <div className="card-hairline p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-fg-secondary">
                  Architecture
                </span>
                <span className="font-mono text-[10px] text-fg-muted">
                  {sim.lastScenario ? `last: ${sim.lastScenario}` : 'POST /api/v2/calls'}
                </span>
              </div>

              <AnimatePresence>
                {sim.banner && BannerIcon ? (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mb-4 overflow-hidden"
                  >
                    <div
                      className={cn(
                        'flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed',
                        BANNER_STYLE[sim.banner.level],
                      )}
                      role="status"
                    >
                      <BannerIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      <span>{sim.banner.text}</span>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <Architecture
                statuses={sim.statuses}
                activeNode={sim.activeNode}
                phase={sim.phase}
                running={sim.running}
                stepDuration={sim.stepDuration}
              />
            </div>

            {/* Control + metrics rail */}
            <div className="flex flex-col gap-4">
              <Controls
                scenario={scenario}
                onScenarioChange={setScenario}
                onSend={handleSend}
                running={sim.running}
              />
              <MetricsPanel metrics={sim.metrics} running={sim.running} />
            </div>
          </div>

          <div className="mt-4">
            <LogStream logs={sim.logs} onClear={sim.clearLogs} />
          </div>

          <p className="mt-4 text-center text-xs text-fg-muted">
            Hover any service to see why it&apos;s there. The scenarios mirror the real request
            types and failure modes of the platform I work on.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
