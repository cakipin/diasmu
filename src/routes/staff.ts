import { Hono } from 'hono'

type Bindings = { DB: D1Database }
const staff = new Hono<{ Bindings: Bindings }>()

staff.get('/staff/check/:identifier', async (c) => {
  try {
    const res = await c.env.DB.prepare('SELECT * FROM staff_roles WHERE user_identifier = ?').bind(c.req.param('identifier')).first<{allowed_type: string}>();
    return c.json(res ? { isStaff: true, allowedType: res.allowed_type } : { isStaff: false, allowedType: 'all' });
  } catch { return c.json({ isStaff: false, allowedType: 'all' }); }
})

staff.get('/staff/list/:picNbm', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT sr.id, sr.user_identifier, sr.allowed_type, s.name as staff_name FROM staff_roles sr
      JOIN pics p ON sr.pic_id = p.id
      LEFT JOIN sso_users s ON sr.user_identifier = s.nbm OR sr.user_identifier = s.email WHERE p.nbm = ? OR p.email = ?
    `).bind(c.req.param('picNbm'), c.req.param('picNbm')).all();
    return c.json(results);
  } catch { return c.json([]); }
})

staff.post('/staff/add', async (c) => {
  try {
    const { picNbm, staffIdentifier, allowedType } = await c.req.json();
    const pic = await c.env.DB.prepare('SELECT id FROM pics WHERE nbm = ? OR email = ?').bind(picNbm, picNbm).first<{id: number}>();
    if (!pic) return c.json({ success: false, message: "PIC Utama tidak sah" }, 400);

    const userExist = await c.env.DB.prepare('SELECT email FROM sso_users WHERE nbm = ? OR email = ?').bind(staffIdentifier, staffIdentifier).first();
    if (!userExist) return c.json({ success: false, message: "User belum terdaftar di SSO." }, 400);

    await c.env.DB.prepare('INSERT INTO staff_roles (pic_id, user_identifier, allowed_type) VALUES (?, ?, ?)')
      .bind(pic.id, staffIdentifier, allowedType).run();
    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

staff.delete('/staff/delete/:id', async (c) => {
  try {
    await c.env.DB.prepare('DELETE FROM staff_roles WHERE id = ?').bind(c.req.param('id')).run();
    return c.json({ success: true });
  } catch { return c.json({ success: false }, 500); }
})

export default staff;