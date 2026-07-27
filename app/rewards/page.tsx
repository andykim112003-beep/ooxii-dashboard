'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

type Reward = {
  id: number
  name: string
  description: string
  cost: number
  icon: string
}

// Fallback catalog used only if the `rewards` table hasn't been created yet
// or is empty (see supabase/rewards_table.sql). Once that table exists this
// data comes from the database instead, and admins can edit it from
// /admin/rewards.
const fallbackRewards: Reward[] = [
  { id: 1, name: 'Airtime / mobile data top-up', description: 'Top up your mobile phone with airtime or data at any local provider.', cost: 50, icon: '📱' },
  { id: 2, name: 'Food / staple voucher', description: 'A voucher for staple foods, redeemable at partnered local stores.', cost: 50, icon: '🛒' },
  { id: 3, name: 'OOXii notebook & pen kit', description: 'A branded notebook and pen set for recording your fieldwork.', cost: 50, icon: '📓' },
  { id: 4, name: 'Solar phone charger / torch', description: 'A solar-powered charger and torch, handy where power is unreliable.', cost: 100, icon: '☀️' },
  { id: 5, name: 'First aid / hygiene pack', description: 'A basic first aid and hygiene kit for outreach visits.', cost: 120, icon: '🩹' },
  { id: 6, name: 'OOXii tester kit bag', description: 'A durable bag to carry your testing equipment and supplies.', cost: 130, icon: '🎒' },
  { id: 7, name: 'Local transport contribution', description: 'Money towards buses, fuel or other transport to reach testing sites.', cost: 150, icon: '🚌' },
  { id: 8, name: 'Paid training / certification access', description: 'Access to a paid training course or certification in eye care.', cost: 200, icon: '📜' },
  { id: 9, name: 'Community health conference attendance', description: 'A funded place at a community health conference.', cost: 230, icon: '🏥' },
  { id: 10, name: "Named contribution on OOXii's website", description: 'Your name featured as a contributor on the OOXii website.', cost: 250, icon: '📰' },
  { id: 11, name: 'Certificate of recognition', description: 'An official certificate recognising your work as a tester.', cost: 300, icon: '🏅' },
  { id: 12, name: 'Priority access to new equipment', description: 'First access to new testing equipment as it becomes available.', cost: 320, icon: '🔬' },
  { id: 13, name: 'Regional community health award nomination', description: 'Nomination for a regional award recognising community health work.', cost: 350, icon: '🏆' },
  { id: 14, name: "Donation made in tester's name", description: 'A charitable donation made in your name to a health-related cause.', cost: 400, icon: '❤️' },
]

const PAGE_SIZE = 5
export default function RewardsPage() {
  const router = useRouter()
  const [balance, setBalance] = useState(0)
  const [lifetime, setLifetime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(true)
  const [rewards, setRewards] = useState<Reward[]>(fallbackRewards)
  const [redeemingId, setRedeemingId] = useState<number | null>(null)
  const [redeemedIds, setRedeemedIds] = useState<number[]>([])
  const [page, setPage] = useState(0)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    function goOnline() { setOnline(true) }
    function goOffline() { setOnline(false) }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: ledger } = await supabase
        .from('points_ledger').select('amount').eq('user_id', user.id)
      const total = ledger?.reduce((sum, r) => sum + r.amount, 0) || 0
      const earned = ledger?.reduce((sum, r) => r.amount > 0 ? sum + r.amount : sum, 0) || 0

      const { data: rewardRows } = await supabase
        .from('rewards')
        .select('*')
        .eq('active', true)
        .order('cost', { ascending: true })

      setBalance(total)
      setLifetime(earned)
      if (rewardRows && rewardRows.length > 0) setRewards(rewardRows)
      setLoading(false)
    }
    loadData()

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])
  async function handleRedeem(prize: Reward) {
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

  const sortedRewards = [...rewards].sort((a, b) => a.cost - b.cost)
  const nextReward = sortedRewards.find((p) => p.cost > balance)
  const progress = nextReward ? Math.min((balance / nextReward.cost) * 100, 100) : 100

  const totalPages = Math.max(1, Math.ceil(sortedRewards.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pagedRewards = sortedRewards.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  function goToPage(next: number) {
    const clamped = Math.max(0, Math.min(totalPages - 1, next))
    setPage(clamped)
    setExpandedId(null)
  }

  function handleTouchStart(e: any) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: any) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (delta < -40) goToPage(safePage + 1)
    else if (delta > 40) goToPage(safePage - 1)
  }
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

      <div style={{ padding: '12px 16px 8px', color: 'rgba(255,255,255,0.9)', fontSize: '17px', fontWeight: '500' }}>Rewards</div>

      {!online && (
        <div style={{ margin: '0 12px 8px', background: 'rgba(239,159,39,0.14)', border: '0.5px solid rgba(239,159,39,0.35)', borderRadius: '10px', color: '#ef9f27', fontSize: '12px', padding: '8px 10px' }}>
          You're offline - redemption is unavailable until you're back online.
        </div>
      )}
      <div style={{ margin: '0 12px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Available stars</span>
          <span style={{ fontSize: '14px' }}>🎁</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '4px' }}>
          <span style={{ color: '#fff', fontSize: '40px', fontWeight: '600', lineHeight: '1' }}>{balance.toLocaleString()}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '22px' }}>⭐</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', marginBottom: '12px' }}>{lifetime.toLocaleString()} ⭐ earned in total</div>
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '8px', height: '6px', marginBottom: '8px', overflow: 'hidden' }}>
          <div style={{ background: '#1d9e75', height: '100%', width: progress + '%', borderRadius: '8px' }} />
        </div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px' }}>
          {nextReward
            ? `${(nextReward.cost - balance).toLocaleString()} more ⭐ for "${nextReward.name}"`
            : "You've got enough stars for any reward!"}
        </div>
      </div>
      <div style={{ padding: '18px 12px 8px', color: 'rgba(255,255,255,0.9)', fontSize: '15px', fontWeight: '500' }}>
        Available rewards
      </div>

      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: '8px' }}
      >
        {pagedRewards.map((prize) => {
          const affordable = balance >= prize.cost
          const canRedeem = affordable && online && redeemingId === null
          const justRedeemed = redeemedIds.includes(prize.id)
          const expanded = expandedId === prize.id
          return (
            <div
              key={prize.id}
              onClick={() => setExpandedId(expanded ? null : prize.id)}
              style={{ background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '14px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {prize.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontSize: '15px', fontWeight: '500', marginBottom: '2px' }}>{prize.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{prize.cost.toLocaleString()} ⭐</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRedeem(prize) }}
                  disabled={!canRedeem || redeemingId === prize.id}
                  style={{
                    flexShrink: 0,
                    background: justRedeemed ? 'rgba(93,202,165,0.25)' : canRedeem ? '#1d9e75' : 'rgba(255,255,255,0.15)',
                    color: justRedeemed ? '#5dcaa5' : canRedeem ? '#e1f5ee' : 'rgba(255,255,255,0.4)',
                    fontSize: '12px',
                    padding: '5px 13px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: canRedeem ? 'pointer' : 'not-allowed',
                  }}
                >
                  {justRedeemed ? 'Redeemed' : redeemingId === prize.id ? '...' : 'Redeem'}
                </button>
              </div>
              <div
                style={{
                  maxHeight: expanded ? '160px' : '0px',
                  opacity: expanded ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.25s ease, opacity 0.2s ease',
                }}
              >
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', lineHeight: '1.5', marginTop: '10px', paddingTop: '10px', borderTop: '0.5px solid rgba(255,255,255,0.12)' }}>
                  {prize.description || 'No description yet.'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '6px 12px 4px' }}>
        <button
          onClick={() => goToPage(safePage - 1)}
          disabled={safePage === 0}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: safePage === 0 ? 'rgba(255,255,255,0.25)' : '#fff', fontSize: '15px', cursor: safePage === 0 ? 'default' : 'pointer' }}
        >‹</button>
        <div style={{ display: 'flex', gap: '6px' }}>
          {Array.from({ length: totalPages }).map((_, i) => (
            <span key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: i === safePage ? '#5dcaa5' : 'rgba(255,255,255,0.25)' }} />
          ))}
        </div>
        <button
          onClick={() => goToPage(safePage + 1)}
          disabled={safePage === totalPages - 1}
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: safePage === totalPages - 1 ? 'rgba(255,255,255,0.25)' : '#fff', fontSize: '15px', cursor: safePage === totalPages - 1 ? 'default' : 'pointer' }}
        >›</button>
      </div>
      <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '11px', paddingBottom: '90px' }}>
        swipe or tap the arrows for more · tap a reward for details
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', background: '#252660', borderTop: '0.5px solid rgba(255,255,255,0.1)', padding: '10px 0 6px', display: 'flex', justifyContent: 'space-around', zIndex: 100 }}>
        <button onClick={() => router.push('/home')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: 'rgba(255,255,255,0.35)', fontSize: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '21px' }}>🏠</span>Home
        </button>
        <button onClick={() => router.push('/impact')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: 'rgba(255,255,255,0.35)', fontSize: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '21px' }}>🌍</span>Impact
        </button>
        <button onClick={() => router.push('/rewards')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: '#5dcaa5', fontSize: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '21px' }}>🎁</span>Rewards
        </button>
      </div>
    </main>
  )
}
