// Receives feedback form submissions and forwards to rob@robfiasco.dev via Resend.
// Set RESEND_API_KEY in Vercel environment variables.

const TYPE_LABELS = {
  general:    'General feedback',
  bug:        'Bug or issue',
  suggestion: 'Suggestion',
  correction: 'Correction',
  business:   'Featured Placement inquiry',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, message, replyTo, appVersion, timestamp } = req.body ?? {};

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (message.length > 1500) {
    return res.status(400).json({ error: 'Message too long' });
  }
  if (replyTo && (typeof replyTo !== 'string' || replyTo.length > 200)) {
    return res.status(400).json({ error: 'Invalid reply-to address' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Email service not configured' });
  }

  const typeLabel = TYPE_LABELS[type] ?? type ?? 'Unknown';
  const subject   = `[Chadakoin Now] ${typeLabel}`;
  const textBody  = [
    `Type: ${typeLabel}`,
    `Version: ${appVersion ?? '—'}`,
    `Time: ${timestamp ?? new Date().toISOString()}`,
    replyTo ? `Reply-to: ${replyTo}` : 'Reply-to: (not provided)',
    '',
    message.trim(),
  ].join('\n');

  const emailPayload = {
    from:    'Chadakoin Now <onboarding@resend.dev>',
    to:      ['robfiasco@gmail.com'],
    subject,
    text:    textBody,
    ...(replyTo ? { reply_to: replyTo } : {}),
  };

  const sendRes = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(emailPayload),
  });

  if (!sendRes.ok) {
    const err = await sendRes.text();
    console.error('Resend error:', err);
    return res.status(502).json({ error: 'Email delivery failed' });
  }

  return res.status(200).json({ ok: true });
}
