"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  appName: string;
  clientId: string;
  redirectUri: string;
  state: string;
  userName: string;
  userEmail: string;
  userNbm: string;
  userImage?: string | null;
};

export default function AuthorizeClient({ appName, clientId, redirectUri, state, userName, userEmail, userNbm, userImage }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuthorize = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Panggil internal endpoint untuk generate authorization code
      const res = await fetch('/api/oauth/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          redirect_uri: redirectUri,
          user_email: userEmail,
          user_name: userName,
          user_nbm: userNbm
        })
      });

      const data = await res.json();

      if (data.success && data.code) {
        // Redirect ke aplikasi client dengan authorization code
        const separator = redirectUri.includes('?') ? '&' : '?';
        let targetUrl = `${redirectUri}${separator}code=${data.code}`;
        if (state) {
          targetUrl += `&state=${encodeURIComponent(state)}`;
        }
        window.location.href = targetUrl;
      } else {
        setError(data.error_description || data.error || 'Gagal membuat authorization code');
        setIsLoading(false);
      }
    } catch {
      setError('Terjadi kesalahan jaringan');
      setIsLoading(false);
    }
  };

  const handleDeny = () => {
    const separator = redirectUri.includes('?') ? '&' : '?';
    window.location.href = `${redirectUri}${separator}error=access_denied&error_description=User%20menolak%20akses`;
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center p-6">
      <div className="bg-white rounded-[14px] border border-[#e2e7ee] p-6 md:p-8 max-w-md w-full shadow-sm relative overflow-hidden">
        
        {/* Header Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-600"></div>

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#1265e5] rounded-[10px] flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-800 tracking-tight">Otorisasi Akses</h1>
          <p className="text-slate-500 text-sm mt-1">Single Sign-On</p>
        </div>

        {/* App Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
          <p className="text-sm text-slate-600 mb-1">Aplikasi</p>
          <h2 className="text-xl font-black text-[#004282]">{appName}</h2>
          <p className="text-xs text-slate-400 font-mono mt-2 break-all">{redirectUri}</p>
        </div>

        {/* User Info */}
        <div className="bg-slate-50 rounded-2xl p-5 mb-6">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-3">Login Sebagai</p>
          <div className="flex items-center gap-3">
            {userImage ? (
              <Image src={userImage} alt={userName} width={40} height={40} unoptimized className="w-10 h-10 rounded-full object-cover shadow-sm border border-emerald-200" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center font-black text-emerald-700">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-bold text-slate-800">{userName}</p>
              <p className="text-xs text-slate-500">{userEmail}</p>
              {userNbm && <p className="text-xs text-blue-600 font-bold mt-0.5">NBM: {userNbm}</p>}
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="mb-6">
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-3">Aplikasi ini akan mendapatkan akses ke:</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              Nama lengkap Anda
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              Alamat email
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              Nomor Baku Muhammadiyah (NBM)
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              Foto profil (jika tersedia)
            </li>
          </ul>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4 font-medium">
            ❌ {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDeny}
            disabled={isLoading}
            className="flex-1 py-3.5 px-6 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95"
          >
            Tolak
          </button>
          <button
            onClick={handleAuthorize}
            disabled={isLoading}
            className="flex-1 py-3.5 px-6 bg-[#004282] text-white rounded-xl font-black text-sm hover:bg-[#003366] transition-all active:scale-95 shadow-lg shadow-blue-900/30 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Mengotorisasi...
              </>
            ) : 'Izinkan Akses'}
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-400 mt-6">
          Dengan mengklik &quot;Izinkan Akses&quot;, Anda menyetujui berbagi data profil Anda dengan aplikasi <strong>{appName}</strong>.
        </p>
      </div>
    </div>
  );
}
