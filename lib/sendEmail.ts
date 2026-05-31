import { Resend } from 'resend'

const FROM = 'Arrange Marriage <noreply@arrangemarriage.live>'

function resend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

// ── Shared email wrapper ─────────────────────────────────────────────────────
async function send(to: string, subject: string, html: string) {
  const client = resend()
  if (!client) { console.warn('RESEND_API_KEY not set — email skipped'); return }
  try {
    await client.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    console.error('Email send error:', err)
  }
}

// ── Shared HTML wrapper ──────────────────────────────────────────────────────
function wrap(body: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f1eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1eb;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 8px 32px rgba(13,31,60,0.10);">

        <!-- Header -->
        <tr><td style="background:#0d1f3c;padding:28px 32px;text-align:center;">
          <p style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#c9a84c;margin:0;letter-spacing:0.04em;">Arrange Marriage</p>
          <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(201,168,76,0.55);margin:4px 0 0;">✦ Your Perfect Match Awaits ✦</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 32px 24px;">${body}</td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 32px 28px;border-top:1px solid rgba(13,31,60,0.08);text-align:center;">
          <p style="font-family:Arial,sans-serif;font-size:11px;color:#9aabb8;margin:0;">
            © 2026 Arrange Marriage · Privacy-first matrimony platform<br>
            <a href="https://arrangemarriage.live/privacy" style="color:#9aabb8;">Privacy Policy</a> &nbsp;·&nbsp;
            <a href="https://arrangemarriage.live/terms" style="color:#9aabb8;">Terms of Service</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Email templates ──────────────────────────────────────────────────────────

export async function sendPhotoRevealedEmail(to: string, ownerFirstName: string, viewerProfileId: string) {
  const subject = `💘 Profile #${viewerProfileId} has revealed your photo on Arrange Marriage`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 12px;">Your photo has been revealed</h2>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:20px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.7;margin:0 0 16px;">
      Hi <strong>${ownerFirstName}</strong>,
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.7;margin:0 0 16px;">
      Profile <strong style="color:#0d1f3c;font-family:'Courier New',monospace;">#${viewerProfileId}</strong> has revealed your photo on Arrange Marriage.
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.7;margin:0 0 16px;">
      You may receive an online video meeting request from this profile. If you would like to view their profile and connect with them, please log in to Arrange Marriage.
    </p>
    <p style="font-family:Georgia,serif;font-size:15px;color:#5a6e82;font-style:italic;line-height:1.7;margin:0 0 28px;">
      You can search for Profile <span style="font-family:'Courier New',monospace;font-style:normal;">#${viewerProfileId}</span> directly in the Discover page to view their full profile.
    </p>
    <div style="text-align:center;margin-bottom:8px;">
      <a href="https://arrangemarriage.live/discover" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        Check Their Profile →
      </a>
    </div>
  `)
  await send(to, subject, html)
}

export async function sendMeetingRequestEmail(
  to: string,
  recipientFirstName: string,
  requesterName: string,
  dateStr: string,
  time: string,
  message: string
) {
  const subject = `📅 ${requesterName} wants to meet you on Arrange Marriage`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 12px;">New video meeting request</h2>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:20px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.7;margin:0 0 16px;">
      Hi <strong>${recipientFirstName}</strong>,
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.7;margin:0 0 16px;">
      <strong style="color:#0d1f3c;">${requesterName}</strong> has requested a video meeting with you.
    </p>
    <div style="background:#f4f1eb;border-left:3px solid #c9a84c;padding:14px 18px;margin-bottom:20px;border-radius:0 6px 6px 0;">
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8b6914;margin:0 0 8px;">Meeting Details</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 4px;">📅 ${dateStr}</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 8px;">🕐 ${time}</p>
      ${message ? `<p style="font-family:Georgia,serif;font-size:14px;color:#5a6e82;font-style:italic;margin:8px 0 0;">"${message}"</p>` : ''}
    </div>
    <p style="font-family:Georgia,serif;font-size:15px;color:#5a6e82;line-height:1.7;margin:0 0 28px;">
      Log in to accept or decline this request from your profile page.
    </p>
    <div style="text-align:center;margin-bottom:8px;">
      <a href="https://arrangemarriage.live/profile" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        Respond →
      </a>
    </div>
  `)
  await send(to, subject, html)
}

export async function sendMeetingAcceptedEmail(
  to: string,
  requesterFirstName: string,
  acceptorName: string,
  dateStr: string,
  time: string,
  roomId: string
) {
  const meetingUrl = `https://meet.jit.si/ArrangeMarriage-${roomId}`
  const subject = `✅ Your video meeting with ${acceptorName} is confirmed`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 12px;">Your meeting is confirmed!</h2>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:20px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.7;margin:0 0 16px;">
      Hi <strong>${requesterFirstName}</strong>,
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.7;margin:0 0 16px;">
      Great news — <strong style="color:#0d1f3c;">${acceptorName}</strong> has confirmed your video meeting request.
    </p>
    <div style="background:#f4f1eb;border-left:3px solid #4ade80;padding:14px 18px;margin-bottom:20px;border-radius:0 6px 6px 0;">
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#16a34a;margin:0 0 8px;">Confirmed Meeting</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 4px;">📅 ${dateStr}</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0;">🕐 ${time}</p>
    </div>
    <p style="font-family:Georgia,serif;font-size:15px;color:#5a6e82;line-height:1.7;margin:0 0 20px;">
      At the scheduled time, click the button below to join your private video call.
    </p>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${meetingUrl}" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        🎥 Join Meeting →
      </a>
    </div>
    <div style="background:#fff8ec;border:1px solid rgba(201,168,76,0.35);border-radius:8px;padding:16px 20px;">
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8b6914;margin:0 0 10px;">💡 Arrange Marriage Safety Advice</p>
      <p style="font-family:Georgia,serif;font-size:14px;color:#2c4a6e;line-height:1.75;margin:0 0 8px;">
        🪪 <strong>Please keep your ID ready</strong> to show to the other person at the start of the meeting, and <strong>ask to see their ID</strong> before the conversation begins. This helps confirm you are both speaking to verified members.
      </p>
      <p style="font-family:Georgia,serif;font-size:14px;color:#2c4a6e;line-height:1.75;margin:0;">
        📵 Arrange Marriage advises you <strong>not to share or ask for a mobile number</strong> during your first meeting, unless you feel completely comfortable doing so.
      </p>
    </div>
  `)
  await send(to, subject, html)
}

export async function sendMeetingConfirmedAcceptorEmail(
  to: string,
  acceptorFirstName: string,
  requesterName: string,
  dateStr: string,
  time: string,
  roomId: string
) {
  const meetingUrl = `https://meet.jit.si/ArrangeMarriage-${roomId}`
  const subject = `✅ Your video meeting with ${requesterName} is confirmed`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 12px;">Your meeting is confirmed!</h2>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:20px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.7;margin:0 0 16px;">
      Hi <strong>${acceptorFirstName}</strong>,
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.7;margin:0 0 16px;">
      You have confirmed your video meeting with <strong style="color:#0d1f3c;">${requesterName}</strong>. Here are your meeting details and your private link to join.
    </p>
    <div style="background:#f4f1eb;border-left:3px solid #4ade80;padding:14px 18px;margin-bottom:20px;border-radius:0 6px 6px 0;">
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#16a34a;margin:0 0 8px;">Confirmed Meeting</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 4px;">📅 ${dateStr}</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0;">🕐 ${time}</p>
    </div>
    <p style="font-family:Georgia,serif;font-size:15px;color:#5a6e82;line-height:1.7;margin:0 0 20px;">
      At the scheduled time, click the button below to join your private video call.
    </p>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${meetingUrl}" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        🎥 Join Meeting →
      </a>
    </div>
    <div style="background:#fff8ec;border:1px solid rgba(201,168,76,0.35);border-radius:8px;padding:16px 20px;">
      <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8b6914;margin:0 0 10px;">💡 Arrange Marriage Safety Advice</p>
      <p style="font-family:Georgia,serif;font-size:14px;color:#2c4a6e;line-height:1.75;margin:0 0 8px;">
        🪪 <strong>Please keep your ID ready</strong> to show to the other person at the start of the meeting, and <strong>ask to see their ID</strong> before the conversation begins. This helps confirm you are both speaking to verified members.
      </p>
      <p style="font-family:Georgia,serif;font-size:14px;color:#2c4a6e;line-height:1.75;margin:0;">
        📵 Arrange Marriage advises you <strong>not to share or ask for a mobile number</strong> during your first meeting, unless you feel completely comfortable doing so.
      </p>
    </div>
  `)
  await send(to, subject, html)
}
