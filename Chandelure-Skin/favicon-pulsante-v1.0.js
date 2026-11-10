/* Favicon che pulsa: una fiammella disegnata dallo script, con l'alone che si accende e si spegne.
   Su GitHub/jsDelivr va così com'è; se lo incolli direttamente in ForumFree, mettilo tra <script> e </script>. */
(function () {
  var CFG = {
    corpo: '#9389F9',   // --sette
    bordo: '#FCFCFC',   // --nove
    cuore: '#FAB9F4',   // --otto
    alone: '#9389F9',   // colore della luce che pulsa
    durata: 1600,       // ms per un battito completo
    fotogrammi: 16,     // più sono, più è fluido
    lato: 64            // px del disegno (il browser lo rimpicciolisce)
  };

  var FIAMMA = 'M50 97 C27 97 12 80 12 60 C12 42 24 30 34 20 C40 14 42 8 40 2 C52 8 60 16 62 26 C64 20 66 16 70 13 C72 22 88 38 88 60 C88 80 73 97 50 97 Z';
  var CUORE  = 'M50 90 C38 90 31 81 31 70 C31 58 41 50 47 40 C53 50 69 58 69 70 C69 81 62 90 50 90 Z';

  function disegna(k) { // k: 0 = spenta, 1 = massimo bagliore
    var s = CFG.lato, c = document.createElement('canvas');
    c.width = c.height = s;
    var x = c.getContext('2d');
    var fiamma = new Path2D(FIAMMA), cuore = new Path2D(CUORE);
    var scala = s / 100 * (0.8 + 0.08 * k);

    x.translate(s / 2, s / 2);
    x.scale(scala, scala);
    x.translate(-50, -50);

    x.shadowColor = CFG.alone;                // alone (non scala col disegno: è in px)
    x.shadowBlur = (2 + 12 * k) * s / 64;
    x.fillStyle = CFG.corpo;
    x.fill(fiamma);
    x.fill(fiamma);                           // due passate = alone più intenso

    x.shadowBlur = 0;
    x.lineWidth = 5;
    x.lineJoin = 'round';
    x.strokeStyle = CFG.bordo;
    x.stroke(fiamma);

    x.globalAlpha = 0.7 + 0.3 * k;
    x.fillStyle = CFG.cuore;
    x.fill(cuore);
    return c.toDataURL('image/png');
  }

  function start() {
    // tolgo le favicon esistenti e ne metto una mia
    var vecchie = document.querySelectorAll('link[rel~="icon"]');
    for (var i = 0; i < vecchie.length; i++) vecchie[i].parentNode.removeChild(vecchie[i]);
    var link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    document.head.appendChild(link);

    // preparo i fotogrammi una volta sola (andata e ritorno con un coseno, così il battito è morbido)
    var frames = [];
    for (var f = 0; f < CFG.fotogrammi; f++) {
      frames.push(disegna((1 - Math.cos(f / CFG.fotogrammi * 2 * Math.PI)) / 2));
    }

    // chi ha chiesto meno animazioni nel sistema vede la fiammella ferma
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      link.href = frames[Math.floor(CFG.fotogrammi / 2)];
      return;
    }

    var n = 0;
    link.href = frames[0];
    setInterval(function () {
      n = (n + 1) % frames.length;
      link.href = frames[n];
    }, CFG.durata / CFG.fotogrammi);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
