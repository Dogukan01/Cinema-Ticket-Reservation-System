const crypto = require('crypto');

// AES-256-GCM ayarları
const ALGORITHM = 'aes-256-gcm';
// Gerçek ortamda bu anahtar kesinlikle .env dosyasından gelmeli ve 32 byte (256 bit) olmalıdır.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex').substring(0, 32); 

const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

class EncryptionService {
  /**
   * Metni (Örn: TC Kimlik No, Kredi Kartı) AES-256-GCM ile şifreler.
   * @param {string} text - Şifrelenecek düz metin
   * @returns {string} - Salt, IV, Tag ve Şifreli metni içeren Hex formatında string
   */
  static encrypt(text) {
    if (!text) return text;
    
    // Her işlem için rastgele salt ve IV (Initialization Vector) üretilir.
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Anahtar ve salt ile güçlü bir şifreleme anahtarı türetilir
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512');

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Çözme işlemi için gerekli tüm bileşenleri birleştirip tek bir string olarak döndürüyoruz
    return Buffer.concat([salt, iv, tag, encrypted]).toString('hex');
  }

  /**
   * AES-256-GCM ile şifrelenmiş metnin şifresini çözer.
   * @param {string} encryptedText - Şifreli hex metin
   * @returns {string} - Çözülmüş orijinal metin
   */
  static decrypt(encryptedText) {
    if (!encryptedText) return encryptedText;
    
    try {
      const stringValue = Buffer.from(encryptedText, 'hex');
      
      const salt = stringValue.subarray(0, SALT_LENGTH);
      const iv = stringValue.subarray(SALT_LENGTH, TAG_POSITION);
      const tag = stringValue.subarray(TAG_POSITION, ENCRYPTED_POSITION);
      const encrypted = stringValue.subarray(ENCRYPTED_POSITION);

      const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, 100000, 32, 'sha512');

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);

      return decipher.update(encrypted) + decipher.final('utf8');
    } catch (error) {
      console.error('Şifre çözme hatası:', error.message);
      throw new Error('Veri şifresi çözülemedi. Veri bozulmuş olabilir veya güvenlik ihlali var.');
    }
  }
}

module.exports = EncryptionService;
