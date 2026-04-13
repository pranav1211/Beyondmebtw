# beyondmebtw — Claude Code Context

## Before starting any task

**Always consult the repomap first.** Read `repo_map.json` at the project root before making changes or exploring the codebase. This gives you the full file/symbol/relationship map and prevents blind searching.

If the repomap is missing or outdated, regenerate it using the repomap agent before proceeding.

## What this is

Personal website (beyondmebtw.com) — purely client-side HTML/CSS/JS with a Node.js admin backend. No build step, no bundler.

## Project structure

```
/                        — Homepage (script.js, analytics.js), GitHub webhook deploy (beyondgitman.js)
about/                   — About page, ES module imports from about/data/
blog/                    — Blog listing: category filtering, search, pagination, lazy loading
manage/                  — Admin system: cookie auth, dashboard, Node.js REST API (manageserver.js)
music/                   — Web Audio API mic monitor with waveform visualization
projects/beyondpages/    — Kindle-style PDF reader
projects/uceedanswer/    — UCEED exam score calculator (7-module architecture)
projects/mynyl/          — Vinyl record audio player (has its own CLAUDE.md)
projects/f1hapticandroid/— F1 haptic vibration synced to YouTube
projects/pairgame/       — Pair game (JS + Python)
projects/projects.js     — Vue.js project gallery with image viewer
```

## Cross-file dependencies

- Only `about/about.js` uses ES module imports (from `about/data/`)
- Everything else uses browser globals via script load order or fetch calls
- `manage/manageserver.js` is the Node.js backend (REST API for blog/project CRUD, auth)

## Conventions

- No frameworks in most pages — vanilla JS, vanilla CSS
- No build tools — files served as-is
- Projects are self-contained in their own directories
