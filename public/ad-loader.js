// Loads the AdSense script. This file is requested only by visitors in Canada
// or the United States: middleware.ts sets the fbnm_ads cookie from the
// Cloudflare country header, and a small inline snippet on every page adds this
// file only when that cookie is present. Other visitors never fetch it and
// never see the AdSense address in their HTML.
(function () {
  var s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2407639793416759';
  document.head.appendChild(s);
})();
