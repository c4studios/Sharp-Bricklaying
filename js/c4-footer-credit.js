import { gsap } from '../node_modules/gsap/index.js';
import { C4_WORDMARK_MORPH_PAIRS } from '../src/components/c4-footer-credit/c4WordmarkData.js';

const SIZES = { small: 28, default: 36, large: 48, xl: 72 };
const FULL_VIEWBOX = '50 100 880 400';
const FULL_ASPECT = 880 / 400;
const LOCKUP_TRANSFORM = 'translate(18 -273) scale(1.5)';

const COLOURS = {
  dormant: { fourBody: '#b8b9ba', fourArm: '#c5c6c7', cArc: '#e6e4e2' },
  mono: { fourBody: '#414243', fourArm: '#6c6d6d', cArc: '#e6e4e2', text: '#f3f2f0' },
  colour: { fourBody: '#a30000', fourArm: '#22632f', cArc: '#f3f2f3', text: '#f3f2f0' },
};

const FULL_UPRIGHT = {
  fourBody: '303.88 303.92 303.87 401.82 271.12 401.82 271.12 343.47 228.18 405.86 271.12 405.86 255.72 428.97 184.95 428.97 184.95 413.1 263.67 303.92 303.88 303.92',
  fourArm: '344.11 405.86 328.71 428.97 303.88 428.97 303.88 482.39 279.58 482.39 279.58 428.97 264.76 428.97 280.17 405.86 344.11 405.86',
  cArc: 'M227.07,440.52l21.95.11c-17.85,20.3-41.9,34.05-68.37,39.1-42.51,8.81-85.9-10.45-108.08-47.97-18.17-30.46-14.55-69.27,8.95-95.79,15.71-18.02,37.74-29.24,61.48-31.32,26.14-3.66,52.76-1.51,77.99,6.28l-17.77,24.76c-14.77-3.1-29.94-3.81-44.94-2.11-20.89,1.13-40,12.19-51.48,29.78-6.66,13.21-8.03,28.49-3.84,42.69,6.27,22.39,23.69,39.88,45.96,46.15,26.61,5.37,54.24,1.23,78.14-11.68Z',
};

const FOUR_SEGMENTS = {
  stemUpper: '303.88 303.92 303.87 401.82 271.12 401.82 271.12 343.47 263.67 303.92',
  diagonal: '263.67 303.92 271.12 343.47 228.18 405.86 271.12 405.86 255.72 428.97 184.95 428.97 184.95 413.1',
  stemLower: '303.88 428.97 303.88 482.39 279.58 482.39 279.58 428.97',
  crossArm: '344.11 405.86 328.71 428.97 264.76 428.97 280.17 405.86',
};

const FOUR_BUILD = {
  stemLower: { at: 0.18, duration: 0.26, origin: '291.73px 482.39px' },
  stemUpper: { at: 0.44, duration: 0.28, origin: '287.5px 401.82px' },
  diagonal: { at: 0.74, duration: 0.32, junctionX: 263.67, junctionY: 303.92, angle: 32.2 },
  bodySealAt: 1.06,
  crossArm: { at: 1.07, duration: 0.15, origin: '264.76px 417.42px' },
  impactAt: 1.22,
  armSealAt: 1.52,
};

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
    <clipPath id="${uid}-c-clip" clipPathUnits="userSpaceOnUse"></clipPath>
    <clipPath id="${uid}-stem-upper" clipPathUnits="userSpaceOnUse"><polygon points="${FOUR_SEGMENTS.stemUpper}"></polygon></clipPath>
    <clipPath id="${uid}-diagonal" clipPathUnits="userSpaceOnUse"><polygon points="${FOUR_SEGMENTS.diagonal}"></polygon></clipPath>
    <clipPath id="${uid}-stem-lower" clipPathUnits="userSpaceOnUse"><polygon points="${FOUR_SEGMENTS.stemLower}"></polygon></clipPath>
    <clipPath id="${uid}-cross-arm" clipPathUnits="userSpaceOnUse"><polygon points="${FOUR_SEGMENTS.crossArm}"></polygon></clipPath>
  `;
  refs.cClipRect = attrs(ns('circle'), {});
  defs.querySelector(`#${uid}-c-clip`).appendChild(refs.cClipRect);
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
  refs.cColour = attrs(ns('g'), {});
  addPath(refs.cColour, FULL_UPRIGHT.cArc, colour.cArc, null, refs).setAttribute('clip-path', `url(#${uid}-c-clip)`);
  lockup.appendChild(refs.cColour);

  addPolygon(lockup, FULL_UPRIGHT.fourBody, dormant.fourBody, 'bodyDormant', refs);
  addPolygon(lockup, FULL_UPRIGHT.fourBody, mono.fourBody, 'bodyBase', refs);
  addPolygon(lockup, FULL_UPRIGHT.fourBody, colour.fourBody, 'bodySeal', refs);

  refs.stemUpper = attrs(ns('g'), { 'clip-path': `url(#${uid}-stem-upper)` });
  addPolygon(refs.stemUpper, FULL_UPRIGHT.fourBody, colour.fourBody, null, refs);
  lockup.appendChild(refs.stemUpper);

  refs.diagonalGrowth = attrs(ns('g'), { transform: `rotate(${FOUR_BUILD.diagonal.angle} ${FOUR_BUILD.diagonal.junctionX} ${FOUR_BUILD.diagonal.junctionY})` });
  const diagonalInner = attrs(ns('g'), {
    transform: `rotate(${-FOUR_BUILD.diagonal.angle} ${FOUR_BUILD.diagonal.junctionX} ${FOUR_BUILD.diagonal.junctionY})`,
    'clip-path': `url(#${uid}-diagonal)`,
  });
  addPolygon(diagonalInner, FULL_UPRIGHT.fourBody, colour.fourBody, null, refs);
  refs.diagonalGrowth.appendChild(diagonalInner);
  lockup.appendChild(refs.diagonalGrowth);

  const armGroup = ns('g');
  refs.armDormant = ns('g');
  addPolygon(refs.armDormant, FULL_UPRIGHT.fourArm, dormant.fourArm, null, refs);
  refs.armBase = ns('g');
  addPolygon(refs.armBase, FULL_UPRIGHT.fourArm, mono.fourArm, null, refs);
  refs.stemLower = attrs(ns('g'), { 'clip-path': `url(#${uid}-stem-lower)` });
  addPolygon(refs.stemLower, FULL_UPRIGHT.fourArm, colour.fourArm, null, refs);
  refs.crossArm = attrs(ns('g'), { 'clip-path': `url(#${uid}-cross-arm)` });
  addPolygon(refs.crossArm, FULL_UPRIGHT.fourArm, colour.fourArm, null, refs);
  armGroup.append(refs.armDormant, refs.armBase, refs.stemLower, refs.crossArm);
  addPolygon(armGroup, FULL_UPRIGHT.fourArm, colour.fourArm, 'armSeal', refs);
  lockup.appendChild(armGroup);

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

  const cBox = refs.cBase.getBBox();
  const wordLetters = refs.wordLetters.filter(Boolean);
  const impactTimes = computeImpactChain(FOUR_BUILD.impactAt);
  const cCenter = { x: cBox.x + cBox.width * 0.38, y: cBox.y + cBox.height * 0.5 };
  const cFullRadius = Math.sqrt(cBox.width ** 2 + cBox.height ** 2) * 0.65;

  gsap.set(refs.cBase, { opacity: 1 });
  gsap.set(refs.bodyDormant, { opacity: 1 });
  gsap.set(refs.armDormant, { opacity: 1 });
  gsap.set(refs.bodyBase, { opacity: 0 });
  gsap.set(refs.armBase, { opacity: 0 });
  gsap.set(refs.cColour, { opacity: 0 });
  gsap.set(refs.bodySeal, { opacity: 0 });
  gsap.set(refs.armSeal, { opacity: 0 });
  gsap.set(refs.stemLower, { opacity: 0, scaleY: 0, transformOrigin: FOUR_BUILD.stemLower.origin, svgOrigin: FOUR_BUILD.stemLower.origin.replaceAll('px', '') });
  gsap.set(refs.stemUpper, { opacity: 0, scaleY: 0, transformOrigin: FOUR_BUILD.stemUpper.origin, svgOrigin: FOUR_BUILD.stemUpper.origin.replaceAll('px', '') });
  gsap.set(refs.diagonalGrowth, { opacity: 0, scaleY: 0, svgOrigin: `${FOUR_BUILD.diagonal.junctionX} ${FOUR_BUILD.diagonal.junctionY}` });
  gsap.set(refs.crossArm, { opacity: 0, scaleX: 0, transformOrigin: FOUR_BUILD.crossArm.origin, svgOrigin: FOUR_BUILD.crossArm.origin.replaceAll('px', '') });
  gsap.set(refs.cClipRect, { attr: { cx: cCenter.x, cy: cCenter.y, r: 0 } });
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

  if (reducedMotion) {
    return { stage, inFlight, monoTl: null, colourTl: null, dormantTl: null };
  }

  const monoTl = gsap.timeline({
    paused: true,
    onComplete: () => { stage.current = 1; },
    onReverseComplete: () => { stage.current = 0; },
  });
  monoTl.to(refs.backdrop, { attr: { cx: 255, cy: 398, rx: 215, ry: 132 }, duration: 0.5, ease: 'power2.out' }, 0);
  monoTl.to(refs.bodyDormant, { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 0.05);
  monoTl.to(refs.armDormant, { opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 0.05);
  monoTl.to(refs.bodyBase, { opacity: 1, duration: 0.4, ease: 'power2.inOut' }, 0.05);
  monoTl.to(refs.armBase, { opacity: 1, duration: 0.4, ease: 'power2.inOut' }, 0.05);
  wordLetters.forEach((letter, i) => {
    monoTl.fromTo(letter, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.38, ease: 'power3.out' }, 0.18 + i * 0.04);
  });

  const colourTl = gsap.timeline({
    paused: true,
    onComplete: () => { stage.current = 2; },
    onReverseComplete: () => { stage.current = 1; },
  });
  colourTl.to(refs.cBase, { opacity: 0, duration: 0.25, ease: 'power2.out' }, 0);
  colourTl.to(refs.bodyBase, { opacity: 0, duration: 0.25, ease: 'power2.out' }, 0);
  colourTl.to(refs.armBase, { opacity: 0, duration: 0.25, ease: 'power2.out' }, 0);
  colourTl.set(refs.cClipRect, { attr: { cx: cCenter.x, cy: cCenter.y, r: 0 } }, 0);
  colourTl.to(refs.cColour, { opacity: 1, duration: 0.01 }, 0);
  colourTl.to(refs.cClipRect, { attr: { r: cFullRadius }, duration: 0.65, ease: 'power2.out' }, 0.02);
  colourTl.set(refs.stemLower, { opacity: 1, scaleY: 0 }, FOUR_BUILD.stemLower.at);
  colourTl.set(refs.stemUpper, { opacity: 1, scaleY: 0 }, FOUR_BUILD.stemUpper.at);
  colourTl.set(refs.diagonalGrowth, { opacity: 1, scaleY: 0 }, FOUR_BUILD.diagonal.at);
  colourTl.set(refs.crossArm, { opacity: 1, scaleX: 0 }, FOUR_BUILD.crossArm.at);
  colourTl.to(refs.stemLower, { scaleY: 1, duration: FOUR_BUILD.stemLower.duration, ease: 'none' }, FOUR_BUILD.stemLower.at);
  colourTl.to(refs.stemUpper, { scaleY: 1, duration: FOUR_BUILD.stemUpper.duration, ease: 'none' }, FOUR_BUILD.stemUpper.at);
  colourTl.to(refs.diagonalGrowth, { scaleY: 1, duration: FOUR_BUILD.diagonal.duration, ease: 'none' }, FOUR_BUILD.diagonal.at);
  colourTl.to(refs.bodySeal, { opacity: 1, duration: 0.06, ease: 'none' }, FOUR_BUILD.bodySealAt);
  colourTl.to(refs.stemUpper, { opacity: 0, duration: 0.06, ease: 'none' }, FOUR_BUILD.bodySealAt);
  colourTl.to(refs.diagonalGrowth, { opacity: 0, duration: 0.06, ease: 'none' }, FOUR_BUILD.bodySealAt);
  colourTl.to(refs.crossArm, { scaleX: 1, duration: FOUR_BUILD.crossArm.duration, ease: 'power2.in' }, FOUR_BUILD.crossArm.at);
  colourTl.to(refs.armSeal, { opacity: 1, duration: 0.06, ease: 'none' }, FOUR_BUILD.armSealAt);
  colourTl.to(refs.stemLower, { opacity: 0, duration: 0.06, ease: 'none' }, FOUR_BUILD.armSealAt);
  colourTl.to(refs.crossArm, { opacity: 0, duration: 0.06, ease: 'none' }, FOUR_BUILD.armSealAt);

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
  wordLetters.forEach((letter, i) => dormantTl.to(letter, { scaleY: 0, y: 1.5, opacity: 0, duration: 0.34, ease: 'power3.in' }, 0.38 + i * 0.035));
  dormantTl.set(refs.stemLower, { opacity: 1 }, 0.4);
  dormantTl.set(refs.crossArm, { opacity: 1 }, 0.4);
  dormantTl.to(refs.armSeal, { opacity: 0, duration: 0.06, ease: 'none' }, 0.4);
  dormantTl.to(refs.crossArm, { scaleX: 0, duration: 0.18, ease: 'power2.out' }, 0.44);
  dormantTl.set(refs.stemUpper, { opacity: 1 }, 0.5);
  dormantTl.set(refs.diagonalGrowth, { opacity: 1 }, 0.5);
  dormantTl.to(refs.bodySeal, { opacity: 0, duration: 0.06, ease: 'none' }, 0.5);
  dormantTl.to(refs.diagonalGrowth, { scaleY: 0, duration: 0.28, ease: 'power2.inOut' }, 0.54);
  dormantTl.to(refs.stemUpper, { scaleY: 0, duration: 0.24, ease: 'power2.inOut' }, 0.62);
  dormantTl.to(refs.stemLower, { scaleY: 0, duration: 0.22, ease: 'power2.inOut' }, 0.72);
  dormantTl.to(refs.cClipRect, { attr: { r: 0 }, duration: 0.58, ease: 'power2.inOut' }, 0.48);
  dormantTl.to(refs.cColour, { opacity: 0, duration: 0.05 }, 1.04);
  dormantTl.to(refs.cBase, { opacity: 1, duration: 0.35, ease: 'power2.inOut' }, 0.65);
  dormantTl.to(refs.bodyDormant, { opacity: 1, duration: 0.35, ease: 'power2.inOut' }, 0.70);
  dormantTl.to(refs.armDormant, { opacity: 1, duration: 0.35, ease: 'power2.inOut' }, 0.70);
  dormantTl.to(refs.bodyBase, { opacity: 0, duration: 0.3, ease: 'power2.inOut' }, 0.70);
  dormantTl.to(refs.armBase, { opacity: 0, duration: 0.3, ease: 'power2.inOut' }, 0.70);
  dormantTl.to(refs.backdrop, { attr: { cx: 206, cy: 389, rx: 165, ry: 120 }, duration: 0.45, ease: 'power2.inOut' }, 0.80);
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

  root.addEventListener('mouseenter', () => {
    if (!reducedMotion) playTimeline(activeTimeline());
  });

  root.addEventListener('mouseleave', () => {
    if (reducedMotion) return;
    const tl = timelines.inFlight.current;
    timelines.inFlight.current = null;
    if (tl && tl.progress() < 1) tl.reverse();
  });

  root.addEventListener('touchstart', () => {
    if (reducedMotion) return;
    touchStart = Date.now();
    playTimeline(activeTimeline());
  }, { passive: true });

  root.addEventListener('touchend', (event) => {
    if (reducedMotion) return;
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
