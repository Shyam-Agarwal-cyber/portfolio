'use client';

import { motion } from 'framer-motion';
import { StaggerGroup, staggerItem } from '@/components/ui/reveal';
import { SectionHeader } from '@/components/ui/section-header';
import { diagramMap } from '@/components/diagrams';
import { projects } from '@/lib/content';

export function Projects() {
  return (
    <section id="work" className="scroll-mt-24 border-t border-border bg-surface/30 py-24 sm:py-28">
      <div className="container">
        <SectionHeader
          index="05"
          label="Systems"
          title="Architecture, not screenshots."
          description="These are the production systems I've owned — shown as the data flows they actually are."
        />

        <StaggerGroup className="grid gap-5 md:grid-cols-2">
          {projects.map((p) => {
            const Diagram = diagramMap[p.diagram];
            return (
              <motion.article
                key={p.id}
                variants={staggerItem}
                className="card-hairline group flex flex-col overflow-hidden hover:border-border-strong"
              >
                <div className="relative border-b border-border bg-bg/60 p-5">
                  <div className="aspect-[2/1] w-full">
                    <Diagram />
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-semibold text-fg">{p.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-secondary">{p.tagline}</p>

                  <dl className="my-5 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-border py-4">
                    <div>
                      <dt className="font-mono text-[11px] uppercase tracking-wider text-fg-muted">
                        Scale
                      </dt>
                      <dd className="tabular mt-0.5 font-mono text-sm text-fg">{p.scale}</dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[11px] uppercase tracking-wider text-fg-muted">
                        Performance
                      </dt>
                      <dd className="tabular mt-0.5 font-mono text-sm text-accent">
                        {p.performance}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="font-mono text-[11px] uppercase tracking-wider text-fg-muted">
                        Key challenge
                      </dt>
                      <dd className="mt-0.5 text-sm text-fg-secondary">{p.challenge}</dd>
                    </div>
                  </dl>

                  <ul className="mt-auto flex flex-wrap gap-2">
                    {p.stack.map((s) => (
                      <li key={s} className="chip">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}
