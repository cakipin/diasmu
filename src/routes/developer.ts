import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import { getDb, oauthClients } from '../db';

type Bindings = { DB: D1Database };
const developer = new Hono<{ Bindings: Bindings }>();

// Fungsi untuk men-generate random string
function generateRandomString(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 1. GET ALL CLIENTS
developer.get('/clients', async (c) => {
  const db = getDb(c.env.DB);
  try {
    const results = await db
      .select({
        id: oauthClients.id,
        app_name: oauthClients.appName,
        client_id: oauthClients.clientId,
        client_secret: oauthClients.clientSecret,
        redirect_uris: oauthClients.redirectUris,
        environment: oauthClients.environment,
        allow_localhost: oauthClients.allowLocalhost,
        created_by: oauthClients.createdBy,
        created_at: oauthClients.createdAt,
      })
      .from(oauthClients)
      .orderBy(desc(oauthClients.id));

    return c.json(results);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// 2. CREATE NEW CLIENT
developer.post('/clients', async (c) => {
  const db = getDb(c.env.DB);
  try {
    const { app_name, redirect_uris, allow_localhost, created_by, environment } = await c.req.json();

    if (!app_name) {
      return c.json({ success: false, message: 'Nama Aplikasi wajib diisi' }, 400);
    }

    // Generate Client ID dan Secret
    const clientId = 'client_' + generateRandomString(24);
    const clientSecret = generateRandomString(64);

    await db.insert(oauthClients).values({
      appName: app_name,
      clientId,
      clientSecret,
      redirectUris: redirect_uris || '',
      environment: environment === 'staging' ? 'staging' : 'production',
      allowLocalhost: allow_localhost ? 1 : 0,
      createdBy: created_by || '',
    });

    return c.json({
      success: true,
      message: 'Kredensial Aplikasi berhasil dibuat',
      data: {
        app_name,
        client_id: clientId,
        client_secret: clientSecret,
        environment: environment === 'staging' ? 'staging' : 'production',
      },
    });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// 3. UPDATE CLIENT
developer.put('/clients/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = getDb(c.env.DB);
  try {
    const { app_name, redirect_uris, allow_localhost, environment } = await c.req.json();

    if (!app_name) {
      return c.json({ success: false, message: 'Nama Aplikasi wajib diisi' }, 400);
    }

    await db
      .update(oauthClients)
      .set({
        appName: app_name,
        redirectUris: redirect_uris || '',
        environment: environment === 'staging' ? 'staging' : 'production',
        allowLocalhost: allow_localhost ? 1 : 0,
      })
      .where(eq(oauthClients.id, id));

    return c.json({ success: true, message: 'Kredensial berhasil diperbarui' });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});


// 4. DELETE CLIENT
developer.delete('/clients/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const db = getDb(c.env.DB);
  try {
    await db.delete(oauthClients).where(eq(oauthClients.id, id));
    return c.json({ success: true, message: 'Kredensial berhasil dihapus' });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default developer;
