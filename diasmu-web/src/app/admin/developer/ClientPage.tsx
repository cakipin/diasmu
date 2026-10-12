"use client";

import { useState } from "react";
import { createClientAction, deleteClientAction, updateClientAction } from "./actions";

type OAuthClient = {
  id: number;
  app_name: string;
  client_id: string;
  client_secret: string;
  redirect_uris: string;
  allow_localhost: boolean | number;
  environment?: "all" | "production" | "staging" | string;
  created_by: string;
  created_at: string;
};

// Helper untuk mendeteksi status environment
function getClientEnvironment(client: OAuthClient): "all" | "staging" | "production" {
  if (client.environment === "all") return "all";
  if (client.environment === "staging") return "staging";
  if (client.environment === "production") return "production";
  const uris = (client.redirect_uris || "").toLowerCase();
  const hasStaging = uris.includes("staging") || uris.includes("dev") || uris.includes(".pages.dev");
  const hasProd = uris.includes(".or.id") || uris.includes(".id") || uris.includes("prod");
  if (hasStaging && hasProd) return "all";
  if (hasStaging) return "staging";
  return "production";
}

// Helper untuk mengekstrak URI Prod dan Staging secara cerdas
function parseRedirectUris(urisString: string) {
  const list = (urisString || "")
    .split(",")
    .map(u => u.trim())
    .filter(Boolean);

  let prod = "";
  let staging = "";

  for (const uri of list) {
    const lower = uri.toLowerCase();
    if (lower.includes("staging") || lower.includes("dev") || lower.includes(".pages.dev") || lower.includes("preview")) {
      if (!staging) staging = uri;
      else staging += `, ${uri}`;
    } else {
      if (!prod) prod = uri;
      else prod += `, ${uri}`;
    }
  }

  return { prod, staging, rawList: list };
}

// Ikon Copy SVG
function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

// Ikon Check SVG
function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

// Komponen Tombol Copy
function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy ${label}`}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
        copied
          ? "bg-green-100 text-green-700"
          : "bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600"
      }`}
    >
      {copied ? <><CheckIcon /> Copied!</> : <><CopyIcon /> Copy {label}</>}
    </button>
  );
}

export default function ClientPage({ initialClients, userEmail }: { initialClients: OAuthClient[]; userEmail: string }) {
  const [appName, setAppName] = useState("");
  const [prodRedirect, setProdRedirect] = useState("");
  const [stagingRedirect, setStagingRedirect] = useState("");
  const [allowLocalhost, setAllowLocalhost] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{ client_id: string; client_secret: string } | null>(null);

  // State untuk Edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editProdRedirect, setEditProdRedirect] = useState("");
  const [editStagingRedirect, setEditStagingRedirect] = useState("");
  const [editAllowLocalhost, setEditAllowLocalhost] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State untuk In-System Feedback & Confirmation Modal (Rule 16)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setFeedback(null);

    // Kumpulkan callback URIs dari input Prod dan Staging
    const parts = [prodRedirect.trim(), stagingRedirect.trim()].filter(Boolean);
    const combinedUris = parts.join(", ");

    if (!combinedUris) {
      setIsCreating(false);
      setFeedback({ type: "error", message: "Minimal salah satu Callback Redirect URI (Prod atau Staging) wajib diisi." });
      return;
    }

    try {
      const result = await createClientAction(appName, combinedUris, allowLocalhost, userEmail, "all");
      if (result.success) {
        setNewCredentials({
          client_id: result.data.client_id,
          client_secret: result.data.client_secret,
        });
        setAppName("");
        setProdRedirect("");
        setStagingRedirect("");
        setAllowLocalhost(false);
        setFeedback({ type: "success", message: "Kredensial aplikasi berhasil dibuat!" });
      } else {
        setFeedback({ type: "error", message: result.message || result.error || "Gagal membuat kredensial." });
      }
    } catch (e) {
      console.error(e);
      setFeedback({ type: "error", message: "Terjadi kesalahan sistem saat menghubungi server." });
    } finally {
      setIsCreating(false);
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteClientAction(deleteConfirmId);
      setFeedback({ type: "success", message: "Akses kredensial berhasil dicabut." });
    } catch (e) {
      console.error(e);
      setFeedback({ type: "error", message: "Gagal mencabut akses kredensial." });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const startEdit = (client: OAuthClient) => {
    const parsed = parseRedirectUris(client.redirect_uris || "");
    setEditingId(client.id);
    setEditName(client.app_name);
    setEditProdRedirect(parsed.prod);
    setEditStagingRedirect(parsed.staging);
    setEditAllowLocalhost(Boolean(client.allow_localhost));
    setFeedback(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditProdRedirect("");
    setEditStagingRedirect("");
  };

  const handleUpdate = async (id: number) => {
    setIsSaving(true);
    setFeedback(null);

    const parts = [editProdRedirect.trim(), editStagingRedirect.trim()].filter(Boolean);
    const combinedUris = parts.join(", ");

    if (!combinedUris) {
      setIsSaving(false);
      setFeedback({ type: "error", message: "Minimal salah satu Callback Redirect URI (Prod atau Staging) wajib diisi." });
      return;
    }

    try {
      const result = await updateClientAction(id, editName, combinedUris, editAllowLocalhost, "all");
      if (result.success) {
        setEditingId(null);
        setFeedback({ type: "success", message: "Kredensial berhasil diperbarui." });
      } else {
        setFeedback({ type: "error", message: result.message || result.error || "Gagal memperbarui kredensial." });
      }
    } catch (e) {
      console.error(e);
      setFeedback({ type: "error", message: "Terjadi kesalahan sistem saat menyimpan." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="ui-developer-page mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-[#003870] italic">PENGATURAN DEVELOPER</h1>
          <p className="text-slate-500 font-medium mt-1">Kelola kredensial SSO (Client ID &amp; Secret) untuk aplikasi Production &amp; Staging.</p>
        </div>
      </div>

      {/* FEEDBACK BANNER (RULE 16: PENGGANTI ALERT) */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-xs font-bold animate-in fade-in duration-300 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedback.type === "success" ? "✅" : "⚠️"}</span>
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* BANNER KREDENSIAL BARU */}

      {newCredentials && (
        <div className="bg-green-50 border border-green-200 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-green-500"></div>
          <h2 className="text-xl font-bold text-green-800 mb-2">🎉 Kredensial Berhasil Dibuat!</h2>
          <p className="text-sm text-green-700 mb-4">Simpan Client Secret ini baik-baik. Ini adalah satu-satunya saat Anda dapat melihatnya secara utuh.</p>
          <div className="bg-white rounded-xl p-4 border border-green-100 shadow-inner font-mono text-sm space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <span className="font-bold text-slate-500">Client ID: </span>
                <span className="font-bold text-slate-800 break-all">{newCredentials.client_id}</span>
              </div>
              <CopyButton text={newCredentials.client_id} label="ID" />
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="min-w-0">
                <span className="font-bold text-slate-500">Client Secret: </span>
                <span className="font-bold text-slate-800 break-all">{newCredentials.client_secret}</span>
              </div>
              <CopyButton text={newCredentials.client_secret} label="Secret" />
            </div>
          </div>
          <button type="button" onClick={() => setNewCredentials(null)} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition">Tutup Peringatan</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORM BUAT BARU */}
        <div className="lg:col-span-1">
          <form onSubmit={handleCreate} className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl shadow-blue-900/5 border border-slate-100 sticky top-8">
            <h2 className="text-xl font-black italic tracking-tight text-slate-800 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              BUAT KREDENSIAL BARU
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nama Aplikasi</label>
                <input 
                  type="text" 
                  required
                  value={appName}
                  onChange={e => setAppName(e.target.value)}
                  placeholder="Misal: Portal PWM" 
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm font-semibold text-slate-800" 
                />
              </div>
              
              {/* INPUT CALLBACK PRODUCTION */}
              <div>
                <label className="block text-xs font-bold text-emerald-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Callback URL Production
                </label>
                <input 
                  type="url"
                  value={prodRedirect}
                  onChange={e => setProdRedirect(e.target.value)}
                  placeholder="https://app.muhammadiyah.or.id/callback" 
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-emerald-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-xs font-mono text-slate-800" 
                />
              </div>

              {/* INPUT CALLBACK STAGING */}
              <div>
                <label className="block text-xs font-bold text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Callback URL Staging
                </label>
                <input 
                  type="url"
                  value={stagingRedirect}
                  onChange={e => setStagingRedirect(e.target.value)}
                  placeholder="https://staging.app.pages.dev/callback" 
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-amber-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all text-xs font-mono text-slate-800" 
                />
                <p className="text-[10px] text-slate-400 mt-1">1 Kredensial (Key &amp; Secret) akan otomatis mengenali kedua callback ini.</p>
              </div>

              <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <button
                  type="button"
                  onClick={() => setAllowLocalhost(!allowLocalhost)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${allowLocalhost ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${allowLocalhost ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <div>
                  <p className="text-xs font-bold text-slate-700">Izinkan Localhost</p>
                  <p className="text-[10px] text-slate-500">Bolehkan redirect ke http://localhost (Development)</p>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isCreating}
                className="w-full py-4 px-6 bg-[#004282] hover:bg-[#003366] text-white rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCreating ? "Menyimpan..." : "Generate Keys"}
              </button>
            </div>
          </form>
        </div>

        {/* DAFTAR APLIKASI */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-xl shadow-blue-900/5 border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-black italic tracking-tight text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                APLIKASI TERDAFTAR ({initialClients.length})
              </h2>
            </div>

            {initialClients.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold">Belum ada kredensial aplikasi yang dibuat.</div>
            ) : (
              <div className="space-y-4">
                {initialClients.map((client) => {
                  const clientEnv = getClientEnvironment(client);
                  const isLocalhost = Boolean(client.allow_localhost);

                  return (
                    <div key={client.id} className="p-5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5 transition-all bg-slate-50/50">
                      
                      {editingId === client.id ? (
                        /* === MODE EDIT === */
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Aplikasi</label>
                            <input
                              type="text"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm font-semibold text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Callback URL Production
                            </label>
                            <input
                              type="url"
                              value={editProdRedirect}
                              onChange={e => setEditProdRedirect(e.target.value)}
                              placeholder="https://app.muhammadiyah.or.id/callback"
                              className="w-full px-3 py-2 rounded-lg bg-white border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs font-mono text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Callback URL Staging
                            </label>
                            <input
                              type="url"
                              value={editStagingRedirect}
                              onChange={e => setEditStagingRedirect(e.target.value)}
                              placeholder="https://staging.app.pages.dev/callback"
                              className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-xs font-mono text-slate-800"
                            />
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setEditAllowLocalhost(!editAllowLocalhost)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${editAllowLocalhost ? 'bg-blue-600' : 'bg-slate-300'}`}
                            >
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${editAllowLocalhost ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                            <p className="text-xs font-bold text-slate-600">Izinkan Localhost</p>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdate(client.id)}
                              disabled={isSaving}
                              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
                            >
                              {isSaving ? "Menyimpan..." : "Simpan"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* === MODE TAMPIL === */
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-slate-800 text-lg">{client.app_name}</h3>
                              
                              {isLocalhost ? (
                                <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold uppercase rounded border border-blue-200">
                                  Localhost Allowed
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-3 space-y-2">
                              {/* Client ID + Copy */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs font-mono text-slate-500 break-all">
                                  <span className="font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Client ID: </span>
                                  {client.client_id}
                                </p>
                                <CopyButton text={client.client_id} label="ID" />
                              </div>
                              {/* Secret (Hidden) + Copy */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs font-mono text-slate-500">
                                  <span className="font-semibold text-slate-400 uppercase tracking-widest text-[10px]">Secret: </span>
                                  •••••••••••••••••••• (Hidden)
                                </p>
                                <CopyButton text={client.client_secret} label="Secret" />
                              </div>
                            </div>

                            {/* TAMPILAN CALLBACK URL PROD & STAGING YANG JELAS */}
                            {(() => {
                              const parsed = parseRedirectUris(client.redirect_uris || "");
                              return (
                                <div className="mt-3 space-y-1.5 max-w-xl">
                                  {parsed.prod ? (
                                    <div className="flex items-center gap-2 bg-emerald-50/60 border border-emerald-100 px-3 py-1.5 rounded-xl text-xs font-mono text-emerald-900 break-all">
                                      <span className="px-1.5 py-0.5 bg-emerald-200/80 text-emerald-950 font-sans font-black text-[9px] uppercase tracking-wider rounded">PROD</span>
                                      <span className="truncate">{parsed.prod}</span>
                                    </div>
                                  ) : null}

                                  {parsed.staging ? (
                                    <div className="flex items-center gap-2 bg-amber-50/60 border border-amber-100 px-3 py-1.5 rounded-xl text-xs font-mono text-amber-900 break-all">
                                      <span className="px-1.5 py-0.5 bg-amber-200/80 text-amber-950 font-sans font-black text-[9px] uppercase tracking-wider rounded">STAGING</span>
                                      <span className="truncate">{parsed.staging}</span>
                                    </div>
                                  ) : null}

                                  {!parsed.prod && !parsed.staging && client.redirect_uris ? (
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-700 break-all">
                                      <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 font-sans font-black text-[9px] uppercase tracking-wider rounded">CALLBACK</span>
                                      <span className="truncate">{client.redirect_uris}</span>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })()}
                          </div>
                          
                          <div className="flex gap-2 shrink-0">
                            <button 
                              type="button"
                              onClick={() => startEdit(client)}
                              className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              type="button"
                              onClick={() => setDeleteConfirmId(client.id)}
                              className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl transition-colors"
                            >
                              Cabut Akses
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 🛡️ MODAL KONFIRMASI CABUT AKSES (RULE 16: PENGGANTI WINDOW.CONFIRM) */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 text-center p-8 border border-slate-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">Cabut Kredensial?</h3>
            <p className="text-xs text-slate-500 mt-2 font-medium">Aplikasi client tidak akan dapat melakukan pertukaran token OAuth lagi setelah akses dicabut.</p>
            <div className="mt-8 flex justify-center gap-3">
              <button 
                type="button" 
                onClick={() => setDeleteConfirmId(null)} 
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={executeDelete} 
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg transition-colors active:scale-95"
              >
                Ya, Cabut Akses
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

