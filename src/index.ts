import { Hono } from 'hono'
import { cors } from 'hono/cors'

// 📌 IMPORT SUB-ROUTERS
import adminRouter from './routes/admin'
import picRouter from './routes/pic'
import ssoRouter from './routes/sso'
import asetRouter from './routes/aset'
import staffRouter from './routes/staff'
import developerRouter from './routes/developer'
import oauthRouter from './routes/oauth'

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
  DIASMU_SECRET_TOKEN: string // ✅ Tambahkan ini agar TypeScript tidak error
}

const app = new Hono<{ Bindings: Bindings }>()

// ==========================================
// MIDDLEWARE & GLOBAL SECURITY
// ==========================================
app.use('/api/*', cors({
  origin: ['https://diasmu.pages.dev', 'https://dias.muhammadiyah.or.id', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

// ✅ GERBANG BARU: VALIDASI TOKEN RAHASIA ANTAR SERVER
app.use('/api/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return await next();

  const authHeader = c.req.header('Authorization');
  const expectedToken = `Bearer ${c.env.DIASMU_SECRET_TOKEN}`;

  if (!authHeader || authHeader !== expectedToken) {
    return c.json({ 
      success: false, 
      message: "Akses ditolak. Endpoint ini dilindungi oleh enkripsi internal DiasMu." 
    }, 401);
  }

  await next();
});

// ==========================================
// ENDPOINT AKSES FILE PUBLIK R2 (Tanpa Auth)
// ==========================================
app.get('/public/files/:filename', async (c) => {
  try {
    const filename = c.req.param('filename');
    const object = await c.env.BUCKET.get(filename);
    if (!object) return c.json({ error: 'File tidak ditemukan' }, 404);
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Access-Control-Allow-Origin', '*');
    
    return new Response(object.body, { headers });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ==========================================
// KEMBALIKAN FITUR UPLOAD LAMPIRAN KE R2
// ==========================================
app.post('/api/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('document');
    if (!(file instanceof File)) return c.json({ success: false, message: "File tidak valid" }, 400);

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${timestamp}-${safeName}`;

    await c.env.BUCKET.put(uniqueFilename, file, {
      httpMetadata: { contentType: file.type },
    });

    return c.json({ success: true, filename: uniqueFilename });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ==========================================
// 📌 REGISTRASI CANTOLAN SUB-ROUTING
// ==========================================
app.route('/api', adminRouter)
app.route('/api', picRouter)
app.route('/api', ssoRouter)
app.route('/api', asetRouter)
app.route('/api', staffRouter)
app.route('/api/developer', developerRouter)

// ==========================================
// 📌 OAuth Provider (PUBLIK — di luar /api/* middleware)
// Endpoint: /oauth/code, /oauth/token, /oauth/userinfo
// ==========================================
app.route('/oauth', oauthRouter)

export default app