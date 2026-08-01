"use client";
import React from "react";
import { submitPengajuanAset } from "../actions";

export default function FormPendataanAkun({ userNbm, institution }: { userNbm: string, institution: string }) {
  return (
    <section className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-200">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#004282] flex items-center justify-center font-black shadow-inner">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
        </div>
        <div>
          <h3 className="text-base font-black text-slate-800 uppercase tracking-tight italic">Pendataan Akun Provider & Sistem</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Dokumentasi kredensial infrastruktur IT instansi</p>
        </div>
      </div>
      
      <form action={submitPengajuanAset} className="space-y-6">
        <input type="hidden" name="userNbm" value={userNbm} />
        <input type="hidden" name="tipePengajuan" value="akun" />
        
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Instansi Pemohon</label>
          <input type="text" value={institution} disabled className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Kategori Akun / Layanan <span className="text-red-500">*</span></label>
            <select name="jenisAkun" required className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 outline-none bg-white">
              <option value="">Pilih Kategori...</option>
              <option value="Cloudflare Ecosystem">Cloudflare Ecosystem</option>
              <option value="VPS Provider">VPS Provider</option>
              <option value="Control Panel">Control Panel</option>
              <option value="Google Workspace Admin">Google Workspace Admin</option>
              <option value="Email Bisnis / SMTP Provider">Email Bisnis / SMTP Provider</option>
              {/* ✅ OPSI BARU TANPA KURUNG */}
              <option value="Repository Code">Repository Code</option>
              <option value="Dokumen Teknis / Manual">Dokumen Teknis / Manual</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Nama Vendor / Layanan <span className="text-red-500">*</span></label>
            <input type="text" name="namaLayanan" required placeholder="Contoh: GitHub MPI / SOP Server" className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-[#004282]" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">IP Address / Public IP</label>
            <input type="text" name="ipAddressAkun" placeholder="103.145.xxx.xxx" className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-1 focus:ring-[#004282]" />
          </div>
        </div>

        <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-200 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Akses Login & Data Pemulihan</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="usernameAkun" required placeholder="Username / Email Login" className="w-full px-4 py-3 border border-amber-300 rounded-xl text-sm font-semibold outline-none bg-white" />
            <input type="password" name="passwordAkun" required placeholder="Kata Sandi / Token" className="w-full px-4 py-3 border border-amber-300 rounded-xl text-sm font-semibold outline-none bg-white" />
            <input type="email" name="emailTertaut" placeholder="Email Pemulihan" className="w-full px-4 py-3 border border-amber-300 rounded-xl text-sm font-semibold outline-none bg-white" />
            <input type="tel" name="phoneTertaut" placeholder="No HP Pemulihan" className="w-full px-4 py-3 border border-amber-300 rounded-xl text-sm font-semibold outline-none bg-white" />
          </div>
        </div>

        {/* ✅ BAGIAN BARU: UPLOAD DOKUMEN / CODE */}
        <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">Lampiran File (Code/SOP/Manual)</p>
            <p className="text-[9px] text-blue-500 font-medium italic">Format: .zip, .pdf, .txt, .docx (Maks 5MB)</p>
          </div>
          <input type="file" name="fileLampiran" className="w-full md:w-auto text-[10px] file:bg-[#004282] file:text-white file:border-0 file:py-2 file:px-4 file:rounded-xl file:font-black file:uppercase file:cursor-pointer hover:file:bg-blue-900 transition-all" />
        </div>

        <div className="pt-2">
          <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Catatan Penting</label>
          <textarea name="purpose" required rows={3} placeholder="Jelaskan detail akun atau isi dokumen ini..." className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-[#004282] font-medium outline-none"></textarea>
        </div>

        <button type="submit" className="w-full bg-[#004282] text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-xl shadow-lg hover:bg-blue-900 transition-all flex justify-center items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          Simpan Data & Lampiran
        </button>
      </form>
    </section>
  );
}