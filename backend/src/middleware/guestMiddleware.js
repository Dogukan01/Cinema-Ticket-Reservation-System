const jwt = require('jsonwebtoken');

/**
 * Hem giriş yapmış (JWT) kullanıcıları hem de Anonim (Guest) müşterileri destekler.
 * req.user içerisine { userId, guestId, isGuest } objesini ekler.
 */
const extractUserOrGuest = (req, res, next) => {
    let authHeader = req.headers.authorization;
    let guestId = req.headers['x-guest-id'];

    req.user = {
        id: null,
        guestId: guestId || null,
        isGuest: true
    };

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SBRS_SUPER_SECRET_JWT_KEY');
            req.user.id = decoded.id;
            req.user.isGuest = false;
        } catch (error) {
            // Token geçersizse ama guestId varsa işleme devam edilebilir
            // Ya da tamamen reddedilebilir. Şimdilik misafir olarak devam etmesine izin veriyoruz.
            console.warn('Geçersiz token, misafir olarak devam ediliyor...');
        }
    }

    if (!req.user.id && !req.user.guestId) {
        return res.status(400).json({ error: 'Kimlik doğrulanamadı. (Lütfen Giriş Yapın veya Misafir ID gönderin)' });
    }

    // Ortak Identifier (Kilitlerde vs. kullanmak için)
    req.user.identifier = req.user.id || req.user.guestId;

    next();
};

module.exports = { extractUserOrGuest };
