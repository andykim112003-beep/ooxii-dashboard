'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [points, setPoints] = useState(0)
  const [monthlyClients, setMonthlyClients] = useState(0)
  const [totalClients, setTotalClients] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profile } = await supabase
        .from('users').select('name').eq('id', user.id).single()

      const { data: ledger } = await supabase
        .from('points_ledger').select('amount').eq('user_id', user.id)
      const total = ledger?.reduce((sum: number, r: any) => sum + r.amount, 0) || 0

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const { data: monthlySessions } = await supabase
        .from('sessions')
        .select('clients_tested')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth)
      const monthly = monthlySessions?.reduce((sum: number, s: any) => sum + s.clients_tested, 0) || 0

      const { data: allSessions } = await supabase
        .from('sessions').select('clients_tested').eq('user_id', user.id)
      const total_clients = allSessions?.reduce((sum: number, s: any) => sum + s.clients_tested, 0) || 0

      setUser(profile)
      setPoints(total)
      setMonthlyClients(monthly)
      setTotalClients(total_clients)
      setLoading(false)
    }
    loadData()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const nextReward = 2000
  const progress = Math.min((points / nextReward) * 100, 100)

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#2d2f6e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Loading...</div>
    </main>
  )

  return (
    <main style={{ minHeight: '100dvh', background: '#2d2f6e', fontFamily: 'sans-serif', maxWidth: '430px', margin: '0 auto' }}>
      <div style={{ background: '#252660', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fff', fontSize: '17px', fontWeight: '500', letterSpacing: '1px' }}>ooxii</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ background: '#1d9e75', color: '#e1f5ee', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '500' }}>Online</span>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: '20px' }}>⎋</button>
        </div>
      </div>

      <div style={{ padding: '16px 16px 8px', color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '500' }}>
        Welcome, {user?.name || 'Tester'}
      </div>

      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '14px' }}>
          <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: '500', margin: '0 0 3px' }}>New client</h3>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', margin: '0 0 10px', lineHeight: '1.4' }}>Conduct a test for a new client and set up their profile</p>
          <button
            onClick={() => router.push('/session-complete')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.22)', borderRadius: '20px', color: '#fff', fontSize: '11px', padding: '5px 12px', cursor: 'pointer' }}
          >
            → Start new test
          </button>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '14px' }}>
          <h3 style={{ color: '#fff', fontSize: '14px', fontWeight: '500', margin: '0 0 3px' }}>Search client info</h3>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', margin: '0 0 10px', lineHeight: '1.4' }}>Browse clients, manage prescriptions and continue tests</p>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.22)', borderRadius: '20px', color: '#fff', fontSize: '11px', padding: '5px 12px', cursor: 'pointer' }}>
            🔍 Search client
          </button>
        </div>
      </div>

      <div style={{ padding: '14px 16px 6px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Your stars</div>

      <div style={{ margin: '0 12px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total balance</span>
          <button style={{ background: '#1d9e75', color: '#e1f5ee', fontSize: '11px', padding: '4px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer' }}>Redeem</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '8px' }}>
          <span style={{ color: '#fff', fontSize: '34px', fontWeight: '500', lineHeight: '1' }}>{points.toLocaleString()}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '20px' }}>⭐</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '8px', height: '5px', marginBottom: '5px', overflow: 'hidden' }}>
          <div style={{ background: '#1d9e75', height: '100%', width: `${progress}%`, borderRadius: '8px' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>
          <span>{(nextReward - points).toLocaleString()} pts to next reward</span>
          <span>{nextReward.toLocaleString()} pts</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '7px', margin: '8px 12px 0', paddingBottom: '80px' }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px' }}>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>This month</div>
          <div style={{ color: '#fff', fontSize: '20px', fontWeight: '500' }}>{monthlyClients}</div>
          <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '10px', marginTop: '1px' }}>clients tested</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '10px' }}>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>Total</div>
          <div style={{ color: '#fff', fontSize: '20px', fontWeight: '500' }}>{totalClients}</div>
          <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '10px', marginTop: '1px' }}>clients helped</div>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', background: '#252660', borderTop: '0.5px solid rgba(255,255,255,0.1)', padding: '10px 0 6px', display: 'flex', justifyContent: 'space-around', zIndex: 100 }}>
        <button onClick={() => router.push('/home')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: '#5dcaa5', fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '19px' }}>🏠</span>Home
        </button>
        <button onClick={() => router.push('/impact')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: 'rgba(255,255,255,0.35)', fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '19px' }}>🌍</span>Impact
        </button>
        <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: 'rgba(255,255,255,0.35)', fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '19px' }}>🎁</span>Rewards
        </button>
      </div>
    </main>
  )
}