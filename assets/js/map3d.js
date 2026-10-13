// Deutschlandkarte als echtes 3D-Modell (WebGL, Three.js). Bundesländer wachsen aus dem Boden,
// rote Pins schweben, Bögen laufen von Berlin zu den Städten, Pulsringe um Berlin.
import * as THREE from '../libs/three/three.module.min.js';

const host = document.getElementById('map3d');
if (host) start(host);

function start(host) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return; // Poster bleibt sichtbar
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  host.appendChild(renderer.domElement);

  fetch('assets/data/de_states.json')
    .then((r) => r.json())
    .then((data) => build(data))
    .catch(() => { renderer.domElement.remove(); });

  function build(data) {
    const S = 1 / 20; // 1 Einheit = 20 km
    const RED = 0xa91b18;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 1, 400);
    const target = new THREE.Vector3(0, 0, 2);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x6a6764, 1.15));
    const sun = new THREE.DirectionalLight(0xffffff, 2.1);
    sun.position.set(-34, 62, 40);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0xffffff, 0.55);
    rim.position.set(40, 20, -30);
    scene.add(rim);

    const world = new THREE.Group();
    scene.add(world);

    // weicher Kontaktschatten auf dem Boden
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 256;
    const sc = shadowCanvas.getContext('2d');
    const grd = sc.createRadialGradient(128, 128, 20, 128, 128, 128);
    grd.addColorStop(0, 'rgba(0,0,0,0.55)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    sc.fillStyle = grd;
    sc.fillRect(0, 0, 256, 256);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -0.05, 3);
    shadow.scale.set(60, 70, 1);
    world.add(shadow);

    const berlin = new THREE.Vector3(data.cities['Berlin'][0] * S, 0, data.cities['Berlin'][1] * S);

    // Bundesländer
    const clay = new THREE.MeshStandardMaterial({ color: 0xf4f3ef, roughness: 0.92, metalness: 0 });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x8f8b85, transparent: true, opacity: 0.55 });
    const states = [];
    data.states.forEach((st, i) => {
      const shapes = [];
      st.polys.forEach((rings) => {
        const outer = rings[0].map((p) => new THREE.Vector2(p[0] * S, -p[1] * S));
        const shape = new THREE.Shape(outer);
        for (let h = 1; h < rings.length; h++) {
          shape.holes.push(new THREE.Path(rings[h].map((p) => new THREE.Vector2(p[0] * S, -p[1] * S))));
        }
        shapes.push(shape);
      });
      const depth = 0.55 + ((i * 37) % 7) * 0.05;
      const geo = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: false, curveSegments: 1 });
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, clay);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 28), edgeMat);
      const g = new THREE.Group();
      g.add(mesh);
      g.add(edges);
      geo.computeBoundingBox();
      const c = geo.boundingBox.getCenter(new THREE.Vector3());
      const dist = Math.hypot(c.x - berlin.x, c.z - berlin.z);
      g.userData.delay = 0.15 + dist * 0.045;
      g.scale.y = 0.0001;
      world.add(g);
      states.push(g);
    });

    // Pins
    const redMat = new THREE.MeshStandardMaterial({ color: RED, roughness: 0.28, metalness: 0.1, emissive: 0x3a0605 });
    const pins = [];
    const names = Object.keys(data.cities);
    names.forEach((name, i) => {
      const [cx, cz] = data.cities[name];
      const isBerlin = name === 'Berlin';
      const grp = new THREE.Group();
      grp.position.set(cx * S, 0.6, cz * S);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8), redMat);
      stem.position.y = 0.55;
      const head = new THREE.Mesh(new THREE.SphereGeometry(isBerlin ? 0.55 : 0.36, 24, 18), redMat);
      head.position.y = 1.35;
      grp.add(stem, head);
      grp.userData = { head, phase: i * 0.9, start: isBerlin ? 1.8 : 2.4 + i * 0.11, big: isBerlin };
      grp.scale.setScalar(0.0001);
      world.add(grp);
      pins.push(grp);
    });

    // Bögen von Berlin zu den anderen Städten
    const arcs = [];
    names.filter((n) => n !== 'Berlin').forEach((name, i) => {
      const [cx, cz] = data.cities[name];
      const a = new THREE.Vector3(berlin.x, 2.0, berlin.z);
      const b = new THREE.Vector3(cx * S, 2.0, cz * S);
      const mid = a.clone().lerp(b, 0.5);
      mid.y += a.distanceTo(b) * 0.38 + 1.2;
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const geo = new THREE.TubeGeometry(curve, 48, 0.05, 6, false);
      const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xd22a25 }));
      mesh.userData = { total: geo.index.count, start: 3.2 + i * 0.16 };
      geo.setDrawRange(0, 0);
      world.add(mesh);
      arcs.push(mesh);
    });

    // Pulsringe um Berlin
    const rings = [0, 1].map((k) => {
      const m = new THREE.Mesh(
        new THREE.RingGeometry(0.9, 1.05, 64),
        new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
      );
      m.rotation.x = -Math.PI / 2;
      m.position.set(berlin.x, 0.75, berlin.z);
      m.userData.offset = k * 1.2;
      world.add(m);
      return m;
    });

    // Größe, Kamera, Zeiger
    let aspect = 1;
    function fit() {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      aspect = w / h;
      renderer.setSize(w, h, false);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }
    const px = { x: 0, y: 0, sx: 0, sy: 0 };
    if (fine) {
      host.addEventListener('pointermove', (e) => {
        const r = host.getBoundingClientRect();
        px.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        px.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      });
      host.addEventListener('pointerleave', () => { px.x = 0; px.y = 0; });
    }

    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const easeOutBack = (t) => { t = clamp(t, 0, 1); const c1 = 1.3, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
    const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

    function frame(t, built) {
      // Kamera: Abstand passt sich dem Format an, leichte Schwenkbewegung
      const baseD = 86 * Math.max(1, 0.95 / aspect);
      const elev = (50 + px.sy * -4) * Math.PI / 180;
      const azim = Math.sin(t * 0.22) * 0.12 + px.sx * 0.28;
      camera.position.set(
        target.x + baseD * Math.cos(elev) * Math.sin(azim),
        target.y + baseD * Math.sin(elev),
        target.z + baseD * Math.cos(elev) * Math.cos(azim)
      );
      camera.lookAt(target);

      states.forEach((g) => {
        const p = built ? 1 : easeOutCubic((t - g.userData.delay) / 1.4);
        g.scale.y = Math.max(0.0001, p);
        g.visible = p > 0.001;
      });
      pins.forEach((grp) => {
        const u = grp.userData;
        const p = built ? 1 : easeOutBack((t - u.start) / 0.7);
        grp.scale.setScalar(Math.max(0.0001, p));
        u.head.position.y = 1.35 + Math.sin(t * 1.8 + u.phase) * 0.14;
      });
      arcs.forEach((m) => {
        const p = built ? 1 : easeOutCubic((t - m.userData.start) / 1.3);
        m.geometry.setDrawRange(0, Math.floor((m.userData.total * p) / 3) * 3);
      });
      rings.forEach((m) => {
        if (built && reduce) { m.material.opacity = 0; return; }
        const k = (((t - 2.0 - m.userData.offset) % 2.4) + 2.4) % 2.4 / 2.4;
        const on = t > 2.2;
        m.scale.setScalar(1 + k * 4.2);
        m.material.opacity = on ? (1 - k) * 0.65 : 0;
      });
      renderer.render(scene, camera);
    }

    fit();
    new ResizeObserver(() => { fit(); if (reduce) frame(0, true); }).observe(host);
    host.classList.add('is-live');

    if (reduce) { frame(0, true); return; }

    // Start, sobald der Rahmen sichtbar ist, Pause außerhalb
    let visible = false;
    let t0 = null;
    let raf = 0;
    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      if (t0 === null) t0 = now;
      px.sx += (px.x - px.sx) * 0.06;
      px.sy += (px.y - px.sy) * 0.06;
      frame((now - t0) / 1000, false);
    }
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.15 }).observe(host);
    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else raf = requestAnimationFrame(loop);
    });
  }
}
