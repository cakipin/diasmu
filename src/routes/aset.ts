import { Hono } from 'hono';
import { desc, eq, inArray, or, sql } from 'drizzle-orm';
import { getDb, domains, pics, assetPermissions, ssoUsers } from '../db';

type Bindings = { DB: D1Database };
const aset = new Hono<{ Bindings: Bindings }>();

aset.get('/aset', async (c) => {
  const db = getDb(c.env.DB);
  try {
    const results = await db
      .select({
        id: domains.id,
        domain_name: domains.domainName,
        status: domains.status,
        purpose: domains.purpose,
        pic_name: pics.name,
        institution: pics.institution,
      })
      .from(domains)
      .leftJoin(pics, eq(domains.picId, pics.id))
      .orderBy(desc(domains.id));

    return c.json(results);
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

aset.post('/aset', async (c) => {
  const db = getDb(c.env.DB);
  try {
    const payload = await c.req.json();
    const picRes = await db
      .select({ id: pics.id })
      .from(pics)
      .where(or(eq(pics.nbm, payload.userNbm), eq(pics.email, payload.userNbm)))
      .limit(1);

    const pic = picRes[0];
    if (!pic) return c.json({ success: false, message: 'PIC tidak ditemukan' }, 404);

    let domain_name = '';
    const status = 'active';
    const detail = JSON.stringify(payload);

    if (payload.tipePengajuan === 'email') domain_name = payload.emailName + '@muhammadiyah.or.id';
    else if (payload.tipePengajuan === 'subdomain') domain_name = payload.domainName + '.muhammadiyah.or.id';
    else if (payload.tipePengajuan === 'medsos') domain_name = payload.platformMedsos + ' - ' + payload.namaAkunMedsos;
    else if (payload.tipePengajuan === 'domain') domain_name = payload.namaDomainMandiri;
    else if (payload.tipePengajuan === 'akun') domain_name = payload.jenisAkun + ' - ' + payload.namaLayanan;

    await db.insert(domains).values({
      picId: pic.id,
      domainName: domain_name,
      purpose: payload.purpose,
      status,
      tipeAset: payload.tipePengajuan,
      detail,
    });

    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

aset.get('/aset/pic/:identifier', async (c) => {
  const id = c.req.param('identifier');
  const db = getDb(c.env.DB);
  try {
    const userEmailsSubquery = db
      .select({ email: ssoUsers.email })
      .from(ssoUsers)
      .where(or(eq(ssoUsers.nbm, id), eq(ssoUsers.email, id)));

    const results = await db
      .selectDistinct({
        id: domains.id,
        domain_name: domains.domainName,
        status: domains.status,
        purpose: domains.purpose,
        tipe_aset: domains.tipeAset,
        detail: domains.detail,
        user_role: sql<string>`CASE WHEN ${pics.nbm} = ${id} OR ${pics.email} = ${id} THEN 'owner' ELSE ${assetPermissions.role} END`,
      })
      .from(domains)
      .innerJoin(pics, eq(domains.picId, pics.id))
      .leftJoin(assetPermissions, eq(domains.id, assetPermissions.domainId))
      .where(
        or(
          eq(pics.nbm, id),
          eq(pics.email, id),
          eq(assetPermissions.userNbm, id),
          inArray(assetPermissions.userNbm, userEmailsSubquery)
        )
      )
      .orderBy(desc(domains.id));

    return c.json(results);
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

aset.delete('/aset/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = getDb(c.env.DB);
  try {
    await db.delete(domains).where(eq(domains.id, id));
    await db.delete(assetPermissions).where(eq(assetPermissions.domainId, id));
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

aset.put('/aset/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = getDb(c.env.DB);
  try {
    const payload = await c.req.json();
    let domain_name = '';
    if (payload.tipePengajuan === 'email') domain_name = payload.emailName + '@muhammadiyah.or.id';
    else if (payload.tipePengajuan === 'subdomain') domain_name = payload.domainName + '.muhammadiyah.or.id';
    else if (payload.tipePengajuan === 'medsos') domain_name = payload.platformMedsos + ' - ' + payload.namaAkunMedsos;
    else if (payload.tipePengajuan === 'domain') domain_name = payload.namaDomainMandiri;
    else if (payload.tipePengajuan === 'akun') domain_name = payload.jenisAkun + ' - ' + payload.namaLayanan;

    await db
      .update(domains)
      .set({
        domainName: domain_name,
        purpose: payload.purpose,
        detail: JSON.stringify(payload),
      })
      .where(eq(domains.id, id));

    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

aset.get('/aset/:id/permissions', async (c) => {
  const id = Number(c.req.param('id'));
  const db = getDb(c.env.DB);
  try {
    const results = await db
      .select({
        id: assetPermissions.id,
        user_nbm: assetPermissions.userNbm,
        role: assetPermissions.role,
        user_name: ssoUsers.name,
      })
      .from(assetPermissions)
      .leftJoin(
        ssoUsers,
        or(
          eq(assetPermissions.userNbm, ssoUsers.email),
          eq(assetPermissions.userNbm, ssoUsers.nbm)
        )
      )
      .where(eq(assetPermissions.domainId, id));

    return c.json(results);
  } catch (e: any) {
    return c.json([]);
  }
});

aset.post('/aset/:id/permissions', async (c) => {
  const id = Number(c.req.param('id'));
  const db = getDb(c.env.DB);
  try {
    const { userNbm, role } = await c.req.json();
    const userExistRes = await db
      .select({ email: ssoUsers.email })
      .from(ssoUsers)
      .where(or(eq(ssoUsers.nbm, userNbm), eq(ssoUsers.email, userNbm)))
      .limit(1);

    const userExist = userExistRes[0];
    if (!userExist) {
      return c.json({ success: false, message: 'Target tidak ditemukan.' }, 400);
    }

    await db.insert(assetPermissions).values({
      domainId: id,
      userNbm: userExist.email,
      role,
    });

    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

aset.delete('/aset/permissions/:permId', async (c) => {
  const permId = Number(c.req.param('permId'));
  const db = getDb(c.env.DB);
  try {
    await db.delete(assetPermissions).where(eq(assetPermissions.id, permId));
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default aset;