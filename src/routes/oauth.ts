import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { and, eq } from 'drizzle-orm';
import { getDb, oauthClients, oauthCodes, oauthTokens, ssoUsers } from '../db';

type Bindings = { DB: D1Database; DIASMU_SECRET_TOKEN: string };
const oauth = new Hono<{ Bindings: Bindings }>();

// CORS terbuka untuk endpoint OAuth publik
oauth.use(
  '/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
  })
);

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
  const db = getDb(c.env.DB);
  try {
    // Validasi token internal
    const authHeader = c.req.header('Authorization');
    const expectedToken = `Bearer ${c.env.DIASMU_SECRET_TOKEN}`;
    if (!authHeader || authHeader !== expectedToken) {
      return c.json({ error: 'unauthorized' }, 401);
    }

    const { client_id, redirect_uri, user_email, user_name, user_nbm, user_image } =
      await c.req.json();

    if (!client_id || !redirect_uri || !user_email) {
      return c.json(
        {
          error: 'invalid_request',
          error_description: 'client_id, redirect_uri, dan user_email wajib diisi',
        },
        400
      );
    }

    // Validasi: apakah client_id terdaftar?
    const clientRes = await db
      .select()
      .from(oauthClients)
      .where(eq(oauthClients.clientId, client_id))
      .limit(1);

    const client = clientRes[0];
    if (!client) {
      return c.json({ error: 'invalid_client', error_description: 'Client ID tidak ditemukan' }, 400);
    }

    // Validasi: apakah redirect_uri cocok dengan yang terdaftar?
    const allowedUris = (client.redirectUris || '').split(',').map((u) => u.trim());
    let isRedirectValid = allowedUris.some((u) => redirect_uri.startsWith(u));

    // Whitelist Localhost (bisa bernilai 1, "1", atau true)
    if (client.allowLocalhost && redirect_uri.startsWith('http://localhost')) {
      isRedirectValid = true;
    }
    if (!isRedirectValid) {
      return c.json(
        {
          error: 'invalid_redirect_uri',
          error_description: 'Redirect URI tidak cocok dengan yang terdaftar',
        },
        400
      );
    }

    // Generate authorization code (expired 5 menit)
    const code = generateRandomString(48);
    const expiresAt = Math.floor(Date.now() / 1000) + 300;

    await db.insert(oauthCodes).values({
      code,
      clientId: client_id,
      userEmail: user_email,
      userName: user_name || '',
      userNbm: user_nbm || '',
      userImage: user_image || '',
      redirectUri: redirect_uri,
      expiresAt,
    });

    return c.json({ success: true, code });
  } catch (e: any) {
    return c.json({ error: 'server_error', error_description: e.message }, 500);
  }
});

// ==========================================
// 2. POST /oauth/token
//    PUBLIK — Dipanggil oleh backend aplikasi client.
//    Menukar authorization code dengan access token.
//    Autentikasi via client_id + client_secret.
// ==========================================
oauth.post('/token', async (c) => {
  const db = getDb(c.env.DB);
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

    const { grant_type, code, client_id, client_secret } = body;

    if (grant_type !== 'authorization_code') {
      return c.json({ error: 'unsupported_grant_type' }, 400);
    }

    if (!code || !client_id || !client_secret) {
      return c.json(
        {
          error: 'invalid_request',
          error_description: 'code, client_id, dan client_secret wajib diisi',
        },
        400
      );
    }

    // Validasi client credentials
    const clientRes = await db
      .select()
      .from(oauthClients)
      .where(
        and(
          eq(oauthClients.clientId, client_id),
          eq(oauthClients.clientSecret, client_secret)
        )
      )
      .limit(1);

    const client = clientRes[0];
    if (!client) {
      return c.json({ error: 'invalid_client' }, 401);
    }

    // Validasi authorization code
    const codeRecordRes = await db
      .select()
      .from(oauthCodes)
      .where(
        and(
          eq(oauthCodes.code, code),
          eq(oauthCodes.clientId, client_id),
          eq(oauthCodes.used, 0)
        )
      )
      .limit(1);

    const codeRecord = codeRecordRes[0];
    if (!codeRecord) {
      return c.json(
        {
          error: 'invalid_grant',
          error_description: 'Code tidak valid atau sudah digunakan',
        },
        400
      );
    }

    // Cek expired
    const now = Math.floor(Date.now() / 1000);
    if (now > codeRecord.expiresAt) {
      return c.json({ error: 'invalid_grant', error_description: 'Code sudah expired' }, 400);
    }

    // Tandai code sudah digunakan
    await db
      .update(oauthCodes)
      .set({ used: 1 })
      .where(eq(oauthCodes.code, code));

    // Generate access token (expired 1 jam)
    const accessToken = generateRandomString(64);
    const tokenExpiresAt = now + 3600;

    await db.insert(oauthTokens).values({
      accessToken,
      clientId: client_id,
      userEmail: codeRecord.userEmail,
      userName: codeRecord.userName,
      userNbm: codeRecord.userNbm,
      userImage: codeRecord.userImage,
      expiresAt: tokenExpiresAt,
    });

    return c.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
    });
  } catch (e: any) {
    return c.json({ error: 'server_error', error_description: e.message }, 500);
  }
});

// ==========================================
// 3. GET /oauth/userinfo
//    PUBLIK — Dipanggil oleh backend / mobile aplikasi client.
//    Mengembalikan profil pengguna + data struktural PRM, PCM, PDM, PWM.
//    Autentikasi via header Authorization: Bearer <access_token>.
// ==========================================
oauth.get('/userinfo', async (c) => {
  const db = getDb(c.env.DB);
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        { error: 'invalid_token', error_description: 'Access token wajib disertakan' },
        401
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const tokenRecordRes = await db
      .select()
      .from(oauthTokens)
      .where(eq(oauthTokens.accessToken, token))
      .limit(1);

    const tokenRecord = tokenRecordRes[0];
    if (!tokenRecord) {
      return c.json({ error: 'invalid_token', error_description: 'Token tidak valid' }, 401);
    }

    // Cek expired
    const now = Math.floor(Date.now() / 1000);
    if (now > tokenRecord.expiresAt) {
      return c.json({ error: 'invalid_token', error_description: 'Token sudah expired' }, 401);
    }

    // Ekstraksi data struktural PRM, PCM, PDM, PWM dari sso_users jika ada
    let prm = '';
    let pcm = '';
    let pdm = '';
    let pwm = '';

    if (tokenRecord.userEmail) {
      const ssoUserRes = await db
        .select({ ssoRawData: ssoUsers.ssoRawData })
        .from(ssoUsers)
        .where(eq(ssoUsers.email, tokenRecord.userEmail))
        .limit(1);

      if (ssoUserRes.length > 0 && ssoUserRes[0].ssoRawData) {
        try {
          const raw = JSON.parse(ssoUserRes[0].ssoRawData);
          prm = raw.prm || raw.ranting || '';
          pcm = raw.pcm || raw.cabang || '';
          pdm = raw.pdm || raw.daerah || '';
          pwm = raw.pwm || raw.wilayah || '';
        } catch {}
      }
    }

    return c.json({
      sub: tokenRecord.userEmail,
      name: tokenRecord.userName,
      email: tokenRecord.userEmail,
      nbm: tokenRecord.userNbm,
      picture: tokenRecord.userImage,
      prm,
      pcm,
      pdm,
      pwm,
    });
  } catch (e: any) {
    return c.json({ error: 'server_error', error_description: e.message }, 500);
  }
});

export default oauth;
