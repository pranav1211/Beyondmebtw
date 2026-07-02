# Product

## Register

product

> Scope note: this repo holds both the public site (beyondmebtw.com — treat
> homepage/blog/about/photos as brand surfaces per task) and the manage
> dashboard (manage.beyondmebtw.com). This file's default register covers the
> manage dashboard and other tooling surfaces.

## Users

One user: the site owner. Solo admin, technical, uses the dashboard in short
frequent sessions (publish a post, tweak a project, check a deploy) from
desktop and occasionally phone. No onboarding needed — familiarity and speed
beat discoverability.

## Product Purpose

Admin panel for a personal website: CRUD for blog posts, categories, projects,
photos, and project deploy infrastructure (webhook registry, live project
list). Success = any routine content task done in under a minute without
touching the server.

## Brand Personality

Calm, dense, fast. A workbench, not a product demo. Quietly consistent with
the public site's purple/magenta accent, but color signals state and action —
never decoration.

## Anti-references

- Generic SaaS dashboard: hero metrics, big-number stat cards, gradient
  banners, marketing polish.
- Anything that adds ceremony between intent and action (wizards, confirmation
  chains beyond destructive ops, decorative loading sequences).

## Design Principles

1. **Density is a feature** — more rows on screen beats more whitespace.
2. **State over decoration** — color/motion only to show status, selection,
   success, danger.
3. **Same vocabulary everywhere** — one button set, one card shape, one form
   style across all tabs.
4. **Trust the operator** — expose raw values (paths, branches, timestamps);
   never hide detail behind tooltips when inline fits.
5. **Fail loudly, inline** — errors appear where the action happened, with the
   server's actual message.

## Accessibility & Inclusion

Sensible defaults: ≥4.5:1 body-text contrast, keyboard-usable forms and
modals, visible focus states, reduced-motion respected. No formal WCAG audit
target.
