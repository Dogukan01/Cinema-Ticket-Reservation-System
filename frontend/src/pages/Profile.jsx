import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function Profile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null); // This will now hold a group of tickets

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchProfile = async () => {
            try {
                const res = await api.get('/user/profile');
                setProfile(res.data);
            } catch (error) {
                toast.error('Profil bilgileri yüklenirken bir hata oluştu.');
                if (error.response?.status === 401) {
                    navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const canCancel = (ticket) => {
        if (ticket.status !== 'CONFIRMED') return false;
        const startTime = new Date(ticket.start_time);
        const now = new Date();
        const diffMs = startTime - now;
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours >= 2;
    };

    const handleCancelTicket = async (e, ticketId, groupId) => {
        e.stopPropagation();
        const confirmCancel = window.confirm("Bu bileti iptal etmek istediğinize emin misiniz? Bilet için kazanılan 10 puan hesabınızdan düşülecek, kullanılan puanlar iade edilecektir.");
        if (!confirmCancel) return;

        try {
            await api.post(`/reservations/cancel/${ticketId}`);
            toast.success("Bilet başarıyla iptal edildi.");
            
            // Reload profile data
            const res = await api.get('/user/profile');
            setProfile(res.data);
            
            // Update the selected group in modal
            if (selectedTicket && selectedTicket.id === groupId) {
                const newTickets = res.data.tickets;
                const groupItems = newTickets.filter(t => `${t.start_time}_${t.created_at}` === groupId);
                if (groupItems.length > 0) {
                    setSelectedTicket({
                        ...selectedTicket,
                        items: groupItems
                    });
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "Bilet iptal edilirken bir hata oluştu.");
        }
    };

    const handleDownloadTicket = async () => {
        try {
            const element = document.getElementById('ticket-modal-content');
            if (!element) return;
            
            // Gizli butonları pdf'te göstermemek için geçici olarak sakla
            const actions = document.getElementById('ticket-modal-actions');
            if (actions) actions.style.display = 'none';

            // Tablodaki iptal butonlarını da gizle
            const cancelButtons = element.querySelectorAll('.cancel-btn-cell');
            cancelButtons.forEach(btn => btn.style.display = 'none');

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#1a1f2e'
            });

            if (actions) actions.style.display = 'flex';
            cancelButtons.forEach(btn => btn.style.display = 'table-cell');
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`SBRS_Bilet_${selectedTicket.items[0].ticket_id}.pdf`);
        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            toast.error('Bilet indirilirken bir hata oluştu.');
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px', color: 'white' }}>Yükleniyor...</div>;
    }

    if (!profile) return null;

    const { user, tickets } = profile;

    // Group tickets by showtime and creation time so multiple seats bought together show as one group
    const groupedTicketsMap = new Map();
    if (tickets) {
        tickets.forEach(ticket => {
            const key = `${ticket.start_time}_${ticket.created_at}`;
            if (!groupedTicketsMap.has(key)) {
                groupedTicketsMap.set(key, {
                    id: key,
                    movie_title: ticket.movie_title,
                    cinema_name: ticket.cinema_name,
                    hall_name: ticket.hall_name,
                    start_time: ticket.start_time,
                    poster_url: ticket.poster_url,
                    created_at: ticket.created_at,
                    items: [ticket]
                });
            } else {
                groupedTicketsMap.get(key).items.push(ticket);
            }
        });
    }
    const groupedTickets = Array.from(groupedTicketsMap.values());

    return (
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '20px' }}>
            <h1 style={{ color: 'var(--accent-color)', marginBottom: '30px' }}>Profilim</h1>
            
            <div className="glass-panel" style={{ padding: '30px', marginBottom: '40px' }}>
                <h2 style={{ color: 'white', marginBottom: '20px' }}>Kişisel Bilgiler</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '5px' }}>Ad Soyad</p>
                        <p style={{ color: 'white', fontSize: '1.2rem' }}>{user.first_name} {user.last_name}</p>
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '5px' }}>E-Posta</p>
                        <p style={{ color: 'white', fontSize: '1.2rem' }}>{user.email}</p>
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '5px' }}>Kayıt Tarihi</p>
                        <p style={{ color: 'white', fontSize: '1.2rem' }}>{new Date(user.created_at).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '5px' }}>Hesap Türü</p>
                        <p style={{ color: 'var(--accent-color)', fontSize: '1.2rem', textTransform: 'capitalize' }}>{user.role}</p>
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '5px' }}>Sadakat Puanı</p>
                        <p style={{ color: '#10b981', fontSize: '1.4rem', fontWeight: 'bold' }}>{user.loyalty_points || 0} Puan</p>
                    </div>
                </div>
            </div>

            <h2 style={{ color: 'white', marginBottom: '20px' }}>Geçmiş Biletlerim</h2>
            {groupedTickets.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Henüz satın alınmış bir biletiniz bulunmuyor.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {groupedTickets.map(group => {
                        const totalPrice = group.items.reduce((sum, t) => sum + parseFloat(t.price), 0);
                        const activeItems = group.items.filter(t => t.status !== 'CANCELLED');
                        const isCancelled = activeItems.length === 0;

                        return (
                            <div 
                                key={group.id} 
                                className="glass-panel" 
                                style={{ 
                                    padding: '20px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '20px',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    border: '1px solid transparent'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.borderColor = 'transparent';
                                }}
                                onClick={() => setSelectedTicket(group)}
                            >
                                <img 
                                    src={group.poster_url || 'https://via.placeholder.com/100x150'} 
                                    alt={group.movie_title}
                                    style={{ width: '80px', height: '120px', objectFit: 'cover', borderRadius: '8px' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ color: 'white', marginBottom: '10px' }}>{group.movie_title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '5px' }}>
                                        {group.cinema_name} - {group.hall_name}
                                    </p>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '5px' }}>
                                        Seans: <span style={{ color: 'white' }}>{new Date(group.start_time).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                    </p>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        Koltuklar: <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>{group.items.map(t => t.seat_id).join(', ')}</span> 
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                                    <p style={{ color: '#10b981', fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>
                                        {totalPrice.toFixed(2)} ₺
                                    </p>
                                    <span style={{ 
                                        padding: '5px 10px', 
                                        background: isCancelled ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', 
                                        color: isCancelled ? '#ef4444' : '#10b981', 
                                        borderRadius: '5px',
                                        fontSize: '0.9rem',
                                        fontWeight: '600'
                                    }}>
                                        {isCancelled ? 'İPTAL' : 'GEÇERLİ'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Ticket Details Modal */}
            {selectedTicket && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }} onClick={() => setSelectedTicket(null)}>
                    <div 
                        className="invoice-container" 
                        style={{ 
                            maxWidth: '650px', 
                            width: '100%', 
                            maxHeight: '90vh', 
                            overflowY: 'auto',
                            position: 'relative',
                            padding: '0'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="invoice-wrapper" id="ticket-modal-content" style={{ margin: 0, borderRadius: '12px' }}>
                            <div className="invoice-header">
                                <div className="cinema-logo">
                                    <h1 style={{ color: 'var(--accent-color)', marginBottom: '5px' }}>🎬</h1>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>SBRS Sinema</p>
                                </div>
                                <div className="receipt-number">
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '5px', fontSize: '0.9rem' }}>Referans No</p>
                                    <h3 style={{ color: 'var(--accent-color)', fontFamily: 'monospace', margin: 0 }}>
                                        {selectedTicket.items[0].ticket_id}
                                    </h3>
                                </div>
                            </div>

                            <div className="invoice-divider"></div>

                            <div className="invoice-section">
                                <h3 className="invoice-section-title">Sinema Bilgileri</h3>
                                <div className="invoice-info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                    <div className="invoice-info-item">
                                        <p className="invoice-label">Sinema</p>
                                        <p className="invoice-value">{selectedTicket.cinema_name}</p>
                                    </div>
                                    <div className="invoice-info-item">
                                        <p className="invoice-label">Salon</p>
                                        <p className="invoice-value">{selectedTicket.hall_name}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="invoice-divider"></div>

                            <div className="invoice-section">
                                <h3 className="invoice-section-title">Film Bilgileri</h3>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                    {selectedTicket.poster_url && (
                                        <div className="invoice-poster-container">
                                            <img 
                                                src={selectedTicket.poster_url} 
                                                alt={selectedTicket.movie_title}
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
                                        <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '10px' }}>{selectedTicket.movie_title}</h2>
                                        
                                        <p className="invoice-label">Seans Saati</p>
                                        <p className="invoice-value" style={{ marginBottom: '10px' }}>
                                            {new Date(selectedTicket.start_time).toLocaleString('tr-TR', { 
                                                year: 'numeric', month: 'long', day: 'numeric', 
                                                hour: '2-digit', minute: '2-digit' 
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="invoice-divider"></div>

                            <div className="invoice-section">
                                <h3 className="invoice-section-title">Bilet Detayları</h3>
                                <table className="invoice-tickets-table">
                                    <thead>
                                        <tr>
                                            <th>Koltuk No</th>
                                            <th>Bilet Türü</th>
                                            <th style={{ textAlign: 'right' }}>Fiyat</th>
                                            <th className="cancel-btn-cell" style={{ textAlign: 'right' }}>İşlem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedTicket.items.map(t => (
                                            <tr key={t.ticket_id}>
                                                <td className="invoice-seat-cell">{t.seat_id}</td>
                                                <td>{t.ticket_type === 'ADULT' ? 'Yetişkin' : 'Öğrenci'}</td>
                                                <td style={{ textAlign: 'right', fontWeight: '600' }}>{parseFloat(t.price).toFixed(2)} TL</td>
                                                <td className="cancel-btn-cell" style={{ textAlign: 'right' }}>
                                                    {t.status === 'CANCELLED' ? (
                                                        <span style={{color: '#ef4444', fontSize: '0.85rem'}}>İptal Edildi</span>
                                                    ) : canCancel(t) ? (
                                                        <button 
                                                            onClick={(e) => handleCancelTicket(e, t.ticket_id, selectedTicket.id)}
                                                            style={{ 
                                                                background: 'rgba(239, 68, 68, 0.2)', 
                                                                border: '1px solid #ef4444', 
                                                                color: '#ef4444', 
                                                                fontSize: '0.8rem',
                                                                padding: '6px 10px',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            İptal Et
                                                        </button>
                                                    ) : (
                                                        <span style={{color: '#10b981', fontSize: '0.85rem'}}>Geçerli</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="invoice-divider"></div>
                            
                            <div className="invoice-total-section">
                                <div className="invoice-total-row">
                                    <span>Toplam Tutar</span>
                                    <strong style={{ color: 'var(--accent-color)', fontSize: '1.4rem' }}>
                                        {selectedTicket.items.reduce((sum, t) => sum + parseFloat(t.price), 0).toFixed(2)} TL
                                    </strong>
                                </div>
                            </div>

                            <div id="ticket-modal-actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button 
                                    className="btn-primary" 
                                    onClick={handleDownloadTicket}
                                    style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}
                                >
                                    📥 İndir
                                </button>
                                <button 
                                    className="btn-primary" 
                                    onClick={() => setSelectedTicket(null)}
                                    style={{ flex: 1, padding: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

