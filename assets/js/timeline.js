/* Horizontale Scroll-Timeline: die Schiene fährt seitwärts, jede Station zeichnet ihren Strich
   und lässt Titel und Text zeilenweise aus einer Maske steigen. Umsetzung der Vorlage mit GSAP. */
(function () {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger || !window.SplitText) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  var section = document.getElementById('journey');
  if (!section) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var slider = section.querySelector('.tl__slider');
  var items = Array.prototype.slice.call(section.querySelectorAll('.tl__item'));
  // chronologische Reihenfolge, wie in der Vorlage: Reihenfolge der data-step Werte
  items.sort(function (a, b) { return Number(a.dataset.step) - Number(b.dataset.step); });

  function q(sel) { return section.querySelector(sel); }

  var isMobile = window.innerWidth < 600;
  var slidePercent = isMobile ? -57 : -65;
  var lineWidth = isMobile ? '65%' : '98%';
  var lineStart = isMobile ? 'top 30%' : 'top 25%';
  var slideEnd = isMobile ? '82% 50%' : '92% bottom';
  var lineEnd = isMobile ? '80% 50%' : '92% bottom';
  var duration = 1.4;

  // Seitwärts fahren
  gsap.timeline({
    scrollTrigger: { trigger: section, start: 'top top', end: slideEnd, scrub: true },
    defaults: { ease: 'none' }
  }).fromTo(slider, { xPercent: 0 }, { xPercent: slidePercent });

  if (reduce) {
    gsap.set(section.querySelector('.journey-line'), { width: lineWidth });
    return;
  }

  // Mittellinie zieht sich auf
  gsap.to(section.querySelector('.journey-line'), {
    width: lineWidth,
    ease: 'none',
    scrollTrigger: { trigger: section, start: lineStart, end: lineEnd, scrub: true }
  });

  // Zeitfenster pro Station, in Prozent der Abschnittshöhe
  var positions = isMobile
    ? [[22, 32], [28, 38], [36, 46], [45, 55], [52, 62], [60, 70], [69, 79]]
    : [[6, 26], [16, 36], [26, 46], [35, 55], [45, 65], [55, 75], [65, 85]];

  var splits = [];

  items.forEach(function (item, index) {
    var line = item.querySelector('.tl__stem-line');
    var dot = item.querySelector('.tl__stem-dot');
    var title = item.querySelector('h4');
    var text = item.querySelector('p');
    var isTop = item.dataset.row === 'top';

    gsap.set(line, { scaleY: 0, transformOrigin: isTop ? 'bottom bottom' : 'top top' });
    gsap.set(dot, { scale: 0 });

    var titleSplit = new SplitText(title, { type: 'chars, words, lines', mask: 'lines' });
    var textSplit = new SplitText(text, { type: 'chars, words, lines', mask: 'lines' });
    splits.push(titleSplit, textSplit);

    var pos = positions[index];
    var tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: pos[0] + '% 30%', end: pos[1] + '% 50%', scrub: true }
    });

    tl.to(line, { scaleY: 1, duration: duration * 0.4 })
      .to(dot, { scale: 1, duration: duration * 0.4 }, '<')
      .fromTo(titleSplit.lines, { y: 100 }, { y: 0, delay: -0.8 * duration, duration: duration, stagger: 0.02, ease: 'power2.out' })
      .fromTo(textSplit.lines, { y: 100 }, { y: 0, duration: duration, stagger: 0.02, ease: 'power2.out' }, '<');
  });

  // Schriften und Bilder erst laden lassen, dann Positionen neu messen
  var refresh = function () { ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh);
  window.addEventListener('resize', refresh);
})();
