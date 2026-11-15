import cleared from '@/public/image-hosts.json';

// Listing pictures are shown only when the file is hosted by us or its host is
// on the cleared list in public/image-hosts.json (the one config file; the
// static city pages read the same file). Nothing is changed in the database:
// image_url stays on the row, it just is not displayed or put in JSON-LD.
const CLEARED_HOSTS = new Set((cleared.hosts as string[]).map((host) => host.toLowerCase()));

export function isClearedImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  // A root relative path is one of our own files.
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && CLEARED_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

// Returns the row unchanged when its picture is cleared, otherwise a copy
// with the picture removed so every card and JSON-LD built from it omits it.
export function withClearedImage<T extends { image_url: string | null }>(row: T): T {
  return isClearedImageUrl(row.image_url) ? row : { ...row, image_url: null };
}

export function withClearedImages<T extends { image_url: string | null }>(rows: T[]): T[] {
  return rows.map(withClearedImage);
}
