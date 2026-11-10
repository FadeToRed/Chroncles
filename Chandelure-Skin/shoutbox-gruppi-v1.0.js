/* Shoutbox: colore del gruppo su bordo dell'avatar e nickname.
   La shoutbox non dice a che gruppo appartiene chi scrive, ma le liste degli utenti
   (online, ultime 24 ore, ecc.) sì: lo script legge da lì "utente → gruppo",
   lo ricorda nel browser e mette la classe gruppoN sul messaggio. Il colore lo decide il CSS
   (le stesse regole dei gruppi delle statistiche).
   Su GitHub/jsDelivr va così com'è; se lo incolli direttamente in ForumFree, mettilo tra <script> e </script>. */
(function () {
  var CHIAVE = 'wl-gruppi';

  function leggiMappa() {
    var m = {};
    try { m = JSON.parse(localStorage.getItem(CHIAVE) || '{}'); } catch (e) {}
    var link = document.querySelectorAll('a[href*="MID="]');
    for (var i = 0; i < link.length; i++) {
      var g = link[i].className.match(/\bgruppo(\d+)\b/);
      var id = (link[i].href.match(/MID=(\d+)/) || [])[1];
      if (g && id) m[id] = g[1];
    }
    try { localStorage.setItem(CHIAVE, JSON.stringify(m)); } catch (e) {}
    return m;
  }

  function colora(mappa) {
    var msg = document.querySelectorAll('.hb-message[data-uid]');
    for (var i = 0; i < msg.length; i++) {
      var g = mappa[msg[i].getAttribute('data-uid')];
      if (g && !msg[i].classList.contains('gruppo' + g)) msg[i].classList.add('gruppo' + g);
    }
  }

  function start() {
    var mappa = leggiMappa();
    colora(mappa);
    // la shoutbox carica i messaggi dopo la pagina e ne aggiunge di nuovi mentre è aperta
    new MutationObserver(function () { colora(mappa); })
      .observe(document.body, { childList: true, subtree: true });
    // le liste delle ultime 24 ore arrivano in ritardo: rileggo la mappa dopo qualche secondo
    setTimeout(function () { mappa = leggiMappa(); colora(mappa); }, 4000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
