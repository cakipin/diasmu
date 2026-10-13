import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { apiUrl, authHeaders } from "@/lib/security";

export const runtime = "edge";

interface PicResponse {
  isRegistered?: boolean;
  status?: string;
  data?: {
    surat_tugas?: string;
    surat_permohonan?: string;
    suratTugas?: string;
    suratPermohonan?: string;
  };
}

interface AssetResponseItem {
  detail?: string;
  tipe_aset?: string;
  domain_name?: string;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  // 🛡️ 1. AUTENTIKASI: Sesi Aktif Wajib Ada
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized. Silakan login terlebih dahulu untuk mengakses berkas." },
      { status: 401 }
    );
  }

  const { filename: rawFilename } = await context.params;
  const filename = decodeURIComponent(rawFilename);

  // Mencegah directory traversal atau nama berkas berbahaya
  if (!filename || filename.includes("..") || filename.includes("/")) {
    return NextResponse.json(
      { success: false, message: "Nama berkas tidak valid." },
      { status: 400 }
    );
  }

  const user = session.user as any;
  const userNbm = user.nbm as string;
  const userEmail = user.email as string;
  const userName = encodeURIComponent(user.name || "User");
  const identifier = userNbm || userEmail;

  if (!identifier) {
    return NextResponse.json(
      { success: false, message: "Identitas pengguna tidak ditemukan." },
      { status: 401 }
    );
  }

  try {
    const headers = authHeaders();

    // 🛡️ 2. PERIKSA APAKAH PENGGUNA ADALAH SUPER ADMIN
    const adminCheckRes = await fetch(
      apiUrl(`/api/check-admin/${encodeURIComponent(identifier)}?name=${userName}`),
      { cache: "no-store", headers }
    );

    let isAuthorized = false;

    if (adminCheckRes.ok) {
      const adminData = await adminCheckRes.json();
      if (adminData.isAdmin) {
        isAuthorized = true;
      }
    }

    // 🛡️ 3. JIKA BUKAN ADMIN: VALIDASI KEPEMILIKAN BERKAS (PIC & ASSET OWNER)
    if (!isAuthorized) {
      // A. Periksa apakah berkas adalah surat_tugas atau surat_permohonan milik PIC ini
      const picRes = await fetch(
        apiUrl(`/api/check-pic/${encodeURIComponent(identifier)}`),
        { cache: "no-store", headers }
      );

      if (picRes.ok) {
        const picData: PicResponse = await picRes.json();
        const suratTugas = picData.data?.surat_tugas || picData.data?.suratTugas;
        const suratPermohonan = picData.data?.surat_permohonan || picData.data?.suratPermohonan;

        if (
          (suratTugas && suratTugas === filename) ||
          (suratPermohonan && suratPermohonan === filename)
        ) {
          isAuthorized = true;
        }
      }

      // B. Periksa apakah berkas adalah lampiran aset yang dikelola user
      if (!isAuthorized) {
        const asetRes = await fetch(
          apiUrl(`/api/aset/pic/${encodeURIComponent(identifier)}`),
          { cache: "no-store", headers }
        );

        if (asetRes.ok) {
          const assets: AssetResponseItem[] = await asetRes.json();
          if (Array.isArray(assets)) {
            for (const item of assets) {
              if (item.detail && item.detail.includes(filename)) {
                isAuthorized = true;
                break;
              }
            }
          }
        }
      }
    }

    // 🛡️ 4. BLOKIR JIKA TIDAK MEMILIKI HAK AKSES
    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden. Anda tidak memiliki izin untuk mengakses berkas ini.",
        },
        { status: 403 }
      );
    }

    // 🛡️ 5. RELAY STREAM DARI WORKER INTERNAL DENGAN BEARER TOKEN
    const workerRes = await fetch(
      apiUrl(`/api/files/${encodeURIComponent(filename)}`),
      { headers }
    );

    if (!workerRes.ok) {
      return NextResponse.json(
        { success: false, message: "Berkas tidak ditemukan atau telah dihapus." },
        { status: workerRes.status }
      );
    }

    const contentType =
      workerRes.headers.get("content-type") ||
      (filename.endsWith(".pdf")
        ? "application/pdf"
        : filename.endsWith(".png")
        ? "image/png"
        : filename.endsWith(".jpg") || filename.endsWith(".jpeg")
        ? "image/jpeg"
        : "application/octet-stream");

    // Teruskan stream biner ke klien dengan security headers ketat
    return new NextResponse(workerRes.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error: any) {
    console.error("Gagal relay berkas aman:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal saat mengambil berkas." },
      { status: 500 }
    );
  }
}
