/**
 * Echo Slider
 *
 * @description Topic slider per ForumFree: mostra gli ultimi topic attivi
 * con giro automatico, navigazione manuale e modalità espansa.
 *
 * @requires SkyFramework (va caricato prima di questo script)
 * @requires window.ECHO_CONFIG
 *
 * @version 3.0.0
 */

;(function () {
  'use strict';

  if (!window.SkyFramework) { console.warn('[Echo] SkyFramework non trovato!'); return; }
  if (!window.ECHO_CONFIG)  { console.warn('[Echo] ECHO_CONFIG non trovato!');  return; }

  const Sky = window.SkyFramework;
  const LOG = '[Echo]';

  // Valori predefiniti: ECHO_CONFIG può sovrascriverne quanti vuole
  const config = Object.assign({
    numTopics:        10,
    intervalloSlide:  5000,
    maxExpanded:      10,
    posizionamento:   '.logo',
    sezioniEscluse:   [Sky.constants.SECTIONS.SPAM, Sky.constants.SECTIONS.RICAMBIO_SPAM].filter(Boolean),
    coloriSezioni:    {},
    avatarPredefinito: 'https://img.forumfree.net/style_images/default_avatar.png'
  }, window.ECHO_CONFIG);

  const CACHE_KEY = 'echo-slider-v3';

  // -----------------------------------------------
  //  STATO
  // -----------------------------------------------
  let topics   = [];     // topic da mostrare
  let slider   = null;   // #echo-slider
  let rotator  = null;   // motore del giro automatico (Sky.ui.rotator)

  // -----------------------------------------------
  //  CARICAMENTO TOPIC
  // -----------------------------------------------

  /** Trasforma un thread di api.php nel formato usato dallo slider. */
  function daThread(thread) {
    const last = (thread.info && thread.info.last) || {};
    const data = last.date ? new Date(last.date) : null;
    const host = 'https://' + location.hostname;
    return {
      id:          thread.id,
      title:       thread.title,
      url:         host + '/?t=' + thread.id + '&view=getlastpost#lastpost',
      author:      last.name || '',
      authorId:    last.id || 0,
      authorUrl:   last.id ? host + '/?act=Profile&MID=' + last.id : '#',
      avatar:      last.avatar || '',
      date:        data ? Sky.dates.formatDate(data, 'D/M/Y') : '',
      time:        data ? Sky.dates.formatDate(data, 'H:I') : '',
      sectionName: thread.section_name || 'N/A',
      sectionId:   thread.section_id || ''
    };
  }

  /**
   * Chiede i topic ad api.php. Se la richiesta fallisce usa gli ultimi
   * salvati nel browser, così lo slider non resta vuoto per un errore di rete.
   */
  function carica() {
    return Sky.api.latestTopics({ n: config.numTopics, escludi: config.sezioniEscluse })
      .then(function (threads) {
        topics = threads.map(daThread);
        if (topics.length) Sky.storage.set(CACHE_KEY, topics);
        else Sky.log.debug(LOG, 'nessun topic attivo ricevuto');
      })
      .catch(function (e) {
        Sky.log.warn(LOG, 'errore API:', e.message);
        topics = Sky.storage.get(CACHE_KEY, true) || [];
        if (topics.length) Sky.log.info(LOG, 'caricati ' + topics.length + ' topic dalla cache');
      });
  }

  // -----------------------------------------------
  //  COSTRUZIONE
  // -----------------------------------------------

  /** Classe di colore della sezione, presa da config.coloriSezioni. */
  function classeSezione(sectionId) {
    if (!sectionId) return '';
    const id = String(sectionId);
    const gruppi = config.coloriSezioni;
    for (const nome in gruppi) {
      if (!Object.prototype.hasOwnProperty.call(gruppi, nome)) continue;
      if ((gruppi[nome].ids || []).map(String).indexOf(id) !== -1) return ' ' + gruppi[nome].className;
    }
    return '';
  }

  /**
   * Decodifica le entità del nome della sezione mantenendo i tag
   * che ForumFree a volte mette nel nome (colori, grassetti...).
   */
  function htmlSezione(str) {
    const tmp = document.createElement('div');
    tmp['inn' + 'erHTML'] = str;
    return tmp['inn' + 'erHTML'];
  }

  function htmlTopic(t) {
    const esc = Sky.str.esc;
    const avatar = '<img src="' + esc(t.avatar || config.avatarPredefinito) + '" class="echo-avatar" alt="' + esc(t.author) + '">';
    const sectionUrl = t.sectionId ? 'https://' + location.hostname + '/?f=' + t.sectionId : '#';

    return '<div class="echo-item">'
      + '<a href="' + sectionUrl + '" class="echo-section' + classeSezione(t.sectionId) + '" target="_blank" title="' + esc(Sky.str.stripTags(t.sectionName)) + '">' + htmlSezione(t.sectionName) + '</a>'
      + '<a href="' + esc(t.authorUrl) + '" class="echo-avatar-wrap" target="_blank">' + avatar + '</a>'
      + '<div class="echo-content">'
      +   '<div class="echo-meta">'
      +     '<a href="' + esc(t.authorUrl) + '" class="echo-author" target="_blank">' + esc(t.author) + '</a>'
      +     '<span class="echo-action">dice:</span>'
      +     '<a href="' + esc(t.url) + '" class="echo-topic" target="_blank">' + t.title + '</a>'
      +   '</div>'
      +   '<div class="echo-time">alle <span class="echo-hour">' + t.time + '</span> del <span class="echo-date">' + t.date + '</span></div>'
      + '</div>'
      + '</div>';
  }

  function htmlVuoto() {
    return '<div class="echo-item echo-placeholder">'
      + '<div class="echo-section">N/A</div>'
      + '<div class="echo-avatar-wrap"><img src="' + Sky.str.esc(config.avatarPredefinito) + '" class="echo-avatar" alt="Nessun topic"></div>'
      + '<div class="echo-content"><div class="echo-meta">'
      +   '<span class="echo-author">Nessun topic</span>'
      +   '<span class="echo-action">disponibile</span>'
      + '</div></div>'
      + '</div>';
  }

  function creaSlider() {
    const target = Sky.dom.one(config.posizionamento);
    if (!target) { Sky.log.error(LOG, 'elemento target non trovato: ' + config.posizionamento); return false; }
    if (document.getElementById('echo-slider')) return false;

    slider = Sky.dom.create('div', {
      id: 'echo-slider',
      html: '<div class="echo-wrapper"><div class="echo-container"><div class="echo-loading">Caricamento ultimi topic...</div></div></div>'
        + '<div class="echo-nav">'
        +   '<button type="button" class="echo-btn echo-prev" aria-label="Slide precedente"><i class="fa fa-chevron-left"></i></button>'
        +   '<button type="button" class="echo-btn echo-next" aria-label="Slide successiva"><i class="fa fa-chevron-right"></i></button>'
        +   '<button type="button" class="echo-btn echo-expand" aria-label="Espandi lista" aria-expanded="false"><i class="fa fa-chevron-down"></i></button>'
        + '</div>'
    });
    target.parentNode.insertBefore(slider, target);
    return true;
  }

  function disegna() {
    const container = slider.querySelector('.echo-container');
    container['inn' + 'erHTML'] = topics.length ? topics.map(htmlTopic).join('') : htmlVuoto();
  }

  // -----------------------------------------------
  //  NAVIGAZIONE
  // -----------------------------------------------

  function mostra(i) {
    slider.querySelector('.echo-container').style.transform = 'translateX(' + (-i * slider.offsetWidth) + 'px)';
  }

  /** Dopo un clic sulle frecce il giro automatico riparte da capo. */
  function riparti() {
    rotator.stop();
    if (!espanso()) rotator.start();
  }

  function collegaPulsanti() {
    slider.querySelector('.echo-prev').addEventListener('click', function (e) { e.preventDefault(); rotator.prev(); riparti(); });
    slider.querySelector('.echo-next').addEventListener('click', function (e) { e.preventDefault(); rotator.next(); riparti(); });
    slider.querySelector('.echo-expand').addEventListener('click', function (e) { e.preventDefault(); espandi(!espanso()); });

    // se cambia la larghezza della finestra, la slide corrente resta allineata
    let t = null;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () { if (!espanso()) mostra(rotator.index()); }, 100);
    });
  }

  // -----------------------------------------------
  //  ESPANDI / COMPRIMI
  // -----------------------------------------------

  function espanso() { return slider.classList.contains('echo-expanded'); }

  function espandi(apri) {
    const wrapper   = slider.querySelector('.echo-wrapper');
    const container = slider.querySelector('.echo-container');
    const btn       = slider.querySelector('.echo-expand');
    const frecce    = Sky.dom.all('.echo-prev, .echo-next', slider);
    const items     = Sky.dom.all('.echo-item', container);

    slider.classList.toggle('echo-expanded', apri);
    btn.querySelector('i').className = apri ? 'fa fa-chevron-up' : 'fa fa-chevron-down';
    btn.setAttribute('aria-label', apri ? 'Comprimi lista' : 'Espandi lista');
    btn.setAttribute('aria-expanded', apri ? 'true' : 'false');
    frecce.forEach(function (f) { f.style.display = apri ? 'none' : 'flex'; });

    if (apri) {
      rotator.stop();
      items.forEach(function (it, i) { it.style.display = i < config.maxExpanded ? 'flex' : 'none'; });
      container.style.transition = 'none';
      container.style.transform  = 'translateX(0)';
      wrapper.style.overflow = 'visible';
    } else {
      items.forEach(function (it) { it.style.display = 'flex'; });
      wrapper.style.overflow = 'hidden';
      container.style.transition = 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      mostra(rotator.index());
      rotator.start();
    }
  }

  // -----------------------------------------------
  //  AVVIO
  // -----------------------------------------------

  function avvia() {
    disegna();
    // il giro passa solo sui topic veri, non sui segnaposto
    rotator = Sky.ui.rotator({
      total:    Math.max(topics.length, 1),
      interval: config.intervalloSlide,
      pauseOn:  slider,
      onChange: function (i) { mostra(i); }
    });
    collegaPulsanti();
    Sky.log.debug(LOG, 'pronto con ' + topics.length + ' topic');
  }

  Sky.ready(function () {
    if (!creaSlider()) return;
    carica().then(avvia);
  });
})();
