import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function MoviesList() {
    const navigate = useNavigate();
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [activeTab, setActiveTab] = useState('vizyon'); // 'vizyon' veya 'yakinda'

    useEffect(() => {
        const cached = sessionStorage.getItem('movies_list_cache');
        if (cached) {
            setMovies(JSON.parse(cached));
            setLoading(false);
        }

        const fetchMovies = async () => {
            try {
                const res = await api.get('/catalog/movies');
                setMovies(res.data);
                sessionStorage.setItem('movies_list_cache', JSON.stringify(res.data));
            } catch (err) {
                console.error('API Error:', err);
                if (!cached) {
                    setErrorMsg('Filmler yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchMovies();
    }, []);

    useEffect(() => {
        if (!loading && movies.length > 0) {
            const savedScroll = sessionStorage.getItem('movies_list_scroll_pos');
            if (savedScroll) {
                setTimeout(() => {
                    window.scrollTo(0, parseInt(savedScroll, 10));
                    sessionStorage.removeItem('movies_list_scroll_pos');
                }, 100);
            }
        }
    }, [loading, movies]);

    const handleCardClick = (movie) => {
        sessionStorage.setItem('movies_list_scroll_pos', window.scrollY);
        navigate(`/movies/${movie.id}`);
    };

    const formatDateTR = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '20px' }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid rgba(255, 255, 255, 0.1)',
                    borderTop: '4px solid var(--accent-color)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ color: 'var(--text-secondary)' }}>Filmler yükleniyor...</p>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const vizyonMovies = movies.filter(m => !m.release_date || new Date(m.release_date) <= today);
    const yakindaMovies = movies.filter(m => m.release_date && new Date(m.release_date) > today);

    const displayedMovies = activeTab === 'vizyon' ? vizyonMovies : yakindaMovies;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
            <h1 style={{ 
                textAlign: 'center', 
                marginBottom: '20px', 
                fontSize: '2.8rem', 
                textShadow: '0 2px 20px rgba(239, 68, 68, 0.3)',
                background: 'linear-gradient(to right, #fff, #f87171)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                Film Kataloğu
            </h1>

            {/* Vizyondakiler / Yakında Sekmeleri */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '40px',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '6px',
                borderRadius: '30px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                width: 'fit-content',
                margin: '0 auto 40px auto',
                backdropFilter: 'blur(10px)'
            }}>
                <button 
                    onClick={() => setActiveTab('vizyon')}
                    style={{
                        padding: '10px 24px',
                        borderRadius: '25px',
                        border: 'none',
                        background: activeTab === 'vizyon' ? 'linear-gradient(135deg, var(--accent-color), #ef4444)' : 'transparent',
                        color: activeTab === 'vizyon' ? '#000' : 'var(--text-secondary)',
                        fontSize: '1rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: activeTab === 'vizyon' ? '0 4px 15px rgba(239, 68, 68, 0.3)' : 'none'
                    }}
                >
                    Vizyondakiler ({vizyonMovies.length})
                </button>
                <button 
                    onClick={() => setActiveTab('yakinda')}
                    style={{
                        padding: '10px 24px',
                        borderRadius: '25px',
                        border: 'none',
                        background: activeTab === 'yakinda' ? 'linear-gradient(135deg, var(--accent-color), #ef4444)' : 'transparent',
                        color: activeTab === 'yakinda' ? '#000' : 'var(--text-secondary)',
                        fontSize: '1rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: activeTab === 'yakinda' ? '0 4px 15px rgba(239, 68, 68, 0.3)' : 'none'
                    }}
                >
                    Yakında ({yakindaMovies.length})
                </button>
            </div>

            {errorMsg && (
                <div style={{ background: 'rgba(127, 29, 29, 0.4)', border: '1px solid #ef4444', color: 'white', padding: '15px', borderRadius: '10px', textAlign: 'center', marginBottom: '30px' }}>
                    {errorMsg}
                </div>
            )}
            
            {displayedMovies.length === 0 && !errorMsg ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Şu an bu kategoride film bulunmuyor.</p>
                </div>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
                    gap: '24px',
                    paddingBottom: '40px'
                }}>
                    {displayedMovies.map((movie) => (
                        <div 
                            key={movie.id} 
                            className="glass-card" 
                            onClick={() => handleCardClick(movie)}
                            style={{ 
                                padding: '16px', 
                                display: 'flex', 
                                flexDirection: 'column',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '16px'
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = 'translateY(-6px)';
                                e.currentTarget.style.boxShadow = '0 12px 30px rgba(239, 68, 68, 0.2)';
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            }}
                        >
                            <div 
                                style={{ 
                                    width: '100%', 
                                    height: '340px', 
                                    backgroundImage: `url(${movie.poster_url || '/placeholder-poster.jpg'})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    borderRadius: '12px', 
                                    marginBottom: '15px',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)'
                                }}
                            />
                            <h2 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '8px', height: '2.8rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontWeight: '800' }}>
                                {movie.title}
                            </h2>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    ⏳ {movie.duration_minutes} Dk
                                </span>
                                {activeTab === 'vizyon' ? (
                                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '700' }}>
                                        ★ Vizyonda
                                    </span>
                                ) : (
                                    <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: '700' }}>
                                        📅 {formatDateTR(movie.release_date)}
                                    </span>
                                )}
                            </div>
                            
                            <p style={{ 
                                fontSize: '0.9rem', 
                                flexGrow: 1, 
                                display: '-webkit-box', 
                                WebkitLineClamp: 3, 
                                WebkitBoxOrient: 'vertical', 
                                overflow: 'hidden',
                                marginBottom: '20px',
                                color: 'var(--text-secondary)',
                                lineHeight: '1.5'
                            }}>
                                {movie.description || 'Açıklama belirtilmemiş.'}
                            </p>
                            
                            <button className="btn-primary" style={{ width: '100%', marginTop: 'auto', background: activeTab === 'yakinda' ? 'rgba(56, 189, 248, 0.1)' : 'var(--accent-color)', borderColor: activeTab === 'yakinda' ? '#38bdf8' : 'var(--accent-color)', color: activeTab === 'yakinda' ? '#38bdf8' : '#000' }}>
                                {activeTab === 'vizyon' ? 'Detayları Gör & Bilet Al' : 'İncele & Yakında'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
