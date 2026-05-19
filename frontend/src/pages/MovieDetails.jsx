import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import ShowtimeList from '../components/ShowtimeList';

export default function MovieDetails() {
    const { id } = useParams();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchMovieDetails = async () => {
            try {
                const res = await api.get(`/catalog/movies/${id}`);
                setMovie(res.data);
            } catch (err) {
                console.error('API Error:', err);
                setErrorMsg('Film detayları yüklenirken bir sorun oluştu.');
            } finally {
                setLoading(false);
            }
        };
        fetchMovieDetails();
    }, [id]);

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
                <p style={{ color: 'var(--text-secondary)' }}>Film detayları yükleniyor...</p>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="glass-panel" style={{ maxWidth: '600px', margin: '50px auto', padding: '40px', textAlign: 'center' }}>
                <h1 style={{ color: 'var(--accent-color)', marginBottom: '20px' }}>Film Bulunamadı</h1>
                <p style={{ marginBottom: '30px' }}>Aradığınız film sistemde bulunmuyor veya kaldırılmış olabilir.</p>
                <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>
                    Ana Sayfaya Dön
                </Link>
            </div>
        );
    }

    // Seansları sinemalara göre gruplayalım
    const showtimesByCinema = {};
    if (movie.showtimes && Array.isArray(movie.showtimes)) {
        movie.showtimes.forEach(st => {
            if (!showtimesByCinema[st.cinema_name]) {
                showtimesByCinema[st.cinema_name] = [];
            }
            showtimesByCinema[st.cinema_name].push(st);
        });
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
            <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '30px', fontWeight: '600', transition: 'color 0.2s ease' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--accent-color)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                &larr; Vizyondaki Filmler
            </Link>

            {errorMsg && (
                <div style={{ background: 'rgba(127, 29, 29, 0.4)', border: '1px solid #ef4444', color: 'white', padding: '15px', borderRadius: '10px', textAlign: 'center', marginBottom: '30px' }}>
                    {errorMsg}
                </div>
            )}

            <div style={{ display: 'flex', gap: '50px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {/* Sol Taraf: Afiş ve Detaylar */}
                <div style={{ flex: '1 1 350px' }}>
                    <img 
                        src={movie.poster_url || '/placeholder-poster.jpg'} 
                        alt={movie.title} 
                        style={{ 
                            width: '100%', 
                            borderRadius: '16px', 
                            boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                        }} 
                    />
                    <h1 style={{ 
                        marginTop: '25px', 
                        fontSize: '2.5rem', 
                        lineHeight: '1.2',
                        textShadow: '0 2px 15px rgba(239, 68, 68, 0.2)' 
                    }}>
                        {movie.title}
                    </h1>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '15px', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        <span>⏳ {movie.duration_minutes} Dakika</span>
                        <span>📅 {movie.release_date ? new Date(movie.release_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</span>
                    </div>
                    <p style={{ fontSize: '1.05rem', lineHeight: '1.8' }}>{movie.description || 'Açıklama bulunmuyor.'}</p>
                </div>

                {/* Sağ Taraf: Seanslar */}
                <div style={{ flex: '2 1 500px' }} className="glass-panel">
                    <div style={{ padding: '35px' }}>
                        <h2 style={{ 
                            marginBottom: '25px', 
                            borderBottom: '1px solid var(--glass-border)', 
                            paddingBottom: '12px',
                            fontSize: '1.6rem',
                            fontWeight: '800'
                        }}>
                            Seans Seçimi
                        </h2>
                        <ShowtimeList showtimesByCinema={showtimesByCinema} />
                    </div>
                </div>
            </div>
        </div>
    );
}
