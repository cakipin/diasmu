"use server";

import { revalidatePath } from "next/cache";
import { apiUrl, auditLog, authHeaders, jsonAuthHeaders } from "@/lib/security";

// Private Helper: Upload Berkas ke R2 via Workers dengan API Key Security
async function uploadFileToR2(file: File) {
  if (!file || file.size === 0) return "";
  try {
    const formData = new FormData();
    formData.append("document", file);
    
    const res = await fetch(apiUrl("/api/upload"), {
      method: "POST",
      body: formData,
      headers: authHeaders()
    });

    if (res.ok) {
      const data = await res.json();
      return data.filename;
    }
    return "";
  } catch (error) {
    console.error("Upload error:", error);
    return "";
  }
}

// 1. Simpan Data Aset/Kredensial Baru
export async function submitPengajuanAset(formData: FormData) {
  const userNbm = formData.get("userNbm") as string;
  const tipePengajuan = formData.get("tipePengajuan") as string;
  const purpose = formData.get("purpose") as string;
  const fileLampiran = formData.get("fileLampiran") as File;

  const payload: Record<string, FormDataEntryValue | null> = { userNbm, tipePengajuan, purpose };

  if (fileLampiran && fileLampiran.size > 0) {
    payload.lampiranSistem = await uploadFileToR2(fileLampiran);
  }

  if (tipePengajuan === "email") {
    payload.emailName = formData.get("emailName");
  } else if (tipePengajuan === "subdomain") {
    payload.domainName = formData.get("domainName");
    payload.tipeHosting = formData.get("tipeHosting");
    if (payload.tipeHosting === "pihak3") {
      payload.providerUrl = formData.get("providerUrl");
      payload.ipAddress = formData.get("ipAddress");
      payload.credentialUser = formData.get("credentialUser");
      payload.credentialPassword = formData.get("credentialPassword");
      payload.masaAktifHosting = formData.get("masaAktifHosting");
    }
  } else if (tipePengajuan === "medsos") {
    payload.platformMedsos = formData.get("platformMedsos");
    payload.namaAkunMedsos = formData.get("namaAkunMedsos");
    payload.credentialMedsos = formData.get("credentialMedsos");
    payload.phoneMedsos = formData.get("phoneMedsos");
    payload.emailMedsos = formData.get("emailMedsos");
  } else if (tipePengajuan === "domain") {
    payload.namaDomainMandiri = formData.get("namaDomainMandiri");
    payload.providerDomain = formData.get("providerDomain");
    payload.credentialUserDomain = formData.get("credentialUserDomain");
    payload.credentialPasswordDomain = formData.get("credentialPasswordDomain");
    payload.masaAktifDomain = formData.get("masaAktifDomain");
  } else if (tipePengajuan === "akun") { 
    payload.jenisAkun = formData.get("jenisAkun");
    payload.namaLayanan = formData.get("namaLayanan");
    payload.ipAddressAkun = formData.get("ipAddressAkun");
    payload.linkGithub = formData.get("linkGithub");
    payload.usernameAkun = formData.get("usernameAkun");
    payload.passwordAkun = formData.get("passwordAkun");
    payload.emailTertaut = formData.get("emailTertaut");
    payload.phoneTertaut = formData.get("phoneTertaut");
  }

  try {
    await fetch(apiUrl("/api/aset"), {
      method: "POST",
      headers: jsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    await auditLog("asset.submitted", { actor: userNbm, tipePengajuan, purpose });
    revalidatePath("/pengajuan"); 
  } catch (error) {
    console.error("Gagal mengirim pengajuan:", error);
  }
}

// 2. Update Deskripsi/Tujuan Penggunaan Aset
export async function updatePengajuanAset(formData: FormData) {
  const id = formData.get("id") as string;
  const purpose = formData.get("purpose") as string;
  const userNbm = formData.get("userNbm") as string;
  const tipePengajuan = formData.get("tipePengajuan") as string;

  const payload: Record<string, FormDataEntryValue | null> = { userNbm, tipePengajuan, purpose };
  
  formData.forEach((value, key) => {
    if (!['id', 'purpose'].includes(key)) {
      payload[key] = value;
    }
  });

  try {
    await fetch(apiUrl(`/api/aset/${id}`), {
      method: "PUT",
      headers: jsonAuthHeaders(),
      body: JSON.stringify(payload),
    });
    await auditLog("asset.updated", { actor: userNbm, assetId: id, purpose });
    revalidatePath("/pengajuan"); 
  } catch (error) {
    console.error("Gagal update aset:", error);
  }
}

// 3. Hapus Aset dari Sistem Inventaris
export async function hapusAset(id: number) { 
  try { 
    await fetch(apiUrl(`/api/aset/${id}`), { 
      method: "DELETE",
      headers: authHeaders()
    }); 
    await auditLog("asset.deleted", { assetId: id });
    revalidatePath("/pengajuan"); 
  } catch (error) { 
    console.error(error); 
  } 
}

// 4. Get Hak Izin Delegasi Akses Objek (ACL)
export async function getIzinAset(domainId: number) { 
  try { 
    const res = await fetch(apiUrl(`/api/aset/${domainId}/permissions`), { 
      cache: "no-store",
      headers: authHeaders()
    }); 
    return res.ok ? await res.json() : []; 
  } catch { 
    return []; 
  } 
}

// 5. Berikan Hak Akses Objek ke Rekan Kerja Baru (ACL)
export async function tambahIzinAset(domainId: number, userNbm: string, role: string) { 
  try { 
    const res = await fetch(apiUrl(`/api/aset/${domainId}/permissions`), { 
      method: "POST", 
      headers: jsonAuthHeaders(), 
      body: JSON.stringify({ userNbm, role }) 
    }); 
    const data = await res.json(); 
    if (!res.ok) return { success: false, message: data.message }; 
    await auditLog("asset.permission.granted", { assetId: domainId, targetUser: userNbm, role });
    revalidatePath("/pengajuan"); 
    return { success: true }; 
  } catch { 
    return { success: false, message: "Gangguan server" }; 
  } 
}

// 6. Cabut Hak Akses Anggota dari Suatu Aset (ACL)
export async function hapusIzinAset(permId: number) { 
  try { 
    await fetch(apiUrl(`/api/aset/permissions/${permId}`), { 
      method: "DELETE",
      headers: authHeaders()
    }); 
    await auditLog("asset.permission.revoked", { permissionId: permId });
    revalidatePath("/pengajuan"); 
  } catch (e) { 
    console.error(e); 
  } 
}

export async function logCredentialReveal(assetId: number, field: string, reason: string) {
  await auditLog("credential.revealed", { assetId, field, reason });
}
