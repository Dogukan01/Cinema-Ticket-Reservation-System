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
            // Seçim (Kilitleme İsteği - Backend Redis)
            if (selectedSeats.length >= 6) {
                setErrorMsg('En fazla 6 adet koltuk seçebilirsiniz.');
                return;
            }

            try {
                // Token gerekiyor (Eğer token yoksa 401 hatası döner)
                await api.post('/reservations/lock', { showtimeId, seatId });
                setSelectedSeats([...selectedSeats, seatId]);
                setErrorMsg('');
            } catch (err) {
                if (err.response?.status === 401) {
                    setErrorMsg('Koltuk seçebilmek için giriş yapmalısınız!');
                } else if (err.response?.status === 409) {
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
        if (selectedSeats.length === 0) return;
        
        try {
            // PENDING bilet yaratma
            await api.post('/reservations/reserve', { showtimeId, seatIds: selectedSeats });
            alert('Koltuklar başarıyla rezerve edildi! Ödeme sayfasına yönlendiriliyorsunuz...');
            // Epic 5'te burası /checkout sayfasına gidecek. Şimdilik ana sayfaya atalım.
            router.push('/');
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
                    <button className="btn-primary" onClick={handleReserve}>
                        Seçimi Onayla ({selectedSeats.length} Bilet)
                    </button>
                </div>
            )}
        </div>
    );
}
