// Lazy 3D hero scene — a quiet, monochrome particle wave-field behind the hero
// photo. The vendored Three.js build (~150 KB compressed) is dynamically
// imported on idle, after first paint, and only when every check passes; the
// hero is fully designed without it, so any failure just leaves the canvas
// empty. CSP-safe: everything loads from 'self'.
const canvas = document.getElementById('hero-canvas');
const hero = document.getElementById('hero');

function eligible() {
  if (!canvas || !hero) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.innerWidth <= 734) return false;
  if (navigator.connection && navigator.connection.saveData) return false;
  try {
    const probe = document.createElement('canvas');
    if (!probe.getContext('webgl2') && !probe.getContext('webgl')) return false;
  } catch {
    return false;
  }
  return true;
}

async function boot() {
  if (!eligible()) return;

  let THREE;
  try {
    THREE = await import('./vendor/three.module.min.js');
  } catch {
    return; // vendored build missing/unloadable — hero stays as designed
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 2.4, 9);
  camera.lookAt(0, -0.5, 0);

  // A flat grid of points, displaced into a slow rolling wave — a pedestal
  // floor for the content. ~1,700 points; positions updated per frame.
  const COLS = 72;
  const ROWS = 24;
  const COUNT = COLS * ROWS;
  const positions = new Float32Array(COUNT * 3);
  const base = [];
  let n = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = (c / (COLS - 1) - 0.5) * 30;
      const z = (r / (ROWS - 1) - 0.5) * 13;
      base.push(x, z);
      positions[n * 3] = x;
      positions[n * 3 + 1] = -2;
      positions[n * 3 + 2] = z;
      n++;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    size: 0.05,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true,
  });
  scene.add(new THREE.Points(geometry, material));

  // Match the active theme; keep matching when the toggle flips it.
  function applyTheme() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    material.color.set(dark ? 0x2997ff : 0x1d1d1f);
    material.opacity = dark ? 0.32 : 0.15;
  }
  applyTheme();
  new MutationObserver(applyTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  function resize() {
    const w = hero.clientWidth;
    const h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // Pointer parallax — the camera leans a little toward the cursor.
  let targetX = 0;
  let targetY = 0;
  if (window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      targetX = ((e.clientX - r.left) / r.width - 0.5) * 1.2;
      targetY = ((e.clientY - r.top) / r.height - 0.5) * 0.5;
    });
    hero.addEventListener('pointerleave', () => {
      targetX = 0;
      targetY = 0;
    });
  }

  // Render only while the hero is on screen and the tab is visible.
  let inView = true;
  let rafId = 0;
  new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    if (inView) start();
  }).observe(hero);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && inView) start();
  });

  const pos = geometry.attributes.position;
  function tick(t) {
    rafId = 0;
    if (!inView || document.hidden) return;
    const time = t * 0.0006;
    for (let i = 0; i < COUNT; i++) {
      const x = base[i * 2];
      const z = base[i * 2 + 1];
      pos.array[i * 3 + 1] =
        -2 + Math.sin(x * 0.45 + time) * 0.35 + Math.cos(z * 0.7 + time * 0.8) * 0.28;
    }
    pos.needsUpdate = true;
    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (2.4 + targetY - camera.position.y) * 0.04;
    camera.lookAt(0, -0.5, 0);
    renderer.render(scene, camera);
    start();
  }
  function start() {
    if (!rafId) rafId = requestAnimationFrame(tick);
  }
  start();
}

if ('requestIdleCallback' in window) {
  requestIdleCallback(boot, { timeout: 2500 });
} else {
  setTimeout(boot, 1500);
}
