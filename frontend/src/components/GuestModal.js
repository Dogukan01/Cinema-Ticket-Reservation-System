import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

export default function GuestModal({ isOpen, onClose, showtimeId }) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen) return null;
    if (!mounted) return null;

    const handleLogin = () => {
        router.push(`/login?returnUrl=/showtimes/${showtimeId}/tickets`);
    };

    const handleGuest = () => {
        onClose();
        router.push(`/showtimes/${showtimeId}/tickets`);
    };

    return createPortal(
        <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div className="glass-panel" style={{
                padding: '40px',
                width: '400px',
                textAlign: 'center',
                position: 'relative'
            }}>
                <button 
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '15px', right: '15px',
                        background: 'transparent', border: 'none',
                        color: 'white', fontSize: '1.5rem', cursor: 'pointer'
                    }}
                >
                    &times;
                </button>
                <h2 style={{ marginBottom: '20px', color: 'var(--accent-color)' }}>Fırsatları Kaçırma!</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', lineHeight: '1.5' }}>
                    SBRS üyelerine özel indirimlerden ve kampanyalardan yararlanmak için giriş yapabilir veya misafir olarak hızlıca bilet alabilirsiniz.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <button onClick={handleLogin} className="btn-primary">
                        Üye Ol / Giriş Yap
                    </button>
                    <button onClick={handleGuest} style={{
                        padding: '12px 24px',
                        background: 'transparent',
                        border: '1px solid var(--glass-border)',
                        color: 'white',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                        Misafir Olarak Devam Et
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
