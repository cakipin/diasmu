# 📘 Dokumentasi SSO — DiasMu

## Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Skema Database](#skema-database)
- [Konfigurasi Environment](#konfigurasi-environment)
- [API Reference](#api-reference)
- [Integrasi SSO Muhammadiyah ID](#integrasi-sso-muhammadiyah-id)
- [Mock SSO (Development)](#mock-sso-development)
- [Pengaturan Developer (OAuth Client Management)](#pengaturan-developer-oauth-client-management)
- [Panduan Integrasi untuk Aplikasi Pihak Ketiga](#panduan-integrasi-untuk-aplikasi-pihak-ketiga)
- [Troubleshooting](#troubleshooting)

---

## Gambaran Umum

DiasMu memiliki sistem Single Sign-On (SSO) yang terdiri dari dua lapisan:

1. **Konsumen SSO (OAuth Client)** — DiasMu menggunakan SSO Muhammadiyah ID (`sso.muhammadiyah.id`) sebagai penyedia identitas utama. Saat pengguna login, data profil mereka disimpan (mirroring) ke database Cloudflare D1 internal.
2. **Penyedia Kredensial (OAuth Provider Sederhana)** — Melalui menu *Pengaturan Developer*, admin DiasMu dapat membuat **Client ID** dan **Client Secret** yang dapat digunakan oleh aplikasi eksternal untuk mengakses API DiasMu.

---

## Arsitektur Sistem

```
┌──────────────────┐       OAuth 2.0        ┌──────────────────────┐
│   SSO Muhammadiyah│◄──────────────────────►│   DiasMu Frontend    │
│   (sso.muhammadiyah.id)                    │   (Next.js / Pages)  │
└──────────────────┘                         └─────────┬────────────┘
                                                       │
                                              signIn callback
                                              POST /api/sso-users
                                                       │
                                                       ▼
                                             ┌──────────────────────┐
                                             │   DiasMu API Worker  │
                                             │   (Cloudflare Workers)│
                                             └─────────┬────────────┘
                                                       │
                                              ┌────────┴────────┐
                                              │                 │
                                              ▼                 ▼
                                     ┌──────────────┐  ┌──────────────┐
                                     │  Cloudflare   │  │  Cloudflare   │
                                     │  D1 (SQLite)  │  │  R2 (Storage) │
                                     └──────────────┘  └──────────────┘
```

### Alur Login Pengguna

1. Pengguna mengklik tombol **"Login dengan Muhammadiyah ID"** di halaman login DiasMu.
2. Browser diarahkan ke `https://sso.muhammadiyah.id/oauth/authorize` untuk autentikasi.
3. Setelah berhasil, SSO Muhammadiyah mengembalikan **authorization code** ke callback URL DiasMu.
4. NextAuth menukar code tersebut dengan **access token** melalui endpoint `/oauth/token`.
5. NextAuth mengambil **profil pengguna** dari `/api/user-info`.
6. Callback `signIn` di DiasMu mengirim data profil ke `POST /api/sso-users` untuk disimpan ke D1 (JIT Provisioning).
7. Session dibuat dan pengguna masuk ke dashboard.

---

## Skema Database

### Tabel `sso_users`

Menyimpan data pengguna yang pernah login melalui SSO.

```sql
CREATE TABLE IF NOT EXISTS sso_users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    sso_user_id   TEXT UNIQUE,        -- UUID/ID dari sistem SSO pusat
    nbm           TEXT,               -- Nomor Baku Muhammadiyah
    name          TEXT NOT NULL,       -- Nama lengkap
    email         TEXT UNIQUE NOT NULL,-- Email pengguna
    sso_raw_data  TEXT,               -- Data JSON 1:1 dari SSO (profil lengkap)
    last_login    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabel `oauth_clients`

Menyimpan kredensial aplikasi pihak ketiga yang dibuat oleh admin.

```sql
CREATE TABLE IF NOT EXISTS oauth_clients (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    app_name      TEXT NOT NULL,       -- Nama aplikasi
    client_id     TEXT UNIQUE NOT NULL, -- Contoh: client_aBcDeFgHiJkLmNoPqRsT...
    client_secret TEXT NOT NULL,       -- 64-karakter random string
    redirect_uris TEXT,               -- URL callback (dipisahkan koma)
    created_by    TEXT,               -- Email admin pembuat
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Konfigurasi Environment

### Frontend (`diasmu-web/.env.local`)

| Variable | Deskripsi | Contoh |
|---|---|---|
| `NEXTAUTH_URL` | URL publik aplikasi web DiasMu | `https://diasmu.pages.dev` |
| `NEXTAUTH_SECRET` | Secret untuk enkripsi session NextAuth | `rahasia_super_aman_acak_123` |
| `MUHAMMADIYAH_CLIENT_ID` | Client ID dari dashboard SSO Muhammadiyah | `019e25d2-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `MUHAMMADIYAH_CLIENT_SECRET` | Client Secret dari dashboard SSO Muhammadiyah | `cMl8lABCU0Hk...` |
| `DIASMU_SECRET_TOKEN` | Token internal untuk komunikasi Frontend → Worker API | *(sama dengan di `wrangler.toml`)* |

### Backend (`wrangler.toml`)

| Variable | Deskripsi |
|---|---|
| `DIASMU_SECRET_TOKEN` | Token rahasia untuk memvalidasi semua request ke API Worker |

---

## API Reference

> **Catatan:** Semua endpoint memerlukan header `Authorization: Bearer <DIASMU_SECRET_TOKEN>`.

### SSO Users

#### `GET /api/sso-users`

Mengambil seluruh daftar pengguna SSO yang tersimpan di D1.

**Response:**
```json
[
  {
    "id": 1,
    "sso_user_id": "019e25d2-7863-726a-91a5-22b4e16e9f14",
    "nbm": "832413",
    "name": "ZAINAL ARIFIN",
    "email": "cakipin1979@gmail.com",
    "last_login": "2026-05-24T08:00:00.000Z"
  }
]
```

---

#### `POST /api/sso-users`

Menyimpan atau memperbarui data pengguna SSO ke D1 (JIT Provisioning).

**Request Body:**
```json
{
  "sso_user_id": "uuid-dari-sso",
  "nbm": "832413",
  "name": "ZAINAL ARIFIN",
  "email": "user@muhammadiyah.or.id"
}
```

| Field | Wajib | Deskripsi |
|---|---|---|
| `sso_user_id` | Tidak | ID unik dari SSO pusat. Jika kosong, otomatis menggunakan `email`. |
| `nbm` | Tidak | Nomor Baku Muhammadiyah |
| `name` | Tidak | Nama lengkap. Default: `"Unknown"` |
| `email` | **Ya** | Email pengguna (digunakan sebagai kunci upsert utama) |

**Response:**
```json
{ "success": true, "message": "Data SSO berhasil di-sync" }
```

---

#### `POST /api/sync-mock`

Endpoint khusus untuk testing — memasukkan 10 data pengguna mock ke D1 secara batch.

**Response:**
```json
{
  "success": true,
  "message": "Berhasil melakukan mirroring 10 user SSO beserta raw data JSON ke D1.",
  "syncedCount": 10
}
```

---

### Developer / OAuth Clients

#### `GET /api/developer/clients`

Mengambil daftar semua aplikasi yang terdaftar.

**Response:**
```json
[
  {
    "id": 1,
    "app_name": "Portal PWM Jatim",
    "client_id": "client_aBcDeFgHiJkLmNoPqRsTuVwX",
    "client_secret": "xxxxxxxxxxxxxxxx...",
    "redirect_uris": "https://pwm-jatim.or.id/callback",
    "created_by": "admin@muhammadiyah.or.id",
    "created_at": "2026-05-24T08:00:00.000Z"
  }
]
```

---

#### `POST /api/developer/clients`

Membuat kredensial baru (Client ID & Secret) untuk aplikasi pihak ketiga.

**Request Body:**
```json
{
  "app_name": "Portal PWM Jatim",
  "redirect_uris": "https://pwm-jatim.or.id/callback",
  "created_by": "admin@muhammadiyah.or.id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kredensial Aplikasi berhasil dibuat",
  "data": {
    "app_name": "Portal PWM Jatim",
    "client_id": "client_aBcDeFgHiJkLmNoPqRsTuVwX",
    "client_secret": "LoNgRaNdOmStRiNg64ChArAcTeRs..."
  }
}
```

> ⚠️ **Penting:** `client_secret` hanya ditampilkan **satu kali** saat dibuat. Simpan baik-baik!

---

#### `PUT /api/developer/clients/:id`

Memperbarui nama aplikasi dan redirect URIs.

**Request Body:**
```json
{
  "app_name": "Portal PWM Jatim (Updated)",
  "redirect_uris": "https://new-url.or.id/callback"
}
```

---

#### `DELETE /api/developer/clients/:id`

Menghapus (mencabut akses) kredensial aplikasi.

---

## Integrasi SSO Muhammadiyah ID

### Konfigurasi OAuth Provider

DiasMu menggunakan **NextAuth.js v5** dengan provider OAuth kustom untuk SSO Muhammadiyah ID.

| Parameter | URL |
|---|---|
| Authorization URL | `https://sso.muhammadiyah.id/oauth/authorize` |
| Token URL | `https://sso.muhammadiyah.id/oauth/token` |
| User Info URL | `https://sso.muhammadiyah.id/api/user-info` |
| Scope | `user-info` |

### Profil yang Diterima dari SSO

Berikut field profil yang dikembalikan oleh SSO Muhammadiyah ID:

| Field | Deskripsi | Contoh |
|---|---|---|
| `m_id` / `SSO_ID` / `sub` | ID unik pengguna di SSO | `019e25d2-xxxx...` |
| `name` / `nama_lengkap` | Nama lengkap | `ZAINAL ARIFIN` |
| `nbm` | Nomor Baku Muhammadiyah | `832413` |
| `email` | Email | `user@muhammadiyah.or.id` |
| `image` | URL foto profil | `https://...` |

### Callback `signIn`

Setiap kali pengguna berhasil login, callback ini berjalan di server-side:

```typescript
async signIn({ user, profile }) {
  // 1. Ekstrak data profil
  const sso_user_id = user.id || profile.m_id || profile.SSO_ID || ...;
  const nbm = user.nbm || profile.nbm || "";
  const name = user.name || profile.nama_lengkap || "Unknown";
  const email = user.email || profile.email || "";

  // 2. Kirim ke Worker API untuk disimpan ke D1
  await fetch(apiUrl("/api/sso-users"), {
    method: "POST",
    headers: jsonAuthHeaders(),
    body: JSON.stringify({ sso_user_id, nbm, name, email })
  });

  // 3. Catat audit log
  await auditLog("auth.sign_in", { actor: nbm || email, nbm, email });

  return true; // Izinkan login
}
```

---

## Mock SSO (Development)

Untuk keperluan pengembangan lokal tanpa harus terkoneksi ke SSO Muhammadiyah ID Production, DiasMu menyediakan **Mock SSO Provider** menggunakan NextAuth CredentialsProvider.

### Cara Menggunakan

1. Jalankan aplikasi di mode development (`npm run dev`).
2. Buka halaman login (`/api/auth/signin`).
3. Pilih provider **"Mock SSO (Dev Only)"**.
4. Isi formulir:
   - **NBM:** NBM bebas (misal: `123456`)
   - **Nama Lengkap:** Nama lengkap bebas
   - **Email:** Email bebas (misal: `test@diasmu.local`)
5. Klik Submit — Anda akan login dan data akan tersimpan ke D1 seperti login SSO asli.

> ⚠️ **Peringatan:** Provider Mock SSO ini **tidak boleh** diaktifkan di production. Pastikan untuk menghapusnya atau menambahkan kondisi environment sebelum deploy.

---

## Pengaturan Developer (OAuth Client Management)

### Lokasi di Dashboard

Menu **"Pengaturan Developer"** tersedia di sidebar admin (hanya untuk Super Admin).

**URL:** `https://diasmu.pages.dev/admin/developer`

### Fitur yang Tersedia

| Fitur | Deskripsi |
|---|---|
| **Generate Keys** | Membuat Client ID (prefix `client_` + 24 karakter) dan Client Secret (64 karakter acak) |
| **Copy** | Tombol copy ke clipboard untuk Client ID dan Client Secret |
| **Edit** | Mengubah nama aplikasi dan redirect URIs |
| **Cabut Akses** | Menghapus kredensial dan menonaktifkan akses aplikasi |

### Format Kredensial

| Jenis | Format | Panjang |
|---|---|---|
| Client ID | `client_` + alfanumerik acak | 31 karakter |
| Client Secret | Alfanumerik acak | 64 karakter |

---

## Panduan Integrasi untuk Aplikasi Pihak Ketiga

Jika Anda adalah developer aplikasi lain yang ingin mengakses data dari API DiasMu:

### Langkah 1: Minta Kredensial

Hubungi admin DiasMu dan minta mereka untuk membuatkan **Client ID** dan **Client Secret** melalui menu *Pengaturan Developer*.

### Langkah 2: Gunakan Kredensial

Saat ini, DiasMu menggunakan sistem **Bearer Token** sederhana untuk autentikasi API. Sertakan header berikut di setiap request:

```http
Authorization: Bearer <DIASMU_SECRET_TOKEN>
```

### Langkah 3: Ambil Data

Contoh mengambil daftar user SSO:

```bash
curl -X GET https://diasmu.labmu.workers.dev/api/sso-users \
  -H "Authorization: Bearer <TOKEN>"
```

### Langkah 4: (Opsional) Sinkronisasi Data

Untuk menarik data secara berkala, buat cronjob atau scheduled task yang memanggil endpoint `GET /api/sso-users` dan menyimpan hasilnya ke database lokal Anda.

---

## Troubleshooting

### "D1_ERROR: no such table: sso_users"

Tabel belum dibuat di D1 remote. Jalankan:
```bash
npx wrangler d1 execute diasmu_db --remote --file=schema.sql
```

### "D1_ERROR: no such table: oauth_clients"

Sama seperti di atas — tabel `oauth_clients` belum ada. Jalankan perintah yang sama.

### Riwayat Login SSO menunjukkan 0 Akun

**Penyebab umum:**
1. Tabel `sso_users` di D1 remote menggunakan skema lama (tanpa kolom `sso_user_id` atau `sso_raw_data`). Solusi: DROP dan CREATE ulang tabel.
2. Callback `signIn` di NextAuth gagal mengirim data karena token tidak cocok. Pastikan `DIASMU_SECRET_TOKEN` di `.env.local` sama dengan yang ada di `wrangler.toml`.
3. Worker belum di-deploy ulang setelah perubahan kode. Jalankan `npx wrangler deploy`.

### "This page couldn't load" di halaman Developer

Halaman menggunakan **Client Component** yang memanggil Server Actions. Pastikan:
1. File `page.tsx` menggunakan `export const runtime = "edge"`.
2. File `actions.ts` dimulai dengan `"use server"`.
3. File `ClientPage.tsx` dimulai dengan `"use client"`.

---

*Dokumentasi ini terakhir diperbarui pada 24 Mei 2026 oleh LabMu.*
