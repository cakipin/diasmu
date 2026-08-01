const API_BASE_URL = "https://diasmu.labmu.workers.dev";

type AuditMetadata = Record<string, string | number | boolean | null | undefined>;

export function getInternalSecret() {
  let token = process.env.DIASMU_SECRET_TOKEN;

  if (!token) {
    try {
      // Fallback for Cloudflare Edge runtime in Server Actions where process.env might be dropped
      const { getRequestContext } = require("@cloudflare/next-on-pages");
      const ctx = getRequestContext();
      token = (ctx.env as any).DIASMU_SECRET_TOKEN;
    } catch (e) {
      // ignore
    }
  }

  if (!token) {
    throw new Error("DIASMU_SECRET_TOKEN belum dikonfigurasi di environment.");
  }

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
