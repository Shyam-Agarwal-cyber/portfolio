'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { decisions } from '@/lib/content';
import { cn } from '@/lib/utils';

export function Decisions() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="decisions" className="scroll-mt-24 border-t border-border py-24 sm:py-28">
      <div className="container">
        <SectionHeader
          index="06"
          label="Engineering Decisions"
          title="The part most portfolios skip: the why."
          description="Tools are commodities. Judgment isn't. Here's how I reason about the choices that shape a system — including the options I turned down."
        />

        <ul className="mx-auto max-w-3xl divide-y divide-border overflow-hidden rounded-xl border border-border">
          {decisions.map((d, i) => {
            const isOpen = open === i;
            return (
              <li key={d.question} className="bg-surface/40">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-raised"
                >
                  <span className="font-medium text-fg">{d.question}</span>
                  <Plus
                    className={cn(
                      'h-4 w-4 shrink-0 text-accent transition-transform duration-300',
                      isOpen && 'rotate-45',
                    )}
                    aria-hidden
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 px-5 pb-5">
                        <p className="text-sm leading-relaxed text-fg-secondary">{d.answer}</p>
                        <p className="rounded-lg border-l-2 border-accent/50 bg-bg/50 px-4 py-2.5 text-sm leading-relaxed text-fg-muted">
                          {d.tradeoff}
                        </p>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
