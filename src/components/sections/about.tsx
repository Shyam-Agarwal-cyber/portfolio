import { Reveal } from '@/components/ui/reveal';
import { SectionHeader } from '@/components/ui/section-header';

const facts = [
  { k: 'Role', v: 'Backend Software Engineer' },
  { k: 'Company', v: 'Credgenics' },
  { k: 'Experience', v: '~2 years' },
  { k: 'Focus', v: 'Distributed systems · performance' },
  { k: 'Core stack', v: 'Python · FastAPI · Kafka · PostgreSQL · Redis' },
  { k: 'Based in', v: 'Noida, India' },
];

export function About() {
  return (
    <section id="about" className="scroll-mt-24 border-t border-border py-24 sm:py-28">
      <div className="container">
        <SectionHeader index="01" label="About" title="I optimize for the tail, not the demo." />
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <Reveal className="space-y-5 text-lg leading-relaxed text-fg-secondary">
            <p>
              I&apos;m a backend engineer who works where the metrics are unforgiving — p99 latency,
              consumer lag, throughput under concurrency, exactly-once delivery. At Credgenics I own
              the event-streaming backbone of the dialer platform as it scales from{' '}
              <span className="text-fg">1M to 9M calls a day</span>.
            </p>
            <p>
              My best work isn&apos;t a feature — it&apos;s a{' '}
              <span className="text-fg">decision</span>. Choosing application-level idempotency over
              broker transactions. Caching derived state instead of rows. Splitting a monolith along
              the workload boundary rather than the code boundary. The kind of judgment that keeps a
              system correct while it grows.
            </p>
            <p>
              I studied Computer Science at IIIT Nagpur and still keep the competitive-programming
              edge sharp. I care about clean contracts, observable systems, and RCAs that make a bug
              impossible twice.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <dl className="card-hairline divide-y divide-border">
              {facts.map((f) => (
                <div key={f.k} className="flex items-baseline justify-between gap-4 px-5 py-3.5">
                  <dt className="font-mono text-xs uppercase tracking-wider text-fg-muted">
                    {f.k}
                  </dt>
                  <dd className="text-right text-sm text-fg">{f.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
