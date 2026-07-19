'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Terminal } from 'lucide-react';
import type { LogLine } from './use-simulation';
import { cn } from '@/lib/utils';

const LEVEL_COLOR: Record<LogLine['level'], string> = {
  INFO: 'text-fg-secondary',
  WARN: 'text-amber-400',
  ERROR: 'text-red-400',
};

const LEVEL_BADGE: Record<LogLine['level'], string> = {
  INFO: 'text-accent',
  WARN: 'text-amber-400',
  ERROR: 'text-red-400',
};

type LogStreamProps = {
  logs: LogLine[];
  onClear: () => void;
};

export function LogStream({ logs, onClear }: LogStreamProps) {
  const [open, setOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, open]);

  return (
    <div className="card-hairline overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-2 text-fg-secondary transition-colors hover:text-fg"
        >
          <Terminal className="h-3.5 w-3.5 text-accent" aria-hidden />
          <span className="font-mono text-xs uppercase tracking-[0.18em]">
            Observability · logs
          </span>
          <ChevronDown
            className={cn('h-3.5 w-3.5 transition-transform', open ? '' : '-rotate-90')}
            aria-hidden
          />
        </button>
        <div className="flex items-center gap-3">
          <span className="tabular font-mono text-[10px] text-fg-muted">{logs.length} lines</span>
          <button
            type="button"
            onClick={onClear}
            className="font-mono text-[10px] uppercase tracking-wider text-fg-muted transition-colors hover:text-fg"
          >
            clear
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div
              ref={scrollRef}
              role="log"
              aria-live="polite"
              aria-label="Request log stream"
              className="h-52 overflow-y-auto scroll-smooth bg-bg/60 p-3 font-mono text-xs leading-relaxed"
            >
              {logs.length === 0 ? (
                <p className="text-fg-muted">
                  <span className="text-accent">$</span> waiting for a request… press{' '}
                  <span className="text-fg">Send Request</span> to trace one end-to-end.
                </p>
              ) : (
                <ul className="space-y-0.5">
                  <AnimatePresence initial={false}>
                    {logs.map((line) => (
                      <motion.li
                        key={line.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-2 whitespace-pre-wrap break-words"
                      >
                        <span className="shrink-0 text-fg-muted">{line.time}</span>
                        <span
                          className={cn('w-11 shrink-0 font-semibold', LEVEL_BADGE[line.level])}
                        >
                          {line.level}
                        </span>
                        <span className="shrink-0 text-fg-muted">{line.service}</span>
                        <span className={LEVEL_COLOR[line.level]}>{line.message}</span>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
