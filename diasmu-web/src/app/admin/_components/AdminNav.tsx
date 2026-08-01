"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menus = [
  { name: "Daftar Aset", href: "/admin", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
  { name: "Input Aset Baru", href: "/admin/tambah", icon: "M12 6v6m0 0v6m0-6h6m-6 0H6" },
  { name: "Manajemen Akses", href: "/admin/users", icon: "M12 4.4a4 4 0 1 1 0 5.2M15 21H3v-1a6 6 0 0 1 12 0v1m0 0h6v-1a6 6 0 0 0-9-5.2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" },
  { name: "Pengaturan Developer", href: "/admin/developer", icon: "M10 20 14 4m4 4 4 4-4 4M6 16l-4-4 4-4" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="ui-nav" aria-label="Navigasi admin">
      <p className="ui-nav-label">WORKSPACE</p>
      {menus.map((menu) => {
        const isActive = menu.href === "/admin" ? pathname === menu.href : pathname.startsWith(menu.href);

        return (
          <Link
            key={menu.href}
            href={menu.href}
            className="ui-nav-item"
            aria-current={isActive ? "page" : undefined}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d={menu.icon} />
            </svg>
            <span>{menu.name}</span>
          </Link>
        );
      })}

      <p className="ui-nav-label">AKUN</p>
      <Link href="/pengajuan" className="ui-nav-item">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.6a1 1 0 0 1 .7.3l5.4 5.4a1 1 0 0 1 .3.7V19a2 2 0 0 1-2 2Z" />
        </svg>
        <span>Mode Pemohon</span>
      </Link>
    </nav>
  );
}
