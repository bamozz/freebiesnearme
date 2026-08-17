const PROD_HOSTS = ['freebiesnearme.app', 'www.freebiesnearme.app'];

export default function InstallBanner() {
  return (
    <div className="install-banner" id="installBanner">
      <div className="install-banner-inner">
        <div className="install-banner-text" id="installBannerText">
          <strong>Install this app</strong>
          Get quick access from your home screen
        </div>
        <div className="install-banner-actions">
          <button className="install-banner-btn" id="installBannerBtn" type="button">Install</button>
          <button className="install-banner-close" id="installBannerClose" type="button" aria-label="Dismiss">&times;</button>
        </div>
      </div>
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `(function(){
  var PROD_HOSTS = ${JSON.stringify(PROD_HOSTS)};
  if (PROD_HOSTS.indexOf(location.hostname) !== -1) return;
  if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js').catch(function(){}); }
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (isStandalone) return;

  var banner = document.getElementById('installBanner');
  var textEl = document.getElementById('installBannerText');
  var btnEl = document.getElementById('installBannerBtn');
  var closeEl = document.getElementById('installBannerClose');
  if (!banner) return;

  function show(){ banner.classList.add('show'); }
  function dismiss(){
    banner.classList.remove('show');
  }

  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS){
    // Safari has no beforeinstallprompt event at all, so this is the only
    // way to offer install there - shown immediately, no event to wait on.
    textEl.innerHTML = '<strong>Install this app</strong>Tap Share, then "Add to Home Screen"';
    btnEl.style.display = 'none';
    show();
  } else {
    // Follows the real browser signal: only appears once Chrome itself has
    // decided (via its own installability + engagement checks) that this
    // visit is eligible, and hands over the native one-tap prompt.
    var deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', function(e){
      e.preventDefault();
      deferredPrompt = e;
      show();
    });
    btnEl.addEventListener('click', function(){
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function(){
        deferredPrompt = null;
        dismiss();
      });
    });
  }
  closeEl.addEventListener('click', dismiss);
})();`,
        }}
      />
    </div>
  );
}
