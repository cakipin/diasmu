import { Hono } from 'hono';
import { eq, or } from 'drizzle-orm';
import { getDb, staffRoles, pics, ssoUsers } from '../db';

type Bindings = { DB: D1Database };
const staff = new Hono<{ Bindings: Bindings }>();

staff.get('/staff/check/:identifier', async (c) => {
  const identifier = c.req.param('identifier');
  const db = getDb(c.env.DB);
  try {
    const res = await db
      .select({ allowedType: staffRoles.allowedType })
      .from(staffRoles)
      .where(eq(staffRoles.userIdentifier, identifier))
      .limit(1);

    return c.json(
      res.length > 0 ? { isStaff: true, allowedType: res[0].allowedType } : { isStaff: false, allowedType: 'all' }
    );
  } catch {
    return c.json({ isStaff: false, allowedType: 'all' });
  }
});

staff.get('/staff/list/:picNbm', async (c) => {
  const picNbm = c.req.param('picNbm');
  const db = getDb(c.env.DB);
  try {
    const results = await db
      .select({
        id: staffRoles.id,
        user_identifier: staffRoles.userIdentifier,
        allowed_type: staffRoles.allowedType,
        staff_name: ssoUsers.name,
      })
      .from(staffRoles)
      .innerJoin(pics, eq(staffRoles.picId, pics.id))
      .leftJoin(
        ssoUsers,
        or(
          eq(staffRoles.userIdentifier, ssoUsers.nbm),
          eq(staffRoles.userIdentifier, ssoUsers.email)
        )
      )
      .where(or(eq(pics.nbm, picNbm), eq(pics.email, picNbm)));

    return c.json(results);
  } catch {
    return c.json([]);
  }
});

staff.post('/staff/add', async (c) => {
  const db = getDb(c.env.DB);
  try {
    const { picNbm, staffIdentifier, allowedType } = await c.req.json();
    const picRes = await db
      .select({ id: pics.id })
      .from(pics)
      .where(or(eq(pics.nbm, picNbm), eq(pics.email, picNbm)))
      .limit(1);

    const pic = picRes[0];
    if (!pic) return c.json({ success: false, message: 'PIC Utama tidak sah' }, 400);

    const userExistRes = await db
      .select({ email: ssoUsers.email })
      .from(ssoUsers)
      .where(or(eq(ssoUsers.nbm, staffIdentifier), eq(ssoUsers.email, staffIdentifier)))
      .limit(1);

    if (userExistRes.length === 0) {
      return c.json({ success: false, message: 'User belum terdaftar di SSO.' }, 400);
    }

    await db.insert(staffRoles).values({
      picId: pic.id,
      userIdentifier: staffIdentifier,
      allowedType: allowedType || 'viewer',
    });

    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

staff.delete('/staff/delete/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = getDb(c.env.DB);
  try {
    await db.delete(staffRoles).where(eq(staffRoles.id, id));
    return c.json({ success: true });
  } catch {
    return c.json({ success: false }, 500);
  }
});

export default staff;