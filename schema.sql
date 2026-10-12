-- Tabel Penanggung Jawab / Admin
CREATE TABLE pics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    institution TEXT NOT NULL, -- Contoh: LabMu, MPKU, dll.
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Aset Subdomain
CREATE TABLE domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain_name TEXT UNIQUE NOT NULL, -- Contoh: labmu.muhammadiyah.or.id
    target_ip TEXT,
    purpose TEXT,
    pic_id INTEGER,
    status TEXT DEFAULT 'active', -- active, inactive, pending
    FOREIGN KEY(pic_id) REFERENCES pics(id)
);

-- Tabel Aset Sosial Media
CREATE TABLE social_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL, -- Instagram, YouTube, X
    username TEXT NOT NULL,
    registered_email TEXT NOT NULL,
    has_2fa BOOLEAN DEFAULT 0,
    pic_id INTEGER,
    FOREIGN KEY(pic_id) REFERENCES pics(id)
);

-- Tabel Delegasi Akses Staf PIC
CREATE TABLE IF NOT EXISTS staff_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pic_id INTEGER NOT NULL,
    user_identifier TEXT NOT NULL,
    allowed_type TEXT NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pic_id, user_identifier),
    FOREIGN KEY(pic_id) REFERENCES pics(id)
);

-- Tabel SSO Users
CREATE TABLE IF NOT EXISTS sso_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sso_user_id TEXT UNIQUE NOT NULL,
    nbm TEXT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    sso_raw_data TEXT, -- Menyimpan data JSON 1:1 dari SSO
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk menyimpan Kredensial Aplikasi (SSO / API Clients)
CREATE TABLE IF NOT EXISTS oauth_clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_name TEXT NOT NULL,
    client_id TEXT UNIQUE NOT NULL,
    client_secret TEXT NOT NULL,
    redirect_uris TEXT, -- URL callback aplikasi (dipisahkan koma)
    environment TEXT DEFAULT 'production', -- production, staging
    allow_localhost BOOLEAN DEFAULT 0,
    created_by TEXT, -- Email pembuat
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel OAuth Authorization Codes (sementara, expired 5 menit)
CREATE TABLE IF NOT EXISTS oauth_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    client_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_name TEXT,
    user_nbm TEXT,
    user_image TEXT,
    redirect_uri TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel OAuth Access Tokens (expired 1 jam)
CREATE TABLE IF NOT EXISTS oauth_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    access_token TEXT UNIQUE NOT NULL,
    client_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_name TEXT,
    user_nbm TEXT,
    user_image TEXT,
    expires_at INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Super Admin
CREATE TABLE IF NOT EXISTS admins (
    nbm TEXT PRIMARY KEY,
    name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Hak Akses Aset
CREATE TABLE IF NOT EXISTS asset_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain_id INTEGER,
    user_nbm TEXT NOT NULL,
    role TEXT DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(domain_id) REFERENCES domains(id)
);

-- Tabel Audit Logs Keamanan Sistem
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    actor TEXT NOT NULL,
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

