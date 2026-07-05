// Headless debug: load production /onboarding unauthenticated and report
// console errors, failed requests, final URL, and visible text.
import puppeteer from 'puppeteer'

const url = process.argv[2] ?? 'https://www.arrangemarriage.co.in/onboarding'

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()

const logs = []
page.on('console', msg => logs.push(`[console.${msg.type()}] ${msg.text()}`))
page.on('pageerror', err => logs.push(`[pageerror] ${err.message}`))
page.on('requestfailed', req => logs.push(`[requestfailed] ${req.url()} — ${req.failure()?.errorText}`))
page.on('response', res => { if (res.status() >= 400) logs.push(`[http ${res.status()}] ${res.url()}`) })

await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 }).catch(e => logs.push(`[goto] ${e.message}`))

// Give client JS time to run auth check + redirect (watchdog fires at 10s)
await new Promise(r => setTimeout(r, 14000))

const finalUrl = page.url()
const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300)).catch(() => '(no body)')

console.log('FINAL URL:', finalUrl)
console.log('BODY TEXT:', JSON.stringify(bodyText))
console.log('--- events ---')
for (const l of logs) console.log(l)

await browser.close()
