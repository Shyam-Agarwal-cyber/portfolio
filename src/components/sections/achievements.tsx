'use client';

import { motion } from 'framer-motion';
import { StaggerGroup, staggerItem } from '@/components/ui/reveal';
import { SectionHeader } from '@/components/ui/section-header';
import { achievements } from '@/lib/content';

const rows = [
  { key: 'problem', label: 'Problem' },
  { key: 'approach', label: 'Approach' },
  { key: 'decision', label: 'Decision' },
  { key: 'impact', label: 'Impact' },
] as const;

export function Achievements() {
  return (
    <section id="achievements" className="scroll-mt-24 border-t border-border py-24 sm:py-28">
      <div className="container">
        <SectionHeader
          index="03"
          label="Selected Achievements"
          title="Engineering told as decisions, not tasks."
          description="Each of these is structured the way I actually think about work: what broke, how I approached it, the call I made, and what it moved."
        />

        <StaggerGroup className="grid gap-5 lg:grid-cols-2">
          {achievements.map((a) => (
            <motion.article
              key={a.id}
              variants={staggerItem}
              className="card-hairline group flex flex-col p-6 hover:border-border-strong"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <h3 className="text-balance text-lg font-semibold leading-snug text-fg">
                  {a.title}
                </h3>
                <span className="tabular shrink-0 rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-xs font-semibold text-accent">
                  {a.metric}
                </span>
              </div>

              <dl className="space-y-3.5">
                {rows.map((r) => (
                  <div key={r.key} className="grid grid-cols-[76px_1fr] gap-3">
                    <dt className="pt-0.5 font-mono text-[11px] uppercase tracking-wider text-fg-muted">
                      {r.label}
                    </dt>
                    <dd className="text-sm leading-relaxed text-fg-secondary">{a[r.key]}</dd>
                  </div>
                ))}
              </dl>

              <ul className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                {a.stack.map((s) => (
                  <li key={s} className="chip">
                    {s}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
