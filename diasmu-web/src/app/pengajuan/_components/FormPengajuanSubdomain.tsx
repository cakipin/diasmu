"use client";

import React, { useState } from "react";
import { submitPengajuanAset } from "../actions";

interface FormProps {
  userNbm: string;
  institution: string;
}

export default function FormPengajuanSubdomain({ userNbm, institution }: FormProps) {
  const [tipePengajuan, setTipePengajuan] = useState<"subdomain" | "email">("subdomain");
  const [tipeHosting, setTipeHosting] = useState<"pusat" | "pihak3">("pusat");

  return (
    <section className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-200">
      <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#004282] flex items-center justify-center font-black shadow-inner">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
        </div>
        <div>
          <h3 className="text-base font-black text-slate-800 uppercase tracking-tight italic">Form Pengajuan Aset Baru</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Pilih layanan yang dibutuhkan Instansi Anda</p>
        </div>
      </div>

      <form action={submitPengajuanAset} className="space-y-6">
        <input type="hidden" name="userNbm" value={userNbm} />
        <input type="hidden" name="tipePengajuan" value={tipePengajuan} />
        <input type="hidden" name="tipeHosting" value={tipeHosting} />

        {/* 1. INSTANSI PEMOHON */}
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Instansi Pemohon</label>
          <input type="text" value={institution} disabled className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed" />
        </div>

        {/* 2. PEMILIHAN TIPE PENGAJUAN */}
        <div>
          <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Jenis Layanan Digital <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            <button 
              type="button" 
              onClick={() => setTipePengajuan("subdomain")}
              className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${tipePengajuan === "subdomain" ? "bg-blue-50 border-[#004282] text-[#004282] ring-2 ring-[#004282]/20" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"}`}
            >
              Subdomain Website
            </button>
            <button 
              type="button" 
              onClick={() => setTipePengajuan("email")}
              className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${tipePengajuan === "email" ? "bg-blue-50 border-[#004282] text-[#004282] ring-2 ring-[#004282]/20" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"}`}
            >
              Email Organisasi
            </button>
          </div>
        </div>

        {/* 3A. JIKA MEMILIH EMAIL */}
        {tipePengajuan === "email" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Usulan Alamat Email <span className="text-red-500">*</span></label>
              <div className="flex items-stretch shadow-sm rounded-xl">
                <input type="text" name="emailName" required placeholder="admin.sekolah" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-l-xl text-sm focus:ring-2 focus:ring-[#004282] outline-none transition-all font-semibold" />
                <span className="bg-slate-100 border border-slate-300 border-l-0 px-4 py-3 rounded-r-xl text-sm font-black text-slate-500 flex items-center">
                  @muhammadiyah.or.id
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3B. JIKA MEMILIH SUBDOMAIN */}
        {tipePengajuan === "subdomain" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Usulan Nama Subdomain <span className="text-red-500">*</span></label>
              <div className="flex items-stretch shadow-sm rounded-xl">
                <input type="text" name="domainName" required placeholder="sekolah" className="w-full px-4 py-3 bg-white border border-slate-300 rounded-l-xl text-sm focus:ring-2 focus:ring-[#004282] outline-none transition-all font-semibold" />
                <span className="bg-slate-100 border border-slate-300 border-l-0 px-4 py-3 rounded-r-xl text-sm font-black text-slate-500 flex items-center whitespace-nowrap">
                  .muhammadiyah.or.id
                </span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5 font-medium ml-1">Hanya huruf kecil, angka, dan strip (-). Tanpa spasi.</p>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Lokasi Server / Hosting <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button" 
                  onClick={() => setTipeHosting("pusat")}
                  className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${tipeHosting === "pusat" ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"}`}
                >
                  VPS Pusat (DiasMu)
                </button>
                <button 
                  type="button" 
                  onClick={() => setTipeHosting("pihak3")}
                  className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${tipeHosting === "pihak3" ? "bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500/20" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"}`}
                >
                  Pihak Ketiga (Luar)
                </button>
              </div>
            </div>

            {/* KREDENSIAL PIHAK KETIGA */}
            {tipeHosting === "pihak3" && (
              <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-200 space-y-4 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Kredensial Server Pihak Ketiga</p>
                </div>
                
                {/* TAMBAHAN: URL HOSTING PENYEDIA */}
                <div>
                  <label className="block text-[10px] font-black text-amber-800/70 uppercase tracking-widest mb-1.5">URL Hosting / VPS Penyedia <span className="text-red-500">*</span></label>
                  <input type="text" name="providerUrl" required placeholder="Contoh: https://panel.niagahoster.co.id" className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all font-semibold" />
                </div>

                {/* IP ADDRESS SEKARANG OPSIONAL */}
                <div>
                  <label className="block text-[10px] font-black text-amber-800/70 uppercase tracking-widest mb-1.5">
                    IP Address (A Record) <span className="text-amber-600/70 normal-case font-bold ml-1">(Opsional)</span>
                  </label>
                  <input type="text" name="ipAddress" placeholder="Contoh: 103.145.xxx.xxx" className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all font-semibold" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-amber-800/70 uppercase tracking-widest mb-1.5">User Cpanel/VPS <span className="text-red-500">*</span></label>
                    <input type="text" name="credentialUser" required placeholder="Username" className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all font-semibold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-amber-800/70 uppercase tracking-widest mb-1.5">Password <span className="text-red-500">*</span></label>
                    <input type="password" name="credentialPassword" required placeholder="••••••••" className="w-full px-4 py-3 bg-white border border-amber-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all font-semibold" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. TUJUAN / DESKRIPSI (SELALU MUNCUL) */}
        <div className="pt-2">
          <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Tujuan / Deskripsi Penggunaan <span className="text-red-500">*</span></label>
          <textarea name="purpose" required rows={3} placeholder="Jelaskan peruntukan aset digital ini..." className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-[#004282] outline-none transition-all font-medium"></textarea>
        </div>

        <button type="submit" className="w-full bg-[#004282] text-white font-black uppercase tracking-widest text-[11px] py-4 rounded-xl shadow-lg hover:bg-blue-900 transition-all active:scale-95 mt-6 flex justify-center items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          Kirim Pengajuan Aset
        </button>
      </form>
    </section>
  );
}