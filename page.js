'use client';
import { useState } from 'react';
import { signIn } from '../../lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#042f2e,#064e3b,#0e7c6b)',fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{background:'#fff',borderRadius:20,padding:'40px 36px',width:400,boxShadow:'0 32px 80px rgba(0,0,0,.3)'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:36,marginBottom:8}}>🏥</div>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:'#042f2e'}}>Atlant Clinic</div>
          <div style={{fontSize:13,color:'#64748b',marginTop:4}}>МедКарта · Вход в систему</div>
        </div>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
          <div>
            <label style={{display:'block',fontSize:11,fontWeight:700,color:'#64748b',marginBottom:5,letterSpacing:'.06em',textTransform:'uppercase'}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@atlant.kz" required
              style={{width:'100%',padding:'11px 14px',border:'1.5px solid #dde4ef',borderRadius:10,fontSize:15,outline:'none'}}/>
          </div>
          <div>
            <label style={{display:'block',fontSize:11,fontWeight:700,color:'#64748b',marginBottom:5,letterSpacing:'.06em',textTransform:'uppercase'}}>Пароль</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required
              style={{width:'100%',padding:'11px 14px',border:'1.5px solid #dde4ef',borderRadius:10,fontSize:15,outline:'none'}}/>
          </div>
          {error && <div style={{color:'#dc2626',fontSize:13,background:'#fef2f2',padding:'8px 12px',borderRadius:8}}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{width:'100%',padding:'13px',background:'#0e7c6b',color:'#fff',border:'none',borderRadius:10,fontSize:16,fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:loading?.6:1}}>
            {loading ? '⏳ Вход...' : '🔐 Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
