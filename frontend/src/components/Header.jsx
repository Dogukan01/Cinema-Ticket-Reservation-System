import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);

    // Read user from localStorage on mount and when location changes
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Error parsing stored user:', e);
            }
        } else {
            setUser(null);
        }
    }, [location]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/');
    };

    return (
        <nav className="navbar">
            <Link to="/" className="nav-brand">
                <span>🎬 SBRS Cinema</span>
            </Link>
            <div>
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>Hoş geldin, {user.first_name || user.firstName}</span>
                        <Link to="/profile" style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid var(--glass-border)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: '600'
                        }}>
                            Profilim
                        </Link>
                        <button onClick={handleLogout} style={{
                            background: 'transparent',
                            border: '1px solid var(--accent-color)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontWeight: '600'
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.background = 'var(--accent-color)';
                            e.currentTarget.style.boxShadow = '0 0 10px var(--accent-glow)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                        >
                            Çıkış Yap
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <Link to="/login" style={{
                            padding: '8px 16px',
                            color: 'white',
                            textDecoration: 'none',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            fontWeight: '600',
                            transition: 'background 0.2s ease'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                            Giriş Yap
                        </Link>
                        <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 16px' }}>
                            Üye Ol
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
