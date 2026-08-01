import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { jsonAuthHeaders } from "@/lib/security";

export const runtime = "edge";

const WORKER_URL = "https://diasmu.labmu.workers.dev";

type GenerateCodeBody = {
  client_id?: string;
  redirect_uri?: string;
};

export async function POST(request: NextRequest) {
  // Pastikan user sudah login
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json() as GenerateCodeBody;

    // Forward ke Worker endpoint /oauth/code (yang dilindungi DIASMU_SECRET_TOKEN)
    const res = await fetch(`${WORKER_URL}/oauth/code`, {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({
        client_id: body.client_id,
        redirect_uri: body.redirect_uri,
        user_email: session.user.email,
        user_name: session.user.name || '',
        user_nbm: session.user.nbm || '',
        user_image: session.user.image || ''
      })
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: "server_error", error_description: message }, { status: 500 });
  }
}
