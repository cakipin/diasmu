"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UploadFormWrapperProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'action'> {
  apiEndpoint: string;
  apiPayload: Record<string, any>;
  children: React.ReactNode;
}

export default function UploadFormWrapper({ apiEndpoint, apiPayload, children, className, ...props }: UploadFormWrapperProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const fileTugas = formData.get("suratTugas") as File | null;
    const filePermohonan = formData.get("suratPermohonan") as File | null;

    try {
      if (fileTugas && fileTugas.size > 0) {
        const buffer = await fileTugas.arrayBuffer();
        const res = await fetch("/api/upload-proxy", { 
          method: "POST", 
          headers: {
            "x-file-name": encodeURIComponent(fileTugas.name),
            "x-file-type": fileTugas.type
          },
          body: buffer 
        });
        if (!res.ok) {
           const errJson = await res.json().catch(() => ({}));
           throw new Error(`Upload proxy returned ${res.status}: ${errJson.error || errJson.message || res.statusText}`);
        }
        const json = await res.json();
        formData.set("surat_tugas", json.filename);
        formData.delete("suratTugas"); // Sangat penting: hapus file agar tidak dikirim ke API
      }

      if (filePermohonan && filePermohonan.size > 0) {
        const buffer = await filePermohonan.arrayBuffer();
        const res = await fetch("/api/upload-proxy", { 
          method: "POST", 
          headers: {
            "x-file-name": encodeURIComponent(filePermohonan.name),
            "x-file-type": filePermohonan.type
          },
          body: buffer 
        });
        if (!res.ok) {
           const errJson = await res.json().catch(() => ({}));
           throw new Error(`Upload proxy returned ${res.status}: ${errJson.error || errJson.message || res.statusText}`);
        }
        const json = await res.json();
        formData.set("surat_permohonan", json.filename);
        formData.delete("suratPermohonan"); // Sangat penting: hapus file agar tidak dikirim ke API
      }
      
      // Kumpulkan data form
      const payloadData: Record<string, any> = {};
      formData.forEach((value, key) => {
        payloadData[key] = value;
      });
      
      // Gabungkan dengan base payload
      const finalDbPayload = { ...apiPayload, ...payloadData };

      // Panggil API Route standar (Bukan Server Action untuk menghindari bug Edge runtime Next.js)
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           encodedId: apiPayload.encodedId || apiPayload.userNbm, // handle both admin and dashboard cases
           dbPayload: finalDbPayload
        })
      });
      
      const result = await res.json().catch(() => ({}));

      if (!res.ok || result.success === false) {
        throw new Error(result.error || `API gagal dengan status ${res.status}`);
      }

      // Selesai
      form.reset();
      router.refresh();
      alert("Berhasil!");
    } catch (err: any) {
      console.error(err);
      alert("[V3] Gagal saat upload file: " + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className || ""}`} {...props}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl flex-col gap-2 shadow-sm border border-slate-100">
          <svg className="animate-spin w-8 h-8 text-[#004282]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span className="text-xs font-black text-[#004282] uppercase tracking-widest animate-pulse">Memproses Berkas...</span>
        </div>
      )}
    </form>
  );
}
