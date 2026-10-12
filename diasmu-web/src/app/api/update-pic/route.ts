import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiUrl, jsonAuthHeaders } from "@/lib/security";

export const runtime = "edge";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, message: "Akses ditolak: Autentikasi diperlukan." }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const { encodedId, dbPayload } = payload;
    
    if (!encodedId) {
      return NextResponse.json({ error: "Missing encodedId" }, { status: 400 });
    }

    const res = await fetch(apiUrl(`/api/pics/${encodedId}`), {
      method: "PUT",
      headers: jsonAuthHeaders(),
      body: JSON.stringify(dbPayload)
    });
    
    if (!res.ok) {
       const errText = await res.text();
       return NextResponse.json({ error: `Backend Hono Error: ${res.status} ${errText}` }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
