'use client'; // Etkileşimli bir sayfa olduğu için Client Component kullanıyoruz

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import styles from './page.module.css';

export default function SeatSelection({ params }) {
    const { id: showtimeId } = use(params);
    const router = useRouter();

    const [seatData, setSeatData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');
    const [expectedTickets, setExpectedTickets] = useState({ adultTickets: 0, studentTickets: 0 });

    useEffect(() => {
        const saved = localStorage.getItem('ticketSelection');
        if (saved) {
            setExpectedTickets(JSON.parse(saved));
        } else {
            router.push(`/showtimes/${showtimeId}/tickets`);
        }
    }, [router, showtimeId]);

    const totalExpected = expectedTickets.adultTickets + expectedTickets.studentTickets;

    // Koltuk verilerini Backend'den çek
    useEffect(() => {
        const fetchSeats = async () => {
            try {
                // Şimdilik token göndermeden sadece GET atıyoruz (Herkese açık demiştik)
                const res = await api.get(`/reservations/showtimes/${showtimeId}/seats`);
                setSeatData(res.data);
            } catch (err) {
                setErrorMsg('Koltuk verileri yüklenirken bir hata oluştu.');
            } finally {
                setLoading(false);
            }
        };
        fetchSeats();
    }, [showtimeId]);

    // Koltuğa tıklandığında (Seçme / Kaldırma)
    const handleSeatClick = async (seatId) => {
        // Eğer zaten unavailable ise hiçbir şey yapma
        if (seatData.unavailableSeats.includes(seatId)) return;

        const isCurrentlySelected = selectedSeats.includes(seatId);

        if (!isCurrentlySelected) {
            // Seçim sınırı kontrolü (Kullanıcının bilet sayısına göre)
            if (selectedSeats.length >= totalExpected) {
                setErrorMsg(`En fazla ${totalExpected} adet koltuk seçebilirsiniz.`);
                return;
            }

            try {
                await api.post('/reservations/lock', { showtimeId, seatId });
                setSelectedSeats([...selectedSeats, seatId]);
                setErrorMsg('');
            } catch (err) {
                if (err.response?.status === 409) {
                    setErrorMsg('Bu koltuk şu an başka bir müşteri tarafından kilitlendi.');
                    // Ekrandaki durumu güncelle (Başkası aldıysa unavailable yap)
                    setSeatData(prev => ({ ...prev, unavailableSeats: [...prev.unavailableSeats, seatId] }));
                } else {
                    setErrorMsg(err.response?.data?.error || 'Bir hata oluştu.');
                }
            }
        } else {
            // Seçimi Kaldırma (Kilidi Açma İsteği)
            try {
                await api.post('/reservations/unlock', { showtimeId, seatId });
                setSelectedSeats(selectedSeats.filter(s => s !== seatId));
                setErrorMsg('');
            } catch (err) {
                setErrorMsg('Koltuk kilidi açılırken hata oluştu.');
            }
        }
    };

    const handleReserve = async () => {
        if (selectedSeats.length !== totalExpected) {
            setErrorMsg(`Lütfen tam olarak ${totalExpected} adet koltuk seçiniz.`);
            return;
        }
        
        try {
            // Seçilen koltukları Öğrenci ve Yetişkin tiplerine bölüştürüyoruz
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

            // PENDING bilet yaratma
            await api.post('/reservations/reserve', { showtimeId, seatSelections });
            router.push(`/showtimes/${showtimeId}/checkout`);
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Rezervasyon başarısız.');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '100px' }}>Koltuklar Yükleniyor...</div>;
    if (!seatData) return <div style={{ textAlign: 'center', marginTop: '100px' }}>{errorMsg}</div>;

    const { seatLayout, unavailableSeats } = seatData;
    const { rows, cols } = seatLayout; // Örn: rows = ['A','B','C','D','E'], cols = 8

    return (
        <div className={styles.container}>
            <h1 style={{ marginBottom: '40px', color: 'var(--accent-color)' }}>Koltuk Seçimi</h1>
            
            {/* Hata Mesajı Barı */}
            {errorMsg && (
                <div style={{ background: '#7f1d1d', color: 'white', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>
                    {errorMsg}
                </div>
            )}

            {/* Kavisli Sinema Perdesi */}
            <div className={styles.screen}>
                <div className={styles.screenText}>PERDE</div>
            </div>

            {/* Koltuk Matrisi */}
            <div style={{ display: 'inline-block', textAlign: 'left' }}>
                {rows.map(rowLabel => (
                    <div key={rowLabel} className={styles.seatRow}>
                        <div className={styles.rowLabel}>{rowLabel}</div>
                        
                        {Array.from({ length: cols }).map((_, i) => {
                            const seatNum = i + 1;
                            const seatId = `${rowLabel}${seatNum}`; // Örn: A1
                            
                            const isUnavailable = unavailableSeats.includes(seatId);
                            const isSelected = selectedSeats.includes(seatId);

                            let seatClass = styles.seat;
                            if (isUnavailable) seatClass += ` ${styles.unavailable}`;
                            if (isSelected) seatClass += ` ${styles.selected}`;

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

            {/* İkon / Renk Anlatımı (Legend) */}
            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <div className={styles.legendBox} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}></div>
                    <span>Boş</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendBox} style={{ background: '#eab308' }}></div>
                    <span>Sizin Seçiminiz</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendBox} style={{ background: '#334155' }}></div>
                    <span>Dolu / Kilitli</span>
                </div>
            </div>

            {/* Alt Aksiyon Çubuğu */}
            {selectedSeats.length > 0 && (
                <div className={styles.actionPanel}>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Seçilen Koltuklar</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedSeats.join(', ')}</div>
                    </div>
                    <button 
                        className="btn-primary" 
                        onClick={handleReserve}
                        disabled={selectedSeats.length !== totalExpected}
                        style={{ opacity: selectedSeats.length !== totalExpected ? 0.5 : 1, cursor: selectedSeats.length !== totalExpected ? 'not-allowed' : 'pointer' }}
                    >
                        Ödemeye Geç
                    </button>
                </div>
            )}
        </div>
    );
}
