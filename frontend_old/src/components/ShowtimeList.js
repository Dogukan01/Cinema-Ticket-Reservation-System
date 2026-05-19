'use client';
import { useState, useEffect } from 'react';
import GuestModal from './GuestModal';

export default function ShowtimeList({ showtimesByCinema }) {
    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedShowtimeId, setSelectedShowtimeId] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsLoggedIn(!!localStorage.getItem('token'));
        }
    }, []);

    const handleShowtimeClick = (e, showtimeId) => {
        e.preventDefault();
        
        if (!isLoggedIn) {
            setSelectedShowtimeId(showtimeId);
            setModalOpen(true);
        } else {
            // Giriş yapmış kullanıcıları direkt bilet seçimine yönlendir
            window.location.href = `/showtimes/${showtimeId}/tickets`;
        }
    };

    if (Object.keys(showtimesByCinema).length === 0) {
        return <p>Bu film için henüz seans tanımlanmamıştır.</p>;
    }

    return (
        <>
            {Object.keys(showtimesByCinema).map(cinemaName => (
                <div key={cinemaName} style={{ marginBottom: '30px' }}>
                    <h3 style={{ color: 'var(--accent-color)', marginBottom: '15px' }}>📍 {cinemaName}</h3>
                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                        {showtimesByCinema[cinemaName].map(st => {
                            const timeString = new Date(st.start_time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                            return (
                                <a 
                                    key={st.showtime_id} 
                                    href={`/showtimes/${st.showtime_id}/tickets`}
                                    onClick={(e) => handleShowtimeClick(e, st.showtime_id)}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <div className="glass-card" style={{ padding: '15px 25px', textAlign: 'center', cursor: 'pointer', border: '1px solid var(--accent-color)' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{timeString}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '5px' }}>{st.hall_name}</div>
                                    </div>
                                </a>
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
