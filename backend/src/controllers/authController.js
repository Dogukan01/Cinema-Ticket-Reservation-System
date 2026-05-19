const authService = require('../services/authService');

class AuthController {
    
    /**
     * Kullanıcı Kaydı Endpoint'i
     */
    async register(req, res, next) {
        try {
            const { firstName, lastName, email, password, role, identityNumber, birthDate } = req.body;


            const newUser = await authService.register({
                firstName, lastName, email, password, role, identityNumber, birthDate
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


            const { user, token } = await authService.login(email, password);

            return res.status(200).json({
                message: 'Giriş başarılı.',
                token,
                user
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
