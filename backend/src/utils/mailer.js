const nodemailer = require('nodemailer');

// Not: Gerçek bir SMTP sunucusu olmadığı için geliştirme ortamında nodemailer Ethereal kullanabiliriz
// veya kullanıcının env ayarlarına göre konfigüre edebiliriz.
// Ethereal, test için geçici e-posta hesapları oluşturur.
const createTransporter = async () => {
    // Eğer env değişkenlerinde SMTP varsa onu kullan, yoksa test hesabı oluştur
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_PORT == 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // Geliştirme ortamı için sahte (ethereal) hesap oluştur
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
};

const sendTicketEmail = async (toEmail, userName, ticketDetails) => {
    const transporter = await createTransporter();

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #ef4444; margin: 0;">SBRS Sinemaları</h1>
                <p style="color: #666;">Biletiniz başarıyla oluşturuldu!</p>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                <h2 style="margin-top: 0;">Sayın ${userName},</h2>
                <p>Bilet satın alma işleminiz başarıyla gerçekleşti. Detaylar aşağıdadır:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                    <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Bilet ID(leri):</strong></td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${ticketDetails.ticketIds.join(', ')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Toplam Tutar:</strong></td>
                        <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; color: #10b981; font-weight: bold;">${ticketDetails.totalAmount} ₺</td>
                    </tr>
                </table>
                
                <p style="margin-top: 20px; font-size: 0.9em; color: #888;">Lütfen bu e-postayı gişede veya salon girişinde görevliye gösteriniz.</p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; font-size: 0.8em; color: #aaa;">
                <p>Bizi tercih ettiğiniz için teşekkür ederiz. İyi seyirler!</p>
            </div>
        </div>
    `;

    const info = await transporter.sendMail({
        from: '"SBRS Bilet Sistemi" <noreply@sbrs.com>',
        to: toEmail,
        subject: "Sinema Biletiniz Onaylandı! 🎟️",
        html: htmlContent,
    });

    console.log("Bilet e-postası gönderildi: %s", info.messageId);
    
    if (info.messageId && !process.env.SMTP_HOST) {
        console.log("Önizleme URL (Bilet E-Postası): %s", nodemailer.getTestMessageUrl(info));
    }
};

module.exports = { sendTicketEmail };
