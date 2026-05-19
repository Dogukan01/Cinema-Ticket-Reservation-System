import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function MovieDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchMovieDetails = async () => {
            try {
                const res = await api.get(`/catalog/movies/${id}`);
                setMovie(res.data);
            } catch (err) {
                console.error('API Error details:', err);
                setErrorMsg('Film detayları yüklenirken bir hata oluştu.');
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
            </div>
        );
    }

    if (!movie) {
        return (
            <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
                <div className="glass-panel" style={{ padding: '40px' }}>
                    <h2 style={{ color: 'var(--accent-color)', marginBottom: '20px' }}>Hata</h2>
                    <p style={{ color: 'white', marginBottom: '30px' }}>{errorMsg || 'Film bulunamadı.'}</p>
                    <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>Ana Sayfaya Dön</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
            <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '25px', fontWeight: '600', transition: 'color 0.2s ease' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--accent-color)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                &larr; Vizyondaki Filmler
            </Link>

            <div className="glass-panel" style={{ display: 'flex', gap: '40px', padding: '40px', borderRadius: '16px', flexWrap: 'wrap' }}>
                {/* Sol Sütun: Poster */}
                <div style={{ flex: '1 1 300px', maxWidth: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img 
                        src={movie.poster_url || '/placeholder-poster.jpg'} 
                        alt={movie.title}
                        style={{ 
                            width: '100%', 
                            borderRadius: '12px', 
                            border: '3px solid rgba(255,255,255,0.05)', 
                            boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
                            marginBottom: '20px'
                        }}
                    />
                </div>

                {/* Sağ Sütun: Detaylar */}
                <div style={{ flex: '2 1 450px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                    <h1 style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: '800', 
                        color: '#fff', 
                        marginBottom: '15px',
                        lineHeight: '1.2'
                    }}>
                        {movie.title}
                    </h1>

                    {/* Metadata Etiketleri */}
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '25px' }}>
                        <span style={{ 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            border: '1px solid rgba(239, 68, 68, 0.3)', 
                            color: 'var(--accent-color)',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                        }}>
                            ⏳ {movie.duration_minutes} Dakika
                        </span>
                        <span style={{ 
                            background: 'rgba(255, 255, 255, 0.05)', 
                            border: '1px solid rgba(255, 255, 255, 0.1)', 
                            color: 'var(--text-secondary)',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                        }}>
                            📅 Vizyon: {movie.release_date ? new Date(movie.release_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                        </span>
                    </div>

                    {/* Film Özeti */}
                    <h3 style={{ color: 'var(--accent-color)', fontSize: '1.2rem', marginBottom: '10px', fontWeight: '700' }}>Film Özeti</h3>
                    <p style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '1.05rem', 
                        lineHeight: '1.7', 
                        marginBottom: '35px',
                        fontWeight: '400'
                    }}>
                        {movie.description || 'Açıklama belirtilmemiş.'}
                    </p>

                    {/* Bilet Satın Al CTA Butonu */}
                    <button
                        onClick={() => navigate(`/movies/${id}/booking`)}
                        style={{
                            background: 'var(--accent-color)',
                            border: '1px solid var(--accent-color)',
                            color: '#000',
                            padding: '16px 40px',
                            borderRadius: '30px',
                            fontSize: '1.15rem',
                            fontWeight: '800',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            alignSelf: 'flex-start',
                            marginTop: 'auto'
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 25px rgba(239, 68, 68, 0.6)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.4)';
                        }}
                    >
                        🎟️ Seansları Gör & Bilet Al &rarr;
                    </button>
                </div>
            </div>
        </div>
    );
}
