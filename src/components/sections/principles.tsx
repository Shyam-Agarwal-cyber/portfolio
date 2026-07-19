'use client';

import { motion } from 'framer-motion';
import { StaggerGroup, staggerItem } from '@/components/ui/reveal';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeader } from '@/components/ui/section-header';
import { principles, systemDesignInterests } from '@/lib/content';

export function Principles() {
  return (
    <section id="principles" className="scroll-mt-24 border-t border-border py-24 sm:py-28">
      <div className="container">
        <SectionHeader
          index="08"
          label="Engineering Principles"
          title="How I actually work."
          description="The heuristics I apply before writing code — and the topics I go deep on for fun."
        />

        <StaggerGroup className="grid gap-5 md:grid-cols-2">
          {principles.map((p, i) => (
            <motion.article key={p.title} variants={staggerItem} className="card-hairline p-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="tabular font-mono text-xs text-fg-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="h-px w-6 bg-border-strong" aria-hidden />
                <h3 className="text-base font-semibold text-fg">{p.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-fg-secondary">{p.body}</p>
            </motion.article>
          ))}
        </StaggerGroup>

        <Reveal className="mt-12">
          <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-accent">
            System Design Interests
          </h3>
          <ul className="flex flex-wrap gap-2.5">
            {systemDesignInterests.map((topic) => (
              <li
                key={topic}
                className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-fg-secondary transition-colors hover:border-accent hover:text-fg"
              >
                {topic}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
