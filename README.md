# Cinema Ticket Reservation System (SBRS)

Sinema biletlerinin çevrimiçi olarak satılması, rezervasyonu ve ödenmesi işlemlerini otomatikleştiren modern bir web uygulaması.

## İçindekiler

- [Özellikleri](#özellikleri)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Kurulum](#kurulum)
- [Konfigürasyon](#konfigürasyon)
- [Proje Yapısı](#proje-yapısı)
- [API Endpoints](#api-endpoints)
- [Veritabanı](#veritabanı)
- [Kullanım](#kullanım)
- [Katkı](#katki-contribution)

## Özellikleri

- **Kullanıcı Yönetimi**: Kayıt, giriş ve profil yönetimi
- **Sinema Kataloğu**: TMDB entegrasyonu ile güncel film listesi
- **Oturum (Showtime) Yönetimi**: Çeşitli görüntüleme saatleri ve salonlar
- **Koltuk Seçimi**: Gerçek zamanlı koltuk kilitleme ve rezervasyon (Redis tabanlı kilitleme)
- **Ödeme İşlemleri**: Güvenli ödeme işleme sistemi
- **Faturalama**: Otomatik fatura oluşturma, fatura numarası ve bilet detayları
- **Veritabanı Senkronizasyonu**: Periyodik olarak TMDB'den film verilerinin güncellenmesi

## Teknoloji Yığını

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
- **Framework/Build Tool**: Vite 8.x
- **UI Library**: React 19.x SPA
- **Router**: React Router DOM 7.x (Client-side routing, sıfır sayfa yenileme)
- **HTTP Client**: Axios
- **Stil**: Custom CSS ve Glassmorphism Teması

## Kurulum

### Ön Koşullar

- Node.js 18.x veya daha yüksek
- PostgreSQL 12.x veya daha yüksek
- Redis 6.x veya daha yüksek
- TMDB API Key (https://www.themoviedb.org/settings/api adresinden ücretsiz alınabilir)

### Adım 1: Repoyu Klonlayın

```bash
git clone https://github.com/Dogukan01/Cinema-Ticket-Reservation-System.git
cd Cinema-Ticket-Reservation-System
```

### Adım 2: Tüm Bağımlılıkları Yükleyin

Proje kök dizinindeki yardımcı script ile backend ve frontend paketlerini tek seferde yükleyebilirsiniz:

```bash
npm run install:all
```

### Adım 3: Ortam Değişkenlerini Yapılandırın

**Backend için:**
Backend dizininde `.env` dosyası oluşturun (`.env.example` dosyasını referans alarak):

```bash
cd backend
cp .env.example .env
```

**Frontend için:**
Frontend dizininde `.env` dosyası oluşturup backend adresini girin:

```env
VITE_API_URL=http://localhost:3000/api
```

### Adım 4: Veritabanı Oluştur ve Migrate Et

PostgreSQL veritabanınızı oluşturduktan sonra backend dizininde migrate scriptini çalıştırın:

```bash
cd backend
npm run migrate
```

### Adım 5: Uygulamaları Çalıştırın

Proje kök dizininden ayrı terminallerde veya dizinlerine girerek çalıştırabilirsiniz:

**Terminal 1 - Backend:**
```bash
npm run start:backend
```

**Terminal 2 - Frontend:**
```bash
npm run start:frontend
```

Backend'i `http://localhost:3000` adresinde, Frontend'i `http://localhost:3001` adresinde bulabilirsiniz.

## Konfigürasyon

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

---

## Proje Yapısı

```
Cinema-Ticket-Reservation-System/
├── package.json             # Kök dizin npm scriptleri
├── backend/
│   ├── src/
│   │   ├── index.js         # Ana Express uygulama dosyası
│   │   ├── config/          # DB ve Redis konfigürasyonu
│   │   ├── controllers/      # İstek kontrolcüleri
│   │   ├── routes/          # Express rotaları
│   │   ├── services/        # Veri erişimi ve iş mantığı
│   │   ├── middleware/      # Auth & hata yakalama middleware'leri
│   │   ├── jobs/            # Arka plan TMDB senkronizasyonu
│   │   ├── database/        # schema.sql dosyası
│   │   └── utils/           # Yardımcılar
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable bileşenler (Header, GuestModal, ShowtimeList)
│   │   ├── pages/           # Sayfa bileşenleri (MoviesList, MovieDetails, SeatSelection, etc.)
│   │   ├── utils/           # Axios API istemcisi
│   │   ├── App.jsx          # React Router yapılandırması
│   │   ├── main.jsx         # React DOM Mount noktası
│   │   └── index.css        # Premium Glassmorphism stil sayfası
│   ├── vite.config.js       # Vite yapılandırması (Port: 3001)
│   └── package.json
└── README.md
```

## API Endpoints

### Kimlik Doğrulama (`/api/auth`)
- `POST /register` - Yeni kullanıcı kaydı
- `POST /login` - Kullanıcı girişi

### Katalog (`/api/catalog`)
- `GET /movies` - Tüm filmleri listele
- `GET /movies/:id` - Belirli filmin detaylarını al

### Rezervasyon (`/api/reservations`)
- `GET /showtimes/:showtimeId/seats` - Seansa ait koltuk durumunu listele
- `POST /lock` - Koltuğu Redis ile 10 dakikalığına kilitle
- `POST /unlock` - Kilitlenen koltuk kilidini kaldır
- `POST /reserve` - Koltukları PENDING statüsünde DB'ye kaydet

### Ödeme (`/api/payment`)
- `POST /pay` - Ödeme işlemini tamamla ve biletleri CONFIRMED yap
- `GET /invoice/:showtimeId` - Satın alınan biletlerin fatura dökümünü al

## Veritabanı

PostgreSQL için oluşturulan veritabanı aşağıdaki tabloları içerir:
- **users**: Kullanıcı hesapları ve sadakat puanları
- **movies**: Film kataloğu (TMDB senkronizasyonlu)
- **cinemas**: Sinema salonları bilgileri
- **halls**: Salon bilgileri ve koltuk kapasiteleri (JSON seat_layout)
- **showtimes**: Seans bilgileri (film, salon, saat, fiyat)
- **tickets**: Bilet rezervasyonları (CONFIRMED/PENDING/CANCELLED)
- **coupons**: İndirim kuponları

Veritabanı şeması `backend/src/database/schema.sql` dosyasında bulunmaktadır.

## Kullanım

Uygulama çalıştırıldıktan sonra aşağıdaki akış izlenir:

1. **Kayıt / Giriş**: Kullanıcı hesap oluşturur veya misafir olarak devam eder.
2. **Film Seçimi**: Ana sayfada listelenen filmlerden birini seçer.
3. **Seans Seçimi**: Filmin mevcut seanslarından uygun olanı seçer.
4. **Bilet Türü**: Tam (Adult) veya Öğrenci (Student) bilet türü belirlenir.
5. **Koltuk Seçimi**: Salon haritası üzerinden boş koltuklar seçilir. Seçilen koltuklar Redis ile 10 dakika boyunca kilitlenir.
6. **Ödeme**: Kart bilgileri girilir, varsa kupon kodu veya sadakat puanı uygulanır.
7. **Fatura**: Ödeme sonrası otomatik fatura oluşturulur ve bilet detayları görüntülenir.

Admin paneline `/admin` adresinden erişilebilir (admin yetkili hesap gerektirir).

## Katkı (Contribution)

1. Bu repoyu fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request oluşturun

---

**Son Güncelleme**: Mayıs 2026