const API_BASE_URL = "https://diasmu.labmu.workers.dev";

type AuditMetadata = Record<string, string | number | boolean | null | undefined>;

export function getInternalSecret() {
  const token = process.env.DIASMU_SECRET_TOKEN || "Muhammadiyah1912_AmanSentosa!?";
  return token;
}

export function authHeaders() {
  return {
    Authorization: `Bearer ${getInternalSecret()}`,
  };
}

export function jsonAuthHeaders() {
  return {
    "Content-Type": "application/json",
    ...authHeaders(),
  };
}

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export async function auditLog(action: string, metadata: AuditMetadata = {}) {
  try {
    await fetch(apiUrl("/api/audit-logs"), {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        action,
        actor: metadata.actor || "system",
        metadata,
        createdAt: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error("Audit log gagal dicatat:", error);
  }
}

/**
 * 🛡️ GUARD OTORISASI SERVER COMPONENT (Mitigasi Celah RSC Header Bypass)
 * Memastikan sesi pengguna ada dan memiliki hak akses Super Admin.
 * Jika tidak berhak, fungsi ini melempar redirect secara langsung sebelum data sensitif dibaca/dirender.
 */
export async function requireAdminSession() {
  const { auth } = await import("@/auth");
  const { redirect } = await import("next/navigation");

  const session = await auth();
  if (!session?.user) {
    redirect("/login");
    throw new Error("Unauthorized");
  }

  const user = session.user as any;
  const identifier = (user.nbm as string) || (user.email as string);
  if (!identifier) {
    redirect("/pengajuan");
    throw new Error("Unauthorized");
  }

  try {
    const userName = encodeURIComponent(session.user.name || "Admin");
    const roleCheck = await fetch(apiUrl(`/api/check-admin/${encodeURIComponent(identifier)}?name=${userName}`), {
      cache: "no-store",
      headers: authHeaders(),
    });

    if (roleCheck.ok) {
      const result = await roleCheck.json();
      if (result.isAdmin) {
        return session;
      }
    }
  } catch (error) {
    console.error("Gagal verifikasi status admin:", error);
  }

  // Jika bukan admin, tolak akses dan tendang ke halaman pengajuan
  redirect("/pengajuan");
}

/**
 * 🛡️ GUARD OTORISASI SESI UMUM
 * Memastikan sesi pengguna terotentikasi.
 */
export async function requireAuthSession() {
  const { auth } = await import("@/auth");
  const { redirect } = await import("next/navigation");

  const session = await auth();
  if (!session?.user) {
    redirect("/login");
    throw new Error("Unauthorized");
  }
  return session;
}

