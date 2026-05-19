import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Invoice() {
    const { id: showtimeId } = useParams();
    const navigate = useNavigate();
    
    const [invoice, setInvoice] = useState(null);
    const [receiptId, setReceiptId] = useState('');
    const [confirmedTickets, setConfirmedTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                setLoading(true);
                setError('');
                
                // Read reservation data saved in localStorage during checkout
                const savedReceiptId = localStorage.getItem('receiptId');
                const savedTickets = localStorage.getItem('confirmedTickets');
                
                if (savedReceiptId) {
                    setReceiptId(savedReceiptId);
                }
                
                const ticketsData = savedTickets ? JSON.parse(savedTickets) : [];
                setConfirmedTickets(ticketsData);

                // Fetch invoice summary from Backend
                const res = await api.get(`/payment/invoice/${showtimeId}`);
                
                // Filter backend invoice tickets to match only the ones purchased by the current user session
                const filteredInvoice = {
                    ...res.data,
                    tickets: res.data.tickets.filter(apiTicket => 
                        ticketsData.some(savedTicket => savedTicket.id === apiTicket.id)
                    )
                };
                
                setInvoice(filteredInvoice);
                
                // Clear session booking states upon successful receipt loading
                localStorage.removeItem('receiptId');
                localStorage.removeItem('confirmedTickets');
                localStorage.removeItem('ticketSelection');
            } catch (err) {
                console.error('Invoice load error:', err);
                setError(err.response?.data?.error || 'Fatura bilgisi yüklenirken bir hata oluştu.');
            } finally {
                setLoading(false);
            }
        };

        fetchInvoice();
    }, [showtimeId]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        alert('PDF indirme özelliği yakında eklenecek.');
    };

    const handleHome = () => {
        navigate('/');
    };

    if (loading) {
        return (
            <div className="invoice-loading-spinner">
                <div className="invoice-spinner"></div>
                <p style={{ color: 'var(--text-secondary)' }}>Fatura yükleniyor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-panel" style={{ maxWidth: '600px', margin: '50px auto', padding: '40px', textAlign: 'center' }}>
                <h1 style={{ color: 'var(--accent-color)' }}>Hata</h1>
                <p style={{ color: '#ef4444', marginBottom: '30px' }}>{error}</p>
                <button 
                    className="btn-primary" 
                    onClick={handleHome}
                    style={{ width: '100%', padding: '15px' }}
                >
                    Ana Sayfaya Dön
                </button>
            </div>
        );
    }

    if (!invoice || !invoice.tickets || invoice.tickets.length === 0) {
        return (
            <div className="glass-panel" style={{ maxWidth: '600px', margin: '50px auto', padding: '40px', textAlign: 'center' }}>
                <h1 style={{ color: 'var(--accent-color)' }}>Fatura Bulunamadı</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Fatura bilgisi mevcut değil veya süresi dolmuş olabilir.</p>
                <button 
                    className="btn-primary" 
                    onClick={handleHome}
                    style={{ width: '100%', padding: '15px' }}
                >
                    Ana Sayfaya Dön
                </button>
            </div>
        );
    }

    // Format seance date
    const showtime = new Date(invoice.startTime);
    const formattedTime = showtime.toLocaleString('tr-TR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    const seatList = invoice.tickets.map(t => t.seatId).join(', ');
    const totalPrice = invoice.tickets.reduce((sum, t) => sum + parseFloat(t.price), 0);
    const ticketCount = invoice.tickets.length;

    return (
        <div className="invoice-container">
            <div className="invoice-wrapper" id="invoice-content">
                {/* Header */}
                <div className="invoice-header">
                    <div className="cinema-logo">
                        <h1 style={{ color: 'var(--accent-color)', marginBottom: '5px' }}>🎬</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>SBRS Sinema Sistemleri</p>
                    </div>
                    <div className="receipt-number">
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '5px', fontSize: '0.9rem' }}>Fatura / Referans No</p>
                        <h3 style={{ color: 'var(--accent-color)', fontFamily: 'monospace', margin: 0 }}>{receiptId || 'N/A'}</h3>
                    </div>
                </div>

                <div className="invoice-divider"></div>

                {/* Cinema & Showtime Info */}
                <div className="invoice-section">
                    <h3 className="invoice-section-title">Sinema Bilgileri</h3>
                    <div className="invoice-info-grid">
                        <div className="invoice-info-item">
                            <p className="invoice-label">Sinema</p>
                            <p className="invoice-value">{invoice.cinemaName}</p>
                        </div>
                        <div className="invoice-info-item">
                            <p className="invoice-label">Adres</p>
                            <p className="invoice-value">{invoice.cinemaLocation}</p>
                        </div>
                        <div className="invoice-info-item">
                            <p className="invoice-label">Salon</p>
                            <p className="invoice-value">{invoice.hallName}</p>
                        </div>
                    </div>
                </div>

                <div className="invoice-divider"></div>

                {/* Movie Info */}
                <div className="invoice-section">
                    <h3 className="invoice-section-title">Film Bilgileri</h3>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        {invoice.moviePoster && (
                            <div className="invoice-poster-container">
                                <img 
                                    src={invoice.moviePoster} 
                                    alt={invoice.movieTitle}
                                    style={{ 
                                        width: '100px', 
                                        height: '140px', 
                                        borderRadius: '8px',
                                        objectFit: 'cover',
                                        border: '1px solid var(--glass-border)'
                                    }}
                                />
                            </div>
                        )}
                        <div style={{ flex: 1 }}>
                            <p className="invoice-label">Film Adı</p>
                            <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '10px' }}>{invoice.movieTitle}</h2>
                            
                            <p className="invoice-label">Seans Saati</p>
                            <p className="invoice-value" style={{ marginBottom: '10px' }}>{formattedTime}</p>
                            
                            <p className="invoice-label">Süre</p>
                            <p className="invoice-value">{invoice.movieDuration} dakika</p>
                        </div>
                    </div>
                </div>

                <div className="invoice-divider"></div>

                {/* Tickets Info */}
                <div className="invoice-section">
                    <h3 className="invoice-section-title">Bilet Bilgileri</h3>
                    
                    <div className="invoice-seats-display">
                        <p className="invoice-label">Seçtiğiniz Koltuklar</p>
                        <div className="invoice-seats-box">
                            {seatList}
                        </div>
                    </div>

                    <table className="invoice-tickets-table">
                        <thead>
                            <tr>
                                <th>Koltuk No</th>
                                <th>Bilet Türü</th>
                                <th style={{ textAlign: 'right' }}>Fiyat</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.tickets.map((ticket) => (
                                <tr key={ticket.id}>
                                    <td className="invoice-seat-cell">{ticket.seatId}</td>
                                    <td>{ticket.type === 'ADULT' || ticket.ticket_type === 'ADULT' ? 'Yetişkin' : 'Öğrenci'}</td>
                                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{parseFloat(ticket.price).toFixed(2)} TL</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="invoice-divider"></div>

                {/* Total Summary */}
                <div className="invoice-total-section">
                    <div className="invoice-total-row">
                        <span>Toplam Bilet Sayısı</span>
                        <strong style={{ color: '#fff' }}>{ticketCount} adet</strong>
                    </div>
                    <div className="invoice-total-row">
                        <span>Toplam Tutar</span>
                        <strong style={{ color: 'var(--accent-color)', fontSize: '1.5rem' }}>
                            {totalPrice.toFixed(2)} TL
                        </strong>
                    </div>
                </div>

                <div className="invoice-divider"></div>

                {/* Footer */}
                <div className="invoice-footer">
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                        Biletleriniz başarıyla satın alınmıştır. İyi seyirler dileriz!
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '8px' }}>
                        Lütfen seans saatinden en az 15 dakika önce salonda olunuz.
                    </p>
                </div>
            </div>

            {/* Actions (Hidden during browser printing) */}
            <div className="invoice-button-group">
                <button 
                    className="btn-primary" 
                    onClick={handlePrint}
                >
                    🖨️ Yazdır
                </button>
                <button 
                    className="btn-primary" 
                    onClick={handleDownload}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
                >
                    📥 İndir
                </button>
                <button 
                    className="btn-primary" 
                    onClick={handleHome}
                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-color)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                >
                    🏠 Ana Sayfa
                </button>
            </div>
        </div>
    );
}
