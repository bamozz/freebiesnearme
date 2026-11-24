import { creditFor, type PictureRow } from '@/lib/image-hosts';

// The credit line under a listing picture. It draws only when the row records a
// reuse licence, the author and the source page (see lib/image-hosts.ts); our
// own pictures and rows without a record show no line.
export default function PhotoCredit({ listing }: { listing: PictureRow }) {
  const credit = creditFor(listing);
  if (!credit) return null;
  return (
    <div className="photo-credit">
      {credit.label}: {credit.author},{' '}
      {credit.licenceUrl ? (
        <a href={credit.licenceUrl} target="_blank" rel="noopener">
          {credit.licence}
        </a>
      ) : (
        credit.licence
      )}
      .{' '}
      <a href={credit.source} target="_blank" rel="noopener">
        Source
      </a>
      .{credit.note ? ` ${credit.note}` : ''}
    </div>
  );
}
