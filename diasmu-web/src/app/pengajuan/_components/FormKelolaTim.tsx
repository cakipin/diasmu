"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getDaftarStaff, getKandidatStaff, tambahAnggotaStaff, hapusAnggotaStaff } from "../actions/staffActions"; // ✅ Jalur impor dialihkan ke arsitektur modular baru
import type { EligibleStaffUser, StaffMember } from "@/types/diasmu";

export default function FormKelolaTim({ picNbm }: { picNbm: string }) {
  const [listStaff, setListStaff] = useState<StaffMember[]>([]);
  const [kandidatStaff, setKandidatStaff] = useState<EligibleStaffUser[]>([]);
  const [selectedStaffNbm, setSelectedStaffNbm] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [selectedType, setSelectedType] = useState("medsos");
  const [err, setErr] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [removingStaffId, setRemovingStaffId] = useState<number | null>(null);

  const loadStaff = useCallback(async () => {
    const res = await getDaftarStaff(picNbm);
    setListStaff(res);
    setIsLoading(false);
  }, [picNbm]);

  const loadKandidatStaff = useCallback(() => {
    getKandidatStaff().then(res => setKandidatStaff(res));
  }, []);
  
  useEffect(() => {
    let isActive = true;

    Promise.all([getDaftarStaff(picNbm), getKandidatStaff()]).then(([staff, kandidat]) => {
      if (!isActive) return;
      setListStaff(staff);
      setKandidatStaff(kandidat);
      setIsLoading(false);
    });

    return () => { isActive = false; };
  }, [picNbm]);

  const pilihanStaff = useMemo(() => {
    const existingStaff = new Set(listStaff.map((staff) => staff.user_identifier));

    return kandidatStaff.filter((user) => (
      user.nbm !== picNbm &&
      !existingStaff.has(user.nbm) &&
      !existingStaff.has(user.email || "")
    ));
  }, [kandidatStaff, listStaff, picNbm]);

  const filteredStaff = useMemo(() => {
    const query = staffSearch.trim().toLowerCase();
    const staff = query
      ? pilihanStaff.filter((user) => (
          user.nbm.toLowerCase().includes(query) ||
          (user.name || "").toLowerCase().includes(query) ||
          (user.email || "").toLowerCase().includes(query)
        ))
      : pilihanStaff;

    return staff.slice(0, 8);
  }, [pilihanStaff, staffSearch]);

  const selectedStaff = pilihanStaff.find((user) => user.nbm === selectedStaffNbm);

  const scopeLabels: Record<string, string> = {
    medsos: "Media Sosial",
    subdomain: "Subdomain & Email",
    domain: "Domain Mandiri",
    akun: "Sistem & Infra",
    all: "Akses Penuh",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setErr("");

    if (!selectedStaff) {
      setErr("Cari lalu pilih staf dari daftar user yang sudah login SSO dan memiliki NBM.");
      return;
    }

    const res = await tambahAnggotaStaff(picNbm, selectedStaff.nbm, selectedType);
    if (res.success) { 
      setSelectedStaffNbm("");
      setStaffSearch("");
      loadStaff(); 
      loadKandidatStaff();
    } else { 
      setErr(res.message || "Gagal menambahkan anggota tim"); 
    }
  };

  return (
    <section className="ui-team-page">
      <div className="ui-team-heading">
        <div className="ui-team-heading-copy">
          <span className="ui-team-heading-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87m-2-11.96a4 4 0 0 1 0 7.75" /></svg>
          </span>
          <div>
            <h2>Delegasi hak akses staf</h2>
            <p>Atur anggota tim dan ruang lingkup aksesnya.</p>
          </div>
        </div>
        <span className="ui-count">{listStaff.length} staf</span>
      </div>

      <form onSubmit={handleSubmit} className="ui-team-form">
        <div className="ui-team-search">
          <label htmlFor="team-staff-search">Staf dari SSO yang memiliki NBM</label>
          <input
            id="team-staff-search"
            type="search"
            value={staffSearch}
            onChange={(e) => {
              setStaffSearch(e.target.value);
              setSelectedStaffNbm("");
            }}
            placeholder={pilihanStaff.length > 0 ? "Cari nama, NBM, atau email staf..." : "Belum ada kandidat staf valid"}
            disabled={pilihanStaff.length === 0}
            className="ui-team-control"
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="team-staff-options"
            aria-expanded={Boolean(staffSearch && !selectedStaff)}
          />
          {staffSearch && !selectedStaff && (
            <div id="team-staff-options" role="listbox" className="ui-team-options">
              {filteredStaff.length === 0 ? (
                <p className="ui-team-option-empty">Tidak ada user SSO ber-NBM yang cocok.</p>
              ) : (
                filteredStaff.map((user) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={false}
                    key={user.nbm}
                    onClick={() => {
                      setSelectedStaffNbm(user.nbm);
                      setStaffSearch(`${user.name || "User SSO"} - NBM ${user.nbm}${user.email ? ` - ${user.email}` : ""}`);
                    }}
                    className="ui-team-option"
                  >
                    <span>{user.name || "User SSO"}</span>
                    <small>NBM {user.nbm}{user.email ? ` · ${user.email}` : ""}</small>
                  </button>
                ))
              )}
            </div>
          )}
          <p className="ui-team-help">
            Hanya user yang sudah pernah login SSO dan memiliki NBM yang dapat diundang.
          </p>
        </div>
        <div className="ui-team-scope">
          <label htmlFor="team-scope">Otoritas akses bagian</label>
          <select id="team-scope" value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="ui-team-control">
            <option value="medsos">Khusus Media Sosial</option>
            <option value="subdomain">Khusus Subdomain & Email Pusat</option>
            <option value="domain">Khusus Domain Mandiri</option>
            <option value="akun">Khusus Akun Sistem & Infra</option>
            <option value="all">Akses Penuh Seluruh Bagian (All)</option>
          </select>
        </div>
        <button type="submit" disabled={!selectedStaff} className="ui-button ui-button-primary ui-team-submit">
          Tambah staf
        </button>
      </form>
      {err && <p className="ui-team-error" role="alert">{err}</p>}

      <div className="ui-team-list">
        <table className="ui-team-table">
          <thead>
            <tr>
              <th>Nama staf</th>
              <th className="team-identifier-column">Identifier</th>
              <th className="team-scope-column">Scope otoritas</th>
              <th className="team-action-column">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} className="ui-team-state">Memuat data staf...</td></tr>
            ) : listStaff.length === 0 ? (
              <tr>
                <td colSpan={4} className="ui-team-state">
                  <span className="ui-team-empty-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 5v14m7-7H5" /></svg>
                  </span>
                  <strong>Belum ada staf yang didelegasikan</strong>
                  <small>Gunakan pencarian di atas untuk menambahkan anggota tim.</small>
                </td>
              </tr>
            ) : (
              listStaff.map(staf => (
                <tr key={staf.id}>
                  <td>
                    <strong className="ui-team-name">{staf.staff_name || "Anggota Tim"}</strong>
                    <span className="ui-team-mobile-meta">{staf.user_identifier} · {scopeLabels[staf.allowed_type] || staf.allowed_type}</span>
                  </td>
                  <td className="team-identifier-column"><span className="ui-team-identifier">{staf.user_identifier}</span></td>
                  <td className="team-scope-column"><span className="ui-team-badge">{scopeLabels[staf.allowed_type] || staf.allowed_type}</span></td>
                  <td className="team-action-column">
                    <button
                      type="button"
                      disabled={removingStaffId === staf.id}
                      onClick={async () => {
                        setErr("");
                        setRemovingStaffId(staf.id);
                        const res = await hapusAnggotaStaff(staf.id);
                        if (!res.success) setErr(res.message || "Gagal mencabut akses staf.");
                        await loadStaff();
                        setRemovingStaffId(null);
                      }}
                      className="asset-action-button asset-action-delete"
                      title="Cabut otoritas"
                      aria-label={`Cabut otoritas ${staf.staff_name || "anggota tim"}`}
                    >
                      {removingStaffId === staf.id ? <span className="ui-team-spinner" /> : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.87 12.14A2 2 0 0 1 16.14 21H7.86a2 2 0 0 1-2-1.86L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" /></svg>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
