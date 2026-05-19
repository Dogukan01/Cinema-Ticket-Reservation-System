import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
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
            
            // Login successful
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            if (returnUrl) {
                navigate(returnUrl); 
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error('Login error:', err);
            setErrorMsg(err.response?.data?.error || 'Giriş yapılamadı. E-posta veya şifreniz hatalı.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '420px', margin: '60px auto', padding: '0 20px' }}>
            <div className="glass-panel" style={{ padding: '40px' }}>
                <h1 style={{ textAlign: 'center', color: 'var(--accent-color)', marginBottom: '30px', fontSize: '2rem' }}>Giriş Yap</h1>
                
                {/* Fixed error feedback rendering bug */}
                {errorMsg && (
                    <div style={{ 
                        background: 'rgba(127, 29, 29, 0.4)', 
                        border: '1px solid #ef4444', 
                        color: 'white', 
                        padding: '12px 15px', 
                        borderRadius: '10px', 
                        marginBottom: '20px',
                        fontSize: '0.9rem' 
                    }}>
                        ⚠️ {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>E-posta Adresi</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="ornek@domain.com"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Şifre</label>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ marginTop: '10px', padding: '15px', fontSize: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </button>
                    
                    <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.95rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Hesabınız yok mu? </span>
                        <Link to={`/register${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`} style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: '600' }}>
                            Hemen Üye Ol
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
