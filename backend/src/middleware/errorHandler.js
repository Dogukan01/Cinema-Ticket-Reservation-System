const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    
    const statusCode = err.statusCode || 500;
    
    // Spesifik hata mesajlarını ayıklama
    if (err.message.includes('mevcut') || err.message.includes('bulunamadı')) {
        return res.status(409).json({ error: err.message });
    }

    res.status(statusCode).json({
        error: statusCode === 500 ? 'Sunucu hatası oluştu.' : err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;
