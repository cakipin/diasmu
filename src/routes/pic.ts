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
    const body = await c.req.json();
    const { name, phone, catatan } = body;
    const nbm = body.nbm || body.userNbm || '';
    const email = body.email || '';
    const institution = body.institution || body.nama_instansi;
    const emailInstansi = body.email_instansi || body.emailInstansi || '';
    const suratTugas = body.surat_tugas ?? body.suratTugas ?? '';
    const suratPermohonan = body.surat_permohonan ?? body.suratPermohonan ?? '';

    if (!name || !institution) {
      return c.json({ success: false, message: 'Nama dan Instansi wajib diisi' }, 400);
    }

    const identifier = nbm || email;
    if (!identifier) {
      return c.json({ success: false, message: 'NBM atau Email wajib disertakan' }, 400);
    }

    // Cek apakah data PIC sudah ada sebelumnya
    const existing = await db
      .select({ id: pics.id, status: pics.status })
      .from(pics)
      .where(or(eq(pics.nbm, identifier), eq(pics.email, identifier)))
      .limit(1);

    if (existing.length > 0) {
      // Perbarui data yang ada (Upsert)
      await db
        .update(pics)
        .set({
          name,
          institution,
          phone: phone || '',
          emailInstansi,
          suratTugas: suratTugas || undefined,
          suratPermohonan: suratPermohonan || undefined,
          catatan: catatan || '',
          status: existing[0].status === 'approved' ? 'approved' : 'pending',
        })
        .where(eq(pics.id, existing[0].id));
    } else {
      // Insert baru jika belum ada
      await db.insert(pics).values({
        nbm: nbm || email || '-',
        name,
        institution,
        email: email || '',
        phone: phone || '',
        suratTugas,
        suratPermohonan,
        catatan: catatan || '',
        emailInstansi,
        status: 'pending',
      });
    }

    return c.json({ success: true, message: 'Data pendaftaran PIC berhasil disimpan' });
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
    const body = await c.req.json();
    const institution = body.institution || body.nama_instansi;
    const emailInstansi = body.email_instansi || body.emailInstansi;
    const suratTugas = body.surat_tugas ?? body.suratTugas;
    const suratPermohonan = body.surat_permohonan ?? body.suratPermohonan;

    const updateData: Record<string, any> = {};

    if (institution !== undefined && institution !== null && String(institution).trim() !== '') {
      updateData.institution = String(institution).trim();
    }
    if (emailInstansi !== undefined && emailInstansi !== null && String(emailInstansi).trim() !== '') {
      updateData.emailInstansi = String(emailInstansi).trim();
    }
    if (suratTugas !== undefined && suratTugas !== null) {
      updateData.suratTugas = String(suratTugas).trim();
    }
    if (suratPermohonan !== undefined && suratPermohonan !== null) {
      updateData.suratPermohonan = String(suratPermohonan).trim();
    }

    if (Object.keys(updateData).length === 0) {
      return c.json({ success: false, message: 'Tidak ada data perubahan yang dikirim' }, 400);
    }

    await db
      .update(pics)
      .set(updateData)
      .where(or(eq(pics.nbm, nbm), eq(pics.email, nbm)));

    return c.json({ success: true, message: 'Profil dan berkas instansi berhasil diperbarui' });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default pic;