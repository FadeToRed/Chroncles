/* Avatar a fiammella nel menuwrap */
(function(){
  // Fiammella / fuoco fatuo nel riquadro 0–100: lingua principale a sinistra, lingua piccola a destra.
  const FLAME = 'M50 97 C27 97 12 80 12 60 C12 42 24 30 34 20 C40 14 42 8 40 2 ' +
                'C52 8 60 16 62 26 C64 20 66 16 70 13 C72 22 88 38 88 60 C88 80 73 97 50 97 Z';
  // Pista di scritta e linea: fiamma "lisciata", parte dal fondo e gira in senso orario
  // (fondo → lato sinistro → punta → lato destro → fondo), così le lettere in alto stanno dritte.
  const TRACK = 'M50 97 C27 97 12 80 12 60 C12 42 24 30 34 20 C37 16 40 5 44 2 ' +
                'C52 -4 88 30 88 60 C88 80 73 97 50 97';

  // Allarga un path (solo comandi assoluti M/L/C/Q) attorno a un centro e lo sposta.
  function scalePath(d, k, cx, cy, dx, dy){
    return d.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g, (_, x, y) =>
      `${(cx + (x - cx) * k + dx).toFixed(2)} ${(cy + (y - cy) * k + dy).toFixed(2)}`);
  }
  const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  let uid = 0;
  window.buildFlameAvatar = function(avatarEl, opts){
    const o = Object.assign({
      size: 120,
      text: 'Welcome back • {nick}',   // {nick} viene sostituito col nome utente
      nick: '',                        // se vuoto lo legge da .menuwrap .nick
      anchor: 0.42,                    // dove centrare la scritta lungo il contorno (0 = fondo, ~0.45 = punta)
      gap: 5,                          // spazio fra la scritta e l'inizio/fine della linea
      maxText: 0.62,                   // la scritta non occupa mai più del 62% del contorno
      align: 'top'                     // immagine più alta che larga: 'top' parte dall'alto, 'center' dal centro, 'bottom' dal basso
    }, opts || {});
    const img = avatarEl.querySelector('img');
    if(!img || avatarEl.querySelector('.av-frame')) return;
    const nick = (o.nick || (document.querySelector('.menuwrap .nick') || {}).textContent || '').trim();
    const label = o.text.replace('{nick}', nick).replace(/\s*•\s*$/, '');
    const id = 'avf' + (++uid);

    const render = () => {
      // Mai più grande dell'immagine reale: è questo che evita lo sgranato.
      const nat  = Math.min(img.naturalWidth || o.size, img.naturalHeight || o.size);
      const size = Math.min(o.size, nat);
      const shape = scalePath(FLAME, 1, 50, 58, 22, 22);
      const track = scalePath(TRACK, 1.2, 50, 58, 22, 22);
      // come ritagliare l'immagine se non è quadrata (xMid = sempre centrata in orizzontale)
      const fit = 'xMid' + ({top:'YMin', bottom:'YMax'}[o.align] || 'YMid') + ' slice';

      const frame = document.createElement('span');
      frame.className = 'av-frame';
      frame.style.setProperty('--av-size', size + 'px');
      frame.innerHTML =
        `<svg viewBox="0 0 144 144" role="img" aria-label="${esc(label)}">
           <defs>
             <clipPath id="${id}c"><path d="${shape}"/></clipPath>
             <path id="${id}t" d="${track}" fill="none"/>
           </defs>
           <image href="${img.currentSrc || img.src}" x="22" y="24" width="100" height="100"
                  preserveAspectRatio="${fit}" clip-path="url(#${id}c)"/>
           <path class="av-outline" d="${shape}"/>
           <path class="av-line" d="${track}"/>
           <text class="av-ring"><textPath href="#${id}t" text-anchor="middle">${esc(label)}</textPath></text>
         </svg>`;
      avatarEl.classList.add('av-shaped');
      avatarEl.appendChild(frame);

      // Misure reali (servono a pagina disegnata: dipendono da font e nick)
      const L    = frame.querySelector(`#${id}t`).getTotalLength();
      const text = frame.querySelector('text');
      const tp   = frame.querySelector('textPath');
      let T = text.getComputedTextLength();
      if(T > L * o.maxText){                          // nick lunghissimo: rimpicciolisce il font in proporzione
        const fs = parseFloat(getComputedStyle(text).fontSize);
        text.style.fontSize = (fs * (L * o.maxText) / T).toFixed(2) + 'px';
        T = text.getComputedTextLength();
      }
      const mid = L * o.anchor;
      tp.setAttribute('startOffset', mid.toFixed(1));

      // Linea su tutto il resto del contorno: dal fondo fino a prima della scritta,
      // poi da dopo la scritta fino al fondo (il punto d'inizio del percorso).
      const a = Math.max(0, mid - T / 2 - o.gap);     // fine della linea, prima della scritta
      const b = Math.min(L, mid + T / 2 + o.gap);     // ripresa della linea, dopo la scritta
      frame.querySelector('.av-line').setAttribute('stroke-dasharray', `${a.toFixed(1)} ${(b - a).toFixed(1)} ${L.toFixed(1)}`);
    };
    img.complete && img.naturalWidth ? render() : img.addEventListener('load', render, {once:true});
  };

  // Avvio nella skin. ForumFree può caricare lo script DOPO DOMContentLoaded:
  // in quel caso un semplice addEventListener non scatterebbe mai, quindi controlliamo readyState.
  const start = () => {
    const av = document.querySelector('.menuwrap .avatar');
    if(av) buildFlameAvatar(av, {size:120});
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
})();
