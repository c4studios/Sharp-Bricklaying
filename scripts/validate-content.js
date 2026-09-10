const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// The site is multi-page: the portfolio lives on /gallery, the enquiry form on
// /contact, and the home page carries a featured-work teaser plus a contact
// band. Each assertion below names the page it belongs to.
const pages = {
  home:    read('index.html'),
  gallery: read('gallery/index.html'),
  contact: read('contact/index.html')
};

const css = read('css/styles.css');

const panelMediaExclusions = {};

function read(relativePath) {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(full, 'utf8');
}

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
  const match = pages.gallery.match(pattern);
  if (!match) fail(`Missing panel ${panelId} on /gallery`);
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
    // Pages below the root reference media root-relative.
    const src = `/${relativeDir}/${file}`;
    assert(panel.includes(src), `${panelId} missing ${src}`);
  });

  exclusions.forEach((file) => {
    const src = `/${relativeDir}/${file}`;
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
    const src = `/${relativeDir}/${file}`;
    assert(panel.includes(src), `${panelId} missing ${src}`);
  });

  exclusions.forEach((file) => {
    const src = `/${relativeDir}/${file}`;
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

function assertLocalMediaExists(pageName, html) {
  const mediaRefs = html.matchAll(/\b(?:src|poster)="([^"]+)"/g);

  for (const match of mediaRefs) {
    const ref = match[1];
    if (/^(https?:|data:|mailto:|tel:|#)/i.test(ref) || ref === '') continue;
    const relative = ref.startsWith('/') ? ref.slice(1) : ref;
    assert(fs.existsSync(path.join(root, relative)), `${pageName}: missing local media ${ref}`);
  }
}

function assertTabsTargetPanels() {
  const panelIds = new Set(
    [...pages.gallery.matchAll(/<article class="gallery-job-panel[^"]*" id="([^"]+)"/g)].map((match) => match[1])
  );
  const tabTargets = [...pages.gallery.matchAll(/data-job-tab="([^"]+)"/g)].map((match) => match[1]);

  assert(tabTargets.length > 0, '/gallery has no job tabs');
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
const requiredContactText = 'Whether your project is in planning or ready to commence, we welcome early enquiries. With our schedule often committed up to three months in advance, this allows us to properly plan, coordinate, and deliver each project to our standard while aligning with your proposed timeframe.';
const mudboardsLogoPath = 'images/Sponsors and Affiliates Logo/mudboards_badge_transparent_cropped.png';
const brickieGripLogoPath = 'images/Sponsors and Affiliates Logo/brickie_grip_logo.jpg';
const affiliateLinkCss = css.match(/\.footer-affiliate-link\s*\{[\s\S]*?\}/)?.[0] || '';

const normalized = {
  home: normalize(pages.home),
  gallery: normalize(pages.gallery),
  contact: normalize(pages.contact)
};

// ── Structure ────────────────────────────────────────────────
assert(!pages.home.includes('<section id="before-after">'), 'The Process section still exists');
assert(!pages.home.includes('href="#before-after"'), 'Navigation still links to The Process');

Object.entries(pages).forEach(([name, html]) => assertLocalMediaExists(name, html));
assertTabsTargetPanels();

// ── Multi-page wiring ────────────────────────────────────────
// Every page reaches every other page, and the canonical is the live domain.
const canonicals = {
  home: 'https://sharpbricklaying.com.au/',
  gallery: 'https://sharpbricklaying.com.au/gallery',
  contact: 'https://sharpbricklaying.com.au/contact'
};

Object.entries(canonicals).forEach(([name, url]) => {
  assert(
    pages[name].includes(`<link rel="canonical" href="${url}">`),
    `${name} page is missing canonical ${url}`
  );
});

Object.entries(pages).forEach(([name, html]) => {
  assert(html.includes('href="/gallery"'), `${name} page does not link to /gallery`);
  assert(html.includes('href="/contact"'), `${name} page does not link to /contact`);
  assert(html.includes('href="/articles/"'), `${name} page does not link to /articles/`);
  assert(html.includes('id="nav"'), `${name} page is missing the main nav`);
  assert(html.includes('id="footer"'), `${name} page is missing the footer`);
});

// Every internal link must resolve to a file Vercel will actually serve.
// `npx serve` resolves extensionless URLs and Vercel does not, so a link that
// works locally can still 404 in production. Routes here come from directories.
function resolvesOnVercel(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (clean === '' || clean === '/') return fs.existsSync(path.join(root, 'index.html'));
  const rel = clean.replace(/^\//, '').replace(/\/$/, '');
  return (
    fs.existsSync(path.join(root, rel)) ||
    fs.existsSync(path.join(root, `${rel}.html`)) ||
    fs.existsSync(path.join(root, rel, 'index.html'))
  );
}

const linkSources = {
  home: pages.home,
  gallery: pages.gallery,
  contact: pages.contact,
  articles: read('articles/index.html')
};

Object.entries(linkSources).forEach(([name, html]) => {
  const hrefs = [...html.matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1]);
  new Set(hrefs).forEach((href) => {
    assert(resolvesOnVercel(href), `${name} links to ${href}, which does not resolve to a served file`);
  });
});

// Sitemap URLs must resolve too, or we are advertising 404s to Google.
const sitemap = read('sitemap.xml');
[...sitemap.matchAll(/<loc>https:\/\/sharpbricklaying\.com\.au(\/[^<]*)<\/loc>/g)]
  .map((m) => m[1])
  .forEach((route) => {
    assert(resolvesOnVercel(route), `sitemap lists ${route}, which does not resolve to a served file`);
  });

// Drafts stay in the repo but must never reach production. Anything under
// _drafts is unapproved client-facing copy.
assert(fs.existsSync(path.join(root, '.vercelignore')), 'Missing .vercelignore');
assert(
  read('.vercelignore').split(/\r?\n/).some((line) => line.trim() === '_drafts'),
  '.vercelignore must exclude _drafts, or unapproved drafts deploy to production'
);
Object.entries(linkSources).forEach(([name, html]) => {
  assert(!html.includes('_drafts'), `${name} links into _drafts, which is not deployed`);
});
assert(!read('sitemap.xml').includes('_drafts'), 'sitemap lists a draft');

// The dead .net domain must not reappear in anything we serve.
const servedFiles = [
  'index.html',
  'gallery/index.html',
  'contact/index.html',
  'articles/index.html',
  'robots.txt',
  'sitemap.xml',
  '404.html',
  'privacy.html'
];
servedFiles.forEach((file) => {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return;
  assert(
    !fs.readFileSync(full, 'utf8').includes('sharpbricklaying.net'),
    `${file} still references the dead sharpbricklaying.net domain`
  );
});

assert(pages.contact.includes('id="contact-form"'), '/contact is missing the enquiry form');
assert(!pages.home.includes('id="contact-form"'), 'Home page should link to /contact, not duplicate the form');

// ── Copy ─────────────────────────────────────────────────────
requiredDescriptions.forEach((description) => {
  assert(normalized.gallery.includes(description), `/gallery missing description: ${description}`);
});

assert(normalized.home.includes(requiredQuote), 'Missing updated Luke Sharp quote');

[['home', normalized.home], ['contact', normalized.contact]].forEach(([name, text]) => {
  assert(text.includes(requiredContactHeading), `${name} page missing contact heading`);
  assert(text.includes(requiredContactText), `${name} page missing contact text`);
});

// ── Sponsors (footer, on every page) ─────────────────────────
Object.entries(pages).forEach(([name, html]) => {
  const text = normalized[name];
  assert(html.includes('<h4>Sponsors &amp; Affiliates</h4>'), `${name}: missing Sponsors & Affiliates heading`);
  assert(html.includes('href="https://mudboards.com.au/"'), `${name}: missing Mudboards sponsor link`);
  assert(html.includes(mudboardsLogoPath), `${name}: missing Mudboards sponsor logo`);
  assert(html.includes('data-sponsor-profile-open'), `${name}: missing sponsor profile trigger`);
  assert(html.includes('id="sponsor-profile-modal"'), `${name}: missing Mudboards sponsor profile modal`);
  assert(
    text.includes('Mudboards Australia is bringing a smarter alternative to the standard ply and metal mudboards seen across site'),
    `${name}: missing Mudboards sponsor profile extract`
  );
  assert(html.includes('href="https://www.brickiegrip.com.au/"'), `${name}: missing BrickieGrip sponsor link`);
  assert(html.includes(brickieGripLogoPath), `${name}: missing BrickieGrip sponsor logo`);
  assert(html.includes('aria-controls="sponsor-profile-modal-brickiegrip"'), `${name}: missing BrickieGrip profile trigger`);
  assert(html.includes('id="sponsor-profile-modal-brickiegrip"'), `${name}: missing BrickieGrip profile modal`);
  assert(
    text.includes("BrickieGrip is a durable over-grip designed to wrap around your bricklayer's trowel handle"),
    `${name}: missing BrickieGrip sponsor profile extract`
  );
});

assert(/background:\s*transparent;/.test(affiliateLinkCss), 'Mudboards sponsor link must keep a transparent background');

// ── Gallery media ────────────────────────────────────────────
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
  ['job-panel-calypso', 'images/Hammond Park'],
  ['job-panel-ccm', 'images/Mt Hawthorn CCM']
].forEach(([panelId, relativeDir]) => assertPanelHasFolder(panelId, relativeDir));

assertPanelHasVideoFolder('job-panel-alice', 'images/Alice St, Doubleview');
assertPanelHasVideoFolder('job-panel-cyandi', 'images/Cyandi Extension');
assertPanelHasVideoFolder('job-panel-subiaco-glass', 'images/Subiaco Glass');
assertPanelHasVideoFolder('job-panel-coolbinia', 'images/Coolbinia');

assert(!getPanel('job-panel-branksome').includes('images/number 6/'), 'Branksome panel still uses old number 6 photos');

// ── Featured work on the home page ───────────────────────────
const featuredCount = (pages.home.match(/class="featured__item/g) || []).length;
assert(featuredCount === 3, `Home page should feature 3 projects, found ${featuredCount}`);
assert(pages.home.includes('class="featured__all"'), 'Home page missing the link through to the full portfolio');

console.log('Content validation passed.');
