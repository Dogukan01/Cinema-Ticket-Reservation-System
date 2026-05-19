import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';

export default function Register() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnUrl = searchParams.get('returnUrl');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        identityNumber: '',
        birthDate: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            await api.post('/auth/register', formData);
            
            // Auto Login on success
            const loginRes = await api.post('/auth/login', { 
                email: formData.email, 
                password: formData.password 
            });
            
            localStorage.setItem('token', loginRes.data.token);
            localStorage.setItem('user', JSON.stringify(loginRes.data.user));

            if (returnUrl) {
                navigate(returnUrl);
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setErrorMsg(err.response?.data?.error || 'Kayıt sırasında bir hata oluştu. Lütfen bilgilerinizi kontrol edin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', padding: '0 20px' }}>
            <div className="glass-panel" style={{ padding: '40px' }}>
                <h1 style={{ textAlign: 'center', color: 'var(--accent-color)', marginBottom: '30px', fontSize: '2rem' }}>Üye Ol</h1>
                
                {errorMsg && (
                    <div style={{ 
                        background: 'rgba(127, 29, 29, 0.4)', 
                        border: '1px solid #ef4444', 
                        color: 'white', 
                        padding: '12px 15px', 
                        borderRadius: '10px', 
                        marginBottom: '20px',
                        fontSize: '0.9rem' 
                    }}>
                        ⚠️ {errorMsg}
                    </div>
                )}

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Ad</label>
                            <input 
                                type="text" 
                                name="firstName"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="Örn: Mehmet"
                            />
                        </div>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Soyad</label>
                            <input 
                                type="text" 
                                name="lastName"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Örn: Kaya"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>E-posta Adresi</label>
                        <input 
                            type="email" 
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="mehmet@domain.com"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Parola</label>
                        <input 
                            type="password" 
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="En az 6 karakter"
                            minLength="6"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>T.C. Kimlik No</label>
                            <input 
                                type="text" 
                                name="identityNumber"
                                required
                                maxLength="11"
                                minLength="11"
                                value={formData.identityNumber}
                                onChange={handleChange}
                                placeholder="11 haneli kimlik no"
                            />
                        </div>
                        <div style={{ flex: '1 1 200px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Doğum Tarihi</label>
                            <input 
                                type="date" 
                                name="birthDate"
                                required
                                value={formData.birthDate}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="btn-primary" 
                        style={{ marginTop: '20px', padding: '15px', fontSize: '1.05rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Kayıt Yapılıyor...' : 'Üye Ol'}
                    </button>
                    
                    <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.95rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Zaten üye misiniz? </span>
                        <Link to={`/login${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`} style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: '600' }}>
                            Giriş Yap
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
