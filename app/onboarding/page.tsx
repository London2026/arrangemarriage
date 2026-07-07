'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AboutStep from './steps/AboutStep'
import HabitsStep from './steps/HabitsStep'
import BackgroundStep from './steps/BackgroundStep'
import PreferencesStep from './steps/PreferencesStep'
import VoiceStep from './steps/VoiceStep'
import PhotosStep from './steps/PhotosStep'
import PersonalityStep from './steps/PersonalityStep'
import IdVerificationStep from './steps/IdVerificationStep'

const STEPS = ['About You', 'Lifestyle & Habits', 'Your Heritage', 'Preferences', 'Voice Intro', 'Your Photos', 'Personality', 'ID Verification']
const STEP_TIMES = [3, 1, 2, 2, 2, 2, 2, 1] // estimated minutes to fill each step's form

const c = {
  cream: '#f4f1eb', navy: '#0d1f3c', navyMid: '#1a3a5c',
  gold: '#8b6914', goldLight: '#c9a84c', sepia: '#5a6e82', rose: '#9e2a2b',
}

interface Draft {
  firstName: string; lastName: string; age: string; gender: string; city: string; country: string; phone: string
  height: string; weight: string; rashi: string
  brothers: string; sisters: string; fatherOccupation: string; motherOccupation: string
  housing: string; ownFarmLand: string; disability: string; foodHabits: string; smoking: string; alcohol: string; drugs: string; betting: string
  religion: string; caste: string; motherTongue: string
  education: string; universityName: string; educationSubject: string; otherQualifications: string
  occupation: string; occupationCity: string; annualSalary: string
  maritalStatus: string; hasKids: string
  prefGender: string; prefAgeMin: string; prefAgeMax: string; prefLocation: string; prefReligion: string; prefCaste: string
  prefEducation: string; prefHeight: string; prefCooking: string; prefOther: string
  favReels: string; favYoutube: string; favWebSeries: string; favTravel: string; favFoods: string; favAiTools: string; hobby: string
  idCountry: string
}

const EMPTY: Draft = {
  firstName: '', lastName: '', age: '', gender: '', city: '', country: '', phone: '',
  height: '', weight: '', rashi: '',
  brothers: '', sisters: '', fatherOccupation: '', motherOccupation: '',
  housing: '', ownFarmLand: '', disability: '', foodHabits: '', smoking: '', alcohol: '', drugs: '', betting: '',
  religion: '', caste: '', motherTongue: '',
  education: '', universityName: '', educationSubject: '', otherQualifications: '',
  occupation: '', occupationCity: '', annualSalary: '',
  maritalStatus: '', hasKids: '',
  prefGender: '', prefAgeMin: '18', prefAgeMax: '50', prefLocation: '', prefReligion: '', prefCaste: '',
  prefEducation: '', prefHeight: '', prefCooking: '', prefOther: '',
  favReels: '', favYoutube: '', favWebSeries: '', favTravel: '', favFoods: '', favAiTools: '', hobby: '',
  idCountry: '',
}

export default function OnboardingPageWrapper() {
  return (
    <Suspense>
      <OnboardingPage />
    </Suspense>
  )
}

function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedMsg, setSavedMsg] = useState('')
  const [userId, setUserId] = useState('')
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)
  const [voiceBlobEn, setVoiceBlobEn] = useState<Blob | null>(null)
  const [back1, setBack1] = useState<File | null>(null)
  const [back2, setBack2] = useState<File | null>(null)
  const [front, setFront] = useState<File | null>(null)
  const [idFile, setIdFile] = useState<File | null>(null)
  const [hasExistingPhotos, setHasExistingPhotos] = useState(false)
  const [hasExistingVoice, setHasExistingVoice] = useState(false)
  const [existingVoiceUrl, setExistingVoiceUrl] = useState<string | null>(null)
  const [existingVoiceEnUrl, setExistingVoiceEnUrl] = useState<string | null>(null)
  const [existingBack1Url, setExistingBack1Url] = useState<string | null>(null)
  const [existingBack2Url, setExistingBack2Url] = useState<string | null>(null)
  const [existingFrontUrl, setExistingFrontUrl] = useState<string | null>(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isEdit = searchParams.get('edit') === 'true'

  useEffect(() => {
    // Watchdog: if init hangs on a network call, show the form after 10s
    // rather than leaving the user stuck on the loading screen forever.
    const watchdog = setTimeout(() => setReady(true), 10000)
    let redirecting = false

    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { redirecting = true; window.location.replace('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      // Full page load rather than client navigation: immune to a hung or
      // errored RSC fetch, which would otherwise freeze this loading screen
      if (profile?.onboarding_complete && !isEdit) { redirecting = true; window.location.replace('/discover'); return }
      setUserId(user.id)
      setHasExistingPhotos(!!(profile?.back_photo_1_path && profile?.back_photo_2_path && profile?.front_photo_path))
      setHasExistingVoice(!!profile?.voice_path)
      // Load signed URLs for existing media in the background — the form must
      // never block on storage network calls
      const supabase2 = createClient()
      const paths = [
        profile?.voice_path, profile?.voice_en_path,
        profile?.back_photo_1_path, profile?.back_photo_2_path, profile?.front_photo_path,
      ]
      Promise.all(
        paths.map(p => p ? supabase2.storage.from('profile-media').createSignedUrl(p, 604800) : Promise.resolve(null))
      ).then(signed => {
        if (signed[0]?.data?.signedUrl) setExistingVoiceUrl(signed[0].data.signedUrl)
        if (signed[1]?.data?.signedUrl) setExistingVoiceEnUrl(signed[1].data.signedUrl)
        if (signed[2]?.data?.signedUrl) setExistingBack1Url(signed[2].data.signedUrl)
        if (signed[3]?.data?.signedUrl) setExistingBack2Url(signed[3].data.signedUrl)
        if (signed[4]?.data?.signedUrl) setExistingFrontUrl(signed[4].data.signedUrl)
      }).catch(() => { /* media previews are optional — never block onboarding on them */ })
      // Restore saved step
      const savedStep = localStorage.getItem(`ob_step_${user.id}`)
      if (savedStep) setStep(parseInt(savedStep))
      // Pre-fill draft with existing profile data when editing
      if (profile) {
        const rawName = (profile.full_name ?? user.user_metadata?.full_name ?? '').trim()
        const nameParts = rawName.split(/\s+/).filter(Boolean)
        setDraft({
          firstName: nameParts[0] ?? '',
          lastName: nameParts.slice(1).join(' ') ?? '',
          age: profile.age ? String(profile.age) : '',
          gender: profile.gender ?? '',
          city: profile.city ?? '',
          country: profile.country ?? '',
          religion: profile.religion ?? '',
          caste: profile.caste ?? '',
          motherTongue: profile.mother_tongue ?? '',
          education: profile.education ?? '',
          occupation: profile.occupation ?? '',
          prefGender: profile.pref_gender ?? '',
          prefAgeMin: profile.pref_age_min ? String(profile.pref_age_min) : '18',
          prefAgeMax: profile.pref_age_max ? String(profile.pref_age_max) : '50',
          prefLocation: profile.pref_location ?? '',
          prefReligion: profile.pref_religion ?? '',
          prefCaste: profile.pref_caste ?? '',
          phone: profile.phone ?? '',
          maritalStatus: profile.marital_status ?? '',
          hasKids: profile.has_kids ?? '',
          favReels: profile.fav_reels ?? '',
          favYoutube: profile.fav_youtube ?? '',
          favWebSeries: profile.fav_web_series ?? '',
          favTravel: profile.fav_travel ?? '',
          favFoods: profile.fav_foods ?? '',
          favAiTools: profile.fav_ai_tools ?? '',
          hobby: profile.hobby ?? '',
          idCountry: profile.id_country ?? '',
          // New fields
          height: profile.height ?? '',
          weight: profile.weight ?? '',
          rashi: profile.rashi ?? '',
          brothers: profile.brothers ?? '',
          sisters: profile.sisters ?? '',
          fatherOccupation: profile.father_occupation ?? '',
          motherOccupation: profile.mother_occupation ?? '',
          housing: profile.housing ?? '',
          ownFarmLand: profile.own_farm_land ?? '',
          disability: profile.disability ?? '',
          foodHabits: profile.food_habits ?? '',
          smoking: profile.smoking ?? '',
          alcohol: profile.alcohol ?? '',
          drugs: profile.drugs ?? '',
          betting: profile.betting ?? '',
          universityName: profile.university_name ?? '',
          educationSubject: profile.education_subject ?? '',
          otherQualifications: profile.other_qualifications ?? '',
          occupationCity: profile.occupation_city ?? '',
          annualSalary: profile.annual_salary ?? '',
          prefEducation: profile.pref_education ?? '',
          prefHeight: profile.pref_height ?? '',
          prefCooking: profile.pref_cooking ?? '',
          prefOther: profile.pref_other ?? '',
        })
      } else {
        const rawName = (user.user_metadata?.full_name ?? '').trim()
        const nameParts = rawName.split(/\s+/).filter(Boolean)
        setDraft(d => ({ ...d, firstName: nameParts[0] ?? '', lastName: nameParts.slice(1).join(' ') ?? '' }))
      }
    }
    init()
      .catch(err => console.error('Onboarding init failed:', err))
      .finally(() => { if (!redirecting) { clearTimeout(watchdog); setReady(true) } })
    return () => clearTimeout(watchdog)
  }, [router, isEdit])

  function change(key: string, value: string) { setDraft(d => ({ ...d, [key]: value })); setError(''); setSavedMsg('') }

  // Debounced auto-save: fires 1.5s after the last draft change
  useEffect(() => {
    if (!userId || !ready) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaveStatus('saving')
      const err = await saveToDb()
      setAutoSaveStatus(err ? 'idle' : 'saved')
      if (!err) setTimeout(() => setAutoSaveStatus('idle'), 2500)
    }, 1500)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [draft]) // eslint-disable-line react-hooks/exhaustive-deps

  async function autoUploadVoice(blob: Blob, isEn = false) {
    if (!userId) return
    const supabase = createClient()
    const ext = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
    const filename = isEn ? `voice-en.${ext}` : `voice.${ext}`
    const { data } = await supabase.storage.from('profile-media').upload(`${userId}/${filename}`, blob, { upsert: true })
    if (data?.path) {
      await supabase.from('profiles').upsert({
        id: userId,
        [isEn ? 'voice_en_path' : 'voice_path']: data.path,
        updated_at: new Date().toISOString(),
      })
      // Refresh signed URL so returning to the step shows the new recording
      const { data: s } = await supabase.storage.from('profile-media').createSignedUrl(data.path, 604800)
      if (s?.signedUrl) isEn ? setExistingVoiceEnUrl(s.signedUrl) : setExistingVoiceUrl(s.signedUrl)
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus('idle'), 2500)
    }
  }

  async function autoUploadPhoto(file: File, slot: 'back-1' | 'back-2' | 'front') {
    if (!userId) return
    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const { data } = await supabase.storage.from('profile-media').upload(`${userId}/${slot}.${ext}`, file, { upsert: true })
    if (data?.path) {
      const col = slot === 'back-1' ? 'back_photo_1_path' : slot === 'back-2' ? 'back_photo_2_path' : 'front_photo_path'
      await supabase.from('profiles').upsert({
        id: userId,
        [col]: data.path,
        updated_at: new Date().toISOString(),
      })
      // Refresh signed URL so returning to the step shows the new photo
      const { data: s } = await supabase.storage.from('profile-media').createSignedUrl(data.path, 604800)
      if (s?.signedUrl) {
        if (slot === 'back-1') setExistingBack1Url(s.signedUrl)
        else if (slot === 'back-2') setExistingBack2Url(s.signedUrl)
        else setExistingFrontUrl(s.signedUrl)
      }
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus('idle'), 2500)
    }
  }

  async function autoUploadId(file: File) {
    if (!userId) return
    const supabase = createClient()
    const ext = file.name.split('.').pop() ?? 'jpg'
    const { data } = await supabase.storage.from('profile-media').upload(`${userId}/id-document.${ext}`, file, { upsert: true })
    if (data?.path) {
      await supabase.from('profiles').upsert({
        id: userId,
        id_document_path: data.path,
        updated_at: new Date().toISOString(),
      })
      setAutoSaveStatus('saved')
      setTimeout(() => setAutoSaveStatus('idle'), 2500)
    }
  }

  function validate(): string {
    if (step === 0) {
      if (!draft.firstName.trim() || !draft.lastName.trim()) return 'Please enter your first and last name.'
      if (!draft.age || parseInt(draft.age) < 18) return 'Please enter a valid age (18+).'
      if (!draft.gender) return 'Please select your gender.'
      if (!draft.city || !draft.country) return 'Please enter your city and country.'
    }
    if (step === 0 && !draft.phone.trim()) return 'Mobile number is required.'
    if (step === 2 && (!draft.religion || !draft.motherTongue || !draft.education || !draft.occupation))
      return 'Please complete religion, mother tongue, education and occupation.'
    if (step === 3) {
      if (!draft.prefGender) return 'Please select who you are looking for.'
      if (parseInt(draft.prefAgeMin) >= parseInt(draft.prefAgeMax)) return 'Max age must be greater than min age.'
      if (!draft.prefReligion) return 'Please select a religion preference.'
    }
    if (step === 4 && !voiceBlob && !hasExistingVoice) return 'Please record your voice introduction.'
    if (step === 6) {
      const missing = ['favReels', 'favYoutube', 'favWebSeries', 'favTravel', 'favFoods', 'favAiTools']
        .filter(k => !draft[k as keyof typeof draft])
      if (missing.length > 0) return 'Please add at least 1 entry in every category.'
    }
    if (step === 5) {
      if (!back1 && !hasExistingPhotos) return 'Please upload both back-side photos.'
      if ((!back1 || !back2) && !hasExistingPhotos) return 'Please upload both back-side photos.'
      if (!front && !hasExistingPhotos) return 'Please upload your reveal photo.'
    }
    // Steps 6 & 7 are optional — no validation required
    return ''
  }

  async function handleNext() {
    const msg = validate()
    if (msg) { setError(msg); return }
    setError('')
    if (step < 7) {
      const next = step + 1
      setStep(next)
      if (userId) localStorage.setItem(`ob_step_${userId}`, String(next))
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()

      let voicePath: string | null = null
      const ext = MediaRecorder.isTypeSupported('audio/webm') ? 'webm' : 'mp4'
      if (voiceBlob) {
        const { data, error: vErr } = await supabase.storage.from('profile-media').upload(`${userId}/voice.${ext}`, voiceBlob, { upsert: true })
        if (vErr) console.warn('Voice upload:', vErr.message)
        voicePath = data?.path ?? null
      }
      if (voiceBlobEn) {
        await supabase.storage.from('profile-media').upload(`${userId}/voice-en.${ext}`, voiceBlobEn, { upsert: true })
      }

      // Only upload photos if new ones were selected
      let back1Path: string | null = null
      let back2Path: string | null = null
      let frontPath: string | null = null

      if (back1 && back2 && front) {
        const ext1 = back1.name.split('.').pop() ?? 'jpg'
        const ext2 = back2.name.split('.').pop() ?? 'jpg'
        const ext3 = front.name.split('.').pop() ?? 'jpg'
        const [r1, r2, r3] = await Promise.all([
          supabase.storage.from('profile-media').upload(`${userId}/back-1.${ext1}`, back1, { upsert: true }),
          supabase.storage.from('profile-media').upload(`${userId}/back-2.${ext2}`, back2, { upsert: true }),
          supabase.storage.from('profile-media').upload(`${userId}/front.${ext3}`, front, { upsert: true }),
        ])
        back1Path = r1.data?.path ?? null
        back2Path = r2.data?.path ?? null
        frontPath = r3.data?.path ?? null
      }

      // Upload ID document if provided
      let idDocPath: string | null = null
      if (idFile) {
        const idExt = idFile.name.split('.').pop() ?? 'jpg'
        const { data: idData } = await supabase.storage.from('profile-media').upload(`${userId}/id-document.${idExt}`, idFile, { upsert: true })
        idDocPath = idData?.path ?? null
      }

      const update: Record<string, unknown> = {
        id: userId,
        full_name: (draft.firstName.trim() + ' ' + draft.lastName.trim()).trim(),
        age: parseInt(draft.age), gender: draft.gender,
        city: draft.city, country: draft.country, religion: draft.religion,
        caste: draft.caste || null,
        mother_tongue: draft.motherTongue, education: draft.education, occupation: draft.occupation,
        marital_status: draft.maritalStatus || null, has_kids: draft.hasKids || null,
        pref_gender: draft.prefGender, pref_age_min: parseInt(draft.prefAgeMin),
        pref_age_max: parseInt(draft.prefAgeMax), pref_location: draft.prefLocation,
        pref_religion: draft.prefReligion, pref_caste: draft.prefCaste || null,
        pref_other: draft.prefOther || null,
        phone: draft.phone.trim() || null,
        fav_reels: draft.favReels || null, fav_youtube: draft.favYoutube || null,
        fav_web_series: draft.favWebSeries || null, fav_travel: draft.favTravel || null,
        fav_foods: draft.favFoods || null, fav_ai_tools: draft.favAiTools || null,
        hobby: draft.hobby || null,
        id_country: draft.idCountry || null,
        // New fields
        brothers: draft.brothers || null, sisters: draft.sisters || null,
        father_occupation: draft.fatherOccupation || null, mother_occupation: draft.motherOccupation || null,
        housing: draft.housing || null, own_farm_land: draft.ownFarmLand || null, disability: draft.disability || null,
        food_habits: draft.foodHabits || null, smoking: draft.smoking || null, alcohol: draft.alcohol || null,
        drugs: draft.drugs || null, betting: draft.betting || null,
        university_name: draft.universityName || null,
        education_subject: draft.educationSubject || null,
        other_qualifications: draft.otherQualifications || null,
        occupation_city: draft.occupationCity || null, annual_salary: draft.annualSalary || null,
        height: draft.height || null, weight: draft.weight || null, rashi: draft.rashi || null,
        pref_education: draft.prefEducation || null,
        pref_height: draft.prefHeight || null,
        pref_cooking: draft.prefCooking || null,
        onboarding_complete: true, updated_at: new Date().toISOString(),
      }
      if (idDocPath) update.id_document_path = idDocPath
      if (voicePath) update.voice_path = voicePath
      if (back1Path) update.back_photo_1_path = back1Path
      if (back2Path) update.back_photo_2_path = back2Path
      if (frontPath) update.front_photo_path = frontPath

      const { error: dbErr } = await supabase.from('profiles').upsert(update)

      if (dbErr) throw dbErr
      localStorage.removeItem(`ob_step_${userId}`)
      // Send profile-complete email only on first-time completion, not edits
      if (!isEdit) {
        fetch('/api/notify-profile-complete', { method: 'POST', keepalive: true }).catch(() => {})
      }
      router.refresh()
      router.push(isEdit ? '/profile' : '/discover')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!ready) {
    return (
      <div style={{ minHeight: '100vh', background: c.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <style>{`
            @keyframes logoBreath { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.035); } }
            @keyframes dotFade { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
            @media (prefers-reduced-motion: reduce) { .ob-load-logo, .ob-load-dot { animation: none !important; } }
          `}</style>
          <div className="ob-load-logo" style={{ background: '#fff', border: '2px solid #111', borderRadius: 14, width: 160, height: 160, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 18px rgba(13,31,60,0.09)', marginBottom: '0.75rem', animation: 'logoBreath 2.8s ease-in-out infinite' }}>
            <img src="/arrangemarriage-logo.png" alt="Arrange Marriage" style={{ maxWidth: '144px', maxHeight: '144px', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }} />
          </div>
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', color: c.sepia }}>
            Preparing your profile
            {[0, 1, 2].map(i => (
              <span key={i} className="ob-load-dot" style={{ animation: `dotFade 1.4s ease-in-out ${i * 0.25}s infinite` }}>.</span>
            ))}
          </p>
        </div>
      </div>
    )
  }

  const progress = ((step + 1) / STEPS.length) * 100

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  async function saveToDb(): Promise<string | null> {
    const supabase = createClient()
    const { error: saveErr } = await supabase.from('profiles').upsert({
      id: userId,
      full_name: (draft.firstName.trim() + ' ' + draft.lastName.trim()).trim() || null,
      age: draft.age ? parseInt(draft.age) : null,
      gender: draft.gender || null, city: draft.city || null, country: draft.country || null,
      phone: draft.phone.trim() || null,
      religion: draft.religion || null, caste: draft.caste || null,
      mother_tongue: draft.motherTongue || null, education: draft.education || null,
      occupation: draft.occupation || null, marital_status: draft.maritalStatus || null,
      has_kids: draft.hasKids || null,
      brothers: draft.brothers || null, sisters: draft.sisters || null,
      father_occupation: draft.fatherOccupation || null, mother_occupation: draft.motherOccupation || null,
      housing: draft.housing || null, disability: draft.disability || null,
      food_habits: draft.foodHabits || null, smoking: draft.smoking || null, alcohol: draft.alcohol || null,
      drugs: draft.drugs || null, betting: draft.betting || null,
      university_name: draft.universityName || null,
      education_subject: draft.educationSubject || null, other_qualifications: draft.otherQualifications || null,
      occupation_city: draft.occupationCity || null, annual_salary: draft.annualSalary || null,
      height: draft.height || null, weight: draft.weight || null, rashi: draft.rashi || null,
      pref_gender: draft.prefGender || null,
      pref_age_min: draft.prefAgeMin ? parseInt(draft.prefAgeMin) : null,
      pref_age_max: draft.prefAgeMax ? parseInt(draft.prefAgeMax) : null,
      pref_location: draft.prefLocation || null, pref_religion: draft.prefReligion || null,
      pref_caste: draft.prefCaste || null, pref_other: draft.prefOther || null,
      pref_education: draft.prefEducation || null,
      pref_height: draft.prefHeight || null, pref_cooking: draft.prefCooking || null,
      fav_reels: draft.favReels || null, fav_youtube: draft.favYoutube || null,
      fav_web_series: draft.favWebSeries || null, fav_travel: draft.favTravel || null,
      fav_foods: draft.favFoods || null, fav_ai_tools: draft.favAiTools || null,
      hobby: draft.hobby || null,
      id_country: draft.idCountry || null,
      updated_at: new Date().toISOString(),
    })
    if (saveErr) return saveErr.message + (saveErr.details ? ` — ${saveErr.details}` : '')
    localStorage.setItem(`ob_step_${userId}`, String(step))
    return null
  }

  async function saveProgress() {
    if (!userId) { setError('Session expired. Please refresh the page.'); return }
    setSaving(true)
    setError('')
    setSavedMsg('')
    const err = await saveToDb()
    setSaving(false)
    if (err) { setError(err); return }
    setSavedMsg('Progress saved!')
    setTimeout(() => setSavedMsg(''), 3000)
  }

  async function saveAndExit() {
    if (!userId) { setError('Session expired. Please refresh the page.'); return }
    setSaving(true)
    setError('')
    setSavedMsg('')
    const err = await saveToDb()
    setSaving(false)
    if (err) { setError(err); return }
    router.push('/?saved=1')
  }

  return (
    <div className="ob-page" style={{ minHeight: '100dvh', background: c.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.75rem 0.75rem' }}>
      <style>{`
        .ob-page { box-sizing: border-box; overflow-x: hidden; }
        .ob-logo-wrap { background: #fff; border: 2px solid #111; border-radius: 14px; width: 190px; height: 190px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 2px 18px rgba(13,31,60,0.09); margin-bottom: 1.25rem; }
        .ob-logo { max-width: 174px; max-height: 174px; width: auto; height: auto; object-fit: contain; display: block; }
        .ob-progress { width: 100%; max-width: 720px; margin-bottom: 1rem; }
        .ob-topnav { width: 100%; max-width: 720px; display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; margin-bottom: 0.85rem; flex-wrap: wrap; }
        .ob-topnav a, .ob-topnav button { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; line-height: 1; font-family: Raleway, sans-serif; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; text-decoration: none; padding: 0.5rem 0.85rem; min-height: 36px; border-radius: 4px; cursor: pointer; border: 1px solid rgba(13,31,60,0.35); background: transparent; color: #2c4a6e; }
        .ob-topnav button { color: #9e2a2b; }
        .ob-card { width: 100%; max-width: 720px; background: #fff; border-radius: 10px; box-shadow: 0 16px 60px rgba(13,31,60,0.12); border: 1px solid rgba(13,31,60,0.08); overflow: hidden; }
        .ob-card-inner { padding: 2.5rem 2.5rem 1.5rem; }
        .ob-nav { padding: 1.25rem 2.5rem 2rem; display: flex; gap: 0.75rem; border-top: 1px solid rgba(13,31,60,0.06); align-items: center; flex-wrap: wrap; }
        .ob-btn-back { padding: 0.85rem 1.5rem; min-height: 48px; background: transparent; border: 1px solid rgba(13,31,60,0.2); color: #5a6e82; font-family: Raleway, sans-serif; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 4px; white-space: nowrap; transition: border-color 0.25s ease, color 0.25s ease, transform 0.25s ease; }
        .ob-btn-back:hover { border-color: #1b3a6b; color: #1b3a6b; transform: translateY(-1px); }
        .ob-btn-next { padding: 0.85rem 2.25rem; min-height: 48px; border: none; font-family: Raleway, sans-serif; font-size: 0.85rem; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; border-radius: 4px; transition: background 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease; white-space: nowrap; }
        .ob-btn-next:hover { box-shadow: 0 4px 18px rgba(139,105,20,0.3); transform: translateY(-1px); }
        @media (prefers-reduced-motion: reduce) {
          .ob-btn-back, .ob-btn-next { transition: none; }
          .ob-btn-back:hover, .ob-btn-next:hover { transform: none; }
        }
        .ob-step-h2 { font-family: var(--font-playfair, "Playfair Display", serif); font-size: 1.9rem; font-weight: 600; }
        .ob-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.1rem; }
        @media (max-width: 640px) {
          .ob-page { justify-content: flex-start !important; padding: 0.75rem 0.5rem 1.5rem !important; }
          .ob-logo-wrap { width: 150px !important; height: 150px !important; margin-bottom: 1rem !important; }
          .ob-logo { max-width: 136px !important; max-height: 136px !important; height: auto !important; }
          .ob-progress { margin-bottom: 0.6rem; }
          .ob-card-inner { padding: 1.25rem 1rem 1rem !important; }
          .ob-nav { padding: 0.75rem 1rem 1.25rem !important; gap: 0.5rem !important; }
          .ob-btn-back { padding: 0.75rem 1rem !important; font-size: 0.78rem !important; min-height: 48px !important; }
          .ob-btn-next { padding: 0.75rem 1.25rem !important; font-size: 0.78rem !important; min-height: 48px !important; flex: 1 !important; }
          .ob-step-h2 { font-size: 1.35rem !important; }
          .ob-topnav { gap: 0.35rem !important; margin-bottom: 0.6rem !important; }
          .ob-topnav a, .ob-topnav button { font-size: 0.68rem !important; padding: 0.5rem 0.65rem !important; min-height: 36px !important; }
          .ob-row { grid-template-columns: 1fr !important; gap: 0.75rem !important; }
        }
        @media (max-width: 380px) {
          .ob-card-inner { padding: 1rem 0.75rem 0.75rem !important; }
          .ob-step-h2 { font-size: 1.2rem !important; }
        }
      `}</style>

      {/* Top navigation */}
      <nav className="ob-topnav">
        <Link href="/discover">← Discover</Link>
        <Link href="/">Home</Link>
        <button onClick={handleLogout}>Log out</button>
      </nav>

      {/* Logo + Progress */}
      <div className="ob-progress">
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <div className="ob-logo-wrap">
              <img src="/arrangemarriage-logo.png" alt="Arrange Marriage" className="ob-logo" />
            </div>
          </Link>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: c.gold }}>
            Step {step + 1} of {STEPS.length}
          </span>
          <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.9rem', color: c.sepia }}>
            {STEPS[step]} <span style={{ opacity: 0.7 }}>· ⏱ ~{STEP_TIMES[step]} min</span>
          </span>
        </div>
        <div style={{ height: '3px', background: 'rgba(13,31,60,0.08)', borderRadius: '2px' }}>
          <div style={{ height: '100%', background: c.gold, borderRadius: '2px', width: `${progress}%`, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i <= step ? c.gold : 'rgba(13,31,60,0.12)', transition: 'background 0.3s' }} />
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="ob-card">

        <div className="ob-card-inner">
          <MotionConfig reducedMotion="user">
          <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
          {step === 0 && <AboutStep data={{ firstName: draft.firstName, lastName: draft.lastName, age: draft.age, gender: draft.gender, city: draft.city, country: draft.country, phone: draft.phone, height: draft.height, weight: draft.weight, rashi: draft.rashi, brothers: draft.brothers, sisters: draft.sisters, fatherOccupation: draft.fatherOccupation, motherOccupation: draft.motherOccupation, housing: draft.housing, ownFarmLand: draft.ownFarmLand, disability: draft.disability, foodHabits: draft.foodHabits, hobby: draft.hobby }} onChange={change} />}
          {step === 1 && <HabitsStep data={{ smoking: draft.smoking, alcohol: draft.alcohol, drugs: draft.drugs, betting: draft.betting }} onChange={change} />}
          {step === 2 && <BackgroundStep data={{ religion: draft.religion, caste: draft.caste, motherTongue: draft.motherTongue, education: draft.education, universityName: draft.universityName, educationSubject: draft.educationSubject, otherQualifications: draft.otherQualifications, occupation: draft.occupation, occupationCity: draft.occupationCity, annualSalary: draft.annualSalary, maritalStatus: draft.maritalStatus, hasKids: draft.hasKids }} onChange={change} />}
          {step === 3 && <PreferencesStep data={{ prefGender: draft.prefGender, prefAgeMin: draft.prefAgeMin, prefAgeMax: draft.prefAgeMax, prefLocation: draft.prefLocation, prefReligion: draft.prefReligion, prefCaste: draft.prefCaste, prefEducation: draft.prefEducation, prefHeight: draft.prefHeight, prefCooking: draft.prefCooking, prefOther: draft.prefOther }} onChange={change} />}
          {step === 4 && <VoiceStep
            onVoiceChange={b => { setVoiceBlob(b); if (b) autoUploadVoice(b, false) }}
            onVoiceEnChange={b => { setVoiceBlobEn(b); if (b) autoUploadVoice(b, true) }}
            hasRecording={!!voiceBlob} existingUrl={existingVoiceUrl} existingEnUrl={existingVoiceEnUrl} />}
          {step === 5 && <PhotosStep back1={back1} back2={back2} front={front}
            onPhotosChange={(b1, b2, f) => {
              if (b1 !== back1) { setBack1(b1); if (b1) autoUploadPhoto(b1, 'back-1') }
              if (b2 !== back2) { setBack2(b2); if (b2) autoUploadPhoto(b2, 'back-2') }
              if (f !== front)  { setFront(f);  if (f)  autoUploadPhoto(f,  'front')  }
            }}
            existingBack1Url={existingBack1Url} existingBack2Url={existingBack2Url} existingFrontUrl={existingFrontUrl} />}
          {step === 6 && <PersonalityStep data={{ favReels: draft.favReels, favYoutube: draft.favYoutube, favWebSeries: draft.favWebSeries, favTravel: draft.favTravel, favFoods: draft.favFoods, favAiTools: draft.favAiTools }} onChange={change} />}
          {step === 7 && <IdVerificationStep idCountry={draft.idCountry} idFile={idFile} onIdChange={(country, file) => { change('idCountry', country); setIdFile(file); if (file) autoUploadId(file) }} />}
          </motion.div>
          </AnimatePresence>
          </MotionConfig>

          {error && (
            <div style={{ marginTop: '1rem', background: 'rgba(158,42,43,0.07)', border: '1px solid rgba(158,42,43,0.2)', borderRadius: '4px', padding: '0.65rem 0.9rem', color: c.rose, fontSize: '0.9rem', fontFamily: '"Cormorant Garamond", serif', textAlign: 'center' }}>
              {error}
            </div>
          )}
          {savedMsg && (
            <div style={{ marginTop: '1rem', background: 'rgba(29,82,82,0.07)', border: '1px solid rgba(29,82,82,0.25)', borderRadius: '4px', padding: '0.65rem 0.9rem', color: '#1d5252', fontSize: '0.9rem', fontFamily: '"Cormorant Garamond", serif', textAlign: 'center' }}>
              ✓ {savedMsg}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="ob-nav" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {step > 0 && (
              <button onClick={() => { const prev = step - 1; setStep(prev); setError(''); setSavedMsg(''); if (userId) localStorage.setItem(`ob_step_${userId}`, String(prev)) }} disabled={saving} className="ob-btn-back">
                ← Back
              </button>
            )}
            <button onClick={saveProgress} disabled={saving} className="ob-btn-back"
              style={{ color: '#1d5252', borderColor: 'rgba(29,82,82,0.35)' }}>
              {saving ? '…' : '💾 Save'}
            </button>
            {autoSaveStatus === 'saving' && (
              <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', color: c.sepia, letterSpacing: '0.05em' }}>
                Saving…
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.68rem', color: '#1d5252', letterSpacing: '0.05em' }}>
                ✓ Auto-saved
              </span>
            )}
          </div>
          <button onClick={handleNext} disabled={saving} className="ob-btn-next"
            style={{ background: saving ? c.navyMid : c.navy, color: c.goldLight, cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Saving…' : step === 6 ? (isEdit ? 'Save Changes ✓' : 'Complete Profile ✓') : 'Continue →'}
          </button>
        </div>
      </div>

      {/* Save & Exit */}
      <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
        <button onClick={saveAndExit} disabled={saving}
          style={{ fontFamily: 'Raleway, sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#3B5A5A', background: '#fff', border: '2px solid rgba(29,82,82,0.35)', borderRadius: '6px', padding: '0.7rem 2rem', cursor: saving ? 'default' : 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          💾 Save &amp; Exit
        </button>
        <p style={{ fontFamily: 'Raleway, sans-serif', fontWeight: 600, fontSize: '0.78rem', color: '#3B5A5A', margin: '0.55rem 0 0', lineHeight: 1.6, letterSpacing: '0.02em' }}>
          You can save your progress and come back anytime —<br />
          everything entered so far will be saved.
        </p>
      </div>
      <p style={{ marginTop: '0.75rem', fontFamily: 'Raleway, sans-serif', fontSize: '0.58rem', letterSpacing: '0.1em', color: 'rgba(90,110,130,0.45)', textAlign: 'center' }}>
        🔒 Your data is encrypted and private
      </p>
    </div>
  )
}
