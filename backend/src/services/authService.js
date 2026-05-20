const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const EncryptionService = require('../utils/encryption');

// SBRS_JWT_SECRET normalde .env'den gelir. (Burada fallback veriyoruz)
const JWT_SECRET = process.env.JWT_SECRET || 'SBRS_SUPER_SECRET_JWT_KEY';
const JWT_EXPIRES_IN = '24h';

class AuthService {
    /**
     * Yeni Kullanıcı Kaydı (Register)
     */
    async register(userData) {
        const { firstName, lastName, email, password, role, identityNumber, birthDate, phoneNumber, gender, smsAllowed, emailAllowed } = userData;

        // 1. Email kontrolü (Kullanıcı zaten var mı?)
        const userExists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            throw new Error('Bu e-posta adresi ile kayıtlı bir kullanıcı zaten mevcut.');
        }

        // 2. Parolayı Hashleme (Bcrypt)
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 3. TC Kimlik Numarasını (PII) Şifreleme (AES-256-GCM)
        const encryptedIdentity = identityNumber ? EncryptionService.encrypt(identityNumber) : null;

        // 4. Veritabanına kaydetme
        const query = `
            INSERT INTO users 
            (first_name, last_name, email, password_hash, role, identity_number, birth_date, phone_number, gender, sms_allowed, email_allowed) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, first_name, last_name, email, role, phone_number, gender, sms_allowed, email_allowed
        `;
        const values = [
            firstName, 
            lastName, 
            email, 
            passwordHash, 
            role || 'customer', 
            encryptedIdentity, 
            birthDate,
            phoneNumber || null,
            gender || null,
            smsAllowed || false,
            emailAllowed || false
        ];

        const result = await db.query(query, values);
        return result.rows[0]; // Şifreler haricinde kullanıcı bilgisini döndürüyoruz
    }

    /**
     * Kullanıcı Girişi (Login)
     */
    async login(email, password) {
        // 1. Kullanıcıyı bul
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            throw new Error('Hatalı e-posta veya parola.');
        }

        const user = result.rows[0];

        // 2. Parola Doğrulama
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new Error('Hatalı e-posta veya parola.');
        }

        // 3. JWT Oluşturma
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || 'SBRS_REFRESH_SECRET', { expiresIn: '7d' });

        // Şifrelenmiş verileri client'a dönmemek için çıkarıyoruz
        delete user.password_hash;
        delete user.identity_number;
        delete user.mfa_secret;

        return {
            user,
            accessToken,
            refreshToken
        };
    }
}

module.exports = new AuthService();
