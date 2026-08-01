import { revalidatePath } from "next/cache";
import { apiUrl, auditLog, jsonAuthHeaders } from "@/lib/security";

interface ProfileProps {
  userName: string;
  userNbm: string;
  institution: string;
  emailInstansi: string;
}

export default function DashboardProfile({ userName, userNbm, institution, emailInstansi }: ProfileProps) {
  
  // SERVER ACTION: Update Profil Mandiri terisolasi di komponen ini
  async function updateProfileInstansi(formData: FormData) {
    "use server";
    const newInstitution = formData.get("institution") as string;
    const newEmailInstansi = formData.get("emailInstansi") as string;

    try {
      await fetch(apiUrl(`/api/pics/${userNbm}`), {
        method: "PUT",
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ institution: newInstitution, email_instansi: newEmailInstansi })
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

        <button type="submit" className="w-full bg-[#004282] text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-xl shadow-md hover:bg-blue-900 transition-all active:scale-95 mt-4">
          Simpan Perubahan Profil
        </button>
      </form>
    </section>
  );
}
