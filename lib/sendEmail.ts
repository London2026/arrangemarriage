import { Resend } from 'resend'
import { createHmac } from 'crypto'

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

// ── Meeting rating helpers ───────────────────────────────────────────────────
function ratingToken(meetingId: string, raterId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  return createHmac('sha256', secret)
    .update(`rating:${meetingId}:${raterId}`)
    .digest('hex')
    .slice(0, 32)
}

function ratingStarsHtml(meetingId: string, raterId: string): string {
  const token = ratingToken(meetingId, raterId)
  const base  = `https://arrangemarriage.live/api/rate-meeting`
  const cells = [1, 2, 3, 4, 5].map(r => {
    const url = `${base}?m=${meetingId}&u=${raterId}&r=${r}&t=${token}`
    return `<td style="padding:0 8px;text-align:center;">
      <a href="${url}" style="display:block;font-size:38px;color:#c9a84c;text-decoration:none;line-height:1;">★</a>
      <a href="${url}" style="display:block;font-family:Arial,sans-serif;font-size:10px;color:#8b6914;text-decoration:none;margin-top:3px;letter-spacing:0.05em;">${r} star${r > 1 ? 's' : ''}</a>
    </td>`
  }).join('')
  return `
    <div style="background:#f8f5ef;border:1px solid rgba(201,168,76,0.3);border-radius:8px;padding:18px 20px;margin-top:20px;text-align:center;">
      <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8b6914;margin:0 0 8px;">How Was Your Meeting?</p>
      <p style="font-family:Georgia,serif;font-size:14px;color:#5a6e82;margin:0 0 14px;line-height:1.6;">After your call, please click a star to rate your experience — no login needed:</p>
      <table style="margin:0 auto;border-collapse:collapse;"><tr>${cells}</tr></table>
      <p style="font-family:Georgia,serif;font-size:11px;color:#9aabb8;margin:12px 0 0;font-style:italic;">Your rating is private and visible only to the Arrange Marriage team.</p>
    </div>`
}

// ── Email templates ──────────────────────────────────────────────────────────

export async function sendPhotoRevealedEmail(
  to: string,
  ownerFirstName: string,
  viewerProfileId: string,
  dateStr: string,
  timeStr: string,
) {
  const subject = `💘 Your Arrange Marriage profile was viewed — Profile #${viewerProfileId}`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 4px;">Your profile has been viewed</h2>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#8b6914;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 16px;">आपकी प्रोफ़ाइल देखी गई</p>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:24px;"></div>

    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.7;margin:0 0 20px;">
      Dear <strong>${ownerFirstName}</strong>,
    </p>

    <!-- English -->
    <p style="font-family:Georgia,serif;font-size:16px;color:#0d1f3c;line-height:1.8;margin:0 0 8px;">
      We are pleased to inform you that today, on <strong>${dateStr}</strong> at <strong>${timeStr} IST</strong>, your profile on Arrange Marriage was viewed by
      <strong style="font-family:'Courier New',monospace;">Profile #${viewerProfileId}</strong>.
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.8;margin:0 0 8px;">
      You may receive a video call request from this profile. Would you like to see their profile?
      Simply log in to Arrange Marriage and search for <strong style="font-family:'Courier New',monospace;">#${viewerProfileId}</strong> on the Discover page.
    </p>

    <hr style="border:none;border-top:1px solid #f0e8d5;margin:20px 0;">

    <!-- Hindi -->
    <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;line-height:1.9;margin:0 0 8px;">
      हमें यह सूचित करते हुए प्रसन्नता हो रही है कि आज, <strong>${dateStr}</strong> को <strong>${timeStr} IST</strong> पर,
      Arrange Marriage पर आपकी प्रोफ़ाइल <strong style="font-family:'Courier New',monospace;">Profile #${viewerProfileId}</strong> द्वारा देखी गई।
    </p>
    <p style="font-family:Georgia,serif;font-size:15px;color:#5a6e82;line-height:1.9;margin:0 0 24px;">
      इस प्रोफ़ाइल से आपको एक वीडियो कॉल अनुरोध प्राप्त हो सकता है। क्या आप उनकी प्रोफ़ाइल देखना चाहेंगे?
      बस Arrange Marriage में लॉग इन करें और Discover पेज पर <strong style="font-family:'Courier New',monospace;">#${viewerProfileId}</strong> खोजें।
    </p>

    <div style="text-align:center;margin-bottom:8px;">
      <a href="https://arrangemarriage.live/discover" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        View Their Profile → / प्रोफ़ाइल देखें →
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
  message: string,
  familyMember: string = ''
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
      ${familyMember ? `<p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 8px;">👥 Joining: ${familyMember}</p>` : ''}
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
  roomId: string,
  acceptorFamilyMember: string = '',
  acceptorMessage: string = '',
  meetingId: string = '',
  raterId: string = '',
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
      ${acceptorFamilyMember ? `<p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:8px 0 0;">👥 ${acceptorName} will be joined by: ${acceptorFamilyMember}</p>` : ''}
      ${acceptorMessage ? `<p style="font-family:Georgia,serif;font-size:14px;color:#5a6e82;font-style:italic;margin:8px 0 0;">"${acceptorMessage}"</p>` : ''}
    </div>
    <p style="font-family:Georgia,serif;font-size:15px;color:#5a6e82;line-height:1.7;margin:0 0 20px;">
      At the scheduled time, click the button below to join your private video call.
    </p>
    <div style="text-align:center;margin-bottom:16px;">
      <a href="${meetingUrl}" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        🎥 Join Meeting →
      </a>
    </div>
    <div style="background:#f8f5ef;border:1px solid rgba(201,168,76,0.25);border-radius:8px;padding:14px 18px;margin-bottom:20px;">
      <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8b6914;margin:0 0 8px;">Your Meeting Link</p>
      <p style="font-family:'Courier New',monospace;font-size:12px;color:#0d1f3c;word-break:break-all;margin:0 0 10px;background:#fff;border:1px solid rgba(201,168,76,0.3);border-radius:4px;padding:8px 10px;">${meetingUrl}</p>
      <p style="font-family:Georgia,serif;font-size:14px;color:#5a6e82;line-height:1.75;margin:0 0 6px;">
        You are welcome to share this link with family members or close friends who would like to join the call — they can open it in any browser, no account needed.
      </p>
      <p style="font-family:Georgia,serif;font-size:13px;color:#9aabb8;font-style:italic;margin:0;">
        This link is valid for the scheduled meeting date only and will no longer be active after the meeting concludes.
      </p>
    </div>
    ${meetingId && raterId ? ratingStarsHtml(meetingId, raterId) : ''}
    <div style="background:#fff8ec;border:1px solid rgba(201,168,76,0.35);border-radius:8px;padding:16px 20px;margin-top:16px;">
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
  roomId: string,
  meetingId: string = '',
  raterId: string = '',
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
    <div style="text-align:center;margin-bottom:16px;">
      <a href="${meetingUrl}" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        🎥 Join Meeting →
      </a>
    </div>
    <div style="background:#f8f5ef;border:1px solid rgba(201,168,76,0.25);border-radius:8px;padding:14px 18px;margin-bottom:20px;">
      <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8b6914;margin:0 0 8px;">Your Meeting Link</p>
      <p style="font-family:'Courier New',monospace;font-size:12px;color:#0d1f3c;word-break:break-all;margin:0 0 10px;background:#fff;border:1px solid rgba(201,168,76,0.3);border-radius:4px;padding:8px 10px;">${meetingUrl}</p>
      <p style="font-family:Georgia,serif;font-size:14px;color:#5a6e82;line-height:1.75;margin:0 0 6px;">
        You are welcome to share this link with family members or close friends who would like to join the call — they can open it in any browser, no account needed.
      </p>
      <p style="font-family:Georgia,serif;font-size:13px;color:#9aabb8;font-style:italic;margin:0;">
        This link is valid for the scheduled meeting date only and will no longer be active after the meeting concludes.
      </p>
    </div>
    ${meetingId && raterId ? ratingStarsHtml(meetingId, raterId) : ''}
    <div style="background:#fff8ec;border:1px solid rgba(201,168,76,0.35);border-radius:8px;padding:16px 20px;margin-top:16px;">
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

export async function sendBillingReminderEmail(
  to: string,
  firstName: string,
  plan: string,
  billingDate: string,
  amount: string,
) {
  const planLabel = plan === 'standard' ? 'Standard' : 'Starter'
  const subject   = `Your Arrange Marriage subscription renews on ${billingDate}`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 4px;">Upcoming Subscription Renewal</h2>
    <p style="font-family:Arial,sans-serif;font-size:11px;color:#8b6914;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">आपकी सदस्यता नवीनीकरण</p>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:24px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.8;margin:0 0 16px;">
      Dear <strong>${firstName}</strong>,
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#0d1f3c;line-height:1.8;margin:0 0 16px;">
      We hope you are enjoying your journey on Arrange Marriage. We are writing to let you know that your <strong>${planLabel} Plan</strong> subscription will automatically renew in <strong>3 days</strong>.
    </p>
    <div style="background:#f8f5ef;border-left:3px solid #c9a84c;padding:16px 20px;margin-bottom:24px;border-radius:0 6px 6px 0;">
      <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#8b6914;margin:0 0 10px;">Renewal Details</p>
      <p style="font-family:Georgia,serif;font-size:16px;color:#0d1f3c;margin:0 0 6px;">📅 <strong>Renewal Date:</strong> ${billingDate}</p>
      <p style="font-family:Georgia,serif;font-size:16px;color:#0d1f3c;margin:0 0 6px;">💳 <strong>Plan:</strong> ${planLabel}</p>
      ${amount ? `<p style="font-family:Georgia,serif;font-size:16px;color:#0d1f3c;margin:0;">💰 <strong>Amount:</strong> ${amount} per month</p>` : ''}
    </div>
    <p style="font-family:Georgia,serif;font-size:15px;color:#5a6e82;line-height:1.8;margin:0 0 8px;">
      No action is needed — your subscription will renew automatically and you will continue to have full access to all features included in your plan.
    </p>
    <p style="font-family:Georgia,serif;font-size:15px;color:#5a6e82;line-height:1.8;margin:0 0 24px;">
      If you have found your match or wish to make any changes to your subscription, you may manage it from your Profile page at any time before the renewal date.
    </p>

    <hr style="border:none;border-top:1px solid #f0e8d5;margin:20px 0;">

    <p style="font-family:Georgia,serif;font-size:14px;color:#0d1f3c;line-height:1.9;margin:0 0 8px;">
      प्रिय <strong>${firstName}</strong>, हम आपको सूचित करना चाहते हैं कि आपकी <strong>${planLabel} योजना</strong> की सदस्यता <strong>3 दिनों में</strong> स्वचालित रूप से नवीनीकृत होगी — <strong>${billingDate}</strong> को।
    </p>
    <p style="font-family:Georgia,serif;font-size:14px;color:#5a6e82;line-height:1.9;margin:0 0 20px;">
      यदि आप सदस्यता में कोई बदलाव करना चाहते हैं, तो कृपया नवीनीकरण तिथि से पहले अपने प्रोफ़ाइल पेज पर जाएं।
    </p>

    <div style="text-align:center;margin:20px 0 8px;">
      <a href="https://arrangemarriage.live/profile" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        Manage My Subscription →
      </a>
    </div>
    <p style="font-family:Georgia,serif;font-size:12px;color:#9aabb8;text-align:center;margin:8px 0 0;font-style:italic;">
      Wishing you a beautiful and meaningful connection. — The Arrange Marriage Team
    </p>
  `)
  await send(to, subject, html)
}

export async function sendMeetingCancelledEmail(
  to: string,
  recipientFirstName: string,
  cancellerName: string,
  dateStr: string,
  time: string,
) {
  const subject = `Your video meeting with ${cancellerName} has been cancelled`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:22px;color:#0d1f3c;margin:0 0 12px;">Meeting Cancelled</h2>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:20px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.7;margin:0 0 16px;">
      Hi <strong>${recipientFirstName}</strong>,
    </p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#5a6e82;line-height:1.7;margin:0 0 16px;">
      We are writing to let you know that <strong style="color:#0d1f3c;">${cancellerName}</strong> has had to cancel the video meeting that was scheduled for <strong>${dateStr}${time ? ' at ' + time : ''}</strong>.
    </p>
    <p style="font-family:Georgia,serif;font-size:15px;color:#5a6e82;line-height:1.7;margin:0 0 24px;">
      We understand this may be disappointing. Please don't be discouraged — your meeting slot has been returned in full and you are welcome to send a new request at a time that works best for both of you.
    </p>
    <div style="text-align:center;margin-bottom:8px;">
      <a href="https://arrangemarriage.live/discover" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px;">
        Return to Discover →
      </a>
    </div>
  `)
  await send(to, subject, html)
}

// ── Welcome email (sent on first sign-up) ────────────────────────────────────
export async function sendWelcomeEmail(to: string, firstName: string) {
  const subject = `Welcome to Arrange Marriage — Your Journey Begins Here 💘`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:24px;color:#0d1f3c;margin:0 0 4px;">Welcome to Arrange Marriage</h2>
    <p style="font-family:Arial,sans-serif;font-size:11px;color:#8b6914;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">Arrange Marriage में आपका स्वागत है</p>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:24px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.8;margin:0 0 16px;">Dear <strong>${firstName}</strong>,</p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#0d1f3c;line-height:1.8;margin:0 0 12px;">Welcome to <strong>Arrange Marriage</strong> — India's privacy-first platform for finding your life partner with dignity, care, and respect.</p>
    <div style="background:#f8f5ef;border-left:3px solid #c9a84c;padding:16px 20px;margin-bottom:20px;border-radius:0 6px 6px 0;">
      <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#8b6914;margin:0 0 12px;">How to Get Started</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 9px;">📝 <strong>Step 1 — Create your profile</strong> — Share your background, education, family, lifestyle, and what you are looking for in a partner.</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 9px;">📸 <strong>Step 2 — Upload your photos</strong> — Back-side photos are visible to all members; your face photo is shown only when you choose to reveal it.</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 9px;">🎙 <strong>Step 3 — Record your voice</strong> — A short introduction in your mother tongue and in English makes your profile far more personal and appealing.</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 9px;">🔍 <strong>Step 4 — Discover and Connect</strong> — Browse profiles, use filters for religion, caste, location, and more, and let our AI find your most compatible matches.</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0;">🎥 <strong>Step 5 — Meet face-to-face</strong> — Request a private video meeting with members you are interested in.</p>
    </div>
    <hr style="border:none;border-top:1px solid #f0e8d5;margin:20px 0;">
    <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;line-height:1.9;margin:0 0 10px;"><strong>Arrange Marriage</strong> में आपका हार्दिक स्वागत है — यह भारत का सबसे विश्वसनीय मंच है जहाँ आप गरिमा, देखभाल और सम्मान के साथ अपना जीवनसाथी खोज सकते हैं।</p>
    <p style="font-family:Georgia,serif;font-size:14px;color:#5a6e82;line-height:1.9;margin:0 0 20px;">📝 <strong>चरण 1</strong> — प्रोफ़ाइल बनाएं&nbsp;&nbsp;📸 <strong>चरण 2</strong> — फ़ोटो अपलोड करें&nbsp;&nbsp;🎙 <strong>चरण 3</strong> — आवाज़ रिकॉर्ड करें&nbsp;&nbsp;🔍 <strong>चरण 4</strong> — प्रोफ़ाइल खोजें&nbsp;&nbsp;🎥 <strong>चरण 5</strong> — वीडियो मीटिंग करें</p>
    <div style="text-align:center;margin:20px 0 8px;">
      <a href="https://arrangemarriage.live/onboarding" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:6px;">Create My Profile →</a>
    </div>
    <p style="font-family:Georgia,serif;font-size:13px;color:#9aabb8;text-align:center;margin:8px 0 0;font-style:italic;">Your privacy is our priority — your face photo stays blurred until you choose to reveal it.</p>
  `)
  await send(to, subject, html)
}

// ── Profile complete email (sent after onboarding finishes) ───────────────────
export async function sendProfileCompleteEmail(to: string, firstName: string) {
  const subject = `Your Arrange Marriage profile is live — here is what to do next 🎉`
  const html = wrap(`
    <h2 style="font-family:Georgia,serif;font-size:24px;color:#0d1f3c;margin:0 0 4px;">Your profile is live!</h2>
    <p style="font-family:Arial,sans-serif;font-size:11px;color:#8b6914;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">आपकी प्रोफ़ाइल लाइव हो गई!</p>
    <div style="height:2px;background:linear-gradient(to right,#c9a84c,transparent);margin-bottom:24px;"></div>
    <p style="font-family:Georgia,serif;font-size:16px;color:#2c4a6e;line-height:1.8;margin:0 0 16px;">Dear <strong>${firstName}</strong>,</p>
    <p style="font-family:Georgia,serif;font-size:16px;color:#0d1f3c;line-height:1.8;margin:0 0 12px;">Congratulations! 🎉 Your profile on Arrange Marriage is now complete and visible to other members. You have taken a wonderful and courageous step towards finding your life partner.</p>
    <div style="background:#f8f5ef;border-left:3px solid #c9a84c;padding:16px 20px;margin-bottom:20px;border-radius:0 6px 6px 0;">
      <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#8b6914;margin:0 0 12px;">What You Can Do Now</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 10px;">🔍 <strong>Discover profiles</strong> — Browse members using filters for religion, caste, location, education, and more.</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 10px;">✨ <strong>Find My Match</strong> — Click the AI-powered "Find My Match" button to receive personalised compatibility scores for every profile based on your full profile.</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 10px;">📸 <strong>Reveal face photos</strong> — Upgrade to a paid plan to reveal other members' face photos. They are notified the moment you do.</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0 0 10px;">🎥 <strong>Request video meetings</strong> — Connect face-to-face with members you are interested in (available on paid plans).</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;margin:0;">✏️ <strong>Update your profile anytime</strong> — Go to My Profile → Edit Profile to update your details, photos, or voice recordings.</p>
    </div>
    <hr style="border:none;border-top:1px solid #f0e8d5;margin:20px 0;">
    <p style="font-family:Georgia,serif;font-size:15px;color:#0d1f3c;line-height:1.9;margin:0 0 10px;">बधाई हो! 🎉 Arrange Marriage पर आपकी प्रोफ़ाइल अब पूर्ण हो गई है और अन्य सदस्यों को दिखाई देने लगी है।</p>
    <p style="font-family:Georgia,serif;font-size:14px;color:#5a6e82;line-height:1.9;margin:0 0 20px;">🔍 प्रोफ़ाइल खोजें &nbsp;✨ AI से जोड़ी खोजें &nbsp;📸 चेहरे की फ़ोटो देखें (पेड प्लान) &nbsp;🎥 वीडियो मीटिंग करें (पेड प्लान) &nbsp;✏️ प्रोफ़ाइल कभी भी अपडेट करें</p>
    <div style="text-align:center;margin:20px 0 8px;">
      <a href="https://arrangemarriage.live/discover" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#e8c876,#c9a84c);color:#0d1f3c;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:6px;">Start Discovering →</a>
    </div>
    <p style="font-family:Georgia,serif;font-size:13px;color:#9aabb8;text-align:center;margin:8px 0 0;font-style:italic;">Wishing you a beautiful and meaningful connection. — The Arrange Marriage Team</p>
  `)
  await send(to, subject, html)
}
