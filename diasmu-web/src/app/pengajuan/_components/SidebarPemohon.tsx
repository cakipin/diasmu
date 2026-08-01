import Link from "next/link";
import { signOut } from "@/auth";

interface SidebarProps {
  activeTab: string;
  isApproved: boolean;
  userNbm?: string; // ✅ Tambahan props untuk deteksi NBM
  allowedType?: string;
}

export default function SidebarPemohon({ activeTab, isApproved, userNbm, allowedType = "all" }: SidebarProps) {
  const canAccess = (type: string) => allowedType === "all" || allowedType === type;

  return (
    <aside className="ui-sidebar hidden md:flex flex-col shrink-0" aria-label="Sidebar pemohon">
      <div className="ui-brand">
        <span className="ui-brand-mark" aria-hidden="true"><span /><span /><span /><span /></span>
        <span>
          <strong className="ui-brand-name">Dias<span>Mu</span></strong>
          <small className="block text-[9px] font-medium tracking-wide text-[#8f9eb5]">Dashboard PIC</small>
        </span>
      </div>

      <nav className="ui-nav space-y-1">
        <p className="ui-nav-label">
          WORKSPACE
        </p>

        {/* KONDISI AKSES SIDEBAR BERDASARKAN STATUS NBM & APPROVAL */}
        {!userNbm ? (
          // ✅ STRUKTUR MENU BARU KHUSUS USER YANG BELUM PUNYA NBM
          <>
            <Link href="?tab=profil" className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'profil' ? 'bg-blue-800/80 shadow-inner border border-blue-700/50 text-white' : 'hover:bg-blue-800/40 text-blue-100'}`}>
              <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Selesaikan Pendaftaran
            </Link>
            <Link href="?tab=aset" className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'aset' ? 'bg-blue-800/80 shadow-inner border border-blue-700/50 text-white' : 'hover:bg-blue-800/40 text-blue-100'}`}>
              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Aset Digital Terdaftar
            </Link>
          </>
        ) : !isApproved ? (
          // User Ber-NBM tapi status approval-nya masih ditinjau
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-800/80 rounded-2xl text-sm font-bold shadow-inner border border-blue-700/50 opacity-50 cursor-not-allowed">
            <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Selesaikan Pendaftaran
          </div>
        ) : (
          // User Ber-NBM dan sudah disetujui (Approved) - Akses Penuh
          <>
            <Link href="?tab=profil" className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'profil' ? 'bg-blue-800/80 shadow-inner border border-blue-700/50 text-white' : 'hover:bg-blue-800/40 text-blue-100'}`}>
              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Profil PIC
            </Link>
            <Link href="?tab=aset" className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'aset' ? 'bg-blue-800/80 shadow-inner border border-blue-700/50 text-white' : 'hover:bg-blue-800/40 text-blue-100'}`}>
              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Aset Digital Terdaftar
            </Link>
            {allowedType === "all" && (
              <Link href="?tab=tim" className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'tim' ? 'bg-blue-800/80 shadow-inner border border-blue-700/50 text-white' : 'hover:bg-blue-800/40 text-blue-100'}`}>
                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Kelola Tim
              </Link>
            )}

            <p className="ui-nav-label border-t border-white/10 pt-5">
              TAMBAH ASET
            </p>
            {canAccess("subdomain") && (
              <Link href="?tab=add-layanan" className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'add-layanan' ? 'bg-blue-800/80 shadow-inner border border-blue-700/50 text-white' : 'hover:bg-blue-800/40 text-blue-100'}`}>
                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                Subdomain & Email
              </Link>
            )}
            {canAccess("medsos") && (
              <Link href="?tab=add-medsos" className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'add-medsos' ? 'bg-blue-800/80 shadow-inner border border-blue-700/50 text-white' : 'hover:bg-blue-800/40 text-blue-100'}`}>
                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                Akun Media Sosial
              </Link>
            )}
            {canAccess("domain") && (
              <Link href="?tab=add-domain" className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'add-domain' ? 'bg-blue-800/80 shadow-inner border border-blue-700/50 text-white' : 'hover:bg-blue-800/40 text-blue-100'}`}>
                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                Domain Mandiri
              </Link>
            )}
            {canAccess("akun") && (
              <Link href="?tab=add-akun" className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'add-akun' ? 'bg-blue-800/80 shadow-inner border border-blue-700/50 text-white' : 'hover:bg-blue-800/40 text-blue-100'}`}>
                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                Akun Sistem & Infra
              </Link>
            )}
          </>
        )}

        <div className="pt-6 mt-6 border-t border-blue-800/30">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-800/50 rounded-2xl text-xs font-bold text-blue-200 transition-all italic group">
            <svg className="w-4 h-4 opacity-40 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Masuk Ruang Admin
          </Link>
        </div>
      </nav>

      <div className="ui-sidebar-profile">
        <form action={async () => { "use server"; await signOut(); }}>
          <button className="ui-nav-item w-full border-0 bg-transparent text-left" type="submit">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Keluar
          </button>
        </form>
      </div>
    </aside>
  );
}
