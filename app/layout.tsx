import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Freebies Near Me',
  description: 'Free giveaways, samples, and pop up events happening in Toronto right now.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Rendered as plain <link> tags (matching how the static
            public/toronto/*.html pages load these same fonts) rather than
            next/font, so Next.js-rendered pages stay visually identical to
            the rest of the site without a second font-loading mechanism. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
        <nav>
          <div className="nav-inner">
            <a className="logo" href="/toronto">Freebies Near Me</a>
            <div className="nav-links">
              <a href="/toronto">Explore</a>
              <a href="/toronto/map">Map</a>
            </div>
          </div>
        </nav>
        {children}
        <footer>
          <div className="footer-inner">
            <a className="logo" href="/toronto">Freebies Near Me</a>
            <div className="footer-links">
              <a className="feedback-link" href="/toronto/advertise">Advertise</a>
              <a className="feedback-link" href="/toronto/feedback">Feedback</a>
              <a className="feedback-link" href="/toronto/changelog">Changelog</a>
            </div>
            <p>Listings shown are reviewed and confirmed by the Freebies Near Me team.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
