'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

// Soft-coded default prize catalog. Not wired to an admin-managed table yet -
// swap this for a Supabase fetch (e.g. a rewards table) once prize
// management is built out. Shape is designed to map 1:1 to that future table.
const defaultPrizes = [
  { id: 1, tier: 1, name: 'Airtime / mobile data top-up', cost: 50, icon: '📱' },
  { id: 2, tier: 1, name: 'Food / staple voucher', cost: 50, icon: '🛒' },
  { id: 3, tier: 1, name: 'OOXii notebook & pen kit', cost: 50, icon: '📓' },
  { id: 4, tier: 2, name: 'Solar phone charger / torch', cost: 100, icon: '☀️' },
  { id: 5, tier: 2, name: 'First aid / hygiene pack', cost: 120, icon: '🩹' },
  { id: 6, tier: 2, name: 'OOXii tester kit bag', cost: 130, icon: '🎒' },
  { id: 7, tier: 2, name: 'Local transport contribution', cost: 150, icon: '🚌' },
  { id: 8, tier: 3, name: 'Paid training / certification access', cost: 200, icon: '📜' },
  { id: 9, tier: 3, name: 'Community health conference attendance', cost: 230, icon: '🏥' },
  { id: 10, tier: 3, name: "Named contribution on OOXii's website", cost: 250, icon: '📰' },
  { id: 11, tier: 4, name: 'Certificate of recognition', cost: 300, icon: '🏅' },
  { id: 12, tier: 4, name: 'Priority access to new equipment', cost: 320, icon: '🔬' },
  { id: 13, tier: 4, name: 'Regional community health award nomination', cost: 350, icon: '🏆' },
  { id: 14, tier: 4, name: "Donation made in tester's name", cost: 400, icon: '❤️' },
]

const tiers = [
  { tier: 1, label: 'Tier 1', min: 50 },
  { tier: 2, label: 'Tier 2', min: 100 },
  { tier: 3, label: 'Tier 3', min: 200 },
  { tier: 4, label: 'Tier 4', min: 300 },
]

const tierBadgeColors: Record<number, string> = {
  1: '#8b7cf6',
  2: '#1d9e75',
  3: '#d4a72c',
  4: '#e0698a',
}

export default function RewardsPage() {
  const router = useRouter()
  const [balance, setBalance] = useState(0)
  const [lifetime, setLifetime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(true)
  const [activeFilter, setActiveFilter] = useState(0)
  const [redeemingId, setRedeemingId] = useState(null)
  const [redeemedIds, setRedeemedIds] = useState<number[]>([])

  useEffect(() => {
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    function goOnline() { setOnline(true) }
    function goOffline() { setOnline(false) }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: ledger } = await supabase
        .from('points_ledger').select('amount').eq('user_id', user.id)
      const total = ledger?.reduce((sum, r) => sum + r.amount, 0) || 0
      const earned = ledger?.reduce((sum, r) => r.amount > 0 ? sum + r.amount : sum, 0) || 0

      setBalance(total)
      setLifetime(earned)
      setLoading(false)
    }
    loadData()
  }, [])

  async function handleRedeem(prize: any) {
    if (!online || balance < prize.cost || redeemingId !== null) return
    setRedeemingId(prize.id)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setRedeemingId(null); return }

    const { error } = await supabase
      .from('points_ledger')
      .insert({ user_id: user.id, amount: -prize.cost })

    if (!error) {
      setBalance((b) => b - prize.cost)
      setRedeemedIds((ids) => [...ids, prize.id])
    }
    setRedeemingId(null)
  }

  const nextTier = tiers.find((t) => t.min > balance)
  const prevMin = tiers.filter((t) => t.min <= balance).slice(-1)[0]?.min || 0
  const progress = nextTier
    ? Math.min(((balance - prevMin) / (nextTier.min - prevMin)) * 100, 100)
    : 100

  const visiblePrizes = activeFilter === 0
    ? defaultPrizes
    : defaultPrizes.filter((p) => p.tier === activeFilter)

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
          <span style={{
            background: online ? '#1d9e75' : 'rgba(255,255,255,0.15)',
            color: online ? '#e1f5ee' : 'rgba(255,255,255,0.6)',
            fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '500'
          }}>{online ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      <div style={{ padding: '12px 16px 8px', color: 'rgba(255,255,255,0.9)', fontSize: '15px', fontWeight: '500' }}>
        Rewards
      </div>

      {!online && (
        <div style={{ margin: '0 12px 8px', background: 'rgba(239,159,39,0.14)', border: '0.5px solid rgba(239,159,39,0.35)', borderRadius: '10px', padding: '8px 12px', color: '#ef9f27', fontSize: '11px' }}>
          You're offline - redemption unavailable until you're back online.
        </div>
      )}

      <div style={{ margin: '0 12px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Available stars</span>
          <span style={{ fontSize: '13px' }}>{'🎁'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '4px' }}>
          <span style={{ color: '#fff', fontSize: '34px', fontWeight: '500', lineHeight: '1' }}>{balance.toLocaleString()}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '20px' }}>{'⭐'}</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', marginBottom: '12px' }}>
          Earned {lifetime.toLocaleString()} {'⭐'} lifetime
        </div>
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '8px', height: '5px', marginBottom: '8px', overflow: 'hidden' }}>
          <div style={{ background: '#1d9e75', height: '100%', width: (progress + '%'), borderRadius: '8px' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {tiers.map((t) => (
            <div key={t.tier} style={{ textAlign: 'center' }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%', margin: '0 auto 3px',
                background: balance >= t.min ? '#5dcaa5' : 'rgba(255,255,255,0.25)'
              }}></div>
              <div style={{ color: balance >= t.min ? '#5dcaa5' : 'rgba(255,255,255,0.4)', fontSize: '9px', textTransform: 'uppercase' }}>{t.label}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '9px' }}>{t.min}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '14px 12px 4px' }}>
        {['All', ...tiers.map((t) => t.label)].map((label, i) => (
          <button
            key={label}
            onClick={() => setActiveFilter(i)}
            style={{
              flexShrink: 0,
              background: activeFilter === i ? '#1d9e75' : 'rgba(255,255,255,0.08)',
              border: activeFilter === i ? 'none' : '0.5px solid rgba(255,255,255,0.18)',
              color: activeFilter === i ? '#fff' : 'rgba(255,255,255,0.6)',
              fontSize: '11px', padding: '5px 14px', borderRadius: '20px', cursor: 'pointer'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: '8px 12px 90px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {visiblePrizes.map((prize) => {
          const affordable = balance >= prize.cost
          const canRedeem = online && affordable
          const justRedeemed = redeemedIds.includes(prize.id)
          return (
            <div key={prize.id} style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 }}>
                {prize.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{prize.name}</span>
                  <span style={{ background: 'rgba(255,255,255,0.12)', color: tierBadgeColors[prize.tier], fontSize: '9px', padding: '1px 7px', borderRadius: '20px', fontWeight: '500' }}>
                    T{prize.tier}
                  </span>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{prize.cost.toLocaleString()} {'⭐'}</div>
              </div>
              <button
                onClick={() => handleRedeem(prize)}
                disabled={!canRedeem || redeemingId === prize.id}
                style={{
                  flexShrink: 0,
                  background: justRedeemed ? 'rgba(93,202,165,0.25)' : canRedeem ? '#1d9e75' : 'rgba(255,255,255,0.15)',
                  color: justRedeemed ? '#5dcaa5' : canRedeem ? '#e1f5ee' : 'rgba(255,255,255,0.4)',
                  fontSize: '11px', padding: '4px 12px', borderRadius: '20px', border: 'none',
                  cursor: canRedeem ? 'pointer' : 'not-allowed'
                }}
              >
                {justRedeemed ? 'Redeemed' : redeemingId === prize.id ? '...' : 'Redeem'}
              </button>
            </div>
          )
        })}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', background: '#252660', borderTop: '0.5px solid rgba(255,255,255,0.1)', padding: '10px 0 6px', display: 'flex', justifyContent: 'space-around', zIndex: 100 }}>
        <button onClick={() => router.push('/home')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: 'rgba(255,255,255,0.35)', fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '19px' }}>{'🏠'}</span>Home
        </button>
        <button onClick={() => router.push('/impact')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: 'rgba(255,255,255,0.35)', fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '19px' }}>{'🌍'}</span>Impact
        </button>
        <button onClick={() => router.push('/rewards')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: '#5dcaa5', fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '19px' }}>{'🎁'}</span>Rewards
        </button>
      </div>
    </main>
  )
}
