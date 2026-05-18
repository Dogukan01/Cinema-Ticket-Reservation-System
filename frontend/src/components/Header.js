'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Header() {
    const router = useRouter();
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Tarayıcı ortamında token ve user bilgilerini oku
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/');
        router.refresh();
    };

    return (
        <nav className="navbar glass-panel">
            <a href="/" className="nav-brand">SBRS Cinema</a>
            <div>
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>Hoş geldin, {user.firstName}</span>
                        <button onClick={handleLogout} style={{
                            background: 'transparent',
                            border: '1px solid var(--accent-color)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}>
                            Çıkış Yap
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <a href="/login" style={{
                            padding: '8px 16px',
                            color: 'white',
                            textDecoration: 'none',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px'
                        }}>Giriş Yap</a>
                        <a href="/register" className="btn-primary" style={{ textDecoration: 'none' }}>Üye Ol</a>
                    </div>
                )}
            </div>
        </nav>
    );
}
