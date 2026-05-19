'use client';
import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import styles from './page.module.css';

export default function Invoice({ params }) {
    const { id: showtimeId } = use(params);
    const router = useRouter();
    
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
                
                // localStorage'dan receiptId ve confirmedTickets'ı al
                const savedReceiptId = localStorage.getItem('receiptId');
                const savedTickets = localStorage.getItem('confirmedTickets');
                
                if (savedReceiptId) {
                    setReceiptId(savedReceiptId);
                }
                
                const ticketsData = savedTickets ? JSON.parse(savedTickets) : [];
                setConfirmedTickets(ticketsData);

                // Backend'den fatura detaylarını getir (sadece film/sinema info için)
                const res = await api.get(`/payment/invoice/${showtimeId}`);
                
                // API'den gelen biletleri, localStorage'daki confirmedTickets ile filtrele
                const filteredInvoice = {
                    ...res.data,
                    tickets: res.data.tickets.filter(apiTicket => 
                        ticketsData.some(savedTicket => savedTicket.id === apiTicket.id)
                    )
                };
                
                setInvoice(filteredInvoice);
                
                // localStorage'u temizle (tek seferlik kullanım)
                localStorage.removeItem('receiptId');
                localStorage.removeItem('confirmedTickets');
                localStorage.removeItem('ticketSelection');
            } catch (err) {
                setError(err.response?.data?.error || 'Fatura bilgisi yüklenirken bir hata oluştu.');
                console.error('Fatura hatası:', err);
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
        // Basit PDF indirme (gerçekte jsPDF kütüphanesi kullanılabilir)
        alert('PDF indirme özelliği yakında eklenecek.');
    };

    const handleHome = () => {
        router.push('/');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div className={styles.loadingSpinner}>
                    <div className={styles.spinner}></div>
                    <p>Fatura yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ maxWidth: '600px', margin: '50px auto', padding: '30px' }} className="glass-panel">
                <h1 style={{ textAlign: 'center', color: 'var(--accent-color)' }}>Hata</h1>
                <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '30px' }}>{error}</p>
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

    if (!invoice) {
        return (
            <div style={{ maxWidth: '600px', margin: '50px auto', padding: '30px' }} className="glass-panel">
                <p style={{ textAlign: 'center' }}>Fatura bilgisi bulunamadı.</p>
            </div>
        );
    }

    // Seans saatini formatla
    const showtime = new Date(invoice.startTime);
    const formattedTime = showtime.toLocaleString('tr-TR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    // Koltuğu formatla (virgül ile ayır)
    const seatList = invoice.tickets.map(t => t.seatId).join(', ');
    const totalPrice = invoice.tickets.reduce((sum, t) => sum + parseFloat(t.price), 0);
    const ticketCount = invoice.tickets.length;

    return (
        <div className={styles.invoiceContainer}>
            <div className={styles.invoiceWrapper} id="invoice-content">
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.cinemaLogo}>
                        <h1 style={{ color: 'var(--accent-color)', marginBottom: '5px' }}>🎬</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Cinema Ticket System</p>
                    </div>
                    <div className={styles.receiptNumber}>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '5px' }}>Fatura No</p>
                        <h2 style={{ color: 'var(--accent-color)', fontFamily: 'monospace' }}>{receiptId}</h2>
                    </div>
                </div>

                {/* Divider */}
                <div className={styles.divider}></div>

                {/* Cinema & Showtime Info */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Sinema Bilgileri</h3>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <p className={styles.label}>Sinema</p>
                            <p className={styles.value}>{invoice.cinemaName}</p>
                        </div>
                        <div className={styles.infoItem}>
                            <p className={styles.label}>Adres</p>
                            <p className={styles.value}>{invoice.cinemaLocation}</p>
                        </div>
                        <div className={styles.infoItem}>
                            <p className={styles.label}>Salon</p>
                            <p className={styles.value}>{invoice.hallName}</p>
                        </div>
                    </div>
                </div>

                <div className={styles.divider}></div>

                {/* Movie Info */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Film Bilgileri</h3>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        {invoice.moviePoster && (
                            <div className={styles.posterContainer}>
                                <img 
                                    src={invoice.moviePoster} 
                                    alt={invoice.movieTitle}
                                    style={{ 
                                        width: '100px', 
                                        height: '150px', 
                                        borderRadius: '8px',
                                        objectFit: 'cover',
                                        border: '1px solid var(--glass-border)'
                                    }}
                                />
                            </div>
                        )}
                        <div style={{ flex: 1 }}>
                            <p className={styles.label}>Film Adı</p>
                            <h2 style={{ color: 'var(--accent-color)', marginBottom: '15px' }}>{invoice.movieTitle}</h2>
                            
                            <p className={styles.label}>Seans Saati</p>
                            <p className={styles.value} style={{ marginBottom: '15px' }}>{formattedTime}</p>
                            
                            <p className={styles.label}>Süre</p>
                            <p className={styles.value}>{invoice.movieDuration} dakika</p>
                        </div>
                    </div>
                </div>

                <div className={styles.divider}></div>

                {/* Tickets Info */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Bilet Bilgileri</h3>
                    
                    <div className={styles.seatsDisplay}>
                        <p className={styles.label}>Koltuk Numaraları</p>
                        <div className={styles.seatsBox}>
                            {seatList}
                        </div>
                    </div>

                    {/* Tickets Table */}
                    <table className={styles.ticketsTable}>
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
                                    <td className={styles.seatCell}>{ticket.seatId}</td>
                                    <td>{ticket.type === 'ADULT' ? 'Yetişkin' : 'Öğrenci'}</td>
                                    <td style={{ textAlign: 'right' }}>{parseFloat(ticket.price).toFixed(2)} TL</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className={styles.divider}></div>

                {/* Total */}
                <div className={styles.totalSection}>
                    <div className={styles.totalRow}>
                        <span>Toplam Bilet Sayısı</span>
                        <strong>{ticketCount}</strong>
                    </div>
                    <div className={styles.totalRow}>
                        <span>Toplam Tutar</span>
                        <strong style={{ color: 'var(--accent-color)', fontSize: '1.5em' }}>
                            {totalPrice.toFixed(2)} TL
                        </strong>
                    </div>
                </div>

                <div className={styles.divider}></div>

                {/* Footer */}
                <div className={styles.footer}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9em', textAlign: 'center' }}>
                        Biletleriniz başarıyla satın alınmıştır.
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85em', textAlign: 'center', marginTop: '10px' }}>
                        Lütfen seans saatinden en az 15 dakika önce gişeye başvurunuz.
                    </p>
                </div>
            </div>

            {/* Buttons - Hidden in Print */}
            <div className={styles.buttonGroup}>
                <button 
                    className="btn-primary" 
                    onClick={handlePrint}
                    style={{ flex: 1 }}
                >
                    🖨️ Yazdır
                </button>
                <button 
                    className="btn-primary" 
                    onClick={handleDownload}
                    style={{ flex: 1, marginLeft: '10px' }}
                >
                    📥 İndir
                </button>
                <button 
                    className="btn-primary" 
                    onClick={handleHome}
                    style={{ flex: 1, marginLeft: '10px', background: 'rgba(255,255,255,0.1)', color: 'var(--accent-color)' }}
                >
                    🏠 Ana Sayfa
                </button>
            </div>
        </div>
    );
}
