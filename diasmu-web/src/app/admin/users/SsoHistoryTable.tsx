"use client";

import { useMemo, useState } from "react";
import type { SsoUser } from "@/types/diasmu";

const PAGE_SIZE = 8;

export default function SsoHistoryTable({ users }: { users: SsoUser[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visibleUsers = useMemo(
    () => users.slice(startIndex, startIndex + PAGE_SIZE),
    [users, startIndex]
  );

  const firstRow = users.length === 0 ? 0 : startIndex + 1;
  const lastRow = Math.min(startIndex + PAGE_SIZE, users.length);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-200">
            <tr>
              <th className="px-8 py-5">Nama Lengkap &amp; Email</th>
              <th className="px-8 py-5">Nomor NBM</th>
              <th className="px-8 py-5 text-center">Status NBM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {visibleUsers.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-8 py-10 text-center text-slate-400 font-bold uppercase text-xs">
                  Belum ada data riwayat login.
                </td>
              </tr>
            ) : (
              visibleUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-4">
                    <p className="font-bold text-slate-800 text-base">{user.name}</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">{user.email}</p>
                  </td>
                  <td className="px-8 py-4 font-black text-[#004282] text-base tracking-tight">
                    {user.nbm ? user.nbm : <span className="text-slate-300 font-medium text-xs italic">Kosong</span>}
                  </td>
                  <td className="px-8 py-4 text-center">
                    {user.nbm?.trim() ? (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Terverifikasi</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Belum Ada
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {users.length > PAGE_SIZE && (
        <div className="ui-pagination">
          <p>Menampilkan {firstRow}–{lastRow} dari {users.length} akun</p>
          <nav aria-label="Pagination riwayat login SSO">
            <button
              type="button"
              aria-label="Halaman sebelumnya"
              disabled={safePage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="m15 18-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                aria-label={`Halaman ${page}`}
                aria-current={page === safePage ? "page" : undefined}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              aria-label="Halaman berikutnya"
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="m9 18 6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
