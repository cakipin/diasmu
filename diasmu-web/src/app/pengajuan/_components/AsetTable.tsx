"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { hapusAset, hapusIzinAset, logCredentialReveal, updatePengajuanAset, getIzinAset, tambahIzinAset } from "../actions/asetActions";
import type { Aset, Permission } from "@/types/diasmu";

type DetailRecord = Record<string, string>;
const ITEMS_PER_PAGE = 5;

function parseDetail(detail?: string | null): DetailRecord {
  if (!detail) return {};
  try {
    const parsed = JSON.parse(detail);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export default function AsetTable({ asetHandled, referenceDate }: { asetHandled: Aset[]; referenceDate: string }) {
  // States Existing CRUD & ACL
  const [viewAset, setViewAset] = useState<Aset | null>(null);
  const [editAset, setEditAset] = useState<Aset | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [shareAset, setShareAset] = useState<Aset | null>(null);
  const [listIzin, setListIzin] = useState<Permission[]>([]);
  const [inputNbm, setInputNbm] = useState("");
  const [inputRole, setInputRole] = useState("viewer");
  const [errShare, setErrShare] = useState("");
  const [credentialError, setCredentialError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // 🛡️ MODAL AUDIT ALASAN BUKA KREDENSIAL (RULE 16: ANTI-WINDOW.PROMPT)
  const [promptTarget, setPromptTarget] = useState<{ key: string; aset: Aset } | null>(null);
  const [auditReasonInput, setAuditReasonInput] = useState("");
  const [auditReasonError, setAuditReasonError] = useState("");

  // 🔎 STATES BARU: SEARCH, FILTER, & PAGINATION
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Muat daftar orang yang punya izin secara realtime saat modal dibuka
  useEffect(() => {
    if (shareAset) {
      getIzinAset(shareAset.id).then(res => setListIzin(res));
    }
  }, [shareAset]);

  const togglePassword = (key: string, aset: Aset) => {
    if (showPasswords[key]) {
      setShowPasswords(prev => ({ ...prev, [key]: false }));
      return;
    }

    // Buka Modal In-System untuk Meminta Alasan
    setAuditReasonInput("");
    setAuditReasonError("");
    setPromptTarget({ key, aset });
  };

  const handleConfirmAuditReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptTarget) return;

    const trimmed = auditReasonInput.trim();
    if (trimmed.length < 8) {
      setAuditReasonError("Alasan minimal 8 karakter diperlukan sebelum kredensial dibuka.");
      return;
    }

    try {
      await logCredentialReveal(promptTarget.aset.id, promptTarget.key, trimmed);
      setCredentialError("");
      setShowPasswords(prev => ({ ...prev, [promptTarget.key]: true }));
      setPromptTarget(null);
    } catch {
      setAuditReasonError("Gagal mencatat audit log, coba lagi.");
    }
  };


  const handleEditSubmit = (formData: FormData) => {
    startTransition(async () => {
      await updatePengajuanAset(formData);
      setEditAset(null); 
    });
  };

  const handleDelete = () => {
    if (deleteId) {
      startTransition(async () => {
        await hapusAset(deleteId);
        setDeleteId(null);
      });
    }
  };

  const handleTambahAkses = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrShare("");
    if (!inputNbm.trim()) return;

    if (!shareAset) return;

    const res = await tambahIzinAset(shareAset.id, inputNbm.trim(), inputRole);
    if (res.success) {
      setInputNbm("");
      const updated = await getIzinAset(shareAset.id);
      setListIzin(updated);
    } else {
      setErrShare(res.message || "Gagal membagikan akses");
    }
  };

  const handleCabutAkses = async (permId: number) => {
    await hapusIzinAset(permId);
    if (!shareAset) return;
    const updated = await getIzinAset(shareAset.id);
    setListIzin(updated);
  };

  // ⏳ HELPER: MENGHITUNG MASA AKTIF SISA HARI
  const getExpirationInfo = (aset: Aset) => {
    const d = parseDetail(aset.detail);
    let dateStr = "";

    if (aset.tipe_aset === 'domain') dateStr = d.masaAktifDomain;
    if (aset.tipe_aset === 'subdomain' && d.tipeHosting === 'pihak3') dateStr = d.masaAktifHosting;

    if (!dateStr) return null;

    const expDate = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00Z` : dateStr);
    const today = new Date(`${referenceDate}T00:00:00Z`);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { dateStr, diffDays };
  };

  // 🖥️ HELPER BARU: EKSTRAKSI IP ADDRESS DARI JSON DETAIL
  const getIpAddressInfo = (aset: Aset) => {
    const d = parseDetail(aset.detail);
    if (aset.tipe_aset === 'subdomain' && d.tipeHosting === 'pihak3') return d.ipAddress || "-";
    if (aset.tipe_aset === 'akun') return d.ipAddressAkun || "-";
    return "-";
  };

  // 🔍 LOGIKA FILTERING DATA (KINI MENDUKUNG FILTER VPS SPESIFIK)
  const filteredAset = useMemo(() => asetHandled.filter((aset) => {
    const domainName = aset.domain_name || "";
    const purpose = aset.purpose || "";
    const matchesSearch = 
      domainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      purpose.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Logika filter kategori umum & khusus sub-kategori VPS Provider
    let matchesCategory = false;
    if (selectedCategory === "all") {
      matchesCategory = true;
    } else if (selectedCategory === "vps") {
      const d = parseDetail(aset.detail);
      matchesCategory = aset.tipe_aset === "akun" && (d.jenisAkun === "VPS Provider" || d.jenisAkun === "Akun VPS / Server");
    } else {
      matchesCategory = aset.tipe_aset === selectedCategory;
    }
    
    return matchesSearch && matchesCategory;
  }), [asetHandled, searchQuery, selectedCategory]);

  // 📑 LOGIKA PAGINATION
  const totalPages = Math.ceil(filteredAset.length / ITEMS_PER_PAGE);
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1));
  const safeStartIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAset = filteredAset.slice(safeStartIndex, safeStartIndex + ITEMS_PER_PAGE);
  const visiblePages = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const firstPage = Math.min(Math.max(safeCurrentPage - 2, 1), totalPages - 4);
    return Array.from({ length: 5 }, (_, index) => firstPage + index);
  }, [safeCurrentPage, totalPages]);

  const renderDetailKredensial = (detailStr: string | null | undefined, aset: Aset) => {
      const d = parseDetail(detailStr);
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          {Object.keys(d).map((key) => {
            if (['userNbm', 'tipePengajuan', 'purpose', 'domainName', 'emailName', 'namaDomainMandiri', 'namaLayanan', 'jenisAkun', 'ipAddressAkun'].includes(key)) return null;
            
            // Render link download dokumen / repository code jika ada lampiran file
            if (key === 'lampiranSistem' && d[key]) {
              return (
                <div key={key} className="col-span-full bg-blue-50 p-3 rounded-xl border border-blue-200 mt-1 flex flex-col gap-1">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Berkas Berkas Pendukung</p>
                  <a href={`https://diasmu.labmu.workers.dev/api/download/${d[key]}`} target="_blank" rel="noreferrer" className="text-xs font-black text-[#004282] hover:underline flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 8m4-4v12"/></svg>
                    UNDUH LAMPIRAN SISTEM
                  </a>
                </div>
              );
            }

            const isPassword = key.toLowerCase().includes('password') || key === 'credentialMedsos' || key === 'passwordAkun';
            const isVisible = showPasswords[key];

            return (
              <div key={key} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                {isPassword ? (
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs font-bold text-slate-800 break-all font-mono tracking-widest">{isVisible ? (d[key] || "-") : "••••••••"}</p>
                    <button type="button" onClick={() => togglePassword(key, aset)} className="text-slate-400 hover:text-[#004282] p-1" title={isVisible ? "Sembunyikan kredensial" : "Buka kredensial dengan alasan audit"}>
                      {isVisible ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                ) : <p className="text-xs font-bold text-slate-800 break-all mt-1">{d[key] || "-"}</p>}
              </div>
            );
          })}
        </div>
      );
  };

  return (
    <section className="ui-asset-list relative min-w-0">
      
      {/* 🛠️ CONTROL BAR: SEARCH DAN SELEKSI KATEGORI ASET */}
      <div className="ui-asset-toolbar flex flex-col gap-4 border-b border-[#e2e7ee] bg-white md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-[#667085]"><strong className="font-semibold text-[#172033]">{filteredAset.length}</strong> dari {asetHandled.length} aset ditampilkan</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-xl md:justify-end">
          {/* Input Search */}
          <div className="relative flex-1">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Cari nama aset atau deskripsi..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#004282] outline-none transition-all"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          {/* Dropdown Kategori */}
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-[#004282]"
          >
            <option value="all">Semua Kategori Aset</option>
            <option value="subdomain">Subdomain Website</option>
            <option value="email">Email Organisasi</option>
            <option value="medsos">Media Sosial</option>
            <option value="domain">Domain Mandiri</option>
            <option value="akun">Akun Sistem & Infra</option>
            <option value="vps">Akun VPS / Server</option> {/* ✅ PILIHAN FILTER VPS BARU */}
          </select>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden">
        <table className="ui-asset-table w-full table-fixed text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-gray-200">
            <tr>
              <th className="asset-name-column px-6 py-4">Nama Aset / Akun</th>
              <th className="asset-ip-column px-6 py-4 text-center">IP Address</th>
              <th className="asset-purpose-column px-6 py-4">Tujuan / Deskripsi</th>
              <th className="asset-expiry-column px-6 py-4 text-center">Masa Aktif</th>
              <th className="asset-status-column px-6 py-4 text-center">Status</th>
              <th className="asset-action-column px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {paginatedAset.length === 0 ? (
              // ✅ COLSPAN DIUBAH JADI 6 AGAR SESUAI DENGAN JUMLAH KOLOM BARU
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-wider">Aset digital tidak ditemukan atau belum didaftarkan.</td></tr>
            ) : (
              paginatedAset.map((aset) => {
                const isOwner = aset.user_role === 'owner';
                const isEditor = isOwner || aset.user_role === 'editor';
                const expInfo = getExpirationInfo(aset);
                const ipAddress = getIpAddressInfo(aset); // Ambil info IP

                return (
                  <tr key={aset.id} className="hover:bg-slate-50 transition-colors">
                    <td className="asset-name-column px-6 py-4">
                      <div className="font-black text-[#004282] text-sm tracking-tight flex items-center gap-2">
                        {aset.domain_name}
                        {!isOwner && <span className="bg-amber-100 text-amber-800 text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase">Shared ({aset.user_role})</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {aset.tipe_aset === 'subdomain' && <span className="bg-blue-50 text-blue-600 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-blue-200">Subdomain</span>}
                        {aset.tipe_aset === 'email' && <span className="bg-purple-50 text-purple-600 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-purple-200">Email Org.</span>}
                        {aset.tipe_aset === 'medsos' && <span className="bg-pink-50 text-pink-600 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-pink-200">Media Sosial</span>}
                        {aset.tipe_aset === 'domain' && <span className="bg-indigo-50 text-indigo-600 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-indigo-200">Domain Mandiri</span>}
                        {aset.tipe_aset === 'akun' && (
                          <>
                            <span className="bg-cyan-50 text-cyan-600 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-cyan-200">Akun Sistem</span>
                            {/* ✅ DOUBLE BADGE CHIP KHUSUS JIKA TERDETEKSI SEBAGAI VPS SERVER */}
                            {(() => {
                                const d = parseDetail(aset.detail);
                                if (d.jenisAkun === "VPS Provider" || d.jenisAkun === "Akun VPS / Server") {
                                  return <span className="bg-orange-50 text-orange-600 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-orange-200">VPS Server</span>;
                                }
                              return null;
                            })()}
                          </>
                        )}
                      </div>
                      <div className="asset-mobile-meta">
                        {aset.purpose && <p>{aset.purpose}</p>}
                        <span>{ipAddress !== "-" ? `IP ${ipAddress}` : "Tanpa IP khusus"}</span>
                        <span>{expInfo ? expInfo.dateStr : "Permanen / Organisasi"}</span>
                        <span className={aset.status === "active" ? "text-emerald-700" : "text-amber-700"}>{aset.status === "active" ? "Active" : "Pending"}</span>
                      </div>
                    </td>

                    {/* ✅ KONTEN RENDERING KOLOM IP ADDRESS BARU */}
                    <td className="asset-ip-column px-6 py-4 text-center whitespace-nowrap font-mono text-xs font-bold text-slate-600">
                      {ipAddress !== "-" ? (
                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm text-slate-700">{ipAddress}</span>
                      ) : (
                        <span className="text-slate-400 font-medium italic">-</span>
                      )}
                    </td>

                    <td className="asset-purpose-column px-6 py-4 font-medium text-slate-600"><p className="line-clamp-2">{aset.purpose}</p></td>
                    
                    <td className="asset-expiry-column px-6 py-4 text-center whitespace-nowrap">
                      {expInfo ? (
                        <div className="flex flex-col items-center">
                          <span className="font-mono text-xs font-bold text-slate-700">{expInfo.dateStr}</span>
                          {expInfo.diffDays > 30 ? (
                            <span className="text-[9px] font-extrabold text-emerald-600 uppercase mt-0.5"> Aman ({expInfo.diffDays} Hari)</span>
                          ) : expInfo.diffDays > 0 ? (
                            <span className="text-[9px] font-extrabold text-amber-600 uppercase mt-0.5 animate-pulse"> Segera Exp ({expInfo.diffDays} Hari)</span>
                          ) : (
                            <span className="text-[9px] font-extrabold text-red-600 uppercase mt-0.5 bg-red-50 px-1 rounded border border-red-200"> Expired!</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium italic text-[11px]">Permanen / Organisasi</span>
                      )}
                    </td>

                    <td className="asset-status-column px-6 py-4 text-center">
                      {aset.status === 'active' ? <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md font-black uppercase tracking-widest text-[8px]">Active</span> 
                      : <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-md font-black uppercase tracking-widest text-[8px] animate-pulse">Pending</span>}
                    </td>
                    <td className="asset-action-column px-6 py-4 text-center">
                      <div className="asset-action-row">
                        <button onClick={() => setViewAset(aset)} className="asset-action-button asset-action-view" title="Lihat Detail" aria-label={`Lihat detail ${aset.domain_name}`}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                        {isOwner && (
                          <button onClick={() => setShareAset(aset)} className="asset-action-button asset-action-share" title="Bagikan Akses" aria-label={`Bagikan akses ${aset.domain_name}`}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg></button>
                        )}
                        <button onClick={() => setEditAset(aset)} disabled={!isEditor} className="asset-action-button asset-action-edit" title="Edit Data" aria-label={`Edit ${aset.domain_name}`}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button onClick={() => setDeleteId(aset.id)} disabled={!isOwner} className="asset-action-button asset-action-delete" title="Hapus Aset" aria-label={`Hapus ${aset.domain_name}`}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 📑 PAGINATION NAVIGATION */}
      <div className="ui-pagination asset-pagination">
        <p>Menampilkan {filteredAset.length === 0 ? 0 : safeStartIndex + 1}–{Math.min(safeStartIndex + ITEMS_PER_PAGE, filteredAset.length)} dari {filteredAset.length} aset</p>
        <nav aria-label="Pagination aset digital">
          <button type="button" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} aria-label="Halaman sebelumnya">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m15 18-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          {visiblePages.map((page) => (
            <button key={page} type="button" aria-current={page === safeCurrentPage ? "page" : undefined} onClick={() => setCurrentPage(page)} aria-label={`Halaman ${page}`}>{page}</button>
          ))}
          <button type="button" disabled={safeCurrentPage === Math.max(totalPages, 1)} onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.max(totalPages, 1)))} aria-label="Halaman berikutnya">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m9 18 6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </nav>
      </div>

      {/* MODAL 1: VIEW DETAIL */}
      {viewAset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-[#004282] text-white flex justify-between items-center">
              <h3 className="font-black italic uppercase tracking-widest text-sm">Informasi Aset / Kredensial</h3>
              <button onClick={() => setViewAset(null)} className="text-white/60 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Aset / Akun</p>
              <p className="text-lg font-black text-[#004282]">{viewAset.domain_name}</p>
              <div className="mt-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tujuan / Deskripsi</p><p className="text-sm font-medium text-slate-700">{viewAset.purpose}</p></div>
              {credentialError && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">{credentialError}</p>}
              {renderDetailKredensial(viewAset.detail, viewAset)}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end"><button onClick={() => setViewAset(null)} className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300">Tutup Jendela</button></div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT ASET */}
      {editAset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-amber-500 text-white flex justify-between items-center">
              <h3 className="font-black italic uppercase tracking-widest text-sm">Update Tujuan & Deskripsi</h3>
              <button onClick={() => setEditAset(null)} disabled={isPending} className="text-white/60 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form action={handleEditSubmit} className="p-8 space-y-4">
              <input type="hidden" name="id" value={editAset.id} />
              {Object.entries(parseDetail(editAset.detail)).map(([key, value]) => key !== 'purpose' && <input type="hidden" key={key} name={key} value={value || ""} />)}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4"><p className="text-xs font-medium text-amber-800">Perubahan saat ini dibatasi untuk <strong>Tujuan / Deskripsi</strong> agar tidak merusak pointing sistem.</p></div>
              <div><label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Aset Digital</label><input type="text" disabled defaultValue={editAset.domain_name} className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed" /></div>
              <div><label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Tujuan Baru <span className="text-red-500">*</span></label><textarea name="purpose" required defaultValue={editAset.purpose} disabled={isPending} rows={4} className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none font-medium"></textarea></div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditAset(null)} className="px-6 py-3 bg-slate-100 rounded-xl text-xs font-bold hover:bg-slate-200">Batal</button>
                <button type="submit" disabled={isPending} className="px-6 py-3 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 shadow-lg flex items-center gap-2">{isPending ? "Menyimpan..." : "Simpan Perubahan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 text-center p-8">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
            <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">Hapus Aset?</h3>
            <p className="text-sm text-slate-500 mt-2 font-medium">Tindakan ini permanen. Kredensial dan data akan hilang dari sistem.</p>
            <div className="mt-8 flex justify-center gap-3">
              <button onClick={() => setDeleteId(null)} className="px-6 py-3 bg-slate-100 rounded-xl text-xs font-bold hover:bg-slate-200">Batal</button>
              <button onClick={handleDelete} className="px-6 py-3 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 shadow-lg">Ya, Hapus Permanen</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MULTIUSER 4: KELOLA AKSES BERBAGI (ACL) */}
      {shareAset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-purple-700 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black italic uppercase tracking-widest text-sm">Delegasikan Akses Tim</h3>
                <p className="text-[10px] text-purple-200 font-bold mt-0.5">{shareAset.domain_name}</p>
              </div>
              <button onClick={() => { setShareAset(null); setErrShare(""); }} className="text-white/60 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="p-6 space-y-6">
              <form onSubmit={handleTambahAkses} className="bg-purple-50 p-4 rounded-2xl border border-purple-100 space-y-3">
                <p className="text-[10px] font-black text-purple-800 uppercase tracking-widest">Beri Akses User Lain</p>
                <div className="flex flex-col md:flex-row gap-3">
                  <input type="text" value={inputNbm} onChange={(e) => setInputNbm(e.target.value)} placeholder="Masukkan NBM atau Email Rekan Kerja" required className="flex-1 px-4 py-2.5 bg-white border border-purple-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-purple-600 outline-none" />
                  <select value={inputRole} onChange={(e) => setInputRole(e.target.value)} className="px-4 py-2.5 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-purple-600 outline-none">
                    <option value="viewer">Viewer (Hanya Lihat)</option>
                    <option value="editor">Editor (Bisa Ubah)</option>
                  </select>
                  <button type="submit" className="bg-purple-700 hover:bg-purple-800 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all">Tambah</button>
                </div>
                {errShare && <p className="text-[10px] font-bold text-red-600 mt-1">⚠️ {errShare}</p>}
              </form>

              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Daftar Pengguna Yang Memiliki Akses</p>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-slate-50/50">
                  {listIzin.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 font-bold uppercase p-6">Aset ini masih privat (Hanya untuk Anda).</p>
                  ) : (
                    listIzin.map((perm) => (
                      <div key={perm.id} className="flex items-center justify-between p-4 bg-white">
                        <div>
                          <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{perm.user_name || "Anggota Muhammadiyah"}</p>
                          <p className="text-[9px] font-bold text-slate-400">NBM: {perm.user_nbm} • <span className="text-purple-600 capitalize">{perm.role}</span></p>
                        </div>
                        <button type="button" onClick={() => handleCabutAkses(perm.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors" title="Cabut Akses"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end"><button onClick={() => { setShareAset(null); setErrShare(""); }} className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-300">Selesai</button></div>
          </div>
        </div>
      )}

      {/* 🛡️ MODAL IN-SYSTEM 5: INPUT ALASAN AUDIT KREDENSIAL (RULE 16: PENGGANTI WINDOW.PROMPT) */}
      {promptTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-slate-200">
            <div className="p-6 bg-[#004282] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h3 className="font-black italic uppercase tracking-wider text-sm">Audit Keamanan Kredensial</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setPromptTarget(null)} 
                className="text-white/70 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleConfirmAuditReason} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs font-medium text-blue-900">
                <p className="font-bold mb-1">Aset: {promptTarget.aset.domain_name}</p>
                <p className="text-[11px] text-blue-700">Untuk mematuhi protokol audit persyarikatan, pembukaan kredensial akan dicatat secara permanen di log keamanan sistem.</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">
                  Alasan Membuka Kredensial <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={auditReasonInput}
                  onChange={(e) => setAuditReasonInput(e.target.value)}
                  placeholder="Contoh: Pembaruan sertifikat SSL / rotasi password server..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-[#004282] outline-none transition-all resize-none text-slate-800"
                />
                <p className="text-[10px] text-slate-400 mt-1">Minimal 8 karakter penjelasan aktivitas.</p>
              </div>

              {auditReasonError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
                  ⚠️ {auditReasonError}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPromptTarget(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#004282] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  Buka Kredensial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

