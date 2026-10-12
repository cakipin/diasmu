import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiUrl, authHeaders } from "@/lib/security";

export const runtime = "edge";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
]);

const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export async function POST(req: NextRequest) {
  // 🛡️ 1. WAJIB AUTENTIKASI: Cegah unauthenticated file upload
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Akses ditolak: Autentikasi diperlukan untuk mengunggah dokumen." },
      { status: 401 }
    );
  }

  try {
    const rawFileName = decodeURIComponent(req.headers.get("x-file-name") || "document.pdf");
    const fileType = (req.headers.get("x-file-type") || "application/pdf").toLowerCase();

    // Sanitasi nama file dan periksa ekstensi
    const sanitizedFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const lowerName = sanitizedFileName.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

    // 🛡️ 2. ALLOW-LIST EKSTENSI & MIME TYPE
    if (!hasValidExtension || !ALLOWED_MIME_TYPES.has(fileType)) {
      return NextResponse.json(
        {
          success: false,
          message: "Format file tidak diizinkan. Hanya berkas PDF, PNG, atau JPG yang diperbolehkan.",
        },
        { status: 400 }
      );
    }

    // Read raw binary from client
    const buffer = await req.arrayBuffer();

    if (!buffer || buffer.byteLength === 0) {
      return NextResponse.json({ success: false, message: "Berkas kosong atau tidak ditemukan." }, { status: 400 });
    }

    // 🛡️ 3. PEMBATASAN UKURAN BERKAS (Maksimal 2MB)
    if (buffer.byteLength > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "Ukuran berkas melebihi batas maksimal 2MB." },
        { status: 400 }
      );
    }


    // Construct FormData to send to Hono Worker
    const up = new FormData();
    const blob = new Blob([buffer], { type: fileType });
    up.append("document", blob, sanitizedFileName);

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

