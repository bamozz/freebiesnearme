# Freebies Near Me

Toronto free giveaways/events site. Two layers:

- `public/toronto/*.html` — the original static site (index, map, submit, feedback, advertise, changelog). Each page is self-contained: inline `<style>` and `<script>`, no build step, no shared component/module system between them.
- `app/` — a Next.js App Router layer for pSEO hub pages (`/toronto/{category}` and `/toronto/{neighbourhood}`), backed by `app/[city]/[hub]/page.tsx`. Shared logic/branding lives in `lib/` (`categories.ts`, `listing-display.ts`, `datetime.ts`, `jsonld.ts`) and `app/globals.css`/`app/layout.tsx`.

Data lives in Supabase. Writes to `listings` only happen through `api/submit-listing.js` (service role key, Turnstile-gated) — the anon key used client-side is read-only by RLS design, so don't try to insert/update via the anon key.

## Environments

- **Production**: `main`, served at www.freebiesnearme.app (and freebiesnearme.app). Only merge here when asked.
- **Staging**: the `staging` branch, served at https://freebiesnearme.vercel.app (a branch domain, so every push to `staging` updates it automatically; it sits behind Vercel login). Review visual and structural changes here first: merge the feature branch into `staging`, push, then check freebiesnearme.vercel.app.
- Both environments read and write the **same Supabase database**. Listings for a city that production doesn't serve yet must stay `moderation_status = 'pending'`, because production pages only filter by city once that code is merged.

## Cities

The site runs in two cities, each under its own URL prefix: `/toronto` and `/new-york`.

- **City config lives in `lib/cities.ts`** (name, region, curated neighbourhood list, footer links). The Next layer reads the city from the URL (`app/[city]/...`, header/footer/tab bar derive it from the path). Listings carry `listings.city_slug`; every query must filter on it.
- **Static pages are duplicated per city**: `public/toronto/*.html` and `public/new-york/*.html`. They are self-contained and share no code, so a change to one city's page must be mirrored in the other (map centre/bounds, the `LOCATIONS` list, `CITY_TZ`, the `--city-primary*` colour variables in each page's `:root` block, and the neighbourhood links in the footer are the only per-city differences; the same colours live in `lib/cities.ts` for Next pages). Both cities' pages load only `city_slug = '<city>'` listings.
- **Geographic scope**: Toronto covers the City of Toronto's former municipalities of **Toronto (old Toronto), York and East York**, as drawn in the City's own Open Data set "Former Municipality Boundaries" (the official definition; York is the area the neighbourhood guide calls York-Crosstown, and old Toronto's northern edge, about Lawrence Avenue, is the edge of Uptown). That is the area of the site's scope map: Downtown, Midtown, Uptown, West End, East End, East York and York-Crosstown. Those seven names come from a commercial neighbourhood guide, not the City, so use the City boundaries when in doubt. Etobicoke, North York (including Don Mills and Yorkdale), Scarborough and the suburbs (Mississauga, Vaughan, Markham and so on) are out of scope. The Toronto map is bounded to that area. New York covers **New York City as defined by its five boroughs** (Manhattan, Brooklyn, Queens, the Bronx, Staten Island); New Jersey, Long Island and Westchester are out of scope. The New York map is bounded to the five boroughs.
- **Adding a city**: copy `public/toronto/` to `public/<slug>/` and swap the city specifics above, add the city to `lib/cities.ts`, the allowlist in `api/submit-listing.js` (`ALLOWED_CITY_SLUGS`), and rewrites/redirects in `vercel.json`. `lib/datetime.ts` assumes Eastern time.
- `feedback.city_slug` (feedback form and advertiser inquiries) works the same way: each city's pages send their own slug and `api/submit-advertise.js` validates it against `ALLOWED_CITY_SLUGS`.
- `listings.city_slug` defaults to `toronto` in the database, so a listing for another city must set it explicitly (the submit form and API do; routine SQL inserts must too).

## Changelog

Whenever you ship a user-facing fix, feature, or improvement, add an entry to the top of the `CHANGELOG` array in `public/toronto/changelog.html` (newest first), and in `public/new-york/changelog.html` too when the change applies to the whole site rather than one city's data. Write it in plain language for site visitors, not commit-message style, grouped into New/Improved/Fixed sections. Skip pure internal/infra changes that a visitor wouldn't notice or care about.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
