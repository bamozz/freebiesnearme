# Freebies Near Me

Toronto free giveaways/events site. Two layers:

- `public/toronto/*.html` — the original static site (index, map, submit, feedback, advertise, changelog). Each page is self-contained: inline `<style>` and `<script>`, no build step, no shared component/module system between them.
- `app/` — a Next.js App Router layer for pSEO hub pages (`/toronto/{category}` and `/toronto/{neighbourhood}`), backed by `app/[city]/[hub]/page.tsx`. Shared logic/branding lives in `lib/` (`categories.ts`, `listing-display.ts`, `datetime.ts`, `jsonld.ts`) and `app/globals.css`/`app/layout.tsx`.

Data lives in Supabase. Writes to `listings` only happen through `api/submit-listing.js` (service role key, Turnstile-gated) — the anon key used client-side is read-only by RLS design, so don't try to insert/update via the anon key.

## Cities

The site runs in two cities, each under its own URL prefix: `/toronto` and `/new-york`.

- **City config lives in `lib/cities.ts`** (name, region, curated neighbourhood list, footer links). The Next layer reads the city from the URL (`app/[city]/...`, header/footer/tab bar derive it from the path). Listings carry `listings.city_slug`; every query must filter on it.
- **Static pages are duplicated per city**: `public/toronto/*.html` and `public/new-york/*.html`. They are self-contained and share no code, so a change to one city's page must be mirrored in the other (map centre/bounds, the `LOCATIONS` list, `CITY_TZ`, flag colours and the neighbourhood links in the footer are the only per-city differences). Both cities' pages load only `city_slug = '<city>'` listings.
- **Adding a city**: copy `public/toronto/` to `public/<slug>/` and swap the city specifics above, add the city to `lib/cities.ts`, the allowlist in `api/submit-listing.js` (`ALLOWED_CITY_SLUGS`), and rewrites/redirects in `vercel.json`. `lib/datetime.ts` assumes Eastern time.
- `listings.city_slug` defaults to `toronto` in the database, so a listing for another city must set it explicitly (the submit form and API do; routine SQL inserts must too).

## Changelog

Whenever you ship a user-facing fix, feature, or improvement, add an entry to the top of the `CHANGELOG` array in `public/toronto/changelog.html` (newest first), and in `public/new-york/changelog.html` too when the change applies to the whole site rather than one city's data. Write it in plain language for site visitors, not commit-message style, grouped into New/Improved/Fixed sections. Skip pure internal/infra changes that a visitor wouldn't notice or care about.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
