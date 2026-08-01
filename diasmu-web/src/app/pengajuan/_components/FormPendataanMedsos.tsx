"use client";
import React from "react";
import { submitPengajuanAset } from "../actions";

export default function FormPendataanMedsos({ userNbm, institution }: { userNbm: string, institution: string }) {
  return (
    <section className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-200">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#004282] flex items-center justify-center font-black shadow-inner">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        </div>
        <div>
          <h3 className="text-base font-black text-slate-800 uppercase tracking-tight italic">Pendataan Akun Media Sosial</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Inventarisasi akun publik instansi</p>
        </div>
      </div>
      <form action={submitPengajuanAset} className="space-y-6">
        <input type="hidden" name="userNbm" value={userNbm} />
        <input type="hidden" name="tipePengajuan" value="medsos" />
        
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Instansi Pemohon</label>
          <input type="text" value={institution} disabled className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Platform Media Sosial <span className="text-red-500">*</span></label>
            <select name="platformMedsos" required className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-[#004282] font-semibold text-slate-700 outline-none">
              <option value="">Pilih Platform...</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook / Fanspage</option>
              <option value="YouTube">YouTube</option>
              <option value="Tiktok">TikTok</option>
              <option value="X">X (Twitter)</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Nama Akun / Username <span className="text-red-500">*</span></label>
            <input type="text" name="namaAkunMedsos" required placeholder="Contoh: @mpi.surabaya" className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-[#004282] outline-none" />
          </div>
        </div>

        {/* KREDENSIAL BOX (KINI 3 KOLOM) */}
        <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-200 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Kredensial & Pemulihan (Rahasia)</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black text-amber-800/70 uppercase tracking-widest mb-1.5">Password Akun <span className="text-red-500">*</span></label>
              <input type="password" name="credentialMedsos" required placeholder="••••••••" className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-sm focus:ring-amber-500 font-semibold outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-amber-800/70 uppercase tracking-widest mb-1.5">No. HP Tertaut / 2FA <span className="text-red-500">*</span></label>
              <input type="tel" name="phoneMedsos" required placeholder="0812xxxxxx" className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-sm focus:ring-amber-500 font-semibold outline-none" />
            </div>
            {/* ✅ FIELD BARU: ALAMAT EMAIL MEDSOS */}
            <div>
              <label className="block text-[10px] font-black text-amber-800/70 uppercase tracking-widest mb-1.5">Alamat Email Akun <span className="text-red-500">*</span></label>
              <input type="email" name="emailMedsos" required placeholder="contoh@gmail.com" className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-sm focus:ring-amber-500 font-semibold outline-none" />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Deskripsi Akun <span className="text-red-500">*</span></label>
          <textarea name="purpose" required rows={3} placeholder="Contoh: Akun resmi dokumentasi kegiatan..." className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-[#004282] font-medium outline-none"></textarea>
        </div>
        <button type="submit" className="w-full bg-[#004282] text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-xl shadow-lg hover:bg-blue-900 transition-all active:scale-95 mt-6 flex justify-center items-center gap-2">
          Kirim Data Akun Medsos
        </button>
      </form>
    </section>
  );
}