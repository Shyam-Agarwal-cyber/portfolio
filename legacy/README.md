# Shyam Agarwal — Portfolio

A fast, dependency-free personal portfolio. Plain **HTML + CSS + JS** — no build step, no framework. Deploys anywhere.

```
portfolio/
├── index.html                  # the whole site
├── styles.css                  # theme + layout
├── script.js                   # nav, scroll reveal, stat counters, contact form
├── Shyam-Agarwal-Resume.pdf    # linked by the "Download résumé" buttons
└── README.md
```

## Preview locally

Any static server works. From this folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just double-click `index.html`.

## Deploy

### Option A — Netlify (drag & drop, ~30s)
1. Go to https://app.netlify.com/drop
2. Drag the whole `portfolio` folder onto the page.
3. Done — you get a live URL instantly. (Optional: add a custom domain in site settings.)

### Option B — Vercel
1. Push this folder to a GitHub repo.
2. Import it at https://vercel.com/new — no build settings needed (framework: "Other").

### Option C — GitHub Pages
1. Create a repo (e.g. `portfolio`) and push these files to the `main` branch.
2. Repo → **Settings → Pages** → Source: `main` / root.
3. Site publishes at `https://<username>.github.io/<repo>/`.

## Contact form setup (optional, 2 minutes)

The form works immediately: with no configuration it opens the visitor's email client
pre-filled to `shyam5320235@gmail.com`. To receive submissions in your inbox instead
(no redirect), wire up the free Formspree tier:

1. Sign up at https://formspree.io using `shyam5320235@gmail.com`.
2. Create a form and copy its ID (looks like `xayzabcd`).
3. In `index.html`, find `action="https://formspree.io/f/YOUR_FORM_ID"` and replace
   `YOUR_FORM_ID` with your ID.

That's it — submissions land in your email and the form shows an inline success message.

## Editing content

Everything lives in `index.html` and reads top-to-bottom by section
(Hero → About → Experience → Work → Skills → Contact). Update the numbers in the
`data-count` attributes of the hero stats if your metrics change, and drop in a new
`Shyam-Agarwal-Resume.pdf` to update the résumé download.
