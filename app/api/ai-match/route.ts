import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function genderCompatible(seekerPref: string, candidateGender: string): boolean {
  if (!seekerPref || seekerPref === 'Either' || seekerPref === 'Any') return true
  return seekerPref.toLowerCase() === candidateGender.toLowerCase()
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: me } = await supabase
    .from('profiles')
    .select('full_name, age, gender, city, country, religion, mother_tongue, education, occupation, pref_gender, pref_age_min, pref_age_max, pref_location, pref_religion')
    .eq('id', user.id)
    .single()

  if (!me) return NextResponse.json({ error: 'Complete your profile first' }, { status: 400 })

  const { data: allCandidates } = await supabase
    .from('profiles')
    .select('id, full_name, age, gender, city, country, religion, mother_tongue, education, occupation, pref_gender, pref_age_min, pref_age_max, pref_location, pref_religion')
    .eq('onboarding_complete', true)
    .neq('id', user.id)
    .limit(30)

  // Pre-filter: both parties must match each other's gender preference
  const candidates = (allCandidates ?? []).filter(c =>
    genderCompatible(me.pref_gender, c.gender) &&
    genderCompatible(c.pref_gender, me.gender)
  )

  if (!candidates.length) return NextResponse.json({ matches: [] })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are an expert matrimony matchmaker. Score compatibility between the user and each candidate from 0–100.

USER PROFILE:
Name: ${me.full_name} | Age: ${me.age} | Gender: ${me.gender}
Location: ${me.city}, ${me.country}
Religion: ${me.religion} | Mother Tongue: ${me.mother_tongue}
Education: ${me.education} | Occupation: ${me.occupation}
Looking for: ${me.pref_gender || 'Any gender'}, aged ${me.pref_age_min}–${me.pref_age_max}
Religion preference: ${me.pref_religion || 'Any'} | Location preference: ${me.pref_location || 'Any'}

CANDIDATES (already gender-compatible):
${candidates.map((p, i) => `${i + 1}. FULL_ID:${p.id}
   ${p.full_name} | ${p.age}yo ${p.gender} | ${p.city}, ${p.country}
   ${p.religion} | ${p.education} | ${p.occupation}
   Seeks: ${p.pref_gender || 'Any'} aged ${p.pref_age_min}–${p.pref_age_max} | Religion pref: ${p.pref_religion || 'Any'}`).join('\n\n')}

Score each candidate 0–100 based on: religion compatibility, age within mutual preference ranges, location proximity, education and occupation compatibility, and overall lifestyle alignment.

Return ONLY valid JSON (no markdown fences, no text outside JSON):
{"matches":[{"id":"FULL_UUID_HERE","score":85,"reasons":["Specific reason 1","Specific reason 2","Specific reason 3"]}]}

Use the exact FULL_ID for each candidate. Sort by score descending. Include all ${candidates.length} candidates.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

  // Strip accidental markdown fences
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  const result = JSON.parse(clean)

  // Enrich with full profile data — match on full UUID
  const enriched = result.matches
    .map((m: { id: string; score: number; reasons: string[] }) => {
      const profile = candidates.find(c => c.id === m.id)
      return profile ? { ...m, profile } : null
    })
    .filter(Boolean)

  return NextResponse.json({ matches: enriched })
}
