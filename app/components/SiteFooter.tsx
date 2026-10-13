import { getCity } from '@/lib/cities';

type CrosslinkItem = { slug: string; label: string };

export default function SiteFooter({
  city,
  categories,
  neighbourhoods,
}: {
  city: string;
  categories: CrosslinkItem[];
  neighbourhoods: CrosslinkItem[];
}) {
  const cityName = getCity(city)?.name ?? 'Toronto';
  const base = `/${getCity(city)?.slug ?? 'toronto'}`;
  return (
    <footer>
      <div className="footer-inner">
        <a className="logo" href={base}>Freebies <span className="accent">Near Me</span> <span className="logo-city">{cityName}</span></a>
        <div className="footer-links">
          <a className="feedback-link" href={`${base}/advertise`}>Advertise</a>
          <a className="feedback-link" href="/feedback">Feedback</a>
          <a className="feedback-link" href={`${base}/changelog`}>Changelog</a>
          <a className="feedback-link" href="/about">About</a>
          <a className="feedback-link" href="/privacy">Privacy</a>
          <a className="feedback-link" href="/terms">Terms</a>
          <a className="feedback-link" href="/">All cities</a>
        </div>
        <p>Listings shown are reviewed and confirmed by the Freebies Near Me team.</p>
        <div className="footer-hubs">
          <p>
            <span>Categories:</span>{' '}
            {categories.map((c, i, arr) => (
              <span key={c.slug}>
                <a href={`/${city}/${c.slug}`}>{c.label}</a>
                {i < arr.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
          <p>
            <span>Neighbourhoods:</span>{' '}
            {neighbourhoods.map((n, i, arr) => (
              <span key={n.slug}>
                <a href={`/${city}/${n.slug}`}>{n.label}</a>
                {i < arr.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
