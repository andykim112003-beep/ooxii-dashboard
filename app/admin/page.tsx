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
  { name: 'South-East Asia', count: 0, vals: [4, 8, 16] },
  { name: 'Sub-Saharan Africa', count: 0, vals: [3, 6, 12] },
  { name: 'Australia', count: 0, vals: [5, 10, 20] },
]

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(0)
  const [activeRegion, setActiveRegion] = useState(0)
  const [regions, setRegions] = useState<Region[]>(defaultRegions)
  const [testers, setTesters] = useState<any[]>([])
  const [totalTesters, setTotalTesters] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)
  const [avgStars, setAvgStars] = useState(0)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [rewards, setRewards] = useState<any[]>([])
  const [redemptionCounts, setRedemptionCounts] = useState<Record<number, number>>({})
  const [editingReward, setEditingReward] = useState<any | null>(null)
  const [rewardSaved, setRewardSaved] = useState(false)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profile } = await supabase
        .from('users').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/'); return }

      const { data: allUsers } = await supabase
        .from('users').select('id, name, region').eq('role', 'tester')
      setTotalTesters(allUsers?.length || 0)

      const { data: allSessions } = await supabase
        .from('sessions').select('user_id, clients_tested')
      setTotalSessions(allSessions?.length || 0)

      const { data: ledger } = await supabase
        .from('points_ledger').select('user_id, amount')

      const starsByUser: Record<string, number> = {}
      ledger?.forEach((r: any) => {
        starsByUser[r.user_id] = (starsByUser[r.user_id] || 0) + r.amount
      })

      const testerList = allUsers?.map((u: any) => ({
        ...u,
        stars: starsByUser[u.id] || 0
      })) || []
      testerList.sort((a: any, b: any) => b.stars - a.stars)
      setTesters(testerList)

      const avg = testerList.length > 0
        ? Math.round(testerList.reduce((s: number, t: any) => s + t.stars, 0) / testerList.length)
        : 0
      setAvgStars(avg)

      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .order('star_cost', { ascending: true })
      setRewards(rewardsData || [])

      const updated = defaultRegions.map(r => ({
        ...r,
        vals: [
          rewardsData?.find((rw: any) => rw.region === r.name && rw.name === 'Café voucher')?.star_cost || r.vals[0],
          rewardsData?.find((rw: any) => rw.region === r.name && rw.name === 'OOXii tester kit bag')?.star_cost || r.vals[1],
          rewardsData?.find((rw: any) => rw.region === r.name && rw.name === 'Training course access')?.star_cost || r.vals[2],
        ]
      }))
      setRegions(updated)

      const { data: ledgerData } = await supabase
        .from('points_ledger')
        .select('reason, amount')
        .lt('amount', 0)

      const counts: Record<string, number> = {}
      ledgerData?.forEach((r: any) => {
        if (r.reason?.startsWith('Redeemed: ')) {
          const name = r.reason.replace('Redeemed: ', '')
          counts[name] = (counts[name] || 0) + 1
        }
      })
      setRedemptionCounts(counts as any)

      setLoading(false)
    }
    loadData()
  }, [])

  async function saveThresholds() {
    const region = regions[activeRegion].name
    const rewardNames = ['Café voucher', 'OOXii tester kit bag', 'Training course access']

    for (let i = 0; i < rewardNames.length; i++) {
      await supabase
        .from('rewards')
        .update({ star_cost: regions[activeRegion].vals[i] })
        .eq('name', rewardNames[i])
        .eq('region', region)
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function saveReward() {
    if (!editingReward) return
    await supabase
      .from('rewards')
      .update({
        name: editingReward.name,
        star_cost: editingReward.star_cost,
        available: editingReward.available,
        icon: editingReward.icon,
      })
      .eq('id', editingReward.id)

    const { data: rewardsData } = await supabase
      .from('rewards')
      .select('*')
      .order('star_cost', { ascending: true })
    setRewards(rewardsData || [])
    setEditingReward(null)
    setRewardSaved(true)
    setTimeout(() => setRewardSaved(false), 1500)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function updateVal(i: number, val: string) {
    const updated = [...regions]
    updated[activeRegion] = {
      ...updated[activeRegion],
      vals: updated[activeRegion].vals.map((v, idx) => idx === i ? parseInt(val) || 0 : v)
    }
    setRegions(updated)
  }

  const regionShort = ['SE Asia', 'Africa', 'Australia']
  const rewardNames = ['Café voucher', 'Kit bag', 'Training access']
  const rewardIcons = ['☕', '🎒', '📜']

  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#2d2f6e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Loading...</div>
    </main>
  )

  return (
    <main style={{ minHeight: '100dvh', background: '#2d2f6e', fontFamily: 'sans-serif', maxWidth: '430px', margin: '0 auto' }}>
      <div style={{ background: '#252660', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fff', fontSize: '17px', fontWeight: '500', letterSpacing: '1px' }}>ooxii</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: 'rgba(239,159,39,0.2)', color: '#ef9f27', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '500', border: '0.5px solid rgba(239,159,39,0.35)' }}>Admin</span>
          <span style={{ background: '#1d9e75', color: '#e1f5ee', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '500' }}>Online</span>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '18px' }}>⎋</button>
        </div>
      </div>

      <div style={{ paddingBottom: '80px' }}>

        {activeTab === 0 && (
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '500' }}>Admin dashboard</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '6px' }}>
              {[
                { label: 'Total testers', value: totalTesters, sub: 'all regions', accent: true },
                { label: 'Regions', value: 3, sub: 'active' },
                { label: 'Sessions', value: totalSessions, sub: 'recorded' },
                { label: 'Avg stars', value: `${avgStars} ⭐`, sub: 'per tester' },
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

            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Star thresholds by region</div>

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

            <div style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.13)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>📍 {regions[activeRegion].name}</span>
              </div>
              {rewardNames.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < rewardNames.length - 1 ? '0.5px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px' }}>{rewardIcons[i]} {r}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="number"
                      value={regions[activeRegion].vals[i]}
                      onChange={e => updateVal(i, e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '7px', color: '#fff', fontSize: '11px', padding: '4px 6px', width: '48px', textAlign: 'right', outline: 'none' }}
                    />
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>⭐</span>
                  </div>
                </div>
              ))}
              <button onClick={saveThresholds} style={{
                marginTop: '12px', width: '100%', background: saved ? '#0f6e56' : '#1d9e75', border: 'none', borderRadius: '8px',
                color: '#e1f5ee', fontSize: '12px', fontWeight: '500', padding: '9px', cursor: 'pointer'
              }}>
                {saved ? 'Saved ✓' : 'Save thresholds'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '500' }}>Testers</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>All testers — {totalTesters} total</div>
            <div style={{ background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '12px', overflow: 'hidden' }}>
              {testers.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>No testers yet</div>
              ) : testers.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 12px', borderBottom: i < testers.length - 1 ? '0.5px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(29,158,117,0.18)', border: '0.5px solid rgba(29,158,117,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}>👤</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: '11px', fontWeight: '500' }}>{t.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', marginTop: '1px' }}>📍 {t.region || 'No region'}</div>
                  </div>
                  <div style={{ color: '#5dcaa5', fontSize: '11px', fontWeight: '500', flexShrink: 0 }}>{t.stars} ⭐</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: '500' }}>Rewards</div>
              {rewardSaved && <span style={{ color: '#5dcaa5', fontSize: '11px' }}>Saved ✓</span>}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>All rewards — tap to edit</div>

            {editingReward && (
              <div style={{ background: 'rgba(239,159,39,0.1)', border: '0.5px solid rgba(239,159,39,0.3)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ color: '#ef9f27', fontSize: '12px', fontWeight: '500' }}>Editing reward</div>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginBottom: '4px' }}>Name</div>
                  <input
                    value={editingReward.name}
                    onChange={e => setEditingReward({ ...editingReward, name: e.target.value })}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '12px', padding: '8px 10px', outline: 'none', boxSizing: 'border-box' as const }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginBottom: '4px' }}>Star cost</div>
                    <input
                      type="number"
                      value={editingReward.star_cost}
                      onChange={e => setEditingReward({ ...editingReward, star_cost: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '12px', padding: '8px 10px', outline: 'none', boxSizing: 'border-box' as const }}
                    />
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginBottom: '4px' }}>Icon</div>
                    <input
                      value={editingReward.icon || ''}
                      onChange={e => setEditingReward({ ...editingReward, icon: e.target.value })}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', fontSize: '12px', padding: '8px 10px', outline: 'none', boxSizing: 'border-box' as const }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    onClick={() => setEditingReward({ ...editingReward, available: !editingReward.available })}
                    style={{ width: '36px', height: '20px', borderRadius: '10px', background: editingReward.available ? '#1d9e75' : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}
                  >
                    <div style={{ position: 'absolute', top: '2px', left: editingReward.available ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px' }}>Available to testers</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={saveReward} style={{ flex: 1, background: '#1d9e75', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: '500', padding: '9px', cursor: 'pointer' }}>
                    Save reward
                  </button>
                  <button onClick={() => setEditingReward(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '12px', padding: '9px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {rewards.map((r, i) => {
                const redeemCount = (redemptionCounts as any)[r.name] || 0
                return (
                  <div key={i} onClick={() => setEditingReward(r)} style={{ background: 'rgba(255,255,255,0.07)', border: `0.5px solid ${r.available ? 'rgba(255,255,255,0.12)' : 'rgba(255,100,100,0.2)'}`, borderRadius: '12px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', opacity: r.available ? 1 : 0.6 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
                      {r.icon || '🎁'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#fff', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '10px' }}>{r.star_cost} ⭐</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>·</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>📍 {r.region}</span>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ color: redeemCount > 0 ? '#5dcaa5' : 'rgba(255,255,255,0.25)', fontSize: '14px', fontWeight: '500' }}>{redeemCount}</div>
                      <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px' }}>redeemed</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', marginBottom: '10px' }}>Reset all stars for a region</div>
              <button style={{ background: 'rgba(255,100,100,0.15)', border: '0.5px solid rgba(255,100,100,0.3)', borderRadius: '8px', color: '#f09595', fontSize: '11px', padding: '7px 14px', cursor: 'pointer' }}>Reset stars</button>
            </div>
          </div>
        )}

      </div>

      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', background: '#252660', borderTop: '0.5px solid rgba(255,255,255,0.1)', padding: '8px 0 6px', display: 'flex', justifyContent: 'space-around', zIndex: 100 }}>
        {[
          { label: 'Overview', icon: '📊', tab: 0 },
          { label: 'Testers', icon: '👥', tab: 1 },
          { label: 'Rewards', icon: '🎁', tab: 2 },
          { label: 'Settings', icon: '⚙️', tab: 3 },
        ].map((b, i) => (
          <button key={i} onClick={() => setActiveTab(b.tab)} style={{
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