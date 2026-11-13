/**
 * Tabella Homepage
 *
 * @description Parti dinamiche della tabella in homepage:
 * - slideshow "Ultimi Codici GDR, Skin e Tabelle" (da config)
 * - "Ultime risorse grafiche" con scheda al passaggio del mouse (da config)
 * - (Mis)Fortune Teller: pubblica una frase a caso nel topic (up game)
 *
 * @requires SkyFramework
 * @requires window.TABELLA_HOME_CONFIG
 * @requires window.FORTUNE_TELLER_FRASI (solo per il Fortune Teller)
 *
 * @version 1.0.2
 */

;(function () {
  'use strict';

  if (!window.SkyFramework)        { console.warn('[TabellaHome] SkyFramework non trovato!'); return; }
  if (!window.TABELLA_HOME_CONFIG) { console.warn('[TabellaHome] TABELLA_HOME_CONFIG non trovato!'); return; }

  const Sky = window.SkyFramework;
  const LOG = '[TabellaHome]';
  const CFG = window.TABELLA_HOME_CONFIG;
  const esc = Sky.str.esc;

  // fiammella della skin, usata come segno davanti a titoli e regole
  const FIAMMA = function (w, h) {
    return '<svg width="' + w + '" height="' + h + '" viewBox="10 0 80 100" aria-hidden="true">'
      + '<path fill="var(--sette)" d="' + Sky.ui.ICONS.flame + '"/></svg>';
  };
  const FRECCIA = function (d) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  };

  /** "del <b>data</b>" solo se la data c'è */
  function conData(data) {
    return data ? ' <span>del <b>' + esc(data) + '</b></span>' : '';
  }

  // -----------------------------------------------
  //  SLIDESHOW
  // -----------------------------------------------

  function slideshow() {
    const box = document.getElementById('tbh-slideshow');
    const c = CFG.slideshow || {};
    const slide = c.slide || [];
    if (!box || !slide.length) return;

    // il titolo è già nell'HTML: lo sposto nell'intestazione accanto ai pallini
    const titolo = box.querySelector('.titolo-slideshow');
    const hd = Sky.dom.create('div', { class: 'tbh-ss-hd' });
    if (titolo) hd.appendChild(titolo);
    const dots = Sky.dom.create('div', { class: 'tbh-ss-dots' });
    hd.appendChild(dots);

    const vp = Sky.dom.create('div', { class: 'tbh-ss-vp' });
    const track = Sky.dom.create('div', { class: 'tbh-ss-track' });
    track['inn' + 'erHTML'] = slide.map(function (s) {
      return '<a class="tbh-ss-slide" href="' + esc(s.link) + '">'
        + '<img src="' + esc(s.immagine) + '" alt="' + esc(s.titolo) + '">'
        + '<span class="tbh-ss-bar">' + FIAMMA(10, 12)
        +   '<span class="tbh-ss-titolo">' + esc(s.titolo) + '</span>' + conData(s.data)
        +   (s.tipo ? '<span class="tbh-ss-tipo">' + esc(s.tipo) + '</span>' : '')
        + '</span></a>';
    }).join('');
    vp.appendChild(track);

    box['inn' + 'erHTML'] = '';
    box.appendChild(hd);
    box.appendChild(vp);

    if (slide.length < 2) return;

    slide.forEach(function (s, i) {
      dots.appendChild(Sky.dom.create('button', { type: 'button', class: 'tbh-ss-dot', 'aria-label': 'Vai a ' + s.titolo }));
    });
    const prev = Sky.dom.create('button', { type: 'button', class: 'tbh-ss-ar tbh-ss-prev', 'aria-label': 'Precedente', html: FRECCIA(Sky.ui.ICONS.prev) });
    const next = Sky.dom.create('button', { type: 'button', class: 'tbh-ss-ar tbh-ss-next', 'aria-label': 'Successiva', html: FRECCIA(Sky.ui.ICONS.next) });
    vp.appendChild(prev);
    vp.appendChild(next);

    const pallini = Sky.dom.all('.tbh-ss-dot', dots);
    const giro = Sky.ui.rotator({
      total:    slide.length,
      interval: c.intervallo || 5000,
      pauseOn:  box,
      onChange: function (i) {
        track.style.transform = 'translateX(' + (-i * 100) + '%)';
        pallini.forEach(function (p, k) { p.classList.toggle('tbh-on', k === i); });
      }
    });
    prev.addEventListener('click', giro.prev);
    next.addEventListener('click', giro.next);
    pallini.forEach(function (p, k) { p.addEventListener('click', function () { giro.go(k); }); });
  }

  // -----------------------------------------------
  //  RISORSE GRAFICHE
  // -----------------------------------------------

  function risorse() {
    const box = document.getElementById('tbh-risorse');
    const c = CFG.risorse || {};
    const elenco = c.elenco || [];
    if (!box || !elenco.length) return;
    box.classList.add('tbh-ris');

    const titolo = box.querySelector('.risorse-titolo');
    const hd = Sky.dom.create('div', { class: 'tbh-ris-hd' });
    if (titolo) hd.appendChild(titolo);
    if (c.vediTutte) hd.appendChild(Sky.dom.create('a', { class: 'tbh-ris-tutte', href: c.vediTutte, text: 'vedi tutte' }));

    const strip = Sky.dom.create('div', { class: 'tbh-ris-strip' });
    const cap = Sky.dom.create('div', { class: 'tbh-ris-cap' });
    const pop = Sky.dom.create('div', { class: 'tbh-ris-pop', 'aria-hidden': 'true' });

    box['inn' + 'erHTML'] = '';
    box.appendChild(hd);
    box.appendChild(strip);
    box.appendChild(cap);
    box.appendChild(pop);

    const regole = (c.regole || []).map(function (r) {
      return '<div class="tbh-ris-reg">' + FIAMMA(8, 10) + '<span>' + esc(r) + '</span></div>';
    }).join('');

    function mostra(r) {
      cap['inn' + 'erHTML'] = '<b>' + esc(r.titolo) + '</b>' + conData(r.data);
      pop['inn' + 'erHTML'] = '<img class="tbh-ris-pv" src="' + esc(r.anteprima || r.mini) + '" alt="">'
        + '<div><div class="tbh-ris-pt">' + esc(r.titolo) + '</div>'
        + '<div class="tbh-ris-pd">' + (r.data ? 'del <b>' + esc(r.data) + '</b>' : '') + '</div>'
        + regole + '</div>';
    }

    // quante miniature mostrare: ognuna occupa 49px (35 di immagine + padding e bordo),
    // con almeno 5px fra l'una e l'altra; poi il CSS le distribuisce su tutta la riga
    function disegna() {
      const POSTO = 49, GAP = 5;
      const quante = Math.max(1, Math.floor((strip.clientWidth + GAP) / (POSTO + GAP)));
      strip['inn' + 'erHTML'] = '';
      elenco.slice(0, quante).forEach(function (r, i) {
        const a = Sky.dom.create('a', { class: 'tbh-ris-th' + (i === 0 ? ' tbh-on' : ''), href: r.link, 'aria-label': r.titolo },
          Sky.dom.create('img', { src: r.mini, alt: '' }));
        a.addEventListener('mouseenter', function () {
          Sky.dom.all('.tbh-ris-th', strip).forEach(function (x) { x.classList.remove('tbh-on'); });
          a.classList.add('tbh-on');
          mostra(r);
          pop.classList.add('tbh-on');
        });
        strip.appendChild(a);
      });
      mostra(elenco[0]);
    }

    // la scheda resta aperta anche mentre il mouse ci passa sopra (per l'anteprima che ruota)
    box.addEventListener('mouseleave', function () { pop.classList.remove('tbh-on'); });
    disegna();

    let t = null;
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(disegna, 150); });
  }

  // -----------------------------------------------
  //  (MIS)FORTUNE TELLER
  // -----------------------------------------------
  // Stesso funzionamento di sempre: al clic pubblica una frase a caso nel topic
  // e porta lì. Il form si costruisce solo al momento del clic.

  function fortune() {
    const btn = document.getElementById('tbh-fortune');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const c = CFG.fortune || {};
      const frasi = window.FORTUNE_TELLER_FRASI || [];
      if (!c.sezione || !c.topic) { Sky.ui.toast('Sezione o topic del Fortune Teller non impostati nel config.', { titolo: 'Fortune Teller', tipo: 'error' }); return; }
      if (!frasi.length) { Sky.ui.toast('Le frasi non sono state caricate, riprova tra poco.', { titolo: 'Fortune Teller', tipo: 'error' }); return; }

      btn.disabled = true;
      const campi = {
        st:   '0',
        act:  'Post',
        f:    String(c.sezione),
        CODE: '03',
        t:    String(c.topic),
        Post: frasi[Math.floor(Math.random() * frasi.length)]
      };
      const form = Sky.dom.create('form', { method: 'post', action: 'https://' + location.hostname + '/', style: { display: 'none' } });
      Object.keys(campi).forEach(function (k) {
        form.appendChild(Sky.dom.create('input', { type: 'hidden', name: k, value: campi[k] }));
      });
      document.body.appendChild(form);
      form.submit();
    });
  }

  // -----------------------------------------------
  //  AVVIO
  // -----------------------------------------------

  Sky.ready(function () {
    try { slideshow(); } catch (e) { Sky.log.error(LOG, 'slideshow', e); }
    try { risorse(); }   catch (e) { Sky.log.error(LOG, 'risorse', e); }
    try { fortune(); }   catch (e) { Sky.log.error(LOG, 'fortune', e); }
  });
})();
