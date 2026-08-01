"use client";
import React from "react";
import { submitPengajuanAset } from "../actions";

export default function FormPendataanDomain({ userNbm, institution }: { userNbm: string, institution: string }) {
  return (
    <section className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-200">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#004282] flex items-center justify-center font-black shadow-inner">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
        </div>
        <div>
          <h3 className="text-base font-black text-slate-800 uppercase tracking-tight italic">Pendataan Domain Mandiri</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Inventarisasi domain luar muhammadiyah.or.id</p>
        </div>
      </div>
      <form action={submitPengajuanAset} className="space-y-6">
        <input type="hidden" name="userNbm" value={userNbm} />
        <input type="hidden" name="tipePengajuan" value="domain" />
        
        <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Instansi Pemohon</label><input type="text" value={institution} disabled className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-500" /></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Nama Domain Lengkap <span className="text-red-500">*</span></label><input type="text" name="namaDomainMandiri" required placeholder="Contoh: sekolahku.sch.id" className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-[#004282]" /></div>
          {/* ✅ INPUT MASA AKTIF DOMAIN BARU */}
          <div><label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Masa Aktif / Expired Domain <span className="text-red-500">*</span></label><input type="date" name="masaAktifDomain" required className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-[#004282] text-slate-700" /></div>
        </div>
        
        <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-200 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Kredensial Penyedia Domain</p>
          </div>
          <div><label className="block text-[10px] font-black text-amber-800/70 uppercase tracking-widest mb-1.5">URL / Link Login Penyedia <span className="text-red-500">*</span></label><input type="text" name="providerDomain" required placeholder="https://panel.niagahoster..." className="w-full px-4 py-3 border border-amber-300 rounded-xl text-sm focus:ring-amber-500 font-semibold" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-[10px] font-black text-amber-800/70 uppercase tracking-widest mb-1.5">Email / Username Login <span className="text-red-500">*</span></label><input type="text" name="credentialUserDomain" required className="w-full px-4 py-3 border border-amber-300 rounded-xl text-sm focus:ring-amber-500 font-semibold" /></div>
            <div><label className="block text-[10px] font-black text-amber-800/70 uppercase tracking-widest mb-1.5">Password Akun Provider <span className="text-red-500">*</span></label><input type="password" name="credentialPasswordDomain" required placeholder="••••••••" className="w-full px-4 py-3 border border-amber-300 rounded-xl text-sm focus:ring-amber-500 font-semibold" /></div>
          </div>
        </div>
        <div className="pt-2"><label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Deskripsi / Kegunaan Website <span className="text-red-500">*</span></label><textarea name="purpose" required rows={3} placeholder="Jelaskan peruntukan domain ini..." className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-[#004282] font-medium"></textarea></div>
        <button type="submit" className="w-full bg-[#004282] text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-xl shadow-lg hover:bg-blue-900 transition-all mt-6 flex justify-center items-center gap-2">Kirim Data Domain Mandiri</button>
      </form>
    </section>
  );
}