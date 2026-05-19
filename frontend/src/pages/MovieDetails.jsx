import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import BookingSteps from '../components/BookingSteps';
import GuestModal from '../components/GuestModal';

export default function MovieDetails() {
    const { id: activeMovieId } = useParams();
    const navigate = useNavigate();
    
    // States
    const [moviesList, setMoviesList] = useState([]);
    const [activeMovie, setActiveMovie] = useState(null);
    const [loadingMovies, setLoadingMovies] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    
    const [selectedCinema, setSelectedCinema] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedShowtime, setSelectedShowtime] = useState(null);
    
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedShowtimeId, setSelectedShowtimeId] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Fetch all movies list (Column 1)
    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('token'));
        
        const fetchAllMovies = async () => {
            try {
                const res = await api.get('/catalog/movies');
                setMoviesList(res.data);
            } catch (err) {
                console.error('API Error fetching all movies:', err);
                setErrorMsg('Filmler listelenirken bir hata oluştu.');
            } finally {
                setLoadingMovies(false);
            }
        };
        fetchAllMovies();
    }, []);

    // Fetch active movie details + showtimes whenever activeMovieId changes
    useEffect(() => {
        if (!activeMovieId) return;
        
        const fetchActiveMovieDetails = async () => {
            setLoadingDetails(true);
            try {
                const res = await api.get(`/catalog/movies/${activeMovieId}`);
                setActiveMovie(res.data);
                
                // Pre-select first cinema of the new movie
                if (res.data.showtimes && res.data.showtimes.length > 0) {
                    const uniqueCinemas = Array.from(new Set(res.data.showtimes.map(st => st.cinema_name)));
                    if (uniqueCinemas.length > 0) {
                        setSelectedCinema(uniqueCinemas[0]);
                    } else {
                        setSelectedCinema('');
                    }
                } else {
                    setSelectedCinema('');
                }
            } catch (err) {
                console.error('API Error fetching movie details:', err);
                setErrorMsg('Film detayları yüklenirken bir sorun oluştu.');
            } finally {
                setLoadingDetails(false);
            }
        };
        
        fetchActiveMovieDetails();
    }, [activeMovieId]);

    // Extract unique cinemas for the active movie
    const cinemas = activeMovie?.showtimes ? Array.from(new Set(activeMovie.showtimes.map(st => st.cinema_name))) : [];

    // Filter showtimes for the selected cinema
    const cinemaShowtimes = activeMovie?.showtimes ? activeMovie.showtimes.filter(st => st.cinema_name === selectedCinema) : [];

    // Extract unique dates for the selected cinema
    const uniqueDates = [];
    const dateKeys = new Set();
    
    cinemaShowtimes.forEach(st => {
        const dateObj = new Date(st.start_time);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const dateKey = `${yyyy}-${mm}-${dd}`;
        
        if (!dateKeys.has(dateKey)) {
            dateKeys.add(dateKey);
            const dayStr = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
            const weekdayStr = dateObj.toLocaleDateString('tr-TR', { weekday: 'long' });
            uniqueDates.push({
                key: dateKey,
                day: dayStr,
                weekday: weekdayStr,
                rawDate: dateObj
            });
        }
    });

    // Sort unique dates chronologically
    uniqueDates.sort((a, b) => a.rawDate - b.rawDate);

    // Auto-select date when cinema changes
    useEffect(() => {
        if (uniqueDates.length > 0) {
            if (!uniqueDates.some(d => d.key === selectedDate)) {
                setSelectedDate(uniqueDates[0].key);
            }
        } else {
            setSelectedDate('');
        }
    }, [selectedCinema, uniqueDates]);

    // Reset selected showtime when movie, cinema, or date changes
    useEffect(() => {
        setSelectedShowtime(null);
    }, [activeMovieId, selectedCinema, selectedDate]);

    // Filter showtimes for the selected cinema and selected date
    const activeShowtimes = cinemaShowtimes.filter(st => {
        const dateObj = new Date(st.start_time);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const dateKey = `${yyyy}-${mm}-${dd}`;
        return dateKey === selectedDate;
    });

    // Group active showtimes by Hall
    const showtimesByHall = {};
    activeShowtimes.forEach(st => {
        const hall = st.hall_name || 'Standart Salon';
        if (!showtimesByHall[hall]) {
            showtimesByHall[hall] = [];
        }
        showtimesByHall[hall].push(st);
    });

    // Sort times in each hall chronologically
    Object.keys(showtimesByHall).forEach(hall => {
        showtimesByHall[hall].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    });

    const handleMovieChange = (newMovieId) => {
        if (newMovieId === activeMovieId) return;
        navigate(`/movies/${newMovieId}`, { replace: true });
    };

    const handleShowtimeClick = (st) => {
        if (selectedShowtime?.showtime_id === st.showtime_id) {
            setSelectedShowtime(null); // toggle off
        } else {
            setSelectedShowtime(st);
        }
    };

    const handleContinueClick = () => {
        if (!selectedShowtime || !activeMovie) return;
        
        // Cache showtime information in sessionStorage in case of redirects or page reloads
        sessionStorage.setItem(`showtime_info_${selectedShowtime.showtime_id}`, JSON.stringify({
            price: selectedShowtime.price || 150,
            movieTitle: activeMovie.title,
            cinemaName: selectedCinema,
            startTime: selectedShowtime.start_time
        }));

        if (!isLoggedIn) {
            setSelectedShowtimeId(selectedShowtime.showtime_id);
            setModalOpen(true);
        } else {
            navigate(`/showtimes/${selectedShowtime.showtime_id}/tickets`, {
                state: {
                    price: selectedShowtime.price || 150,
                    movieTitle: activeMovie.title,
                    cinemaName: selectedCinema,
                    startTime: selectedShowtime.start_time
                }
            });
        }
    };

    if (loadingMovies) {
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
                <p style={{ color: 'var(--text-secondary)' }}>Uygulama yükleniyor...</p>
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
        <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '20px' }}>
            <Link to="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: '600', transition: 'color 0.2s ease' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--accent-color)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                &larr; Vizyondaki Filmler
            </Link>

            {/* Steps Indicator */}
            <BookingSteps currentStep={1} />

            {/* Header info bar with 'Devam Et' button */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '15px'
            }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
                    Aşağıda listelenen film, sinema ve seans seçeneklerinden tercihini yaparak diğer adımlara geçebilirsiniz.
                </p>
                <button
                    onClick={handleContinueClick}
                    disabled={!selectedShowtime}
                    style={{
                        background: selectedShowtime ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.05)',
                        border: selectedShowtime ? '1px solid var(--accent-color)' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: selectedShowtime ? '#000' : 'rgba(255, 255, 255, 0.3)',
                        padding: '12px 35px',
                        borderRadius: '24px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: selectedShowtime ? 'pointer' : 'not-allowed',
                        transition: 'all 0.3s ease',
                        boxShadow: selectedShowtime ? '0 0 15px rgba(239, 68, 68, 0.3)' : 'none'
                    }}
                    onMouseOver={e => {
                        if (selectedShowtime) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(239, 68, 68, 0.5)';
                        }
                    }}
                    onMouseOut={e => {
                        if (selectedShowtime) {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.3)';
                        }
                    }}
                >
                    Devam Et &rarr;
                </button>
            </div>

            {errorMsg && (
                <div style={{ background: 'rgba(127, 29, 29, 0.4)', border: '1px solid #ef4444', color: 'white', padding: '15px', borderRadius: '10px', textAlign: 'center', marginBottom: '20px' }}>
                    {errorMsg}
                </div>
            )}

            {/* 3-Column Paribu Cineverse Side-by-Side Viewport Layout */}
            <div style={{ 
                display: 'flex', 
                gap: '20px', 
                alignItems: 'stretch',
                width: '100%',
                flexWrap: 'nowrap'
            }}>
                
                {/* Column 1: Seçilen Film */}
                <div style={{ flex: '0.8 1 0px', minWidth: '250px', height: '600px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }} className="glass-panel">
                    <div style={{ padding: '20px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {activeMovie && (
                            <>
                                <img 
                                    src={activeMovie.poster_url || '/placeholder-poster.jpg'} 
                                    alt={activeMovie.title}
                                    style={{ width: '100%', maxWidth: '220px', height: 'auto', borderRadius: '12px', border: '3px solid var(--accent-color)', boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)', marginBottom: '20px' }}
                                />
                                <h2 style={{ color: '#fff', fontSize: '1.4rem', textAlign: 'center', marginBottom: '10px' }}>{activeMovie.title}</h2>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>⏳ {activeMovie.duration_minutes} Dakika</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Column 2: Sinema Seçimi */}
                <div style={{ flex: '0.9 1 0px', minWidth: '260px', height: '600px', display: 'flex', flexDirection: 'column' }} className="glass-panel">
                    <div style={{ padding: '20px 20px 10px 20px' }}>
                        <h3 style={{ margin: 0, borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', fontSize: '1.1rem', color: 'var(--accent-color)', fontWeight: '800', letterSpacing: '0.5px' }}>
                            2. Sinema Seçimi
                        </h3>
                    </div>
                    <div className="scroll-column" style={{ flexGrow: 1, padding: '0 20px 20px 20px' }}>
                        {loadingDetails ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                                <div style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            </div>
                        ) : cinemas.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '40px 0' }}>Bu film için aktif seans/sinema bulunmamaktadır.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {cinemas.map(cinemaName => {
                                    const isSelected = cinemaName === selectedCinema;
                                    return (
                                        <div 
                                            key={cinemaName}
                                            onClick={() => setSelectedCinema(cinemaName)}
                                            style={{
                                                background: isSelected ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                                                border: isSelected ? '2px solid var(--accent-color)' : '1px solid var(--glass-border)',
                                                borderRadius: '10px',
                                                padding: '15px',
                                                cursor: 'pointer',
                                                transition: 'all 0.25s ease',
                                                boxShadow: isSelected ? '0 0 10px rgba(239, 68, 68, 0.15)' : 'none'
                                            }}
                                            onMouseOver={e => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                                }
                                            }}
                                            onMouseOut={e => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.borderColor = 'var(--glass-border)';
                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                                                }
                                            }}
                                        >
                                            <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                📍 {cinemaName}
                                            </h4>
                                            <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                Tıklayarak seansları seçin.
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Column 3: Tarih ve Seans Seçimi */}
                <div style={{ flex: '1.4 1 0px', minWidth: '340px', height: '600px', display: 'flex', flexDirection: 'column' }} className="glass-panel">
                    <div style={{ padding: '20px 20px 10px 20px' }}>
                        <h3 style={{ margin: 0, borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', fontSize: '1.1rem', color: 'var(--accent-color)', fontWeight: '800', letterSpacing: '0.5px' }}>
                            3. Tarih ve Seans Seçimi
                        </h3>
                    </div>
                    <div className="scroll-column" style={{ flexGrow: 1, padding: '0 20px 20px 20px' }}>
                        {loadingDetails ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                                <div style={{ width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            </div>
                        ) : !selectedCinema ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '40px 0' }}>Lütfen orta sütundan bir sinema seçiniz.</p>
                        ) : (
                            <>
                                {/* Date Navigation Tabs */}
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '8px', 
                                    overflowX: 'auto', 
                                    paddingBottom: '10px',
                                    marginBottom: '15px',
                                    scrollbarWidth: 'none'
                                }}>
                                    {uniqueDates.map(d => {
                                        const isSelected = d.key === selectedDate;
                                        return (
                                            <button
                                                key={d.key}
                                                onClick={() => setSelectedDate(d.key)}
                                                style={{
                                                    background: isSelected ? 'var(--accent-color)' : 'rgba(255,255,255,0.03)',
                                                    border: '1px solid var(--glass-border)',
                                                    borderRadius: '8px',
                                                    padding: '8px 12px',
                                                    color: isSelected ? '#000' : '#fff',
                                                    cursor: 'pointer',
                                                    minWidth: '85px',
                                                    textAlign: 'center',
                                                    flexShrink: 0,
                                                    transition: 'all 0.25s ease',
                                                    fontWeight: '600',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                <div>{d.day}</div>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '1px' }}>{d.weekday}</div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Showtimes List grouped by Hall */}
                                {Object.keys(showtimesByHall).length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '40px 0' }}>Seçilen tarihte seans bulunmamaktadır.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {Object.keys(showtimesByHall).map(hall => (
                                            <div key={hall} style={{ 
                                                background: 'rgba(0,0,0,0.15)',
                                                borderRadius: '10px',
                                                padding: '12px',
                                                border: '1px solid rgba(255, 255, 255, 0.03)'
                                            }}>
                                                <h4 style={{ 
                                                    margin: '0 0 10px 0', 
                                                    color: 'rgba(255,255,255,0.5)', 
                                                    fontSize: '0.75rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                    paddingBottom: '4px'
                                                }}>
                                                    🎬 {hall}
                                                </h4>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {showtimesByHall[hall].map(st => {
                                                        const isSelected = selectedShowtime?.showtime_id === st.showtime_id;
                                                        const timeString = new Date(st.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                                                        return (
                                                            <button
                                                                key={st.showtime_id}
                                                                onClick={() => handleShowtimeClick(st)}
                                                                style={{
                                                                    background: isSelected ? 'var(--accent-color)' : 'rgba(255,255,255,0.03)',
                                                                    border: isSelected ? '2px solid var(--accent-color)' : '1px solid var(--glass-border)',
                                                                    borderRadius: '6px',
                                                                    padding: '8px 14px',
                                                                    color: isSelected ? '#000' : '#fff',
                                                                    cursor: 'pointer',
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.9rem',
                                                                    transition: 'all 0.25s ease',
                                                                    boxShadow: isSelected ? '0 0 10px rgba(239, 68, 68, 0.3)' : 'none'
                                                                }}
                                                                onMouseOver={e => {
                                                                    if (!isSelected) {
                                                                        e.currentTarget.style.borderColor = 'var(--accent-color)';
                                                                        e.currentTarget.style.background = 'var(--accent-color)';
                                                                        e.currentTarget.style.color = '#000';
                                                                    }
                                                                }}
                                                                onMouseOut={e => {
                                                                    if (!isSelected) {
                                                                        e.currentTarget.style.borderColor = 'var(--glass-border)';
                                                                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                                                        e.currentTarget.style.color = '#fff';
                                                                    }
                                                                }}
                                                            >
                                                                {timeString}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

            </div>

            <GuestModal 
                isOpen={isModalOpen} 
                onClose={() => setModalOpen(false)} 
                showtimeId={selectedShowtimeId} 
            />
        </div>
    );
}
