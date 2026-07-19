import { Github, Linkedin, Mail } from 'lucide-react';
import { site } from '@/lib/site';

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <p className="text-sm text-fg-muted">
          © {new Date().getFullYear()} {site.name}
        </p>
        <p className="font-mono text-xs text-fg-muted">
          Built with Next.js · TypeScript · Tailwind
        </p>
        <div className="flex items-center gap-4">
          <a
            href={site.socials.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-fg-secondary transition-colors hover:text-accent"
          >
            <Github className="h-4.5 w-4.5" />
          </a>
          <a
            href={site.socials.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="text-fg-secondary transition-colors hover:text-accent"
          >
            <Linkedin className="h-4.5 w-4.5" />
          </a>
          <a
            href={`mailto:${site.email}`}
            aria-label="Email"
            className="text-fg-secondary transition-colors hover:text-accent"
          >
            <Mail className="h-4.5 w-4.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
