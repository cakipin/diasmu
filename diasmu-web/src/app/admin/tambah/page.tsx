import { requireAdminSession } from "@/lib/security";

export const runtime = "edge";

export default async function TambahAsetPage() {
  await requireAdminSession();
  return (
    <div className="max-w-3xl mx-auto">
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-[#004282]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800">Input Aset Baru</h3>
        </div>
        
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Instansi</label>
            <input type="text" placeholder="Contoh: MPI " className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004282] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Subdomain</label>
            <div className="flex shadow-sm rounded-lg">
              <input type="text" placeholder="nama-unit" className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-l-lg focus:ring-2 focus:ring-[#004282] outline-none" />
              <span className="inline-flex items-center px-4 rounded-r-lg border border-l-0 border-slate-300 bg-slate-100 text-slate-500 font-medium">
                .muhammadiyah.or.id
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Status Awal</label>
            <select className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004282] outline-none">
              <option value="active">🟢 Active</option>
              <option value="pending">🟡 Pending</option>
              <option value="inactive">🔴 Inactive</option>
            </select>
          </div>
          <button className="w-full mt-4 bg-[#004282] text-white font-bold py-3.5 rounded-lg hover:bg-blue-900 transition-colors shadow-md flex justify-center items-center gap-2">
            Simpan Aset Baru
          </button>
        </form>
      </section>
    </div>
  );
}