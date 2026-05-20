const authService = require('../services/authService');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail, sendLoginAlertEmail } = require('../utils/mailer');

class AuthController {
    
    /**
     * Kullanıcı Kaydı Endpoint'i
     */
    async register(req, res, next) {
        try {
            const { firstName, lastName, email, password, role, identityNumber, birthDate, phoneNumber, gender, smsAllowed, emailAllowed } = req.body;


            const newUser = await authService.register({
                firstName, lastName, email, password, role, identityNumber, birthDate, phoneNumber, gender, smsAllowed, emailAllowed
            });

            // E-posta gönderimini arka planda başlat (kullanıcıyı bekletmemek için)
            sendWelcomeEmail(newUser.email, `${newUser.first_name} ${newUser.last_name}`).catch(err => {
                console.error("Kayıt e-postası arka planda gönderilirken hata:", err);
            });

            return res.status(201).json({
                message: 'Kullanıcı kaydı başarıyla oluşturuldu.',
                user: newUser
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Kullanıcı Girişi Endpoint'i
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;


            const { user, accessToken, refreshToken } = await authService.login(email, password);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 gün
            });

            // Giriş bilgilendirme e-postasını arka planda gönder
            const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Bilinmeyen IP';
            const userAgent = req.headers['user-agent'] || 'Bilinmeyen Cihaz/Tarayıcı';
            const loginDate = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
            
            sendLoginAlertEmail(user.email, `${user.first_name} ${user.last_name}`, {
                date: loginDate,
                ipAddress,
                userAgent
            }).catch(err => {
                console.error("Giriş uyarı e-postası arka planda gönderilirken hata:", err);
            });

            return res.status(200).json({
                message: 'Giriş başarılı.',
                token: accessToken,
                user
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Yeni Access Token alma
     */
    async refresh(req, res, next) {
        try {
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) return res.status(401).json({ error: 'Refresh token bulunamadı.' });

            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'SBRS_REFRESH_SECRET', (err, decoded) => {
                if (err) return res.status(403).json({ error: 'Geçersiz refresh token.' });

                const payload = { id: decoded.id, email: decoded.email, role: decoded.role };
                const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET || 'SBRS_SUPER_SECRET_JWT_KEY', { expiresIn: '15m' });

                res.json({ token: newAccessToken });
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Güvenli Çıkış (Logout)
     */
    async logout(req, res, next) {
        try {
            res.clearCookie('refreshToken');
            res.json({ message: 'Çıkış yapıldı.' });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
