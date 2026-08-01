import { Hono } from 'hono'

type Bindings = { DB: D1Database }
const developer = new Hono<{ Bindings: Bindings }>()

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
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM oauth_clients ORDER BY id DESC').all();
    return c.json(results);
  } catch (e: any) { return c.json({ error: e.message }, 500); }
})

// 2. CREATE NEW CLIENT
developer.post('/clients', async (c) => {
  try {
    const { app_name, redirect_uris, allow_localhost, created_by } = await c.req.json();
    
    if (!app_name) {
      return c.json({ success: false, message: "Nama Aplikasi wajib diisi" }, 400);
    }

    // Generate Client ID dan Secret
    const clientId = 'client_' + generateRandomString(24);
    const clientSecret = generateRandomString(64);

    await c.env.DB.prepare(
      `INSERT INTO oauth_clients (app_name, client_id, client_secret, redirect_uris, allow_localhost, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(app_name, clientId, clientSecret, redirect_uris || '', allow_localhost ? 1 : 0, created_by || '').run();
    
    return c.json({ 
      success: true, 
      message: "Kredensial Aplikasi berhasil dibuat",
      data: {
        app_name,
        client_id: clientId,
        client_secret: clientSecret
      }
    });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

// 3. UPDATE CLIENT
developer.put('/clients/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const { app_name, redirect_uris, allow_localhost } = await c.req.json();
    
    if (!app_name) {
      return c.json({ success: false, message: "Nama Aplikasi wajib diisi" }, 400);
    }

    await c.env.DB.prepare(
      `UPDATE oauth_clients SET app_name = ?, redirect_uris = ?, allow_localhost = ? WHERE id = ?`
    ).bind(app_name, redirect_uris || '', allow_localhost ? 1 : 0, id).run();
    
    return c.json({ success: true, message: "Kredensial berhasil diperbarui" });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

// 4. DELETE CLIENT
developer.delete('/clients/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM oauth_clients WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: "Kredensial berhasil dihapus" });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
})

export default developer;
