const API_BASE_URL = "https://diasmu.labmu.workers.dev";

type AuditMetadata = Record<string, string | number | boolean | null | undefined>;

export function getInternalSecret() {
  const token = process.env.DIASMU_SECRET_TOKEN;

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
