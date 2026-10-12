import type { Aset } from "@/types/diasmu";
import { apiUrl, authHeaders, requireAdminSession } from "@/lib/security";

export const runtime = "edge";

export default async function AdminDashboard() {
  await requireAdminSession();

  let daftarAset: Aset[] = [];
  try {
    const res = await fetch(apiUrl("/api/aset"), { 
      cache: "no-store",
      headers: authHeaders()
    });
    
    if (res.ok) {
      daftarAset = await res.json();
    } else {
      console.error("Gagal ambil aset, ditolak Worker:", await res.text());
    }
  } catch (error) { 
    console.error("Gagal memuat data aset admin:", error); 
  }

  return (
    <div className="mx-auto max-w-7xl">
      <section className="ui-panel flex flex-col">
        
        <div className="ui-panel-heading">
          <div className="flex items-center gap-4">
            <div className="grid h-9 w-9 place-items-center rounded-[8px] bg-[#eaf2ff] text-[#1265e5]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <h2>
              Daftar Aset Terdaftar
            </h2>
          </div>
          <span className="ui-count">
            {daftarAset.length} data
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="px-5 py-4 md:px-6">PIC & Instansi</th>
                <th className="px-5 py-4 md:px-6">Domain & Tujuan</th>
                <th className="px-5 py-4 text-center md:px-6">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {daftarAset.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <p className="text-xs font-medium text-[#667085]">
                      Belum ada aset terdaftar.
                    </p>
                  </td>
                </tr>
              ) : (
                daftarAset.map((aset) => (
                  <tr key={aset.id}>
                    
                    <td className="px-5 py-4 md:px-6">
                      <p className="text-xs font-semibold text-[#172033]">{aset.pic_name}</p>
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-[#667085]">
                        <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        {aset.institution}
                      </p>
                    </td>

                    <td className="px-5 py-4 md:px-6">
                      <p className="text-xs font-semibold text-[#1265e5]">{aset.domain_name}</p>
                      <p className="mt-1 max-w-xs truncate text-[10px] text-[#667085]">{aset.purpose}</p>
                    </td>

                    <td className="px-5 py-4 text-center md:px-6">
                      {aset.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Pending
                        </span>
                      ) : aset.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Inactive
                        </span>
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
  );
}
