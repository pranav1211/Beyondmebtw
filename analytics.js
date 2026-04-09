// Site-wide analytics - GoatCounter
// Loaded on all pages for visitor tracking with bot filtering
(function () {
  var GC_SITE = 'beyondmebtw';

  // Bot detection - skip tracking for bots
  var ua = navigator.userAgent || '';
  if (navigator.webdriver) return;
  if (ua.length < 10) return;
  if (/bot|crawler|spider|crawling|headless|phantom|selenium|puppeteer|lighthouse|pagespeed|pingdom|uptimerobot/i.test(ua)) return;

  var s = document.createElement('script');
  s.async = true;
  s.dataset.goatcounter = 'https://' + GC_SITE + '.goatcounter.com/count';
  s.src = '//gc.zgo.at/count.js';
  document.body.appendChild(s);

  // Live presence heartbeat
  var LIVE_KEY = 'bmb_live';
  var vid = Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
  var path = location.pathname;

  function beat() {
    try {
      var d = JSON.parse(localStorage.getItem(LIVE_KEY) || '{}');
      var now = Date.now();
      d[vid] = { p: path, t: now };
      for (var id in d) { if (now - d[id].t > 8000) delete d[id]; }
      localStorage.setItem(LIVE_KEY, JSON.stringify(d));
    } catch (e) {}
  }

  function leave() {
    try {
      var d = JSON.parse(localStorage.getItem(LIVE_KEY) || '{}');
      delete d[vid];
      localStorage.setItem(LIVE_KEY, JSON.stringify(d));
    } catch (e) {}
  }

  beat();
  setInterval(beat, 3000);
  window.addEventListener('beforeunload', leave);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) leave(); else beat();
  });
})();
