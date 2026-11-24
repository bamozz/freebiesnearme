import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import BottomTabbar from '@/app/components/BottomTabbar';
import SiteHeader from '@/app/components/SiteHeader';
import InstallBanner from '@/app/components/InstallBanner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Freebies Near Me',
  metadataBase: new URL('https://www.freebiesnearme.app'),
  description: 'Free giveaways, samples, classes and pop up events in Toronto and New York, checked by our team and updated daily.',
  openGraph: { siteName: 'Freebies Near Me', type: 'website', locale: 'en_CA' },
  // Tells AdSense which account owns this site. It loads nothing and sets no
  // cookies, so every visitor gets it. The AdSense script itself is added only
  // for visitors in Canada or the United States (see the inline gate below).
  other: { 'google-adsense-account': 'ca-pub-2407639793416759' },
  manifest: '/manifest.json',
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
        {/* Google Analytics (base page view only), the same tag as the static
            pages in public/. */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-SRH6EG57P0" strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-SRH6EG57P0');`}
        </Script>
        {/* Ads only for Canada and the United States. middleware.ts sets the
            fbnm_ads cookie from the Cloudflare country header; this snippet
            adds /ad-loader.js (which loads AdSense) only when it is present.
            Same snippet as the static pages in public/. */}
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: `try{if(/(?:^|;\\s*)fbnm_ads=1(?:;|$)/.test(document.cookie)){var a=document.createElement('script');a.src='/ad-loader.js?v=3';a.async=true;document.head.appendChild(a);}}catch(e){}`,
          }}
        />
        {/* Rendered as plain <link> tags (matching how the static
            public/toronto/*.html pages load these same fonts) rather than
            next/font, so Next.js-rendered pages stay visually identical to
            the rest of the site without a second font-loading mechanism. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
        <SiteHeader />
        <BottomTabbar />
        <InstallBanner />
        {children}

        {/* Shared lightbox for any .card-media rendered by a page (e.g. the
            pSEO hub page's listing cards). Ported from public/toronto/
            index.html's lightbox - lives here in the root layout, driven by
            a plain delegated-click script below, so individual pages (which
            are Server Components) don't need to become client components
            just to open it. */}
        <div className="lightbox" id="lightbox">
          <span className="lightbox-close" id="lightboxClose">&times;</span>
          <div className="lightbox-frame">
            <img id="lightboxImg" src="" alt="Event photo on freebiesnearme" />
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
            <div className="lightbox-credit" id="lightboxCredit"></div>
            <a className="lightbox-report" id="lightboxReport" href="/feedback">
              Report a photo
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
    value = String(value).trim();
    var match = value.match(/^(?:https?:\\/\\/)?(?:[a-z0-9-]+\\.)?instagram\\.com\\/([^/?#]+)/i);
    if (match){
      var segment = match[1];
      var isProfile = !NON_PROFILE[segment.toLowerCase()];
      return { url: /^https?:\\/\\//i.test(value) ? value : 'https://' + value, label: isProfile ? ('@' + segment) : null };
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
    var lightboxReportEl = document.getElementById('lightboxReport');
    var lightboxCreditEl = document.getElementById('lightboxCredit');
    if (!lightboxEl) return;
    // Report a photo: opens the feedback form on the issue tab with the
    // listing name and the picture's address filled in.
    function reportPhotoHref(url, listingRef){
      var city = location.pathname.split('/')[1] || '';
      return '/feedback?city=' + encodeURIComponent(city) + '&mode=issue&topic=photo&listing=' + encodeURIComponent(String(listingRef || '').slice(0, 120)) + '&photo=' + encodeURIComponent(String(url || '').slice(0, 300));
    }
    var SAFE_LICENCE = /^(?:CC[ -]BY(?:-SA)?[ -]\\d\\.\\d|CC0(?:[ -]1\\.0)?|public domain)$/i;
    function licenceUrl(name){
      var n = String(name).trim();
      var m = /^CC[ -](BY(?:-SA)?)[ -](\\d\\.\\d)$/i.exec(n);
      if (m) return 'https://creativecommons.org/licenses/' + m[1].toLowerCase() + '/' + m[2] + '/';
      if (/^CC0(?:[ -]1\\.0)?$/i.test(n)) return 'https://creativecommons.org/publicdomain/zero/1.0/';
      return null;
    }
    function creditFromThumb(ds){
      if (!ds.author || !ds.licence || !/^https?:\\/\\//i.test(ds.imageSource || '')) return null;
      return { author: ds.author, licence: ds.licence, source: ds.imageSource };
    }
    function fillCredit(el, c){
      if (!el) return;
      el.textContent = '';
      if (!c || !SAFE_LICENCE.test(String(c.licence).trim())){ el.classList.remove('show'); return; }
      function stop(e){ e.stopPropagation(); }
      el.appendChild(document.createTextNode('Photo: ' + c.author + ', '));
      var url = licenceUrl(c.licence);
      if (url){
        var a = document.createElement('a');
        a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = c.licence; a.addEventListener('click', stop);
        el.appendChild(a);
      } else {
        el.appendChild(document.createTextNode(c.licence));
      }
      el.appendChild(document.createTextNode('. '));
      var s = document.createElement('a');
      s.href = c.source; s.target = '_blank'; s.rel = 'noopener'; s.textContent = 'Source'; s.addEventListener('click', stop);
      el.appendChild(s);
      el.appendChild(document.createTextNode('.' + (/^CC[ -]BY/i.test(String(c.licence)) ? ' Resized to fit.' : '')));
      el.classList.add('show');
    }
    function openLightbox(url, instaUrl, listingRef, credit){
      lightboxImgEl.src = url;
      fillCredit(lightboxCreditEl, credit || null);
      if (lightboxReportEl) lightboxReportEl.href = reportPhotoHref(url, listingRef);
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
      if (lightboxCreditEl) lightboxCreditEl.classList.remove('show');
    }
    document.addEventListener('click', function(e){
      var thumb = e.target.closest && e.target.closest('.card-media');
      if (thumb && thumb.dataset.image){
        e.stopPropagation();
        var card = thumb.closest('.card');
        var brandEl = card && card.querySelector('.card-brand');
        openLightbox(thumb.dataset.image, thumb.dataset.insta || null, brandEl ? brandEl.textContent : '', creditFromThumb(thumb.dataset));
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
