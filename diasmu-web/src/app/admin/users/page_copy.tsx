import { auth } from "@/auth";
import NbmWarning from "../_components/NbmWarning";
import { revalidatePath } from "next/cache";
import type { AdminUser, PicUser, SsoUser } from "@/types/diasmu";
import { apiUrl, auditLog, authHeaders, jsonAuthHeaders } from "@/lib/security";

export const runtime = "edge";

export default async function UsersManagementPage() {
  const session = await auth();
  const userNbm = session?.user?.nbm || session?.user?.email; // Deteksi universal

  // ==========================================
  // SERVER ACTIONS DENGAN TOKEN PENGAMAN
  // ==========================================
  async function addAdmin(formData: FormData) {
    "use server";
    const rawInput = formData.get("nbm")?.toString() || "";
    const nbm = rawInput.replace(/[^0-9a-zA-Z.@-]/g, ""); // Izinkan format NBM/Email
    if (!nbm) return;

    await fetch(apiUrl("/api/admins"), {
      method: "POST", 
      headers: jsonAuthHeaders(), 
      body: JSON.stringify({ nbm })
    });
    await auditLog("admin.invited", { actor: userNbm, targetUser: nbm });
    revalidatePath("/admin/users");
  }

  async function invitePic(formData: FormData) {
    "use server";
    const rawInput = formData.get("nbm")?.toString() || "";
    const nbm = rawInput.replace(/[^0-9a-zA-Z.@-]/g, ""); 
    if (!nbm) return;

    await fetch(apiUrl("/api/pics/invite"), {
      method: "POST", 
      headers: jsonAuthHeaders(), 
      body: JSON.stringify({ nbm })
    });
    await auditLog("pic.invited", { actor: userNbm, targetUser: nbm });
    revalidatePath("/admin/users");
  }

  async function deleteAdmin(formData: FormData) {
    "use server";
    const nbm = formData.get("nbm");
    await fetch(apiUrl(`/api/admins/${nbm}`), { 
      method: "DELETE",
      headers: authHeaders()
    });
    await auditLog("admin.removed", { actor: userNbm, targetUser: String(nbm || "") });
    revalidatePath("/admin/users");
  }

  async function approvePic(formData: FormData) {
    "use server";
    const nbm = formData.get("nbm");
    await fetch(apiUrl(`/api/pics/${nbm}/approve`), { 
      method: "PUT",
      headers: authHeaders()
    });
    await auditLog("pic.approved", { actor: userNbm, targetUser: String(nbm || "") });
    revalidatePath("/admin/users");
  }

  async function deletePic(formData: FormData) {
    "use server";
    const id = formData.get("id");
    await fetch(apiUrl(`/api/pics/${id}`), { 
      method: "DELETE",
      headers: authHeaders()
    });
    await auditLog("pic.deleted", { actor: userNbm, picId: String(id || "") });
    revalidatePath("/admin/users");
  }

  // ==========================================
  // FETCH DATA UNTUK TABEL DENGAN TOKEN PENGAMAN
  // ==========================================
  let daftarAdmin: AdminUser[] = [];
  let daftarPic: PicUser[] = [];
  let daftarSso: SsoUser[] = [];
  try {
    const headers = authHeaders();

    const resSso = await fetch(apiUrl("/api/sso-users"), { cache: "no-store", headers });
    if (resSso.ok) daftarSso = await resSso.json();
    
    const resAdmin = await fetch(apiUrl("/api/admins"), { cache: "no-store", headers });
    if (resAdmin.ok) daftarAdmin = await resAdmin.json();

    const resPic = await fetch(apiUrl("/api/pics"), { cache: "no-store", headers });
    if (resPic.ok) daftarPic = await resPic.json();
  } catch (e) { console.error(e); }

  // Daftar User NBM yang valid untuk Auto-Suggest di Input
  const validNbmUsers = daftarSso.filter((u): u is SsoUser & { nbm: string } => Boolean(u.nbm?.trim()));

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-10">
      
      {!userNbm && <NbmWarning />}

      <div className={`space-y-10 ${!userNbm ? "opacity-40 grayscale pointer-events-none select-none" : ""}`}>
        
        <datalist id="sso-list">
          {validNbmUsers.map((u) => (
            <option key={u.nbm} value={u.nbm}>{u.name} - {u.email}</option>
          ))}
        </datalist>

        {/* MODUL 1: MANAJEMEN SUPER ADMIN */}
        <section className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-700 shadow-inner">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Super Admin</h3>
            </div>
            
            <form action={addAdmin} className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <svg className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" name="nbm" list="sso-list" required placeholder="Cari NBM dari Riwayat..." className="w-full pl-10 pr-4 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all" />
              </div>
              <button type="submit" className="bg-red-600 text-white px-6 py-2 rounded-xl text-[11px] font-black tracking-widest uppercase shadow-md hover:bg-red-700 transition-all active:scale-95 whitespace-nowrap">Invite Admin</button>
            </form>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-200">
                <tr><th className="px-8 py-5">Nomor NBM / Email</th><th className="px-8 py-5">Nama Lengkap</th><th className="px-8 py-5 text-center">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {daftarAdmin.length === 0 ? (
                  <tr><td colSpan={3} className="px-8 py-10 text-center text-slate-400 font-bold uppercase text-xs">Belum ada Admin.</td></tr>
                ) : (
                  daftarAdmin.map((admin) => (
                    <tr key={admin.nbm} className="hover:bg-red-50/30 transition-colors group">
                      <td className="px-8 py-4 font-black text-red-700 text-base tracking-tight">{admin.nbm}</td>
                      <td className="px-8 py-4 font-bold text-slate-800">{admin.name}</td>
                      <td className="px-8 py-4 text-center">
                        <form action={deleteAdmin}>
                          <input type="hidden" name="nbm" value={admin.nbm} />
                          <button type="submit" disabled={admin.nbm === userNbm} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${admin.nbm === userNbm ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:text-red-700 shadow-sm active:scale-95"}`}>
                            {admin.nbm === userNbm ? "Anda" : "Cabut"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* MODUL 2: MANAJEMEN PENANGGUNG JAWAB (PIC) */}
        <section className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-[#004282] shadow-inner">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Penanggung Jawab (PIC)</h3>
            </div>
            
            <form action={invitePic} className="flex flex-col sm:flex-row gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <svg className="w-5 h-5 absolute left-3 top-2.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" name="nbm" list="sso-list" required placeholder="Cari NBM dari Riwayat..." className="w-full pl-10 pr-4 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-[#004282] transition-all" />
              </div>
              <button type="submit" className="bg-[#004282] text-white px-6 py-2 rounded-xl text-[11px] font-black tracking-widest uppercase shadow-md hover:bg-blue-900 transition-all active:scale-95 whitespace-nowrap">Invite PIC</button>
            </form>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-200">
                <tr><th className="px-8 py-5">Identitas PIC</th><th className="px-8 py-5">Kontak & Instansi</th><th className="px-8 py-5 text-center">Status</th><th className="px-8 py-5 text-center">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {daftarPic.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400 font-bold uppercase text-xs">Belum ada PIC terdaftar.</td></tr>
                ) : (
                  daftarPic.map((pic) => (
                    <tr key={pic.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="px-8 py-4">
                        <p className="font-bold text-slate-800 text-base">{pic.name}</p>
                        <p className="text-xs text-[#004282] font-black uppercase tracking-widest mt-0.5">{pic.nbm}</p>
                      </td>
                      <td className="px-8 py-4">
                        <p className="font-bold text-slate-700">{pic.institution}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">{pic.email !== '-' ? pic.email : ''} {pic.phone !== '-' ? `| ${pic.phone}` : ''}</p>
                      </td>
                      <td className="px-8 py-4 text-center">
                        {pic.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">Pending</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Approved</span>
                        )}
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex justify-center gap-2">
                          {pic.status === 'pending' && (
                            <form action={approvePic}><input type="hidden" name="nbm" value={pic.nbm} /><button type="submit" className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-md active:scale-95">Sahkan</button></form>
                          )}
                          <form action={deletePic}><input type="hidden" name="id" value={pic.id} /><button type="submit" className="bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-50 shadow-sm active:scale-95">Hapus</button></form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* MODUL 3: RIWAYAT SEMUA PENGGUNA SSO */}
        <section className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex items-center gap-4 bg-white">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 shadow-inner">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Riwayat Login SSO</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Daftar seluruh akun yang pernah terhubung ke aplikasi</p>
            </div>
            <div className="ml-auto">
              <span className="bg-slate-100 text-slate-600 border border-slate-200 px-4 py-1.5 rounded-xl text-xs font-black tracking-widest uppercase shadow-sm">Total: {daftarSso.length} Akun</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-200">
                <tr><th className="px-8 py-5">Nama Lengkap & Email</th><th className="px-8 py-5">Nomor NBM</th><th className="px-8 py-5 text-center">Status NBM</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {daftarSso.length === 0 ? (
                  <tr><td colSpan={3} className="px-8 py-10 text-center text-slate-400 font-bold uppercase text-xs">Belum ada data riwayat login.</td></tr>
                ) : (
                  daftarSso.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-4">
                        <p className="font-bold text-slate-800 text-base">{user.name}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">{user.email}</p>
                      </td>
                      <td className="px-8 py-4 font-black text-[#004282] text-base tracking-tight">
                        {user.nbm ? user.nbm : <span className="text-slate-300 font-medium text-xs italic">Kosong</span>}
                      </td>
                      <td className="px-8 py-4 text-center">
                        {user.nbm && user.nbm.trim() !== '' ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Terverifikasi</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Belum Ada</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
