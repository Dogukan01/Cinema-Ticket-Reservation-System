'use client';
import { useState, use } from 'react';
import { useRouter } from 'next/navigation';

export default function TicketSelection({ params }) {
    const { id: showtimeId } = use(params);
    const router = useRouter();

    const [adultTickets, setAdultTickets] = useState(0);
    const [studentTickets, setStudentTickets] = useState(0);

    const basePrice = 150; // Normalde Backend'den gelmeli
    const studentPrice = basePrice * 0.8;

    const totalTickets = adultTickets + studentTickets;
    const totalPrice = (adultTickets * basePrice) + (studentTickets * studentPrice);

    const handleContinue = () => {
        if (totalTickets === 0) {
            alert('Lütfen en az 1 bilet seçiniz.');
            return;
        }
        if (totalTickets > 6) {
            alert('En fazla 6 bilet seçebilirsiniz.');
            return;
        }

        // Bilet verilerini session/localStorage'a kaydet (Seat selection sayfasında kullanmak için)
        // Ya da URL parametresi yapabiliriz. En temizi localStorage
        localStorage.setItem('ticketSelection', JSON.stringify({ adultTickets, studentTickets }));
        router.push(`/showtimes/${showtimeId}/seats`);
    };

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', padding: '30px' }} className="glass-panel">
            <h1 style={{ textAlign: 'center', color: 'var(--accent-color)', marginBottom: '30px' }}>Bilet Seçimi</h1>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                    <h3 style={{ margin: 0 }}>Yetişkin</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{basePrice} TL</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button className="btn-primary" onClick={() => setAdultTickets(Math.max(0, adultTickets - 1))} style={{ padding: '5px 15px' }}>-</button>
                    <span style={{ fontSize: '1.2rem', width: '20px', textAlign: 'center' }}>{adultTickets}</span>
                    <button className="btn-primary" onClick={() => setAdultTickets(Math.min(6 - studentTickets, adultTickets + 1))} style={{ padding: '5px 15px' }}>+</button>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h3 style={{ margin: 0 }}>Öğrenci</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{studentPrice} TL</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button className="btn-primary" onClick={() => setStudentTickets(Math.max(0, studentTickets - 1))} style={{ padding: '5px 15px' }}>-</button>
                    <span style={{ fontSize: '1.2rem', width: '20px', textAlign: 'center' }}>{studentTickets}</span>
                    <button className="btn-primary" onClick={() => setStudentTickets(Math.min(6 - adultTickets, studentTickets + 1))} style={{ padding: '5px 15px' }}>+</button>
                </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Toplam ({totalTickets} Bilet)</p>
                    <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>{totalPrice} TL</h2>
                </div>
                <button 
                    className="btn-primary" 
                    onClick={handleContinue}
                    disabled={totalTickets === 0}
                    style={{ opacity: totalTickets === 0 ? 0.5 : 1, cursor: totalTickets === 0 ? 'not-allowed' : 'pointer' }}
                >
                    Koltuk Seçimine Geç
                </button>
            </div>
        </div>
    );
}
