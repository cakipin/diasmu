import { NextRequest, NextResponse } from "next/server";
import { apiUrl, authHeaders } from "@/lib/security";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const document = formData.get("document");
    
    if (!document) {
      return NextResponse.json({ success: false, message: "No document provided" }, { status: 400 });
    }

    const up = new FormData();
    // Since req.formData() returns native Edge runtime File objects, we bypass Next.js internal Server Action bugs!
    // We send it straight to Hono backend
    up.append("document", document);

    const r = await fetch(apiUrl("/api/upload"), {
      method: "POST",
      body: up,
      headers: authHeaders(),
    });

    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    console.error("Upload proxy error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
