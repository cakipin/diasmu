import { NextRequest, NextResponse } from "next/server";
import { apiUrl, authHeaders } from "@/lib/security";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const fileName = decodeURIComponent(req.headers.get("x-file-name") || "document.pdf");
    const fileType = req.headers.get("x-file-type") || "application/pdf";
    
    // Read raw binary from client to bypass Next.js multipart formData parsing bugs completely!
    const buffer = await req.arrayBuffer();
    
    if (!buffer || buffer.byteLength === 0) {
      return NextResponse.json({ success: false, message: "No document provided" }, { status: 400 });
    }

    // Construct FormData to send to Hono
    const up = new FormData();
    const blob = new Blob([buffer], { type: fileType });
    up.append("document", blob, fileName);

    const r = await fetch(apiUrl("/api/upload"), {
      method: "POST",
      headers: authHeaders(),
      body: up,
    });

    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    console.error("Upload proxy error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
