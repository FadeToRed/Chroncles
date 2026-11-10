<script>
/* Menu a scomparsa: sotto i 1000px il menu laterale si nasconde
   e si apre/chiude con il pulsante in alto a sinistra.
   Si chiude anche cliccando fuori o premendo Esc. */
(function () {
  var LIMITE = 999; // stesso numero della @media nel CSS

  function start() {
    if (document.querySelector('.wl-menu-btn')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wl-menu-btn';
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">' +
        '<g class="wl-righe"><path d="M4 6.5h16"/><path d="M4 12h16"/><path d="M4 17.5h16"/></g>' +
        '<g class="wl-x"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></g>' +
      '</svg>';

    var velo = document.createElement('div');
    velo.className = 'wl-menu-velo';

    document.body.appendChild(velo);
    document.body.appendChild(btn);

    function imposta(aperto) {
      document.body.classList.toggle('wl-menu-aperto', aperto);
      btn.setAttribute('aria-expanded', aperto ? 'true' : 'false');
      btn.setAttribute('aria-label', aperto ? 'Chiudi il menu' : 'Apri il menu');
    }
    imposta(false);

    btn.addEventListener('click', function () {
      imposta(!document.body.classList.contains('wl-menu-aperto'));
    });
    velo.addEventListener('click', function () { imposta(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') imposta(false);
    });

    // se la finestra torna larga, il menu torna normale
    var mq = window.matchMedia('(max-width: ' + LIMITE + 'px)');
    var chiudi = function (m) { if (!m.matches) imposta(false); };
    if (mq.addEventListener) mq.addEventListener('change', chiudi);
    else mq.addListener(chiudi);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
</script>
