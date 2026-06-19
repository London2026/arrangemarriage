async function msg91Send(mobile: string, templateId: string, variables: Record<string, string>) {
  const authKey  = process.env.MSG91_AUTH_KEY
  const senderId = process.env.MSG91_SENDER_ID ?? 'ARRMRG'

  if (!authKey || !templateId) {
    console.warn('MSG91 env vars not set — SMS skipped')
    return
  }

  // Normalize to 91XXXXXXXXXX
  const digits = mobile.replace(/\D/g, '')
  const normalized = digits.startsWith('91') && digits.length === 12
    ? digits
    : digits.length === 10
      ? `91${digits}`
      : null

  if (!normalized) {
    console.warn('Invalid mobile number for SMS:', mobile)
    return
  }

  try {
    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        authkey: authKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        template_id: templateId,
        sender: senderId,
        short_url: '0',
        mobiles: normalized,
        ...variables,
      }),
    })
    const json = await res.json()
    if (json.type !== 'success') {
      console.error('SMS send error:', JSON.stringify(json))
    } else {
      console.log('SMS sent to:', normalized)
    }
  } catch (err) {
    console.error('SMS send error:', err)
  }
}

export async function sendMeetingRequestSMS(
  toPhone: string,
  recipientFirstName: string,
  requesterName: string,
  dateStr: string,
  time: string,
) {
  await msg91Send(toPhone, process.env.MSG91_TEMPLATE_MEETING_REQUEST ?? '', {
    var1: recipientFirstName,
    var2: requesterName,
    var3: dateStr,
    var4: time,
  })
}

export async function sendMeetingAcceptedSMS(
  toPhone: string,
  recipientFirstName: string,
  otherName: string,
  dateStr: string,
  time: string,
  roomId: string,
) {
  await msg91Send(toPhone, process.env.MSG91_TEMPLATE_MEETING_ACCEPTED ?? '', {
    var1: recipientFirstName,
    var2: otherName,
    var3: dateStr,
    var4: time,
    var5: roomId,
  })
}

export async function sendMeetingDeclinedSMS(
  toPhone: string,
  recipientFirstName: string,
  declinerName: string,
  dateStr: string,
) {
  await msg91Send(toPhone, process.env.MSG91_TEMPLATE_MEETING_DECLINED ?? '', {
    var1: recipientFirstName,
    var2: declinerName,
    var3: dateStr,
  })
}

export async function sendMeetingCancelledSMS(
  toPhone: string,
  recipientFirstName: string,
  cancellerName: string,
  dateStr: string,
) {
  await msg91Send(toPhone, process.env.MSG91_TEMPLATE_MEETING_CANCELLED ?? '', {
    var1: recipientFirstName,
    var2: cancellerName,
    var3: dateStr,
  })
}

export async function sendBillingReminderSMS(
  toPhone: string,
  firstName: string,
  plan: string,
  billingDate: string,
) {
  await msg91Send(toPhone, process.env.MSG91_TEMPLATE_BILLING_REMINDER ?? '', {
    var1: firstName,
    var2: plan,
    var3: billingDate,
  })
}
