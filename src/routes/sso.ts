import { Hono } from 'hono'
type Bindings = { DB: D1Database }
const sso = new Hono<{ Bindings: Bindings }>()

// ==========================================
// 1. GET ALL SSO USERS
// ==========================================
sso.get('/sso-users', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT id, sso_user_id, nbm, name, email, last_login FROM sso_users ORDER BY id DESC').all();
    return c.json(results);
  } catch (e: any) { return c.json({ error: e.message }, 500); }
})

// ==========================================
// 2. JIT PROVISIONING (Simpan/Update saat user login)
// ==========================================
sso.post('/sso-users', async (c) => {
  try {
    const payload = await c.req.json();
    const { nbm, name, email } = payload;
    const sso_user_id = payload.sso_user_id || email || '';
    
    if (!email) {
      return c.json({ success: false, message: "Email wajib diisi" }, 400);
    }

    const rawDataStr = JSON.stringify(payload);

    // Cek apakah user sudah ada berdasarkan email
    const existing = await c.env.DB.prepare(
      'SELECT id FROM sso_users WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      // Update data yang sudah ada
      await c.env.DB.prepare(
        `UPDATE sso_users SET sso_user_id = ?, nbm = ?, name = ?, sso_raw_data = ?, last_login = CURRENT_TIMESTAMP WHERE email = ?`
      ).bind(sso_user_id, nbm || '', name || 'Unknown', rawDataStr, email).run();
    } else {
      // Insert baru
      await c.env.DB.prepare(
        `INSERT INTO sso_users (sso_user_id, nbm, name, email, sso_raw_data) VALUES (?, ?, ?, ?, ?)`
      ).bind(sso_user_id, nbm || '', name || 'Unknown', email, rawDataStr).run();
    }
    
    return c.json({ success: true, message: "Data SSO berhasil di-sync" });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

// ==========================================
// 3. SYNC MOCK BATCH (Untuk Testing Mirroring)
// ==========================================
sso.post('/sync-mock', async (c) => {
  try {
    const mockUsers = Array.from({ length: 10 }).map((_, i) => ({
      sso_user_id: `uuid-sso-${1000 + i}`,
      nbm: `NBM${1000 + i}`,
      name: `User SSO ${i + 1}`,
      email: `user${i + 1}@muhammadiyah.or.id`,
      role: i === 0 ? 'admin' : 'staff', // Contoh data tambahan
      department: 'Majelis Pustaka' // Contoh data tambahan
    }));

    const stmts = mockUsers.map(user => {
      const rawData = JSON.stringify(user);
      return c.env.DB.prepare(
        `INSERT INTO sso_users (sso_user_id, nbm, name, email, sso_raw_data) 
         VALUES (?, ?, ?, ?, ?) 
         ON CONFLICT(sso_user_id) DO UPDATE SET 
         nbm=excluded.nbm, name=excluded.name, email=excluded.email, sso_raw_data=excluded.sso_raw_data, last_login=CURRENT_TIMESTAMP`
      ).bind(user.sso_user_id, user.nbm, user.name, user.email, rawData);
    });

    const results = await c.env.DB.batch(stmts);

    return c.json({ 
      success: true, 
      message: 'Berhasil melakukan mirroring 10 user SSO beserta raw data JSON ke D1.',
      syncedCount: results.length
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
})

export default sso