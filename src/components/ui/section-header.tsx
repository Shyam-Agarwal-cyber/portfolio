import { Reveal } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';

type SectionHeaderProps = {
  index: string;
  label: string;
  title: string;
  description?: string;
  className?: string;
};

export function SectionHeader({ index, label, title, description, className }: SectionHeaderProps) {
  return (
    <Reveal className={cn('mb-12 max-w-2xl', className)}>
      <div className="mb-4 flex items-center gap-3">
        <span className="tabular font-mono text-xs text-fg-muted">{index}</span>
        <span className="h-px w-8 bg-border-strong" aria-hidden />
        <span className="section-label">{label}</span>
      </div>
      <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-4 text-pretty text-base leading-relaxed text-fg-secondary">
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
