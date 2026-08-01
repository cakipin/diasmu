import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "./_components/Sidebar";
import Header from "./_components/Header";
import { apiUrl, authHeaders } from "@/lib/security";

export const runtime = "edge";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const identifier = (session.user?.nbm as string) || (session.user?.email as string);
  if (!identifier) redirect("/pengajuan");

  let isAdmin = false;

  try {
    const userName = encodeURIComponent(session.user?.name || "Admin");
    const roleCheck = await fetch(apiUrl(`/api/check-admin/${identifier}?name=${userName}`), { 
      cache: "no-store",
      headers: authHeaders()
    });
      
    if (roleCheck.ok) {
      const result = await roleCheck.json();
      isAdmin = result.isAdmin;
    }
  } catch (error) { 
    console.error("Gagal verifikasi admin:", error);
  }

  // ✅ KEMBALIKAN KE FUNGSI NORMAL: Tendang user non-admin ke halaman pengajuan
  if (!isAdmin) redirect("/pengajuan");

  // JIKA BERHASIL MASUK, TAMPILKAN HALAMAN SEPERTI BIASA
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      <Sidebar user={session.user} />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
        <footer className="bg-white border-t border-gray-200 py-4 px-8 text-center md:text-left shrink-0">
          <p className="text-sm text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} <span className="text-[#004282] font-bold">DiasMu</span>. Dikembangkan oleh LabMu.
          </p>
        </footer>
      </div>
    </div>
  );
}
