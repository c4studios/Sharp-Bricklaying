const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'styles.css'), 'utf8');

const panelMediaExclusions = {};

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function normalize(value) {
  return value
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '-')
    .replace(/&#8212;/g, '-')
    .replace(/&#x2014;/g, '-')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getPanel(panelId) {
  const pattern = new RegExp(`<article class="gallery-job-panel[^"]*" id="${panelId}"[\\s\\S]*?(?=\\n    <article class="gallery-job-panel"|\\n  </div>\\s*?</section>)`);
  const match = html.match(pattern);
  if (!match) fail(`Missing panel ${panelId}`);
  return match[0];
}

function imageFiles(relativeDir) {
  return fs
    .readdirSync(path.join(root, relativeDir))
    .filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
    .sort((a, b) => a.localeCompare(b));
}

function videoFiles(relativeDir) {
  return fs
    .readdirSync(path.join(root, relativeDir))
    .filter((name) => /\.(mp4|webm)$/i.test(name))
    .sort((a, b) => a.localeCompare(b));
}

function assertPanelHasFolder(panelId, relativeDir) {
  const panel = getPanel(panelId);
  const exclusions = panelMediaExclusions[panelId]?.images || [];
  const files = imageFiles(relativeDir).filter((file) => !exclusions.includes(file));

  files.forEach((file) => {
    const src = `${relativeDir}/${file}`;
    assert(panel.includes(src), `${panelId} missing ${src}`);
  });

  exclusions.forEach((file) => {
    const src = `${relativeDir}/${file}`;
    assert(!panel.includes(src), `${panelId} should not include ${src}`);
  });

  const srcMatches = panel.match(/<img src="([^"]+)"/g) || [];
  const folderMatches = srcMatches.filter(
    (match) => match.includes(`${relativeDir}/`) && !match.includes(`${relativeDir}/posters/`)
  );
  assert(
    folderMatches.length === files.length,
    `${panelId} expected ${files.length} images from ${relativeDir}, found ${folderMatches.length}`
  );
}

function assertPanelHasVideoFolder(panelId, relativeDir) {
  const panel = getPanel(panelId);
  const exclusions = panelMediaExclusions[panelId]?.videos || [];
  const files = videoFiles(relativeDir).filter((file) => !exclusions.includes(file));

  files.forEach((file) => {
    const src = `${relativeDir}/${file}`;
    assert(panel.includes(src), `${panelId} missing ${src}`);
  });

  exclusions.forEach((file) => {
    const src = `${relativeDir}/${file}`;
    assert(!panel.includes(src), `${panelId} should not include ${src}`);
  });

  // Alice St footage is rendered as poster facades (data-lightbox-video) that
  // open a single on-demand player in the shared lightbox, not inline <source>.
  const sourceMatches = panel.match(/(?:<source src|data-lightbox-video)="([^"]+)"/g) || [];
  const folderMatches = sourceMatches.filter((match) => match.includes(`${relativeDir}/`));
  assert(
    folderMatches.length === files.length,
    `${panelId} expected ${files.length} videos from ${relativeDir}, found ${folderMatches.length}`
  );
}

function assertLocalMediaExists() {
  const mediaRefs = html.matchAll(/\b(?:src|poster)="([^"]+)"/g);

  for (const match of mediaRefs) {
    const ref = match[1];
    if (/^(https?:|data:|mailto:|tel:|#)/i.test(ref)) continue;
    assert(fs.existsSync(path.join(root, ref)), `Missing local media: ${ref}`);
  }
}

function assertTabsTargetPanels() {
  const panelIds = new Set([...html.matchAll(/<article class="gallery-job-panel[^"]*" id="([^"]+)"/g)].map((match) => match[1]));
  const tabTargets = [...html.matchAll(/data-job-tab="([^"]+)"/g)].map((match) => match[1]);

  tabTargets.forEach((target) => {
    assert(panelIds.has(target), `Gallery tab targets missing panel: ${target}`);
  });
}

const requiredDescriptions = [
  'Set just back from the water this Shelley custom home combines raked ceilings, varying internal heights, and detailed structural elements across a tightly executed architectural footprint',
  'This substantial Willetton custom residence combines a self-contained granny flat, double rendered textured finishes, expansive double-glazed openings, and oversized sliding doors across a carefully executed architectural footprint.',
  'Designed with generous proportions, textured feature finishes, and expansive rear glazing, this Willetton home represents a thoughtful rebuild following the loss of the previous residence to fire.',
  'Taking shape in the heart of Branksome Gardens, City Beach, this custom residence brings together scale, clean detailing, and expansive openings designed for effortless modern living',
  'Alice St, Doubleview captures residential brickwork through progress photography and site footage, documenting the set-out, wall progression, and clean execution across the build.',
  'Small rear renovation and addition to the existing home, improving layout, functionality, and connection to the alfresco.',
  'Three side-by-side three-storey residences in Cottesloe, each with 3 bedrooms, private internal lift access, cellar, and rooftop entertaining, delivered across a complex sloping coastal site.',
  'Subiaco addition - a boundary wall adjoining the laneway, built solid to eye height for privacy before transitioning into an in-and-out bond to introduce airflow, filtered natural light, and visual interest. Turning a practical boundary wall into a well thought out feature.',
  'A refined addition completed using signature heritage red clay bricks, introducing a new family room and cellar to this home. Every detail was carefully considered to ensure the extension respects the character of the original residence.',
  'Boundary front wall featuring Carnaval Breeze Blocks. A striking architectural feature that proves sometimes, simplicity makes the biggest impact.',
  'A feature wall 62 courses high, using crystal venetian glass bricks. A project that is certainly one of a kind. $32,000 worth of bricks shipped over, 2.5+ tonnes of weight purely in the bricks and all stack bond with white mortex.'
];

const requiredQuote = '"I\'ve always believed in delivering the extra 1% - not just in our brickwork, but across every part of the process. The goal is simple: a detailed finished product for the client, the unseen extras that set up following trades properly, and an experience that everyone involved - enjoys being part of. Leaving behind work we\'re proud of and impressions of myself and my team that are remembered." - Luke Sharp';

const requiredContactHeading = "LET'S DISCUSS YOUR NEXT PROJECT.";
const requiredContactText = 'Whether your project is in planning or ready to commence, we welcome early enquiries. With our schedule often committed up to two months in advance, this allows us to properly plan, coordinate, and deliver each project to our standard while aligning with your proposed timeframe.';
const mudboardsLogoPath = 'images/Sponsors and Affiliates Logo/mudboards_badge_transparent_cropped.png';
const brickieGripLogoPath = 'images/Sponsors and Affiliates Logo/brickie_grip_logo.jpg';
const affiliateLinkCss = css.match(/\.footer-affiliate-link\s*\{[\s\S]*?\}/)?.[0] || '';

const normalizedHtml = normalize(html);

assert(!html.includes('<section id="before-after">'), 'The Process section still exists');
assert(!html.includes('href="#before-after"'), 'Navigation still links to The Process');
assertLocalMediaExists();
assertTabsTargetPanels();

requiredDescriptions.forEach((description) => {
  assert(normalizedHtml.includes(description), `Missing description: ${description}`);
});

assert(normalizedHtml.includes(requiredQuote), 'Missing updated Luke Sharp quote');
assert(normalizedHtml.includes(requiredContactHeading), 'Missing updated contact heading');
assert(normalizedHtml.includes(requiredContactText), 'Missing updated contact text');
assert(html.includes('<h4>Sponsors &amp; Affiliates</h4>'), 'Missing Sponsors & Affiliates heading');
assert(html.includes('href="https://mudboards.com.au/"'), 'Missing Mudboards sponsor link');
assert(html.includes(`src="${mudboardsLogoPath}"`), 'Missing Mudboards sponsor logo');
assert(html.includes('data-sponsor-profile-open'), 'Missing Mudboards sponsor profile trigger');
assert(html.includes('id="sponsor-profile-modal"'), 'Missing Mudboards sponsor profile modal');
assert(normalizedHtml.includes('Mudboards Australia is bringing a smarter alternative to the standard ply and metal mudboards seen across site'), 'Missing Mudboards sponsor profile extract');
assert(/background:\s*transparent;/.test(affiliateLinkCss), 'Mudboards sponsor link must keep a transparent background');
assert(html.includes('href="https://www.brickiegrip.com.au/"'), 'Missing BrickieGrip sponsor link');
assert(html.includes(`src="${brickieGripLogoPath}"`), 'Missing BrickieGrip sponsor logo');
assert(html.includes('aria-controls="sponsor-profile-modal-brickiegrip"'), 'Missing BrickieGrip sponsor profile trigger');
assert(html.includes('id="sponsor-profile-modal-brickiegrip"'), 'Missing BrickieGrip sponsor profile modal');
assert(normalizedHtml.includes("BrickieGrip is a durable over-grip designed to wrap around your bricklayer's trowel handle"), 'Missing BrickieGrip sponsor profile extract');

[
  ['job-panel-broome', 'images/Broome St'],
  ['job-panel-branksome', 'images/Branksome Gardens, City Beach'],
  ['job-panel-princess', 'images/Princess Rd, Doubleview'],
  ['job-panel-alice', 'images/Alice St, Doubleview'],
  ['job-panel-kershaw', 'images/Kershaw'],
  ['job-panel-cyandi', 'images/Cyandi Extension'],
  ['job-panel-coolbinia', 'images/Coolbinia'],
  ['job-panel-subiaco-glass', 'images/Subiaco Glass'],
  ['job-panel-calypso', 'images/Calypso'],
  ['job-panel-calypso', 'images/Hammond Park']
].forEach(([panelId, relativeDir]) => assertPanelHasFolder(panelId, relativeDir));

assertPanelHasVideoFolder('job-panel-alice', 'images/Alice St, Doubleview');
assertPanelHasVideoFolder('job-panel-cyandi', 'images/Cyandi Extension');
assertPanelHasVideoFolder('job-panel-subiaco-glass', 'images/Subiaco Glass');
assertPanelHasVideoFolder('job-panel-coolbinia', 'images/Coolbinia');

assert(!getPanel('job-panel-branksome').includes('images/number 6/'), 'Branksome panel still uses old number 6 photos');

console.log('Content validation passed.');
