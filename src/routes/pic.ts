import { Hono } from 'hono';
import { desc, eq, or } from 'drizzle-orm';
import { getDb, pics, ssoUsers } from '../db';

type Bindings = { DB: D1Database };
const pic = new Hono<{ Bindings: Bindings }>();

pic.get('/pics', async (c) => {
  const db = getDb(c.env.DB);
  try {
    const results = await db
      .select({
        id: pics.id,
        nbm: pics.nbm,
        name: pics.name,
        institution: pics.institution,
        email: pics.email,
        phone: pics.phone,
        status: pics.status,
        created_at: pics.createdAt,
        surat_tugas: pics.suratTugas,
        surat_permohonan: pics.suratPermohonan,
        catatan: pics.catatan,
        email_instansi: pics.emailInstansi,
        masa_aktif_surat_tugas: pics.masaAktifSuratTugas,
      })
      .from(pics)
      .orderBy(desc(pics.id));

    return c.json(results);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

pic.post('/pics', async (c) => {
  const db = getDb(c.env.DB);
  try {
    const { nbm, name, institution, email, phone, surat_tugas, surat_permohonan, catatan, email_instansi } =
      await c.req.json();
    if (!name || !institution) return c.json({ success: false }, 400);

    await db.insert(pics).values({
      nbm: nbm || email || '-',
      name,
      institution,
      email: email || '',
      phone: phone || '',
      suratTugas: surat_tugas || '',
      suratPermohonan: surat_permohonan || '',
      catatan: catatan || '',
      emailInstansi: email_instansi || '',
      status: 'pending',
    });

    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

pic.post('/pics/invite', async (c) => {
  const db = getDb(c.env.DB);
  try {
    const { nbm } = await c.req.json();
    if (!nbm || nbm.trim() === '') return c.json({ success: false }, 400);

    const cleanNbm = nbm.trim();
    const ssoUserList = await db
      .select({ name: ssoUsers.name, email: ssoUsers.email, nbm: ssoUsers.nbm })
      .from(ssoUsers)
      .where(or(eq(ssoUsers.nbm, cleanNbm), eq(ssoUsers.email, cleanNbm)))
      .limit(1);

    const ssoUser = ssoUserList[0];
    if (!ssoUser) return c.json({ success: false, message: 'User tidak ada di SSO' }, 400);

    const checkExist = await db
      .select({ nbm: pics.nbm })
      .from(pics)
      .where(or(eq(pics.nbm, cleanNbm), eq(pics.email, cleanNbm)))
      .limit(1);

    if (checkExist.length > 0) return c.json({ success: false, message: 'Sudah jadi PIC' }, 400);

    await db.insert(pics).values({
      nbm: ssoUser.nbm || cleanNbm,
      name: ssoUser.name,
      institution: 'Diundang via SSO',
      email: ssoUser.email || '-',
      phone: '-',
      suratTugas: '',
      suratPermohonan: '',
      catatan: '',
      emailInstansi: '-',
      status: 'approved',
    });

    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

pic.get('/check-pic/:nbm', async (c) => {
  const nbm = c.req.param('nbm');
  const db = getDb(c.env.DB);
  try {
    const picRes = await db
      .select({
        id: pics.id,
        nbm: pics.nbm,
        name: pics.name,
        institution: pics.institution,
        email: pics.email,
        phone: pics.phone,
        status: pics.status,
        created_at: pics.createdAt,
        surat_tugas: pics.suratTugas,
        surat_permohonan: pics.suratPermohonan,
        catatan: pics.catatan,
        email_instansi: pics.emailInstansi,
        masa_aktif_surat_tugas: pics.masaAktifSuratTugas,
      })
      .from(pics)
      .where(or(eq(pics.nbm, nbm), eq(pics.email, nbm)))
      .limit(1);

    if (picRes.length > 0) {
      return c.json({ isRegistered: true, status: picRes[0].status, data: picRes[0] });
    }
    return c.json({ isRegistered: false, status: null });
  } catch (e: any) {
    return c.json({ isRegistered: false, error: e.message }, 500);
  }
});

pic.put('/pics/:nbm/approve', async (c) => {
  const nbm = c.req.param('nbm');
  const db = getDb(c.env.DB);
  try {
    await db
      .update(pics)
      .set({ status: 'approved' })
      .where(or(eq(pics.nbm, nbm), eq(pics.email, nbm)));
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

pic.put('/pics/:nbm/toggle', async (c) => {
  const nbm = c.req.param('nbm');
  const db = getDb(c.env.DB);
  try {
    const picRes = await db
      .select({ status: pics.status })
      .from(pics)
      .where(or(eq(pics.nbm, nbm), eq(pics.email, nbm)))
      .limit(1);

    if (picRes.length === 0) return c.json({ success: false });

    const currentStatus = picRes[0].status;
    const newStatus = currentStatus === 'approved' ? 'inactive' : 'approved';

    await db
      .update(pics)
      .set({ status: newStatus })
      .where(or(eq(pics.nbm, nbm), eq(pics.email, nbm)));

    return c.json({ success: true, status: newStatus });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

pic.delete('/pics/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = getDb(c.env.DB);
  try {
    await db.delete(pics).where(eq(pics.id, id));
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

pic.put('/pics/:nbm', async (c) => {
  const nbm = c.req.param('nbm');
  const db = getDb(c.env.DB);
  try {
    const { institution, email_instansi, surat_tugas, surat_permohonan } = await c.req.json();
    if (!institution || !email_instansi) {
      return c.json({ success: false, message: 'Data tidak lengkap' }, 400);
    }

    const updateData: Record<string, any> = {
      institution,
      emailInstansi: email_instansi,
    };

    if (surat_tugas !== undefined) {
      updateData.suratTugas = surat_tugas;
    }
    if (surat_permohonan !== undefined) {
      updateData.suratPermohonan = surat_permohonan;
    }

    await db
      .update(pics)
      .set(updateData)
      .where(or(eq(pics.nbm, nbm), eq(pics.email, nbm)));

    return c.json({ success: true, message: 'Profil instansi berhasil diperbarui' });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default pic;