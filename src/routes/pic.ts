import { Hono } from 'hono'
type Bindings = { DB: D1Database }
const pic = new Hono<{ Bindings: Bindings }>()

pic.get('/pics', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM pics ORDER BY id DESC').all();
    return c.json(results);
  } catch (e: any) { return c.json({ error: e.message }, 500); }
})

pic.post('/pics', async (c) => {
  try {
    const { nbm, name, institution, email, phone, surat_tugas, surat_permohonan, catatan, email_instansi } = await c.req.json();
    if (!name || !institution) return c.json({ success: false }, 400);
    
    await c.env.DB.prepare(
      `INSERT INTO pics (nbm, name, institution, email, phone, surat_tugas, surat_permohonan, catatan, email_instansi, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).bind(nbm || email || '-', name, institution, email || '', phone || '', surat_tugas || '', surat_permohonan || '', catatan || '', email_instansi || '').run();
    
    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

pic.post('/pics/invite', async (c) => {
  try {
    const { nbm } = await c.req.json();
    if (!nbm || nbm.trim() === "") return c.json({ success: false }, 400);

    const cleanNbm = nbm.trim();
    const ssoUser = await c.env.DB.prepare('SELECT * FROM sso_users WHERE nbm = ? OR email = ?').bind(cleanNbm, cleanNbm).first<{name: string, email: string, nbm: string}>();
    if (!ssoUser) return c.json({ success: false, message: "User tidak ada di SSO" }, 400);

    const checkExist = await c.env.DB.prepare('SELECT nbm FROM pics WHERE nbm = ? OR email = ?').bind(cleanNbm, cleanNbm).first();
    if (checkExist) return c.json({ success: false, message: "Sudah jadi PIC" }, 400);

    // ✅ PERBAIKAN: Menghapus "pics." pada kolom nbm yang memicu syntax error
    await c.env.DB.prepare(
      `INSERT INTO pics (nbm, name, institution, email, phone, surat_tugas, surat_permohonan, catatan, email_instansi, status) 
       VALUES (?, ?, 'Diundang via SSO', ?, '-', '', '', '', '-', 'approved')`
    ).bind(ssoUser.nbm || cleanNbm, ssoUser.name, ssoUser.email || '-').run();
    
    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

pic.get('/check-pic/:nbm', async (c) => {
  const nbm = c.req.param('nbm');
  try {
    // ✅ PERBAIKAN: Support NBM atau Email
    const picRes = await c.env.DB.prepare('SELECT * FROM pics WHERE nbm = ? OR email = ?').bind(nbm, nbm).first();
    if (picRes) return c.json({ isRegistered: true, status: picRes.status, data: picRes });
    return c.json({ isRegistered: false, status: null }); 
  } catch (e: any) { return c.json({ isRegistered: false, error: e.message }, 500); }
})

pic.put('/pics/:nbm/approve', async (c) => {
  const nbm = c.req.param('nbm');
  try {
    await c.env.DB.prepare("UPDATE pics SET status = 'approved' WHERE nbm = ? OR email = ?").bind(nbm, nbm).run();
    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

pic.put('/pics/:nbm/toggle', async (c) => {
  const nbm = c.req.param('nbm');
  try {
    const picRes = await c.env.DB.prepare('SELECT status FROM pics WHERE nbm = ? OR email = ?').bind(nbm, nbm).first<{status: string}>();
    if (!picRes) return c.json({ success: false });
    
    const newStatus = picRes.status === 'approved' ? 'inactive' : 'approved';
    await c.env.DB.prepare("UPDATE pics SET status = ? WHERE nbm = ? OR email = ?").bind(newStatus, nbm, nbm).run();
    return c.json({ success: true, status: newStatus });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

pic.delete('/pics/:id', async (c) => {
  const id = c.req.param('id');
  try {
    await c.env.DB.prepare('DELETE FROM pics WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

pic.put('/pics/:nbm', async (c) => {
  const nbm = c.req.param('nbm');
  try {
    const { institution, email_instansi } = await c.req.json();
    if (!institution || !email_instansi) return c.json({ success: false, message: "Data tidak lengkap" }, 400);
    
    await c.env.DB.prepare(`UPDATE pics SET institution = ?, email_instansi = ? WHERE nbm = ? OR email = ?`).bind(institution, email_instansi, nbm, nbm).run();
    return c.json({ success: true, message: "Profil instansi berhasil diperbarui" });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

export default pic