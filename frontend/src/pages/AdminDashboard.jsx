import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalRevenue: 0, totalTickets: 0, recentTickets: [] });
    const [customers, setCustomers] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Token ve Rol kontrolü
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!token || user.role !== 'admin') {
            toast.error('Bu sayfaya erişim yetkiniz yok.');
            navigate('/');
            return;
        }

        const fetchAdminData = async () => {
            try {
                const [salesRes, customersRes] = await Promise.all([
                    api.get('/admin/sales'),
                    api.get('/admin/customers')
                ]);
                setStats(salesRes.data);
                setCustomers(customersRes.data);
            } catch (error) {
                console.error(error);
                toast.error('Veriler yüklenirken hata oluştu.');
                if (error.response?.status === 401 || error.response?.status === 403) {
                    navigate('/');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, [navigate]);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px', color: 'white' }}>Yükleniyor...</div>;
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: 'var(--accent-color)' }}>Yönetici Paneli</h1>
                <button 
                    onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        toast.success('Çıkış yapıldı.');
                        navigate('/');
                    }}
                    style={{ padding: '10px 20px', background: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                    Çıkış Yap
                </button>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={activeTab === 'dashboard' ? 'btn-primary' : ''}
                    style={{ padding: '10px 20px', background: activeTab === 'dashboard' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer' }}
                >
                    Satış Özeti
                </button>
                <button 
                    onClick={() => setActiveTab('customers')}
                    className={activeTab === 'customers' ? 'btn-primary' : ''}
                    style={{ padding: '10px 20px', background: activeTab === 'customers' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer' }}
                >
                    Müşteriler
                </button>
            </div>

            {activeTab === 'dashboard' && (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
                            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>Toplam Ciro</h3>
                            <h2 style={{ fontSize: '2.5rem', color: '#10b981', margin: 0 }}>{Number(stats.totalRevenue).toLocaleString('tr-TR')} ₺</h2>
                        </div>
                        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
                            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>Satılan Toplam Bilet</h3>
                            <h2 style={{ fontSize: '2.5rem', color: '#3b82f6', margin: 0 }}>{stats.totalTickets}</h2>
                        </div>
                    </div>

                    <h2 style={{ color: 'white', marginBottom: '20px' }}>Son Bilet Satışları</h2>
                    <div className="glass-panel" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Bilet ID</th>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Kullanıcı</th>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Film</th>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Tutar</th>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Tarih</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentTickets.map(t => (
                                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '15px' }}>#{t.id}</td>
                                        <td style={{ padding: '15px' }}>{t.first_name} {t.last_name}</td>
                                        <td style={{ padding: '15px' }}>{t.movie_title}</td>
                                        <td style={{ padding: '15px', color: '#10b981' }}>{t.price} ₺</td>
                                        <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>{new Date(t.created_at).toLocaleString('tr-TR')}</td>
                                    </tr>
                                ))}
                                {stats.recentTickets.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Henüz satış bulunmuyor.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'customers' && (
                <div>
                    <h2 style={{ color: 'white', marginBottom: '20px' }}>Kayıtlı Müşteriler</h2>
                    <div className="glass-panel" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)' }}>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>ID</th>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Ad Soyad</th>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>E-Posta</th>
                                    <th style={{ padding: '15px', textAlign: 'left' }}>Kayıt Tarihi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map(c => (
                                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '15px' }}>{c.id}</td>
                                        <td style={{ padding: '15px' }}>{c.first_name} {c.last_name}</td>
                                        <td style={{ padding: '15px' }}>{c.email}</td>
                                        <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>{new Date(c.created_at).toLocaleDateString('tr-TR')}</td>
                                    </tr>
                                ))}
                                {customers.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Kayıtlı müşteri bulunmuyor.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
