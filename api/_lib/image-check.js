// Confirms that the image a screener row points at really loads as a picture,
// from a site other than its own. A listing card with a dead or blocked image
// link looks worse than one with no image, so api/screener-insert.js rejects the
// row and the routine looks for another image.
//
// Fetching only the first 64 KB keeps a batch of 30 rows quick: the content
// type and a minimum size are enough to catch a 404 page, a placeholder, a
// tracking pixel or a hotlink block.

const FETCH_TIMEOUT_MS = 8000;
const SAMPLE_BYTES = 65536;
const MIN_IMAGE_BYTES = 5000;
const IMAGE_TYPE = /^image\/(jpeg|jpg|png|webp|gif|avif)\b/i;

// Returns { ok: true } or { ok: false, reason }.
export async function checkImage(url, fetchImpl = fetch) {
  let res;
  try {
    res = await fetchImpl(url, {
      headers: {
        'User-Agent': 'freebiesnearme-verify/1.0 (+https://www.freebiesnearme.app)',
        // Same referrer a visitor's browser sends, so a hotlink block shows up here.
        Referer: 'https://www.freebiesnearme.app/',
        Accept: 'image/*',
        Range: `bytes=0-${SAMPLE_BYTES - 1}`,
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (e) {
    return { ok: false, reason: 'image_url could not be fetched' };
  }
  if (!res.ok) {
    return { ok: false, reason: `image_url returned HTTP ${res.status}` };
  }
  if (!IMAGE_TYPE.test(res.headers.get('content-type') || '')) {
    return { ok: false, reason: 'image_url is not a jpeg, png, webp, gif or avif image' };
  }

  let bytes = 0;
  try {
    const reader = res.body.getReader();
    while (bytes < SAMPLE_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
    }
    await reader.cancel();
  } catch (e) {
    return { ok: false, reason: 'image_url could not be read' };
  }
  if (bytes < MIN_IMAGE_BYTES) {
    return { ok: false, reason: 'image_url is too small to be a real photo or poster' };
  }
  return { ok: true };
}

// One result per input url, in order; rows without an image pass through.
export function checkImages(urls, fetchImpl = fetch) {
  return Promise.all(urls.map((url) => (url ? checkImage(url, fetchImpl) : { ok: true })));
}
