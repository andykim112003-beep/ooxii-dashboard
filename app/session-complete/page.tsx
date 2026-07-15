'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function SessionComplete() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const clientsTested = 1
  const pointsEarned = 10
  const hasRun = useRef(false)


async function completeSession() {
    setSaving(true)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth user:', user, 'Auth error:', authError)
    
    if (!user) { router.push('/'); return }

    const insertData = { 
      user_id: user.id, 
      clients_tested: clientsTested, 
      points_earned: pointsEarned, 
      festival_name: 'Test Festival' 
    }
    console.log('Inserting:', insertData)

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert(insertData)
      .select('id')
      .single()

    console.log('Session result:', session, 'Error:', JSON.stringify(sessionError))

    if (sessionError || !session) {
      setSaving(false)
      return
    }

    const { error: ledgerError } = await supabase.from('points_ledger').insert({
      user_id: user.id,
      session_id: session.id,
      amount: pointsEarned,
      reason: 'Session completed'
    })

    console.log('Ledger error:', ledgerError)

    setSaving(false)
    setDone(true)
  }

useEffect(() => {
  if (hasRun.current) return
  hasRun.current = true
  completeSession()
}, [])

  return (
    <main style={{ minHeight: '100vh', background: '#2d2f6e', fontFamily: 'sans-serif', maxWidth: '430px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#252660', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fff', fontSize: '17px', fontWeight: '500', letterSpacing: '1px' }}>ooxii</span>
        <span style={{ background: '#1d9e75', color: '#e1f5ee', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '500' }}>Online</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(29,158,117,0.2)', border: '2px solid #1d9e75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', marginBottom: '24px' }}>
          ✓
        </div>

        <div style={{ color: '#fff', fontSize: '22px', fontWeight: '500', textAlign: 'center', marginBottom: '8px' }}>Session complete</div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', textAlign: 'center', marginBottom: '32px' }}>Great work — your progress has been saved</div>

        <div style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '20px', marginBottom: '12px', textAlign: 'center' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>Points earned</div>
          <div style={{ color: '#5dcaa5', fontSize: '42px', fontWeight: '500', lineHeight: '1' }}>+{pointsEarned}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '4px' }}>pts</div>
        </div>

        <div style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '16px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>Clients tested</span>
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>{clientsTested}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>Festival</span>
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>Test Festival</span>
          </div>
        </div>

        <button
          onClick={() => { router.push('/home'); router.refresh() }}
          style={{ width: '100%', background: '#1d9e75', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '500', padding: '15px', cursor: 'pointer' }}
        >
          Back to home
        </button>
      </div>
    </main>
  )
}