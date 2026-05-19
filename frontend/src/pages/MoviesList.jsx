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
        const fetchMovies = async () => {
            try {
                const res = await api.get('/catalog/movies');
                setMovies(res.data);
            } catch (err) {
                console.error('API Error:', err);
                setErrorMsg('Filmler yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
            } finally {
                setLoading(false);
            }
        };
        fetchMovies();
    }, []);

    const handleCardClick = (movie) => {
        setSelectedMovie(movie);
    };

    const handleCloseModal = () => {
        setSelectedMovie(null);
    };

    const handleBuyTicket = (movieId) => {
        setSelectedMovie(null);
        navigate(`/movies/${movieId}`);
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
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '35px',
                    paddingBottom: '40px'
                }}>
                    {movies.map((movie) => (
                        <div 
                            key={movie.id} 
                            className="glass-card" 
                            onClick={() => handleCardClick(movie)}
                            style={{ 
                                padding: '20px', 
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
                                    height: '380px', 
                                    backgroundImage: `url(${movie.poster_url || '/placeholder-poster.jpg'})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    borderRadius: '12px', 
                                    marginBottom: '20px',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)'
                                }}
                            />
                            <h2 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '10px', height: '3.2rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontWeight: '800' }}>
                                {movie.title}
                            </h2>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                                Detayları Gör & Bilet Al
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Premium Details Modal */}
            {selectedMovie && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    padding: '20px',
                    animation: 'fadeIn 0.25s ease'
                }} onClick={handleCloseModal}>
                    <div style={{
                        background: 'rgba(18, 18, 18, 0.75)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '24px',
                        padding: '40px',
                        maxWidth: '850px',
                        width: '100%',
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.1)',
                        position: 'relative',
                        display: 'flex',
                        gap: '35px',
                        flexWrap: 'wrap',
                        animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }} onClick={e => e.stopPropagation()}>
                        
                        {/* Close button */}
                        <button 
                            onClick={handleCloseModal}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                color: 'white',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--accent-color)'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                        >
                            ✕
                        </button>

                        {/* Left: Poster */}
                        <div style={{ flex: '1 1 250px', maxWidth: '280px' }}>
                            <img 
                                src={selectedMovie.poster_url || '/placeholder-poster.jpg'} 
                                alt={selectedMovie.title} 
                                style={{
                                    width: '100%',
                                    borderRadius: '16px',
                                    boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                                    border: '1px solid rgba(255,255,255,0.08)'
                                }}
                            />
                        </div>

                        {/* Right: Info */}
                        <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <h2 style={{ fontSize: '2.2rem', color: 'white', marginBottom: '15px', fontWeight: '800', lineHeight: 1.2 }}>
                                    {selectedMovie.title}
                                </h2>
                                
                                <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', fontSize: '0.95rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>⏳ Süre: <strong style={{ color: '#fff' }}>{selectedMovie.duration_minutes} Dakika</strong></span>
                                    <span style={{ color: 'var(--text-secondary)' }}>📅 Vizyon: <strong style={{ color: '#fff' }}>{selectedMovie.release_date ? new Date(selectedMovie.release_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</strong></span>
                                </div>

                                <h4 style={{ color: 'var(--accent-color)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', fontWeight: 'bold' }}>Özet</h4>
                                <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'rgba(255, 255, 255, 0.85)', marginBottom: '30px', maxHeight: '220px', overflowY: 'auto', paddingRight: '10px' }}>
                                    {selectedMovie.description || 'Bu film için detaylı açıklama bulunmuyor.'}
                                </p>
                            </div>

                            <button 
                                className="btn-primary" 
                                onClick={() => handleBuyTicket(selectedMovie.id)}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    fontSize: '1.15rem',
                                    fontWeight: 'bold',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)'
                                }}
                            >
                                🎟️ Hızlı Bilet Al & Seans Seç
                            </button>
                        </div>
                    </div>
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
