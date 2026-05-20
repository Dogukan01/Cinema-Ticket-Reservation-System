const authService = require('../services/authService');
const jwt = require('jsonwebtoken');

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
