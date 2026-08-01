import type { Aset } from "@/types/diasmu";
import { apiUrl, authHeaders } from "@/lib/security";

export const runtime = "edge";

export default async function AdminDashboard() {
  let daftarAset: Aset[] = [];
  try {
    const res = await fetch(apiUrl("/api/aset"), { 
      cache: "no-store",
      headers: authHeaders()
    });
    if (res.ok) {
      daftarAset = await res.json();
    }
  } catch (error) { 
    console.error("Gagal memuat data aset admin:", error); 
  }

  return (
    <div className="max-w-7xl mx-auto">
      <section className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
        
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-[#004282] shadow-inner">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">
              Daftar Aset Terdaftar
            </h3>
          </div>
          <span className="bg-[#004282] text-white px-4 py-1.5 rounded-xl text-xs font-black tracking-widest uppercase shadow-md">
            Total Data: {daftarAset.length}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-200">
              <tr>
                <th className="px-8 py-5">PIC & Instansi</th>
                <th className="px-8 py-5">Domain & Tujuan</th>
                <th className="px-8 py-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {daftarAset.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">
                      Belum ada aset terdaftar.
                    </p>
                  </td>
                </tr>
              ) : (
                daftarAset.map((aset) => (
                  <tr key={aset.id} className="hover:bg-blue-50/40 transition-colors group">
                    
                    <td className="px-8 py-5">
                      <p className="font-bold text-slate-800 text-base">{aset.pic_name}</p>
                      <p className="text-xs text-slate-500 font-semibold mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        {aset.institution}
                      </p>
                    </td>

                    <td className="px-8 py-5">
                      <p className="font-black text-[#004282] text-base tracking-tight">{aset.domain_name}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate max-w-xs">{aset.purpose}</p>
                    </td>

                    <td className="px-8 py-5 text-center">
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
