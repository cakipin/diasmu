# 🔌 Panduan Integrasi API DiasMu untuk Developer Aplikasi Pihak Ketiga

> Dokumen ini ditujukan bagi developer yang ingin menghubungkan aplikasi mereka dengan sistem DiasMu — baik untuk mengambil data pengguna SSO, maupun untuk mengakses data aset digital Muhammadiyah.

---

## Daftar Isi

1. [Persiapan Awal](#1-persiapan-awal)
2. [Mendapatkan Kredensial](#2-mendapatkan-kredensial)
3. [Autentikasi API](#3-autentikasi-api)
4. [Endpoint yang Tersedia](#4-endpoint-yang-tersedia)
5. [Contoh Implementasi](#5-contoh-implementasi)
6. [Contoh Sinkronisasi (Mirroring)](#6-contoh-sinkronisasi-mirroring)
7. [Kode Error & Penanganan](#7-kode-error--penanganan)
8. [Keamanan & Best Practices](#8-keamanan--best-practices)
9. [FAQ](#9-faq)

---

## 1. Persiapan Awal

### Informasi Umum

| Item | Detail |
|---|---|
| **Base URL API** | `https://diasmu.labmu.workers.dev` |
| **Protokol** | HTTPS (wajib) |
| **Format Data** | JSON (`application/json`) |
| **Autentikasi** | Bearer Token |
| **Rate Limit** | Mengikuti batas Cloudflare Workers |

### Prasyarat

Sebelum mulai integrasi, pastikan Anda memiliki:

- [x] Akses ke dashboard admin DiasMu (atau hubungi admin)
- [x] **Client ID** dan **Client Secret** yang sudah di-generate
- [x] Bahasa pemrograman yang mendukung HTTP request (JavaScript, Python, PHP, Go, dll.)

---

## 2. Mendapatkan Kredensial

### Cara Mendapatkan Client ID & Client Secret

1. Login ke **DiasMu Dashboard** → `https://diasmu.pages.dev/admin`
2. Klik menu **"Pengaturan Developer"** di sidebar
3. Isi **Nama Aplikasi** Anda (contoh: `Portal PWM Jawa Timur`)
4. Isi **Redirect URIs** (URL callback aplikasi Anda)
5. Klik tombol **"Generate Keys"**
6. **Salin dan simpan** Client ID dan Client Secret yang muncul

> ⚠️ **PENTING:** Client Secret hanya ditampilkan **SATU KALI** saat pertama kali dibuat. Jika hilang, Anda harus membuat kredensial baru.

### Format Kredensial

```
Client ID    : client_aBcDeFgHiJkLmNoPqRsTuVwX   (31 karakter)
Client Secret: LoNgRaNdOmStRiNg64ChArAcTeRs...   (64 karakter)
```

---

## 3. Autentikasi API

Semua request ke API DiasMu **wajib** menyertakan header `Authorization` dengan format Bearer Token.

```http
Authorization: Bearer <SECRET_TOKEN>
```

### Contoh Header Lengkap

```http
GET /api/sso-users HTTP/1.1
Host: diasmu.labmu.workers.dev
Authorization: Bearer Muhammadiyah1912_AmanSentosa!?
Content-Type: application/json
```

### Respons Jika Tidak Terautentikasi

```json
{
  "success": false,
  "message": "Akses ditolak. Endpoint ini dilindungi oleh enkripsi internal DiasMu."
}
```
**HTTP Status:** `401 Unauthorized`

---

## 4. Endpoint yang Tersedia

### 4.1 Mengambil Daftar Pengguna SSO

Mengambil seluruh pengguna yang pernah login ke sistem DiasMu.

```
GET /api/sso-users
```

**Respons Sukses (200):**
```json
[
  {
    "id": 1,
    "sso_user_id": "019e25d2-7863-726a-91a5-22b4e16e9f14",
    "nbm": "832413",
    "name": "ZAINAL ARIFIN",
    "email": "zainal@muhammadiyah.or.id",
    "last_login": "2026-05-24T08:30:00.000Z"
  },
  {
    "id": 2,
    "sso_user_id": "mock-admin@diasmu.local",
    "nbm": "123456",
    "name": "Ahmad Dahlan",
    "email": "admin@diasmu.local",
    "last_login": "2026-05-23T14:00:00.000Z"
  }
]
```

**Field yang Dikembalikan:**

| Field | Tipe | Deskripsi |
|---|---|---|
| `id` | Integer | ID auto-increment di database DiasMu |
| `sso_user_id` | String | ID unik pengguna dari SSO Muhammadiyah ID |
| `nbm` | String | Nomor Baku Muhammadiyah (bisa kosong) |
| `name` | String | Nama lengkap pengguna |
| `email` | String | Alamat email (unik) |
| `last_login` | Timestamp | Waktu login terakhir ke DiasMu |

---

### 4.2 Menyimpan / Menyinkronkan Pengguna SSO

Mengirim data pengguna untuk disimpan ke database DiasMu (upsert berdasarkan email).

```
POST /api/sso-users
```

**Request Body:**
```json
{
  "sso_user_id": "uuid-dari-sso-anda",
  "nbm": "832413",
  "name": "ZAINAL ARIFIN",
  "email": "zainal@muhammadiyah.or.id"
}
```

| Field | Wajib | Deskripsi |
|---|---|---|
| `email` | ✅ Ya | Kunci utama untuk upsert |
| `name` | Tidak | Nama lengkap (default: `"Unknown"`) |
| `nbm` | Tidak | Nomor Baku Muhammadiyah |
| `sso_user_id` | Tidak | ID SSO (jika kosong, otomatis menggunakan email) |

**Respons Sukses (200):**
```json
{
  "success": true,
  "message": "Data SSO berhasil di-sync"
}
```

---

### 4.3 Sinkronisasi Batch (Mock / Testing)

Memasukkan 10 data pengguna dummy sekaligus untuk keperluan testing.

```
POST /api/sync-mock
```

**Respons Sukses (200):**
```json
{
  "success": true,
  "message": "Berhasil melakukan mirroring 10 user SSO beserta raw data JSON ke D1.",
  "syncedCount": 10
}
```

---

## 5. Contoh Implementasi

### 5.1 JavaScript / Node.js (fetch)

```javascript
const API_URL = "https://diasmu.labmu.workers.dev";
const TOKEN   = "YOUR_SECRET_TOKEN";

// Mengambil semua user SSO
async function getSsoUsers() {
  const response = await fetch(`${API_URL}/api/sso-users`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const users = await response.json();
  console.log(`Total user: ${users.length}`);
  return users;
}

// Menyimpan satu user ke DiasMu
async function syncUser(userData) {
  const response = await fetch(`${API_URL}/api/sso-users`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userData)
  });

  return await response.json();
}

// Contoh penggunaan
getSsoUsers().then(users => {
  users.forEach(user => {
    console.log(`${user.name} (${user.nbm}) — ${user.email}`);
  });
});

syncUser({
  sso_user_id: "app-123",
  nbm: "654321",
  name: "KH Ahmad Dahlan",
  email: "dahlan@muhammadiyah.or.id"
}).then(result => {
  console.log(result.message);
});
```

---

### 5.2 Python (requests)

```python
import requests

API_URL = "https://diasmu.labmu.workers.dev"
TOKEN   = "YOUR_SECRET_TOKEN"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Mengambil semua user SSO
def get_sso_users():
    response = requests.get(f"{API_URL}/api/sso-users", headers=HEADERS)
    response.raise_for_status()
    users = response.json()
    print(f"Total user: {len(users)}")
    return users

# Menyimpan satu user ke DiasMu
def sync_user(sso_user_id, nbm, name, email):
    payload = {
        "sso_user_id": sso_user_id,
        "nbm": nbm,
        "name": name,
        "email": email
    }
    response = requests.post(f"{API_URL}/api/sso-users", headers=HEADERS, json=payload)
    return response.json()

# Contoh penggunaan
users = get_sso_users()
for user in users:
    print(f"{user['name']} ({user['nbm']}) — {user['email']}")

result = sync_user("app-456", "111222", "Siti Walidah", "walidah@aisyiyah.or.id")
print(result["message"])
```

---

### 5.3 PHP (cURL)

```php
<?php
$apiUrl = "https://diasmu.labmu.workers.dev";
$token  = "YOUR_SECRET_TOKEN";

// Mengambil semua user SSO
function getSsoUsers() {
    global $apiUrl, $token;

    $ch = curl_init("$apiUrl/api/sso-users");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer $token",
            "Content-Type: application/json"
        ]
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception("HTTP Error: $httpCode");
    }

    return json_decode($response, true);
}

// Menyimpan satu user ke DiasMu
function syncUser($ssoUserId, $nbm, $name, $email) {
    global $apiUrl, $token;

    $payload = json_encode([
        "sso_user_id" => $ssoUserId,
        "nbm"         => $nbm,
        "name"        => $name,
        "email"       => $email
    ]);

    $ch = curl_init("$apiUrl/api/sso-users");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer $token",
            "Content-Type: application/json"
        ]
    ]);

    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
}

// Contoh penggunaan
$users = getSsoUsers();
echo "Total user: " . count($users) . "\n";

foreach ($users as $user) {
    echo "{$user['name']} ({$user['nbm']}) — {$user['email']}\n";
}

$result = syncUser("app-789", "333444", "Mas Mansyur", "mansyur@muhammadiyah.or.id");
echo $result["message"] . "\n";
```

---

### 5.4 cURL (Command Line)

```bash
# Mengambil semua user SSO
curl -X GET "https://diasmu.labmu.workers.dev/api/sso-users" \
  -H "Authorization: Bearer YOUR_SECRET_TOKEN" \
  -H "Content-Type: application/json"

# Menyimpan satu user
curl -X POST "https://diasmu.labmu.workers.dev/api/sso-users" \
  -H "Authorization: Bearer YOUR_SECRET_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sso_user_id": "app-test-001",
    "nbm": "999888",
    "name": "Test User",
    "email": "test@muhammadiyah.or.id"
  }'

# Testing batch mock (10 user dummy)
curl -X POST "https://diasmu.labmu.workers.dev/api/sync-mock" \
  -H "Authorization: Bearer YOUR_SECRET_TOKEN"
```

---

## 6. Contoh Sinkronisasi (Mirroring)

Jika aplikasi Anda ingin menyimpan salinan data pengguna DiasMu secara berkala, berikut panduan implementasinya.

### 6.1 Strategi Sinkronisasi

| Strategi | Kapan Digunakan | Kelebihan | Kekurangan |
|---|---|---|---|
| **Full Sync (Periodik)** | Setiap 1 jam / 1 hari | Data selalu terbaru | Beban API lebih besar |
| **Webhook / Event** | Saat ada login baru | Real-time | Butuh endpoint webhook di sisi Anda |
| **On-Demand** | Saat user akses fitur tertentu | Hemat resource | Data mungkin tertunda |

### 6.2 Contoh Full Sync dengan Node.js

```javascript
const API_URL = "https://diasmu.labmu.workers.dev";
const TOKEN   = "YOUR_SECRET_TOKEN";

// Jalankan setiap 1 jam menggunakan cron / setInterval
async function fullSync() {
  console.log(`[${new Date().toISOString()}] Memulai sinkronisasi...`);

  try {
    // 1. Ambil semua data dari DiasMu
    const res = await fetch(`${API_URL}/api/sso-users`, {
      headers: { "Authorization": `Bearer ${TOKEN}` }
    });
    const users = await res.json();

    // 2. Simpan ke database lokal Anda
    for (const user of users) {
      await saveToLocalDB({
        diasmu_id: user.id,
        sso_user_id: user.sso_user_id,
        nbm: user.nbm,
        name: user.name,
        email: user.email,
        last_login: user.last_login,
        synced_at: new Date().toISOString()
      });
    }

    console.log(`✅ Berhasil sinkronisasi ${users.length} user.`);
  } catch (error) {
    console.error("❌ Gagal sinkronisasi:", error.message);
  }
}

// Ganti dengan fungsi database Anda (MySQL, PostgreSQL, SQLite, dll.)
async function saveToLocalDB(data) {
  // Contoh: INSERT OR REPLACE INTO users ...
  console.log(`  → Sync: ${data.name} (${data.email})`);
}

// Jalankan
fullSync();
```

### 6.3 Contoh Cron Job (Linux)

```bash
# Edit crontab
crontab -e

# Jalankan sinkronisasi setiap 1 jam
0 * * * * /usr/bin/node /path/to/sync-diasmu.js >> /var/log/diasmu-sync.log 2>&1
```

---

## 7. Kode Error & Penanganan

| HTTP Status | Penyebab | Solusi |
|---|---|---|
| `200` | Sukses | — |
| `400` | Request body tidak valid (misal: email kosong) | Periksa payload JSON Anda |
| `401` | Token tidak valid atau tidak disertakan | Periksa header `Authorization` |
| `500` | Error internal server (misalnya tabel belum ada) | Hubungi admin DiasMu |

### Contoh Penanganan Error

```javascript
const res = await fetch(`${API_URL}/api/sso-users`, {
  headers: { "Authorization": `Bearer ${TOKEN}` }
});

if (res.status === 401) {
  console.error("❌ Token ditolak! Periksa kredensial Anda.");
} else if (res.status === 500) {
  const error = await res.json();
  console.error("❌ Server error:", error.message || error.error);
} else if (res.ok) {
  const data = await res.json();
  console.log("✅ Data diterima:", data.length, "user");
}
```

---

## 8. Keamanan & Best Practices

### ✅ Yang Harus Dilakukan

1. **Simpan token di environment variable**, jangan pernah hardcode di source code.
   ```bash
   # .env
   DIASMU_API_TOKEN=Bearer_token_rahasia_anda
   ```

2. **Gunakan HTTPS** — API DiasMu hanya menerima koneksi HTTPS.

3. **Batasi akses token** — Jangan bagikan token ke frontend / client-side code. Token hanya boleh digunakan di server-to-server.

4. **Terapkan caching** — Jangan memanggil API setiap detik. Simpan data di cache lokal dan perbarui secara berkala (misal setiap 1 jam).

5. **Log semua aktivitas sinkronisasi** — Catat kapan terakhir kali sinkronisasi berhasil/gagal.

### ❌ Yang Tidak Boleh Dilakukan

1. **JANGAN** ekspos token di kode JavaScript yang berjalan di browser.
2. **JANGAN** menyimpan password pengguna — DiasMu tidak menyediakan dan tidak menyimpan password.
3. **JANGAN** membuat request lebih dari 100x/menit ke API yang sama untuk menghindari rate limiting.
4. **JANGAN** menggunakan data pengguna untuk tujuan di luar kebutuhan aplikasi Anda.

---

## 9. Login SSO via DiasMu (OAuth 2.0 Authorization Code Flow)

Selain akses API langsung, Anda juga bisa menggunakan DiasMu sebagai **penyedia SSO** — sehingga pengguna aplikasi Anda bisa login menggunakan akun DiasMu/Muhammadiyah ID mereka, dan setelah login akan **kembali ke aplikasi Anda** (bukan ke DiasMu).

### 9.1 Alur Login (Authorization Code Flow)

```
Aplikasi Anda                    DiasMu                      SSO Muhammadiyah ID
─────────────                    ──────                      ────────────────────
1. User klik                     
   "Login"                       
       │                         
       ▼                         
2. Redirect ke ──────────────►  3. Cek session
   /oauth/authorize                 │
   ?client_id=xxx                   ├── Sudah login? → 4
   &redirect_uri=xxx                └── Belum? ──────────────► Login di SSO
   &response_type=code                                               │
                                 4. Tampilkan halaman            ◄────┘
                                    "Izinkan Akses?"
                                        │
                                 5. User klik "Izinkan"
                                    Generate auth code
                                        │
       ◄────────────────────── 6. Redirect kembali ke
                                    redirect_uri?code=abc123
       │
7. Tukar code → token
   POST /oauth/token
       │
8. Ambil profil user
   GET /oauth/userinfo
       │
       ▼
✅ Login berhasil!
```

### 9.2 URL & Endpoint

| Endpoint | URL | Metode |
|---|---|---|
| Authorization | `https://diasmu.pages.dev/oauth/authorize` | `GET` (browser redirect) |
| Token Exchange | `https://diasmu.labmu.workers.dev/oauth/token` | `POST` |
| User Info | `https://diasmu.labmu.workers.dev/oauth/userinfo` | `GET` |

### 9.3 Langkah 1: Redirect User ke DiasMu

Dari aplikasi Anda, arahkan pengguna ke URL berikut:

```
https://diasmu.pages.dev/oauth/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=https://staging.webmu.pages.dev/callback
  &response_type=code
  &state=RANDOM_STRING
```

| Parameter | Wajib | Deskripsi |
|---|---|---|
| `client_id` | ✅ | Client ID dari Pengaturan Developer DiasMu |
| `redirect_uri` | ✅ | URL callback yang terdaftar di DiasMu |
| `response_type` | ✅ | Harus bernilai `code` |
| `state` | Tidak | Random string untuk mencegah CSRF (sangat disarankan) |

### 9.4 Langkah 2: User Login & Izinkan Akses

DiasMu akan menampilkan halaman otorisasi:
- Jika user **belum login** → diarahkan ke login (SSO Muhammadiyah ID) terlebih dahulu
- Jika user **sudah login** → tampilkan halaman "Izinkan Akses?" dengan nama aplikasi Anda
- User klik **"Izinkan Akses"** → DiasMu me-redirect kembali ke `redirect_uri` Anda:

```
https://staging.webmu.pages.dev/callback?code=aBcDeFgH123456&state=RANDOM_STRING
```

### 9.5 Langkah 3: Tukar Code dengan Access Token

Dari **backend** aplikasi Anda, tukar authorization code dengan access token:

```bash
POST https://diasmu.labmu.workers.dev/oauth/token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "aBcDeFgH123456",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "redirect_uri": "https://staging.webmu.pages.dev/callback"
}
```

**Respons Sukses:**
```json
{
  "access_token": "LoNgRaNdOmToKeN64ChArAcTeRs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

> ⚠️ Authorization code hanya berlaku **5 menit** dan hanya bisa digunakan **sekali**.

### 9.6 Langkah 4: Ambil Profil User

Gunakan access token untuk mengambil data profil pengguna:

```bash
GET https://diasmu.labmu.workers.dev/oauth/userinfo
Authorization: Bearer LoNgRaNdOmToKeN64ChArAcTeRs...
```

**Respons:**
```json
{
  "sub": "zainal@muhammadiyah.or.id",
  "name": "ZAINAL ARIFIN",
  "email": "zainal@muhammadiyah.or.id",
  "nbm": "832413",
  "picture": "https://sso.muhammadiyah.id/path/to/avatar.jpg"
}
```

### 9.7 Contoh Implementasi Lengkap (Next.js)

#### Tombol Login di halaman Anda

```typescript
// app/login/page.tsx
const CLIENT_ID = "client_5L26ZbemXqazDiQ7GxWks2lD";
const REDIRECT_URI = "https://staging.webmu.pages.dev/api/auth/callback/diasmu";

export default function LoginPage() {
  const state = Math.random().toString(36).substring(7);
  const loginUrl = `https://diasmu.pages.dev/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&state=${state}`;

  return (
    <a href={loginUrl}>
      <button>Login dengan DiasMu</button>
    </a>
  );
}
```

#### Callback handler di backend Anda

```typescript
// app/api/auth/callback/diasmu/route.ts
import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = process.env.DIASMU_CLIENT_ID!;
const CLIENT_SECRET = process.env.DIASMU_CLIENT_SECRET!;
const REDIRECT_URI = "https://staging.webmu.pages.dev/api/auth/callback/diasmu";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect("/login?error=no_code");
  }

  // 1. Tukar code → token
  const tokenRes = await fetch("https://diasmu.labmu.workers.dev/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI
    })
  });
  const tokenData = await tokenRes.json();

  if (!tokenData.access_token) {
    return NextResponse.redirect("/login?error=token_failed");
  }

  // 2. Ambil profil user
  const userRes = await fetch("https://diasmu.labmu.workers.dev/oauth/userinfo", {
    headers: { "Authorization": `Bearer ${tokenData.access_token}` }
  });
  const user = await userRes.json();

  // 3. Buat session di aplikasi Anda
  // ... (simpan ke cookie, database, atau session store Anda)
  console.log("User login:", user.name, user.email, user.nbm);

  return NextResponse.redirect("/dashboard");
}
```

---

## 10. FAQ

### Q: Apakah saya bisa mendapatkan password pengguna dari API?
**Tidak.** DiasMu tidak menyimpan password. Autentikasi sepenuhnya ditangani oleh SSO Muhammadiyah ID.

### Q: Berapa batas data yang bisa saya tarik?
Endpoint `GET /api/sso-users` mengembalikan **seluruh data** yang ada di database. Saat ini belum ada pagination. Jika jumlah user sudah sangat besar, hubungi admin untuk implementasi pagination.

### Q: Bagaimana jika token saya bocor?
Segera hubungi admin DiasMu untuk **mencabut akses** (Cabut Akses) di menu Pengaturan Developer dan membuat kredensial baru.

### Q: Apakah API ini mendukung CORS untuk dipanggil dari browser?
API DiasMu hanya mengizinkan CORS dari domain `https://diasmu.pages.dev` dan `http://localhost:3000`. Endpoint `/oauth/*` terbuka untuk semua domain. Tukar code → token dan ambil userinfo **harus** dilakukan dari backend.

### Q: Berapa lama authorization code dan access token berlaku?
- **Authorization code:** 5 menit (sekali pakai)
- **Access token:** 1 jam

### Q: Data apa saja yang bisa saya akses dari userinfo?
| Field | Deskripsi |
|---|---|
| `sub` | Email pengguna (subject identifier) |
| `name` | Nama lengkap |
| `email` | Alamat email |
| `nbm` | Nomor Baku Muhammadiyah |

---

## Kontak & Dukungan

Jika mengalami kesulitan dalam integrasi, silakan hubungi:

- **Tim LabMu** — Developer DiasMu
- **Dashboard Admin** — `https://diasmu.pages.dev/admin/developer`

---

*Dokumentasi ini terakhir diperbarui pada 24 Mei 2026.*
*Versi API: v1.0 — DiasMu by LabMu Muhammadiyah.*

