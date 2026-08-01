import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiUrl, auditLog, authHeaders, jsonAuthHeaders } from "@/lib/security";

export const runtime = "edge";

export async function POST(
  request: Request,
  context: { params: Promise<{ role: string }> },
) {
  const session = await auth();
  const identifier = session?.user?.nbm || session?.user?.email;

  if (!identifier) {
    return NextResponse.json({ success: false, message: "Sesi tidak valid." }, { status: 401 });
  }

  try {
    const { role } = await context.params;
    if (role !== "admin" && role !== "pic") {
      return NextResponse.json({ success: false, message: "Jenis undangan tidak valid." }, { status: 400 });
    }

    const body = await request.json() as { nbm?: string };
    const nbm = String(body.nbm || "").replace(/[^0-9a-zA-Z.@-]/g, "");
    if (!nbm) {
      return NextResponse.json({ success: false, message: "NBM wajib dipilih." }, { status: 400 });
    }

    const userName = encodeURIComponent(session.user?.name || "Admin");
    const roleResponse = await fetch(
      apiUrl(`/api/check-admin/${encodeURIComponent(identifier)}?name=${userName}`),
      { cache: "no-store", headers: authHeaders() },
    );
    const adminRole = roleResponse.ok ? await roleResponse.json() as { isAdmin?: boolean } : null;

    if (!adminRole?.isAdmin) {
      return NextResponse.json({ success: false, message: "Akses admin diperlukan." }, { status: 403 });
    }

    const endpoint = role === "admin" ? "/api/admins" : "/api/pics/invite";
    const response = await fetch(apiUrl(endpoint), {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ nbm }),
    });
    const result = await response.json().catch(() => ({})) as { success?: boolean; message?: string; error?: string };

    if (!response.ok || !result.success) {
      return NextResponse.json(
        { success: false, message: result.message || result.error || "Undangan gagal diproses." },
        { status: response.ok ? 502 : response.status },
      );
    }

    await auditLog(role === "admin" ? "admin.invited" : "pic.invited", {
      actor: identifier,
      targetUser: nbm,
    });

    return NextResponse.json({
      success: true,
      message: role === "admin" ? "Super Admin berhasil ditambahkan." : "PIC berhasil ditambahkan.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gangguan server.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
