-- UUID eklentisini aktif et (Eğer yoksa)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rolleri ENUM (Özel Veri Tipi) olarak tanımlıyoruz (Sadece 3 geçerli rol olabilir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'cashier', 'customer');
    END IF;
END
$$;

-- Kullanıcılar (Users) Tablosu
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'customer',
    
    -- PII Verileri (AES-256-GCM ile şifrelenecek)
    identity_number VARCHAR(255), 
    birth_date DATE, -- NVİ kontrolü için doğum tarihi
    
    -- Güvenlik (MFA)
    is_mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    
    -- Zaman damgaları
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
