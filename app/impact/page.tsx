'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function ImpactPage() {
  const router = useRouter()
  const [totalClients, setTotalClients] = useState(0)
  const [festivals, setFestivals] = useState(0)
  const [hoursVolunteered, setHoursVolunteered] = useState(0)
  const [region, setRegion] = useState('Australia')
  const [communityClients, setCommunityClients] = useState(0)
  const [communityTesters, setCommunityTesters] = useState(0)
  const [communityFestivals, setCommunityFestivals] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: sessions } = await supabase
        .from('sessions')
        .select('clients_tested, festival_name, created_at')
        .eq('user_id', user.id)

      const total = sessions?.reduce((sum: number, s: any) => sum + s.clients_tested, 0) || 0
      const uniqueFestivals = new Set(sessions?.map((s: any) => s.festival_name)).size
      const hours = Math.round((sessions?.length || 0) * 1.5)

      setTotalClients(total)
      setFestivals(uniqueFestivals)
      setHoursVolunteered(hours)

      const { data: userProfile } = await supabase
        .from('users')
        .select('region')
        .eq('id', user.id)
        .single()

      const userRegion = userProfile?.region || 'Australia'
      setRegion(userRegion)

      const { data: regionUsers } = await supabase
        .from('users')
        .select('id')
        .eq('region', userRegion)
        .eq('role', 'tester')

      setCommunityTesters(regionUsers?.length || 0)

      if (regionUsers && regionUsers.length > 0) {
        const regionUserIds = regionUsers.map((u: any) => u.id)

        const { data: communitySessions } = await supabase
          .from('sessions')
          .select('clients_tested, festival_name')
          .in('user_id', regionUserIds)

        const communityTotal = communitySessions?.reduce((sum: number, s: any) => sum + s.clients_tested, 0) || 0
        const communityUniqueFestivals = new Set(communitySessions?.map((s: any) => s.festival_name)).size

        setCommunityClients(communityTotal)
        setCommunityFestivals(communityUniqueFestivals)
      }

      setLoading(false)
    }
    loadData()
  }, [])

  const milestones = [
    { label: 'First 100 clients', target: 100, points: 1 },
    { label: '500 clients helped', target: 500, points: 3 },
    { label: '10 festivals attended', target: 10, points: 2, value: festivals },
    { label: '1,000 clients helped', target: 1000, points: 5 },
    { label: '50 festivals attended', target: 50, points: 4, value: festivals },
  ]

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#2d2f6e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Loading...</div>
    </main>
  )

  return (
    <main style={{ height: '100dvh', background: '#2d2f6e', fontFamily: 'sans-serif', maxWidth: '430px', margin: '0 auto', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ background: '#252660', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontSize: '17px', fontWeight: '500', letterSpacing: '1px' }}>ooxii</span>
        <span style={{ background: '#1d9e75', color: '#e1f5ee', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '500' }}>Online</span>
      </div>

      <div style={{ padding: '12px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '15px', fontWeight: '500' }}>Social impact</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>📍 {region}</span>
      </div>

      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '100px', flex: 1 }}>

        <div style={{ background: 'rgba(29,158,117,0.14)', border: '0.5px solid rgba(29,158,117,0.32)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '20px' }}>👤</span>
            <div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>Your impact</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '1px' }}>Lifetime contribution</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '4px' }}>
            <span style={{ color: '#5dcaa5', fontSize: '40px', fontWeight: '500', lineHeight: '1' }}>{totalClients}</span>
            <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>lives improved</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>Across {festivals} festivals and clinics</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>⏱</span>
          <div>
            <div style={{ color: '#fff', fontSize: '22px', fontWeight: '500' }}>{hoursVolunteered}h</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginTop: '2px' }}>Time volunteered</div>
          </div>
        </div>

        <div style={{ background: 'rgba(93,202,165,0.1)', border: '0.5px solid rgba(93,202,165,0.25)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px' }}>🌍</span>
            <div>
              <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{region} community</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '1px' }}>{communityTesters} testers in your region</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '8px' }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ color: '#5dcaa5', fontSize: '20px', fontWeight: '500' }}>{communityClients}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Lives improved</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ color: '#5dcaa5', fontSize: '20px', fontWeight: '500' }}>{communityFestivals}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Festivals</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 8px', textAlign: 'center' }}>
              <div style={{ color: '#5dcaa5', fontSize: '20px', fontWeight: '500' }}>{communityTesters}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Testers</div>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: '14px', padding: '14px' }}>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '12px' }}>Your milestones</div>
          {milestones.map((m, i) => {
            const current = m.value !== undefined ? m.value : totalClients
            const pct = Math.min((current / m.target) * 100, 100)
            const complete = current >= m.target
            return (
              <div key={i} style={{ marginBottom: i < milestones.length - 1 ? '12px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: complete ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {complete ? '✓' : '🔒'} {m.label}
                  </span>
                  <span style={{ color: complete ? '#5dcaa5' : 'rgba(255,255,255,0.25)', fontSize: '11px', fontWeight: '500' }}>+{m.points} ⭐</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '6px', height: '4px', overflow: 'hidden' }}>
                  <div style={{ background: '#1d9e75', height: '100%', width: `${pct}%`, borderRadius: '6px' }}></div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', marginTop: '3px', textAlign: 'right' }}>
                  {current} / {m.target}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', background: '#252660', borderTop: '0.5px solid rgba(255,255,255,0.1)', padding: '10px 0 6px', display: 'flex', justifyContent: 'space-around', zIndex: 100 }}>
        <button onClick={() => router.push('/home')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: 'rgba(255,255,255,0.35)', fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '19px' }}>🏠</span>Home
        </button>
        <button onClick={() => router.push('/impact')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: '#5dcaa5', fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '19px' }}>🌍</span>Impact
        </button>
        <button onClick={() => router.push('/rewards')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: 'rgba(255,255,255,0.35)', fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '19px' }}>🎁</span>Rewards
        </button>
      </div>
    </main>
  )
}