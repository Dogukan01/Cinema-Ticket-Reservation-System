const authService = require('../services/authService');

class AuthController {
    
    /**
     * Kullanıcı Kaydı Endpoint'i
     */
    async register(req, res) {
        try {
            const { firstName, lastName, email, password, role, identityNumber, birthDate } = req.body;

            // Basit Validasyon (Gerçekte Joi/Zod gibi kütüphanelerle yapılabilir)
            if (!firstName || !lastName || !email || !password || !identityNumber) {
                return res.status(400).json({ error: 'Tüm zorunlu alanları (Ad, Soyad, Email, Parola, TC No) doldurunuz.' });
            }

            const newUser = await authService.register({
                firstName, lastName, email, password, role, identityNumber, birthDate
            });

            return res.status(201).json({
                message: 'Kullanıcı kaydı başarıyla oluşturuldu.',
                user: newUser
            });

        } catch (error) {
            console.error('Kayıt Hatası:', error.message);
            // Çakışma hataları (Örn: e-posta kullanımda) için 409
            if (error.message.includes('mevcut')) {
                return res.status(409).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Sunucu hatası oluştu.' });
        }
    }

    /**
     * Kullanıcı Girişi Endpoint'i
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'E-posta ve parola zorunludur.' });
            }

            const { user, token } = await authService.login(email, password);

            return res.status(200).json({
                message: 'Giriş başarılı.',
                token,
                user
            });

        } catch (error) {
            console.error('Giriş Hatası:', error.message);
            return res.status(401).json({ error: error.message });
        }
    }
}

module.exports = new AuthController();
