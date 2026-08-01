import { revalidatePath } from "next/cache";
import { apiUrl, auditLog, jsonAuthHeaders, authHeaders } from "@/lib/security";

interface ProfileProps {
  userName: string;
  userNbm: string;
  institution: string;
  emailInstansi: string;
  suratTugas?: string;
  suratPermohonan?: string;
}

export default function DashboardProfile({ userName, userNbm, institution, emailInstansi, suratTugas, suratPermohonan }: ProfileProps) {
  
  // SERVER ACTION: Update Profil Mandiri terisolasi di komponen ini
  async function updateProfileInstansi(formData: FormData) {
    "use server";
    const newInstitution = formData.get("institution") as string;
    const newEmailInstansi = formData.get("emailInstansi") as string;
    
    const fileTugas = formData.get("suratTugas") as File | null;
    const filePermohonan = formData.get("suratPermohonan") as File | null;

    let suratTugasName = undefined;
    let suratPermohonanName = undefined;

    try {
      if (fileTugas && fileTugas.size > 0) {
        const up1 = new FormData(); 
        const blob = new Blob([await fileTugas.arrayBuffer()], { type: fileTugas.type });
        up1.append("document", blob, fileTugas.name);

        const r1 = await fetch(apiUrl("/api/upload"), { 
          method: "POST", body: up1, headers: authHeaders()
        });
        if (r1.ok) suratTugasName = (await r1.json()).filename;
      }
      if (filePermohonan && filePermohonan.size > 0) {
        const up2 = new FormData(); 
        const blob = new Blob([await filePermohonan.arrayBuffer()], { type: filePermohonan.type });
        up2.append("document", blob, filePermohonan.name);

        const r2 = await fetch(apiUrl("/api/upload"), { 
          method: "POST", body: up2, headers: authHeaders()
        });
        if (r2.ok) suratPermohonanName = (await r2.json()).filename;
      }

      await fetch(apiUrl(`/api/pics/${userNbm}`), {
        method: "PUT",
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ 
          institution: newInstitution, 
          email_instansi: newEmailInstansi,
          surat_tugas: suratTugasName,
          surat_permohonan: suratPermohonanName
        })
      });
      await auditLog("pic.profile.updated", { actor: userNbm, institution: newInstitution });
      revalidatePath("/pengajuan");
    } catch (error) {
      console.error("Gagal update profil:", error);
    }
  }

  return (
    <section className="bg-white p-6 rounded-3xl shadow-xl border border-slate-200">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
        <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#004282] flex items-center justify-center font-black">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </div>
        <h3 className="text-base font-black text-slate-800 uppercase tracking-tight italic">Profil Penanggung Jawab</h3>
      </div>

      <form action={updateProfileInstansi} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Operator</label>
          <p className="text-sm font-bold text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">{userName}</p>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nomor NBM Resmi</label>
          <p className="text-sm font-black text-[#004282] bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">{userNbm}</p>
        </div>
        
        <div className="pt-2 border-t border-dashed border-slate-100 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Nama Instansi Resmi <span className="text-red-500">*</span></label>
            <input type="text" name="institution" required defaultValue={institution} className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#004282] outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Email Instansi Korespondensi *</label>
            <input type="email" name="emailInstansi" required defaultValue={emailInstansi} className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-[#004282] outline-none" />
          </div>
        </div>

        <div className="pt-2 border-t border-dashed border-slate-100 space-y-4 mt-4">
          <div>
            <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Surat Tugas Baru (Opsional)</label>
            <input type="file" name="suratTugas" accept=".pdf,.png,.jpg,.jpeg" className="w-full text-sm border bg-white rounded-xl file:bg-slate-100 file:text-slate-600 file:border-0 file:py-2 file:px-4 file:rounded-xl file:font-bold file:mr-4 hover:file:bg-slate-200 transition-colors cursor-pointer" />
            {suratTugas && (
              <p className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                File saat ini: <a href={apiUrl(`/public/files/${suratTugas}`)} target="_blank" rel="noreferrer" className="underline hover:text-emerald-700">Lihat File</a>
              </p>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1">Surat Permohonan Baru (Opsional)</label>
            <input type="file" name="suratPermohonan" accept=".pdf,.png,.jpg,.jpeg" className="w-full text-sm border bg-white rounded-xl file:bg-slate-100 file:text-slate-600 file:border-0 file:py-2 file:px-4 file:rounded-xl file:font-bold file:mr-4 hover:file:bg-slate-200 transition-colors cursor-pointer" />
            {suratPermohonan && (
              <p className="mt-1 text-xs text-blue-600 font-semibold flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                File saat ini: <a href={apiUrl(`/public/files/${suratPermohonan}`)} target="_blank" rel="noreferrer" className="underline hover:text-blue-700">Lihat File</a>
              </p>
            )}
          </div>
        </div>

        <button type="submit" className="w-full bg-[#004282] text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-xl shadow-md hover:bg-blue-900 transition-all active:scale-95 mt-4">
          Simpan Perubahan Profil
        </button>
      </form>
    </section>
  );
}
