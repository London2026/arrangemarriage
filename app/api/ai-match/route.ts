import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function oppositeGender(g: string): string | null {
  const l = g?.toLowerCase()
  if (l === 'man')   return 'woman'
  if (l === 'woman') return 'man'
  return null // Other — no hard filter
}

function genderCompatible(seekerPref: string, candidateGender: string): boolean {
  if (!seekerPref || seekerPref === 'Either' || seekerPref === 'Any') return true
  return seekerPref.toLowerCase() === candidateGender.toLowerCase()
}

function val(v: unknown) { return v || '—' }

function profileBlock(p: Record<string, unknown>, idx?: number): string {
  const prefix = idx !== undefined ? `${idx + 1}. FULL_ID:${p.id}\n   ` : ''
  return `${prefix}${p.full_name} | ${p.age}yo ${p.gender} | ${p.city}, ${p.country}
   Religion: ${val(p.religion)} | Caste: ${val(p.caste)} | Mother Tongue: ${val(p.mother_tongue)}
   Education: ${val(p.education)} | Occupation: ${val(p.occupation)} | Salary: ${val(p.annual_salary)}
   Marital status: ${val(p.marital_status)} | Has kids: ${val(p.has_kids)}
   Height: ${val(p.height)} | Weight: ${val(p.weight)} | Food: ${val(p.food_habits)} | Smoking: ${val(p.smoking)} | Alcohol: ${val(p.alcohol)}
   Housing: ${val(p.housing)} | Disability: ${val(p.disability)}
   Family: ${val(p.brothers)} brothers, ${val(p.sisters)} sisters | Father: ${val(p.father_occupation)} | Mother: ${val(p.mother_occupation)}
   Seeks: ${val(p.pref_gender)} aged ${val(p.pref_age_min)}–${val(p.pref_age_max)} | Location pref: ${val(p.pref_location)} | Religion pref: ${val(p.pref_religion)} | Caste pref: ${val(p.pref_caste)}
   Education pref: ${val(p.pref_education)} | Height pref: ${val(p.pref_height)} | Cooking pref: ${val(p.pref_cooking)}
   Other preferences: ${val(p.pref_other)}
   Hobbies: ${val(p.hobby)} | Favourite Reels: ${val(p.fav_reels)} | YouTube: ${val(p.fav_youtube)}
   Web series: ${val(p.fav_web_series)} | Travel: ${val(p.fav_travel)} | Foods: ${val(p.fav_foods)} | AI tools: ${val(p.fav_ai_tools)}`
}

const FULL_SELECT = `
  id, full_name, age, gender, city, country,
  religion, caste, mother_tongue, education, occupation, annual_salary,
  marital_status, has_kids, height, weight, food_habits, smoking, alcohol,
  housing, disability, hobby,
  brothers, sisters, father_occupation, mother_occupation,
  pref_gender, pref_age_min, pref_age_max, pref_location, pref_religion, pref_caste,
  pref_education, pref_height, pref_cooking, pref_other,
  fav_reels, fav_youtube, fav_web_series, fav_travel, fav_foods, fav_ai_tools
`

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: me } = await supabase
    .from('profiles')
    .select(FULL_SELECT)
    .eq('id', user.id)
    .single()

  if (!me) return NextResponse.json({ error: 'Complete your profile first' }, { status: 400 })

  const { data: allCandidates } = await supabase
    .from('profiles')
    .select(FULL_SELECT)
    .eq('onboarding_complete', true)
    .neq('id', user.id)
    .limit(50)

  // Hard filter: opposite sex by default, then mutual preference compatibility
  const opp = oppositeGender(me.gender)
  const candidates = (allCandidates ?? []).filter(c => {
    if (opp && c.gender?.toLowerCase() !== opp) return false
    return genderCompatible(me.pref_gender, c.gender) && genderCompatible(c.pref_gender, me.gender)
  })

  if (!candidates.length) return NextResponse.json({ matches: [] })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured. Please contact support.' }, { status: 503 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are an expert Indian matrimony matchmaker. Score compatibility between the user and each candidate from 0–100.

Consider ALL of the following dimensions equally:
- Religion and caste compatibility (explicit preferences vs actual values)
- Age within each other's preferred ranges
- Location and lifestyle alignment
- Education and career compatibility
- Family background (siblings, parents' occupations, housing)
- Physical compatibility (height, weight preferences)
- Lifestyle habits (food, smoking, alcohol, disability)
- Personality and interests (hobbies, web series, travel, food preferences, AI tools, YouTube channels, Reels)
- Each other's stated "Other preferences"

USER PROFILE:
${profileBlock(me as unknown as Record<string, unknown>)}

CANDIDATES (opposite sex, already gender-compatible — score each one):
${candidates.map((c, i) => profileBlock(c as unknown as Record<string, unknown>, i)).join('\n\n')}

Return ONLY valid JSON (no markdown, no explanation, no text outside the JSON):
{"matches":[{"id":"EXACT_FULL_UUID","score":85,"reasons":["Specific reason about what matches or doesn't match — be concrete, mention actual values"]}]}

Rules:
- Use the EXACT full UUID from FULL_ID for each candidate
- Each match must have exactly 4 reasons — mix positives and negatives honestly
- Sort by score descending
- Include ALL ${candidates.length} candidates`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  let result: { matches: { id: string; score: number; reasons: string[] }[] }
  try {
    result = JSON.parse(clean)
  } catch {
    return NextResponse.json({ error: 'AI returned an unexpected response. Please try again.' }, { status: 502 })
  }

  if (!result?.matches || !Array.isArray(result.matches)) {
    return NextResponse.json({ error: 'AI response was malformed. Please try again.' }, { status: 502 })
  }

  const enriched = result.matches
    .map((m: { id: string; score: number; reasons: string[] }) => {
      const profile = candidates.find(c => c.id === m.id)
      return profile ? { ...m, profile } : null
    })
    .filter(Boolean)

  return NextResponse.json({ matches: enriched })
}
