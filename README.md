# Shyam Agarwal — Portfolio

A production-grade personal site for a backend engineer. Built to read like a well-designed
internal tool: monochrome, precise, fast. The medium is the message.

**Stack:** Next.js 14 (App Router) · TypeScript (strict) · Tailwind CSS · Framer Motion ·
lucide-react · ESLint + Prettier.

## Design language

- **Monochrome + one accent** — Signal Teal `#2DD4BF`, used sparingly.
- **Typography-led** — Inter (display/body) + JetBrains Mono (metrics, labels), tabular numerals.
- **Custom architecture diagrams** — a reusable SVG node/edge system (`src/components/diagrams`),
  no stock graphics.
- **Judgment over tools** — the site leads with decisions and tradeoffs, not a tech laundry list.

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run format     # Prettier write
```

## Project structure

```
src/
├── app/
│   ├── layout.tsx            # fonts, SEO metadata, OpenGraph, JSON-LD
│   ├── page.tsx              # section composition
│   ├── globals.css           # design tokens + base styles
│   ├── opengraph-image.tsx   # dynamic OG/Twitter card
│   ├── robots.ts, sitemap.ts # SEO routes
├── components/
│   ├── nav.tsx, footer.tsx
│   ├── sections/             # hero, about, experience, achievements, projects,
│   │                         # decisions, skills, principles, contact
│   ├── diagrams/             # reusable SVG architecture diagrams
│   └── ui/                   # reveal (motion), count-up, section-header
└── lib/
    ├── site.ts               # site config, nav, socials, resume link
    ├── content.ts            # ALL editable content lives here
    └── utils.ts              # cn()
```

**To edit content, open `src/lib/content.ts`** — every metric, achievement, project, decision,
and skill is defined there. Personal links live in `src/lib/site.ts`.

## Contact form

Works out of the box via a `mailto:` fallback. To receive submissions by email instead:

1. Create a free form at https://formspree.io (use `shyam5320235@gmail.com`).
2. Copy `.env.local.example` → `.env.local` and set `NEXT_PUBLIC_FORMSPREE_ID`.
   On Vercel, add the same variable under Project → Settings → Environment Variables.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Import it at https://vercel.com/new — framework is auto-detected as Next.js, no config needed.
3. (Optional) add `NEXT_PUBLIC_FORMSPREE_ID` and a custom domain.
4. Update `site.url` in `src/lib/site.ts` to your final domain (used for SEO/OG/canonical).

## Notes

- The previous static HTML version is preserved in `/legacy` and is not part of the build.
- Résumé PDF lives at `public/Shyam-Agarwal-Resume.pdf`.
