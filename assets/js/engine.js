/* Concepts Media, Bewegungs-Engine
   Eigene Umsetzung: Vorhang mit Zähler, Textreveal, Parallax, Scroll-Wörter,
   Abschnitte mit Bildwechsel, horizontale Galerie, Zahlen und 3D-Gitter im Hero. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* 1. Textreveal: Wörter in Masken aufteilen, die beim Sichtbarwerden hochgleiten */
  function splitWords(root) {
    var index = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var w = document.createElement('span');
            w.className = 'w';
            var inner = document.createElement('span');
            inner.textContent = p;
            inner.style.transitionDelay = (index++ * 0.045).toFixed(3) + 's';
            w.appendChild(inner);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    })(root);
  }

  /* 2. Scroll-Wörter: jedes Wort wird beim Scrollen hell */
  function scrollWords(el) {
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span');
            s.className = 'sw';
            s.textContent = p;
            words.push(s);
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    })(el);
    // Wörter in <em> rot markieren
    el.querySelectorAll('em .sw').forEach(function (w) { w.classList.add('em'); });
    return words;
  }

  /* 3. Vorhang beim ersten Besuch */
  function preloader() {
    var pre = document.querySelector('.preloader');
    if (!pre) return;
    var seen = false;
    try { seen = sessionStorage.getItem('cm-intro') === '1'; } catch (e) {}
    if (seen || reduce) { pre.remove(); return; }
    var num = pre.querySelector('.preloader__count');
    var dur = 1500;
    var start = null;
    document.body.classList.add('is-loading');
    function tick(now) {
      if (start === null) start = now;
      var p = Math.min(100, Math.round((now - start) / dur * 100));
      if (num) num.textContent = p + '%';
      if (p < 100) { requestAnimationFrame(tick); return; }
      pre.classList.add('is-done');
      document.body.classList.remove('is-loading');
      try { sessionStorage.setItem('cm-intro', '1'); } catch (e) {}
      setTimeout(function () { pre.remove(); }, 1200);
      revealHeroNow();
    }
    requestAnimationFrame(tick);
  }

  function revealHeroNow() {
    document.querySelectorAll('.hero .split').forEach(function (el) {
      setTimeout(function () { el.classList.add('is-in'); }, 80);
    });
  }

  /* 4. Sichtbarkeit: Reveal, Masken, Zahlen */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('is-in');
      if (el.hasAttribute('data-count')) countUp(el);
      io.unobserve(el);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }) : null;

  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = fmt(target) + suffix; return; }
    var start = null;
    var dur = 1800;
    function step(now) {
      if (start === null) start = now;
      var t = clamp((now - start) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(Math.round(target * eased)) + suffix;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function fmt(n) { return n.toLocaleString('de-DE'); }

  /* 5. Parallax: Bilder und Elemente mit data-speed wandern gegenläufig zum Scroll */
  var parallaxEls = [];
  function collectParallax() {
    parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-speed]'));
    parallaxEls.forEach(function (el) {
      el._speed = parseFloat(el.getAttribute('data-speed')) || 0.12;
    });
  }

  /* 6. Abschnitte mit Scroll-Fortschritt: Wörter, Leistungen, Galerie */
  var scrollWordEls = [];
  var swapSections = [];
  var hscrolls = [];

  function progressOf(section) {
    var r = section.getBoundingClientRect();
    var total = section.offsetHeight - window.innerHeight;
    return total > 0 ? clamp(-r.top / total, 0, 1) : 0;
  }

  function onScroll() {
    var vh = window.innerHeight;

    var header = document.querySelector('.site-header');
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);

    if (!reduce) {
      parallaxEls.forEach(function (el) {
        var host = el.parentElement;
        var r = host.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var offset = (r.top + r.height / 2) - vh / 2;   // 0, wenn der Rahmen mittig steht
        var max = r.height * 0.12;
        var y = clamp(-offset * el._speed, -max, max);
        el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      });
    }

    scrollWordEls.forEach(function (box) {
      var r = box.el.getBoundingClientRect();
      var p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
      var n = box.words.length;
      var on = Math.round(p * n);
      box.words.forEach(function (w, i) { w.classList.toggle('is-on', i < on); });
    });

    swapSections.forEach(function (s) {
      var p = progressOf(s.el);
      var idx = Math.min(s.items.length - 1, Math.floor(p * s.items.length));
      s.items.forEach(function (it, i) { it.classList.toggle('is-active', i === idx); });
      s.imgs.forEach(function (img, i) { img.classList.toggle('is-active', i === idx); });
      if (s.bar) s.bar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
    });

    hscrolls.forEach(function (h) {
      var p = progressOf(h.el);
      var max = Math.max(0, h.track.scrollWidth - window.innerWidth + 2 * parseFloat(getComputedStyle(h.track).paddingLeft));
      h.track.style.transform = 'translate3d(' + (-p * max).toFixed(1) + 'px,0,0)';
      if (h.bar) h.bar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
    });
  }

  var ticking = false;
  function requestScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; onScroll(); });
  }

  /* 7. Start */
  function init() {
    // Textreveal für Überschriften
    document.querySelectorAll('.split').forEach(splitWords);

    // Scroll-Wörter
    document.querySelectorAll('.scrollwords').forEach(function (el) {
      scrollWordEls.push({ el: el, words: scrollWords(el) });
    });

    // Abschnitte mit Bildwechsel
    document.querySelectorAll('[data-swap]').forEach(function (el) {
      swapSections.push({
        el: el,
        items: Array.prototype.slice.call(el.querySelectorAll('[data-swap-item]')),
        imgs: Array.prototype.slice.call(el.querySelectorAll('[data-swap-img]')),
        bar: el.querySelector('.swap__bar i')
      });
    });

    // Horizontale Galerie
    document.querySelectorAll('[data-hscroll]').forEach(function (el) {
      hscrolls.push({ el: el, track: el.querySelector('.hscroll__track'), bar: el.querySelector('.hscroll__progress i') });
    });

    // Sichtbarkeit
    if (io) {
      document.querySelectorAll('.split, .clip, [data-count], .reveal').forEach(function (el) { io.observe(el); });
    } else {
      document.querySelectorAll('.split, .clip, .reveal').forEach(function (el) { el.classList.add('is-in'); });
    }

    // Hero-Video: bei reduzierter Bewegung anhalten und Poster zeigen
    var heroVideo = document.querySelector('.hero-video');
    if (heroVideo && reduce) { heroVideo.removeAttribute('autoplay'); heroVideo.pause(); }
    if (heroVideo && !reduce) {
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && heroVideo.paused) {
          var p = heroVideo.play();
          if (p && p.catch) p.catch(function () {});
        }
      });
    }

    collectParallax();
    preloader();

    window.addEventListener('scroll', requestScroll, { passive: true });
    window.addEventListener('resize', requestScroll);
    onScroll();
  }

  // 3D-Gitter im Hero (Three.js aus dem CDN)
  function lattice() {
    var host = document.querySelector('.hero [data-lattice]');
    if (!host || !window.THREE || reduce) return;
    var THREE = window.THREE;
    var renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    host.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 9.5, 17);
    camera.lookAt(0, 0, 0);

    var group = new THREE.Group();
    scene.add(group);

    var N = 9, GAP = 1.35, SIZE = 1.05;
    var seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32 });
    var redMat = new THREE.MeshBasicMaterial({ color: 0xa91b18 });
    var blueMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
    var blocks = [];

    for (var x = 0; x < N; x++) {
      for (var z = 0; z < N; z++) {
        var h = 0.6 + Math.pow(rnd(), 2.2) * 6.2;
        var geo = new THREE.BoxGeometry(SIZE, 1, SIZE);
        geo.translate(0, 0.5, 0);
        var mesh = new THREE.Mesh(geo, (x + z) % 7 === 0 ? redMat : (rnd() > 0.82 ? blueMat : new THREE.MeshBasicMaterial({ color: 0x0c0c0c })));
        var edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
        var cell = new THREE.Group();
        cell.add(mesh);
        cell.add(edges);
        cell.position.set((x - (N - 1) / 2) * GAP, 0, (z - (N - 1) / 2) * GAP);
        cell.userData = { base: h, phase: (x * 0.6 + z * 0.45) };
        group.add(cell);
        blocks.push(cell);
      }
    }
    group.rotation.x = -0.12;

    var mx = 0, my = 0;
    if (fine) {
      host.parentElement.addEventListener('pointermove', function (e) {
        var r = host.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      });
    }

    function resize() {
      var w = host.clientWidth, hh = host.clientHeight;
      renderer.setSize(w, hh, false);
      camera.aspect = w / hh;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(host);
    }

    var t0 = performance.now();
    function frame(now) {
      requestAnimationFrame(frame);
      if (!visible) return;
      var t = (now - t0) / 1000;
      group.rotation.y = Math.sin(t * 0.07) * 0.22 + mx * 0.12;
      group.rotation.x = -0.12 + my * 0.04;
      blocks.forEach(function (c) {
        var s = c.userData.base * (0.82 + 0.18 * Math.sin(t * 0.9 + c.userData.phase));
        c.scale.y = s;
      });
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }

  function boot() {
    init();
    lattice();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
