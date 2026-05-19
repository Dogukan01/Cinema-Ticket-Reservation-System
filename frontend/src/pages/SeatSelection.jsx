import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import BookingSteps from '../components/BookingSteps';
import SeatLegend from '../components/SeatLegend';
import { toast } from 'react-hot-toast';
import useReservationStore from '../store/reservationStore';

export default function SeatSelection() {
    const { id: showtimeId } = useParams();
    const navigate = useNavigate();

    const [seatData, setSeatData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [expectedTickets, setExpectedTickets] = useState({ adultTickets: 0, studentTickets: 0 });

    useEffect(() => {
        const saved = localStorage.getItem('ticketSelection');
        if (saved) {
            try {
                setExpectedTickets(JSON.parse(saved));
            } catch (e) {
                console.error('Error parsing ticket selection:', e);
                navigate(`/showtimes/${showtimeId}/tickets`);
            }
        } else {
            navigate(`/showtimes/${showtimeId}/tickets`);
        }
    }, [navigate, showtimeId]);

    const totalExpected = expectedTickets.adultTickets + expectedTickets.studentTickets;

    // Fetch seats from Backend
    const fetchSeats = async () => {
        try {
            const res = await api.get(`/reservations/showtimes/${showtimeId}/seats`);
            setSeatData(res.data);
        } catch (err) {
            console.error('Fetch seats error:', err);
            setErrorMsg('Koltuk verileri yüklenirken bir hata oluştu. Seans bulunamadı veya bağlantı hatası.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSeats();
        
        // Refresh seats every 15 seconds to fetch new bookings/locks
        const interval = setInterval(fetchSeats, 15000);
        return () => clearInterval(interval);
    }, [showtimeId]);

    // Cleanup locked seats if user leaves page
    useEffect(() => {
        return () => {
            // Unlock all currently selected seats when component unmounts without booking
            const cleanupLocks = async () => {
                if (selectedSeats.length > 0) {
                    for (const seatId of selectedSeats) {
                        try {
                            await api.post('/reservations/unlock', { showtimeId, seatId });
                        } catch (e) {
                            console.error('Failed to unlock seat during cleanup:', seatId, e);
                        }
                    }
                }
            };
            cleanupLocks();
        };
    }, [selectedSeats, showtimeId]);

    const handleSeatClick = async (seatId) => {
        if (!seatData) return;
        if (seatData.unavailableSeats.includes(seatId)) return;

        const isCurrentlySelected = selectedSeats.includes(seatId);

        if (!isCurrentlySelected) {
            // Check ticket count limit
            if (selectedSeats.length >= totalExpected) {
                toast.error(`En fazla seçtiğiniz bilet sayısı kadar (${totalExpected} adet) koltuk seçebilirsiniz.`);
                return;
            }

            try {
                await api.post('/reservations/lock', { showtimeId, seatId });
                setSelectedSeats([...selectedSeats, seatId]);
                // Başarılı
            } catch (err) {
                if (err.response?.status === 409) {
                    toast.error('Bu koltuk şu an başka bir müşteri tarafından kilitlendi.');
                    // Update layout to make it unavailable
                    setSeatData(prev => ({ 
                        ...prev, 
                        unavailableSeats: [...new Set([...prev.unavailableSeats, seatId])] 
                    }));
                } else {
                    toast.error(err.response?.data?.error || 'Koltuk kilitlenirken bir hata oluştu.');
                }
            }
        } else {
            // Unlock seat
            try {
                await api.post('/reservations/unlock', { showtimeId, seatId });
                setSelectedSeats(selectedSeats.filter(s => s !== seatId));
                // Başarılı
            } catch (err) {
                toast.error('Koltuk kilidi açılırken hata oluştu.');
            }
        }
    };

    const handleReserve = async () => {
        if (selectedSeats.length !== totalExpected) {
            toast.error(`Lütfen tam olarak ${totalExpected} adet koltuk seçiniz.`);
            return;
        }
        
        try {
            // Distribute seats to ticket types (Adult first, then Student)
            const seatSelections = [];
            let adultRemaining = expectedTickets.adultTickets;
            let studentRemaining = expectedTickets.studentTickets;

            selectedSeats.forEach(seatId => {
                if (adultRemaining > 0) {
                    seatSelections.push({ seatId, type: 'ADULT' });
                    adultRemaining--;
                } else if (studentRemaining > 0) {
                    seatSelections.push({ seatId, type: 'STUDENT' });
                    studentRemaining--;
                }
            });

            // Call reserve endpoint (moves locks to PENDING tickets in DB)
            await api.post('/reservations/reserve', { showtimeId, seatSelections });
            
            // Save to Zustand
            useReservationStore.getState().setReservationData({ selectedSeats });

            // Navigate to checkout and prevent component unmount cleanup from running
            setSelectedSeats([]);
            navigate(`/showtimes/${showtimeId}/checkout`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Rezervasyon işlemi başarısız oldu.');
        }
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
                <p style={{ color: 'var(--text-secondary)' }}>Koltuk haritası yükleniyor...</p>
            </div>
        );
    }

    if (!seatData) {
        return (
            <div className="glass-panel" style={{ maxWidth: '600px', margin: '50px auto', padding: '40px', textAlign: 'center' }}>
                <h1 style={{ color: 'var(--accent-color)', marginBottom: '20px' }}>Hata</h1>
                <p style={{ color: '#ef4444', marginBottom: '30px' }}>{errorMsg || 'Koltuk verileri bulunamadı.'}</p>
                <button className="btn-primary" onClick={() => navigate(-1)}>
                    Geri Dön
                </button>
            </div>
        );
    }

    const { seatLayout, unavailableSeats } = seatData;
    // seatLayout contains { rows: ["A", "B", ...], cols: 8 }
    const rows = seatLayout?.rows || ['A', 'B', 'C', 'D', 'E'];
    const cols = seatLayout?.cols || 8;

    return (
        <div className="seats-container">
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
                    gap: '8px',
                    marginRight: 'auto'
                }}
            >
                &larr; Bilet Seçimine Dön
            </button>

            <BookingSteps currentStep={3} />

            <h1 style={{ color: 'var(--accent-color)', marginBottom: '30px' }}>Koltuk Seçimi</h1>

            {/* Screen */}
            <div className="cinema-screen">
                <div className="screen-text">PERDE</div>
            </div>

            {/* Seats Grid */}
            <div style={{ overflowX: 'auto', padding: '20px 0' }}>
                <div style={{ display: 'inline-block', minWidth: '100%', textAlign: 'center' }}>
                    {rows.map(rowLabel => (
                        <div key={rowLabel} className="seat-row">
                            <div className="row-label">{rowLabel}</div>
                            
                            {Array.from({ length: cols }).map((_, i) => {
                                const seatNum = i + 1;
                                const seatId = `${rowLabel}${seatNum}`;
                                
                                const isUnavailable = unavailableSeats.includes(seatId);
                                const isSelected = selectedSeats.includes(seatId);

                                let seatClass = 'cinema-seat';
                                if (isUnavailable) seatClass += ' unavailable';
                                if (isSelected) seatClass += ' selected';

                                return (
                                    <div 
                                        key={seatId} 
                                        className={seatClass}
                                        onClick={() => handleSeatClick(seatId)}
                                        title={seatId}
                                    >
                                        {seatNum}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <SeatLegend />

            {/* Action Bar */}
            {selectedSeats.length > 0 && (
                <div className="seat-action-panel">
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Seçilen Koltuklar</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>{selectedSeats.join(', ')}</div>
                    </div>
                    <button 
                        className="btn-primary" 
                        onClick={handleReserve}
                        disabled={selectedSeats.length !== totalExpected}
                        style={{ padding: '14px 28px' }}
                    >
                        Ödemeye Geç ({selectedSeats.length} / {totalExpected}) &rarr;
                    </button>
                </div>
            )}
        </div>
    );
}
