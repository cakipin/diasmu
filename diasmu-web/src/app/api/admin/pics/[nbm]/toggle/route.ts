import { auth } from "@/auth";
import { apiUrl, auditLog, authHeaders } from "@/lib/security";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function PUT(
  _request: Request,
  context: { params: Promise<{ nbm: string }> },
) {
  const session = await auth();
  const identifier = session?.user?.nbm || session?.user?.email;

  if (!identifier) {
    return NextResponse.json({ success: false, message: "Sesi tidak valid." }, { status: 401 });
  }

  const { nbm: rawNbm } = await context.params;
  const nbm = rawNbm.replace(/[^0-9a-zA-Z.@-]/g, "");
  if (!nbm) {
    return NextResponse.json({ success: false, message: "Identitas PIC tidak valid." }, { status: 400 });
  }

  try {
    const userName = encodeURIComponent(session.user?.name || "Admin");
    const roleResponse = await fetch(
      apiUrl(`/api/check-admin/${encodeURIComponent(identifier)}?name=${userName}`),
      { cache: "no-store", headers: authHeaders() },
    );
    const role = roleResponse.ok ? await roleResponse.json() as { isAdmin?: boolean } : null;

    if (!role?.isAdmin) {
      return NextResponse.json({ success: false, message: "Akses admin diperlukan." }, { status: 403 });
    }

    const response = await fetch(apiUrl(`/api/pics/${encodeURIComponent(nbm)}/toggle`), {
      method: "PUT",
      headers: authHeaders(),
    });
    const result = await response.json() as { success?: boolean; status?: string; message?: string };

    if (!response.ok || !result.success) {
      return NextResponse.json(
        { success: false, message: result.message || "Status PIC gagal diperbarui." },
        { status: response.ok ? 502 : response.status },
      );
    }

    await auditLog("pic.toggled", { actor: identifier, targetUser: nbm, status: result.status });
    return NextResponse.json({ success: true, status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gangguan server.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
