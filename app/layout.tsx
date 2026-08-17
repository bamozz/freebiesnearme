import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Freebies Near Me',
  description: 'Free giveaways, samples, and pop up events happening in Toronto right now.',
  icons: {
    icon: [
      { url: '/toronto/assets/favicon.svg', type: 'image/svg+xml' },
      { url: '/toronto/assets/favicon-192.png', type: 'image/png', sizes: '192x192' },
    ],
  },
};

export const viewport: Viewport = {
  colorScheme: 'light',
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
              <a href="/toronto/calendar">Calendar</a>
            </div>
            <div className="nav-right">
              <a className="btn-solid" href="/toronto/submit">Submit an event</a>
            </div>
          </div>
        </nav>
        <nav className="bottom-tabbar">
          <a href="/toronto" className="tab-item on">
            <span className="tab-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path d="M0 0h24v24H0z" fill="none" />
                <path
                  fill="currentColor"
                  d="m8.154 15.846l5.808-1.884l1.884-5.808l-5.807 1.885zm3.842-2.73q-.467 0-.79-.327q-.321-.327-.321-.793q0-.467.326-.79q.327-.321.793-.321q.467 0 .79.326q.322.327.322.793q0 .467-.327.79q-.327.322-.793.322M12.003 21q-1.867 0-3.51-.708q-1.643-.709-2.859-1.924t-1.925-2.856T3 12.003t.709-3.51Q4.417 6.85 5.63 5.634t2.857-1.925T11.997 3t3.51.709q1.643.708 2.859 1.922t1.925 2.857t.709 3.509t-.708 3.51t-1.924 2.859t-2.856 1.925t-3.509.709M12 20q3.344 0 5.672-2.328T20 12t-2.328-5.672T12 4T6.328 6.328T4 12t2.328 5.672T12 20m0-8"
                />
              </svg>
            </span>
            Explore
          </a>
          <a href="/toronto/map" className="tab-item">
            <span className="tab-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path d="M0 0h24v24H0z" fill="none" />
                <path
                  fill="currentColor"
                  d="m15 19.923l-6-2.1l-3.958 1.53q-.384.143-.713-.083T4 18.634V6.404q0-.268.13-.489t.378-.307L9 4.077l6 2.1l3.958-1.53q.384-.143.713.054t.329.588v12.384q0 .287-.159.498q-.158.212-.426.298zm-.5-1.22v-11.7l-5-1.745v11.7zm1 0L19 17.55V5.7l-3.5 1.304zM5 18.3l3.5-1.342v-11.7L5 6.45zM15.5 7.004v11.7zm-7-1.746v11.7z"
                />
              </svg>
            </span>
            Map
          </a>
          <a href="/toronto/calendar" className="tab-item">
            <span className="tab-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path d="M0 0h24v24H0z" fill="none" />
                <path
                  fill="currentColor"
                  d="M18.25 3h-.75V2H16v1H8V2H6.5v1h-.75A2.755 2.755 0 0 0 3 5.75v12.5A2.755 2.755 0 0 0 5.75 21h12.5A2.755 2.755 0 0 0 21 18.25V5.75A2.755 2.755 0 0 0 18.25 3M5.75 4.5h.75V6H8V4.5h8V6h1.5V4.5h.75c.69 0 1.25.56 1.25 1.25V7.5h-15V5.75c0-.69.56-1.25 1.25-1.25m12.5 15H5.75c-.69 0-1.25-.56-1.25-1.25V9h15v9.25c0 .69-.56 1.25-1.25 1.25"
                />
              </svg>
            </span>
            Calendar
          </a>
        </nav>
        {children}

        {/* Shared lightbox for any .card-thumb rendered by a page (e.g. the
            pSEO hub page's listing cards). Ported from public/toronto/
            index.html's lightbox - lives here in the root layout, driven by
            a plain delegated-click script below, so individual pages (which
            are Server Components) don't need to become client components
            just to open it. */}
        <div className="lightbox" id="lightbox">
          <span className="lightbox-close" id="lightboxClose">&times;</span>
          <div className="lightbox-frame">
            <img id="lightboxImg" src="" alt="Photo shared by a user" />
            <a
              className="lightbox-insta-badge"
              id="lightboxInstaBadge"
              target="_blank"
              rel="noopener"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path d="M0 0h24v24H0z" fill="none" />
                <path
                  fill="currentColor"
                  d="M16.25 3A4.75 4.75 0 0 1 21 7.75v8.5A4.75 4.75 0 0 1 16.25 21H8a4.75 4.75 0 0 1-4.75-4.75v-8.5A4.75 4.75 0 0 1 8 3zM8 4.5a3.25 3.25 0 0 0-3.25 3.25v8.5A3.25 3.25 0 0 0 8 19.5h8.25a3.25 3.25 0 0 0 3.25-3.25v-8.5a3.25 3.25 0 0 0-3.25-3.25zm4 2.75a4.75 4.75 0 1 1 0 9.5a4.75 4.75 0 0 1 0-9.5m0 1.5a3.25 3.25 0 1 0 0 6.5a3.25 3.25 0 0 0 0-6.5M17 6a1 1 0 1 1 0 2a1 1 0 0 1 0-2"
                />
              </svg>
              <span id="lightboxInstaHandle"></span>
            </a>
          </div>
        </div>
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `(function(){
  function instaMeta(value){
    if (!value) return null;
    var NON_PROFILE = {p:1, reel:1, reels:1, tv:1, stories:1, explore:1};
    var match = value.match(/instagram\\.com\\/([^/?#]+)/i);
    if (match){
      var segment = match[1];
      var isProfile = !NON_PROFILE[segment.toLowerCase()];
      return { url: value, label: isProfile ? ('@' + segment) : null };
    }
    var handle = value.replace(/^@/, '').trim();
    if (!handle) return null;
    return { url: 'https://instagram.com/' + handle, label: '@' + handle };
  }
  function init(){
    var lightboxEl = document.getElementById('lightbox');
    var lightboxImgEl = document.getElementById('lightboxImg');
    var lightboxInstaBadge = document.getElementById('lightboxInstaBadge');
    var lightboxInstaHandle = document.getElementById('lightboxInstaHandle');
    if (!lightboxEl) return;
    function openLightbox(url, instaUrl){
      lightboxImgEl.src = url;
      var insta = instaMeta(instaUrl);
      lightboxImgEl.style.cursor = insta ? 'pointer' : 'default';
      lightboxImgEl.onclick = insta ? function(){ window.open(insta.url, '_blank', 'noopener'); } : null;
      if (insta){
        lightboxInstaBadge.href = insta.url;
        lightboxInstaHandle.textContent = insta.label || '';
        lightboxInstaHandle.style.display = insta.label ? '' : 'none';
        lightboxInstaBadge.classList.add('show');
      } else {
        lightboxInstaBadge.classList.remove('show');
      }
      lightboxEl.classList.add('open');
    }
    function closeLightbox(){
      lightboxEl.classList.remove('open');
      lightboxImgEl.src = '';
      lightboxImgEl.onclick = null;
      lightboxInstaBadge.classList.remove('show');
    }
    document.addEventListener('click', function(e){
      var thumb = e.target.closest && e.target.closest('.card-thumb');
      if (thumb && thumb.dataset.image){
        e.stopPropagation();
        openLightbox(thumb.dataset.image, thumb.dataset.insta || null);
      }
    });
    lightboxEl.addEventListener('click', function(e){
      if (e.target === lightboxEl) closeLightbox();
    });
    var closeBtn = document.getElementById('lightboxClose');
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();`,
          }}
        />

      </body>
    </html>
  );
}
