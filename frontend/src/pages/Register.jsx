import React, { useState, useEffect, useRef } from 'react';
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
        phoneNumber: '05',
        birthDay: '',
        birthMonth: '',
        birthYear: '',
        gender: '',
        password: '',
        passwordConfirm: '',
        smsAllowed: false,
        emailAllowed: false,
        kvkkAccepted: false
    });
    
    const [captchaCode, setCaptchaCode] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const canvasRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [showKvkkModal, setShowKvkkModal] = useState(false);

    const generateCaptcha = () => {
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptchaCode(code);
        setCaptchaInput('');
    };

    const drawCaptcha = (code) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background color
        ctx.fillStyle = '#23272a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add some noise lines
        for (let i = 0; i < 6; i++) {
            ctx.strokeStyle = `rgba(${Math.floor(Math.random() * 150) + 100}, ${Math.floor(Math.random() * 100) + 100}, ${Math.floor(Math.random() * 100) + 100}, 0.3)`;
            ctx.lineWidth = Math.random() * 2 + 1;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }

        // Add some noise dots
        for (let i = 0; i < 40; i++) {
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.2})`;
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw text characters with random rotation, color, and font size
        ctx.textBaseline = 'middle';
        ctx.font = "bold 24px 'Outfit', 'Inter', sans-serif";

        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            const x = 15 + i * 26;
            const y = canvas.height / 2 + (Math.random() * 8 - 4);
            const angle = (Math.random() * 30 - 15) * Math.PI / 180;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);

            ctx.fillStyle = `hsl(${Math.random() * 360}, 75%, 75%)`;
            ctx.fillText(char, 0, 0);
            ctx.restore();
        }
    };

    useEffect(() => {
        generateCaptcha();
    }, []);

    useEffect(() => {
        if (captchaCode) {
            drawCaptcha(captchaCode);
        }
    }, [captchaCode]);

    const focusAndScroll = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.focus();
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhoneChange = (e) => {
        let value = e.target.value;
        let digits = value.replace(/\D/g, '');
        
        // Ensure starts with 05
        if (!digits.startsWith('05')) {
            if (digits.startsWith('5')) {
                digits = '0' + digits;
            } else {
                digits = '05' + digits;
            }
        }
        
        // Max 11 digits
        if (digits.length > 11) {
            digits = digits.slice(0, 11);
        }
        
        // Format as 05XX XXX XX XX (e.g. 0532 123 45 67)
        let formatted = '';
        if (digits.length > 0) {
            formatted += digits.substring(0, Math.min(digits.length, 4));
        }
        if (digits.length > 4) {
            formatted += ' ' + digits.substring(4, Math.min(digits.length, 7));
        }
        if (digits.length > 7) {
            formatted += ' ' + digits.substring(7, Math.min(digits.length, 9));
        }
        if (digits.length > 9) {
            formatted += ' ' + digits.substring(9, Math.min(digits.length, 11));
        }
        
        setFormData({ ...formData, phoneNumber: formatted.trim() });
    };

    const handleCheckboxChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.checked });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        // 1. First Name
        if (!formData.firstName.trim()) {
            setErrorMsg('Lütfen adınızı giriniz.');
            focusAndScroll('firstName');
            generateCaptcha();
            return;
        }

        // 2. Last Name
        if (!formData.lastName.trim()) {
            setErrorMsg('Lütfen soyadınızı giriniz.');
            focusAndScroll('lastName');
            generateCaptcha();
            return;
        }

        // 3. Email
        if (!formData.email.trim()) {
            setErrorMsg('Lütfen e-posta adresinizi giriniz.');
            focusAndScroll('email');
            generateCaptcha();
            return;
        }

        // 4. Phone Number & TR Phone validation
        const sanitizedPhone = formData.phoneNumber.replace(/\D/g, '');
        if (!sanitizedPhone || sanitizedPhone === '05') {
            setErrorMsg('Lütfen cep telefonunuzu giriniz.');
            focusAndScroll('phoneNumber');
            generateCaptcha();
            return;
        }
        
        const trPhoneRegex = /^05[0-9]{9}$/;
        if (!trPhoneRegex.test(sanitizedPhone)) {
            setErrorMsg('Lütfen geçerli bir Türkiye telefon numarası giriniz (Örn: 05xx xxx xx xx).');
            focusAndScroll('phoneNumber');
            generateCaptcha();
            return;
        }

        // 5. Birth Date
        if (!formData.birthDay || !formData.birthMonth || !formData.birthYear) {
            setErrorMsg('Lütfen doğum tarihinizi gün, ay ve yıl olarak seçin.');
            if (!formData.birthDay) focusAndScroll('birthDay');
            else if (!formData.birthMonth) focusAndScroll('birthMonth');
            else focusAndScroll('birthYear');
            generateCaptcha();
            return;
        }

        // 6. Gender
        if (!formData.gender) {
            setErrorMsg('Lütfen cinsiyetinizi seçin.');
            focusAndScroll('gender');
            generateCaptcha();
            return;
        }

        // 7. Password
        if (!formData.password) {
            setErrorMsg('Lütfen şifre giriniz.');
            focusAndScroll('password');
            generateCaptcha();
            return;
        }

        // 8. Password Confirm
        if (!formData.passwordConfirm) {
            setErrorMsg('Lütfen şifrenizi onaylayın.');
            focusAndScroll('passwordConfirm');
            generateCaptcha();
            return;
        }

        if (formData.password !== formData.passwordConfirm) {
            setErrorMsg('Girilen şifreler birbiriyle uyuşmuyor.');
            focusAndScroll('passwordConfirm');
            generateCaptcha();
            return;
        }

        // 9. KVKK
        if (!formData.kvkkAccepted) {
            setErrorMsg('Devam etmek için KVKK onay metnini kabul etmelisiniz.');
            focusAndScroll('kvkkAccepted');
            generateCaptcha();
            return;
        }

        // 10. Captcha verification
        if (!captchaInput.trim()) {
            setErrorMsg('Lütfen güvenlik kodunu giriniz.');
            focusAndScroll('captchaInput');
            generateCaptcha();
            return;
        }

        if (captchaInput.toLowerCase() !== captchaCode.toLowerCase()) {
            setErrorMsg('Güvenlik kodunu yanlış girdiniz. Lütfen tekrar deneyin.');
            focusAndScroll('captchaInput');
            generateCaptcha();
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
                phoneNumber: formData.phoneNumber.replace(/\D/g, ''),
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
            generateCaptcha();
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
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
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
            <form onSubmit={handleRegister} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Ad & Soyad */}
                <div className="side-by-side" style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1 }}>
                        <input 
                            type="text" 
                            name="firstName"
                            id="firstName"
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
                            id="lastName"
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
                        id="email"
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
                        id="phoneNumber"
                        required
                        placeholder="Cep Telefonu (05xx xxx xx xx) *"
                        value={formData.phoneNumber}
                        onChange={handlePhoneChange}
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
                                id="birthDay"
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
                                id="birthMonth"
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
                                id="birthYear"
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
                                id="gender"
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
                                id="gender"
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
                            id="password"
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
                            id="passwordConfirm"
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
                        SBRS Cinema A.Ş.'ye verdiğim iletişim onay formundaki iletişim bilgilerimin kullanılarak, tarafıma tanıtım, kampanya, promosyon, indirim, hediye, fırsat ve SBRS Cinema Club etkinliklerine ilişkin bilgi vb. içerikte ticari ileti gönderilmesine onay veriyorum.
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
                            id="kvkkAccepted"
                            checked={formData.kvkkAccepted}
                            onChange={handleCheckboxChange}
                            className="custom-checkbox"
                            style={{ marginTop: '3px' }}
                        />
                        <span>
                            SBRS Cinema ve Sportif Tesisler İşletmeciliği A.Ş'ye verdiğim tüm kişisel bilgilerimin{' '}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setShowKvkkModal(true);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    color: 'var(--accent-color)',
                                    textDecoration: 'underline',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '0.82rem',
                                    fontFamily: 'inherit'
                                }}
                            >
                                6698 sayılı Kişisel Verilerin Korunması
                            </button>{' '}
                            Hakkındaki Kanunun kapsamı ve sınırları çerçevesinde kullanılmasına onay veriyorum.
                        </span>
                    </label>
                </div>

                {/* Real Canvas-based Captcha */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    background: '#1f2225',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '16px',
                    width: '100%',
                    boxSizing: 'border-box',
                    marginTop: '10px'
                }}>
                    <label style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600', margin: 0 }}>
                        Güvenlik Doğrulaması *
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <canvas 
                                ref={canvasRef} 
                                width="180" 
                                height="50" 
                                style={{ borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)', background: '#23272a' }}
                            />
                            <button
                                type="button"
                                onClick={generateCaptcha}
                                title="Yeni Kod Üret"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: 'none',
                                    color: '#ffffff',
                                    borderRadius: '6px',
                                    padding: '10px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                                </svg>
                            </button>
                        </div>
                        <div style={{ flex: 1, minWidth: '180px' }}>
                            <input 
                                type="text"
                                required
                                id="captchaInput"
                                value={captchaInput}
                                onChange={(e) => setCaptchaInput(e.target.value)}
                                placeholder="Görseldeki Kodu Yazınız"
                                className="sbrs-input"
                                style={{ height: '50px' }}
                            />
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

            {/* KVKK Modal */}
            {showKvkkModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#1e2225',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
                        animation: 'fadeIn 0.25s ease'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '20px 24px',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.25rem', fontWeight: '700' }}>
                                KVKK Aydınlatma Metni
                            </h3>
                            <button 
                                onClick={() => setShowKvkkModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#8e9499',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    padding: '5px'
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{
                            padding: '24px',
                            overflowY: 'auto',
                            color: '#94a3b8',
                            fontSize: '0.9rem',
                            lineHeight: '1.6',
                            flex: 1
                        }}>
                            <p style={{ marginTop: 0 }}>
                                <strong>SBRS Cinema ve Sportif Tesisler İşletmeciliği A.Ş.</strong> (“Şirket”) olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, veri sorumlusu sıfatımızla, kişisel verilerinizin güvenliğine ve gizliliğine büyük önem vermekteyiz.
                            </p>
                            <h4 style={{ color: '#ffffff', marginTop: '20px', marginBottom: '8px' }}>1. Kişisel Verilerin İşlenme Amacı</h4>
                            <p>
                                Toplanan kişisel verileriniz (ad, soyad, e-posta, telefon numarası, doğum tarihi, cinsiyet vb.), üyelik işlemlerinin tamamlanması, bilet rezervasyon ve satın alma süreçlerinin yürütülmesi, müşteri hizmetleri süreçlerinin yönetilmesi ve sizlere daha iyi bir sinema deneyimi sunulabilmesi amacıyla işlenmektedir.
                            </p>
                            <h4 style={{ color: '#ffffff', marginTop: '20px', marginBottom: '8px' }}>2. Kişisel Verilerin Aktarılması</h4>
                            <p>
                                İşlenen kişisel verileriniz, KVKK'nın 8. ve 9. maddelerinde belirtilen kişisel veri işleme şartları ve amaçları çerçevesinde, iş ortaklarımıza, tedarikçilerimize ve kanunen yetkili kamu kurum ve kuruluşlarına aktarılabilecektir.
                            </p>
                            <h4 style={{ color: '#ffffff', marginTop: '20px', marginBottom: '8px' }}>3. Haklarınız</h4>
                            <p>
                                KVKK'nın 11. maddesi uyarınca, dilediğiniz zaman Şirketimize başvurarak kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini isteme haklarına sahipsiniz.
                            </p>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '20px 24px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px'
                        }}>
                            <button
                                onClick={() => setShowKvkkModal(false)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Kapat
                            </button>
                            <button
                                onClick={() => {
                                    setFormData({ ...formData, kvkkAccepted: true });
                                    setShowKvkkModal(false);
                                }}
                                style={{
                                    background: 'var(--accent-color)',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Okudum, Onaylıyorum
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
