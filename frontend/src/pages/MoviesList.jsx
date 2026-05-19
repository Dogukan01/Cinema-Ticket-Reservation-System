import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function MoviesList() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

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
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ 
                textAlign: 'center', 
                marginBottom: '40px', 
                fontSize: '2.8rem', 
                textShadow: '0 2px 20px rgba(239, 68, 68, 0.3)',
                background: 'linear-gradient(to right, #fff, #f87171)',
                WebkitBackgroundClip: 'text',
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
                        Not: Eğer filmler yoksa, TMDB Cron Job'ı henüz çalışmamış olabilir veya veritabanında film bulunmuyor olabilir.
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
                        <div key={movie.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
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
                            <h2 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '10px', height: '3rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
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
                                marginBottom: '20px'
                            }}>
                                {movie.description || 'Açıklama belirtilmemiş.'}
                            </p>
                            
                            <Link to={`/movies/${movie.id}`} style={{ width: '100%', textDecoration: 'none' }}>
                                <button className="btn-primary" style={{ width: '100%' }}>
                                    Seansları Gör & Bilet Al
                                </button>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
