import { Hono } from 'hono'
type Bindings = { DB: D1Database }
const aset = new Hono<{ Bindings: Bindings }>()

aset.get('/aset', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT d.id, d.domain_name, d.status, d.purpose, p.name AS pic_name, p.institution 
      FROM domains d 
      LEFT JOIN pics p ON d.pic_id = p.id
      ORDER BY d.id DESC
    `).all();
    return c.json(results); 
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

aset.post('/aset', async (c) => {
  try {
    const payload = await c.req.json();
    // ✅ PERBAIKAN: Support Universal NBM/Email
    const pic = await c.env.DB.prepare('SELECT id FROM pics WHERE nbm = ? OR email = ?').bind(payload.userNbm, payload.userNbm).first<{id: number}>();
    if (!pic) return c.json({ success: false, message: "PIC tidak ditemukan" }, 404);

    let domain_name = "";
    let status = "active"; 
    let detail = JSON.stringify(payload);

    if (payload.tipePengajuan === 'email') domain_name = payload.emailName + "@muhammadiyah.or.id";
    else if (payload.tipePengajuan === 'subdomain') domain_name = payload.domainName + ".muhammadiyah.or.id";
    else if (payload.tipePengajuan === 'medsos') domain_name = payload.platformMedsos + " - " + payload.namaAkunMedsos;
    else if (payload.tipePengajuan === 'domain') domain_name = payload.namaDomainMandiri;
    else if (payload.tipePengajuan === 'akun') domain_name = payload.jenisAkun + " - " + payload.namaLayanan;

    await c.env.DB.prepare(
      `INSERT INTO domains (pic_id, domain_name, purpose, status, tipe_aset, detail) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(pic.id, domain_name, payload.purpose, status, payload.tipePengajuan, detail).run();

    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

aset.get('/aset/pic/:identifier', async (c) => {
  const id = c.req.param('identifier');
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT DISTINCT d.id, d.domain_name, d.status, d.purpose, d.tipe_aset, d.detail,
             CASE WHEN p.nbm = ? OR p.email = ? THEN 'owner' ELSE ap.role END as user_role
      FROM domains d
      JOIN pics p ON d.pic_id = p.id
      LEFT JOIN asset_permissions ap ON d.id = ap.domain_id
      WHERE p.nbm = ? 
         OR p.email = ? 
         OR ap.user_nbm = ? 
         -- ✅ PERBAIKAN FATAL: Mengganti = menjadi IN agar terhindar dari Error 500 SQLite 
         OR ap.user_nbm IN (SELECT email FROM sso_users WHERE nbm = ? OR email = ?)
      ORDER BY d.id DESC
    `).bind(id, id, id, id, id, id, id).all();
    
    return c.json(results);
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

aset.delete('/aset/:id', async (c) => {
  const id = c.req.param('id');
  try {
    await c.env.DB.prepare('DELETE FROM domains WHERE id = ?').bind(id).run();
    await c.env.DB.prepare('DELETE FROM asset_permissions WHERE domain_id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

aset.put('/aset/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const payload = await c.req.json();
    let domain_name = "";
    if (payload.tipePengajuan === 'email') domain_name = payload.emailName + "@muhammadiyah.or.id";
    else if (payload.tipePengajuan === 'subdomain') domain_name = payload.domainName + ".muhammadiyah.or.id";
    else if (payload.tipePengajuan === 'medsos') domain_name = payload.platformMedsos + " - " + payload.namaAkunMedsos;
    else if (payload.tipePengajuan === 'domain') domain_name = payload.namaDomainMandiri;
    else if (payload.tipePengajuan === 'akun') domain_name = payload.jenisAkun + " - " + payload.namaLayanan;

    await c.env.DB.prepare('UPDATE domains SET domain_name = ?, purpose = ?, detail = ? WHERE id = ?')
      .bind(domain_name, payload.purpose, JSON.stringify(payload), id).run();
    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

aset.get('/aset/:id/permissions', async (c) => {
  const id = c.req.param('id');
  try {
    const { results } = await c.env.DB.prepare(
      `SELECT ap.id, ap.user_nbm, ap.role, s.name as user_name 
       FROM asset_permissions ap
       LEFT JOIN sso_users s ON ap.user_nbm = s.email OR ap.user_nbm = s.nbm
       WHERE ap.domain_id = ?`
    ).bind(id).all();
    return c.json(results);
  } catch (e: any) { return c.json([]); }
})

aset.post('/aset/:id/permissions', async (c) => {
  const id = c.req.param('id');
  try {
    const { userNbm, role } = await c.req.json();
    const userExist = await c.env.DB.prepare('SELECT email FROM sso_users WHERE nbm = ? OR email = ?').bind(userNbm, userNbm).first<{email: string}>();
    
    if (!userExist) {
      return c.json({ success: false, message: "Target tidak ditemukan." }, 400);
    }

    await c.env.DB.prepare('INSERT INTO asset_permissions (domain_id, user_nbm, role) VALUES (?, ?, ?)')
      .bind(id, userExist.email, role).run();
      
    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

aset.delete('/aset/permissions/:permId', async (c) => {
  const permId = c.req.param('permId');
  try {
    await c.env.DB.prepare('DELETE FROM asset_permissions WHERE id = ?').bind(permId).run();
    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

export default aset