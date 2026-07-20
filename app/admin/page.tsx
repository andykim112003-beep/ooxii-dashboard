'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

type Region = {
  name: string
  count: number
  vals: number[]
}

const defaultRegions: Region[] = [
  { name: 'South-East Asia', count: 0, vals: [300, 700, 1500] },
  { name: 'Sub-Saharan Africa', count: 0, vals: [250, 600, 1200] },
  { name: 'Australia', count: 0, vals: [500, 1000, 2000] },
]

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [activeRegion, setActiveRegion] = useState(0)
  const [regions, setRegions] = useState<Region[]>(defaultRegions)
  const [testers, setTesters] = useState<any[]>([])
  const [totalTesters, setTotalTesters] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)
  const [avgPoints, setAvgPoints] = useState(0)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profile } = await supabase
        .from('users').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/'); return }

      const { data: allUsers } = await supabase
        .from('users').select('id, name').eq('role', 'tester')
      setTotalTesters(allUsers?.length || 0)

      const { data: allSessions } = await supabase
        .from('sessions').select('user_id, clients_tested')
      setTotalSessions(allSessions?.length || 0)

      const { data: ledger } = await supabase
        .from('points_ledger').select('user_id, amount')

      const pointsByUser: Record<string, number> = {}
      ledger?.forEach((r: any) => {
        pointsByUser[r.user_id] = (pointsByUser[r.user_id] || 0) + r.amount
      })

      const testerList = allUsers?.map((u: any) => ({
        ...u,
        points: pointsByUser[u.id] || 0
      })) || []

      testerList.sort((a: any, b: any) => b.points - a.points)
      setTesters(testerList)

      const avg = testerList.length > 0
        ? Math.round(testerList.reduce((s: number, t: any) => s + t.points, 0) / testerList.length)
        : 0
      setAvgPoints(avg)
      setLoading(false)
    }
    loadData()
  }, [])

  function updateVal(i: number, val: string) {
    const updated = [...regions]
    updated[activeRegion] = {
      ...updated[activeRegion],
      vals: updated[activeRegion].vals.map((v, idx) => idx === i ? parseInt(val) || 0 : v)
    }
    setRegions(updated)
  }

  function saveThresholds() {
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const regionShort = ['SE Asia', 'Africa', 'Australia']
  const rewards = ['Café voucher', 'Kit bag', 'Training access']
  const rewardIcons = ['☕', '🎒', '📜']

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#2d2f6e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Loading...</div>
    </main>
  )

  return (
    <main style={{ minHeight: '100vh', background: '#2d2f6e', fontFamily: 'sans-serif', maxWidth: '430px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: '#252660', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontSize: '17px', fontWeight: '500', letterSpacing: '1px' }}>ooxii</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: 'rgba(239,159,39,0.2)', color: '#ef9f27', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '500', border: '0.5px solid rgba(239,159,39,0.35)' }}>Admin</span>
          <span style={{ background: '#1d9e75', color: '#e1f5ee', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '500' }}>Online</span>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '18px' }}>⎋</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px', gap: '10px', overflow: 'hidden' }}>

        {activeTab === 0 && (
          <>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '500' }}>Admin dashboard</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '6px' }}>
              {[
                { label: 'Total testers', value: totalTesters, sub: 'all regions', accent: true },
                { label: 'Regions', value: 3, sub: 'active' },
                { label: 'Sessions', value: totalSessions, sub: 'recorded' },
                { label: 'Avg points', value: avgPoints, sub: 'per tester' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: s.accent ? 'rgba(29,158,117,0.12)' : 'rgba(255,255,255,0.08)',
                  border: `0.5px solid ${s.accent ? 'rgba(29,158,117,0.3)' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: '10px', padding: '9px 10px'
                }}>
                  <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>{s.label}</div>
                  <div style={{ color: s.accent ? '#5dcaa5' : '#fff', fontSize: '20px', fontWeight: '500' }}>{s.value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '9px', marginTop: '1px' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Points thresholds</div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {regionShort.map((r, i) => (
                <button key={i} onClick={() => setActiveRegion(i)} style={{
                  flex: 1, padding: '6px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: '500',
                  background: activeRegion === i ? 'rgba(239,159,39,0.18)' : 'rgba(255,255,255,0.06)',
                  color: activeRegion === i ? '#ef9f27' : 'rgba(255,255,255,0.45)',
                  outline: activeRegion === i ? '0.5px solid rgba(239,159,39,0.4)' : '0.5px solid rgba(255,255,255,0.12)'
                }}>{r}</button>
              ))}
            </div>

            <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.13)', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>📍 {regions[activeRegion].name}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{regions[activeRegion].count} testers</span>
              </div>
              {rewards.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < rewards.length - 1 ? '0.5px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px' }}>{rewardIcons[i]} {r}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="number"
                      value={regions[activeRegion].vals[i]}
                      onChange={e => updateVal(i, e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '7px', color: '#fff', fontSize: '11px', padding: '4px 6px', width: '58px', textAlign: 'right', outline: 'none' }}
                    />
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>pts</span>
                  </div>
                </div>
              ))}
              <button onClick={saveThresholds} style={{
                marginTop: '12px', background: saved ? '#0f6e56' : '#1d9e75', border: 'none', borderRadius: '8px',
                color: '#e1f5ee', fontSize: '12px', fontWeight: '500', padding: '9px', cursor: 'pointer'
              }}>
                {saved ? 'Saved ✓' : 'Save thresholds'}
              </button>
            </div>
          </>
        )}

        {activeTab === 1 && (
          <>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '500' }}>Testers</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>All testers — {totalTesters} total</div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '12px', overflow: 'auto' }}>
              {testers.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>No testers yet</div>
              ) : testers.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 12px', borderBottom: i < testers.length - 1 ? '0.5px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(29,158,117,0.18)', border: '0.5px solid rgba(29,158,117,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>👤</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: '11px', fontWeight: '500' }}>{t.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', marginTop: '1px' }}>Tester</div>
                  </div>
                  <div style={{ color: '#5dcaa5', fontSize: '11px', fontWeight: '500', flexShrink: 0 }}>{t.points.toLocaleString()} pts</div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 2 && (
          <>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '500' }}>Settings</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admin account</div>
            <div style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '12px', overflow: 'hidden' }}>
              {[
                { icon: '🛡', label: 'Admin role', sub: 'Full access', val: 'Active', color: '#ef9f27' },
                { icon: '📧', label: 'Notifications', sub: 'Weekly digest', val: 'Edit', color: 'rgba(255,255,255,0.4)' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '10px 12px', borderBottom: i === 0 ? '0.5px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239,159,39,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>{r.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: '11px', fontWeight: '500' }}>{r.label}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', marginTop: '1px' }}>{r.sub}</div>
                  </div>
                  <div style={{ color: r.color, fontSize: '11px' }}>{r.val}</div>
                </div>
              ))}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Danger zone</div>
            <div style={{ background: 'rgba(255,100,100,0.08)', border: '0.5px solid rgba(255,100,100,0.2)', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '10px' }}>Reset all points for a region</div>
              <button style={{ background: 'rgba(255,100,100,0.15)', border: '0.5px solid rgba(255,100,100,0.3)', borderRadius: '8px', color: '#f09595', fontSize: '11px', padding: '7px 14px', cursor: 'pointer' }}>Reset points</button>
            </div>
          </>
        )}

      </div>

      <div style={{ background: '#252660', borderTop: '0.5px solid rgba(255,255,255,0.1)', padding: '8px 0 6px', display: 'flex', justifyContent: 'space-around', flexShrink: 0 }}>
        {[
          { label: 'Overview', icon: '📊' },
          { label: 'Testers', icon: '👥' },
          { label: 'Settings', icon: '⚙️' },
        ].map((b, i) => (
          <button key={i} onClick={() => setActiveTab(i)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
            color: activeTab === i ? '#ef9f27' : 'rgba(255,255,255,0.35)',
            fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer'
          }}>
            <span style={{ fontSize: '18px' }}>{b.icon}</span>{b.label}
          </button>
        ))}
      </div>
    </main>
  )
}