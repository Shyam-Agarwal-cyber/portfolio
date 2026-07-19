'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowDownToLine, ArrowRight } from 'lucide-react';
import { CountUp } from '@/components/ui/count-up';
import { heroMetrics } from '@/lib/content';
import { site } from '@/lib/site';

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export function Hero() {
  return (
    <section id="hero" className="relative flex min-h-[100svh] items-center overflow-hidden pt-16">
      <div className="grid-backdrop pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        style={{
          background:
            'radial-gradient(600px 320px at 50% 0%, hsl(172 66% 50% / 0.08), transparent 70%)',
        }}
        aria-hidden
      />

      <motion.div
        className="container relative py-20"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_0.85fr] lg:gap-14">
          {/* Left — copy */}
          <motion.div variants={container}>
            <motion.div
              variants={item}
              className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-border bg-surface px-3.5 py-1.5 font-mono text-xs text-fg-secondary"
            >
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              {site.availability}
            </motion.div>

            <motion.h1 variants={item} className="text-balance text-display font-semibold">
              I build backend systems that stay fast{' '}
              <span className="text-accent">under production load.</span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-fg-secondary"
            >
              Backend engineer at <span className="text-fg">Credgenics</span>. I own Kafka consumers
              processing <span className="text-fg">9M+ events/day</span> with exactly-once
              semantics, cut a hot endpoint&apos;s p99 latency from{' '}
              <span className="text-fg">4s to 500ms</span>, and design PostgreSQL &amp; Redis for
              high-throughput services.
            </motion.p>

            <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#work"
                className="group inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5"
              >
                View selected work
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </a>
              <a
                href={site.resume}
                download
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-medium text-fg transition-colors hover:border-accent hover:text-accent"
              >
                <ArrowDownToLine className="h-4 w-4" aria-hidden />
                Download résumé
              </a>
            </motion.div>
          </motion.div>

          {/* Right — portrait */}
          <motion.div
            variants={item}
            className="relative mx-auto w-full max-w-[280px] lg:max-w-none"
          >
            <div
              className="pointer-events-none absolute -inset-6 -z-10"
              style={{
                background:
                  'radial-gradient(closest-side, hsl(172 66% 50% / 0.14), transparent 75%)',
              }}
              aria-hidden
            />
            <div className="card-hairline relative overflow-hidden">
              <div className="relative aspect-[4/5] w-full">
                <Image
                  src="/Profile.png"
                  alt={`${site.name}, ${site.role}`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 280px, 360px"
                  className="object-cover object-top"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface via-surface/15 to-transparent" />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-4">
                <div className="font-mono text-xs text-fg-secondary">{site.name}</div>
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-fg-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Noida, IN
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.dl
          variants={item}
          className="mt-16 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4"
        >
          {heroMetrics.map((m) => (
            <div key={m.label} className="border-l border-border-strong pl-4">
              <dt className="sr-only">{m.label}</dt>
              <dd>
                <CountUp
                  className="tabular block font-mono text-3xl font-semibold tracking-tight text-accent sm:text-[2rem]"
                  value={m.value}
                  decimals={m.decimals ?? 0}
                  prefix={m.prefix}
                  suffix={m.suffix}
                />
                <span className="mt-1 block text-sm text-fg-secondary">{m.label}</span>
                <span className="tabular font-mono text-xs text-fg-muted">{m.note}</span>
              </dd>
            </div>
          ))}
        </motion.dl>
      </motion.div>
    </section>
  );
}
