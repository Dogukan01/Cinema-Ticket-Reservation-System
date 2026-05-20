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
        phoneNumber: '',
        birthDay: '',
        birthMonth: '',
        birthYear: '',
        gender: '',
        password: '',
        passwordConfirm: '',
        smsAllowed: false,
        emailAllowed: false,
        kvkkAccepted: false,
        recaptchaChecked: false
    });
    
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.checked });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.passwordConfirm) {
            setErrorMsg('Girilen şifreler birbiriyle uyuşmuyor.');
            return;
        }

        if (!formData.birthDay || !formData.birthMonth || !formData.birthYear) {
            setErrorMsg('Lütfen doğum tarihinizi gün, ay ve yıl olarak seçin.');
            return;
        }

        if (!formData.gender) {
            setErrorMsg('Lütfen cinsiyetinizi seçin.');
            return;
        }

        if (!formData.kvkkAccepted) {
            setErrorMsg('Devam etmek için KVKK onay metnini kabul etmelisiniz.');
            return;
        }

        if (!formData.recaptchaChecked) {
            setErrorMsg('Lütfen robot olmadığınızı doğrulayın.');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            // ISO Date format: YYYY-MM-DD
            const birthDate = `${formData.birthYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`;
            
            const registerPayload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                phoneNumber: formData.phoneNumber,
                birthDate,
                gender: formData.gender,
                smsAllowed: formData.smsAllowed,
                emailAllowed: formData.emailAllowed
            };

            await api.post('/auth/register', registerPayload);
            
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

    // Days 1-31
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    
    // Months (Turkish)
    const months = [
        { value: 1, label: 'Ocak' },
        { value: 2, label: 'Şubat' },
        { value: 3, label: 'Mart' },
        { value: 4, label: 'Nisan' },
        { value: 5, label: 'Mayıs' },
        { value: 6, label: 'Haziran' },
        { value: 7, label: 'Temmuz' },
        { value: 8, label: 'Ağustos' },
        { value: 9, label: 'Eylül' },
        { value: 10, label: 'Ekim' },
        { value: 11, label: 'Kasım' },
        { value: 12, label: 'Aralık' }
    ];

    // Years from 2026 down to 1920
    const years = Array.from({ length: 107 }, (_, i) => 2026 - i);

    return (
        <div style={{ maxWidth: '640px', margin: '40px auto', padding: '0 20px', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            
            {/* Custom CSS styles */}
            <style>{`
                .sbrs-input {
                    background: #33373b !important;
                    border: 1px solid rgba(255, 255, 255, 0.05) !important;
                    border-radius: 8px !important;
                    color: #ffffff !important;
                    padding: 14px 18px !important;
                    font-size: 0.95rem !important;
                    width: 100% !important;
                    height: 50px !important;
                    box-sizing: border-box !important;
                    transition: all 0.2s ease !important;
                }
                .sbrs-input::placeholder {
                    color: #9ba0a5 !important;
                    opacity: 0.8 !important;
                }
                .sbrs-input:focus {
                    border-color: var(--accent-color) !important;
                    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
                    outline: none !important;
                }
                .sbrs-select {
                    background: #33373b !important;
                    border: 1px solid rgba(255, 255, 255, 0.05) !important;
                    border-radius: 8px !important;
                    color: #ffffff !important;
                    padding: 0 18px !important;
                    font-size: 0.95rem !important;
                    width: 100% !important;
                    height: 50px !important;
                    box-sizing: border-box !important;
                    cursor: pointer !important;
                    appearance: none !important;
                    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ba0a5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") !important;
                    background-repeat: no-repeat !important;
                    background-position: right 18px center !important;
                    background-size: 16px !important;
                    transition: all 0.2s ease !important;
                }
                .sbrs-select:focus {
                    border-color: var(--accent-color) !important;
                    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
                    outline: none !important;
                }
                .custom-radio {
                    appearance: none !important;
                    width: 18px !important;
                    height: 18px !important;
                    border: 2px solid #94a3b8 !important;
                    border-radius: 50% !important;
                    outline: none !important;
                    cursor: pointer !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: all 0.2s ease !important;
                    margin: 0 !important;
                    background: transparent !important;
                    position: relative !important;
                }
                .custom-radio:checked {
                    border-color: var(--accent-color) !important;
                    background-color: var(--accent-color) !important;
                }
                .custom-radio:checked::after {
                    content: '' !important;
                    width: 6px !important;
                    height: 6px !important;
                    background-color: #1c1c1c !important;
                    border-radius: 50% !important;
                    display: block !important;
                    position: absolute !important;
                }
                .custom-checkbox {
                    appearance: none !important;
                    width: 18px !important;
                    height: 18px !important;
                    border: 2px solid #94a3b8 !important;
                    border-radius: 4px !important;
                    outline: none !important;
                    cursor: pointer !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: all 0.2s ease !important;
                    margin: 0 !important;
                    background: transparent !important;
                    position: relative !important;
                }
                .custom-checkbox:checked {
                    border-color: var(--accent-color) !important;
                    background-color: var(--accent-color) !important;
                }
                .custom-checkbox:checked::after {
                    content: "✓" !important;
                    color: #ffffff !important;
                    font-size: 12px !important;
                    font-weight: bold !important;
                    display: block !important;
                }
                .sbrs-submit-btn:hover:not(:disabled) {
                    background-color: var(--accent-hover) !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 6px 20px var(--accent-glow) !important;
                }
                .sbrs-submit-btn:active:not(:disabled) {
                    transform: translateY(0) !important;
                }
                .sbrs-submit-btn:disabled {
                    opacity: 0.6 !important;
                    cursor: not-allowed !important;
                }
                @media (max-width: 600px) {
                    .side-by-side {
                        flex-direction: column !important;
                        gap: 15px !important;
                    }
                }
            `}</style>

            {/* Logo Section */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px solid var(--accent-color)',
                    padding: '5px 14px',
                    borderRadius: '30px',
                    fontWeight: '800',
                    fontSize: '1.25rem',
                    letterSpacing: '1px',
                    background: 'rgba(0, 0, 0, 0.2)'
                }}>
                    <span style={{ color: 'var(--accent-color)', marginRight: '8px' }}>🎬 SBRS</span>
                    <span style={{ color: '#ffffff' }}>CINEMA</span>
                </div>
            </div>

            {/* Heading */}
            <h1 style={{
                textAlign: 'center',
                color: '#ffffff',
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '35px',
                letterSpacing: '-0.5px'
            }}>SBRS Cinema Club'a Hoş Geldiniz</h1>

            {/* Navigation Tabs */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '40px',
                marginBottom: '30px',
                borderBottom: '2px solid rgba(255,255,255,0.08)'
            }}>
                <Link to={`/login${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`} style={{
                    color: '#8e9499',
                    textDecoration: 'none',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    paddingBottom: '12px',
                    borderBottom: '3px solid transparent',
                    transition: 'all 0.2s ease'
                }}>Giriş Yap</Link>
                <span style={{
                    color: '#ffffff',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    paddingBottom: '12px',
                    borderBottom: '3px solid #ffffff',
                    cursor: 'default'
                }}>Üye Ol</span>
            </div>

            {/* Error Message */}
            {errorMsg && (
                <div style={{ 
                    background: 'rgba(239, 68, 68, 0.15)', 
                    border: '1px solid #ef4444', 
                    color: '#f87171', 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    marginBottom: '20px',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span>⚠️</span> {errorMsg}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Ad & Soyad */}
                <div className="side-by-side" style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1 }}>
                        <input 
                            type="text" 
                            name="firstName"
                            required
                            placeholder="Adın *"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="sbrs-input"
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <input 
                            type="text" 
                            name="lastName"
                            required
                            placeholder="Soyadın *"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="sbrs-input"
                        />
                    </div>
                </div>

                {/* E-Posta */}
                <div>
                    <input 
                        type="email" 
                        name="email"
                        required
                        placeholder="E-Posta *"
                        value={formData.email}
                        onChange={handleChange}
                        className="sbrs-input"
                    />
                </div>

                {/* Cep Telefonu */}
                <div>
                    <input 
                        type="tel" 
                        name="phoneNumber"
                        required
                        placeholder="Cep Telefonu *"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="sbrs-input"
                    />
                </div>

                {/* Doğum Tarihi */}
                <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '8px', fontWeight: '600' }}>
                        Doğum Tarihi
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                            <select 
                                name="birthDay"
                                required
                                value={formData.birthDay}
                                onChange={handleChange}
                                className="sbrs-select"
                            >
                                <option value="" disabled>Gün</option>
                                {days.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1.5 }}>
                            <select 
                                name="birthMonth"
                                required
                                value={formData.birthMonth}
                                onChange={handleChange}
                                className="sbrs-select"
                            >
                                <option value="" disabled>Ay</option>
                                {months.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1.2 }}>
                            <select 
                                name="birthYear"
                                required
                                value={formData.birthYear}
                                onChange={handleChange}
                                className="sbrs-select"
                            >
                                <option value="" disabled>Yıl</option>
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Cinsiyet */}
                <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.9rem', marginBottom: '8px', fontWeight: '600' }}>
                        Cinsiyet
                    </label>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', cursor: 'pointer' }}>
                            <input 
                                type="radio" 
                                name="gender" 
                                value="Kadın"
                                checked={formData.gender === 'Kadın'}
                                onChange={handleChange}
                                className="custom-radio"
                            />
                            Kadın
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', cursor: 'pointer' }}>
                            <input 
                                type="radio" 
                                name="gender" 
                                value="Erkek"
                                checked={formData.gender === 'Erkek'}
                                onChange={handleChange}
                                className="custom-radio"
                            />
                            Erkek
                        </label>
                    </div>
                </div>

                {/* Şifre & Şifre Tekrar */}
                <div className="side-by-side" style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            name="password"
                            required
                            placeholder="Şifre *"
                            value={formData.password}
                            onChange={handleChange}
                            className="sbrs-input"
                            style={{ paddingRight: '45px' }}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '15px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#9ba0a5',
                                display: 'flex',
                                alignItems: 'center',
                                padding: 0
                            }}
                        >
                            {showPassword ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            )}
                        </button>
                    </div>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input 
                            type={showPasswordConfirm ? 'text' : 'password'} 
                            name="passwordConfirm"
                            required
                            placeholder="Şifre Tekrar *"
                            value={formData.passwordConfirm}
                            onChange={handleChange}
                            className="sbrs-input"
                            style={{ paddingRight: '45px' }}
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                            style={{
                                position: 'absolute',
                                right: '15px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#9ba0a5',
                                display: 'flex',
                                alignItems: 'center',
                                padding: 0
                            }}
                        >
                            {showPasswordConfirm ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Consent Forms */}
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    
                    {/* Marketing Text */}
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.4', margin: 0 }}>
                        SBRS Cinema Turizm ve Sportif Tesisler İşl. A.Ş' ye verdiğim iletişim onay formundaki iletişim bilgilerimin kullanılarak, tarafıma tanıtım, kampanya, promosyon, indirim, hediye, fırsat ve SBRS Cinema Club etkinliklerine ilişkin bilgi vb. içerikte ticari ileti gönderilmesine onay veriyorum.
                    </p>

                    {/* Marketing SMS & Email Checkboxes */}
                    <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ffffff', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                name="smsAllowed"
                                checked={formData.smsAllowed}
                                onChange={handleCheckboxChange}
                                className="custom-checkbox"
                            />
                            SMS Almak İstiyorum.
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ffffff', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input 
                                type="checkbox" 
                                name="emailAllowed"
                                checked={formData.emailAllowed}
                                onChange={handleCheckboxChange}
                                className="custom-checkbox"
                            />
                            E-Posta Almak İstiyorum.
                        </label>
                    </div>

                    {/* KVKK Checkbox */}
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#ffffff', fontSize: '0.82rem', cursor: 'pointer', lineHeight: '1.4' }}>
                        <input 
                            type="checkbox" 
                            name="kvkkAccepted"
                            required
                            checked={formData.kvkkAccepted}
                            onChange={handleCheckboxChange}
                            className="custom-checkbox"
                            style={{ marginTop: '3px' }}
                        />
                        <span>
                            SBRS Cinema ve Sportif Tesisler İşletmeciliği A.Ş'ye verdiğim tüm kişisel bilgilerimin{' '}
                            <a href="#" onClick={(e) => e.preventDefault()} style={{ color: 'var(--accent-color)', textDecoration: 'underline', fontWeight: '600' }}>
                                6698 sayılı Kişisel Verilerin Korunması
                            </a>{' '}
                            Hakkındaki Kanunun kapsamı ve sınırları çerçevesinde kullanılmasına onay veriyorum.
                        </span>
                    </label>
                </div>

                {/* reCAPTCHA Mock */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#f9f9f9',
                    border: '1px solid #d3d3d3',
                    borderRadius: '3px',
                    padding: '10px 14px',
                    width: '302px',
                    height: '76px',
                    margin: '15px auto',
                    boxShadow: '0px 1px 4px rgba(0,0,0,0.08)'
                }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', margin: 0, width: 'auto' }}>
                        <input 
                            type="checkbox" 
                            checked={formData.recaptchaChecked}
                            onChange={(e) => setFormData({ ...formData, recaptchaChecked: e.target.checked })}
                            style={{ width: '24px', height: '24px', cursor: 'pointer', margin: 0 }}
                        />
                        <span style={{ color: '#000000', fontSize: '13px', fontFamily: 'Roboto, Arial, sans-serif', fontWeight: '400' }}>
                            Ben robot değilim
                        </span>
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                            src="https://www.gstatic.com/recaptcha/api2/logo_48.png" 
                            alt="reCAPTCHA" 
                            style={{ width: '32px', height: '32px' }}
                        />
                        <span style={{ color: '#555555', fontSize: '8px', marginTop: '2px', fontFamily: 'Roboto, Arial, sans-serif' }}>
                            reCAPTCHA
                        </span>
                        <div style={{ display: 'flex', gap: '3px', fontSize: '8px', color: '#555555', fontFamily: 'Roboto, Arial, sans-serif' }}>
                            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#555555', textDecoration: 'none' }}>Gizlilik</a>
                            <span>•</span>
                            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#555555', textDecoration: 'none' }}>Koşullar</a>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <button 
                    type="submit" 
                    disabled={loading}
                    className="sbrs-submit-btn"
                    style={{
                        width: '100%',
                        backgroundColor: 'var(--accent-color)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '16px',
                        borderRadius: '30px',
                        fontSize: '1.1rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        marginTop: '10px',
                        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                        transition: 'all 0.2s ease',
                        fontFamily: "'Outfit', sans-serif"
                    }}
                >
                    {loading ? 'Kayıt Yapılıyor...' : "SBRS Cinema Club'a Üye Ol"}
                </button>
                
            </form>
        </div>
    );
}
