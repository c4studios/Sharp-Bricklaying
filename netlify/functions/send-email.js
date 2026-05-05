// Netlify serverless function — handles contact form submissions via Resend.
// The RESEND_API_KEY environment variable must be set in the Netlify dashboard
// (Site → Environment variables). It is never exposed to the browser.

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  var apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error.' }) };
  }

  var body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) };
  }

  var name    = (body.name    || '').toString().trim().slice(0, 200);
  var email   = (body.email   || '').toString().trim().slice(0, 200);
  var phone   = (body.phone   || '').toString().trim().slice(0, 50);
  var service = (body.project_type || '').toString().trim().slice(0, 100);
  var message = (body.message || '').toString().trim().slice(0, 2000);

  // Basic server-side validation
  if (!name || !email || !message) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Name, email and message are required.' }) };
  }

  // Rudimentary email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid email address.' }) };
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
    from:    'Sharp Bricklaying Website <noreply@sharpbricklaying.com.au>',
    to:      ['luke@sharpbricklaying.com.au'],
    reply_to: email,
    subject: 'New Enquiry from ' + name,
    text:    emailBody
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
      return { statusCode: 502, body: JSON.stringify({ error: 'Failed to send email.' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error('Network error calling Resend:', e);
    return { statusCode: 502, body: JSON.stringify({ error: 'Failed to send email.' }) };
  }
};
