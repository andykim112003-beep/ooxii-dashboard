'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

const STEPS = ['Client info', 'Distance vision', 'Near vision', 'Glasses dispensed']

export default function TestFlow() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const hasRun = useRef(false)

  const [form, setForm] = useState({
    yearOfBirth: '',
    gender: '',
    cataractSurgery: 'No',
    ooxiiId: '',
    distanceLine: '',
    distanceLetters: '',
    distanceSnellen: '',
    nearLine: '',
    nearLetters: '',
    nearSnellen: '',
    frameType: 'Plastic',
    frameColourFront: '',
    frameColourRight: '',
    frameColourLeft: '',
    frameSize: '',
  })

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const progress = ((step + 1) / STEPS.length) * 100

  async function finish() {
    if (hasRun.current) return
    hasRun.current = true
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: session } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        clients_tested: 1,
        points_earned: 1,
        festival_name: 'Test Festival'
      })
      .select('id')
      .single()

    if (session) {
      await supabase.from('prescriptions').insert({
        session_id: session.id,
        user_id: user.id,
        year_of_birth: parseInt(form.yearOfBirth) || null,
        gender: form.gender,
        cataract_surgery: form.cataractSurgery,
        ooxii_id: form.ooxiiId,
        distance_vision_line: parseInt(form.distanceLine) || null,
        distance_vision_letters_correct: parseInt(form.distanceLetters) || null,
        distance_snellen: form.distanceSnellen,
        near_vision_line: parseInt(form.nearLine) || null,
        near_vision_letters_correct: parseInt(form.nearLetters) || null,
        near_snellen: form.nearSnellen,
        frame_type: form.frameType,
        frame_colour_front: form.frameColourFront,
        frame_colour_right: form.frameColourRight,
        frame_colour_left: form.frameColourLeft,
        frame_size: form.frameSize,
      })

      await supabase.from('points_ledger').insert({
        user_id: user.id,
        session_id: session.id,
        amount: 1,
        reason: 'Session completed'
      })
    }

    setSaving(false)
    router.push('/session-complete')
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.1)',
    border: '0.5px solid rgba(255,255,255,0.22)', borderRadius: '12px',
    color: '#fff', fontSize: '14px', padding: '12px 16px',
    outline: 'none', boxSizing: 'border-box' as const
  }

  const labelStyle = {
    color: 'rgba(255,255,255,0.75)', fontSize: '13px',
    display: 'block', marginBottom: '6px'
  }

  const radioRow = (label: string, value: string, field: string, current: string) => (
    <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', cursor: 'pointer' }}>
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%',
        border: `2px solid ${current === value ? '#1d9e75' : 'rgba(255,255,255,0.3)'}`,
        background: current === value ? '#1d9e75' : 'transparent',
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {current === value && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />}
      </div>
      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>{label}</span>
      <input type="radio" value={value} checked={current === value} onChange={() => update(field, value)} style={{ display: 'none' }} />
    </label>
  )

  const lineNumbers = Array.from({ length: 11 }, (_, i) => 11 - i)

  return (
    <main style={{ minHeight: '100dvh', background: '#2d2f6e', fontFamily: 'sans-serif', maxWidth: '430px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#252660', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontSize: '17px', fontWeight: '500', letterSpacing: '1px' }}>ooxii</span>
        <span style={{ background: '#1d9e75', color: '#e1f5ee', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '500' }}>Online</span>
      </div>

      <div style={{ padding: '12px 16px 6px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{STEPS[step]}</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '8px', height: '6px', overflow: 'hidden' }}>
          <div style={{ background: '#1d9e75', height: '100%', width: `${progress}%`, borderRadius: '8px', transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= step ? '#1d9e75' : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 100px' }}>

        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ color: '#fff', fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>Client information</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Year of birth</label>
                <input type="number" placeholder="1966" value={form.yearOfBirth} onChange={e => update('yearOfBirth', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Gender</label>
                <select value={form.gender} onChange={e => update('gender', e.target.value)} style={{ ...inputStyle, appearance: 'none' as const }}>
                  <option value="" style={{ background: '#2d2f6e' }}>Select</option>
                  <option value="Male" style={{ background: '#2d2f6e' }}>Male</option>
                  <option value="Female" style={{ background: '#2d2f6e' }}>Female</option>
                  <option value="Other" style={{ background: '#2d2f6e' }}>Other</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Cataract surgery before?</label>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px 12px' }}>
                {['No', 'Yes, right eye', 'Yes, left eye', 'Yes, both eyes'].map(v => radioRow(v, v, 'cataractSurgery', form.cataractSurgery))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>OOXii ID number</label>
              <input type="text" placeholder="82016" value={form.ooxiiId} onChange={e => update('ooxiiId', e.target.value)} style={inputStyle} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ color: '#fff', fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>Distance vision, both eyes open without glasses</div>

            <div style={{ background: 'rgba(29,158,117,0.1)', border: '0.5px solid rgba(29,158,117,0.25)', borderRadius: '12px', padding: '12px', color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>
              No glasses — ask the person to use both eyes open.
            </div>

            <div>
              <label style={labelStyle}>Smallest OOXii line number with all letters correct</label>
              <select value={form.distanceLine} onChange={e => update('distanceLine', e.target.value)} style={{ ...inputStyle, appearance: 'none' as const }}>
                <option value="" style={{ background: '#2d2f6e' }}>Select OOXii line number</option>
                {lineNumbers.map(n => (
                  <option key={n} value={n} style={{ background: '#2d2f6e' }}>Line {n}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Letters correct on next smaller line</label>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                {[0, 1, 2, 3, 4].map(n => (
                  <label key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      border: `2px solid ${form.distanceLetters === String(n) ? '#1d9e75' : 'rgba(255,255,255,0.3)'}`,
                      background: form.distanceLetters === String(n) ? '#1d9e75' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {form.distanceLetters === String(n) && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{n}</span>
                    <input type="radio" value={n} checked={form.distanceLetters === String(n)} onChange={() => update('distanceLetters', String(n))} style={{ display: 'none' }} />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Distance vision — Snellen (metres)</label>
              <input type="text" placeholder="Auto-calculated from line selection" value={form.distanceSnellen} onChange={e => update('distanceSnellen', e.target.value)} style={{ ...inputStyle, color: form.distanceSnellen ? '#fff' : 'rgba(255,255,255,0.3)' }} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ color: '#fff', fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>Near vision, both eyes open without glasses</div>

            <div style={{ background: 'rgba(29,158,117,0.1)', border: '0.5px solid rgba(29,158,117,0.25)', borderRadius: '12px', padding: '12px', color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>
              Ask the person to hold the near vision card at reading distance.
            </div>

            <div>
              <label style={labelStyle}>Smallest OOXii line number with all letters correct</label>
              <select value={form.nearLine} onChange={e => update('nearLine', e.target.value)} style={{ ...inputStyle, appearance: 'none' as const }}>
                <option value="" style={{ background: '#2d2f6e' }}>Select OOXii line number</option>
                {lineNumbers.map(n => (
                  <option key={n} value={n} style={{ background: '#2d2f6e' }}>Line {n}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Letters correct on next smaller line</label>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                {[0, 1, 2, 3, 4].map(n => (
                  <label key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      border: `2px solid ${form.nearLetters === String(n) ? '#1d9e75' : 'rgba(255,255,255,0.3)'}`,
                      background: form.nearLetters === String(n) ? '#1d9e75' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {form.nearLetters === String(n) && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{n}</span>
                    <input type="radio" value={n} checked={form.nearLetters === String(n)} onChange={() => update('nearLetters', String(n))} style={{ display: 'none' }} />
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Near vision — Snellen (metres)</label>
              <input type="text" placeholder="Auto-calculated from line selection" value={form.nearSnellen} onChange={e => update('nearSnellen', e.target.value)} style={{ ...inputStyle, color: form.nearSnellen ? '#fff' : 'rgba(255,255,255,0.3)' }} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ color: '#fff', fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>Distance glasses dispensed</div>

            <div>
              <label style={labelStyle}>Frame type</label>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px 12px' }}>
                {['Plastic', 'Metal'].map(v => radioRow(v, v, 'frameType', form.frameType))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Frame colour</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: 'Front', field: 'frameColourFront', placeholder: 'Enter front colour' },
                  { label: 'Right arm', field: 'frameColourRight', placeholder: 'Enter right arm colour' },
                  { label: 'Left arm', field: 'frameColourLeft', placeholder: 'Enter left arm colour' },
                ].map(f => (
                  <div key={f.field}>
                    <label style={{ ...labelStyle, fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{f.label}</label>
                    <input type="text" placeholder={f.placeholder} value={(form as any)[f.field]} onChange={e => update(f.field, e.target.value)} style={inputStyle} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Frame size</label>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px 12px' }}>
                {['Small', 'Medium', 'Large'].map(v => radioRow(v, v, 'frameSize', form.frameSize))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', background: '#252660', borderTop: '0.5px solid rgba(255,255,255,0.1)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 100 }}>
        <button
          onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : finish()}
          disabled={saving}
          style={{ width: '100%', background: '#1d9e75', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '500', padding: '14px', cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Saving...' : step < STEPS.length - 1 ? 'Next' : 'Complete session'}
        </button>
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', padding: '12px', cursor: 'pointer' }}
          >
            Back
          </button>
        )}
        {step === 0 && (
          <button
            onClick={() => router.push('/home')}
            style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: 'rgba(255,255,255,0.7)', fontSize: '14px', padding: '12px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        )}
      </div>
    </main>
  )
}