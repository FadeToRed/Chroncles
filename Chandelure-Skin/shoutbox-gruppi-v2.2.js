/* Shoutbox e tagboard: colore del gruppo su bordo dell'avatar e nickname.
   Il gruppo di chi scrive si chiede a ForumFree tramite /api.php?mid=ID1,ID2,...
   (risponde a tutti, anche agli ospiti, e dice il gruppo di ogni utente).
   Gli utenti semplici hanno gruppo 0: per loro la classe è "utente", come nelle statistiche.
   Le risposte vengono ricordate nel browser per qualche ora, così non si rifà la
   richiesta a ogni pagina. Lo script mette sul messaggio le classi "wl-gr" e gruppoN (o "utente");
   il colore lo decide il CSS (le stesse regole dei gruppi delle statistiche).
   Su GitHub/jsDelivr va così com'è; se lo incolli direttamente in ForumFree, mettilo tra <script> e </script>. */
(function () {
  var CHIAVE = 'wl-gruppi-v3'; // cambiata: le voci salvate dalla v2 non avevano gli utenti semplici
  var DURATA = 6 * 60 * 60 * 1000; // dopo 6 ore il gruppo salvato si ricontrolla
  var cache = {};        // id -> { g: numero gruppo, t: quando è stato letto }
  var inCorso = {};      // id già chiesti e in attesa di risposta
  var timer = null;

  try { cache = JSON.parse(localStorage.getItem(CHIAVE) || '{}') || {}; } catch (e) { cache = {}; }

  function salva() {
    try { localStorage.setItem(CHIAVE, JSON.stringify(cache)); } catch (e) {}
  }

  // shoutbox: l'id è in data-uid; tagboard: è nella classe userN del nick
  function messaggi() {
    var out = [];
    var hb = document.querySelectorAll('.hb-message[data-uid]');
    for (var i = 0; i < hb.length; i++) out.push({ el: hb[i], id: hb[i].getAttribute('data-uid') });
    var tag = document.querySelectorAll('#tagObject > li');
    for (var j = 0; j < tag.length; j++) {
      var n = tag[j].querySelector('a.nickname');
      var m = n && n.className.match(/\buser(\d+)\b/);
      if (m) out.push({ el: tag[j], id: m[1] });
    }
    return out;
  }

  function metti(msg, g) {
    var giusta = g > 0 ? 'gruppo' + g : 'utente';
    var cls = msg.className.split(' ');
    var nuova = [];
    for (var i = 0; i < cls.length; i++) {
      // tolgo un eventuale gruppo vecchio (utente spostato di gruppo)
      if (!/^(gruppo\d+|utente)$/.test(cls[i]) || cls[i] === giusta) nuova.push(cls[i]);
    }
    if (nuova.indexOf(giusta) < 0) nuova.push(giusta);
    if (nuova.indexOf('wl-gr') < 0) nuova.push('wl-gr');
    var s = nuova.join(' ');
    if (s !== msg.className) msg.className = s;
  }

  function colora() {
    var msg = messaggi();
    for (var i = 0; i < msg.length; i++) {
      var c = cache[msg[i].id];
      if (c && c.g !== null) metti(msg[i].el, c.g);
    }
  }

  function chiedi() {
    var msg = messaggi();
    var adesso = Date.now();
    var ids = [];
    for (var i = 0; i < msg.length; i++) {
      var id = msg[i].id;
      if (!id || id === '0' || inCorso[id] || ids.indexOf(id) >= 0) continue;
      var c = cache[id];
      if (!c || adesso - c.t > DURATA) ids.push(id);
    }
    if (!ids.length) return;

    // a blocchi, per non fare URL troppo lunghi
    for (var k = 0; k < ids.length; k += 40) {
      richiesta(ids.slice(k, k + 40));
    }
  }

  function richiesta(ids) {
    for (var i = 0; i < ids.length; i++) inCorso[ids[i]] = true;
    fetch('/api.php?mid=' + ids.join(','), { credentials: 'omit' })
      .then(function (r) { return r.json(); })
      .then(function (dati) {
        var adesso = Date.now();
        for (var i = 0; i < ids.length; i++) {
          var u = dati['m' + ids[i]];
          // anche il gruppo 0 (utente semplice) e gli utenti non trovati vanno ricordati,
          // altrimenti verrebbero richiesti di nuovo a ogni nuovo messaggio
          cache[ids[i]] = { g: (u && u.group) ? Number(u.group.id) || 0 : null, t: adesso };
        }
        salva();
        colora();
      })
      .catch(function () {})
      .then(function () {
        for (var i = 0; i < ids.length; i++) delete inCorso[ids[i]];
      });
  }

  function aggiorna() {
    colora();   // subito con quello che già si sa
    chiedi();   // poi chiede a ForumFree chi manca o è vecchio
  }

  function start() {
    aggiorna();
    // la shoutbox carica i messaggi dopo la pagina e ne aggiunge di nuovi mentre è aperta
    new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(aggiorna, 150);
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
