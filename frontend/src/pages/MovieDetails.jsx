import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function MovieDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [showTrailer, setShowTrailer] = useState(false);

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
        <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px', position: 'relative' }}>
            
            {/* Arka Plan Görseli (Backdrop Banner) */}
            {movie.backdropUrl && (
                <div style={{
                    position: 'absolute',
                    top: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100vw',
                    height: '350px',
                    backgroundImage: `linear-gradient(to bottom, rgba(10, 15, 30, 0.4) 0%, rgba(10, 15, 30, 0.95) 100%), url(${movie.backdropUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 20%',
                    zIndex: 0,
                    opacity: 0.6,
                    pointerEvents: 'none'
                }} />
            )}

            <div style={{ position: 'relative', zIndex: 1 }}>
                <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '25px', fontWeight: '600', transition: 'color 0.2s ease', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                      onMouseOver={e => e.currentTarget.style.color = 'var(--accent-color)'}
                      onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                    &larr; Vizyondaki Filmler
                </Link>

                <div className="glass-panel" style={{ display: 'flex', gap: '40px', padding: '45px', borderRadius: '20px', flexWrap: 'wrap', marginTop: '40px', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    
                    {/* Sol Sütun: Poster & Fragman Butonu */}
                    <div style={{ flex: '1 1 300px', maxWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        <img 
                            src={movie.poster_url || '/placeholder-poster.jpg'} 
                            alt={movie.title}
                            style={{ 
                                width: '100%', 
                                borderRadius: '14px', 
                                border: '3px solid rgba(255,255,255,0.05)', 
                                boxShadow: '0 15px 35px rgba(0,0,0,0.7)',
                            }}
                        />

                        {movie.trailerKey && (
                            <button
                                onClick={() => setShowTrailer(true)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    color: '#fff',
                                    padding: '12px 20px',
                                    borderRadius: '30px',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s ease',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    backdropFilter: 'blur(5px)'
                                }}
                                onMouseOver={e => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                    e.currentTarget.style.borderColor = 'var(--accent-color)';
                                    e.currentTarget.style.color = 'var(--accent-color)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                    e.currentTarget.style.color = '#fff';
                                }}
                            >
                                🎬 Fragmanı İzle
                            </button>
                        )}
                    </div>

                    {/* Sağ Sütun: Detaylar */}
                    <div style={{ flex: '2 1 450px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                        
                        {/* Film Başlığı */}
                        <h1 style={{ 
                            fontSize: '2.8rem', 
                            fontWeight: '900', 
                            color: '#fff', 
                            marginBottom: '18px',
                            lineHeight: '1.25',
                            textShadow: '0 2px 8px rgba(0,0,0,0.6)'
                        }}>
                            {movie.title}
                        </h1>

                        {/* Metadata Etiketleri */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '30px', alignItems: 'center' }}>
                            {movie.rating && (
                                <span style={{ 
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    color: '#000',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontWeight: '800',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.25)'
                                }}>
                                    ⭐ {movie.rating}
                                </span>
                            )}
                            <span style={{ 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                border: '1px solid rgba(239, 68, 68, 0.25)', 
                                color: 'var(--accent-color)',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: '700'
                            }}>
                                ⏳ {movie.duration_minutes} Dakika
                            </span>
                            <span style={{ 
                                background: 'rgba(255, 255, 255, 0.04)', 
                                border: '1px solid rgba(255, 255, 255, 0.08)', 
                                color: 'var(--text-secondary)',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '0.9rem',
                                fontWeight: '700'
                            }}>
                                📅 {movie.release_date ? new Date(movie.release_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                            </span>
                        </div>

                        {/* Zengin Detay Bilgileri */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '30px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            {movie.genres && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold', minWidth: '90px' }}>🎭 Tür:</span>
                                    <span style={{ color: '#fff' }}>{movie.genres}</span>
                                </div>
                            )}
                            {movie.director && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold', minWidth: '90px' }}>🎬 Yönetmen:</span>
                                    <span style={{ color: '#fff' }}>{movie.director}</span>
                                </div>
                            )}
                            {movie.cast && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold', minWidth: '90px' }}>👥 Oyuncular:</span>
                                    <span style={{ color: '#fff', lineHeight: '1.4' }}>{movie.cast}</span>
                                </div>
                            )}
                        </div>

                        {/* Film Özeti */}
                        <h3 style={{ color: 'var(--accent-color)', fontSize: '1.25rem', marginBottom: '10px', fontWeight: '800' }}>Film Özeti</h3>
                        <p style={{ 
                            color: 'var(--text-secondary)', 
                            fontSize: '1.05rem', 
                            lineHeight: '1.75', 
                            marginBottom: '40px',
                            fontWeight: '400'
                        }}>
                            {movie.description || 'Açıklama belirtilmemiş.'}
                        </p>

                        {/* Bilet Satın Al CTA Butonu veya Gelecek Film Uyarısı */}
                        {movie.release_date && new Date(movie.release_date) > new Date() ? (
                            <div style={{
                                background: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid rgba(56, 189, 248, 0.25)',
                                padding: '16px 30px',
                                borderRadius: '15px',
                                color: '#38bdf8',
                                fontSize: '1.1rem',
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                alignSelf: 'flex-start',
                                marginTop: 'auto',
                                boxShadow: '0 4px 15px rgba(56, 189, 248, 0.1)'
                            }}>
                                📢 Bu film yakında vizyona girecektir. Bilet satışları henüz başlamamıştır.
                            </div>
                        ) : (
                            <button
                                onClick={() => navigate(`/movies/${id}/booking`)}
                                style={{
                                    background: 'var(--accent-color)',
                                    border: '1px solid var(--accent-color)',
                                    color: '#000',
                                    padding: '16px 45px',
                                    borderRadius: '30px',
                                    fontSize: '1.15rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 0 25px rgba(239, 68, 68, 0.4)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    alignSelf: 'flex-start',
                                    marginTop: 'auto'
                                }}
                                onMouseOver={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(239, 68, 68, 0.6)';
                                }}
                                onMouseOut={e => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '0 0 25px rgba(239, 68, 68, 0.4)';
                                }}
                            >
                                🎟️ Seansları Gör & Hemen Bilet Al &rarr;
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Fragman Modalı (Trailer Modal Overlay) */}
            {showTrailer && movie.trailerKey && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9999,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px',
                    animation: 'fadeIn 0.3s ease'
                }}
                onClick={() => setShowTrailer(false)}
                >
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '900px',
                        aspectRatio: '16/9',
                        background: '#000',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        animation: 'scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                    onClick={e => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setShowTrailer(false)}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'rgba(0,0,0,0.6)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#fff',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 10,
                                transition: 'all 0.2s ease'
                            }}
                            onMouseOver={e => {
                                e.currentTarget.style.background = '#ef4444';
                                e.currentTarget.style.borderColor = '#ef4444';
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                            }}
                        >
                            &times;
                        </button>

                        {/* YouTube Embed Video */}
                        <iframe
                            src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1`}
                            title={`${movie.title} Fragman`}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none'
                            }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>

                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes scaleUp {
                            from { transform: scale(0.9); opacity: 0; }
                            to { transform: scale(1); opacity: 1; }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}
