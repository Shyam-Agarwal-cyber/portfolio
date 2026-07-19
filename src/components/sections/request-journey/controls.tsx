'use client';

import { Play, Loader2 } from 'lucide-react';
import { SCENARIOS, type ScenarioId } from '@/lib/simulation';
import { cn } from '@/lib/utils';

type ControlsProps = {
  scenario: ScenarioId;
  onScenarioChange: (id: ScenarioId) => void;
  onSend: () => void;
  running: boolean;
};

export function Controls({ scenario, onScenarioChange, onSend, running }: ControlsProps) {
  return (
    <div className="card-hairline p-4">
      <button
        type="button"
        onClick={onSend}
        disabled={running}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {running ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Tracing request…
          </>
        ) : (
          <>
            <Play className="h-4 w-4 fill-current" aria-hidden />
            Send Request
          </>
        )}
      </button>

      <div className="mt-4">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
          Inject scenario
        </div>
        <div role="radiogroup" aria-label="Inject scenario" className="flex flex-wrap gap-1.5">
          {SCENARIOS.map((s) => {
            const selected = s.id === scenario;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onScenarioChange(s.id)}
                className={cn(
                  'rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors',
                  selected
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-bg/40 text-fg-secondary hover:border-border-strong hover:text-fg',
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
