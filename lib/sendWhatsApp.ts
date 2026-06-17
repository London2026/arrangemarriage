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

export async function sendPhotoRevealWhatsApp(
  toPhone: string,
  ownerFirstName: string,
  viewerProfileId: string,
  dateStr: string,
  timeStr: string,
) {
  await twilioSend(toPhone, [
    `💘 *Arrange Marriage* — Dear ${ownerFirstName},`,
    ``,
    `🇬🇧 *English:*`,
    `Today on *${dateStr}* at *${timeStr} IST*, your profile on Arrange Marriage was viewed by Profile *#${viewerProfileId}*.`,
    `You may receive a video call request from this profile.`,
    `Would you like to see their profile? Log in and search for *#${viewerProfileId}* on the Discover page.`,
    ``,
    `🇮🇳 *हिंदी:*`,
    `आज *${dateStr}* को *${timeStr} IST* पर, Arrange Marriage पर आपकी प्रोफ़ाइल Profile *#${viewerProfileId}* द्वारा देखी गई।`,
    `आपको इस प्रोफ़ाइल से एक वीडियो कॉल अनुरोध प्राप्त हो सकता है।`,
    `क्या आप उनकी प्रोफ़ाइल देखना चाहेंगे?`,
    ``,
    `🔍 https://arrangemarriage.org/discover`,
  ].join('\n'))
}

export async function sendMeetingRequestWhatsApp(
  toPhone: string,
  recipientFirstName: string,
  requesterName: string,
  dateStr: string,
  time: string,
  familyMember: string = '',
) {
  await twilioSend(toPhone, [
    `📅 *Arrange Marriage* — Hi ${recipientFirstName},`,
    `*${requesterName}* has requested a video meeting with you on *${dateStr}* at *${time}*.`,
    ...(familyMember ? [`👥 Joining: *${familyMember}*`] : []),
    `Log in to accept or decline:`,
    `https://arrangemarriage.org/profile`,
  ].join('\n'))
}

export async function sendMeetingDeclinedWhatsApp(
  toPhone: string,
  requesterFirstName: string,
  declinerName: string,
  dateStr: string,
) {
  await twilioSend(toPhone, [
    `💔 *Arrange Marriage* — Hi ${requesterFirstName},`,
    `*${declinerName}* is unavailable for *${dateStr}*.`,
    `You can send a new request with a different date:`,
    `https://arrangemarriage.org/discover`,
  ].join('\n'))
}

export async function sendMeetingAcceptedWhatsApp(
  toPhone: string,
  requesterFirstName: string,
  acceptorName: string,
  dateStr: string,
  time: string,
  roomId: string,
  acceptorFamilyMember: string = '',
  acceptorMessage: string = '',
) {
  await twilioSend(toPhone, [
    `✅ *Arrange Marriage* — Hi ${requesterFirstName},`,
    `Your video meeting with *${acceptorName}* is confirmed for *${dateStr}* at *${time}*.`,
    ...(acceptorFamilyMember ? [`👥 Joining: *${acceptorFamilyMember}*`] : []),
    ...(acceptorMessage ? [`💬 "${acceptorMessage}"`] : []),
    `🎥 Join at the scheduled time: https://meet.jit.si/ArrangeMarriage-${roomId}`,
    ``,
    `💡 *Arrange Marriage Safety Advice:*`,
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
    `✅ *Arrange Marriage* — Hi ${acceptorFirstName},`,
    `Your video meeting with *${requesterName}* is confirmed for *${dateStr}* at *${time}*.`,
    `🎥 Join at the scheduled time: https://meet.jit.si/ArrangeMarriage-${roomId}`,
    ``,
    `💡 *Arrange Marriage Safety Advice:*`,
    `🪪 Please keep your ID ready to show to the other person, and ask to see their ID before the conversation begins.`,
    `📵 We advise you not to share or ask for a mobile number during your first meeting, unless you feel completely comfortable doing so.`,
  ].join('\n'))
}
