import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import BookingSteps from '../components/BookingSteps';
import GuestModal from '../components/GuestModal';

export default function MovieBooking() {
    const { id: activeMovieId } = useParams();
    const navigate = useNavigate();
    
    // States
    const [activeMovie, setActiveMovie] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedShowtime, setSelectedShowtime] = useState(null);
    
    const [formatFilter, setFormatFilter] = useState('Tümü'); // 'Tümü', '2D', '3D', 'IMAX'
    const [langFilter, setLangFilter] = useState('Tümü'); // 'Tümü', 'Dublaj', 'Altyazılı'
    
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedShowtimeId, setSelectedShowtimeId] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check login state
    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('token'));
    }, []);

    // Fetch active movie details + showtimes whenever activeMovieId changes
    useEffect(() => {
        if (!activeMovieId) return;
        
        const fetchActiveMovieDetails = async () => {
            setLoadingDetails(true);
            try {
                const res = await api.get(`/catalog/movies/${activeMovieId}`);
                setActiveMovie(res.data);
            } catch (err) {
                console.error('API Error fetching movie details:', err);
                setErrorMsg('Film detayları yüklenirken bir sorun oluştu.');
            } finally {
                setLoadingDetails(false);
            }
        };
        
        fetchActiveMovieDetails();
    }, [activeMovieId]);

    // Extract unique dates for the movie across all showtimes
    const uniqueDates = React.useMemo(() => {
        const dates = [];
        const dateKeys = new Set();
        
        if (activeMovie?.showtimes) {
            activeMovie.showtimes.forEach(st => {
                const dateObj = new Date(st.start_time);
                const yyyy = dateObj.getFullYear();
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const dd = String(dateObj.getDate()).padStart(2, '0');
                const dateKey = `${yyyy}-${mm}-${dd}`;
                
                if (!dateKeys.has(dateKey)) {
                    dateKeys.add(dateKey);
                    const dayStr = dateObj.toLocaleDateString('tr-TR', { day: 'numeric' });
                    const monthStr = dateObj.toLocaleDateString('tr-TR', { month: 'long' });
                    const weekdayStr = dateObj.toLocaleDateString('tr-TR', { weekday: 'long' });
                    dates.push({
                        key: dateKey,
                        day: dayStr,
                        month: monthStr,
                        weekday: weekdayStr,
                        rawDate: dateObj
                    });
                }
            });
        }

        // Sort unique dates chronologically
        dates.sort((a, b) => a.rawDate - b.rawDate);
        return dates;
    }, [activeMovie]);

    // Auto-select first date when activeMovie changes
    useEffect(() => {
        if (uniqueDates.length > 0) {
            if (!selectedDate || !uniqueDates.some(d => d.key === selectedDate)) {
                setSelectedDate(uniqueDates[0].key);
            }
        } else {
            setSelectedDate('');
        }
    }, [activeMovie, uniqueDates, selectedDate]);

    // Reset selected showtime when movie, date or filters change
    useEffect(() => {
        setSelectedShowtime(null);
    }, [activeMovieId, selectedDate, formatFilter, langFilter]);

    // Filter showtimes by selected date, format, and language
    const filteredShowtimes = (activeMovie?.showtimes || []).filter(st => {
        // 1. Filter by selected date
        const dateObj = new Date(st.start_time);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const dateKey = `${yyyy}-${mm}-${dd}`;
        if (dateKey !== selectedDate) return false;

        // 2. Filter by format
        if (formatFilter !== 'Tümü') {
            if (st.format !== formatFilter) return false;
        }

        // 3. Filter by language
        if (langFilter !== 'Tümü') {
            if (langFilter === 'Dublaj' && !st.language_type.toLowerCase().includes('dublaj')) return false;
            if (langFilter === 'Altyazılı' && !st.language_type.toLowerCase().includes('altyazı')) return false;
        }

        return true;
    });

    // Group filtered showtimes by Cinema -> Hall -> Format & Language combination
    const groupedData = {};
    filteredShowtimes.forEach(st => {
        const cinema = st.cinema_name;
        const hall = st.hall_name || 'Standart Salon';
        const fmtLang = `${st.format} - ${st.language_type}`;

        if (!groupedData[cinema]) {
            groupedData[cinema] = {};
        }
        if (!groupedData[cinema][hall]) {
            groupedData[cinema][hall] = {};
        }
        if (!groupedData[cinema][hall][fmtLang]) {
            groupedData[cinema][hall][fmtLang] = [];
        }
        groupedData[cinema][hall][fmtLang].push(st);
    });

    // Sort showtime times chronologically under each format combination
    Object.keys(groupedData).forEach(cinema => {
        Object.keys(groupedData[cinema]).forEach(hall => {
            Object.keys(groupedData[cinema][hall]).forEach(fmtLang => {
                groupedData[cinema][hall][fmtLang].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
            });
        });
    });

    const handleShowtimeClick = (st) => {
        if (selectedShowtime?.showtime_id === st.showtime_id) {
            setSelectedShowtime(null); // toggle off
        } else {
            setSelectedShowtime(st);
        }
    };

    const handleContinueClick = () => {
        if (!selectedShowtime || !activeMovie) return;
        
        // Save Movie ID for back navigation
        localStorage.setItem('booking_movie_id', activeMovieId);

        sessionStorage.setItem(`showtime_info_${selectedShowtime.showtime_id}`, JSON.stringify({
            price: selectedShowtime.price || 150,
            movieTitle: activeMovie.title,
            cinemaName: selectedShowtime.cinema_name,
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
                    cinemaName: selectedShowtime.cinema_name,
                    startTime: selectedShowtime.start_time
                }
            });
        }
    };

    if (loadingDetails) {
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
                <p style={{ color: 'var(--text-secondary)' }}>Seans detayları yükleniyor...</p>
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
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '140px', paddingLeft: '20px', paddingRight: '20px' }}>
            <Link to={`/movies/${activeMovieId}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontWeight: '600', transition: 'color 0.2s ease' }}
                  onMouseOver={e => e.currentTarget.style.color = 'var(--accent-color)'}
                  onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                &larr; Film Detaylarına Dön
            </Link>

            {/* Steps Indicator */}
            <BookingSteps currentStep={1} />

            {errorMsg && (
                <div style={{ background: 'rgba(127, 29, 29, 0.4)', border: '1px solid #ef4444', color: 'white', padding: '15px', borderRadius: '10px', textAlign: 'center', marginBottom: '20px' }}>
                    {errorMsg}
                </div>
            )}

            {/* 1. Movie details banner with blur effect */}
            {activeMovie && (
                <div className="glass-panel" style={{ 
                    display: 'flex', 
                    gap: '25px', 
                    padding: '25px', 
                    marginBottom: '30px', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: `url(${activeMovie.poster_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: 0.08,
                        filter: 'blur(40px)',
                        zIndex: 0,
                        pointerEvents: 'none'
                    }} />
                    
                    <img 
                        src={activeMovie.poster_url || '/placeholder-poster.jpg'} 
                        alt={activeMovie.title}
                        style={{ 
                            width: '100px', 
                            height: '150px', 
                            borderRadius: '12px', 
                            objectFit: 'cover', 
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)',
                            border: '2px solid rgba(255, 255, 255, 0.1)',
                            zIndex: 1
                        }}
                    />
                    
                    <div style={{ flex: 1, zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>{activeMovie.title}</h1>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <span style={{ 
                                    background: 'rgba(239, 68, 68, 0.15)', 
                                    color: 'var(--accent-color)', 
                                    padding: '4px 10px', 
                                    borderRadius: '6px', 
                                    fontSize: '0.8rem', 
                                    fontWeight: 'bold',
                                    border: '1px solid rgba(239, 68, 68, 0.3)'
                                }}>
                                    ⏳ {activeMovie.duration_minutes} Dakika
                                </span>
                                {activeMovie.genres && activeMovie.genres.split(',').map((g, idx) => (
                                    <span key={idx} style={{ 
                                        background: 'rgba(255, 255, 255, 0.05)', 
                                        color: '#fff', 
                                        padding: '4px 10px', 
                                        borderRadius: '6px', 
                                        fontSize: '0.8rem', 
                                        border: '1px solid rgba(255, 255, 255, 0.08)'
                                    }}>
                                        {g.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <p style={{ margin: '12px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', maxWidth: '850px' }}>
                            {activeMovie.description || "Bu film için açıklama bulunmuyor."}
                        </p>
                    </div>
                </div>
            )}

            {/* 2. Date Slider */}
            {uniqueDates.length > 0 && (
                <div style={{ marginBottom: '25px' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                        📅 Seans Tarihi Seçimi
                    </h2>
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        overflowX: 'auto',
                        padding: '5px 5px 15px 5px',
                        scrollbarWidth: 'thin'
                    }} className="date-slider">
                        {uniqueDates.map(d => {
                            const isSelected = d.key === selectedDate;
                            return (
                                <div
                                    key={d.key}
                                    onClick={() => setSelectedDate(d.key)}
                                    style={{
                                        background: isSelected ? 'linear-gradient(135deg, var(--accent-color), #f87171)' : 'rgba(255, 255, 255, 0.02)',
                                        border: isSelected ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)',
                                        borderRadius: '16px',
                                        padding: '14px 20px',
                                        color: isSelected ? '#000' : '#fff',
                                        cursor: 'pointer',
                                        minWidth: '105px',
                                        textAlign: 'center',
                                        flexShrink: 0,
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: isSelected ? '0 8px 25px rgba(239, 68, 68, 0.35)' : 'none',
                                        transform: isSelected ? 'scale(1.05)' : 'none',
                                    }}
                                    onMouseOver={e => {
                                        if (!isSelected) {
                                            e.currentTarget.style.borderColor = 'var(--accent-color)';
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                        }
                                    }}
                                    onMouseOut={e => {
                                        if (!isSelected) {
                                            e.currentTarget.style.borderColor = 'var(--glass-border)';
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                                        }
                                    }}
                                >
                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', lineHeight: 1 }}>{d.day}</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: '600', marginTop: '5px', textTransform: 'capitalize' }}>{d.month}</div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '3px' }}>{d.weekday}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 3. Format & Language Filters */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                gap: '20px', 
                flexWrap: 'wrap',
                marginBottom: '35px',
                background: 'rgba(255, 255, 255, 0.01)',
                padding: '15px 25px',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Format:</span>
                    {['Tümü', '2D', '3D', 'IMAX'].map(fmt => {
                        const isSelected = formatFilter === fmt;
                        return (
                            <button
                                key={fmt}
                                onClick={() => setFormatFilter(fmt)}
                                style={{
                                    background: isSelected ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid ' + (isSelected ? 'var(--accent-color)' : 'var(--glass-border)'),
                                    color: isSelected ? '#000' : '#fff',
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s ease',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {fmt}
                            </button>
                        );
                    })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Dil Seçeneği:</span>
                    {['Tümü', 'Dublaj', 'Altyazılı'].map(lang => {
                        const isSelected = langFilter === lang;
                        return (
                            <button
                                key={lang}
                                onClick={() => setLangFilter(lang)}
                                style={{
                                    background: isSelected ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid ' + (isSelected ? 'var(--accent-color)' : 'var(--glass-border)'),
                                    color: isSelected ? '#000' : '#fff',
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s ease',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {lang}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 4. Grouped Cinemas & Showtimes */}
            {Object.keys(groupedData).length === 0 ? (
                <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎬</div>
                    <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Aradığınız kriterlerde seans bulunamadı.</h3>
                    <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.35)', fontSize: '0.9rem' }}>Lütfen farklı bir seans tarihi seçin veya filtreleri sıfırlayın.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {Object.entries(groupedData).map(([cinemaName, halls]) => (
                        <div key={cinemaName} className="glass-panel" style={{ padding: '25px', overflow: 'hidden' }}>
                            <h3 style={{ margin: '0 0 20px 0', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', fontSize: '1.2rem' }}>
                                📍 {cinemaName}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {Object.entries(halls).map(([hallName, fmtLangs]) => (
                                    <div key={hallName} style={{ background: 'rgba(0, 0, 0, 0.15)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.02)' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎬 {hallName}</span>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '12px' }}>
                                            {Object.entries(fmtLangs).map(([fmtLang, times]) => (
                                                <div key={fmtLang} style={{ borderLeft: '3px solid var(--accent-color)', paddingLeft: '12px' }}>
                                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px', fontWeight: '700' }}>
                                                        {fmtLang}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        {times.map(st => {
                                                            const isSelected = selectedShowtime?.showtime_id === st.showtime_id;
                                                            const timeString = new Date(st.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                                                            return (
                                                                <button
                                                                    key={st.showtime_id}
                                                                    onClick={() => handleShowtimeClick(st)}
                                                                    style={{
                                                                        background: isSelected ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.03)',
                                                                        border: isSelected ? '2px solid var(--accent-color)' : '1px solid var(--glass-border)',
                                                                        borderRadius: '8px',
                                                                        padding: '8px 16px',
                                                                        color: isSelected ? '#000' : '#fff',
                                                                        cursor: 'pointer',
                                                                        fontWeight: 'bold',
                                                                        fontSize: '0.85rem',
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
                                                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 5. Sticky Bottom Checkout Bar */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(9, 13, 22, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--glass-border)',
                padding: '15px 8%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 1000,
                boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.6)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {selectedShowtime ? (
                        <>
                            <img 
                                src={activeMovie?.poster_url || '/placeholder-poster.jpg'} 
                                alt={activeMovie?.title}
                                style={{ width: '45px', height: '65px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                            />
                            <div>
                                <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff', fontWeight: 'bold' }}>{activeMovie?.title}</h4>
                                <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    📍 {selectedShowtime.cinema_name} &bull; 🎬 {selectedShowtime.hall_name || 'Salon'}
                                </p>
                                <p style={{ margin: '1px 0 0 0', fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                                    📅 {new Date(selectedShowtime.start_time).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })} @ {new Date(selectedShowtime.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} &bull; {selectedShowtime.format} ({selectedShowtime.language_type})
                                </p>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.25rem' }}>👉</span>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>Devam etmek için listeden bir seans saati seçin</span>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {selectedShowtime && (
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Bilet Fiyatı</span>
                            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>
                                {selectedShowtime.price} TL
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleContinueClick}
                        disabled={!selectedShowtime}
                        className="btn-primary"
                        style={{
                            padding: '12px 35px',
                            borderRadius: '30px',
                            fontSize: '0.95rem',
                            fontWeight: 'bold',
                            boxShadow: selectedShowtime ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none',
                            background: selectedShowtime ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.05)',
                            color: selectedShowtime ? '#fff' : 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            cursor: selectedShowtime ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Koltuk Seçimine İlerle &rarr;
                    </button>
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
