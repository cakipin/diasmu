import { Hono } from 'hono';
import { desc, eq, sql } from 'drizzle-orm';
import { getDb, ssoUsers, auditLogs } from '../db';

type Bindings = { DB: D1Database };
const sso = new Hono<{ Bindings: Bindings }>();

// ==========================================
// 1. GET ALL SSO USERS
// ==========================================
sso.get('/sso-users', async (c) => {
  const db = getDb(c.env.DB);
  try {
    const results = await db
      .select({
        id: ssoUsers.id,
        sso_user_id: ssoUsers.ssoUserId,
        nbm: ssoUsers.nbm,
        name: ssoUsers.name,
        email: ssoUsers.email,
        sso_raw_data: ssoUsers.ssoRawData,
        last_login: ssoUsers.lastLogin,
      })
      .from(ssoUsers)
      .orderBy(desc(ssoUsers.id));

    const enrichedResults = results.map((u) => {
      let raw: Record<string, any> = {};
      if (u.sso_raw_data) {
        try {
          raw = typeof u.sso_raw_data === 'string' ? JSON.parse(u.sso_raw_data) : u.sso_raw_data;
        } catch {}
      }
      return {
        id: u.id,
        sso_user_id: u.sso_user_id,
        nbm: u.nbm,
        name: u.name,
        email: u.email,
        prm: raw.prm || raw.ranting || '',
        pcm: raw.pcm || raw.cabang || '',
        pdm: raw.pdm || raw.daerah || '',
        pwm: raw.pwm || raw.wilayah || '',
        last_login: u.last_login,
      };
    });

    return c.json(enrichedResults);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// ==========================================
// 2. JIT PROVISIONING (Simpan/Update saat user login)
// ==========================================
sso.post('/sso-users', async (c) => {
  const db = getDb(c.env.DB);
  try {
    const payload = await c.req.json();
    const { nbm, name, email } = payload;
    const sso_user_id = payload.sso_user_id || email || '';

    if (!email) {
      return c.json({ success: false, message: 'Email wajib diisi' }, 400);
    }

    const rawDataStr = typeof payload.sso_raw_data === 'string'
      ? payload.sso_raw_data
      : JSON.stringify(payload);

    // Cek apakah user sudah ada berdasarkan email
    const existing = await db
      .select({ id: ssoUsers.id })
      .from(ssoUsers)
      .where(eq(ssoUsers.email, email))
      .limit(1);

    if (existing.length > 0) {
      // Update data yang sudah ada
      await db
        .update(ssoUsers)
        .set({
          ssoUserId: sso_user_id,
          nbm: nbm || '',
          name: name || 'Unknown',
          ssoRawData: rawDataStr,
          lastLogin: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(ssoUsers.email, email));
    } else {
      // Insert baru
      await db.insert(ssoUsers).values({
        ssoUserId: sso_user_id,
        nbm: nbm || '',
        name: name || 'Unknown',
        email,
        ssoRawData: rawDataStr,
      });
    }

    return c.json({ success: true, message: 'Data SSO berhasil di-sync' });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ==========================================
// 3. SYNC MOCK BATCH (Untuk Testing Mirroring)
// ==========================================
sso.post('/sync-mock', async (c) => {
  const db = getDb(c.env.DB);
  try {
    const mockUsers = Array.from({ length: 10 }).map((_, i) => ({
      ssoUserId: `uuid-sso-${1000 + i}`,
      nbm: `NBM${1000 + i}`,
      name: `User SSO ${i + 1}`,
      email: `user${i + 1}@muhammadiyah.or.id`,
      ssoRawData: JSON.stringify({
        sso_user_id: `uuid-sso-${1000 + i}`,
        nbm: `NBM${1000 + i}`,
        name: `User SSO ${i + 1}`,
        email: `user${i + 1}@muhammadiyah.or.id`,
        role: i === 0 ? 'admin' : 'staff',
        department: 'Majelis Pustaka',
        prm: 'PRM Kauman',
        pcm: 'PCM Gondomanan',
        pdm: 'PDM Kota Yogyakarta',
        pwm: 'PWM D.I. Yogyakarta',
      }),
    }));

    for (const user of mockUsers) {
      await db
        .insert(ssoUsers)
        .values(user)
        .onConflictDoUpdate({
          target: ssoUsers.ssoUserId,
          set: {
            nbm: user.nbm,
            name: user.name,
            email: user.email,
            ssoRawData: user.ssoRawData,
            lastLogin: sql`CURRENT_TIMESTAMP`,
          },
        });
    }

    return c.json({
      success: true,
      message: 'Berhasil melakukan mirroring 10 user SSO beserta raw data JSON ke D1.',
      syncedCount: mockUsers.length,
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ==========================================
// 4. AUDIT LOGS (Pencatatan & Riwayat Keamanan)
// ==========================================
sso.post('/audit-logs', async (c) => {
  const db = getDb(c.env.DB);
  try {
    const { action, actor, metadata } = await c.req.json();
    if (!action || !actor) {
      return c.json({ success: false, message: 'Action dan Actor wajib diisi' }, 400);
    }

    const metadataStr = typeof metadata === 'object' ? JSON.stringify(metadata) : String(metadata || '');

    await db.insert(auditLogs).values({
      action,
      actor,
      metadata: metadataStr,
    });

    return c.json({ success: true, message: 'Audit log berhasil disimpan' });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

sso.get('/audit-logs', async (c) => {
  const db = getDb(c.env.DB);
  try {
    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        actor: auditLogs.actor,
        metadata: auditLogs.metadata,
        created_at: auditLogs.createdAt,
      })
      .from(auditLogs)
      .orderBy(desc(auditLogs.id))
      .limit(100);

    return c.json(logs);
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default sso;