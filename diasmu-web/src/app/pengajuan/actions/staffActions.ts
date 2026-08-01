"use server";

import { revalidatePath } from "next/cache";
import { apiUrl, auditLog, authHeaders, jsonAuthHeaders } from "@/lib/security";
import type { EligibleStaffUser, SsoUser } from "@/types/diasmu";

// 1. Cek Apakah Akun yang Login adalah Staf dengan Otoritas Terbatas
export async function checkStatusStaff(identifier: string) {
  try {
    const res = await fetch(apiUrl(`/api/staff/check/${identifier}`), { 
      cache: "no-store",
      headers: authHeaders()
    });
    return res.ok ? await res.json() : { isStaff: false, allowedType: "all" };
  } catch { 
    return { isStaff: false, allowedType: "all" }; 
  }
}

// 2. Dapatkan Semua Anggota Tim yang Didaftarkan oleh PIC Utama
export async function getDaftarStaff(picNbm: string) {
  try {
    const res = await fetch(apiUrl(`/api/staff/list/${picNbm}`), { 
      cache: "no-store",
      headers: authHeaders()
    });
    return res.ok ? await res.json() : [];
  } catch { 
    return []; 
  }
}

// 3. Ambil kandidat staf yang sudah pernah login SSO dan memiliki NBM
export async function getKandidatStaff(): Promise<EligibleStaffUser[]> {
  try {
    const res = await fetch(apiUrl("/api/sso-users"), {
      cache: "no-store",
      headers: authHeaders(),
    });

    if (!res.ok) return [];

    const users = await res.json() as SsoUser[];
    return users.filter((user): user is EligibleStaffUser => Boolean(user.nbm?.trim()));
  } catch {
    return [];
  }
}

// 4. Daftarkan Anggota Staf Baru ke Instansi beserta Pembatasan Hak Modulnya
export async function tambahAnggotaStaff(picNbm: string, staffIdentifier: string, allowedType: string) {
  try {
    const kandidat = await getKandidatStaff();
    const staffNbm = staffIdentifier.trim();
    const selectedStaff = kandidat.find((user) => user.nbm === staffNbm);

    if (!selectedStaff) {
      return {
        success: false,
        message: "Staf harus sudah pernah login SSO dan memiliki NBM yang valid.",
      };
    }

    const inviteStaff = async (identifier: string) => fetch(apiUrl("/api/staff/add"), {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify({ picNbm, staffIdentifier: identifier, allowedType })
    });

    let res = await inviteStaff(staffNbm);
    let data = await res.json().catch(() => ({}));

    if (!res.ok && selectedStaff.email) {
      res = await inviteStaff(selectedStaff.email);
      data = await res.json().catch(() => ({}));
    }

    if (!res.ok) {
      return {
        success: false,
        message: data.message || "Backend menolak penambahan staf. Pastikan user SSO memiliki NBM dan belum terdaftar sebagai staf.",
      };
    }

    await auditLog("staff.added", { actor: picNbm, staffIdentifier: selectedStaff.email || staffNbm, staffNbm, allowedType });
    revalidatePath("/pengajuan");
    return { success: true };
  } catch { 
    return { success: false, message: "Koneksi terputus" }; 
  }
}

// 5. Cabut Akun Staf dari Struktur Organisasi Instansi
export async function hapusAnggotaStaff(id: number) {
  try {
    const res = await fetch(apiUrl(`/api/staff/delete/${id}`), {
      method: "DELETE",
      headers: authHeaders()
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, message: data.message || "Backend menolak pencabutan akses staf." };
    }

    await auditLog("staff.removed", { staffId: id });
    revalidatePath("/pengajuan");
    return { success: true };
  } catch (e) { 
    console.error(e); 
    return { success: false, message: "Koneksi terputus saat mencabut akses staf." };
  }
}
