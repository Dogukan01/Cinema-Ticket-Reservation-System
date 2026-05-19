import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function MoviesList() {
    const navigate = useNavigate();
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [selectedMovie, setSelectedMovie] = useState(null);

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
                <p style={{ color: 'var(--text-secondary)' }}>Vizyondaki filmler yükleniyor...</p>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
            <h1 style={{ 
                textAlign: 'center', 
                marginBottom: '40px', 
                fontSize: '2.8rem', 
                textShadow: '0 2px 20px rgba(239, 68, 68, 0.3)',
                background: 'linear-gradient(to right, #fff, #f87171)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                Vizyondaki Filmler
            </h1>

            {errorMsg && (
                <div style={{ background: 'rgba(127, 29, 29, 0.4)', border: '1px solid #ef4444', color: 'white', padding: '15px', borderRadius: '10px', textAlign: 'center', marginBottom: '30px' }}>
                    {errorMsg}
                </div>
            )}
            
            {movies.length === 0 && !errorMsg ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Şu an vizyonda film bulunmuyor veya Backend sunucusuna bağlanılamadı.</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Not: TMDB Cron Job'ı henüz çalışmamış veya veritabanı kurulmamış olabilir.
                    </p>
                </div>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', 
                    gap: '24px',
                    paddingBottom: '40px'
                }}>
                    {movies.map((movie) => (
                        <div 
                            key={movie.id} 
                            className="glass-card" 
                            onClick={() => handleCardClick(movie)}
                            style={{ 
                                padding: '16px', 
                                display: 'flex', 
                                flexDirection: 'column',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 12px 30px rgba(239, 68, 68, 0.15)';
                                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.borderColor = 'var(--glass-border)';
                            }}
                        >
                            <div 
                                style={{ 
                                    width: '100%', 
                                    height: '320px', 
                                    backgroundImage: `url(${movie.poster_url || '/placeholder-poster.jpg'})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    borderRadius: '12px', 
                                    marginBottom: '15px',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)'
                                }}
                            />
                            <h2 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '8px', height: '2.8rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontWeight: '800' }}>
                                {movie.title}
                            </h2>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>

                                    ⏳ {movie.duration_minutes} Dk
                                </span>
                                <span style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '600' }}>
                                    📅 {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                                </span>
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
                            
                            <button className="btn-primary" style={{ width: '100%', marginTop: 'auto' }}>
                                Detayları Gör
                            </button>
                        </div>
                    ))}
                </div>
            )}



            {/* CSS Keyframes */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.92); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
