"use server";

import { revalidatePath } from "next/cache";
import { apiUrl, authHeaders, jsonAuthHeaders, auditLog } from "@/lib/security";

export async function adminUploadBerkasAction(boundData: any, payload: any) {
  try {
    const { encodedId, institution, email_instansi } = boundData;
    const { suratTugasName, suratPermohonanName } = payload;

    const dbPayload: any = { 
      institution: institution || "-",
      email_instansi: email_instansi || "-"
    };
    if (suratTugasName) dbPayload.surat_tugas = suratTugasName;
    if (suratPermohonanName) dbPayload.surat_permohonan = suratPermohonanName;

    const res = await fetch(apiUrl(`/api/pics/${encodedId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(dbPayload)
    });
    
    if (!res.ok) {
       const errText = await res.text();
       return { success: false, error: `Gagal update DB: ${res.status} ${errText}` };
    }
    
    try {
      revalidatePath(`/admin/users/${encodedId}`);
    } catch (e: any) {
       console.warn("revalidatePath failed (Edge issue):", e);
    }
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function updateProfileInstansiAction(boundData: any, payload: any) {
  try {
    const { userNbm } = boundData;
    const { institution, emailInstansi, suratTugasName, suratPermohonanName } = payload;

    const dbPayload: any = {
      institution: institution,
      email_instansi: emailInstansi,
    };
    
    if (suratTugasName) dbPayload.surat_tugas = suratTugasName;
    if (suratPermohonanName) dbPayload.surat_permohonan = suratPermohonanName;

    const res = await fetch(apiUrl(`/api/pics/${userNbm}`), {
      method: "PUT",
      headers: jsonAuthHeaders(),
      body: JSON.stringify(dbPayload)
    });
    
    if (!res.ok) {
       const errText = await res.text();
       return { success: false, error: `Gagal update profil: ${res.status} ${errText}` };
    }
    
    await auditLog("pic.profile.updated", { actor: userNbm, institution: institution });
    
    try {
      revalidatePath("/pengajuan");
    } catch (e) {
      console.warn("revalidatePath failed:", e);
    }
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}
