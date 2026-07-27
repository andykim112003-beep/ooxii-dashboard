'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type RewardRow = {
  id: number | string
  name: string
  description: string
  cost: number
  icon: string
  isNew?: boolean
}

let tempId = -1

export default function ManageRewardsPage() {
  const router = useRouter()
  const [rewards, setRewards] = useState<RewardRow[]>([])
  const [removedIds, setRemovedIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadRewards()
  }, [])

  async function loadRewards() {
    const { data } = await supabase.from('rewards').select('*').order('cost', { ascending: true })
    setRewards(data || [])
    setLoading(false)
  }
  function updateField(id: number | string, field: string, value: any) {
    setRewards((rows) => rows.map((r) => r.id === id ? { ...r, [field]: value } : r))
  }

  function addRow() {
    setRewards((rows) => [...rows, { id: tempId--, name: '', description: '', cost: 50, icon: '🎁', isNew: true }])
  }

  function removeRow(row: RewardRow) {
    if (!row.isNew) setRemovedIds((ids) => [...ids, row.id as number])
    setRewards((rows) => rows.filter((r) => r.id !== row.id))
  }

  async function handleSave() {
    setSaving(true)
    if (removedIds.length > 0) {
      await supabase.from('rewards').delete().in('id', removedIds)
    }
    for (const r of rewards) {
      if (!r.name.trim()) continue
      if (r.isNew) {
        await supabase.from('rewards').insert({ name: r.name, description: r.description, cost: r.cost, icon: r.icon })
      } else {
        await supabase.from('rewards').update({ name: r.name, description: r.description, cost: r.cost, icon: r.icon }).eq('id', r.id)
      }
    }
    setRemovedIds([])
    await loadRewards()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }
  if (loading) return (
    <main style={{ minHeight: '100dvh', background: '#2d2f6e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Loading...</div>
    </main>
  )

  return (
    <main style={{ minHeight: '100dvh', background: '#2d2f6e', fontFamily: 'sans-serif', maxWidth: '430px', margin: '0 auto' }}>
      <div style={{ background: '#252660', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: '18px' }}>←</button>
        <span style={{ color: '#fff', fontSize: '15px', fontWeight: '500' }}>Manage rewards</span>
        <span style={{ background: 'rgba(239,159,39,0.2)', color: '#ef9f27', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '500', border: '0.5px solid rgba(239,159,39,0.35)' }}>Admin</span>
      </div>

      <div style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: '1.4' }}>
        Edit the name, star cost and description testers see on the Rewards screen.
      </div>
      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '100px' }}>
        {rewards.map((r) => (
          <div key={r.id} style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: '12px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <input
                value={r.icon}
                onChange={(e) => updateField(r.id, 'icon', e.target.value)}
                style={{ width: '34px', background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '7px', color: '#fff', fontSize: '15px', padding: '5px', textAlign: 'center', outline: 'none' }}
              />
              <input
                value={r.name}
                onChange={(e) => updateField(r.id, 'name', e.target.value)}
                placeholder="Reward name"
                style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '7px', color: '#fff', fontSize: '13px', padding: '6px 8px', outline: 'none' }}
              />
              <input
                type="number"
                value={r.cost}
                onChange={(e) => updateField(r.id, 'cost', parseInt(e.target.value) || 0)}
                style={{ width: '58px', background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '7px', color: '#fff', fontSize: '13px', padding: '6px 8px', textAlign: 'right', outline: 'none' }}
              />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>⭐</span>
              <button onClick={() => removeRow(r)} style={{ background: 'none', border: 'none', color: 'rgba(255,100,100,0.7)', fontSize: '16px', cursor: 'pointer', padding: '0 2px' }}>✕</button>
            </div>
            <textarea
              value={r.description}
              onChange={(e) => updateField(r.id, 'description', e.target.value)}
              placeholder="Short description shown when a tester taps this reward"
              style={{ width: '100%', minHeight: '48px', background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: '7px', color: '#fff', fontSize: '12px', padding: '7px 8px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        ))}
        <button onClick={addRow} style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px dashed rgba(255,255,255,0.3)', borderRadius: '12px', color: 'rgba(255,255,255,0.6)', fontSize: '13px', padding: '12px', cursor: 'pointer' }}>
          + Add reward
        </button>

        <button onClick={handleSave} disabled={saving} style={{
          marginTop: '4px', width: '100%', background: saved ? '#0f6e56' : '#1d9e75', border: 'none', borderRadius: '8px',
          color: '#e1f5ee', fontSize: '13px', fontWeight: '500', padding: '11px', cursor: saving ? 'default' : 'pointer'
        }}>
          {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </main>
  )
}
