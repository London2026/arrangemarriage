import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

function verifyToken(meetingId: string, raterId: string, token: string): boolean {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  const expected = createHmac('sha256', secret)
    .update(`rating:${meetingId}:${raterId}`)
    .digest('hex')
    .slice(0, 32)
  return token === expected
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const meetingId = searchParams.get('m') ?? ''
  const raterId   = searchParams.get('u') ?? ''
  const rating    = parseInt(searchParams.get('r') ?? '0', 10)
  const token     = searchParams.get('t') ?? ''

  if (!meetingId || !raterId || !token || rating < 1 || rating > 5) {
    return new NextResponse(page('Invalid Rating Link', 'This rating link appears to be invalid or has already expired.'), {
      status: 400, headers: { 'Content-Type': 'text/html' },
    })
  }

  if (!verifyToken(meetingId, raterId, token)) {
    return new NextResponse(page('Link Not Valid', 'This rating link is not valid. Please use the link from your original meeting email.'), {
      status: 403, headers: { 'Content-Type': 'text/html' },
    })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('meeting_ratings').upsert(
    { meeting_id: meetingId, rater_id: raterId, rating },
    { onConflict: 'meeting_id,rater_id' }
  )

  if (error) {
    return new NextResponse(page('Something Went Wrong', 'We could not save your rating. Please try again.'), {
      status: 500, headers: { 'Content-Type': 'text/html' },
    })
  }

  return new NextResponse(thankYouPage(rating), { headers: { 'Content-Type': 'text/html' } })
}

function shell(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Arrange Marriage</title>
  <style>
    body { margin:0; padding:0; background:#f4f1eb; font-family:Georgia,serif;
           min-height:100vh; display:flex; align-items:center; justify-content:center; }
    .card { max-width:480px; width:100%; margin:2rem auto; padding:0 1rem; text-align:center; }
    .inner { background:#0d1f3c; border-radius:14px; padding:3rem 2rem;
             box-shadow:0 8px 32px rgba(13,31,60,0.15); }
    .brand { font-family:Georgia,serif; font-size:22px; font-weight:700;
             color:#c9a84c; margin:0 0 1.5rem; letter-spacing:0.04em; }
    .btn { display:inline-block; margin-top:1.75rem; padding:0.75rem 2rem;
           background:linear-gradient(135deg,#e8c876,#c9a84c); color:#0d1f3c;
           font-family:Arial,sans-serif; font-size:0.78rem; font-weight:700;
           letter-spacing:0.15em; text-transform:uppercase; text-decoration:none;
           border-radius:4px; }
  </style>
</head>
<body><div class="card"><div class="inner">${body}</div></div></body>
</html>`
}

function thankYouPage(rating: number) {
  const filled = '★'.repeat(rating)
  const empty  = '☆'.repeat(5 - rating)
  return shell(`
    <p class="brand">Arrange Marriage</p>
    <div style="font-size:3rem;color:#c9a84c;letter-spacing:0.1em;margin-bottom:1rem;">${filled}<span style="color:rgba(201,168,76,0.3);">${empty}</span></div>
    <h1 style="font-family:Georgia,serif;font-size:1.5rem;color:#f5f0e6;margin:0 0 0.75rem;font-weight:400;">Thank you for your feedback!</h1>
    <p style="font-family:Georgia,serif;font-size:1rem;color:rgba(245,240,230,0.6);margin:0;line-height:1.75;">
      Your ${rating}-star rating has been received. Your feedback helps us ensure
      every member has a meaningful experience on Arrange Marriage.
    </p>
    <a href="https://arrangemarriage.co.in/discover" class="btn">Return to Arrange Marriage →</a>
  `)
}

function page(title: string, message: string) {
  return shell(`
    <p class="brand">Arrange Marriage</p>
    <h1 style="font-family:Georgia,serif;font-size:1.35rem;color:#f5f0e6;margin:0 0 0.75rem;font-weight:400;">${title}</h1>
    <p style="font-family:Georgia,serif;font-size:1rem;color:rgba(245,240,230,0.6);margin:0;line-height:1.75;">${message}</p>
    <a href="https://arrangemarriage.co.in/discover" class="btn">Go to Arrange Marriage →</a>
  `)
}
