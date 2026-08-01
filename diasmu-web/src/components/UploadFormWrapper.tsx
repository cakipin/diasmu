"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UploadFormWrapperProps extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'action'> {
  serverAction: (payload: any) => Promise<any>;
  children: React.ReactNode;
}

export default function UploadFormWrapper({ serverAction, children, className, ...props }: UploadFormWrapperProps) {
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
        formData.set("suratTugasName", json.filename);
        formData.delete("suratTugas"); // Sangat penting: hapus file agar tidak dikirim ke Server Action
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
        formData.set("suratPermohonanName", json.filename);
        formData.delete("suratPermohonan"); // Hapus file
      }

      // Konversi FormData ke plain object JSON agar Next.js tidak mengirimnya
      // sebagai multipart/form-data ke Server Action (karena parser Edge runtime crash)
      const payload: Record<string, any> = {};
      formData.forEach((value, key) => {
        payload[key] = value;
      });

      // Jalankan Server Action dengan JSON payload murni
      const result: any = await serverAction(payload);

      if (result && result.success === false) {
        throw new Error(result.error || "Server Action gagal secara internal");
      }

      // Selesai
      form.reset();
      router.refresh();
      alert("Berhasil!");
    } catch (err: any) {
      console.error(err);
      alert("Gagal saat upload file: " + (err?.message || err));
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
