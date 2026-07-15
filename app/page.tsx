'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/home')
    }
  }

  return (
    <main style={{
      minHeight: '100vh', background: '#2d2f6e', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', fontFamily: 'sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ color: '#fff', fontSize: '32px', fontWeight: '400', letterSpacing: '3px' }}>ooxii</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '4px' }}>glasses on eyes</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', marginTop: '2px' }}>for all the world to see</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Your email</label>
            <input type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.22)', borderRadius: '12px', color: '#fff', fontSize: '14px', padding: '13px 16px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.22)', borderRadius: '12px', color: '#fff', fontSize: '14px', padding: '13px 16px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {error && <div style={{ color: '#f09595', fontSize: '12px', textAlign: 'center' }}>{error}</div>}
          <button onClick={handleLogin} disabled={loading}
            style={{ width: '100%', background: 'rgba(255,255,255,0.15)', border: '0.5px solid rgba(255,255,255,0.25)', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '500', padding: '15px', cursor: 'pointer', marginTop: '6px' }}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
            Not registered yet? <span style={{ color: '#5dcaa5', textDecoration: 'underline', cursor: 'pointer' }}>Create an account</span>
          </div>
        </div>
      </div>
    </main>
  )
}
