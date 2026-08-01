import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = { DB: D1Database, DIASMU_SECRET_TOKEN: string }
const oauth = new Hono<{ Bindings: Bindings }>()

// CORS terbuka untuk endpoint OAuth publik
oauth.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}))

function generateRandomString(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ==========================================
// 1. POST /oauth/code
//    INTERNAL — Dipanggil oleh frontend DiasMu setelah user login.
//    Menghasilkan authorization code untuk ditukar oleh aplikasi client.
//    Dilindungi oleh DIASMU_SECRET_TOKEN.
// ==========================================
oauth.post('/code', async (c) => {
  try {
    // Validasi token internal
    const authHeader = c.req.header('Authorization');
    const expectedToken = `Bearer ${c.env.DIASMU_SECRET_TOKEN}`;
    if (!authHeader || authHeader !== expectedToken) {
      return c.json({ error: 'unauthorized' }, 401);
    }

    const { client_id, redirect_uri, user_email, user_name, user_nbm, user_image } = await c.req.json();

    if (!client_id || !redirect_uri || !user_email) {
      return c.json({ error: 'invalid_request', error_description: 'client_id, redirect_uri, dan user_email wajib diisi' }, 400);
    }

    // Validasi: apakah client_id terdaftar?
    const client = await c.env.DB.prepare(
      'SELECT * FROM oauth_clients WHERE client_id = ?'
    ).bind(client_id).first();

    if (!client) {
      return c.json({ error: 'invalid_client', error_description: 'Client ID tidak ditemukan' }, 400);
    }

    // Validasi: apakah redirect_uri cocok dengan yang terdaftar?
    const allowedUris = (client.redirect_uris as string || '').split(',').map(u => u.trim());
    let isRedirectValid = allowedUris.some(u => redirect_uri.startsWith(u));
    
    // Whitelist Localhost (bisa bernilai 1, "1", atau true)
    if (client.allow_localhost && redirect_uri.startsWith('http://localhost')) {
      isRedirectValid = true;
    }
    if (!isRedirectValid) {
      return c.json({ error: 'invalid_redirect_uri', error_description: 'Redirect URI tidak cocok dengan yang terdaftar' }, 400);
    }

    // Generate authorization code (expired 5 menit)
    const code = generateRandomString(48);
    const expiresAt = Math.floor(Date.now() / 1000) + 300;

    await c.env.DB.prepare(
      `INSERT INTO oauth_codes (code, client_id, user_email, user_name, user_nbm, user_image, redirect_uri, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(code, client_id, user_email, user_name || '', user_nbm || '', user_image || '', redirect_uri, expiresAt).run();

    return c.json({ success: true, code });
  } catch (e: any) {
    return c.json({ error: 'server_error', error_description: e.message }, 500);
  }
})

// ==========================================
// 2. POST /oauth/token
//    PUBLIK — Dipanggil oleh backend aplikasi client.
//    Menukar authorization code dengan access token.
//    Autentikasi via client_id + client_secret.
// ==========================================
oauth.post('/token', async (c) => {
  try {
    // Support both JSON and form-urlencoded
    let body: Record<string, string>;
    const contentType = c.req.header('Content-Type') || '';

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await c.req.parseBody();
      body = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, String(v)])
      );
    } else {
      body = await c.req.json();
    }

    const { grant_type, code, client_id, client_secret, redirect_uri } = body;

    if (grant_type !== 'authorization_code') {
      return c.json({ error: 'unsupported_grant_type' }, 400);
    }

    if (!code || !client_id || !client_secret) {
      return c.json({ error: 'invalid_request', error_description: 'code, client_id, dan client_secret wajib diisi' }, 400);
    }

    // Validasi client credentials
    const client = await c.env.DB.prepare(
      'SELECT * FROM oauth_clients WHERE client_id = ? AND client_secret = ?'
    ).bind(client_id, client_secret).first();

    if (!client) {
      return c.json({ error: 'invalid_client' }, 401);
    }

    // Validasi authorization code
    const codeRecord = await c.env.DB.prepare(
      'SELECT * FROM oauth_codes WHERE code = ? AND client_id = ? AND used = 0'
    ).bind(code, client_id).first();

    if (!codeRecord) {
      return c.json({ error: 'invalid_grant', error_description: 'Code tidak valid atau sudah digunakan' }, 400);
    }

    // Cek expired
    const now = Math.floor(Date.now() / 1000);
    if (now > (codeRecord.expires_at as number)) {
      return c.json({ error: 'invalid_grant', error_description: 'Code sudah expired' }, 400);
    }

    // Tandai code sudah digunakan
    await c.env.DB.prepare('UPDATE oauth_codes SET used = 1 WHERE code = ?').bind(code).run();

    // Generate access token (expired 1 jam)
    const accessToken = generateRandomString(64);
    const tokenExpiresAt = now + 3600;

    await c.env.DB.prepare(
      `INSERT INTO oauth_tokens (access_token, client_id, user_email, user_name, user_nbm, user_image, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(accessToken, client_id, codeRecord.user_email, codeRecord.user_name, codeRecord.user_nbm, codeRecord.user_image, tokenExpiresAt).run();

    return c.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600
    });
  } catch (e: any) {
    return c.json({ error: 'server_error', error_description: e.message }, 500);
  }
})

// ==========================================
// 3. GET /oauth/userinfo
//    PUBLIK — Dipanggil oleh backend aplikasi client.
//    Mengembalikan profil pengguna berdasarkan access token.
//    Autentikasi via header Authorization: Bearer <access_token>.
// ==========================================
oauth.get('/userinfo', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'invalid_token', error_description: 'Access token wajib disertakan' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');

    const tokenRecord = await c.env.DB.prepare(
      'SELECT * FROM oauth_tokens WHERE access_token = ?'
    ).bind(token).first();

    if (!tokenRecord) {
      return c.json({ error: 'invalid_token', error_description: 'Token tidak valid' }, 401);
    }

    // Cek expired
    const now = Math.floor(Date.now() / 1000);
    if (now > (tokenRecord.expires_at as number)) {
      return c.json({ error: 'invalid_token', error_description: 'Token sudah expired' }, 401);
    }

    return c.json({
      sub: tokenRecord.user_email,
      name: tokenRecord.user_name,
      email: tokenRecord.user_email,
      nbm: tokenRecord.user_nbm,
      picture: tokenRecord.user_image
    });
  } catch (e: any) {
    return c.json({ error: 'server_error', error_description: e.message }, 500);
  }
})

export default oauth;
