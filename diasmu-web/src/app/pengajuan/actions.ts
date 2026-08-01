"use server";

import { revalidatePath } from "next/cache";
import { apiUrl, auditLog, authHeaders, jsonAuthHeaders } from "@/lib/security";

// =====================================
// MODUL ASET & FILE UPLOAD
// =====================================
async function uploadFileToR2(file: File) {
  if (!file || file.size === 0) return "";
  try {
    const formData = new FormData(); formData.append("document", file);
    const res = await fetch(apiUrl("/api/upload"), { method: "POST", body: formData, headers: authHeaders() });
    return res.ok ? (await res.json()).filename : "";
  } catch { return ""; }
}

export async function submitPengajuanAset(formData: FormData) {
  const userNbm = formData.get("userNbm") as string;
  const tipePengajuan = formData.get("tipePengajuan") as string;
  const purpose = formData.get("purpose") as string;
  const fileLampiran = formData.get("fileLampiran") as File;

  const payload: Record<string, FormDataEntryValue | null> = { userNbm, tipePengajuan, purpose };
  if (fileLampiran && fileLampiran.size > 0) payload.lampiranSistem = await uploadFileToR2(fileLampiran);

  formData.forEach((value, key) => {
    if (!['userNbm', 'tipePengajuan', 'purpose', 'fileLampiran'].includes(key)) payload[key] = value;
  });

  try {
    await fetch(apiUrl("/api/aset"), { method: "POST", headers: jsonAuthHeaders(), body: JSON.stringify(payload) });
    await auditLog("asset.submitted", { actor: userNbm, tipePengajuan, purpose });
    revalidatePath("/pengajuan"); 
  } catch (error) { console.error(error); }
}

export async function updatePengajuanAset(formData: FormData) {
  const id = formData.get("id") as string;
  const payload: Record<string, FormDataEntryValue | null> = {};
  formData.forEach((value, key) => { if (key !== 'id') payload[key] = value; });

  try {
    await fetch(apiUrl(`/api/aset/${id}`), { method: "PUT", headers: jsonAuthHeaders(), body: JSON.stringify(payload) });
    await auditLog("asset.updated", { assetId: id });
    revalidatePath("/pengajuan"); 
  } catch (error) { console.error(error); }
}

export async function hapusAset(id: number) { try { await fetch(apiUrl(`/api/aset/${id}`), { method: "DELETE", headers: authHeaders() }); await auditLog("asset.deleted", { assetId: id }); revalidatePath("/pengajuan"); } catch (error) { console.error(error); } }
export async function getIzinAset(domainId: number) { try { const res = await fetch(apiUrl(`/api/aset/${domainId}/permissions`), { cache: "no-store", headers: authHeaders() }); return res.ok ? await res.json() : []; } catch { return []; } }
export async function tambahIzinAset(domainId: number, userNbm: string, role: string) { try { const res = await fetch(apiUrl(`/api/aset/${domainId}/permissions`), { method: "POST", headers: jsonAuthHeaders(), body: JSON.stringify({ userNbm, role }) }); const data = await res.json(); if (!res.ok) return { success: false, message: data.message }; await auditLog("asset.permission.granted", { assetId: domainId, targetUser: userNbm, role }); revalidatePath("/pengajuan"); return { success: true }; } catch { return { success: false, message: "Server error" }; } }
export async function hapusIzinAset(permId: number) { try { await fetch(apiUrl(`/api/aset/permissions/${permId}`), { method: "DELETE", headers: authHeaders() }); await auditLog("asset.permission.revoked", { permissionId: permId }); revalidatePath("/pengajuan"); } catch (e) { console.error(e); } }

// =====================================
// MODUL MANAJEMEN TIM STAF
// =====================================
export async function checkStatusStaff(identifier: string) {
  try {
    const res = await fetch(apiUrl(`/api/staff/check/${identifier}`), { cache: "no-store", headers: authHeaders() });
    return res.ok ? await res.json() : { isStaff: false, allowedType: "all" };
  } catch { return { isStaff: false, allowedType: "all" }; }
}

export async function getDaftarStaff(picNbm: string) {
  try {
    const res = await fetch(apiUrl(`/api/staff/list/${picNbm}`), { cache: "no-store", headers: authHeaders() });
    return res.ok ? await res.json() : [];
  } catch { return []; }
}

export async function tambahAnggotaStaff(picNbm: string, staffIdentifier: string, allowedType: string) {
  try {
    const res = await fetch(apiUrl("/api/staff/add"), { method: "POST", headers: jsonAuthHeaders(), body: JSON.stringify({ picNbm, staffIdentifier, allowedType }) });
    if (!res.ok) return { success: false, message: (await res.json()).message };
    await auditLog("staff.added", { actor: picNbm, staffIdentifier, allowedType });
    revalidatePath("/pengajuan"); return { success: true };
  } catch { return { success: false, message: "Koneksi terputus" }; }
}

export async function hapusAnggotaStaff(id: number) {
  try { await fetch(apiUrl(`/api/staff/delete/${id}`), { method: "DELETE", headers: authHeaders() }); await auditLog("staff.removed", { staffId: id }); revalidatePath("/pengajuan"); } catch (e) { console.error(e); }
}
