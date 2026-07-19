'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { StaggerGroup, staggerItem } from '@/components/ui/reveal';
import { SectionHeader } from '@/components/ui/section-header';
import { competitive, skillGroups } from '@/lib/content';

export function Skills() {
  return (
    <section
      id="skills"
      className="scroll-mt-24 border-t border-border bg-surface/30 py-24 sm:py-28"
    >
      <div className="container">
        <SectionHeader
          index="07"
          label="Technical Skills"
          title="Tools, with the context I use them in."
          description="No progress bars, no percentages — just what I reach for and why."
        />

        <StaggerGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group) => (
            <motion.div key={group.category} variants={staggerItem} className="card-hairline p-5">
              <h3 className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-accent">
                {group.category}
              </h3>
              <ul className="space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.name} className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-fg">{item.name}</span>
                    <span className="text-right font-mono text-[11px] text-fg-muted">
                      {item.note}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </StaggerGroup>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px -80px 0px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="card-hairline mt-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-2.5 text-accent">
            <Trophy className="h-4 w-4" aria-hidden />
            <span className="font-mono text-xs uppercase tracking-[0.18em]">
              Competitive Programming
            </span>
          </div>
          <ul className="flex flex-1 flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-x-8">
            {competitive.map((c) => (
              <li key={c.platform} className="text-sm text-fg-secondary">
                <span className="font-medium text-fg">{c.platform}</span> — {c.detail}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
