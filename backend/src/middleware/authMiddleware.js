const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'SBRS_SUPER_SECRET_JWT_KEY';

/**
 * Gelen istekte (Header) geçerli bir JWT olup olmadığını doğrular.
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Yetkilendirme token\'ı bulunamadı. Lütfen giriş yapın.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // İstek içerisine kullanıcı bilgilerini (id, email, role) ekleriz
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token.' });
    }
};

/**
 * Belirtilen rollere sahip olmayan kullanıcıları engeller (RBAC).
 * Kullanımı: requireRoles('admin', 'cashier')
 */
const requireRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // verifyToken'dan geçip req.user oluştuğunu varsayıyoruz
        if (!req.user || !req.user.role) {
            return res.status(403).json({ error: 'Rol bilgisi eksik.' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Bu işlemi gerçekleştirmek için yetkiniz bulunmuyor.' });
        }

        next();
    };
};

module.exports = {
    verifyToken,
    requireRoles
};
