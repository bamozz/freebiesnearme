// Loads the AdSense script, and shows the ad notice with its opt out.
//
// This file is requested only by visitors in Canada (outside Quebec) or the
// United States: middleware.ts sets the fbnm_ads cookie from the Cloudflare
// country and region headers, and a small inline snippet on every page adds
// this file only when that cookie is present. Other visitors never fetch it
// and never see the AdSense address in their HTML.
//
// Two more cookies belong to the visitor's own choice (both last a year, hold
// no personal data, and are needed to remember the choice):
//   fbnm_ads_off  the visitor turned Google ads off: nothing from Google loads
//   fbnm_ads_seen the visitor has seen the notice and kept ads on
(function () {
  var OFF = 'fbnm_ads_off';
  var SEEN = 'fbnm_ads_seen';
  var YEAR = 365 * 24 * 3600;

  function hasCookie(name) {
    return new RegExp('(?:^|;\\s*)' + name + '=1(?:;|$)').test(document.cookie);
  }
  function setCookie(name, seconds) {
    document.cookie = name + '=1; Path=/; Max-Age=' + seconds + '; SameSite=Lax; Secure';
  }

  // Turned off: Google's script is not requested and nothing is shown.
  if (hasCookie(OFF)) return;

  // First visit, or no choice made yet: draw the notice first, then request
  // Google's script, so the visitor can see what the ads do before anything
  // is sent to Google. The script is not held back until a click.
  function start() {
    if (!hasCookie(SEEN)) showNotice();
    loadGoogle();
  }
  function loadGoogle() {
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2407639793416759';
    document.head.appendChild(s);
  }
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start);

  function link(href, text) {
    var a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    a.target = '_blank';
    a.rel = 'noopener';
    return a;
  }

  function showNotice() {
    if (document.getElementById('fnmAdNotice')) return;

    var css = document.createElement('style');
    css.textContent =
      '#fnmAdNotice{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:1500;' +
      'width:min(560px,calc(100vw - 24px));box-sizing:border-box;padding:14px 16px;border-radius:12px;' +
      'background:#fff;color:#1c1c1c;border:1px solid #d6d1bf;box-shadow:0 6px 28px rgba(0,0,0,0.18);' +
      'font:14px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}' +
      '#fnmAdNotice p{margin:0 0 8px;}' +
      '#fnmAdNotice .fnm-ad-small{font-size:12.5px;color:#4b4b4b;}' +
      '#fnmAdNotice a{color:var(--city-primary-text,#274490);text-decoration:underline;}' +
      '#fnmAdNotice .fnm-ad-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}' +
      '#fnmAdNotice button{font:inherit;font-weight:600;border-radius:8px;padding:9px 14px;cursor:pointer;' +
      'border:1.5px solid var(--city-primary,#274490);}' +
      '#fnmAdNotice .fnm-ad-ok{background:var(--city-primary,#274490);color:#fff;}' +
      '#fnmAdNotice .fnm-ad-off{background:#fff;color:var(--city-primary-text,#274490);}';
    document.head.appendChild(css);

    var box = document.createElement('div');
    box.id = 'fnmAdNotice';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', 'Advertising notice');

    var p1 = document.createElement('p');
    p1.textContent = 'This site shows ads from Google, which may use cookies to show ads based on your visits to this and other sites.';
    box.appendChild(p1);

    var p2 = document.createElement('p');
    p2.className = 'fnm-ad-small';
    p2.appendChild(document.createTextNode('Manage your ad choices at '));
    p2.appendChild(link('https://adssettings.google.com/', 'adssettings.google.com'));
    p2.appendChild(document.createTextNode(', '));
    p2.appendChild(link('https://youradchoices.ca/', 'youradchoices.ca'));
    p2.appendChild(document.createTextNode(' (Canada) or '));
    p2.appendChild(link('https://www.aboutads.info/', 'aboutads.info'));
    p2.appendChild(document.createTextNode(' (United States). Or turn Google ads off here and Google\'s advertising script will not load for you. '));
    var priv = document.createElement('a');
    priv.href = '/privacy';
    priv.textContent = 'Privacy policy';
    p2.appendChild(priv);
    box.appendChild(p2);

    var actions = document.createElement('div');
    actions.className = 'fnm-ad-actions';

    var ok = document.createElement('button');
    ok.type = 'button';
    ok.className = 'fnm-ad-ok';
    ok.textContent = 'OK';
    ok.addEventListener('click', function () {
      setCookie(SEEN, YEAR);
      box.remove();
    });

    var off = document.createElement('button');
    off.type = 'button';
    off.className = 'fnm-ad-off';
    off.textContent = 'Turn off Google ads';
    off.addEventListener('click', function () {
      setCookie(OFF, YEAR);
      box.remove();
      // Reload so the page that already loaded Google's script is replaced by
      // one that never requests it: the choice takes effect at once.
      location.reload();
    });

    actions.appendChild(ok);
    actions.appendChild(off);
    box.appendChild(actions);
    document.body.appendChild(box);

    // On phones the tab bar sits at the bottom; stay above it. The bar may not
    // be on the page yet when this runs, so place again once the page has
    // loaded and whenever the window changes size.
    function place() {
      var tab = document.querySelector('.bottom-tabbar');
      var lift = tab && getComputedStyle(tab).display !== 'none' ? tab.offsetHeight + 8 : 12;
      box.style.bottom = lift + 'px';
    }
    place();
    window.addEventListener('load', place);
    window.addEventListener('resize', place);
  }
})();
