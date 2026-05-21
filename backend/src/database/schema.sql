-- UUID eklentisini aktif et (Eğer yoksa)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rolleri ENUM (Özel Veri Tipi) olarak tanımlıyoruz
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'cashier', 'customer');
    END IF;
END
$$;

-- Kullanıcılar (Users) Tablosu (Epic 2.1)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'customer',
    identity_number VARCHAR(255), 
    birth_date DATE,
    phone_number VARCHAR(50),
    gender VARCHAR(20),
    sms_allowed BOOLEAN DEFAULT FALSE,
    email_allowed BOOLEAN DEFAULT FALSE,
    is_mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    loyalty_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- Epic 2.2: Katalog Servisi Tabloları
-- ==========================================

-- 1. Filmler (Movies) Tablosu
CREATE TABLE IF NOT EXISTS movies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    release_date DATE,
    poster_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sinemalar/Şubeler (Cinemas) Tablosu
CREATE TABLE IF NOT EXISTS cinemas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(512) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Salonlar (Halls) Tablosu
CREATE TABLE IF NOT EXISTS halls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cinema_id UUID NOT NULL REFERENCES cinemas(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    seat_layout JSONB NOT NULL,
    total_seats INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Seanslar (Showtimes) Tablosu
CREATE TABLE IF NOT EXISTS showtimes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    hall_id UUID NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    format VARCHAR(50) DEFAULT '2D',
    language_type VARCHAR(50) DEFAULT 'Türkçe Dublaj',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- Epic 2.4: Rezervasyon ve Biletleme Tabloları
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        CREATE TYPE ticket_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    guest_id VARCHAR(255),
    ticket_type VARCHAR(50) DEFAULT 'ADULT',
    showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
    seat_id VARCHAR(10) NOT NULL, -- Örn: "A1", "B4"
    status ticket_status DEFAULT 'PENDING',
    price DECIMAL(10, 2) NOT NULL,
    loyalty_points_earned INTEGER DEFAULT 0,
    loyalty_points_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Bir koltuk aynı seans için yalnızca 1 kez oluşturulabilir (Unique Index)
    CONSTRAINT unique_seat_showtime UNIQUE (showtime_id, seat_id)
);

-- ==========================================
-- Epic 2.5: Performans İyileştirmeleri (İndeksler)
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_showtimes_movie_id ON showtimes(movie_id);
CREATE INDEX IF NOT EXISTS idx_showtimes_hall_id ON showtimes(hall_id);
CREATE INDEX IF NOT EXISTS idx_tickets_showtime_id ON tickets(showtime_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- Migration steps for existing database schema
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_allowed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_allowed BOOLEAN DEFAULT FALSE;

ALTER TABLE showtimes ADD COLUMN IF NOT EXISTS format VARCHAR(50) DEFAULT '2D';
ALTER TABLE showtimes ADD COLUMN IF NOT EXISTS language_type VARCHAR(50) DEFAULT 'Türkçe Dublaj';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_movie_title') THEN
        ALTER TABLE movies ADD CONSTRAINT unique_movie_title UNIQUE (title);
    END IF;
END
$$;

-- Sadakat Puanları ve Kuponlar Migrasyon Adımları
ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS loyalty_points_earned INTEGER DEFAULT 0;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS loyalty_points_used INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS coupons (
    code VARCHAR(50) PRIMARY KEY,
    discount_type VARCHAR(20) NOT NULL, -- 'PERCENTAGE' or 'FLAT'
    discount_value DECIMAL(10, 2) NOT NULL,
    min_amount DECIMAL(10, 2) DEFAULT 0.00,
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO coupons (code, discount_type, discount_value, min_amount, expiry_date, is_active)
VALUES 
('SBRS10', 'PERCENTAGE', 10.00, 0.00, NOW() + INTERVAL '30 days', TRUE),
('INDIRIM50', 'FLAT', 50.00, 150.00, NOW() + INTERVAL '30 days', TRUE),
('Bilet30', 'PERCENTAGE', 30.00, 100.00, NOW() + INTERVAL '30 days', TRUE)
ON CONFLICT (code) DO NOTHING;


