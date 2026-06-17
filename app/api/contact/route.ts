import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(request: Request) {
  const { name, email, subject, message } = await request.json()

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Name, email and message are required.' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Email service not configured.' }, { status: 503 })
  }

  const resend = new Resend(apiKey)

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f1eb;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1eb;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 8px 32px rgba(13,31,60,0.10);">
        <tr><td style="background:#0D2B2B;padding:24px 32px;text-align:center;">
          <p style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#D4A835;margin:0;">Arrange Marriage</p>
          <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(212,168,53,0.6);margin:4px 0 0;">New Contact Form Submission</p>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #f0e8d5;">
                <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5A7870;margin:0 0 4px;">From</p>
                <p style="font-family:Georgia,serif;font-size:16px;color:#0D2B2B;margin:0;">${name}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #f0e8d5;">
                <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5A7870;margin:0 0 4px;">Email</p>
                <p style="font-family:Georgia,serif;font-size:16px;color:#0D2B2B;margin:0;"><a href="mailto:${email}" style="color:#1D5252;">${email}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #f0e8d5;">
                <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5A7870;margin:0 0 4px;">Subject</p>
                <p style="font-family:Georgia,serif;font-size:16px;color:#0D2B2B;margin:0;">${subject || 'General Enquiry'}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0;">
                <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5A7870;margin:0 0 8px;">Message</p>
                <p style="font-family:Georgia,serif;font-size:15px;color:#1A3D3D;line-height:1.8;margin:0;white-space:pre-wrap;">${message}</p>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #f0e8d5;text-align:center;">
          <p style="font-family:Arial,sans-serif;font-size:11px;color:#9aabb8;margin:0;">
            Reply directly to this email to respond to ${name}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  try {
    await resend.emails.send({
      from: 'Arrange Marriage <noreply@arrangemarriage.org>',
      to: 'hello@arrangemarriage.org',
      replyTo: email,
      subject: `Contact: ${subject || 'New message'} — from ${name}`,
      html,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact email error:', err)
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
  }
}
