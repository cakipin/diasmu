import { auth } from "@/auth";
import NbmWarning from "../_components/NbmWarning";
import { revalidatePath } from "next/cache";
import type { AdminUser, PicUser, SsoUser } from "@/types/diasmu";
import { apiUrl, auditLog, authHeaders, requireAdminSession } from "@/lib/security";
import Link from "next/link";
import SsoHistoryTable from "./SsoHistoryTable";
import PicStatusSwitch from "./PicStatusSwitch";
import InviteUserForm from "./InviteUserForm";

export const runtime = "edge";

export default async function UsersManagementPage() {
  const session = await requireAdminSession();
  const userNbm = session?.user?.nbm || session?.user?.email;

  async function deleteAdmin(formData: FormData) {
    "use server";
    const currentSession = await requireAdminSession();
    const currentActor = currentSession?.user?.nbm || currentSession?.user?.email;
    const nbm = formData.get("nbm");
    if (!nbm) return;

    await fetch(apiUrl(`/api/admins/${nbm}`), { 
      method: "DELETE",
      headers: authHeaders()
    });
    await auditLog("admin.removed", { actor: currentActor, targetUser: String(nbm || "") });
    revalidatePath("/admin/users");
  }

  async function deletePic(formData: FormData) {
    "use server";
    const currentSession = await requireAdminSession();
    const currentActor = currentSession?.user?.nbm || currentSession?.user?.email;
    const id = formData.get("id");
    if (!id) return;

    await fetch(apiUrl(`/api/pics/${id}`), { 
      method: "DELETE",
      headers: authHeaders()
    });
    await auditLog("pic.deleted", { actor: currentActor, picId: String(id || "") });
    revalidatePath("/admin/users");
  }

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

  const validNbmUsers = daftarSso.filter((u): u is SsoUser & { nbm: string } => Boolean(u.nbm?.trim()));

  return (
    <div className="ui-management-page mx-auto">
      
      {!userNbm && <NbmWarning />}

      <div className={`${!userNbm ? "opacity-40 grayscale pointer-events-none select-none" : ""}`}>
        
        <datalist id="sso-list">
          {validNbmUsers.map((u) => (
            <option key={u.nbm} value={u.nbm}>{u.name} - {u.email}</option>
          ))}
        </datalist>

        <section className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-700 shadow-inner">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Super Admin</h3>
            </div>
            
            <InviteUserForm tone="admin" />
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

        <section id="pic-management" className="scroll-mt-6 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-gray-100 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-[#004282] shadow-inner">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Penanggung Jawab (PIC)</h3>
            </div>
            
            <InviteUserForm tone="pic" />
          </div>
          
          <div className="overflow-x-auto">
            <table className="ui-pic-table w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-200">
                <tr><th className="px-8 py-5">Identitas PIC</th><th className="pic-contact-column px-8 py-5">Kontak &amp; Instansi</th><th className="px-8 py-5 text-center">Status</th><th className="px-8 py-5 text-center">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {daftarPic.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400 font-bold uppercase text-xs">Belum ada PIC terdaftar.</td></tr>
                ) : (
                  daftarPic.map((pic) => (
                    <tr key={pic.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex flex-col gap-1">
                          <p className="font-bold text-slate-800 text-base">{pic.name}</p>
                          <p className="text-xs text-[#004282] font-black uppercase tracking-widest">{pic.nbm}</p>
                          <div className="pic-mobile-contact">
                            <p>{pic.institution}</p>
                            <p>{pic.email !== "-" ? pic.email : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="pic-contact-column px-8 py-4 align-middle">
                        <p className="font-bold text-slate-700">{pic.institution}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">{pic.email !== '-' ? pic.email : ''} {pic.phone !== '-' ? `| ${pic.phone}` : ''}</p>
                      </td>
                      <td className="px-8 py-4 text-center align-middle">
                        {pic.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest animate-pulse">Pending</span>
                        ) : pic.status === 'inactive' ? (
                          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Inactive</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Approved</span>
                        )}
                      </td>
                      <td className="px-8 py-4 text-center align-middle">
                        <div className="ui-action-row">
                          <Link href={`/admin/users/${pic.nbm}`} className="ui-icon-button" aria-label={`Lihat profil ${pic.name}`} title="Lihat profil PIC">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="12" cy="12" r="2.5" strokeWidth="1.8" />
                            </svg>
                          </Link>
                          <PicStatusSwitch
                            nbm={pic.nbm}
                            name={pic.name || "PIC"}
                            initialActive={pic.status === "approved"}
                          />
                          <form action={deletePic}><input type="hidden" name="id" value={pic.id} /><button type="submit" className="bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-50 shadow-sm active:scale-95 transition-colors">Hapus</button></form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

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
          
          <SsoHistoryTable users={daftarSso} />
        </section>

      </div>
    </div>
  );
}
