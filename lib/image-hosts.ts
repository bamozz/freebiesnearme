import cleared from '@/public/image-hosts.json';

// Listing pictures are shown only when the file is hosted by us or its host is
// on the cleared list in public/image-hosts.json (the one config file; the
// static city pages read the same file), or when the row records a reuse licence
// with the author and the source page, in which case the card also draws a
// credit line (components/PhotoCredit.tsx). Nothing is changed in the database:
// image_url stays on the row, it just is not displayed or put in JSON-LD.
const CLEARED_HOSTS = new Set((cleared.hosts as string[]).map((host) => host.toLowerCase()));

export type PictureRow = {
  image_url: string | null;
  image_licence?: string | null;
  image_author?: string | null;
  image_source?: string | null;
  image_fit?: string | null;
};

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

// Licences we can name and credit: CC BY 4.0 and CC BY-SA 4.0 only (older
// versions need the title in a crop credit; CC0 and public domain wait until the
// source's own deed link is stored). NC and ND never match. Keep in step with
// SAFE_LICENCE in the static city pages.
const SAFE_LICENCE = /^CC[ -]BY(?:-SA)?[ -]4\.0$/i;

export function hasLicenceRecord(row: PictureRow): boolean {
  return Boolean(
    row.image_url &&
      /^https:\/\//i.test(row.image_url) &&
      row.image_author &&
      row.image_licence &&
      SAFE_LICENCE.test(row.image_licence.trim()) &&
      row.image_source &&
      /^https?:\/\//i.test(row.image_source),
  );
}

export function licenceUrl(name: string): string | null {
  const n = name.trim();
  const by = /^CC[ -](BY(?:-SA)?)[ -](\d\.\d)$/i.exec(n);
  if (by) return `https://creativecommons.org/licenses/${by[1].toLowerCase()}/${by[2]}/`;
  if (/^CC0(?:[ -]1\.0)?$/i.test(n)) return 'https://creativecommons.org/publicdomain/zero/1.0/';
  return null;
}

export type PhotoCreditParts = {
  author: string;
  licence: string;
  licenceUrl: string | null;
  source: string;
  note: string;
};

// The parts of the credit line, or null when the row has no usable licence record.
export function creditFor(row: PictureRow): PhotoCreditParts | null {
  if (!hasLicenceRecord(row)) return null;
  const licence = (row.image_licence as string).trim();
  const needsChangeNote = /^CC[ -]BY/i.test(licence);
  return {
    author: row.image_author as string,
    licence,
    licenceUrl: licenceUrl(licence),
    source: row.image_source as string,
    note: needsChangeNote ? (row.image_fit === 'contain' ? 'Resized to fit.' : 'Resized and cropped to fit.') : '',
  };
}

// Returns the row unchanged when its picture may be shown, otherwise a copy
// with the picture removed so every card and JSON-LD built from it omits it.
export function withClearedImage<T extends PictureRow>(row: T): T {
  if (isClearedImageUrl(row.image_url)) return row;
  if (hasLicenceRecord(row)) {
    // A CC BY-SA picture is shown whole, resized only, so it is not adapted.
    return /BY-SA/i.test(row.image_licence ?? '') ? { ...row, image_fit: 'contain' } : row;
  }
  return { ...row, image_url: null };
}

export function withClearedImages<T extends PictureRow>(rows: T[]): T[] {
  return rows.map(withClearedImage);
}
