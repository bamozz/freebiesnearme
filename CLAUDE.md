# Freebies Near Me

Toronto free giveaways/events site. Two layers:

- `public/toronto/*.html` — the original static site (index, map, submit, feedback, advertise, changelog). Each page is self-contained: inline `<style>` and `<script>`, no build step, no shared component/module system between them.
- `app/` — a Next.js App Router layer for pSEO hub pages (`/toronto/{category}` and `/toronto/{neighbourhood}`), backed by `app/[city]/[hub]/page.tsx`. Shared logic/branding lives in `lib/` (`categories.ts`, `listing-display.ts`, `datetime.ts`, `jsonld.ts`) and `app/globals.css`/`app/layout.tsx`.

Data lives in Supabase. Writes to `listings` only happen through `api/submit-listing.js` (service role key, Turnstile-gated) — the anon key used client-side is read-only by RLS design, so don't try to insert/update via the anon key.

## Changelog

Whenever you ship a user-facing fix, feature, or improvement, add an entry to the top of the `CHANGELOG` array in `public/toronto/changelog.html` (newest first). Write it in plain language for site visitors, not commit-message style, grouped into New/Improved/Fixed sections. Skip pure internal/infra changes that a visitor wouldn't notice or care about.
