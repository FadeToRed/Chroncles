/* Tendine del menu laterale sempre dentro lo schermo
   Quando una tendina di .menuwrap > .left si apre (al passaggio del mouse), lo script
   misura dove finisce: se va oltre il fondo dello schermo la alza quanto basta;
   se è più alta dello schermo intero, la limita in altezza e la rende scorrevole. */
(function(){
  const MARGINE = 12;   // spazio minimo (px) da lasciare fra la tendina e il fondo/cima dello schermo

  function sistema(ul){
    // riparte sempre dalla posizione decisa dal CSS
    ul.style.marginTop = '';
    ul.style.maxHeight = '';
    ul.style.overflowY = '';

    const r = ul.getBoundingClientRect();
    if(!r.height) return;                              // tendina non visibile
    const spazio = window.innerHeight - MARGINE * 2;

    if(r.height > spazio){
      // più alta dello schermo: la porta in cima e la fa scorrere
      ul.style.maxHeight = spazio + 'px';
      ul.style.overflowY = 'auto';
    }
    const r2 = ul.getBoundingClientRect();
    let sposta = 0;
    if(r2.bottom > window.innerHeight - MARGINE) sposta = (window.innerHeight - MARGINE) - r2.bottom;
    if(r2.top + sposta < MARGINE) sposta = MARGINE - r2.top;
    if(sposta){
      const mt = parseFloat(getComputedStyle(ul).marginTop) || 0;
      ul.style.marginTop = (mt + sposta) + 'px';
    }
  }

  function avvia(){
    document.querySelectorAll('.menuwrap > .left > li').forEach(li => {
      const ul = li.querySelector(':scope > ul');
      if(!ul) return;
      // al mouseenter il :hover è già attivo, quindi la tendina è visibile e misurabile
      li.addEventListener('mouseenter', () => requestAnimationFrame(() => sistema(ul)));
    });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', avvia) : avvia();
})();
