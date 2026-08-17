import type { Metadata, Viewport } from 'next';
import BottomTabbar from '@/app/components/BottomTabbar';
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
        <BottomTabbar />
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
