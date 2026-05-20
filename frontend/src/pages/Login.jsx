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
    const [showPassword, setShowPassword] = useState(false);

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
        <div style={{ maxWidth: '640px', margin: '60px auto', padding: '0 20px', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            
            {/* Custom CSS styles matching Register page */}
            <style>{`
                .sbrs-input {
                    background: #33373b !important;
                    border: 1px solid rgba(255, 255, 255, 0.05) !important;
                    border-radius: 8px !important;
                    color: #ffffff !important;
                    padding: 14px 18px !important;
                    font-size: 0.95rem !important;
                    width: 100% !important;
                    height: 50px !important;
                    box-sizing: border-box !important;
                    transition: all 0.2s ease !important;
                }
                .sbrs-input::placeholder {
                    color: #9ba0a5 !important;
                    opacity: 0.8 !important;
                }
                .sbrs-input:focus {
                    border-color: var(--accent-color) !important;
                    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
                    outline: none !important;
                }
                .sbrs-submit-btn:hover:not(:disabled) {
                    background-color: var(--accent-hover) !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 6px 20px var(--accent-glow) !important;
                }
                .sbrs-submit-btn:active:not(:disabled) {
                    transform: translateY(0) !important;
                }
                .sbrs-submit-btn:disabled {
                    opacity: 0.6 !important;
                    cursor: not-allowed !important;
                }
            `}</style>

            {/* Logo Section */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px solid var(--accent-color)',
                    padding: '5px 14px',
                    borderRadius: '30px',
                    fontWeight: '800',
                    fontSize: '1.25rem',
                    letterSpacing: '1px',
                    background: 'rgba(0, 0, 0, 0.2)'
                }}>
                    <span style={{ color: 'var(--accent-color)', marginRight: '8px' }}>🎬 SBRS</span>
                    <span style={{ color: '#ffffff' }}>CINEMA</span>
                </div>
            </div>

            {/* Heading */}
            <h1 style={{
                textAlign: 'center',
                color: '#ffffff',
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '35px',
                letterSpacing: '-0.5px'
            }}>SBRS Cinema Club'a Hoş Geldiniz</h1>

            {/* Navigation Tabs */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '40px',
                marginBottom: '30px',
                borderBottom: '2px solid rgba(255,255,255,0.08)'
            }}>
                <span style={{
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    paddingBottom: '12px',
                    borderBottom: '3px solid #ffffff',
                    cursor: 'default'
                }}>Giriş Yap</span>
                <Link to={`/register${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`} style={{
                    color: '#8e9499',
                    textDecoration: 'none',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    paddingBottom: '12px',
                    borderBottom: '3px solid transparent',
                    transition: 'all 0.2s ease'
                }}>Üye Ol</Link>
            </div>

            {/* Error Message */}
            {errorMsg && (
                <div style={{ 
                    background: 'rgba(239, 68, 68, 0.15)', 
                    border: '1px solid #ef4444', 
                    color: '#f87171', 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    marginBottom: '20px',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span>⚠️</span> {errorMsg}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* E-posta Adresi */}
                <div>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="E-posta Adresi *"
                        className="sbrs-input"
                    />
                </div>

                {/* Şifre */}
                <div style={{ position: 'relative' }}>
                    <input 
                        type={showPassword ? 'text' : 'password'} 
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Şifre *"
                        className="sbrs-input"
                        style={{ paddingRight: '45px' }}
                    />
                    <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                            position: 'absolute',
                            right: '15px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#9ba0a5',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 0
                        }}
                    >
                        {showPassword ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        )}
                    </button>
                </div>

                {/* Submit Button */}
                <button 
                    type="submit" 
                    disabled={loading}
                    className="sbrs-submit-btn"
                    style={{
                        width: '100%',
                        backgroundColor: 'var(--accent-color)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '16px',
                        borderRadius: '30px',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        marginTop: '10px',
                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                        transition: 'all 0.2s ease',
                        fontFamily: "'Outfit', sans-serif"
                    }}
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
    );
}
