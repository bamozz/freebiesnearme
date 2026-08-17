// Shared text-content screening for anything a hunter/brand types into a
// public-facing field (listing brand/description, update report links,
// advertise inquiries). Deliberately simple word-boundary matching, not a
// full profanity-detection library - catches the obvious cases without
// pulling in a dependency, and false positives are cheap to fix by editing
// this list.
//
// This only screens TEXT. It cannot and does not screen uploaded photo
// CONTENT - that needs a real image-moderation API, which is a separate,
// explicit decision (cost + provider) this file doesn't make on its own.

const BLOCKED_TERMS = [
  // Profanity
  'fuck', 'shit', 'ass(?:hole)?', 'bitch', 'bastard', 'dick(?:head)?', 'pussy',
  'cunt', 'cock', 'twat', 'wank(?:er)?', 'douche(?:bag)?', 'motherfucker',
  // Slurs and hateful terms (kept broad on purpose - false positives here
  // are far cheaper than a slur reaching a public listing page)
  'nigger', 'nigga', 'faggot', 'fag', 'retard(?:ed)?', 'tranny', 'spic',
  'chink', 'kike', 'wetback', 'coon', 'gook',
  // Sexual/explicit content unrelated to any legitimate listing on this site
  'porn(?:hub|ography)?', 'xxx', 'nsfw', 'onlyfans', 'nude[sz]?', 'sex tape',
];

const BLOCKED_PATTERN = new RegExp(`\\b(${BLOCKED_TERMS.join('|')})\\b`, 'i');

export function containsBlockedContent(text) {
  return BLOCKED_PATTERN.test(String(text || ''));
}
