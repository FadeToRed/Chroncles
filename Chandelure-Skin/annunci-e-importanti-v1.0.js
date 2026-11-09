/* Elenco discussioni: annunci e importanti in due riquadri a carosello
   Sposta i li.annuncio e li.importante dell'elenco in due riquadri sopra le discussioni.
   Se in un riquadro ce n'è più d'una, scorrono da sole (si fermano col mouse sopra)
   e si possono sfogliare con le frecce. */
(function(){
  const INTERVALLO = 6000;   // millisecondi fra un annuncio e il successivo
  const fermo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FRECCIA = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function riquadro(items, nome){
    const slot = document.createElement('div');
    slot.className = 'tl-slot tl-' + nome;
    slot.setAttribute('role', 'region');
    slot.setAttribute('aria-label', nome === 'annunci' ? 'Annunci' : 'Discussioni importanti');

    const track = document.createElement('ul');
    track.className = 'tl-track';
    items.forEach((li, n) => { li.classList.toggle('tl-active', n === 0); track.appendChild(li); });
    slot.appendChild(track);
    if(items.length < 2) return slot;

    let i = 0, timer = null;
    const nav = document.createElement('div');
    nav.className = 'tl-nav';
    nav.innerHTML =
      `<button type="button" class="tl-prev" aria-label="Precedente">${FRECCIA('M15 5 L8 12 L15 19')}</button>` +
      `<span class="tl-count" aria-live="polite"></span>` +
      `<button type="button" class="tl-next" aria-label="Successivo">${FRECCIA('M9 5 L16 12 L9 19')}</button>`;
    const conta = nav.querySelector('.tl-count');
    const mostra = n => {
      items[i].classList.remove('tl-active');
      i = (n + items.length) % items.length;
      items[i].classList.add('tl-active');
      conta.textContent = (i + 1) + ' / ' + items.length;
    };
    const avvia = () => { if(!fermo && !timer) timer = setInterval(() => mostra(i + 1), INTERVALLO); };
    const ferma = () => { clearInterval(timer); timer = null; };

    nav.querySelector('.tl-prev').addEventListener('click', () => mostra(i - 1));
    nav.querySelector('.tl-next').addEventListener('click', () => mostra(i + 1));
    // pausa mentre il mouse o la tastiera sono sul riquadro
    slot.addEventListener('mouseenter', ferma);
    slot.addEventListener('mouseleave', avvia);
    slot.addEventListener('focusin', ferma);
    slot.addEventListener('focusout', e => { if(!slot.contains(e.relatedTarget)) avvia(); });

    slot.appendChild(nav);
    mostra(0);
    avvia();
    return slot;
  }

  function costruisci(){
    const ol = document.querySelector('.forum .big_list');
    if(!ol || document.querySelector('.forum .tl-evidenza')) return;
    const annunci   = [...ol.querySelectorAll(':scope > li.annuncio')];
    const importanti = [...ol.querySelectorAll(':scope > li.importante')];
    if(!annunci.length && !importanti.length) return;

    const box = document.createElement('div');
    box.className = 'tl-evidenza';
    if(annunci.length)    box.appendChild(riquadro(annunci, 'annunci'));
    if(importanti.length) box.appendChild(riquadro(importanti, 'importanti'));
    if(!annunci.length || !importanti.length) box.classList.add('tl-uno');

    // se dopo restano discussioni normali, aggiunge il separatore
    if(ol.children.length){
      const sep = document.createElement('div');
      sep.className = 'tl-sep';
      sep.textContent = 'Discussioni';
      box.appendChild(sep);
    }
    // sopra l'intestazione dell'elenco, nello stesso contenitore (resta dentro il modulo di moderazione)
    const top = ol.parentElement.querySelector(':scope > .title.top');
    ol.parentElement.insertBefore(box, top || ol);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', costruisci) : costruisci();
})();
