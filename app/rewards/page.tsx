'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

// Soft-coded default prize catalog. Not wired to an admin-managed table yet -
// swap this for a Supabase fetch (e.g. a rewards table) once prize
// management is built out. Shape is designed to map 1:1 to that future table.
// Tiers were intentionally removed (2nd design pass) - testers just spend
// stars on whichever reward they can afford, no tier gating/labels.
const defaultPrizes = [
  { id: 1, name: 'Airtime / mobile data top-up', cost: 50, icon: '📱' },
  { id: 2, name: 'Food / staple voucher', cost: 50, icon: '🛒' },
  { id: 3, name: 'OOXii notebook & pen kit', cost: 50, icon: '📓' },
  { id: 4, name: 'Solar phone charger / torch', cost: 100, icon: '☀️' },
  { id: 5, name: 'First aid / hygiene pack', cost: 120, icon: '🩹' },
  { id: 6, name: 'OOXii tester kit bag', cost: 130, icon: '🎒' },
  { id: 7, name: 'Local transport contribution', cost: 150, icon: '🚌' },
  { id: 8, name: 'Paid training / certification access', cost: 200, icon: '📜' },
  { id: 9, name: 'Community health conference attendance', cost: 230, icon: '🏥' },
  { id: 10, name: "Named contribution on OOXii's website", cost: 250, icon: '📰' },
  { id: 11, name: 'Certificate of recognition', cost: 300, icon: '🏅' },
  { id: 12, name: 'Priority access to new equipment', cost: 320, icon: '🔬' },
  { id: 13, name: 'Regional community health award nomination', cost: 350, icon: '🏆' },
  { id: 14, name: "Donation made in tester's name", cost: 400, icon: '❤️' },
]

export default function RewardsPage() {
  const router = useRouter()
  const [balance, setBalance] = useState(0)
  const [lifetime, setLifetime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(true)
  const [redeemingId, setRedeemingId] = useState<number | null>(null)
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

  const sortedPrizes = [...defaultPrizes].sort((a, b) => a.cost - b.cost)
  const nextPrize = sortedPrizes.find((p) => p.cost > balance)
  const progress = nextPrize ? Math.min((balance / nextPrize.cost) * 100, 100) : 100

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
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '20px',
            fontWeight: '500',
          }}>{online ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      <div style={{ padding: '12px 16px 8px', color: 'rgba(255,255,255,0.9)', fontSize: '15px', fontWeight: '500' }}>Rewards</div>

      {!online && (
        <div style={{ margin: '0 12px 8px', background: 'rgba(239,159,39,0.14)', border: '0.5px solid rgba(239,159,39,0.35)', borderRadius: '10px', padding: '8px 12px', color: '#ef9f27', fontSize: '11px' }}>
          You're offline - redemption unavailable until you're back online.
        </div>
      )}

      <div style={{ margin: '0 12px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Available stars</span>
          <span style={{ fontSize: '13px' }}>🎁</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '4px' }}>
          <span style={{ color: '#fff', fontSize: '34px', fontWeight: '500', lineHeight: '1' }}>{balance.toLocaleString()}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '20px' }}>⭐</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', marginBottom: '12px' }}>Earned {lifetime.toLocaleString()} ⭐ lifetime</div>
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '8px', height: '5px', marginBottom: '8px', overflow: 'hidden' }}>
          <div style={{ background: '#1d9e75', height: '100%', width: progress + '%', borderRadius: '8px' }} />
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
          {nextPrize
            ? `${(nextPrize.cost - balance).toLocaleString()} ⭐ until you can redeem "${nextPrize.name}"`
            : 'You have enough stars for any reward!'}
        </div>
      </div>

      <div style={{ padding: '18px 12px 8px', color: 'rgba(255,255,255,0.9)', fontSize: '13px', fontWeight: '500' }}>
        Available rewards
      </div>

      <div style={{ padding: '0 12px 90px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedPrizes.map((prize) => {
          const affordable = balance >= prize.cost
          const canRedeem = online && affordable
          const justRedeemed = redeemedIds.includes(prize.id)
          return (
            <div key={prize.id} style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 }}>
                {prize.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500', marginBottom: '2px' }}>{prize.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{prize.cost.toLocaleString()} ⭐</div>
              </div>
              <button
                onClick={() => handleRedeem(prize)}
                disabled={!canRedeem || redeemingId === prize.id}
                style={{
                  flexShrink: 0,
                  background: justRedeemed ? 'rgba(93,202,165,0.25)' : canRedeem ? '#1d9e75' : 'rgba(255,255,255,0.15)',
                  color: justRedeemed ? '#5dcaa5' : canRedeem ? '#e1f5ee' : 'rgba(255,255,255,0.4)',
                  fontSize: '11px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: canRedeem ? 'pointer' : 'not-allowed',
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
          <span style={{ fontSize: '19px' }}>🏠</span>Home
        </button>
        <button onClick={() => router.push('/impact')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: 'rgba(255,255,255,0.35)', fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '19px' }}>🌍</span>Impact
        </button>
        <button onClick={() => router.push('/rewards')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: '#5dcaa5', fontSize: '9px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '19px' }}>🎁</span>Rewards
        </button>
      </div>
    </main>
  )
}
