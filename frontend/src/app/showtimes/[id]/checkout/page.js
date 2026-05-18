'use client';
import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function Checkout({ params }) {
    const { id: showtimeId } = use(params);
    const router = useRouter();

    const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242'); // Test için otomatik doldurulmuş
    const [expiry, setExpiry] = useState('12/26');
    const [cvv, setCvv] = useState('123');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handlePayment = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const res = await api.post('/payment/pay', {
                showtimeId,
                cardNumber,
                expiryDate: expiry,
                cvv
            });

            // Başarılı ödeme -> Sonuç Ekranına
            alert('Ödeme Başarılı! Fatura numaranız: ' + res.data.receiptId);
            // Şimdilik ana sayfaya dön, sonra Invoice sayfası eklenebilir
            router.push('/');
            
        } catch (error) {
            setErrorMsg(error.response?.data?.error || 'Ödeme sırasında hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '50px auto', padding: '30px' }} className="glass-panel">
            <h1 style={{ textAlign: 'center', color: 'var(--accent-color)', marginBottom: '30px' }}>Güvenli Ödeme</h1>
            
            {errorMsg && (
                <div style={{ background: '#7f1d1d', color: 'white', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>
                    {errorMsg}
                </div>
            )}

            <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Kart Üzerindeki İsim</label>
                    <input 
                        type="text" 
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                        placeholder="Örn: Ali Yılmaz"
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Kart Numarası (Test: 4242 4242...)</label>
                    <input 
                        type="text" 
                        required
                        value={cardNumber}
                        onChange={e => setCardNumber(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Son Kullanma</label>
                        <input 
                            type="text" 
                            required
                            value={expiry}
                            onChange={e => setExpiry(e.target.value)}
                            placeholder="AA/YY"
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>CVV</label>
                        <input 
                            type="text" 
                            required
                            value={cvv}
                            onChange={e => setCvv(e.target.value)}
                            placeholder="123"
                            maxLength="4"
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ marginTop: '20px', padding: '15px' }}
                    disabled={loading}
                >
                    {loading ? 'İşleniyor...' : 'Ödemeyi Tamamla'}
                </button>
            </form>
        </div>
    );
}
