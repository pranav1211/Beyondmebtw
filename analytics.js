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
})();
