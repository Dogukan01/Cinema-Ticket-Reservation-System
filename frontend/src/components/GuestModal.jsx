import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function GuestModal({ isOpen, onClose, showtimeId }) {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleLogin = () => {
        navigate(`/login?returnUrl=/showtimes/${showtimeId}/tickets`);
        onClose();
    };

    const handleGuest = () => {
        navigate(`/showtimes/${showtimeId}/tickets`);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)'
        }}>
            <div className="glass-panel" style={{
                padding: '40px',
                width: '450px',
                textAlign: 'center',
                position: 'relative',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
            }}>
                <button 
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '15px', right: '20px',
                        background: 'transparent', border: 'none',
                        color: 'var(--text-secondary)', fontSize: '1.8rem', cursor: 'pointer',
                        transition: 'color 0.2s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.color = '#fff'}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                    &times;
                </button>
                
                <h2 style={{ marginBottom: '15px', color: 'var(--accent-color)', fontSize: '1.8rem' }}>Fırsatları Kaçırma!</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', lineHeight: '1.6', fontSize: '0.95rem' }}>
                    SBRS üyelerine özel indirimlerden ve kampanyalardan yararlanmak için giriş yapabilir veya misafir olarak hızlıca seans seçiminize devam edebilirsiniz.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <button onClick={handleLogin} className="btn-primary" style={{ padding: '14px' }}>
                        Üye Ol / Giriş Yap
                    </button>
                    <button onClick={handleGuest} style={{
                        padding: '14px',
                        background: 'transparent',
                        border: '1px solid var(--glass-border)',
                        color: 'white',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '1rem',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'var(--glass-border)';
                    }}
                    >
                        Misafir Olarak Devam Et
                    </button>
                </div>
            </div>
        </div>
    );
}
