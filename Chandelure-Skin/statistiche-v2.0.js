/* Utenti connessi nelle ultime 24 ore: avatar a fiammella
   Racchiude ogni avatar dell'elenco "ultime 24 ore" in due span (cornice + immagine),
   che il CSS ritaglia a fiammella. Gli utenti attivi non ne hanno bisogno:
   il loro avatar lo inserisce già ForumFree e si sistema solo col CSS. */
(function(){
  function avvolgi(img){
    if(img.closest('.wl-av')) return;
    const fuori = document.createElement('span');
    fuori.className = 'wl-av';
    const dentro = document.createElement('span');
    dentro.className = 'wl-av-in';
    img.replaceWith(fuori);
    dentro.appendChild(img);
    fuori.appendChild(dentro);
  }
  function sistema(){
    document.querySelectorAll('.stats .day_user .dailyusers-member-link img').forEach(avvolgi);
  }
  // l'elenco delle 24 ore lo disegna ForumFree dopo il caricamento della pagina: aspetta che compaia
  function avvia(){
    const stats = document.querySelector('.stats');
    if(!stats) return;
    if(stats.querySelector('.day_user .dailyusers-member')) return sistema();
    const obs = new MutationObserver(() => {
      if(stats.querySelector('.day_user .dailyusers-member')){ obs.disconnect(); sistema(); }
    });
    obs.observe(stats, {childList: true, subtree: true});
    setTimeout(() => { obs.disconnect(); sistema(); }, 10000);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', avvia) : avvia();
})();
