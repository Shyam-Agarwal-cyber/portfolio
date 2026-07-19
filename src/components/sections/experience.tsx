'use client';

import { motion } from 'framer-motion';
import { StaggerGroup, staggerItem } from '@/components/ui/reveal';
import { SectionHeader } from '@/components/ui/section-header';
import { experience } from '@/lib/content';

export function Experience() {
  return (
    <section
      id="experience"
      className="scroll-mt-24 border-t border-border bg-surface/30 py-24 sm:py-28"
    >
      <div className="container">
        <SectionHeader index="02" label="Experience" title="Where I've worked" />

        <StaggerGroup className="relative">
          <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" aria-hidden />
          <ul className="space-y-10">
            {experience.map((e) => (
              <motion.li
                key={`${e.role}-${e.period}`}
                variants={staggerItem}
                className="relative pl-10"
              >
                <span
                  className="absolute left-0 top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-accent bg-bg"
                  aria-hidden
                >
                  {e.current ? (
                    <span className="h-1.5 w-1.5 animate-accent-pulse rounded-full bg-accent" />
                  ) : null}
                </span>

                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-lg font-semibold text-fg">
                    {e.role} <span className="text-fg-muted">·</span>{' '}
                    <span className="text-accent">{e.company}</span>
                  </h3>
                  <span className="tabular font-mono text-xs text-fg-muted">{e.period}</span>
                </div>
                <p className="mt-0.5 font-mono text-xs text-fg-muted">{e.location}</p>
                <p className="mt-3 max-w-3xl text-pretty leading-relaxed text-fg-secondary">
                  {e.summary}
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {e.focus.map((f) => (
                    <li key={f} className="chip">
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.li>
            ))}
          </ul>
        </StaggerGroup>
      </div>
    </section>
  );
}
