import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import BookingSteps from '../components/BookingSteps';

export default function Checkout() {
    const { id: showtimeId } = useParams();
    const navigate = useNavigate();

    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [ticketSelection, setTicketSelection] = useState(null);
    const [showtimeInfo, setShowtimeInfo] = useState(null);
    const [userPoints, setUserPoints] = useState(0);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [usePoints, setUsePoints] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [couponSuccess, setCouponSuccess] = useState('');

    useEffect(() => {
        // Load showtime and ticket selection details
        const cachedInfo = sessionStorage.getItem(`showtime_info_${showtimeId}`);
        if (cachedInfo) {
            try {
                const info = JSON.parse(cachedInfo);
                setShowtimeInfo(info);
            } catch (e) {
                console.error(e);
            }
        }

        const cachedSelection = localStorage.getItem('ticketSelection');
        if (cachedSelection) {
            try {
                const sel = JSON.parse(cachedSelection);
                setTicketSelection(sel);
            } catch (e) {
                console.error(e);
            }
        }

        // Fetch user loyalty points if logged in
        const fetchPoints = async () => {
            if (localStorage.getItem('token')) {
                try {
                    const res = await api.get('/user/profile');
                    setUserPoints(res.data.user.loyalty_points || 0);
                } catch (err) {
                    console.error('Error fetching user points:', err);
                }
            }
        };
        fetchPoints();
    }, [showtimeId]);

    const handleCardNumberChange = (e) => {
        let value = e.target.value;
        let digits = value.replace(/\D/g, '');
        if (digits.length > 16) {
            digits = digits.slice(0, 16);
        }
        let formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
        setCardNumber(formatted);
    };

    const handleExpiryChange = (e) => {
        let value = e.target.value;
        let digits = value.replace(/\D/g, '');
        if (digits.length > 4) {
            digits = digits.slice(0, 4);
        }
        let formatted = '';
        if (digits.length > 2) {
            formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        } else {
            formatted = digits;
        }
        setExpiry(formatted);
    };

    const handleCvvChange = (e) => {
        let value = e.target.value;
        let digits = value.replace(/\D/g, '');
        if (digits.length > 3) {
            digits = digits.slice(0, 3);
        }
        setCvv(digits);
    };

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        setCouponError('');
        setCouponSuccess('');
        if (!couponCode.trim()) return;

        try {
            const res = await api.post('/payment/coupon/validate', {
                couponCode,
                showtimeId
            });
            setAppliedCoupon(res.data);
            setCouponSuccess(`Kupon uygulandı! ${res.data.discountAmount} TL indirim kazandınız.`);
        } catch (err) {
            setCouponError(err.response?.data?.error || 'Kupon kodu doğrulanamadı.');
            setAppliedCoupon(null);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        if (!name.trim()) {
            setErrorMsg('Lütfen kart sahibinin adını giriniz.');
            setLoading(false);
            return;
        }

        const cleanCard = cardNumber.replace(/\D/g, '');
        if (cleanCard.length !== 16) {
            setErrorMsg('Lütfen 16 haneli geçerli bir kart numarası giriniz.');
            setLoading(false);
            return;
        }

        const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
        if (!expiry || !expiryPattern.test(expiry)) {
            setErrorMsg('Lütfen geçerli bir son kullanma tarihi giriniz (AA/YY). Örn: 08/29');
            setLoading(false);
            return;
        }

        if (cvv.length !== 3) {
            setErrorMsg('Lütfen 3 haneli geçerli bir CVV kodu giriniz.');
            setLoading(false);
            return;
        }

        try {
            const res = await api.post('/payment/pay', {
                showtimeId,
                cardNumber,
                expiryDate: expiry,
                cvv,
                couponCode: appliedCoupon ? appliedCoupon.code : null,
                usePoints
            });

            // Save results to localStorage to render in invoice screen
            localStorage.setItem('receiptId', res.data.receiptId);
            localStorage.setItem('confirmedTickets', JSON.stringify(res.data.confirmedTickets));
            navigate(`/showtimes/${showtimeId}/invoice`);
            
        } catch (error) {
            console.error('Payment error:', error);
            setErrorMsg(error.response?.data?.error || 'Ödeme işlemi sırasında bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    // Adım göstergesine tıklayınca geri git
    const handleStepClick = async (stepId) => {
        // Herhangi bir geri adıma gitmeden önce PENDING biletleri iptal et
        try {
            await api.post('/reservations/cancel-pending', { showtimeId });
        } catch (e) {
            console.warn('PENDING biletler iptal edilemedi:', e.message);
        }

        if (stepId === 3) {
            navigate(`/showtimes/${showtimeId}/seats`);
        } else if (stepId === 2) {
            navigate(`/showtimes/${showtimeId}/tickets`);
        } else if (stepId === 1) {
            const movieId = localStorage.getItem('booking_movie_id');
            if (movieId) navigate(`/movies/${movieId}/booking`);
            else navigate('/');
        }
    };

    const formatShowtimeDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const adultCount = ticketSelection?.adultTickets || 0;
    const studentCount = ticketSelection?.studentTickets || 0;
    const itemPrice = parseFloat(showtimeInfo?.price) || 0;
    const studentPrice = itemPrice * 0.8;
    const baseTotal = (adultCount * itemPrice) + (studentCount * studentPrice);

    // Coupon discount
    let couponDiscount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.discountType === 'PERCENTAGE') {
            couponDiscount = baseTotal * (appliedCoupon.discountValue / 100);
        } else if (appliedCoupon.discountType === 'FLAT') {
            couponDiscount = appliedCoupon.discountValue;
        }
        if (couponDiscount > baseTotal) couponDiscount = baseTotal;
    }

    // Points discount (10 points = 1 TL)
    const remainingAfterCoupon = baseTotal - couponDiscount;
    let pointsDiscount = 0;
    if (usePoints) {
        pointsDiscount = Math.min(userPoints / 10, remainingAfterCoupon);
        pointsDiscount = Math.floor(pointsDiscount * 10) / 10;
    }

    const totalDiscount = couponDiscount + pointsDiscount;
    const netTotal = Math.max(0, baseTotal - totalDiscount);

    return (
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
            <button 
                onClick={() => handleStepClick(3)}
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
                &larr; Koltuk Seçimine Dön
            </button>

            <BookingSteps currentStep={4} onStepClick={handleStepClick} />

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', marginTop: '30px' }} className="checkout-grid">
                {/* SOL KOLON: Özet, Kupon ve Puanlar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Sipariş Özeti */}
                    <div className="glass-panel" style={{ padding: '30px' }}>
                        <h2 style={{ color: 'var(--accent-color)', fontSize: '1.4rem', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>Sipariş Özeti</h2>
                        
                        {showtimeInfo && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{showtimeInfo.movieTitle}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                    <strong>Sinema:</strong> {showtimeInfo.cinemaName}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                    <strong>Tarih & Saat:</strong> {formatShowtimeDate(showtimeInfo.startTime)}
                                </div>
                                <div style={{ height: '1px', background: 'var(--glass-border)', margin: '10px 0' }} />
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem' }}>
                            {adultCount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <span>Tam Bilet ({adultCount} adet):</span>
                                    <span style={{ marginLeft: 'auto' }}>{(adultCount * itemPrice).toFixed(2)} TL</span>
                                </div>
                            )}
                            {studentCount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                    <span>Öğrenci Bileti ({studentCount} adet):</span>
                                    <span style={{ marginLeft: 'auto' }}>{(studentCount * studentPrice).toFixed(2)} TL</span>
                                </div>
                            )}
                            
                            <div style={{ height: '1px', background: 'var(--glass-border)', margin: '10px 0' }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '1.1rem', fontWeight: '600' }}>
                                <span>Toplam Tutar:</span>
                                <span style={{ marginLeft: 'auto' }}>{baseTotal.toFixed(2)} TL</span>
                            </div>

                            {couponDiscount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', color: '#10b981', fontWeight: '500' }}>
                                    <span>Kupon İndirimi ({appliedCoupon?.code}):</span>
                                    <span style={{ marginLeft: 'auto' }}>-{couponDiscount.toFixed(2)} TL</span>
                                </div>
                            )}

                            {pointsDiscount > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', color: '#10b981', fontWeight: '500' }}>
                                    <span>Sadakat Puanı İndirimi:</span>
                                    <span style={{ marginLeft: 'auto' }}>-{pointsDiscount.toFixed(2)} TL</span>
                                </div>
                            )}

                            {(couponDiscount > 0 || pointsDiscount > 0) && (
                                <>
                                    <div style={{ height: '1px', background: 'var(--glass-border)', margin: '10px 0' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '1.3rem', fontWeight: '800', color: 'var(--accent-color)' }}>
                                        <span>Ödenecek Tutar:</span>
                                        <span style={{ marginLeft: 'auto' }}>{netTotal.toFixed(2)} TL</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Kupon Kodu Girişi */}
                    <div className="glass-panel" style={{ padding: '25px' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: 'var(--text-primary)' }}>İndirim Kuponu</h3>
                        <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '10px' }}>
                            <input 
                                type="text"
                                placeholder="Kupon kodunu giriniz"
                                value={couponCode}
                                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                style={{ flex: 1 }}
                            />
                            <button type="submit" className="btn-primary" style={{ padding: '0 20px', borderRadius: '10px' }}>Uygula</button>
                        </form>
                        {couponError && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '8px' }}>{couponError}</p>}
                        {couponSuccess && <p style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '8px' }}>{couponSuccess}</p>}
                    </div>

                    {/* Sadakat Puanları */}
                    {localStorage.getItem('token') && userPoints > 0 && (
                        <div className="glass-panel" style={{ padding: '25px' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '10px', color: 'var(--text-primary)' }}>Sinema Sadakat Puanları</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input 
                                    type="checkbox"
                                    id="usePointsCheckbox"
                                    checked={usePoints}
                                    onChange={e => setUsePoints(e.target.checked)}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--accent-color)' }}
                                />
                                <label htmlFor="usePointsCheckbox" style={{ cursor: 'pointer', fontSize: '0.95rem' }}>
                                    Puanlarımı Kullan (Mevcut Puan: <strong>{userPoints}</strong> - <strong>{(userPoints / 10).toFixed(2)} TL</strong> indirim)
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* SAĞ KOLON: Ödeme Formu */}
                <div>
                    <div className="glass-panel" style={{ padding: '30px' }}>
                        <h2 style={{ textAlign: 'center', color: 'var(--accent-color)', marginBottom: '30px', fontSize: '1.4rem' }}>Kart Bilgileri</h2>
                        
                        {errorMsg && (
                            <div style={{ background: 'rgba(127, 29, 29, 0.4)', border: '1px solid #ef4444', color: 'white', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.95rem' }}>
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Kart Üzerindeki İsim</label>
                                <input 
                                    type="text" 
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Örn: Hakan Yılmaz"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Kart Numarası</label>
                                <input 
                                    type="text" 
                                    required
                                    value={cardNumber}
                                    onChange={handleCardNumberChange}
                                    placeholder="4242 4242 4242 4242"
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Son Kullanma</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={expiry}
                                        onChange={handleExpiryChange}
                                        placeholder="AA/YY"
                                        maxLength="5"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>CVV</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={cvv}
                                        onChange={handleCvvChange}
                                        placeholder="123"
                                        maxLength="3"
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                className="btn-primary" 
                                style={{ marginTop: '20px', padding: '16px', fontSize: '1.1rem' }}
                                disabled={loading}
                            >
                                {loading ? 'İşleminiz Yapılıyor...' : `Ödemeyi Tamamla (${(netTotal).toFixed(2)} TL)`}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            
            <style>{`
                @media (max-width: 768px) {
                    .checkout-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
