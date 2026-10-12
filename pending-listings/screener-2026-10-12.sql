-- Freebies Near Me screener run: 2026-10-12
-- 1 new listing found and verified this run.
--
-- Sources checked:
--   - Instagram (torontodiscounts, toronto_popup777, todotoronto): BLOCKED
--     (HTTP 429 Too Many Requests on two attempts each, ~30 min apart).
--   - https://ma.to/events/toronto/today: reachable, returned a day-view
--     page. Everything on it was excluded: most items were paid/discount
--     offers (BOGO/gift-with-purchase conditioned on a minimum spend,
--     % off, prix fixe), out of geographic scope (Mushroom Hunting, in
--     woods outside Toronto), or too vague to verify (no address/price
--     stated, e.g. "Hang Out at bevy", "YMCA Health & Fitness Open").
--     "Sunday Variety Market" at St. Lawrence Market looked promising
--     (free, 70+ vendors) but the page's own date was self-contradictory
--     (titled "Sunday", but the slug/URL date was Monday Oct 12), and a
--     follow-up web search found the market's known 2026 dates only
--     through late August with no confirmation it's still running in
--     October — excluded per "if you can't confirm it, leave it out."
--   - https://www.eventbrite.ca/d/canada--toronto/free--events/: BLOCKED
--     (HTTP 405 Method Not Allowed on two attempts).
--   - https://torontounion.ca/toronto-union-events/category/union-samples/month/:
--     reachable. "Union Samples: Ren's Pets" (Thu Oct 15, York Kiosk,
--     7:30am-7pm) looked new, but the union-station neighbourhood hub
--     page (https://www.freebiesnearme.app/toronto/union-station) shows
--     this exact Ren's Pets / Oct 15 listing already live — duplicate,
--     excluded. "Union Samples: Toffifee" (Oct 7-8) is already in the
--     past as of this run — not actionable either way.
--   - https://thewelltoronto.com/whats-on/: reachable, but every listed
--     program either had no price/admission statement at all or was a
--     paid item ("Well Fed Under $10" is a discount, not free) — none
--     met the explicit-free-or-guaranteed-free-item bar, so nothing
--     included from this source this run.
--   - https://stacktmarket.com/events/: reachable, 37 events listed.
--     Cross-checked every STACKT event against the stackt-market
--     neighbourhood hub (https://www.freebiesnearme.app/toronto/stackt-market),
--     which already lists: ART MONTH at STACKT, Shop Local Save Local @
--     STACKT, Lamar Perfumes, The Harvest & Scare Craft Market, Pumpkin
--     Carving @ STACKT, Short Film Movie Night @ STACKT, and Kreate
--     Market @ STACKT — all treated as duplicates and excluded, including
--     their other recurring dates (per the "if the brand name already
--     appears at all, don't add it again" rule). Paid items (Rooks to
--     Cooks, Goat/Bunny Yoga, BOLD Pilates, the Lamar perfume-making
--     workshop) excluded as not free. Recurring venue programming with
--     no giveaway/pop-up/market angle (Mahjong Meetup, Local Artist
--     Showcase, Live Music Series, TD Insurance Elevator Pitch) excluded
--     as not matching this site's focus. "Winter Stoke @ STACKT" was new,
--     non-duplicate, in-scope, and explicitly free with giveaways — kept
--     below.
--
-- Duplicate cross-check: https://www.freebiesnearme.app/toronto/calendar
-- (today-only view) plus the stackt-market and union-station
-- neighbourhood hub pages, per the brand+date duplicate rule.
--
-- Timezone check: Oct 24, 2026 is within EDT (UTC-4). 7:00pm local =
-- 19:00 + 4 = 23:00 UTC. No end time was given by the source, so
-- end_time is left NULL rather than guessed.

-- Source: https://stacktmarket.com/events/ ("Winter Stoke @ STACKT", Oct 24, 2026, 7:00pm,
-- free, "The North Face film premiere, après-ski vibes, music, drinks, and giveaways.")
-- Start time only, no end time given by source.
INSERT INTO listings (
  brand, category, neighbourhood, address, lat, lng, what,
  start_time, end_time, claimed_count, total_count, sponsored,
  submitted_by, submitter_contact, moderation_status, image_url,
  insta_url, signup_url, city_slug, category_slug, neighbourhood_slug, is_active
) VALUES (
  'The North Face', 'concert_screening', 'Stackt Market', '28 Bathurst St, Toronto, ON M5V 0C6',
  43.6412082, -79.4014554,
  'Winter Stoke: free North Face film premiere with après-ski vibes, music, drinks, and giveaways.',
  '2026-10-24 23:00:00+00', NULL, 0, NULL, false,
  'hunter', NULL, 'approved', NULL,
  NULL, NULL, 'toronto', 'concert-screening', 'stackt-market', true
);
