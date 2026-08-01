import { signOut } from "@/auth";
import type { Session } from "next-auth";
import AdminNav from "./AdminNav";

export default function Sidebar({ user }: { user?: Session["user"] }) {
  return (
    <aside className="ui-sidebar hidden md:flex flex-col shrink-0" aria-label="Sidebar admin">
      <div className="ui-brand">
        <span className="ui-brand-mark" aria-hidden="true">
          <span /><span /><span /><span />
        </span>
        <strong className="ui-brand-name">Dias<span>Mu</span></strong>
      </div>

      <AdminNav />

      <div className="ui-sidebar-profile">
        <div className="mb-3 flex items-center gap-3 px-2 py-1">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-[#1265e5] text-xs font-bold text-white">
            {user?.name?.charAt(0) || "A"}
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-xs font-semibold text-white">{user?.name || "Administrator"}</strong>
            <small className="mt-0.5 block truncate text-[10px] text-[#8f9eb5]">NBM {user?.nbm || "belum tersedia"}</small>
          </span>
        </div>

        <form action={async () => { "use server"; await signOut(); }}>
          <button className="ui-nav-item w-full border-0 bg-transparent text-left" type="submit">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m17 16 4-4m0 0-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" />
            </svg>
            <span>Keluar</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
