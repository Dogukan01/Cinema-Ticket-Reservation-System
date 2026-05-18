'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/utils/api';

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnUrl = searchParams.get('returnUrl');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const res = await api.post('/auth/login', { email, password });
            
            // Başarılı giriş
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            if (returnUrl) {
                // Eğer bir sayfadan yönlendirildiyse, oraya dön
                window.location.href = returnUrl; 
            } else {
                // Yoksa ana sayfaya git (ve header'ı güncellemek için href kullanıyoruz)
                window.location.href = '/';
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>E-posta Adresi</label>
                <input 
                    type="email" 
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                />
            </div>
            <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Parola</label>
                <input 
                    type="password" 
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                />
            </div>

            <button 
                type="submit" 
                className="btn-primary" 
                style={{ marginTop: '10px', padding: '15px' }}
                disabled={loading}
            >
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Hesabınız yok mu? </span>
                <a href="/register" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>Hemen Üye Ol</a>
            </div>
        </form>
    );
}

export default function Login() {
    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '40px' }} className="glass-panel">
            <h1 style={{ textAlign: 'center', color: 'var(--accent-color)', marginBottom: '30px' }}>Giriş Yap</h1>
            
            {/* Suspense is required when using useSearchParams in Next.js 13+ */}
            <Suspense fallback={<div style={{ textAlign: 'center' }}>Yükleniyor...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
