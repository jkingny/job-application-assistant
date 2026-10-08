# Dossier — Job Application Tracker

A kanban-style job application tracker. By default everything lives in your
browser's localStorage — no account, no analytics, no data leaving your
machine. Export to JSON any time as a backup, or to XLSX for a spreadsheet
view. If you want the same board across your own devices, there's an optional
self-hosted sync server (see below).

> **Using the hosted version?** Your data is stored only in *your* browser.
> The site's owner can't see it, and it won't follow you to another browser or
> device unless you export/import a JSON backup (or self-host the sync server).

## Features

- Kanban board (Not Started → Applied → Interviewing → Offer / Rejected) with
  drag-and-drop, including dragging a card between columns to change its status
- **Search Jobs**: live remote-job listings pulled from Remotive's free public
  API, with one-click "Add" straight into the board (pre-fills title, company,
  and listing link)
- Per-application checklist with a live progress readout
- Interview round tracking (date/time, remote link or address with one-click
  Google Maps directions, multiple interviewers per round with LinkedIn links,
  per-round notes) with `.ics` calendar export
- Extra links per application (research pages, custom company links, etc.)
- Salary range field with automatic hourly → annual estimate (2,080 hrs/yr)
- Resume / cover letter attachment (stored as data URLs in localStorage)
- Auto-growing notes field per application
- JSON backup/restore and XLSX export
- Light/dark theme, persisted

### About the job search feature

This is a static site with no backend — so there's no way to hold API keys
securely, no server to route around CORS restrictions, and no legal path to
Indeed's or LinkedIn's job data (Indeed retired its free public API in 2023;
LinkedIn has never offered one). Scraping either would violate their terms of
service, so that's off the table regardless of technical feasibility.

[Remotive](https://remotive.com/remote-jobs/api) is the one legitimate,
free, no-API-key source that's actually designed to be called straight from
a browser. The honest tradeoff: it only covers **remote** positions. If
you're hunting for local/onsite roles, this won't surface them — you'd need
a paid job-data API (e.g. Adzuna, TheirStack, SerpApi) with a small backend
to hold the credentials, which is a bigger lift than a GitHub Pages static
site supports. The search panel is a genuine convenience for remote-role
hunting, not a full replacement for browsing job boards directly.

## Local development

```bash
npm install
npm run dev
```

## Deploying to GitHub Pages

This repo ships with a GitHub Actions workflow (`.github/workflows/deploy.yml`)
that builds and publishes to GitHub Pages automatically on every push to `main`.

To enable it:

1. Push this repo to GitHub.
2. In the repo, go to **Settings → Pages** and set **Source** to
   **GitHub Actions**.
3. Push to `main` — the site builds and deploys automatically.

If you'd rather deploy manually instead, there's also a `gh-pages`-based
script:

```bash
npm run deploy
```

(This pushes a build to a `gh-pages` branch. You'd set Pages' source to that
branch instead of GitHub Actions if you go this route — don't try to use both
at once.)

**Note:** `vite.config.js` sets `base: './'` so the built app works from any
subpath (like a GitHub Pages project site at `username.github.io/repo-name/`)
without extra config.

## Data & privacy

By default, everything is stored in `localStorage` in your browser — nothing
is uploaded anywhere, and the app works standalone with zero setup.

If you want the same board visible from multiple devices (e.g. your desktop
and laptop), see **Sharing across devices** below to run an optional small
backend on your own network. It's entirely opt-in: with no server running,
the app behaves exactly as it always has.

## Sharing across devices (optional, self-hosted)

A tiny Node/Express server (`server/`) can hold one shared copy of your
applications on a machine on your own network — e.g. a home server, NAS, Raspberry Pi or any
always-on computer. No cloud, no third-party account.

**Easiest path — Docker:**

```bash
docker compose up -d --build
```

This builds the frontend, starts the server on port 4000, and persists data
to `./data/db.json` (mounted as a volume, survives rebuilds/restarts). 
Then, on any device on your network, open `http://<server-ip>:4000` — that's
now the shared app, replacing whatever URL you were using before (a local
dev server, a GitHub Pages link, etc.). All devices pointed at that address
will see the same board within about 10 seconds of each other's changes.

**Manual path (without Docker):**

```bash
npm run build
cd server && npm install && npm start
```

Then visit `http://<server-ip>:4000` from any device.

**Security — read this before exposing it:** the sync server has **no
authentication**. Anyone who can reach its port can read and overwrite your
applications (including attached resumes). Keep it on your home LAN or behind
a VPN / authenticating reverse proxy. Do **not** port-forward it to the
public internet.

**How it behaves:**
- If no server is reachable, the app quietly falls back to local-only mode —
  nothing breaks, you just don't get cross-device sync.
- The header shows a small cloud icon: solid = synced, crossed-out = server
  was found but is temporarily unreachable, hard-drive = no server found at
  all (this device only).
- The first device that connects to a *fresh* server seeds it with whatever
  applications it already had locally.
- This is last-write-wins, polling-based sync meant for one person using a
  few of their own devices — not built for simultaneous multi-user editing.

## Customizing the checklist

Default checklist items live in `src/lib/checklist.js` in `defaultChecklist()`.
Edit the groups/tasks there to match your own job-hunt process — new
applications will pick up whatever's defined at creation time.

## Customizing pipeline stages

Stage names, colors, and order are defined in one place:
`src/lib/statusConfig.js`. The board columns, tags, and stats bar all read
from it.
