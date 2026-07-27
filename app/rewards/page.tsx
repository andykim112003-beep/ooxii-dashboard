'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function RewardsPage() {
  const router = useRouter()
  const [balance, setBalance] = useState(0)
  const [lifetime, setLifetime] = useState(0)
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(true)
  const [redeemingId, setRedeemingId] = useState<number | null>(null)
  const [redeemedIds, setRedeemedIds] = useState<number[]>([])
  const [prizes, setPrizes] = useState<any[]>([])
  const [region, setRegion] = useState('Australia')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOnline(navigator.onLine)
      function goOnline() { setOnline(true) }
      function goOffline() { setOnline(false) }
      window.addEventListener('online', goOnline)
      window.addEventListener('offline', goOffline)
      return () => {
        window.removeEventListener('online', goOnline)
        window.removeEventListener('offline', goOffline)
      }
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: ledger } = await supabase
        .from('points_ledger').select('amount').eq('user_id', user.id)
      const total = ledger?.reduce((sum: number, r: any) => sum + r.amount, 0) || 0
      const earned = ledger?.reduce((sum: number, r: any) => r.amount > 0 ? sum + r.amount : sum, 0) || 0

      setBalance(total)
      setLifetime(earned)

      const { data: userProfile } = await supabase
        .from('users')
        .select('region')
        .eq('id', user.id)
        .single()

      const userRegion = userProfile?.region || 'Australia'
      setRegion(userRegion)

      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .eq('region', userRegion)
        .eq('available', true)
        .order('star_cost', { ascending: true })

      setPrizes(rewardsData || [])
      setLoading(false)
    }
    loadData()
  }, [])

  async function handleRedeem(prize: any) {
    if (!online || balance < prize.star_cost || redeemingId !== null) return
    setRedeemingId(prize.id)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setRedeemingId(null); return }

    const { error } = await supabase
      .from('points_ledger')
      .insert({
        user_id: user.id,
        amount: -prize.star_cost,
        reason: `Redeemed: ${prize.name}`
      })

    if (!error) {
      setBalance((b) => b - prize.star_cost)
      setRedeemedIds((ids) => [...ids, prize.id])
    }
    setRedeemingId(null)
  }

  const sortedPrizes = [...prizes].sort((a, b) => a.star_cost - b.star_cost)
  const nextPrize = sortedPrizes.find((p) => p.star_cost > balance)
  const progress = nextPrize ? Math.min((balance / nextPrize.star_cost) * 100, 100) : 100

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
          <span style={{ background: online ? '#1d9e75' : 'rgba(255,255,255,0.15)', color: online ? '#e1f5ee' : 'rgba(255,255,255,0.6)', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '500' }}>
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div style={{ padding: '12px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '15px', fontWeight: '500' }}>Rewards</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>📍 {region}</span>
      </div>

      {!online && (
        <div style={{ margin: '0 12px 8px', background: 'rgba(239,159,39,0.14)', border: '0.5px solid rgba(239,159,39,0.35)', borderRadius: '10px', padding: '8px 12px', color: '#ef9f27', fontSize: '11px' }}>
          You're offline — redemption unavailable until you're back online.
        </div>
      )}

      <div style={{ margin: '0 12px 12px', background: 'rgba(255,255,255,0.08)', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: '14px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Available stars</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '4px' }}>
          <span style={{ color: '#fff', fontSize: '34px', fontWeight: '500', lineHeight: '1' }}>{balance.toLocaleString()}</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '20px' }}>⭐</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', marginBottom: '12px' }}>
          Earned {lifetime.toLocaleString()} ⭐ lifetime
        </div>
        <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '8px', height: '5px', marginBottom: '8px', overflow: 'hidden' }}>
          <div style={{ background: '#1d9e75', height: '100%', width: `${progress}%`, borderRadius: '8px' }} />
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
          {nextPrize
            ? `${(nextPrize.star_cost - balance).toLocaleString()} ⭐ until "${nextPrize.name}"`
            : 'You can redeem any reward!'}
        </div>
      </div>

      <div style={{ padding: '0 12px 6px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        Available rewards — {region}
      </div>

      <div style={{ padding: '0 12px 90px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sortedPrizes.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px', padding: '32px 0' }}>
            No rewards available for your region yet.
          </div>
        ) : sortedPrizes.map((prize) => {
          const affordable = balance >= prize.star_cost
          const canRedeem = online && affordable
          const justRedeemed = redeemedIds.includes(prize.id)
          return (
            <div key={prize.id} style={{ background: 'rgba(255,255,255,0.08)', border: `0.5px solid ${affordable ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '14px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', opacity: affordable ? 1 : 0.6 }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 }}>
                {prize.icon || '🎁'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#fff', fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>{prize.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{prize.star_cost} ⭐</div>
              </div>
              <button
                onClick={() => handleRedeem(prize)}
                disabled={!canRedeem || redeemingId === prize.id}
                style={{
                  flexShrink: 0,
                  background: justRedeemed ? 'rgba(93,202,165,0.25)' : canRedeem ? '#1d9e75' : 'rgba(255,255,255,0.08)',
                  color: justRedeemed ? '#5dcaa5' : canRedeem ? '#e1f5ee' : 'rgba(255,255,255,0.3)',
                  fontSize: '11px',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: canRedeem ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap'
                }}
              >
                {justRedeemed ? 'Redeemed ✓' : redeemingId === prize.id ? '...' : 'Redeem'}
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