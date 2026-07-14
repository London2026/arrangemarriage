export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string // ISO 8601
  tag: string
  body: string // markdown
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'voice-before-face-why-it-works',
    title: 'Voice Before Face: Why We Ask You to Listen First',
    description: 'Every profile on Arrange Marriage starts with a voice recording, not a photo. Here is the thinking behind that choice — and why it leads to better matches.',
    date: '2026-06-02',
    tag: 'Our Approach',
    body: `Most matrimony platforms open with a photo grid. You scroll, you judge a face in two seconds, and you move on. It's fast — but it's also how a lot of genuinely good matches get skipped for reasons that have nothing to do with compatibility.

On Arrange Marriage, every profile starts with a short voice recording instead. Before you see a single photo, you hear how someone speaks — their warmth, their humour, the way they pause before answering something they care about. None of that comes through in a photograph.

## Why voice tells you more than a photo

Photos are static. A voice recording captures personality in motion: tone, pace, sincerity. Family and friends who've gone through arranged introductions the traditional way will tell you the same thing — the conversation always mattered more than the photo album. We just moved that instinct online.

## It also removes a bias you don't notice you have

Research on first impressions consistently shows that photos trigger snap judgements based on appearance alone, long before any real information is exchanged. Voice-first introductions don't eliminate bias entirely, but they delay it — by the time you see a face, you already have a sense of the person, not just their appearance.

## How it works on Arrange Marriage

1. Every member records a short voice introduction during onboarding.
2. When you open a profile, you hear their voice before their photo is shown.
3. Face photos stay blurred until you choose to reveal them — your pace, your control.

## What this means for you

Give the voice recording a real chance before deciding whether to view a photo. Many of our most successful matches say the same thing: *"I almost scrolled past, but I listened first — and that changed everything."*

If you haven't recorded your own introduction yet, take a few minutes to do it properly. Speak naturally, mention something you're genuinely passionate about, and let your personality come through. It's the first thing a potential match will experience of you — make it count.`,
  },
  {
    slug: 'understanding-your-ai-match-score',
    title: 'Understanding Your AI Match Score: What the Numbers Really Mean',
    description: 'Tap "Find My Match" and you get a ranked list with compatibility scores. Here is exactly what goes into that number, across all seven dimensions.',
    date: '2026-06-16',
    tag: 'Features',
    body: `On the Discover page, tapping **✨ Find My Match** hands your search over to our AI, which studies every active profile and ranks the ones most likely to be a genuine fit for you. A lot of members ask the same question afterward: *what does that score actually mean?*

Here's the honest breakdown.

## The seven dimensions

Our matching model scores compatibility across seven areas that consistently matter in long-term relationships, not just surface-level filters:

- **Religion & caste** — alignment with your stated preferences, where specified
- **Age** — whether the candidate falls within your preferred range
- **Location & lifestyle** — city, country, and day-to-day compatibility
- **Education & career** — parity and complementary ambition
- **Family background** — factors like family structure and values
- **Physical compatibility** — practical preferences like height, where relevant
- **Personality & interests** — pulled directly from your Personality section: favourite shows, travel, food, and more

No single dimension decides the outcome. A high score means a candidate performs well across *most* of these areas — not that every box is ticked.

## Reading the score

- **90+** — Exceptional match. Strong alignment across nearly every dimension.
- **75–89** — Strong match. A few areas may differ, but the core compatibility is solid.
- **60–74** — Good match, worth a closer look.
- **Below 60** — Not shown by default. We only surface candidates scoring 50 and above, so you're not wading through weak matches.

## What the score is not

It's not a guarantee, and it's not a ranking of "worthiness." It's a starting point — a way to surface the profiles most statistically likely to be compatible with you, out of everyone active on the platform right now. The final judgement — the conversation, the voice, the video meeting — is always yours to make.

## Getting a better score

The AI can only work with what's on your profile. Members with a complete Personality section (favourite reels, YouTube channels, web series, travel spots, and food) and clearly filled-in preferences consistently get more accurate — and more numerous — matches. If your matches feel off, that's usually the first place to check.`,
  },
  {
    slug: 'staying-safe-meeting-someone-new-online',
    title: 'Staying Safe While Getting to Know Someone New',
    description: 'A practical guide to using Arrange Marriage safely — from photo privacy to video meetings to knowing when it\'s time to meet in person.',
    date: '2026-06-28',
    tag: 'Safety',
    body: `Meeting a future life partner online should feel exciting, not risky. Every feature on Arrange Marriage — from ID verification to in-app video meetings — is built around one idea: you should always be in control of what you share and when.

Here's how to use those features to stay safe, in practice.

## Before you connect

- **Check for the verified badge.** Every profile is checked against a government ID before it goes live. If something about a profile still feels inconsistent once you're talking, trust that instinct.
- **Read the Personality section.** It's a genuine window into who someone is — not just their listed stats. Take the time to actually read it before deciding to like a profile.

## While you're getting to know someone

- **Keep the conversation in the app.** Your phone number and other contact details are never shared automatically, even after a mutual like. There's no need to hand them out early, and we'd recommend against it — everything you need to get to know someone, including video meetings, happens safely inside Arrange Marriage.
- **Use Report and Block without hesitation.** If anything about a conversation feels wrong — pressure to move off-platform, inconsistent stories, anything that makes you uncomfortable — report and block. Every report goes to a real person on our safety team, not an automated queue.
- **Photos can't be screenshotted.** Face photos are protected against screenshots and screen recording once revealed, so you can share a reveal with confidence.

## Video meetings: go slow, on purpose

Once you have a mutual like, either of you can request a video meeting with a preferred date and time. A few things worth knowing:

- You can invite a family member to join the call — many members do, especially for a first meeting.
- On paid plans, you can also request a neutral Arrange Marriage team member join as a support moderator, purely for additional comfort.
- We recommend more than one video call before making any decision about meeting in person. There's no rush, and no limit on getting to know someone properly first.

## When you're ready to meet in person

There's no fixed rule for when that should happen — it's different for every match. The signal to look for isn't a number of calls, it's whether *both* of you feel genuinely comfortable and confident. When you do decide to meet, the usual common-sense precautions apply: meet in a public place, let a family member or friend know your plans, and keep the pace one that feels right for you — not one dictated by anyone else's timeline, including ours.

Arrange Marriage is built to make the early, uncertain part of getting to know someone feel safer and more honest. Use the tools — voice-first introductions, controlled photo reveals, in-app video meetings — the way they're designed to be used, and take the rest at your own pace.`,
  },
]

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug)
}

export function getSortedBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1))
}
