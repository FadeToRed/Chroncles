/* Utenti connessi: avatar a fiammella
   - ritaglia a fiammella gli avatar dell'elenco "ultime 24 ore";
   - aggiunge l'avatar anche agli utenti online negli ultimi 30 minuti (ForumFree non lo mostra),
     prendendolo dall'elenco delle 24 ore, dove c'è sicuramente anche chi è online adesso. */
(function(){
  const AVATAR_VUOTO = 'https://img.forumfree.net/style_images/default_avatar.png';

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
    // ultime 24 ore
    document.querySelectorAll('.stats .day_user .dailyusers-member-link img').forEach(avvolgi);
    // online negli ultimi 30 minuti
    document.querySelectorAll('.stats > li.top .users > li').forEach(li => {
      const a = li.querySelector('a');
      const id = (li.className.match(/\bm(\d+)\b/) || [])[1];
      if(!a || !id || a.querySelector('.wl-av')) return;
      const orig = document.querySelector(`.stats .day_user [data-mid="${id}"] img`);
      const img = document.createElement('img');
      img.alt = '';
      img.src = orig ? orig.src : AVATAR_VUOTO;
      img.onerror = () => { img.onerror = null; img.src = AVATAR_VUOTO; };
      a.prepend(img);
      avvolgi(img);
    });
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
    setTimeout(() => { obs.disconnect(); sistema(); }, 10000);   // se dopo 10 secondi non c'è, procede lo stesso
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', avvia) : avvia();
})();
