import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const r = req.nextUrl.searchParams.get('r')
  if (!r || !/^[\w-]+$/.test(r)) {
    return NextResponse.redirect(new URL('/profile', req.url))
  }
  return NextResponse.redirect(`https://meet.jit.si/ArrangeMarriage-${r}`)
}
