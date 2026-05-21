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
    try {
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

        const fromAddress = process.env.SMTP_FROM || '"SBRS Bilet Sistemi" <noreply@sbrscinema.com>';

        const info = await transporter.sendMail({
            from: fromAddress,
            to: toEmail,
            subject: "Sinema Biletiniz Onaylandı! 🎟️",
            html: htmlContent,
        });

        console.log("Bilet e-postası gönderildi: %s", info.messageId);
        
        if (info.messageId && !process.env.SMTP_HOST) {
            console.log("Önizleme URL (Bilet E-Postası): %s", nodemailer.getTestMessageUrl(info));
        }
    } catch (error) {
        console.error("Ticket email error:", error);
    }
};

const sendWelcomeEmail = async (toEmail, userName) => {
    try {
        const transporter = await createTransporter();
        const fromAddress = process.env.SMTP_FROM || '"SBRS Cinema Club" <noreply@sbrscinema.com>';

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #ef4444; margin: 0;">SBRS Cinema Club</h1>
                    <p style="color: #666; font-size: 1.1em;">Kulübümüze Hoş Geldiniz! 🎬</p>
                </div>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                    <h2 style="margin-top: 0; color: #333;">Merhaba ${userName},</h2>
                    <p>SBRS Cinema Club ailesine katıldığınız için çok mutluyuz! Artık size özel kampanyalardan, öncelikli bilet satışlarından ve kulüp ayrıcalıklarından faydalanabilirsiniz.</p>
                    <p>Hesabınız başarıyla oluşturuldu. Hemen giriş yaparak güncel vizyondaki filmleri inceleyebilir ve yerinizi ayırtabilirsiniz.</p>
                </div>
                
                <div style="text-align: center; margin-top: 25px; font-size: 0.85em; color: #888; border-top: 1px solid #eee; padding-top: 15px;">
                    <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
                    <p>&copy; ${new Date().getFullYear()} SBRS Cinema A.Ş. Tüm hakları saklıdır.</p>
                </div>
            </div>
        `;

        const info = await transporter.sendMail({
            from: fromAddress,
            to: toEmail,
            subject: "SBRS Cinema Club'a Hoş Geldiniz! 🍿",
            html: htmlContent,
        });

        console.log("Hoş geldin e-postası gönderildi: %s", info.messageId);
        if (info.messageId && !process.env.SMTP_HOST) {
            console.log("Önizleme URL (Hoş Geldin E-Postası): %s", nodemailer.getTestMessageUrl(info));
        }
    } catch (error) {
        console.error("Welcome email error:", error);
    }
};

const sendLoginAlertEmail = async (toEmail, userName, loginDetails) => {
    try {
        const transporter = await createTransporter();
        const fromAddress = process.env.SMTP_FROM || '"SBRS Cinema Club" <noreply@sbrscinema.com>';

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #ef4444; margin: 0;">SBRS Cinema</h1>
                    <p style="color: #666; font-size: 1.1em;">Yeni Giriş Bilgilendirmesi 🛡️</p>
                </div>
                
                <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                    <h2 style="margin-top: 0; color: #333;">Merhaba ${userName},</h2>
                    <p>Hesabınıza yeni bir giriş yapıldığını tespit ettik. Eğer bu işlemi siz gerçekleştirdiyseniz herhangi bir işlem yapmanıza gerek yoktur.</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Tarih:</strong></td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${loginDetails.date}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>IP Adresi:</strong></td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${loginDetails.ipAddress}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Tarayıcı / Cihaz:</strong></td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;">${loginDetails.userAgent}</td>
                        </tr>
                    </table>
                    
                    <p style="margin-top: 20px; font-size: 0.9em; color: #c2410c; font-weight: bold;">
                        Bu giriş işlemi size ait değilse, lütfen derhal şifrenizi değiştirin veya bizimle iletişime geçin.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 25px; font-size: 0.85em; color: #888; border-top: 1px solid #eee; padding-top: 15px;">
                    <p>Bu e-posta hesabınızın güvenliğini sağlamak amacıyla otomatik gönderilmiştir.</p>
                    <p>&copy; ${new Date().getFullYear()} SBRS Cinema A.Ş. Tüm hakları saklıdır.</p>
                </div>
            </div>
        `;

        const info = await transporter.sendMail({
            from: fromAddress,
            to: toEmail,
            subject: "SBRS Cinema - Yeni Giriş Bildirimi 🚨",
            html: htmlContent,
        });

        console.log("Giriş uyarı e-postası gönderildi: %s", info.messageId);
        if (info.messageId && !process.env.SMTP_HOST) {
            console.log("Önizleme URL (Giriş Uyarısı E-Postası): %s", nodemailer.getTestMessageUrl(info));
        }
    } catch (error) {
        console.error("Login alert email error:", error);
    }
};

module.exports = { 
    sendTicketEmail,
    sendWelcomeEmail,
    sendLoginAlertEmail
};
