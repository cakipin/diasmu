import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

const admin = new Hono<{ Bindings: Bindings }>()

admin.get('/check-admin/:identifier', async (c) => {
  const id = String(c.req.param('identifier'));
  const name = c.req.query('name') || 'Unknown'; 
  try {
    const totalAdmin = await c.env.DB.prepare('SELECT COUNT(*) as count FROM admins').first<{count: number}>();
    if (totalAdmin && totalAdmin.count === 0) {
      await c.env.DB.prepare('INSERT INTO admins (nbm, name) VALUES (?, ?)').bind(id, name).run();
      return c.json({ isAdmin: true });
    }
    
    // ✅ TAMBAHKAN CAST: Agar SQLite mencocokkan tipe datanya (Angka VS Teks) dengan presisi 100%
    const adminRes = await c.env.DB.prepare(`
      SELECT nbm FROM admins WHERE CAST(nbm AS TEXT) = ?
      UNION
      SELECT a.nbm FROM admins a JOIN sso_users s ON CAST(a.nbm AS TEXT) = CAST(s.email AS TEXT) WHERE CAST(s.nbm AS TEXT) = ?
      UNION
      SELECT a.nbm FROM admins a JOIN sso_users s ON CAST(a.nbm AS TEXT) = CAST(s.nbm AS TEXT) WHERE CAST(s.email AS TEXT) = ?
    `).bind(id, id, id).first();
    
    return c.json({ isAdmin: !!adminRes }); 
  } catch (e: any) {
    return c.json({ isAdmin: false, error: e.message }, 500);
  }
})

admin.get('/admins', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM admins ORDER BY created_at DESC').all();
    return c.json(results);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
})

admin.post('/admins', async (c) => {
  try {
    const { nbm } = await c.req.json();
    if (!nbm || nbm.trim() === "") return c.json({ success: false, message: "NBM Kosong" }, 400);
    
    const cleanNbm = String(nbm.trim());
    const ssoUser = await c.env.DB.prepare('SELECT * FROM sso_users WHERE CAST(nbm AS TEXT) = ? OR CAST(email AS TEXT) = ?').bind(cleanNbm, cleanNbm).first<{nbm: string, name: string, email: string}>();
    if (!ssoUser) return c.json({ success: false, message: "NBM tidak ada di SSO" }, 400);

    const checkExist = await c.env.DB.prepare('SELECT nbm FROM admins WHERE CAST(nbm AS TEXT) = ? OR CAST(nbm AS TEXT) = ?').bind(cleanNbm, String(ssoUser.email)).first();
    if (checkExist) return c.json({ success: false, message: "Sudah jadi admin" }, 400);

    await c.env.DB.prepare('INSERT INTO admins (nbm, name) VALUES (?, ?)').bind(ssoUser.nbm || cleanNbm, ssoUser.name).run();
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
})

admin.delete('/admins/:nbm', async (c) => {
  const nbm = String(c.req.param('nbm'));
  try {
    await c.env.DB.prepare('DELETE FROM admins WHERE CAST(nbm AS TEXT) = ?').bind(nbm).run();
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
})

export default admin