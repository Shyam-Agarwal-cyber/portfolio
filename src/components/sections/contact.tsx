'use client';

import { useState, type FormEvent } from 'react';
import { Github, Linkedin, Mail, Phone, Send } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { SectionHeader } from '@/components/ui/section-header';
import { site } from '@/lib/site';
import { cn } from '@/lib/utils';

/**
 * Contact form setup:
 * Set NEXT_PUBLIC_FORMSPREE_ID in .env.local to your Formspree form id
 * (e.g. xayzabcd) to receive submissions by email. Without it, the form
 * gracefully falls back to opening the visitor's mail client.
 */
const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID;

type Status = 'idle' | 'sending' | 'ok' | 'error';

const channels = [
  { icon: Mail, label: site.email, href: `mailto:${site.email}` },
  { icon: Phone, label: '+91 79066 42731', href: `tel:${site.phone}` },
  { icon: Github, label: site.socials.githubHandle, href: site.socials.github },
  { icon: Linkedin, label: site.socials.linkedinHandle, href: site.socials.linkedin },
];

export function Contact() {
  const [status, setStatus] = useState<Status>('idle');
  const [note, setNote] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    if (!FORMSPREE_ID) {
      const name = String(data.get('name') ?? '');
      const email = String(data.get('email') ?? '');
      const message = String(data.get('message') ?? '');
      const body = `Name: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0A${message}`;
      window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(
        `Portfolio contact from ${name}`,
      )}&body=${body}`;
      setStatus('ok');
      setNote('Opening your email app…');
      return;
    }

    setStatus('sending');
    setNote('');
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        form.reset();
        setStatus('ok');
        setNote('Thanks — your message has been sent.');
      } else {
        setStatus('error');
        setNote('Something went wrong. Please email me directly.');
      }
    } catch {
      setStatus('error');
      setNote('Network error. Please email me directly.');
    }
  }

  return (
    <section
      id="contact"
      className="scroll-mt-24 border-t border-border bg-surface/30 py-24 sm:py-28"
    >
      <div className="container">
        <SectionHeader index="09" label="Contact" title="Let's talk systems." />

        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <Reveal className="space-y-8">
            <p className="max-w-md text-lg leading-relaxed text-fg-secondary">
              Always happy to talk distributed systems, performance, or an interesting backend
              problem. Drop a note and I&apos;ll get back to you.
            </p>
            <ul className="space-y-3">
              {channels.map((c) => {
                const Icon = c.icon;
                const external = c.href.startsWith('http');
                return (
                  <li key={c.label}>
                    <a
                      href={c.href}
                      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="group inline-flex items-center gap-3 text-fg-secondary transition-colors hover:text-accent"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface transition-colors group-hover:border-accent">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="font-mono text-sm">{c.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <form onSubmit={handleSubmit} className="card-hairline space-y-4 p-6">
              <Field id="name" name="name" label="Name" placeholder="Jane Doe" />
              <Field
                id="email"
                name="email"
                type="email"
                label="Email"
                placeholder="jane@company.com"
              />
              <div>
                <label htmlFor="message" className="mb-1.5 block text-sm text-fg-secondary">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  required
                  placeholder="Tell me about the role or system…"
                  className="w-full resize-y rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'sending'}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                <Send className="h-4 w-4" aria-hidden />
                {status === 'sending' ? 'Sending…' : 'Send message'}
              </button>
              {note ? (
                <p
                  role="status"
                  className={cn(
                    'text-center text-sm',
                    status === 'error' ? 'text-red-400' : 'text-accent',
                  )}
                >
                  {note}
                </p>
              ) : null}
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Field({
  id,
  name,
  label,
  placeholder,
  type = 'text',
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm text-fg-secondary">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
      />
    </div>
  );
}
