// Vercel serverless function — handles contact form submissions via Resend.
// Set RESEND_API_KEY in Vercel → Project → Settings → Environment Variables.
// It is never exposed to the browser.
//
// (Ported from the previous Netlify function. The live site runs on Vercel,
// where /.netlify/functions/* does not exist — the form was 404ing.)

module.exports = async function handler(req, res) {
  function send(status, obj) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));
  }

  if (req.method !== 'POST') {
    return send(405, { error: 'Method Not Allowed' });
  }

  var apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return send(500, { error: 'Server configuration error.' });
  }

  // Vercel parses JSON bodies automatically; fall back to a manual read so the
  // function also works when the body arrives as a raw string/stream.
  var body = req.body;
  if (!body || typeof body === 'string') {
    try {
      var raw = typeof body === 'string' ? body : await readStream(req);
      body = raw ? JSON.parse(raw) : {};
    } catch (e) {
      return send(400, { error: 'Invalid request body.' });
    }
  }

  // Only accept posts from a page on this site. Browsers always send Origin on
  // a fetch POST; a bot posting straight to the endpoint usually does not.
  var origin = (req.headers && req.headers.origin) || '';
  var host = (req.headers && (req.headers['x-forwarded-host'] || req.headers.host)) || '';
  var originHost = '';
  try { originHost = origin ? new URL(origin).host : ''; } catch (e) { originHost = ''; }
  if (!originHost || originHost !== host) {
    return send(403, { error: 'Forbidden.' });
  }

  // Honeypot: real visitors never see this field. Pretend success so bots move on.
  if ((body._gotcha || '').toString().trim()) {
    return send(200, { ok: true });
  }

  // Time trap: the page reports how long the form was open. Humans take longer
  // than two seconds; scripted posts do not send it at all.
  var elapsed = Number(body.elapsed);
  if (!isFinite(elapsed) || elapsed < 2000) {
    return send(400, { error: 'Please try again in a moment.' });
  }

  // Single-line fields feed the subject, so strip any line breaks.
  function oneLine(v, max) { return (v || '').toString().replace(/[\r\n]+/g, ' ').trim().slice(0, max); }
  var name    = oneLine(body.name, 200);
  var email   = oneLine(body.email, 200);
  var phone   = oneLine(body.phone, 50);
  // The front-end sends `service`; accept `project_type` too for safety.
  var service = oneLine(body.service || body.project_type, 100);
  var message = (body.message || '').toString().trim().slice(0, 2000);
  // The careers page posts form: 'application' with a role and experience.
  var isApplication = body.form === 'application';
  var role       = oneLine(body.role, 100);
  var experience = oneLine(body.experience, 100);

  if (!name || !email || !message) {
    return send(400, { error: 'Name, email and message are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return send(400, { error: 'Invalid email address.' });
  }

  var emailBody = isApplication ? [
    'New job application from sharpbricklaying.com.au/careers',
    '',
    'Name:       ' + name,
    'Email:      ' + email,
    'Phone:      ' + (phone || '—'),
    'Role:       ' + (role || '—'),
    'Experience: ' + (experience || '—'),
    '',
    'About them:',
    message
  ].join('\n') : [
    'New enquiry from sharpbricklaying.com.au',
    '',
    'Name:    ' + name,
    'Email:   ' + email,
    'Phone:   ' + (phone || '—'),
    'Service: ' + (service || '—'),
    '',
    'Message:',
    message
  ].join('\n');

  var payload = {
    // INTERIM sender: Resend's shared onboarding address works with no domain
    // verification, but only delivers to the Resend account owner's address.
    // The Resend account is now owned by luke@sharpbricklaying.com.au, so that's
    // the recipient. Once the domain is verified in Resend (after the DNS move
    // off Wix), switch `from` to noreply@sharpbricklaying.com.au — then `to` can
    // be any address.
    from:     'Sharp Bricklaying Website <onboarding@resend.dev>',
    to:       ['luke@sharpbricklaying.com.au'],
    reply_to: email,
    subject:  isApplication
      ? 'Job application: ' + (role || 'role not given') + ' — ' + name
      : 'New Enquiry from ' + name,
    text:     emailBody
  };

  try {
    var response = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      var err = await response.json().catch(function () { return {}; });
      console.error('Resend error:', err);
      return send(502, { error: 'Failed to send email.' });
    }

    return send(200, { ok: true });
  } catch (e) {
    console.error('Network error calling Resend:', e);
    return send(502, { error: 'Failed to send email.' });
  }
};

function readStream(req) {
  return new Promise(function (resolve, reject) {
    var data = '';
    req.on('data', function (c) { data += c; });
    req.on('end', function () { resolve(data); });
    req.on('error', reject);
  });
}
