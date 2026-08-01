import Link from "next/link";
import { apiUrl, authHeaders } from "@/lib/security";

const mobileLinks = [
  ["Daftar Aset", "/admin"],
  ["Input Aset", "/admin/tambah"],
  ["Akses", "/admin/users"],
  ["Developer", "/admin/developer"],
];

export default async function Header() {
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  const today = new Date().toLocaleDateString("id-ID", dateOptions);
  let pendingPicCount = 0;

  try {
    const response = await fetch(apiUrl("/api/pics"), {
      cache: "no-store",
      headers: authHeaders(),
    });

    if (response.ok) {
      const pics = await response.json() as Array<{ status?: string }>;
      pendingPicCount = pics.filter((pic) => pic.status?.toLowerCase() === "pending").length;
    }
  } catch (error) {
    console.error("Gagal memuat notifikasi pendaftaran PIC:", error);
  }

  return (
    <>
      <header className="ui-topbar">
        <div>
          <h1>Pusat Kendali Aset</h1>
          <p>{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users#pic-management"
            className={`ui-admin-notification ${pendingPicCount > 0 ? "has-notification" : ""}`}
            aria-label={pendingPicCount > 0 ? `${pendingPicCount} pendaftaran PIC menunggu ditinjau` : "Tidak ada pendaftaran PIC baru"}
            title={pendingPicCount > 0 ? `${pendingPicCount} pendaftaran PIC menunggu ditinjau` : "Tidak ada pendaftaran PIC baru"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4" />
            </svg>
            {pendingPicCount > 0 && <span>{pendingPicCount > 99 ? "99+" : pendingPicCount}</span>}
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-[#eaf2ff] text-[#1265e5]" aria-hidden="true">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </span>
            <span>
              <strong className="block text-[11px] font-semibold text-[#172033]">Administrator</strong>
              <small className="text-[10px] text-[#667085]">Akses penuh</small>
            </span>
          </div>
        </div>
      </header>
      <details className="ui-mobile-nav">
        <summary>
          Menu admin
          <span className="flex items-center gap-2">
            {pendingPicCount > 0 && <span className="ui-mobile-notification-count">{pendingPicCount} PIC baru</span>}
            <span aria-hidden="true">+</span>
          </span>
        </summary>
        <nav aria-label="Navigasi admin mobile">
          {mobileLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
          <Link href="/pengajuan">Mode Pemohon</Link>
        </nav>
      </details>
    </>
  );
}
