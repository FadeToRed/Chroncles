/**
 * ☁️ SkyFramework
 *
 * @description Framework di base per Chronicles Of A Broken Sky (portfolio)
 * e per il suo forum di prova. Raccoglie in un posto solo le cose che gli
 * script delle skin rifanno ogni volta: avvio sicuro, attesa di elementi
 * disegnati dopo, utente e gruppi, posizione nel forum, localStorage con
 * scadenza, api.php di ForumFree, invio di post, piccoli aiuti per la UI.
 *
 * Deve essere caricato PRIMA di tutti gli script che lo usano.
 * Pensato per jsDelivr: se lo incolli direttamente in ForumFree, mettilo
 * tra <script> e </script> (niente backtick dentro, quindi regge).
 *
 * Accesso: window.SkyFramework (alias corto: window.Sky)
 *
 * @version 1.0.0
 */

;(function () {
  'use strict';

  if (window.SkyFramework) return; // già caricato (es. incluso due volte)

  // ═══════════════════════════════════════════════════════════════
  // CONFIGURAZIONE DEI FORUM
  // ═══════════════════════════════════════════════════════════════

  /**
   * I due forum su cui gira il framework.
   * Le sezioni sono quelle "fisse" utili agli script (spam, staff, ecc.).
   */
  const FORUMS = {
    portfolio: {
      host: 'chroniclesofabrokensky.blogfree.net',
      id: 216368,
      nome: 'Chronicles Of A Broken Sky',
      sezioni: {
        PRESENTAZIONI:   1190468,
        BACHECA:         1190469,
        SKIN:            1190471,
        SKIN_CHIARE:     1190656,
        SKIN_SCURE:      1190657,
        SKIN_MOBILE:     1190658,
        TABELLE:         1190472,
        CODICI_GDR:      1190473,
        SCHEDE_PG:       1190740,
        ROLE_SCHEME:     1190741,
        MANGA_SCAN:      1190474,
        FANFICTION:      1190475,
        FANART:          1190476,
        GRAFICA:         1190477,
        CONTEST:         1190481,
        AFFILIAZIONI:    1190674,
        GEMELLAGGI:      1190675,
        SPAM:            1190483,
        RICAMBIO_SPAM:   1190673,
        STANZA_BOTTONI:  1190659,
        CESTINO:         1190660
      }
    },
    prova: {
      host: 'porp.forumfree.it',
      id: 1085972,
      nome: 'Chronicles Of A Broken Sky (prova)',
      sezioni: {
        BENVENUTI:       65095410,
        BACHECA:         65095618,
        SKIN:            65095620,
        TABELLE:         65095621,
        CODICI_GDR:      65095622,
        MANGA_SCAN:      65095623,
        FANFICTION:      65095624,
        FANART:          65095625,
        GRAFICA:         65095626,
        SPAM:            65111597,
        RICAMBIO_SPAM:   65111833,
        STANZA_BOTTONI:  65095633,
        CESTINO:         65095634
      }
    }
  };

  /** Gruppi del forum (uguali sui due forum). 0 = utente semplice. */
  const GROUPS = {
    1: 'Cassiopea',
    2: 'Segin',
    3: 'Shedir',
    4: 'Tsih',
    5: 'Ruchbah',
    6: 'Caph'
  };

  // Su quale dei due forum siamo (null = nessuno: il framework non parte)
  let FORUM_KEY = null;
  Object.keys(FORUMS).forEach(function (k) {
    if (FORUMS[k].host === location.hostname) FORUM_KEY = k;
  });
  if (!FORUM_KEY) return;

  const FORUM = FORUMS[FORUM_KEY];
  const PREFIX = '[Sky]';
  const DEBUG_KEY = 'sky-debug';

  const Sky = window.SkyFramework = window.Sky = {
    version:   '1.0.0',
    constants: {},
    log:       null,
    ready:     null,
    onLoad:    null,
    dom:       {},
    user:      {},
    location:  {},
    storage:   {},
    dates:     {},
    str:       {},
    api:       {},
    requests:  {},
    theme:     {},
    ui:        {}
  };

  // ═══════════════════════════════════════════════════════════════
  // CONSTANTS
  // ═══════════════════════════════════════════════════════════════

  Sky.constants = {
    FORUMS:    FORUMS,
    FORUM_KEY: FORUM_KEY,       // 'portfolio' oppure 'prova'
    FORUM:     FORUM,
    FORUM_ID:  FORUM.id,
    DOMAIN:    location.hostname,
    SECTIONS:  FORUM.sezioni,   // sezioni del forum corrente
    GROUPS:    GROUPS,
    BREAKPOINT_MENU: 999        // stesso valore della @media del menu a scomparsa
  };

  // ═══════════════════════════════════════════════════════════════
  // LOG
  // ═══════════════════════════════════════════════════════════════

  /**
   * Log con prefisso. I messaggi .debug compaiono solo se attivi il debug
   * dalla console: Sky.log.debugOn()  (si spegne con Sky.log.debugOff()).
   */
  function isDebug() {
    try { return localStorage.getItem(DEBUG_KEY) === '1'; } catch (e) { return false; }
  }

  Sky.log = {
    info:  function () { console.log.apply(console, [PREFIX].concat([].slice.call(arguments))); },
    warn:  function () { console.warn.apply(console, [PREFIX].concat([].slice.call(arguments))); },
    error: function () { console.error.apply(console, [PREFIX].concat([].slice.call(arguments))); },
    debug: function () { if (isDebug()) console.log.apply(console, [PREFIX + '[debug]'].concat([].slice.call(arguments))); },
    debugOn:  function () { try { localStorage.setItem(DEBUG_KEY, '1'); } catch (e) {} },
    debugOff: function () { try { localStorage.removeItem(DEBUG_KEY); } catch (e) {} }
  };

  // ═══════════════════════════════════════════════════════════════
  // AVVIO
  // ═══════════════════════════════════════════════════════════════

  /**
   * Esegue fn quando il DOM è pronto. Funziona anche se lo script arriva
   * DOPO DOMContentLoaded (cosa che su ForumFree succede spesso): in quel
   * caso parte subito. Sostituisce il solito
   * document.readyState === 'loading' ? addEventListener(...) : start();
   *
   * @param {Function} fn
   */
  Sky.ready = function (fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  };

  /**
   * Esegue fn a pagina completamente caricata (immagini comprese).
   * Se la pagina è già caricata parte subito.
   *
   * @param {Function} fn
   */
  Sky.onLoad = function (fn) {
    if (document.readyState === 'complete') fn();
    else window.addEventListener('load', fn);
  };

  // ═══════════════════════════════════════════════════════════════
  // DOM
  // ═══════════════════════════════════════════════════════════════

  /** Primo elemento che corrisponde al selettore (o null). */
  function one(selector, root) {
    return (root || document).querySelector(selector);
  }

  /** Tutti gli elementi, come array vero (si può usare forEach, map, filter). */
  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  /**
   * Crea un elemento.
   *
   * @param {string} tag
   * @param {Object} [attrs] attributi; 'class', 'text', 'html' e 'style' (oggetto) sono speciali,
   *                         le chiavi che iniziano con 'on' diventano eventi (onclick → click)
   * @param {Array|Node|string} [children]
   * @returns {HTMLElement}
   *
   * @example Sky.dom.create('button', { class: 'tl-prev', type: 'button', onclick: indietro }, 'Indietro')
   */
  function create(tag, attrs, children) {
    const el = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el['inn' + 'erHTML'] = v;
      else if (k === 'style' && typeof v === 'object') Object.keys(v).forEach(function (p) { el.style.setProperty(p, v[p]); });
      else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    if (children !== undefined && children !== null) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c === null || c === undefined) return;
        el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
      });
    }
    return el;
  }

  /**
   * Inserisce un blocco CSS una volta sola (se l'id esiste già non fa niente).
   *
   * @param {string} id
   * @param {string} css
   * @returns {HTMLStyleElement}
   */
  function injectCSS(id, css) {
    let st = document.getElementById(id);
    if (st) return st;
    st = document.createElement('style');
    st.id = id;
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
    return st;
  }

  /**
   * Aspetta che compaia un elemento disegnato dopo il caricamento
   * (statistiche 24 ore, shoutbox, notifiche...).
   * Si risolve con l'elemento, oppure con null allo scadere del tempo.
   *
   * @param {string} selector
   * @param {Object} [opts] { root: elemento da osservare (default body), timeout: ms (default 10000) }
   * @returns {Promise<Element|null>}
   *
   * @example Sky.dom.waitFor('.stats .day_user .dailyusers-member').then(function (el) { if (el) sistema(); });
   */
  function waitFor(selector, opts) {
    opts = opts || {};
    const root = opts.root || document.body || document.documentElement;
    const timeout = opts.timeout === undefined ? 10000 : opts.timeout;
    return new Promise(function (resolve) {
      const found = root.querySelector(selector);
      if (found) return resolve(found);
      let timer = null;
      const obs = new MutationObserver(function () {
        const el = root.querySelector(selector);
        if (el) { obs.disconnect(); clearTimeout(timer); resolve(el); }
      });
      obs.observe(root, { childList: true, subtree: true });
      if (timeout) timer = setTimeout(function () { obs.disconnect(); resolve(root.querySelector(selector)); }, timeout);
    });
  }

  /**
   * Chiama fn ogni volta che dentro root cambia qualcosa, ma raggruppando
   * le modifiche ravvicinate (utile per shoutbox e tagboard che aggiungono
   * messaggi in continuazione).
   *
   * @param {Element} root
   * @param {Function} fn
   * @param {number} [wait=150] ms di pausa prima di chiamare fn
   * @returns {MutationObserver} per poterlo fermare con .disconnect()
   */
  function observe(root, fn, wait) {
    let timer = null;
    const obs = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(fn, wait === undefined ? 150 : wait);
    });
    obs.observe(root || document.body, { childList: true, subtree: true });
    return obs;
  }

  /**
   * Porta un elemento dentro lo schermo (per tendine e popup che escono
   * dal fondo): se serve lo alza, se è più alto dello schermo lo limita
   * e lo rende scorrevole. Riparte sempre dalla posizione decisa dal CSS.
   *
   * @param {HTMLElement} el
   * @param {number} [margine=12] px minimi da lasciare dal bordo dello schermo
   */
  function keepInViewport(el, margine) {
    margine = margine === undefined ? 12 : margine;
    el.style.marginTop = '';
    el.style.maxHeight = '';
    el.style.overflowY = '';
    const r = el.getBoundingClientRect();
    if (!r.height) return;
    const spazio = window.innerHeight - margine * 2;
    if (r.height > spazio) {
      el.style.maxHeight = spazio + 'px';
      el.style.overflowY = 'auto';
    }
    const r2 = el.getBoundingClientRect();
    let sposta = 0;
    if (r2.bottom > window.innerHeight - margine) sposta = (window.innerHeight - margine) - r2.bottom;
    if (r2.top + sposta < margine) sposta = margine - r2.top;
    if (sposta) {
      const mt = parseFloat(getComputedStyle(el).marginTop) || 0;
      el.style.marginTop = (mt + sposta) + 'px';
    }
  }

  Sky.dom = {
    one:            one,
    all:            all,
    create:         create,
    injectCSS:      injectCSS,
    waitFor:        waitFor,
    observe:        observe,
    keepInViewport: keepInViewport
  };

  // ═══════════════════════════════════════════════════════════════
  // USER
  // ═══════════════════════════════════════════════════════════════
  // Si appoggia a Commons (l'oggetto di ForumFree) quando c'è,
  // altrimenti legge le classi del body. Le classi si controllano con
  // \b, così "g1" non scatta per "g10".

  function C() { return window.Commons || null; }

  function bodyHas(cls) {
    return new RegExp('(^|\\s)' + cls + '(\\s|$)').test(document.body ? document.body.className : '');
  }

  /** ID dell'utente loggato (0 se ospite). */
  function userId() {
    const c = C();
    return c && c.user && c.user.id ? Number(c.user.id) : 0;
  }

  /** Nickname dell'utente loggato ('' se ospite). */
  function nickname() {
    const c = C();
    if (c && c.user && c.user.nickname) return String(c.user.nickname);
    const n = one('.menuwrap .nick');
    return n ? n.textContent.trim() : '';
  }

  /** URL dell'avatar dell'utente loggato ('' se non c'è). */
  function avatar() {
    const c = C();
    if (c && c.user && c.user.avatar) return String(c.user.avatar);
    const img = one('.menuwrap .avatar img');
    return img ? img.src : '';
  }

  /** Numero del gruppo dell'utente loggato (0 = utente semplice o ospite). */
  function groupId() {
    const c = C();
    if (c && c.user && c.user.group !== undefined && c.user.group !== null) {
      const g = typeof c.user.group === 'object' ? c.user.group.id : c.user.group;
      if (!isNaN(Number(g))) return Number(g);
    }
    const m = (document.body ? document.body.className : '').match(/(?:^|\s)g(\d+)(?:\s|$)/);
    return m ? Number(m[1]) : 0;
  }

  /** Nome del gruppo ('Cassiopea', 'Segin'... o '' se utente semplice). */
  function groupName(id) {
    id = id === undefined ? groupId() : id;
    return GROUPS[id] || '';
  }

  /** L'utente è nel gruppo n (o in uno dei gruppi elencati)? */
  function inGroup() {
    const g = groupId();
    for (let i = 0; i < arguments.length; i++) if (Number(arguments[i]) === g) return true;
    return false;
  }

  function isGuest() {
    const c = C();
    if (c && c.user && c.user.isGuest !== undefined) return !!c.user.isGuest;
    return !bodyHas('user');
  }
  function isUser()  { return !isGuest(); }
  function isAdmin() {
    const c = C();
    return c && c.user && c.user.isAdmin !== undefined ? !!c.user.isAdmin : bodyHas('admin');
  }
  function isMod() {
    const c = C();
    if (c && c.user && (c.user.isMod || c.user.isGlobalMod)) return true;
    return bodyHas('mod') || bodyHas('globalmod');
  }
  /** Staff = amministratori + moderatori (come nei boardGroups di ForumFree). */
  function isStaff() { return isAdmin() || isMod(); }

  Sky.user = {
    id:          userId,
    nickname:    nickname,
    avatar:      avatar,
    groupId:     groupId,
    groupName:   groupName,
    inGroup:     inGroup,
    isGuest:     isGuest,
    isUser:      isUser,
    isAdmin:     isAdmin,
    isMod:       isMod,
    isStaff:     isStaff,
    isCassiopea: function () { return inGroup(1); },
    isSegin:     function () { return inGroup(2); },
    isShedir:    function () { return inGroup(3); },
    isTsih:      function () { return inGroup(4); },
    isRuchbah:   function () { return inGroup(5); },
    isCaph:      function () { return inGroup(6); }
  };

  // ═══════════════════════════════════════════════════════════════
  // LOCATION
  // ═══════════════════════════════════════════════════════════════
  // Il body ha id="board" (home), "forum" (sezione), "topic", "profile"...
  // e classi f<sezione>, t<topic>, a<autore del topic>.

  function cloc(key) {
    const c = C();
    return c && c.location && c.location[key] !== undefined ? !!c.location[key] : null;
  }
  function bodyId() { return document.body ? document.body.id : ''; }
  function bodyNum(letter) {
    const m = (document.body ? document.body.className : '').match(new RegExp('(?:^|\\s)' + letter + '(\\d+)(?:\\s|$)'));
    return m ? Number(m[1]) : null;
  }
  function urlNum(param) {
    const m = location.search.match(new RegExp('[?&]' + param + '=(\\d+)'));
    return m ? Number(m[1]) : null;
  }

  function isHome()    { const v = cloc('isHome');    return v !== null ? v : bodyId() === 'board'; }
  function isSection() { const v = cloc('isSection'); return v !== null ? v : bodyId() === 'forum'; }
  function isTopic()   { const v = cloc('isTopic');   return v !== null ? v : bodyId() === 'topic'; }
  function isProfile() { const v = cloc('isProfile'); return v !== null ? v : bodyId() === 'profile'; }
  function isBlog()    { return !!cloc('isBlog'); }
  function isArticle() { return !!cloc('isArticle'); }
  function isEditor()  { return !!cloc('isFullEditor'); }
  function isFirstPage() { const v = cloc('isFirstPage'); return v !== null ? v : bodyHas('first'); }

  /** ID della sezione corrente (anche dentro un topic), o null. */
  function sectionId() { return bodyNum('f') || urlNum('f'); }
  /** ID del topic corrente, o null. */
  function topicId()   { return isTopic() ? (bodyNum('t') || urlNum('t')) : null; }
  /** ID dell'autore del topic corrente, o null. */
  function topicAuthorId() { return isTopic() ? bodyNum('a') : null; }
  /** Siamo nella sezione id (o in una delle sezioni elencate)? */
  function inSection() {
    const s = sectionId();
    for (let i = 0; i < arguments.length; i++) if (Number(arguments[i]) === s) return true;
    return false;
  }

  /** Layout mobile di ForumFree (quello con le list-group-item)? */
  function isMobile() {
    const c = C();
    if (c && c.forum && c.forum.isFFMobile !== undefined) return !!c.forum.isFFMobile;
    return typeof window.ff_layout !== 'undefined' && window.ff_layout === 0;
  }
  /** Finestra stretta (sotto il breakpoint del menu a scomparsa)? */
  function isNarrow() {
    return window.matchMedia ? window.matchMedia('(max-width: ' + Sky.constants.BREAKPOINT_MENU + 'px)').matches : window.innerWidth <= Sky.constants.BREAKPOINT_MENU;
  }

  Sky.location = {
    forum:         function () { return FORUM_KEY; },
    isPortfolio:   function () { return FORUM_KEY === 'portfolio'; },
    isProva:       function () { return FORUM_KEY === 'prova'; },
    isHome:        isHome,
    isSection:     isSection,
    isTopic:       isTopic,
    isProfile:     isProfile,
    isBlog:        isBlog,
    isArticle:     isArticle,
    isEditor:      isEditor,
    isFirstPage:   isFirstPage,
    sectionId:     sectionId,
    topicId:       topicId,
    topicAuthorId: topicAuthorId,
    inSection:     inSection,
    isMobile:      isMobile,
    isNarrow:      isNarrow
  };

  // ═══════════════════════════════════════════════════════════════
  // STORAGE
  // ═══════════════════════════════════════════════════════════════
  // Wrapper di localStorage che non va mai in errore (modalità privata,
  // spazio pieno...).

  function storageSet(key, value) {
    try { localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value); }
    catch (e) { Sky.log.debug('storage.set fallito', key, e); }
  }
  function storageGet(key, parseJSON) {
    let v = null;
    try { v = localStorage.getItem(key); } catch (e) { return null; }
    if (v === null || !parseJSON) return v;
    try { return JSON.parse(v); } catch (e) { return null; }
  }
  function storageRemove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }
  function storageExists(key) {
    try { return localStorage.getItem(key) !== null; } catch (e) { return false; }
  }

  /**
   * Salva un valore con scadenza.
   * @param {string} key
   * @param {*} value
   * @param {number} ttl durata in ms (es. 6 * 60 * 60 * 1000 per 6 ore)
   */
  function cacheSet(key, value, ttl) {
    storageSet(key, { v: value, scade: Date.now() + ttl });
  }
  /**
   * Legge un valore salvato con cacheSet; null se manca o è scaduto
   * (e in quel caso lo cancella).
   */
  function cacheGet(key) {
    const o = storageGet(key, true);
    if (!o || typeof o !== 'object' || !('scade' in o)) return null;
    if (Date.now() > o.scade) { storageRemove(key); return null; }
    return o.v;
  }

  Sky.storage = {
    set:      storageSet,
    get:      storageGet,
    remove:   storageRemove,
    exists:   storageExists,
    cacheSet: cacheSet,
    cacheGet: cacheGet
  };

  // ═══════════════════════════════════════════════════════════════
  // DATES
  // ═══════════════════════════════════════════════════════════════

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /**
   * Formatta una data. Segnaposto: D giorno, M mese, Y anno, H ore, I minuti, S secondi.
   *
   * @param {Date} [date=oggi]
   * @param {string} [template='D/M/Y']
   * @returns {string}
   *
   * @example Sky.dates.formatDate(new Date(), 'D/M/Y H:I') // '13/11/2026 19:30'
   */
  function formatDate(date, template) {
    date = date || new Date();
    template = template || 'D/M/Y';
    const map = {
      D: pad(date.getDate()), M: pad(date.getMonth() + 1), Y: String(date.getFullYear()),
      H: pad(date.getHours()), I: pad(date.getMinutes()), S: pad(date.getSeconds())
    };
    return template.replace(/[DMYHIS]/g, function (k) { return map[k]; });
  }

  /** Oggi è lo stesso giorno di day? */
  function isSameDay(day) {
    const a = new Date(), b = new Date(day);
    return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  }

  /**
   * True la prima volta che viene chiamata in un nuovo giorno per quella chiave
   * (utile per cose da fare "una volta al giorno").
   */
  function isNewDay(key) {
    const oggi = formatDate(new Date(), 'D/M/Y');
    if (storageGet(key) !== oggi) { storageSet(key, oggi); return true; }
    return false;
  }

  /** "adesso", "5 minuti fa", "2 ore fa", "3 giorni fa", poi la data. */
  function timeAgo(date) {
    const s = Math.round((Date.now() - new Date(date).getTime()) / 1000);
    if (s < 60) return 'adesso';
    const m = Math.round(s / 60);
    if (m < 60) return m === 1 ? '1 minuto fa' : m + ' minuti fa';
    const h = Math.round(m / 60);
    if (h < 24) return h === 1 ? '1 ora fa' : h + ' ore fa';
    const d = Math.round(h / 24);
    if (d < 7) return d === 1 ? 'ieri' : d + ' giorni fa';
    return formatDate(new Date(date), 'D/M/Y');
  }

  Sky.dates = {
    formatDate: formatDate,
    isSameDay:  isSameDay,
    isNewDay:   isNewDay,
    timeAgo:    timeAgo
  };

  // ═══════════════════════════════════════════════════════════════
  // STR
  // ═══════════════════════════════════════════════════════════════

  /** Rende sicuro un testo da mettere dentro HTML o un attributo. */
  function esc(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** Valore di un parametro di un URL (default: pagina corrente), o null. */
  function getURLParameter(url, parameter) {
    if (parameter === undefined) { parameter = url; url = location.href; }
    const m = new RegExp('[?&]' + parameter + '=([^&#]*)').exec(url);
    return m ? decodeURIComponent(m[1]) : null;
  }

  /**
   * JSON.parse che prova a riparare le risposte un po' rotte di api.php
   * (a capo e virgole in più prima di ] e }). Restituisce null se proprio non va.
   */
  function parseJSON(text) {
    if (typeof text !== 'string') return text;
    const pulito = text.replace(/[\n\r\t]/g, ' ').trim();
    try { return JSON.parse(pulito); } catch (e) {}
    try { return JSON.parse(pulito.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}')); } catch (e) {}
    return null;
  }

  /** Toglie i tag e restituisce solo il testo. */
  function stripTags(html) {
    const d = document.createElement('div');
    d['inn' + 'erHTML'] = html;
    return (d.textContent || '').trim();
  }

  Sky.str = {
    esc:             esc,
    getURLParameter: getURLParameter,
    parseJSON:       parseJSON,
    stripTags:       stripTags
  };

  // ═══════════════════════════════════════════════════════════════
  // API (api.php di ForumFree)
  // ═══════════════════════════════════════════════════════════════

  const COOK = 'cook' + 'ie';   // la parola intera viene censurata se incollata nel forum
  const USERS_KEY = 'sky-utenti-v1';
  const USERS_TTL = 6 * 60 * 60 * 1000; // 6 ore
  let usersCache = storageGet(USERS_KEY, true) || {};

  function apiURL(query) {
    return 'https://' + location.hostname + '/api.php?' + query;
  }

  /**
   * Chiamata grezza ad api.php. Si risolve con il JSON (riparato se serve).
   *
   * @param {string} query es. 'a=1&n=10'
   * @param {Object} [opts] { credenziali: true per mandare la sessione (serve per i dati "da loggato") }
   * @returns {Promise<Object>}
   */
  function apiRequest(query, opts) {
    opts = opts || {};
    return fetch(apiURL(query), { credentials: opts.credenziali ? 'include' : 'omit' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (t) {
        const data = parseJSON(t);
        if (data === null) throw new Error('JSON non valido da api.php');
        return data;
      });
  }

  /**
   * Dati di uno o più utenti (nick, avatar, gruppo, messaggi, ultima attività...).
   * Le richieste sono raggruppate a blocchi da 40 e ricordate per 6 ore,
   * quindi si può chiamare spesso senza appesantire.
   *
   * @param {Array<number|string>|number|string} ids
   * @param {Object} [opts] { fresco: true per ignorare la cache }
   * @returns {Promise<Object>} mappa id → utente (null se non trovato)
   *
   * @example Sky.api.users([1329750]).then(function (u) { console.log(u[1329750].group.name); });
   */
  function users(ids, opts) {
    opts = opts || {};
    ids = (Array.isArray(ids) ? ids : [ids]).map(String).filter(function (id, i, a) {
      return id && id !== '0' && a.indexOf(id) === i;
    });
    const adesso = Date.now();
    const mancanti = ids.filter(function (id) {
      const c = usersCache[id];
      return opts.fresco || !c || adesso - c.t > USERS_TTL;
    });
    const blocchi = [];
    for (let i = 0; i < mancanti.length; i += 40) blocchi.push(mancanti.slice(i, i + 40));

    return Promise.all(blocchi.map(function (b) {
      return apiRequest('mid=' + b.join(',')).then(function (dati) {
        b.forEach(function (id) {
          const u = dati['m' + id];
          usersCache[id] = { u: u || null, t: Date.now() };
        });
      }).catch(function (e) { Sky.log.warn('api.users', e.message); });
    })).then(function () {
      if (blocchi.length) storageSet(USERS_KEY, usersCache);
      const out = {};
      ids.forEach(function (id) { out[id] = usersCache[id] ? usersCache[id].u : null; });
      return out;
    });
  }

  /** Numero del gruppo di ogni utente (0 = utente semplice). */
  function userGroups(ids) {
    return users(ids).then(function (map) {
      const out = {};
      Object.keys(map).forEach(function (id) {
        const u = map[id];
        out[id] = u && u.group ? Number(u.group.id) || 0 : null;
      });
      return out;
    });
  }

  /** Svuota la cache utenti (dalla console, se un utente cambia gruppo e serve subito). */
  function clearUsersCache() {
    usersCache = {};
    storageRemove(USERS_KEY);
  }

  /**
   * Ultimi topic attivi del forum.
   *
   * @param {Object} [opts] { n: quanti (default 10), escludi: [id sezioni] (default spam e ricambio spam) }
   * @returns {Promise<Array>} threads di api.php (title, desc, id, section_id, section_name, info)
   */
  function latestTopics(opts) {
    opts = opts || {};
    const n = opts.n || 10;
    const escludi = opts.escludi || [FORUM.sezioni.SPAM, FORUM.sezioni.RICAMBIO_SPAM].filter(Boolean);
    const q = 'a=1&n=' + n + (escludi.length ? '&nosez=' + escludi.join(',') : '') + '&' + COOK + '=1&_=' + Date.now();
    return apiRequest(q, { credenziali: true }).then(function (d) { return d.threads || []; });
  }

  /**
   * Tutti i topic di una sezione (scorre le pagine da 15, massimo 50 pagine).
   *
   * @param {number} sectionId
   * @returns {Promise<Array<{id, title, url}>>}
   */
  function sectionTopics(sectionId) {
    const out = [];
    function pagina(p) {
      return apiRequest('f=' + sectionId + '&st=' + (p * 15) + '&' + COOK + '=1', { credenziali: true }).then(function (d) {
        const t = d.threads || [];
        t.forEach(function (th) { out.push({ id: th.id, title: th.title, url: 'https://' + location.hostname + '/?t=' + th.id }); });
        if (t.length === 15 && p < 49) return pagina(p + 1);
        return out;
      });
    }
    return pagina(0).catch(function (e) { Sky.log.warn('api.sectionTopics', e.message); return out; });
  }

  /**
   * ID dei topic aperti da un utente in una sezione.
   *
   * @param {number} [userIdArg=utente loggato]
   * @param {number} [sectionIdArg=sezione corrente]
   * @param {boolean} [conFissi=false] includi annunci e topic fissi
   * @returns {Promise<Array<number>>}
   */
  function userTopics(userIdArg, sectionIdArg, conFissi) {
    const u = userIdArg || userId();
    const s = sectionIdArg || sectionId();
    const q = 'starter=' + u + '&f=' + s + (conFissi ? '' : '&no_pinned=1&no_annunci=1') + '&' + COOK + '=1';
    return apiRequest(q, { credenziali: true })
      .then(function (d) { return d.topic_ids || []; })
      .catch(function (e) { Sky.log.warn('api.userTopics', e.message); return []; });
  }

  Sky.api = {
    request:         apiRequest,
    users:           users,
    userGroups:      userGroups,
    clearUsersCache: clearUsersCache,
    latestTopics:    latestTopics,
    sectionTopics:   sectionTopics,
    userTopics:      userTopics
  };

  // ═══════════════════════════════════════════════════════════════
  // REQUESTS (pagine del forum e invio di post)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Scarica una pagina del forum e la restituisce come documento HTML,
   * decodificando bene gli accenti (utf-8, con ripiego su windows-1252).
   *
   * @param {string} url
   * @param {Object} [opts] { method: 'GET'|'POST', body: FormData }
   * @returns {Promise<Document>}
   */
  function fetchDoc(url, opts) {
    opts = opts || {};
    return fetch(url, { method: opts.method || 'GET', body: opts.body || null, credentials: 'include' })
      .then(function (res) {
        const ct = res.headers.get('content-type') || '';
        const hm = ct.match(/charset=([^;\s]+)/i);
        let charset = hm ? hm[1].trim().toLowerCase() : null;
        return res.arrayBuffer().then(function (buf) {
          if (!charset) {
            try {
              const guess = new TextDecoder('utf-8').decode(buf);
              const mm = guess.match(/<meta[^>]+charset=["']?([^"'\s>]+)/i);
              if (mm) charset = mm[1].toLowerCase();
            } catch (e) {}
          }
          let html;
          try { html = new TextDecoder(charset || 'utf-8').decode(buf); }
          catch (e) { html = new TextDecoder('windows-1252').decode(buf); }
          return new DOMParser().parseFromString(html, 'text/html');
        });
      });
  }

  /**
   * Token di sessione "s" (serve per inviare post). ForumFree lo toglie dal DOM
   * dopo il caricamento, quindi va letto dal sorgente della home.
   *
   * @returns {Promise<string|null>}
   */
  function fetchToken() {
    return fetch('https://' + location.hostname + '/', { credentials: 'include' })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        const marker = 'name=' + '"s" value="';
        const i = html.indexOf(marker);
        if (i === -1) return null;
        const start = i + marker.length;
        const end = html.indexOf('"', start);
        return end === -1 ? null : html.substring(start, end);
      })
      .catch(function () { return null; });
  }

  /**
   * Risponde in un topic.
   *
   * @param {Object} o { section: id sezione, topic: id topic, text: contenuto, firma: true, segui: true }
   * @returns {Promise<boolean>} true se ForumFree conferma il salvataggio
   *
   * @example Sky.requests.postReply({ section: 1190483, topic: 123, text: 'Ciao!' })
   */
  function postReply(o) {
    return fetchToken().then(function (token) {
      if (!token) throw new Error('token non trovato (utente non loggato?)');
      const fd = new FormData();
      fd.set('st', '0');
      fd.set('act', 'Post');
      fd.set('s', token);
      fd.set('CODE', '03');
      fd.set('f', String(o.section));
      fd.set('t', String(o.topic));
      fd.set('Post', o.text);
      fd.set('enablesig', o.firma === false ? '0' : '1');
      fd.set('track_topic', o.segui === false ? '0' : '1');
      fd.set('mod_options', 'nowt');
      fd.set('charset', 'UTF-8');
      fd.set(COOK, '1');
      return fetchDoc('https://' + location.hostname + '/', { method: 'POST', body: fd });
    }).then(function (doc) {
      const testo = doc && doc.body ? doc.body.textContent : '';
      // ForumFree risponde con una pagina di errore quando qualcosa non va
      return !(doc && doc.querySelector('.errorwrap, .error, #error')) || /salvat|saved/i.test(testo);
    }).catch(function (e) { Sky.log.error('postReply', e.message); return false; });
  }

  /**
   * Apre un nuovo topic in una sezione.
   *
   * @param {Object} o { section: id sezione, title: titolo, desc: descrizione, text: contenuto }
   * @returns {Promise<number|null>} id del nuovo topic, o null se non è andata
   */
  function postTopic(o) {
    return fetchDoc('https://' + location.hostname + '/?act=Post&CODE=00&f=' + o.section).then(function (doc) {
      const form = doc.getElementById('REPLIER_POST') || doc.querySelector('form[name="REPLIER"]');
      if (!form) throw new Error('modulo di nuovo topic non trovato');
      const fd = new FormData();
      ['st', 'act', 's', 'f', 'CODE', 'MAX_FILE_SIZE', 'check'].forEach(function (n) {
        const el = form.querySelector('[name="' + n + '"]');
        if (el) fd.set(n, el.value);
      });
      fd.set('TopicTitle', o.title);
      if (o.desc) fd.set('TopicDesc', o.desc);
      fd.set('Post', o.text);
      fd.set('enablesig', '1');
      fd.set('track_topic', '1');
      fd.set('charset', 'UTF-8');
      return fetchDoc('https://' + location.hostname + '/', { method: 'POST', body: fd });
    }).then(function (doc) {
      const m = doc && doc.body ? doc.body.className.match(/(?:^|\s)t(\d+)(?:\s|$)/) : null;
      return m ? Number(m[1]) : null;
    }).catch(function (e) { Sky.log.error('postTopic', e.message); return null; });
  }

  Sky.requests = {
    fetchDoc:   fetchDoc,
    fetchToken: fetchToken,
    postReply:  postReply,
    postTopic:  postTopic
  };

  // ═══════════════════════════════════════════════════════════════
  // THEME
  // ═══════════════════════════════════════════════════════════════
  // La skin definisce i colori come variabili CSS in :root
  // (--uno ... --undici, --sfondo, --titoli, --bl-*...). Gli script li
  // leggono da qui invece di ricopiarli, così cambiando skin si adeguano.

  /**
   * Valore di una variabile CSS della skin (senza "--"), o fallback.
   *
   * @example Sky.theme.get('sette')        // '#9389F9' nella skin Chandelure
   * @example Sky.theme.get('accento', '#c0f') // fallback se la variabile non c'è
   */
  function themeGet(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim();
    return v || (fallback === undefined ? '' : fallback);
  }

  /** L'utente ha chiesto meno animazioni al sistema? Da rispettare in caroselli, favicon animate, ecc. */
  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  Sky.theme = {
    get:           themeGet,
    reducedMotion: reducedMotion
  };

  // ═══════════════════════════════════════════════════════════════
  // UI
  // ═══════════════════════════════════════════════════════════════

  /**
   * Icona SVG a tratto (stile delle frecce della skin). Restituisce una stringa.
   *
   * @param {string|Array<string>} d uno o più path
   * @param {Object} [opts] { size: '1em', stroke: 3, viewBox: '0 0 24 24', fill: 'none', label: testo per i lettori di schermo }
   * @returns {string}
   */
  function icon(d, opts) {
    opts = opts || {};
    const paths = (Array.isArray(d) ? d : [d]).map(function (p) { return '<path d="' + p + '"/>'; }).join('');
    const aria = opts.label ? 'role="img" aria-label="' + esc(opts.label) + '"' : 'aria-hidden="true"';
    return '<svg viewBox="' + (opts.viewBox || '0 0 24 24') + '" width="' + (opts.size || '1em') + '" height="' + (opts.size || '1em') + '" ' + aria +
      ' fill="' + (opts.fill || 'none') + '" stroke="currentColor" stroke-width="' + (opts.stroke || 3) +
      '" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
  }

  /** Path pronti per icon(). */
  const ICONS = {
    prev:  'M15 5 L8 12 L15 19',
    next:  'M9 5 L16 12 L9 19',
    up:    'M5 15 L12 8 L19 15',
    down:  'M5 9 L12 16 L19 9',
    close: ['M6 6l12 12', 'M18 6L6 18'],
    menu:  ['M4 6.5h16', 'M4 12h16', 'M4 17.5h16'],
    flame: 'M50 97 C27 97 12 80 12 60 C12 42 24 30 34 20 C40 14 42 8 40 2 C52 8 60 16 62 26 C64 20 66 16 70 13 C72 22 88 38 88 60 C88 80 73 97 50 97 Z'
  };

  /**
   * Motore di un carosello: gestisce indice, giro automatico, pausa con
   * mouse e tastiera, rispetto di "meno animazioni". La grafica la decidi tu
   * in onChange (di solito spostando una classe "attiva").
   *
   * @param {Object} o {
   *   total: numero di elementi,
   *   interval: ms fra uno e l'altro (default 6000; 0 = niente giro automatico),
   *   pauseOn: elemento su cui fermarsi con mouse/focus,
   *   onChange: function (indice, precedente)
   * }
   * @returns {{go, next, prev, start, stop, index}}
   *
   * @example
   *   const car = Sky.ui.rotator({ total: items.length, pauseOn: slot,
   *     onChange: function (i, prima) { items[prima].classList.remove('tl-active'); items[i].classList.add('tl-active'); } });
   *   btnNext.addEventListener('click', car.next);
   */
  function rotator(o) {
    const total = o.total || 0;
    const interval = o.interval === undefined ? 6000 : o.interval;
    let i = 0, timer = null;

    function go(n) {
      if (!total) return;
      const prima = i;
      i = (n + total) % total;
      if (o.onChange) o.onChange(i, prima);
    }
    function start() {
      if (total < 2 || !interval || reducedMotion() || timer) return;
      timer = setInterval(function () { go(i + 1); }, interval);
    }
    function stop() { clearInterval(timer); timer = null; }

    if (o.pauseOn) {
      o.pauseOn.addEventListener('mouseenter', stop);
      o.pauseOn.addEventListener('mouseleave', start);
      o.pauseOn.addEventListener('focusin', stop);
      o.pauseOn.addEventListener('focusout', function (e) { if (!o.pauseOn.contains(e.relatedTarget)) start(); });
    }
    if (total && o.onChange) o.onChange(0, 0);
    start();

    return {
      go:    go,
      next:  function () { go(i + 1); },
      prev:  function () { go(i - 1); },
      start: start,
      stop:  stop,
      index: function () { return i; }
    };
  }

  /**
   * Notifica a comparsa (usa i toast di ForumFree; se mancano, scrive in console).
   *
   * @param {string} testo contenuto (accetta HTML)
   * @param {Object} [opts] { titolo: 'Nuova notifica', tipo: 'info' → classe cs-toast-info, durata: ms (min 1000, default 5000) }
   *
   * @example Sky.ui.toast('Skin salvata!', { titolo: 'Fatto', durata: 3000 })
   */
  function toast(testo, opts) {
    opts = opts || {};
    const c = C();
    if (c && c.toast && typeof c.toast.show === 'function') {
      try {
        c.toast.show({
          title:   opts.titolo || 'Notifica',
          content: testo,
          class:   ['cs-toast-' + (opts.tipo || 'info')],
          ttl:     opts.durata || 5000
        });
        return;
      } catch (e) {}
    }
    Sky.log.info(testo);
  }

  /**
   * Apre/chiude un pannello a scomparsa con pulsante, velo, Esc e clic fuori
   * (la logica del menu laterale sotto i 1000px, riusabile per altri pannelli).
   * Mette sul body la classe bodyClass quando è aperto: l'aspetto lo decide il CSS.
   *
   * @param {Object} o { button: elemento, overlay: elemento (opzionale), bodyClass: 'wl-menu-aperto',
   *                     labels: ['Apri il menu', 'Chiudi il menu'], closeAbove: px oltre cui si chiude da solo }
   * @returns {{open, close, toggle, isOpen}}
   */
  function toggler(o) {
    const cls = o.bodyClass;
    const lab = o.labels || ['Apri', 'Chiudi'];
    function set(aperto) {
      document.body.classList.toggle(cls, aperto);
      o.button.setAttribute('aria-expanded', aperto ? 'true' : 'false');
      o.button.setAttribute('aria-label', aperto ? lab[1] : lab[0]);
    }
    function isOpen() { return document.body.classList.contains(cls); }
    set(false);
    o.button.addEventListener('click', function () { set(!isOpen()); });
    if (o.overlay) o.overlay.addEventListener('click', function () { set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    if (o.closeAbove && window.matchMedia) {
      const mq = window.matchMedia('(max-width: ' + o.closeAbove + 'px)');
      const chiudi = function (m) { if (!m.matches) set(false); };
      if (mq.addEventListener) mq.addEventListener('change', chiudi);
      else mq.addListener(chiudi);
    }
    return {
      open:   function () { set(true); },
      close:  function () { set(false); },
      toggle: function () { set(!isOpen()); },
      isOpen: isOpen
    };
  }

  Sky.ui = {
    icon:    icon,
    ICONS:   ICONS,
    rotator: rotator,
    toast:   toast,
    toggler: toggler
  };

  Sky.log.info('v' + Sky.version + ' caricato su ' + FORUM_KEY + ' (' + location.hostname + ')');
})();
