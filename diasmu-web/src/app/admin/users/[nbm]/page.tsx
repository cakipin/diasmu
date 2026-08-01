import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { apiUrl, authHeaders } from "@/lib/security";
import type { PicInfo, Aset } from "@/types/diasmu";
import { revalidatePath } from "next/cache";
import UploadFormWrapper from "@/components/UploadFormWrapper";
import { adminUploadBerkasAction } from "@/app/actions/upload";

export const runtime = "edge";

type Props = {
  params: Promise<{ nbm: string }>;
};

export default async function PicProfilePage(props: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await props.params;
  const nbm = params.nbm;
  const encodedId = encodeURIComponent(nbm);

  let picInfo: PicInfo = { isRegistered: false, status: null, data: null };
  let asetHandled: Aset[] = [];

  try {
    const headers = authHeaders();

    const resPic = await fetch(apiUrl(`/api/check-pic/${encodedId}`), { 
      cache: "no-store",
      headers
    });
    if (resPic.ok) picInfo = await resPic.json();

    const resAset = await fetch(apiUrl(`/api/aset/pic/${encodedId}`), { 
      cache: "no-store",
      headers
    });
    if (resAset.ok) asetHandled = await resAset.json();

  } catch (error) {
    console.error("Gagal fetch data PIC:", error);
  }

  const data = picInfo.data;

  if (!data) {
    return (
      <div className="ui-profile-page flex flex-col items-center justify-center min-h-[50vh] bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
        <h2 className="text-2xl font-black text-slate-800">PIC Tidak Ditemukan</h2>
        <p className="text-slate-500 mt-2">Nomor NBM / Email {nbm} tidak terdaftar sebagai PIC.</p>
        <Link href="/admin/users" className="ui-button ui-button-primary mt-6">Kembali</Link>
      </div>
    );
  }

  // Bind closure variables to the standalone Server Action
  const handleUpload = adminUploadBerkasAction.bind(null, {
    encodedId,
    institution: data?.institution,
    email_instansi: data?.email_instansi
  });

  return (
    <div className="ui-profile-page animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      {/* Header Profile */}
      <section className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-[#004282] to-[#0066cc] w-full"></div>
        <div className="p-8 pt-0 relative flex flex-col md:flex-row gap-6 items-start md:items-end">
          <div className="w-24 h-24 rounded-3xl bg-white p-2 shadow-lg border border-slate-100 -mt-12 relative z-10 flex-shrink-0">
            <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          
          <div className="flex-1 pb-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">{data.name}</h1>
                <p className="text-[#004282] font-black uppercase tracking-widest text-sm flex items-center gap-2 mt-1">
                  {data.nbm} 
                  <span className={`px-2 py-0.5 rounded text-[10px] ${data.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {data.status}
                  </span>
                </p>
              </div>
              <Link href="/admin/users" className="ui-button ui-button-secondary shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Kembali
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 pt-4 border-t border-slate-100 bg-slate-50/50">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Instansi</p>
              <p className="font-semibold text-slate-700">{data.institution || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Email</p>
              <p className="font-semibold text-slate-700">{data.email || '-'}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Nomor Telepon</p>
              <p className="font-semibold text-slate-700">{data.phone || '-'}</p>
            </div>
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex gap-3">
                {data.surat_tugas ? (
                  <a href={apiUrl(`/public/files/${data.surat_tugas}`)} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Surat Tugas
                  </a>
                ) : (
                  <span className="flex items-center gap-2 bg-slate-100 text-slate-400 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold cursor-not-allowed">Surat Tugas (Tidak Ada)</span>
                )}
                
                {data.surat_permohonan ? (
                  <a href={apiUrl(`/public/files/${data.surat_permohonan}`)} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Surat Permohonan
                  </a>
                ) : (
                  <span className="flex items-center gap-2 bg-slate-100 text-slate-400 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold cursor-not-allowed">Permohonan (Tidak Ada)</span>
                )}
              </div>
              
              <UploadFormWrapper serverAction={handleUpload} className="mt-4 p-4 border border-slate-200 rounded-xl bg-white shadow-sm space-y-3">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Admin: Upload Berkas Susulan</p>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Surat Tugas</label>
                    <input type="file" name="suratTugas" accept=".pdf,.png,.jpg,.jpeg" className="w-full text-xs border bg-slate-50 rounded-lg file:bg-slate-200 file:text-slate-700 file:border-0 file:py-1 file:px-3 file:rounded-lg file:font-bold file:mr-3 hover:file:bg-slate-300 transition-colors cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Surat Permohonan</label>
                    <input type="file" name="suratPermohonan" accept=".pdf,.png,.jpg,.jpeg" className="w-full text-xs border bg-slate-50 rounded-lg file:bg-slate-200 file:text-slate-700 file:border-0 file:py-1 file:px-3 file:rounded-lg file:font-bold file:mr-3 hover:file:bg-slate-300 transition-colors cursor-pointer" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#004282] text-white font-bold uppercase tracking-widest text-[10px] py-2 rounded-lg shadow-sm hover:bg-blue-900 transition-all active:scale-95">
                  Upload Berkas
                </button>
              </UploadFormWrapper>
            </div>
          </div>
        </div>
      </section>

      {/* Aset yang Dikelola */}
      <section className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center gap-4 bg-white">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">Aset Digital Dikelola</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Daftar domain, email, dan akun yang dikelola oleh {data.name}</p>
          </div>
          <div className="ml-auto">
            <span className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-1.5 rounded-xl text-xs font-black tracking-widest uppercase shadow-sm">Total: {asetHandled.length} Aset</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-200">
              <tr>
                <th className="px-8 py-5">Nama Aset / Domain</th>
                <th className="px-8 py-5">Tipe Aset</th>
                <th className="px-8 py-5">Tujuan / Deskripsi</th>
                <th className="px-8 py-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {asetHandled.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400 font-bold uppercase text-xs">Belum ada aset digital.</td></tr>
              ) : (
                asetHandled.map((aset) => (
                  <tr key={aset.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4 font-bold text-slate-800">{aset.domain_name}</td>
                    <td className="px-8 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-widest border border-slate-200">{aset.tipe_aset || 'Unknown'}</span>
                    </td>
                    <td className="px-8 py-4 text-slate-600">{aset.purpose || '-'}</td>
                    <td className="px-8 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${aset.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {aset.status}
                      </span>
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
