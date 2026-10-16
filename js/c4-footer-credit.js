import { gsap } from './vendor/gsap/index.js';
import { C4_WORDMARK_MORPH_PAIRS } from './vendor/c4/c4WordmarkData.js';

const SIZES = { small: 28, default: 36, large: 48, xl: 72 };
const FULL_VIEWBOX = '50 100 880 400';
const FULL_ASPECT = 880 / 400;
const LOCKUP_TRANSFORM = 'translate(18 -273) scale(1.5)';

const COLOURS = {
  dormant: { fourBody: '#b8b9ba', fourArm: '#c5c6c7', cArc: '#e6e4e2' },
  mono: { fourBody: '#414243', fourArm: '#6c6d6d', cArc: '#e6e4e2', text: '#f3f2f0' },
  colour: { fourBody: '#a30000', fourArm: '#22632f', cArc: '#f3f2f3', text: '#f3f2f0' },
};

/* The mark at the lockup's scale, trued on 17 Oct 2026 ("Cuts 15.81, stem
   lines up"): the stem's foot rises to y 398.34 and its right edge goes
   vertical, so the channel under the stem is as wide as the slanted cut, and
   the T's stem widens to the upper stem's left edge, x 271.12. The C is
   unchanged. */
const FULL_UPRIGHT = {
  fourBody: '303.88 303.92 303.88 398.34 271.12 398.34 271.12 343.47 228.18 405.86 271.12 405.86 255.72 428.97 184.95 428.97 184.95 413.1 263.67 303.92 303.88 303.92',
  fourArm: '344.11 405.86 328.71 428.97 303.88 428.97 303.88 482.39 271.12 482.39 271.12 428.97 264.76 428.97 280.17 405.86 344.11 405.86',
  cArc: 'M227.07,440.52l21.95.11c-17.85,20.3-41.9,34.05-68.37,39.1-42.51,8.81-85.9-10.45-108.08-47.97-18.17-30.46-14.55-69.27,8.95-95.79,15.71-18.02,37.74-29.24,61.48-31.32,26.14-3.66,52.76-1.51,77.99,6.28l-17.77,24.76c-14.77-3.1-29.94-3.81-44.94-2.11-20.89,1.13-40,12.19-51.48,29.78-6.66,13.21-8.03,28.49-3.84,42.69,6.27,22.39,23.69,39.88,45.96,46.15,26.61,5.37,54.24,1.23,78.14-11.68Z',
};

/* Build B, "Stroke" (17 Oct 2026), ported from the C4 site's master
   (c4-footer-credit/C4FooterCredit.jsx): the same pieces, fronts, beats and
   curve. The C is wiped on by a straight front at its top cut's angle. The 4
   is drawn as one stroke: the stem and the diagonal leave the apex together,
   the diagonal turns into the crossbar, the crossbar runs right through the
   cut into the green, and the T's stem drops last. Each stroke is its piece
   clipped by one straight front, so every frame is straight-edged polygons
   with their true ends. Each colour is one path whose subpaths all wind the
   same way, so no seam shows where two strokes meet. Units are the logo
   file's own; LOCKUP_MATRIX takes them into the lockup's. */
const MARK_C =
  'M393.33,381.58l46.14.22c-37.51,42.67-88.07,71.58-143.72,82.18-89.37,18.53-180.59-21.95-227.2-100.84-38.21-64.03-30.59-145.6,18.81-201.36,33.03-37.88,79.33-61.47,129.25-65.83,54.95-7.69,110.91-3.19,163.94,13.2l-37.35,52.04c-31.06-6.51-62.95-8.01-94.47-4.41-43.91,2.38-84.08,25.62-108.21,62.59-14,27.78-16.89,59.9-8.08,89.75,13.18,47.07,49.8,83.83,96.63,97.01,55.92,11.27,114.01,2.59,164.26-24.56Z';
const LOCKUP_MATRIX = 'matrix(0.4757183 0 0 0.4757183 39.958331 258.997324)';

/* the beats, in seconds */
const BUILD = {
  c: [0, 0.48],
  stem: [0.08, 0.4],
  diagonal: [0.08, 0.52],
  bar: [0.43, 0.77],
  tee: [0.68, 0.96],
  end: 0.96,
};
/* the crossbar landing on the T's right end knocks the first letter */
const IMPACT_AT = 0.74;
/* reduced motion: the finished mark fades in over 0.2 s */
const REDUCED_FADE = 0.2;

/* CSS cubic-bezier(), exactly */
const cubicBezier = (x1, y1, x2, y2) => {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  const solve = (x) => {
    let t = x;
    for (let k = 0; k < 8; k++) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-7) return t;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let k = 0; k < 60; k++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-7) break;
      if (x > v) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };
  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : sy(solve(x)));
};
/* pen: the strokes' curve. site: the C4 site's ease, for the reduced-motion fade */
const pen = cubicBezier(0.4, 0, 0.18, 1);
const siteEase = cubicBezier(0.22, 1, 0.36, 1);

const span = (t, a, b) => (t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const rightNormal = (d) => {
  const l = Math.hypot(d[0], d[1]);
  const n = [d[1] / l, -d[0] / l];
  return n[0] >= 0 ? n : [-n[0], -n[1]];
};
/* the part of a polygon where a*x + b*y <= c (Sutherland-Hodgman) */
const clipPoly = (poly, a, b, c) => {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const fp = a * p[0] + b * p[1] - c;
    const fq = a * q[0] + b * q[1] - c;
    if (fp <= 0) out.push(p);
    if ((fp <= 0) !== (fq <= 0)) {
      const t = fp / (fp - fq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
};
/* the C flattened, only to find how far its wipe travels */
const flattenC = (d, perCubic) => {
  const tk = d.match(/[MlcZ]|-?(?:\d+\.?\d*|\.\d+)/g);
  const out = [];
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  const num = () => Number(tk[i++]);
  while (i < tk.length) {
    if (/[MlcZ]/.test(tk[i])) cmd = tk[i++];
    if (cmd === 'Z') continue;
    if (cmd === 'M') { x = num(); y = num(); out.push([x, y]); cmd = 'l'; }
    else if (cmd === 'l') { x += num(); y += num(); out.push([x, y]); }
    else if (cmd === 'c') {
      const x1 = x + num(); const y1 = y + num();
      const x2 = x + num(); const y2 = y + num();
      const x3 = x + num(); const y3 = y + num();
      for (let s = 1; s <= perCubic; s++) {
        const t = s / perCubic;
        const u = 1 - t;
        out.push([
          u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
          u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
        ]);
      }
      x = x3;
      y = y3;
    }
  }
  return out;
};

const B3 = [485.93, 177.58];
const B4 = [395.65, 308.72];
const B9 = [470.27, 94.43];
const CUT_DIR = [-32.38, 48.58];
const Q = [B4[0] + CUT_DIR[0], 357.3];
/* the five strokes' pieces, all wound clockwise on screen; their union is the 4 */
const PIECES = {
  stem: [[485.93, 94.43], [554.78, 94.43], [554.78, 292.91], [485.93, 292.91]],
  diagonal: [B9, [485.93, 94.43], B3, B4, Q, [304.78, 357.3], [304.78, 323.95]],
  crossRed: [B4, [485.93, 308.72], [453.55, 357.3], Q],
  crossGreen: [[504.93, 308.72], [639.36, 308.72], [606.98, 357.3], [472.55, 357.3]],
  stemGreen: [[485.93, 357.3], [554.78, 357.3], [554.78, 469.58], [485.93, 469.58]],
};
const N_CUT = rightNormal(CUT_DIR);
const N_C = rightNormal([-37.35, 52.04]);
const U_SEAM = dot(B4, N_CUT);
const U_END = dot([639.36, 308.72], N_CUT);
const C_WIDTHS = flattenC(MARK_C, 64).map((p) => dot(p, N_C));
const CW0 = Math.min(...C_WIDTHS);
const CW1 = Math.max(...C_WIDTHS);
const C_BOX = [[30, 80], [460, 80], [460, 480], [30, 480]];

const f3 = (v) => String(Math.round(v * 1000) / 1000);
const pathOf = (polys) => polys.map((p) => `M${p.map((q) => `${f3(q[0])} ${f3(q[1])}`).join('L')}Z`).join('');
const pointsOf = (poly) => poly.map((q) => `${f3(q[0])},${f3(q[1])}`).join(' ');

/* draw the build at t seconds into the C's clip polygon and the two paths */
function drawBuildFrame(t, { cClip, red, green }) {
  const e = (beat) => pen(span(t, beat[0], beat[1]));
  const ec = e(BUILD.c);
  const es = e(BUILD.stem);
  const ed = e(BUILD.diagonal);
  const ex = e(BUILD.bar);
  const et = e(BUILD.tee);
  if (cClip) {
    let pts = '';
    if (ec >= 1) pts = pointsOf(C_BOX);
    else if (ec > 0) pts = pointsOf(clipPoly(C_BOX, N_C[0], N_C[1], lerp(CW0, CW1, ec)));
    if (cClip.getAttribute('points') !== pts) cClip.setAttribute('points', pts);
  }
  const reds = [];
  const greens = [];
  const add = (list, poly) => { if (poly.length >= 3) list.push(poly); };
  const uX = lerp(U_SEAM, U_END, ex);
  if (es > 0) add(reds, clipPoly(PIECES.stem, 0, 1, lerp(94.43, 292.91, es)));
  if (ed > 0) add(reds, clipPoly(PIECES.diagonal, 0, 1, lerp(94.43, 357.3, ed)));
  if (ex > 0) add(reds, clipPoly(PIECES.crossRed, N_CUT[0], N_CUT[1], uX));
  if (ex > 0) add(greens, clipPoly(PIECES.crossGreen, N_CUT[0], N_CUT[1], uX));
  if (et > 0) add(greens, clipPoly(PIECES.stemGreen, 0, 1, lerp(357.3, 469.58, et)));
  if (red) red.setAttribute('d', pathOf(reds));
  if (green) green.setAttribute('d', pathOf(greens));
}

const TENSION_DURATION = 0.035;
const LETTER_SPRINGS = [
  { peakAngle: -18.0, dampingRatio: 0.26, naturalFreq: 13.0, totalDuration: 0.95, tensionAngle: 2.5 },
  { peakAngle: -14.0, dampingRatio: 0.27, naturalFreq: 13.5, totalDuration: 0.82, tensionAngle: 2.0 },
  { peakAngle: -10.5, dampingRatio: 0.28, naturalFreq: 14.0, totalDuration: 0.70, tensionAngle: 1.5 },
  { peakAngle: -7.5, dampingRatio: 0.29, naturalFreq: 14.5, totalDuration: 0.60, tensionAngle: 1.1 },
  { peakAngle: -5.0, dampingRatio: 0.30, naturalFreq: 15.0, totalDuration: 0.50, tensionAngle: 0.8 },
  { peakAngle: -3.2, dampingRatio: 0.31, naturalFreq: 15.5, totalDuration: 0.42, tensionAngle: 0.5 },
  { peakAngle: -2.0, dampingRatio: 0.32, naturalFreq: 16.0, totalDuration: 0.35, tensionAngle: 0.3 },
];

function ns(tag) {
  return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

function attrs(node, values) {
  Object.keys(values).forEach((key) => node.setAttribute(key, values[key]));
  return node;
}

function computeSpringTrajectory(spring) {
  const { peakAngle, dampingRatio, naturalFreq, totalDuration, tensionAngle } = spring;
  const wd = naturalFreq * Math.sqrt(1 - dampingRatio * dampingRatio);
  const zetaOmega = dampingRatio * naturalFreq;
  const alpha = Math.atan2(wd, zetaOmega);
  const tPeakSpring = alpha / wd;
  const peakDecay = Math.exp(-zetaOmega * tPeakSpring);
  let impulseV = peakAngle * wd / (peakDecay * Math.sin(alpha));
  let B2 = (impulseV + zetaOmega * tensionAngle) / wd;
  let actualPeak = 0;

  for (let s = 0; s <= 500; s++) {
    const t = (s / 500) * tPeakSpring * 2.5;
    const d = Math.exp(-zetaOmega * t);
    const val = d * (tensionAngle * Math.cos(wd * t) + B2 * Math.sin(wd * t));
    if (val < actualPeak) actualPeak = val;
  }

  if (Math.abs(actualPeak) > 0.1) {
    impulseV *= peakAngle / actualPeak;
    B2 = (impulseV + zetaOmega * tensionAngle) / wd;
  }

  const numRaw = Math.max(30, Math.round(totalDuration * 60));
  const stepDur = totalDuration / numRaw;
  const allRotations = [];

  for (let i = 0; i <= numRaw; i++) {
    const t = i * stepDur;
    let rotation;
    if (t <= TENSION_DURATION) {
      const frac = t / TENSION_DURATION;
      rotation = tensionAngle * (1 - (1 - frac) * (1 - frac));
    } else {
      const springT = t - TENSION_DURATION;
      const decay = Math.exp(-zetaOmega * springT);
      rotation = decay * (tensionAngle * Math.cos(wd * springT) + B2 * Math.sin(wd * springT));
    }
    allRotations.push(rotation);
  }

  const resolveThreshold = Math.max(0.4, Math.abs(peakAngle) * 0.12);
  let resolveIdx = numRaw;
  for (let i = Math.floor(numRaw * 0.4); i <= numRaw; i++) {
    if (Math.abs(allRotations[i]) < 0.3) {
      let maxAfter = 0;
      for (let j = i; j <= numRaw; j++) maxAfter = Math.max(maxAfter, Math.abs(allRotations[j]));
      if (maxAfter < resolveThreshold) {
        resolveIdx = i;
        break;
      }
    }
  }

  const keyframes = [];
  for (let i = 0; i <= resolveIdx; i++) keyframes.push({ rotation: allRotations[i] });
  keyframes[resolveIdx].rotation = 0;

  return {
    keyframes,
    stepDur,
    numKeyframes: resolveIdx,
    tPeak: TENSION_DURATION + tPeakSpring,
    resolveDuration: resolveIdx * stepDur,
  };
}

function hingeTranslationY(rotationDeg, hingeHeightRatio) {
  const rad = (rotationDeg * Math.PI) / 180;
  return hingeHeightRatio * (1 - Math.cos(rad)) * 0.50;
}

function computeImpactChain(baseImpactAt) {
  const times = [baseImpactAt];
  for (let i = 1; i < LETTER_SPRINGS.length; i++) {
    const prev = LETTER_SPRINGS[i - 1];
    const wd = prev.naturalFreq * Math.sqrt(1 - prev.dampingRatio * prev.dampingRatio);
    const prevAlpha = Math.atan2(wd, prev.dampingRatio * prev.naturalFreq);
    const prevToPeak = TENSION_DURATION + prevAlpha / wd;
    times.push(times[i - 1] + prevToPeak * 0.68);
  }
  return times;
}

function parseOriginPair(origin) {
  const [x = '0%', y = '100%'] = origin.split(' ');
  return { x: Number.parseFloat(x) / 100, y: Number.parseFloat(y) / 100 };
}

function getFixedLetterHinge(letterNode, hingeOrigin) {
  const box = letterNode.getBBox();
  const { x, y } = parseOriginPair(hingeOrigin);
  return { x: box.x + box.width * x, y: box.y + box.height * y };
}

function getColours(colorScheme) {
  const isDark = colorScheme === 'auto'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : colorScheme !== 'light';
  const dormant = { ...COLOURS.dormant };
  const mono = { ...COLOURS.mono };

  if (isDark) {
    dormant.fourBody = '#606264';
    dormant.fourArm = '#707274';
    dormant.cArc = '#d0cecc';
    mono.fourBody = '#9a9b9c';
    mono.fourArm = '#8a8b8c';
    mono.cArc = '#d0cecc';
    mono.text = '#f3f2f0';
  }

  return { dormant, mono, colour: COLOURS.colour };
}

function addPath(parent, d, fill, refName, refs) {
  const path = attrs(ns('path'), { d, fill });
  if (refName) refs[refName] = path;
  parent.appendChild(path);
  return path;
}

function addPolygon(parent, points, fill, refName, refs) {
  const poly = attrs(ns('polygon'), { points, fill });
  if (refName) refs[refName] = poly;
  parent.appendChild(poly);
  return poly;
}

function renderCredit(root, options) {
  const h = typeof options.size === 'number' ? options.size : (SIZES[options.size] || Number(options.size) || SIZES.default);
  const w = Math.round(h * FULL_ASPECT);
  const uid = `c4-${Math.random().toString(36).slice(2)}`;
  const { dormant, mono, colour } = getColours(options.colorScheme);
  const refs = {};

  root.textContent = '';
  root.dataset.c4Ready = 'true';
  root.style.display = 'inline-flex';
  root.style.flexDirection = 'column';
  root.style.alignItems = 'center';
  root.style.gap = '4px';
  root.style.textDecoration = 'none';
  root.style.color = 'inherit';
  root.style.userSelect = 'none';
  root.setAttribute('aria-label', options.label);

  const svg = attrs(ns('svg'), {
    viewBox: FULL_VIEWBOX,
    width: w,
    height: h,
    xmlns: 'http://www.w3.org/2000/svg',
    shapeRendering: 'geometricPrecision',
  });
  svg.style.overflow = 'visible';

  const defs = ns('defs');
  defs.innerHTML = `
    <filter id="${uid}-presence" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="1" stdDeviation="3.5" flood-color="#000000" flood-opacity="0.22"></feDropShadow>
    </filter>
    <filter id="${uid}-backdrop-blur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="14"></feGaussianBlur>
    </filter>
    <clipPath id="${uid}-c-wipe" clipPathUnits="userSpaceOnUse"></clipPath>
  `;
  refs.cWipe = attrs(ns('polygon'), { points: '' });
  defs.querySelector(`#${uid}-c-wipe`).appendChild(refs.cWipe);
  svg.appendChild(defs);

  const lockup = attrs(ns('g'), { transform: LOCKUP_TRANSFORM });
  svg.appendChild(lockup);

  refs.backdrop = attrs(ns('ellipse'), {
    cx: 206,
    cy: 389,
    rx: 165,
    ry: 120,
    fill: '#555',
    opacity: 0.15,
    filter: `url(#${uid}-backdrop-blur)`,
  });
  lockup.appendChild(refs.backdrop);

  refs.cBase = addPath(lockup, FULL_UPRIGHT.cArc, mono.cArc, null, refs);
  refs.cBase.setAttribute('filter', `url(#${uid}-presence)`);
  /* the C's straight wipe, in the mark's own units; the finished C takes over at 0.48 s */
  refs.cBuild = attrs(ns('g'), { transform: LOCKUP_MATRIX });
  addPath(refs.cBuild, MARK_C, colour.cArc, null, refs).setAttribute('clip-path', `url(#${uid}-c-wipe)`);
  lockup.appendChild(refs.cBuild);
  addPath(lockup, FULL_UPRIGHT.cArc, colour.cArc, 'cSeal', refs);

  addPolygon(lockup, FULL_UPRIGHT.fourBody, dormant.fourBody, 'bodyDormant', refs);
  addPolygon(lockup, FULL_UPRIGHT.fourBody, mono.fourBody, 'bodyBase', refs);
  addPolygon(lockup, FULL_UPRIGHT.fourBody, colour.fourBody, 'bodySeal', refs);

  const armGroup = ns('g');
  refs.armDormant = ns('g');
  addPolygon(refs.armDormant, FULL_UPRIGHT.fourArm, dormant.fourArm, null, refs);
  refs.armBase = ns('g');
  addPolygon(refs.armBase, FULL_UPRIGHT.fourArm, mono.fourArm, null, refs);
  armGroup.append(refs.armDormant, refs.armBase);
  addPolygon(armGroup, FULL_UPRIGHT.fourArm, colour.fourArm, 'armSeal', refs);
  lockup.appendChild(armGroup);

  /* the 4's strokes, one path per colour; the finished 4 takes over at 0.96 s */
  refs.build = attrs(ns('g'), { transform: LOCKUP_MATRIX });
  addPath(refs.build, '', colour.fourBody, 'buildRed', refs);
  addPath(refs.build, '', colour.fourArm, 'buildGreen', refs);
  lockup.appendChild(refs.build);

  refs.wordGroup = ns('g');
  refs.wordLetters = C4_WORDMARK_MORPH_PAIRS.map((pair) => (
    addPath(
      refs.wordGroup,
      pair.normalized.normalizedPaths?.uprightPath || pair.raw.uprightPath,
      mono.text,
      null,
      refs,
    )
  ));
  lockup.appendChild(refs.wordGroup);
  root.appendChild(svg);

  if (options.showText) {
    const text = document.createElement('span');
    text.textContent = options.label;
    text.style.fontSize = '11px';
    text.style.color = 'rgba(255,255,255,0.42)';
    text.style.lineHeight = '1.4';
    text.style.letterSpacing = '0.04em';
    text.style.whiteSpace = 'nowrap';
    root.appendChild(text);
  }

  return refs;
}

function buildTimelines(refs, reducedMotion) {
  const stage = { current: 0 };
  const inFlight = { current: null };

  const wordLetters = refs.wordLetters.filter(Boolean);
  const impactTimes = computeImpactChain(IMPACT_AT);
  const buildEls = { cClip: refs.cWipe, red: refs.buildRed, green: refs.buildGreen };

  gsap.set(refs.cBase, { opacity: 1 });
  gsap.set(refs.bodyDormant, { opacity: 1 });
  gsap.set(refs.armDormant, { opacity: 1 });
  gsap.set(refs.bodyBase, { opacity: 0 });
  gsap.set(refs.armBase, { opacity: 0 });
  gsap.set(refs.cSeal, { opacity: 0 });
  gsap.set(refs.bodySeal, { opacity: 0 });
  gsap.set(refs.armSeal, { opacity: 0 });
  gsap.set([refs.cBuild, refs.build], { autoAlpha: 0 });
  drawBuildFrame(0, buildEls);
  gsap.set(wordLetters, { x: 0, y: 0, opacity: 0, rotation: 0, scaleY: 1, force3D: false });

  wordLetters.forEach((letter, index) => {
    const pair = C4_WORDMARK_MORPH_PAIRS[index];
    const uprightPath = pair.normalized.normalizedPaths?.uprightPath || pair.raw.uprightPath;
    const hinge = getFixedLetterHinge(letter, pair.hingeOrigin || '7% 98%');
    gsap.set(letter, {
      attr: { d: uprightPath },
      svgOrigin: `${hinge.x} ${hinge.y}`,
      transformOrigin: `${hinge.x}px ${hinge.y}px`,
    });
  });
  gsap.set(refs.wordGroup, { y: 0, opacity: 1 });
  gsap.set(refs.backdrop, { attr: { cx: 206, cy: 389, rx: 165, ry: 120 }, opacity: 0.15 });

  /* Reduced motion keeps every stage with the movement taken out: the stages
     fade, the finished colour mark fades in over 0.2 s instead of being
     drawn, and the word fades where it stands. */
  const reduced = reducedMotion;

  const monoTl = gsap.timeline({
    paused: true,
    onComplete: () => { stage.current = 1; },
    onReverseComplete: () => { stage.current = 0; },
  });
  const room = { attr: { cx: 255, cy: 398, rx: 215, ry: 132 } };
  if (reduced) monoTl.set(refs.backdrop, room, 0);
  else monoTl.to(refs.backdrop, { ...room, duration: 0.5, ease: 'power2.out' }, 0);
  monoTl.to(refs.bodyDormant, { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 0.05);
  monoTl.to(refs.armDormant, { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 0.05);
  monoTl.to(refs.bodyBase, { opacity: 1, duration: 0.4, ease: 'power2.inOut' }, 0.05);
  monoTl.to(refs.armBase, { opacity: 1, duration: 0.4, ease: 'power2.inOut' }, 0.05);
  wordLetters.forEach((letter, i) => {
    monoTl.fromTo(letter, { opacity: 0, y: reduced ? 0 : 8 }, { opacity: 1, y: 0, duration: 0.38, ease: 'power3.out' }, 0.18 + i * 0.04);
  });

  const colourTl = gsap.timeline({
    paused: true,
    onComplete: () => { stage.current = 2; },
    onReverseComplete: () => { stage.current = 1; },
  });

  if (reduced) {
    colourTl.to([refs.cSeal, refs.bodySeal, refs.armSeal], { opacity: 1, duration: REDUCED_FADE, ease: siteEase }, 0);
    colourTl.to([refs.cBase, refs.bodyBase, refs.armBase], { opacity: 0, duration: REDUCED_FADE, ease: siteEase }, REDUCED_FADE);
  } else {
    colourTl.to(refs.cBase, { opacity: 0, duration: 0.25, ease: 'power2.out' }, 0);
    colourTl.to(refs.bodyBase, { opacity: 0, duration: 0.25, ease: 'power2.out' }, 0);
    colourTl.to(refs.armBase, { opacity: 0, duration: 0.25, ease: 'power2.out' }, 0);

    /* The timeline is the build's clock, so a hover that ends early runs the
       stroke backwards. Each part hands over to the finished mark as it
       lands: the C at 0.48 s, the 4 at 0.96 s. */
    const build = { t: 0 };
    colourTl.set([refs.cBuild, refs.build], { autoAlpha: 1 }, 0);
    colourTl.fromTo(build, { t: 0 }, {
      t: BUILD.end,
      duration: BUILD.end,
      ease: 'none',
      onUpdate: () => { drawBuildFrame(build.t, buildEls); },
    }, 0);
    colourTl.set(refs.cSeal, { opacity: 1 }, BUILD.c[1]);
    colourTl.set(refs.cBuild, { autoAlpha: 0 }, BUILD.c[1]);
    colourTl.set([refs.bodySeal, refs.armSeal], { opacity: 1 }, BUILD.end);
    colourTl.set(refs.build, { autoAlpha: 0 }, BUILD.end);

    LETTER_SPRINGS.forEach((spring, index) => {
      const letter = wordLetters[index];
      const pair = C4_WORDMARK_MORPH_PAIRS[index];
      if (!letter || !pair.normalized.normalizedPaths) return;
      const impactAt = impactTimes[index];
      const letterBox = letter.getBBox();
      const hingeHeight = letterBox.height;
      const { keyframes, stepDur, numKeyframes, tPeak, resolveDuration } = computeSpringTrajectory(spring);
      for (let ki = 0; ki <= numKeyframes; ki++) {
        const kf = keyframes[ki];
        const kfTime = impactAt + ki * stepDur;
        const props = { rotation: kf.rotation, y: hingeTranslationY(kf.rotation, hingeHeight) };
        if (ki === 0) colourTl.set(letter, props, kfTime);
        else colourTl.to(letter, { ...props, duration: stepDur, ease: 'none' }, kfTime);
      }
      const springToPeak = tPeak - TENSION_DURATION;
      const morphStart = impactAt + TENSION_DURATION + springToPeak * 0.25;
      const morphDuration = Math.max(0.05, springToPeak * 0.60);
      colourTl.to(letter, { attr: { d: pair.normalized.normalizedPaths.italicPath }, duration: morphDuration, ease: 'sine.inOut' }, morphStart);
      colourTl.to(letter, { rotation: 0, y: 0, duration: 0.08, ease: 'power2.out' }, impactAt + resolveDuration);
    });

    const lockTime = Math.max(...LETTER_SPRINGS.map((sp, i) => {
      const { resolveDuration } = computeSpringTrajectory(sp);
      return impactTimes[i] + resolveDuration + 0.08;
    }));
    wordLetters.forEach((letter) => colourTl.set(letter, { rotation: 0, y: 0, x: 0 }, lockTime));
  }

  const dormantTl = gsap.timeline({
    paused: true,
    onComplete: () => { stage.current = 0; },
    onReverseComplete: () => { stage.current = 2; },
  });
  wordLetters.forEach((letter, i) => {
    const pair = C4_WORDMARK_MORPH_PAIRS[i];
    const uprightPath = pair.normalized.normalizedPaths?.uprightPath || pair.raw.uprightPath;
    dormantTl.to(letter, { attr: { d: uprightPath }, duration: 0.28, ease: 'power2.inOut' }, i * 0.025);
  });
  wordLetters.forEach((letter, i) => dormantTl.to(letter, { opacity: 0.5, duration: 0.16, ease: 'power2.in' }, 0.26 + i * 0.02));
  wordLetters.forEach((letter, i) => {
    if (reduced) dormantTl.to(letter, { opacity: 0, duration: 0.34, ease: 'power3.in' }, 0.38 + i * 0.035);
    else dormantTl.to(letter, { scaleY: 0, y: 1.5, opacity: 0, duration: 0.34, ease: 'power3.in' }, 0.38 + i * 0.035);
  });
  /* The mark doesn't un-draw: the dormant greys come up under the colour and
     the colour fades off them, so the whole mark settles in one motion. */
  dormantTl.to([refs.cBase, refs.bodyDormant, refs.armDormant], { opacity: 1, duration: 0.36, ease: 'power2.inOut' }, 0.4);
  dormantTl.to([refs.bodyBase, refs.armBase], { opacity: 0, duration: 0.3, ease: 'power2.inOut' }, 0.4);
  dormantTl.to([refs.cSeal, refs.bodySeal, refs.armSeal], { opacity: 0, duration: 0.42, ease: 'power2.inOut' }, 0.52);
  const rest = { attr: { cx: 206, cy: 389, rx: 165, ry: 120 } };
  if (reduced) dormantTl.set(refs.backdrop, rest, 0.80);
  else dormantTl.to(refs.backdrop, { ...rest, duration: 0.45, ease: 'power2.inOut' }, 0.80);
  dormantTl.set(wordLetters, { y: 0, rotation: 0, x: 0, scaleY: 1, opacity: 0 }, 1.30);

  return { stage, inFlight, monoTl, colourTl, dormantTl };
}

function initCredit(root) {
  const label = root.dataset.label || root.getAttribute('aria-label') || 'Designed by C4 Studios';
  const options = {
    label,
    size: root.dataset.size ? Number(root.dataset.size) : 'small',
    showText: root.dataset.showText !== 'false',
    colorScheme: root.dataset.colorScheme || 'dark',
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const refs = renderCredit(root, options);
  const timelines = buildTimelines(refs, reducedMotion);
  let touchStart = 0;
  let touchConsumed = false;

  function activeTimeline() {
    if (timelines.stage.current === 0) return timelines.monoTl;
    if (timelines.stage.current === 1) return timelines.colourTl;
    if (timelines.stage.current === 2) return timelines.dormantTl;
    return null;
  }

  function playTimeline(tl) {
    if (!tl) return;
    timelines.inFlight.current = tl;
    if (tl.progress() >= 1) tl.restart();
    else tl.play();
  }

  /* Reduced motion still answers every hover; the timelines fade instead. */
  root.addEventListener('mouseenter', () => {
    playTimeline(activeTimeline());
  });

  root.addEventListener('mouseleave', () => {
    const tl = timelines.inFlight.current;
    timelines.inFlight.current = null;
    if (tl && tl.progress() < 1) tl.reverse();
  });

  root.addEventListener('touchstart', () => {
    touchStart = Date.now();
    playTimeline(activeTimeline());
  }, { passive: true });

  root.addEventListener('touchend', (event) => {
    const elapsed = Date.now() - touchStart;
    touchStart = 0;
    const tl = timelines.inFlight.current;
    timelines.inFlight.current = null;

    if (elapsed >= 300) {
      event.preventDefault();
      touchConsumed = true;
    }
    if (tl && tl.progress() < 1) tl.reverse();
  });

  root.addEventListener('click', (event) => {
    if (touchConsumed) {
      event.preventDefault();
      event.stopPropagation();
      touchConsumed = false;
    }
  });
}

document.querySelectorAll('[data-c4-footer-credit]').forEach(initCredit);
