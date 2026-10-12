import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 1. Tabel Penanggung Jawab / Admin PIC
export const pics = sqliteTable('pics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nbm: text('nbm').notNull(),
  name: text('name').notNull(),
  institution: text('institution').notNull(),
  email: text('email'),
  phone: text('phone'),
  status: text('status').default('pending'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  suratTugas: text('surat_tugas'),
  suratPermohonan: text('surat_permohonan'),
  catatan: text('catatan'),
  emailInstansi: text('email_instansi'),
  masaAktifSuratTugas: text('masa_aktif_surat_tugas'),
});

// 2. Tabel Aset Subdomain & Layanan
export const domains = sqliteTable('domains', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  domainName: text('domain_name').notNull(),
  targetIp: text('target_ip'),
  purpose: text('purpose'),
  picId: integer('pic_id').references(() => pics.id),
  status: text('status').default('active'),
  tipeAset: text('tipe_aset').default('subdomain'),
  detail: text('detail'),
});

// 3. Tabel Aset Sosial Media
export const socialAccounts = sqliteTable('social_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  platform: text('platform').notNull(),
  username: text('username').notNull(),
  registeredEmail: text('registered_email').notNull(),
  has2fa: integer('has_2fa').default(0),
  picId: integer('pic_id').references(() => pics.id),
});

// 4. Tabel Delegasi Akses Staf PIC
export const staffRoles = sqliteTable('staff_roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  picId: integer('pic_id').notNull().references(() => pics.id),
  userIdentifier: text('user_identifier').notNull(),
  allowedType: text('allowed_type').notNull().default('viewer'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

// 5. Tabel SSO Users
export const ssoUsers = sqliteTable('sso_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ssoUserId: text('sso_user_id').unique(),
  nbm: text('nbm'),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  ssoRawData: text('sso_raw_data'),
  lastLogin: text('last_login').default(sql`(CURRENT_TIMESTAMP)`),
});

// 6. Tabel Kredensial Aplikasi (OAuth / SSO Clients)
export const oauthClients = sqliteTable('oauth_clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  appName: text('app_name').notNull(),
  clientId: text('client_id').unique().notNull(),
  clientSecret: text('client_secret').notNull(),
  redirectUris: text('redirect_uris'),
  environment: text('environment').default('production'),
  createdBy: text('created_by'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  allowLocalhost: integer('allow_localhost').default(0),
});


// 7. Tabel OAuth Authorization Codes
export const oauthCodes = sqliteTable('oauth_codes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').unique().notNull(),
  clientId: text('client_id').notNull(),
  userEmail: text('user_email').notNull(),
  userName: text('user_name'),
  userNbm: text('user_nbm'),
  redirectUri: text('redirect_uri').notNull(),
  expiresAt: integer('expires_at').notNull(),
  used: integer('used').default(0),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  userImage: text('user_image'),
});

// 8. Tabel OAuth Access Tokens
export const oauthTokens = sqliteTable('oauth_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accessToken: text('access_token').unique().notNull(),
  clientId: text('client_id').notNull(),
  userEmail: text('user_email').notNull(),
  userName: text('user_name'),
  userNbm: text('user_nbm'),
  expiresAt: integer('expires_at').notNull(),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  userImage: text('user_image'),
});

// 9. Tabel Super Admin (PK: nbm)
export const admins = sqliteTable('admins', {
  nbm: text('nbm').primaryKey(),
  name: text('name'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

// 10. Tabel Hak Akses Aset (Asset Permissions)
export const assetPermissions = sqliteTable('asset_permissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  domainId: integer('domain_id').references(() => domains.id),
  userNbm: text('user_nbm'),
  role: text('role').default('viewer'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

// 11. Tabel Audit Logs Keamanan Sistem
export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(),
  actor: text('actor').notNull(),
  metadata: text('metadata'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

