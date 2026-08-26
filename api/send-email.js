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

  var name    = (body.name    || '').toString().trim().slice(0, 200);
  var email   = (body.email   || '').toString().trim().slice(0, 200);
  var phone   = (body.phone   || '').toString().trim().slice(0, 50);
  // The front-end sends `service`; accept `project_type` too for safety.
  var service = (body.service || body.project_type || '').toString().trim().slice(0, 100);
  var message = (body.message || '').toString().trim().slice(0, 2000);

  if (!name || !email || !message) {
    return send(400, { error: 'Name, email and message are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return send(400, { error: 'Invalid email address.' });
  }

  var emailBody = [
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
    // verification, but only delivers to the Resend account owner's address,
    // which is luke@sharpbricklaying.net (Luke's real inbox). Once the domain is
    // verified in Resend (after the DNS move off Wix), switch `from` back to
    // noreply@sharpbricklaying.com.au — then `to` can be any address.
    from:     'Sharp Bricklaying Website <onboarding@resend.dev>',
    to:       ['luke@sharpbricklaying.net'],
    reply_to: email,
    subject:  'New Enquiry from ' + name,
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
