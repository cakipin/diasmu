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
// ENDPOINT AKSES FILE R2 (Wajib Auth Bearer)
// Dipindahkan ke /api/files/:filename di bawah middleware DIASMU_SECRET_TOKEN
// ==========================================
const handleFileStream = async (c: any) => {
  try {
    const filename = c.req.param('filename');
    const object = await c.env.BUCKET.get(filename);
    if (!object) return c.json({ error: 'File tidak ditemukan' }, 404);
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    
    return new Response(object.body, { headers });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
};

app.get('/api/files/:filename', handleFileStream);


// ==========================================
// KEMBALIKAN FITUR UPLOAD LAMPIRAN KE R2
// ==========================================
app.post('/api/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('document');
    if (!(file instanceof File)) return c.json({ success: false, message: "File tidak valid" }, 400);

    // 🛡️ 1. BATAS UKURAN MAKSIMAL 2MB
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return c.json({ success: false, message: "Ukuran berkas melebihi batas maksimal 2MB" }, 400);
    }

    // 🛡️ 2. ALLOW-LIST MIME TYPE & EKSTENSI HANYA PDF DAN GAMBAR
    const allowedMime = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const lowerName = file.name.toLowerCase();
    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg'];
    const hasValidExt = allowedExts.some(ext => lowerName.endsWith(ext));

    if (!allowedMime.includes(file.type.toLowerCase()) || !hasValidExt) {
      return c.json({ success: false, message: "Hanya berkas format PDF, PNG, atau JPG yang diizinkan" }, 400);
    }

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