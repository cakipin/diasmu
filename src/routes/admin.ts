import { Hono } from 'hono';
import { count, desc, eq, or, sql } from 'drizzle-orm';
import { getDb, admins, ssoUsers } from '../db';

type Bindings = {
  DB: D1Database;
};

const admin = new Hono<{ Bindings: Bindings }>();

admin.get('/check-admin/:identifier', async (c) => {
  const id = String(c.req.param('identifier'));
  const name = c.req.query('name') || 'Unknown';
  const db = getDb(c.env.DB);

  try {
    const totalAdminRes = await db.select({ value: count() }).from(admins);
    const totalCount = totalAdminRes[0]?.value || 0;

    if (totalCount === 0) {
      await db.insert(admins).values({ nbm: id, name });
      return c.json({ isAdmin: true });
    }

    // Cek kecocokan langsung pada admins atau relasi SSO user
    const directAdmin = await db
      .select({ nbm: admins.nbm })
      .from(admins)
      .where(sql`CAST(${admins.nbm} AS TEXT) = ${id}`)
      .limit(1);

    if (directAdmin.length > 0) {
      return c.json({ isAdmin: true });
    }

    // Cek kecocokan via SSO (nbm/email alias)
    const ssoAdmin = await db
      .select({ nbm: admins.nbm })
      .from(admins)
      .innerJoin(
        ssoUsers,
        or(
          sql`CAST(${admins.nbm} AS TEXT) = CAST(${ssoUsers.email} AS TEXT)`,
          sql`CAST(${admins.nbm} AS TEXT) = CAST(${ssoUsers.nbm} AS TEXT)`
        )
      )
      .where(
        or(
          sql`CAST(${ssoUsers.nbm} AS TEXT) = ${id}`,
          sql`CAST(${ssoUsers.email} AS TEXT) = ${id}`
        )
      )
      .limit(1);

    return c.json({ isAdmin: ssoAdmin.length > 0 });
  } catch (e: any) {
    return c.json({ isAdmin: false, error: e.message }, 500);
  }
});

admin.get('/admins', async (c) => {
  const db = getDb(c.env.DB);
  try {
    const results = await db
      .select({
        nbm: admins.nbm,
        name: admins.name,
        created_at: admins.createdAt,
      })
      .from(admins)
      .orderBy(desc(admins.createdAt));
    return c.json(results);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

admin.post('/admins', async (c) => {
  const db = getDb(c.env.DB);
  try {
    const { nbm } = await c.req.json();
    if (!nbm || nbm.trim() === '') return c.json({ success: false, message: 'NBM Kosong' }, 400);

    const cleanNbm = String(nbm.trim());
    const ssoUserList = await db
      .select()
      .from(ssoUsers)
      .where(
        or(
          sql`CAST(${ssoUsers.nbm} AS TEXT) = ${cleanNbm}`,
          sql`CAST(${ssoUsers.email} AS TEXT) = ${cleanNbm}`
        )
      )
      .limit(1);

    const ssoUser = ssoUserList[0];
    if (!ssoUser) return c.json({ success: false, message: 'NBM tidak ada di SSO' }, 400);

    const checkExist = await db
      .select()
      .from(admins)
      .where(
        or(
          sql`CAST(${admins.nbm} AS TEXT) = ${cleanNbm}`,
          sql`CAST(${admins.nbm} AS TEXT) = ${String(ssoUser.email)}`
        )
      )
      .limit(1);

    if (checkExist.length > 0) return c.json({ success: false, message: 'Sudah jadi admin' }, 400);

    await db.insert(admins).values({
      nbm: ssoUser.nbm || cleanNbm,
      name: ssoUser.name,
    });

    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

admin.delete('/admins/:nbm', async (c) => {
  const nbm = String(c.req.param('nbm'));
  const db = getDb(c.env.DB);
  try {
    await db.delete(admins).where(sql`CAST(${admins.nbm} AS TEXT) = ${nbm}`);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default admin;