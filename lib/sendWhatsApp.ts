async function twilioSend(toPhone: string, body: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const from       = process.env.TWILIO_WHATSAPP_FROM

  if (!accountSid || !authToken || !from) {
    console.warn('Twilio env vars not set — WhatsApp skipped')
    return
  }

  const fromAddr = `whatsapp:${from.replace(/^whatsapp:/, '')}`
  const toAddr   = `whatsapp:${toPhone.replace(/^whatsapp:/, '')}`

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({ From: fromAddr, To: toAddr, Body: body }).toString(),
      }
    )
    const json = await res.json()
    if (!res.ok) {
      console.error('WhatsApp send error:', JSON.stringify(json))
    } else {
      console.log('WhatsApp sent:', json.sid, 'status:', json.status, 'to:', json.to)
    }
  } catch (err) {
    console.error('WhatsApp send error:', err)
  }
}

export async function sendPhotoRevealWhatsApp(toPhone: string, ownerFirstName: string, viewerProfileId: string) {
  await twilioSend(toPhone, [
    `💘 *Soul Mate* — Hi ${ownerFirstName},`,
    `Profile *#${viewerProfileId}* has revealed your photo.`,
    `They may send you a video meeting request. Log in to view their profile:`,
    `https://mysoulmate.live/discover`,
  ].join('\n'))
}

export async function sendMeetingRequestWhatsApp(
  toPhone: string,
  recipientFirstName: string,
  requesterName: string,
  dateStr: string,
  time: string,
) {
  await twilioSend(toPhone, [
    `📅 *Soul Mate* — Hi ${recipientFirstName},`,
    `*${requesterName}* has requested a video meeting with you on *${dateStr}* at *${time}*.`,
    `Log in to accept or decline:`,
    `https://mysoulmate.live/profile`,
  ].join('\n'))
}

export async function sendMeetingDeclinedWhatsApp(
  toPhone: string,
  requesterFirstName: string,
  declinerName: string,
  dateStr: string,
) {
  await twilioSend(toPhone, [
    `💔 *Soul Mate* — Hi ${requesterFirstName},`,
    `*${declinerName}* is unavailable for *${dateStr}*.`,
    `You can send a new request with a different date:`,
    `https://mysoulmate.live/discover`,
  ].join('\n'))
}

export async function sendMeetingAcceptedWhatsApp(
  toPhone: string,
  requesterFirstName: string,
  acceptorName: string,
  dateStr: string,
  time: string,
  roomId: string,
) {
  await twilioSend(toPhone, [
    `✅ *Soul Mate* — Hi ${requesterFirstName},`,
    `Your video meeting with *${acceptorName}* is confirmed for *${dateStr}* at *${time}*.`,
    `🎥 Join at the scheduled time: https://meet.jit.si/SoulMate-${roomId}`,
    ``,
    `💡 *Soul Mate Safety Advice:*`,
    `🪪 Please keep your ID ready to show to the other person, and ask to see their ID before the conversation begins.`,
    `📵 We advise you not to share or ask for a mobile number during your first meeting, unless you feel completely comfortable doing so.`,
  ].join('\n'))
}

export async function sendMeetingConfirmedAcceptorWhatsApp(
  toPhone: string,
  acceptorFirstName: string,
  requesterName: string,
  dateStr: string,
  time: string,
  roomId: string,
) {
  await twilioSend(toPhone, [
    `✅ *Soul Mate* — Hi ${acceptorFirstName},`,
    `Your video meeting with *${requesterName}* is confirmed for *${dateStr}* at *${time}*.`,
    `🎥 Join at the scheduled time: https://meet.jit.si/SoulMate-${roomId}`,
    ``,
    `💡 *Soul Mate Safety Advice:*`,
    `🪪 Please keep your ID ready to show to the other person, and ask to see their ID before the conversation begins.`,
    `📵 We advise you not to share or ask for a mobile number during your first meeting, unless you feel completely comfortable doing so.`,
  ].join('\n'))
}
