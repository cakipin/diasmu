import { NextRequest, NextResponse } from "next/server";
import { apiUrl, authHeaders } from "@/lib/security";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // Forward the raw stream directly to Hono to bypass Next.js Edge formData parsing bugs completely!
    const contentType = req.headers.get("content-type") || "";
    
    // Web APIs fetch on Edge runtime supports duplex: "half" for streaming bodies
    const r = await fetch(apiUrl("/api/upload"), {
      method: "POST",
      headers: {
        "Authorization": authHeaders().Authorization,
        "Content-Type": contentType,
      },
      body: req.body,
      // @ts-ignore
      duplex: "half"
    });

    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (e: any) {
    console.error("Upload proxy error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
