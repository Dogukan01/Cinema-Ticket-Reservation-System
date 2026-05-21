import React, { useState } from 'react';
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
                cvv
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

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
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

            <div className="glass-panel" style={{ padding: '40px', maxWidth: '500px', margin: '0 auto' }}>
                <h1 style={{ textAlign: 'center', color: 'var(--accent-color)', marginBottom: '30px', fontSize: '1.8rem' }}>Güvenli Ödeme</h1>
                
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
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Kart Numarası (Test için 16 haneli herhangi bir numara girebilirsiniz)</label>
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
                        {loading ? 'İşleminiz Yapılıyor...' : 'Ödemeyi Tamamla'}
                    </button>
                </form>
            </div>
        </div>
    );
}
