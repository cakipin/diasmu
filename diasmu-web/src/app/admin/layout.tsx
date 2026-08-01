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
    <div className="diasmu-app flex h-[100dvh] flex-col overflow-hidden md:flex-row">
      <Sidebar user={session.user} />
      <div className="flex h-[100dvh] min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="ui-page-content">{children}</div>
        </main>
        <footer className="ui-app-footer">
          <p>
            &copy; {new Date().getFullYear()} <span>DiasMu</span>. Dikembangkan oleh LabMu.
          </p>
        </footer>
      </div>
    </div>
  );
}
