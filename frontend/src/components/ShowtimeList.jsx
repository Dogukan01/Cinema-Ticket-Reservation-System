import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GuestModal from './GuestModal';

export default function ShowtimeList({ showtimesByCinema }) {
    const navigate = useNavigate();
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedShowtimeId, setSelectedShowtimeId] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem('token'));
    }, []);

    const handleShowtimeClick = (e, showtimeId) => {
        e.preventDefault();
        
        if (!isLoggedIn) {
            setSelectedShowtimeId(showtimeId);
            setModalOpen(true);
        } else {
            // Direct SPA navigation for logged in users
            navigate(`/showtimes/${showtimeId}/tickets`);
        }
    };

    if (!showtimesByCinema || Object.keys(showtimesByCinema).length === 0) {
        return <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>Bu film için henüz seans tanımlanmamıştır.</p>;
    }

    return (
        <>
            {Object.keys(showtimesByCinema).map(cinemaName => (
                <div key={cinemaName} style={{ marginBottom: '35px' }}>
                    <h3 style={{ color: 'var(--accent-color)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
                        📍 {cinemaName}
                    </h3>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        {showtimesByCinema[cinemaName].map(st => {
                            const timeString = new Date(st.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                            return (
                                <button 
                                    key={st.showtime_id} 
                                    onClick={(e) => handleShowtimeClick(e, st.showtime_id)}
                                    style={{ 
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '12px',
                                        padding: '15px 25px', 
                                        textAlign: 'center', 
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        color: '#fff',
                                        minWidth: '120px'
                                    }}
                                    onMouseOver={e => {
                                        e.currentTarget.style.borderColor = 'var(--accent-color)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.15)';
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.borderColor = 'var(--glass-border)';
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                                    }}
                                >
                                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{timeString}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{st.hall_name}</div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            ))}

            <GuestModal 
                isOpen={isModalOpen} 
                onClose={() => setModalOpen(false)} 
                showtimeId={selectedShowtimeId} 
            />
        </>
    );
}
