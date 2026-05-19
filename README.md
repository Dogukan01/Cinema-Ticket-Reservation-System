# 🎬 Cinema Ticket Reservation System (SBRS)

Sinema biletlerinin çevrimiçi olarak satılması, rezervasyonu ve ödenmesi işlemlerini otomatikleştiren modern bir web uygulaması.

## 📋 İçindekiler

- [Özellikleri](#özellikleri)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Kurulum](#kurulum)
- [Konfigürasyon](#konfigürasyon)
- [Kullanım](#kullanım)
- [Proje Yapısı](#proje-yapısı)
- [API Endpoints](#api-endpoints)
- [Veritabanı](#veritabanı)

## ✨ Özellikleri

- **Kullanıcı Yönetimi**: Kayıt, giriş ve profil yönetimi
- **Sinema Kataloğu**: TMDB entegrasyonu ile güncel film listesi
- **Oturum (Showtime) Yönetimi**: Çeşitli görüntüleme saatleri ve salonlar
- **Koltuk Seçimi**: Gerçek zamanlı koltuk kilitleme ve rezervasyon
- **Ödeme İşlemleri**: Güvenli ödeme işleme sistemi
- **Faturalama**: Otomatik fatura oluşturma ve bilet şifresi
- **Veritabanı Sinkronizasyonu**: Periyodik olarak TMDB'den film verilerinin güncellenmesi

## 🛠️ Teknoloji Yığını

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Veritabanı**: PostgreSQL
- **Cache**: Redis
- **Kimlik Doğrulama**: JWT (JSON Web Tokens)
- **Şifreleme**: bcrypt
- **Ödeme**: Stripe/Custom Payment Gateway
- **Zamanlanan Görevler**: node-cron

### Frontend
- **Framework**: Next.js 16.x
- **UI Library**: React 19.x
- **HTTP Client**: Axios
- **Linting**: ESLint 9.x
- **Node Version**: 18.x+

## 📦 Kurulum

### Ön Koşullar

- Node.js 18.x veya daha yüksek
- PostgreSQL 12.x veya daha yüksek
- Redis 6.x veya daha yüksek
- TMDB API Key (https://www.themoviedb.org/settings/api adresinden ücretsiz alınabilir)

### Adım 1: Repoyu Klonlayın

```bash
git clone https://github.com/username/Cinema-Ticket-Reservation-System.git
cd Cinema-Ticket-Reservation-System
```

### Adım 2: Backend Kurulumu

```bash
cd backend
npm install
```

### Adım 3: Frontend Kurulumu

```bash
cd ../frontend
npm install
```

### Adım 4: Ortam Değişkenlerini Yapılandırın

Backend dizininde `.env` dosyası oluşturun (`.env.example` dosyasını referans alarak):

```bash
cd backend
cp .env.example .env
```

Frontend için de gerekirse `.env.local` dosyası oluşturun.

### Adım 5: Veritabanı Oluştur ve Migrate Et

```bash
cd backend
npm run migrate
```

### Adım 6: Uygulamaları Çalıştırın

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# veya geliştirme modu: npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Backend'i `http://localhost:3000` adresinde, Frontend'i `http://localhost:3001` adresinde bulabilirsiniz.

## ⚙️ Konfigürasyon

### Ortam Değişkenleri (Backend)

Backend için `.env` dosyasında aşağıdaki değişkenler gereklidir:

| Değişken | Açıklama | Varsayılan |
|----------|---------|-----------|
| `NODE_ENV` | Çalışma ortamı (development/production) | development |
| `PORT` | Backend sunucu portu | 3000 |
| `DB_HOST` | PostgreSQL host adresi | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_USER` | PostgreSQL kullanıcı adı | postgres |
| `DB_PASSWORD` | PostgreSQL şifresi | password |
| `DB_NAME` | Veritabanı adı | sbrs_db |
| `REDIS_URL` | Redis bağlantı URL'si | redis://localhost:6379 |
| `JWT_SECRET` | JWT token imzalama anahtarı | SBRS_SUPER_SECRET_JWT_KEY |
| `ENCRYPTION_KEY` | Şifreleme için anahtar | Otomatik oluşturulur |
| `TMDB_API_KEY` | The Movie Database API anahtarı | - |

Örnek `.env` dosyası:

```env
# Ortam
NODE_ENV=development

# Sunucu
PORT=3000

# PostgreSQL Veritabanı
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=sbrs_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Şifreleme
ENCRYPTION_KEY=your_encryption_key_32_chars_long

# TMDB API
TMDB_API_KEY=your_tmdb_api_key_here
```

### Ortam Değişkenleri (Frontend)

Frontend için `.env.local` dosyası:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## 🚀 Kullanım

### API Health Check

```bash
curl http://localhost:3000/health
```

### Örnek İstek: Filme Gözat

```bash
curl http://localhost:3000/api/catalog/movies
```

### Örnek İstek: Kaydol

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

## 📁 Proje Yapısı

```
Cinema-Ticket-Reservation-System/
├── backend/
│   ├── src/
│   │   ├── index.js                 # Ana uygulama dosyası
│   │   ├── config/
│   │   │   ├── db.js                # PostgreSQL konfigürasyonu
│   │   │   └── redis.js             # Redis istemcisi
│   │   ├── controllers/              # İş mantığı
│   │   │   ├── authController.js
│   │   │   ├── catalogController.js
│   │   │   ├── reservationController.js
│   │   │   ├── paymentController.js
│   │   │   └── seatLockController.js
│   │   ├── routes/                  # API rotaları
│   │   ├── services/                # Veri erişimi ve işleme
│   │   ├── middleware/              # Express middleware'ler
│   │   ├── jobs/                    # Arka plan görevleri
│   │   ├── database/                # Veritabanı şeması ve migration
│   │   └── utils/                   # Yardımcı fonksiyonlar
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.js            # Root layout
│   │   │   ├── page.js              # Ana sayfa
│   │   │   ├── login/               # Giriş sayfası
│   │   │   ├── register/            # Kayıt sayfası
│   │   │   ├── movies/              # Film listeleme
│   │   │   ├── showtimes/           # Oturum seçimi
│   │   │   └── app.css              # Global stiller
│   │   ├── components/              # Reusable React bileşenleri
│   │   └── utils/                   # Yardımcı fonksiyonlar
│   └── package.json
│
└── README.md
```

## 🔌 API Endpoints

### Kimlik Doğrulama (`/api/auth`)
- `POST /register` - Yeni kullanıcı kaydı
- `POST /login` - Kullanıcı girişi
- `POST /logout` - Çıkış

### Katalog (`/api/catalog`)
- `GET /movies` - Tüm filmleri listele
- `GET /movies/:id` - Belirli filmin detaylarını al
- `GET /showtimes/:movieId` - Filmin oturumlarını al

### Rezervasyon (`/api/reservations`)
- `POST /reserve` - Yeni rezervasyon oluştur
- `GET /user-reservations` - Kullanıcının rezervasyonlarını al
- `POST /cancel/:id` - Rezervasyonu iptal et

### Ödeme (`/api/payment`)
- `POST /checkout` - Ödeme işlemini başlat
- `POST /confirm` - Ödemeyi onayla
- `GET /invoice/:id` - Faturayı al

### Koltuk Kilitleme (`/api/seats`)
- `POST /lock` - Koltuğu kilitle
- `POST /unlock` - Koltuk kilidini kaldır

## 🗄️ Veritabanı

### Şema

PostgreSQL için oluşturulan veritabanı aşağıdaki tabloları içerir:

- **users**: Kullanıcı hesapları
- **movies**: Film kataloğu
- **showtimes**: Oturum bilgileri
- **seats**: Salonlardaki koltuklar
- **reservations**: Bilet rezervasyonları
- **payments**: Ödeme kayıtları
- **invoices**: Fatura bilgileri

Veritabanı şeması `backend/src/database/schema.sql` dosyasında bulunmaktadır.

### Migration

```bash
cd backend
npm run migrate
```

## 🔒 Güvenlik

- ✅ Şifreler bcrypt ile hashlenir
- ✅ JWT token tabanlı kimlik doğrulama
- ✅ CORS entegrasyonu
- ✅ Production ortamında SSL/TLS desteklenir
- ✅ Hassas veriler şifreli olarak saklanır

## 🤝 Katkıda Bulunma

1. Bu repoyu fork edin
2. Feature branch'i oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişiklikleri commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'e push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request açın

## 📝 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📧 İletişim

Sorularınız veya önerileriniz için lütfen bir issue açın veya repository'nin yöneticisiyle iletişime geçin.

---

**Son Güncelleme**: Mayıs 2026