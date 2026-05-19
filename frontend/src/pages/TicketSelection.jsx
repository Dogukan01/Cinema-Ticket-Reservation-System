import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

export default function TicketSelection() {
    const { id: showtimeId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Try to get values from state or fallback to sessionStorage
    const [price, setPrice] = useState(150);
    const [movieTitle, setMovieTitle] = useState('');
    const [cinemaName, setCinemaName] = useState('');
    const [startTime, setStartTime] = useState('');

    useEffect(() => {
        if (location.state) {
            const { price: statePrice, movieTitle: stateTitle, cinemaName: stateCinema, startTime: stateTime } = location.state;
            const parsedPrice = parseFloat(statePrice) || 150;
            setPrice(parsedPrice);
            setMovieTitle(stateTitle || '');
            setCinemaName(stateCinema || '');
            setStartTime(stateTime || '');
            
            // Cache to session storage in case of page refresh
            sessionStorage.setItem(`showtime_info_${showtimeId}`, JSON.stringify({
                price: parsedPrice,
                movieTitle: stateTitle || '',
                cinemaName: stateCinema || '',
                startTime: stateTime || ''
            }));
        } else {
            const cached = sessionStorage.getItem(`showtime_info_${showtimeId}`);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    setPrice(parsed.price || 150);
                    setMovieTitle(parsed.movieTitle || '');
                    setCinemaName(parsed.cinemaName || '');
                    setStartTime(parsed.startTime || '');
                } catch (e) {
                    console.error('Error parsing cached showtime info:', e);
                }
            }
        }
    }, [location.state, showtimeId]);

    const [adultTickets, setAdultTickets] = useState(0);
    const [studentTickets, setStudentTickets] = useState(0);

    const studentPrice = price * 0.8; // 20% discount
    const totalTickets = adultTickets + studentTickets;
    const totalPrice = (adultTickets * price) + (studentTickets * studentPrice);

    const handleContinue = () => {
        if (totalTickets === 0) {
            alert('Lütfen en az 1 bilet seçiniz.');
            return;
        }
        if (totalTickets > 6) {
            alert('En fazla 6 bilet seçebilirsiniz.');
            return;
        }

        // Save selection to localStorage
        localStorage.setItem('ticketSelection', JSON.stringify({ adultTickets, studentTickets }));
        navigate(`/showtimes/${showtimeId}/seats`);
    };

    return (
        <div style={{ maxWidth: '650px', margin: '40px auto', padding: '0 20px' }}>
            <button 
                onClick={() => navigate(-1)}
                style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'var(--text-secondary)', 
                    cursor: 'pointer', 
                    fontWeight: '600', 
                    marginBottom: '20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px' 
                }}
            >
                &larr; Geri Dön
            </button>

            {movieTitle && (
                <div className="glass-panel" style={{ padding: '20px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--accent-color)' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{movieTitle}</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        📍 {cinemaName} | 📅 {startTime ? new Date(startTime).toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                </div>
            )}

            <div className="glass-panel" style={{ padding: '40px' }}>
                <h1 style={{ textAlign: 'center', color: 'var(--accent-color)', marginBottom: '35px', fontSize: '2rem' }}>Bilet Seçimi</h1>

                {/* Adult Tickets */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '25px', 
                    paddingBottom: '25px', 
                    borderBottom: '1px solid var(--glass-border)' 
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Yetişkin Bilet</h3>
                        <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)', fontWeight: '600' }}>{price.toFixed(2)} TL</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button 
                            className="btn-primary" 
                            onClick={() => setAdultTickets(Math.max(0, adultTickets - 1))} 
                            style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', fontSize: '1.2rem' }}
                        >
                            -
                        </button>
                        <span style={{ fontSize: '1.4rem', width: '25px', textAlign: 'center', fontWeight: 'bold', color: 'white' }}>{adultTickets}</span>
                        <button 
                            className="btn-primary" 
                            onClick={() => setAdultTickets(Math.min(6 - studentTickets, adultTickets + 1))} 
                            style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', fontSize: '1.2rem' }}
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Student Tickets */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '40px' 
                }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Öğrenci Bilet</h3>
                        <p style={{ margin: '5px 0 0 0', color: 'var(--accent-color)', fontWeight: '600' }}>
                            {studentPrice.toFixed(2)} TL <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'line-through', marginLeft: '8px' }}>{price.toFixed(2)} TL</span>
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button 
                            className="btn-primary" 
                            onClick={() => setStudentTickets(Math.max(0, studentTickets - 1))} 
                            style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', fontSize: '1.2rem' }}
                        >
                            -
                        </button>
                        <span style={{ fontSize: '1.4rem', width: '25px', textAlign: 'center', fontWeight: 'bold', color: 'white' }}>{studentTickets}</span>
                        <button 
                            className="btn-primary" 
                            onClick={() => setStudentTickets(Math.min(6 - adultTickets, studentTickets + 1))} 
                            style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', fontSize: '1.2rem' }}
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Summary panel */}
                <div style={{ 
                    background: 'rgba(0,0,0,0.3)', 
                    padding: '25px', 
                    borderRadius: '16px', 
                    border: '1px solid var(--glass-border)',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '20px'
                }}>
                    <div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Toplam Tutar ({totalTickets} Bilet)</p>
                        <h2 style={{ margin: '5px 0 0 0', color: 'var(--accent-color)', fontSize: '1.8rem' }}>{totalPrice.toFixed(2)} TL</h2>
                    </div>
                    <button 
                        className="btn-primary" 
                        onClick={handleContinue}
                        disabled={totalTickets === 0}
                        style={{ padding: '15px 30px' }}
                    >
                        Koltuk Seçimine Geç &rarr;
                    </button>
                </div>
            </div>
        </div>
    );
}
