'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function Register() {
    const router = useRouter();

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
            alert('Kayıt başarılı! Lütfen giriş yapın.');
            router.push('/login');
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Kayıt sırasında bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', padding: '40px' }} className="glass-panel">
            <h1 style={{ textAlign: 'center', color: 'var(--accent-color)', marginBottom: '30px' }}>Üye Ol</h1>
            
            {errorMsg && (
                <div style={{ background: '#7f1d1d', color: 'white', padding: '10px', borderRadius: '8px', marginBottom: '20px' }}>
                    {errorMsg}
                </div>
            )}

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Ad</label>
                        <input 
                            type="text" 
                            name="firstName"
                            required
                            value={formData.firstName}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Soyad</label>
                        <input 
                            type="text" 
                            name="lastName"
                            required
                            value={formData.lastName}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>E-posta Adresi</label>
                    <input 
                        type="email" 
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Parola</label>
                    <input 
                        type="password" 
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>T.C. Kimlik No</label>
                        <input 
                            type="text" 
                            name="identityNumber"
                            required
                            maxLength="11"
                            value={formData.identityNumber}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)' }}>Doğum Tarihi</label>
                        <input 
                            type="date" 
                            name="birthDate"
                            value={formData.birthDate}
                            onChange={handleChange}
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
                    {loading ? 'Kaydediliyor...' : 'Üye Ol'}
                </button>
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Zaten üye misiniz? </span>
                    <a href="/login" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>Giriş Yap</a>
                </div>
            </form>
        </div>
    );
}
