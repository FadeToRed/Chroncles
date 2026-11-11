/* Fix per gli Avatar nelle Citazioni — v3
   - quote interni (con link #entry): avatar dell'autore, id "ffav_quote"
   - quote generici (senza link): nessun avatar, id "quote_generico"
   Pensato per girare con l'opzione "citazioni" (FFAV_quote) di Avatar Pack
   DISATTIVATA: cosi' fa tutto lui, subito, senza effetto prima/dopo.
   Se l'opzione resta attiva funziona lo stesso: ripassa dopo l'originale
   e ripulisce i suoi segnaposto. */
;(function () {
  if (window.__hxhQuoteAvatar) return;
  window.__hxhQuoteAvatar = true;

  var DEFAULT_AVATAR = 'https://upload.forumfree.net/i/ff13982804/Hunter/NoAvatar.png';
  var PLACEHOLDERS = ['default_avatar', 'RDGkT8W'];
  var AVATAR_SELECTORS = [
    '.post .avatar img',
    '.details .avatar img',
    '.details img[alt="Avatar"]',
    '.post .details img',
    '.avatar img',          /* mobile: avatar fuori da .details */
    'img.avatar'
  ];

  /* ---------- stili: inseriti subito, prima ancora che giri il JS sui post ---------- */
  function injectStyles() {
    if (document.getElementById('ffav-quote-fix-styles')) return;
    var css = '' +
      /* specificita' piu' alta dell'originale (#ffav_quote ... !important) */
      '.quote#ffav_quote{padding-left:83px !important;padding-bottom:5px !important;min-height:85px}' +
      /* spazio riservato ai quote interni gia' al primo disegno della pagina,
         cosi' il testo non "salta" quando arriva l'avatar */
      '.quote_top:has(a[href*="#entry"]) + .quote,' +
      '.quote_top:has(a[href*="#entry"]) + .quoteentry + .quote{padding-left:83px !important;padding-bottom:5px !important;min-height:85px}' +
      '.quoteentry img{width:60px;height:60px;float:left;margin-top:10px;margin-left:30px;padding:1px;' +
      'border:1px solid #D5D5D5;background:#FFF;box-shadow:0 2px 2px rgba(0,0,0,0.1)}';
    var style = document.createElement('style');
    style.id = 'ffav-quote-fix-styles';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  function isValidAvatar(img) {
    if (!img) return false;
    var src = img.getAttribute('src') || '';
    if (!src) return false;
    for (var i = 0; i < PLACEHOLDERS.length; i++) {
      if (src.indexOf(PLACEHOLDERS[i]) !== -1) return false;
    }
    return true;
  }

  function findAvatar(entryNumber) {
    var targetPost = document.getElementById('ee' + entryNumber);
    if (!targetPost) return DEFAULT_AVATAR;
    for (var i = 0; i < AVATAR_SELECTORS.length; i++) {
      var img = targetPost.querySelector(AVATAR_SELECTORS[i]);
      if (img && img.src) return img.src;
    }
    return DEFAULT_AVATAR;
  }

  function makeEntry(src) {
    var div = document.createElement('div');
    div.className = 'quoteentry hxh-quote-avatar';
    var img = document.createElement('img');
    img.alt = 'Avatar';
    img.onerror = function () { this.onerror = null; this.src = DEFAULT_AVATAR; };
    img.src = src;
    div.appendChild(img);
    return div;
  }

  /* Passata unica e ripetibile: rimette in ordine ogni quote. */
  function process() {
    var tops = document.querySelectorAll('.quote_top');
    for (var i = 0; i < tops.length; i++) {
      var top = tops[i];

      /* raccoglie gli avatar gia' presenti subito dopo il titolo del quote */
      var entries = [];
      var cur = top.nextElementSibling;
      while (cur && cur.classList.contains('quoteentry')) {
        entries.push(cur);
        cur = cur.nextElementSibling;
      }
      var quote = (cur && cur.classList.contains('quote')) ? cur : null;
      var link = top.querySelector('a[href*="#entry"]');
      var j;

      /* quote generico: niente avatar */
      if (!link) {
        for (j = 0; j < entries.length; j++) entries[j].parentNode.removeChild(entries[j]);
        if (quote) quote.id = 'quote_generico';
        continue;
      }

      if (quote) quote.id = 'ffav_quote';

      /* quote interno: tiene un solo avatar valido, toglie segnaposto e doppioni */
      var keep = null;
      for (j = 0; j < entries.length; j++) {
        if (!keep && isValidAvatar(entries[j].querySelector('img'))) keep = entries[j];
        else entries[j].parentNode.removeChild(entries[j]);
      }
      if (keep) continue;

      var m = (link.getAttribute('href') || '').match(/#entry(\d+)/);
      var src = m ? findAvatar(m[1]) : DEFAULT_AVATAR;
      top.parentNode.insertBefore(makeEntry(src), top.nextSibling);
    }
  }

  injectStyles();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', process);
  } else {
    process();
  }

  /* passate di sicurezza nel caso l'opzione citazioni di Avatar Pack sia
     ancora attiva e l'originale arrivi dopo di noi */
  function lateRuns() {
    process();
    setTimeout(process, 1500);
  }
  if (document.readyState === 'complete') {
    lateRuns();
  } else {
    window.addEventListener('load', lateRuns);
  }
})();
