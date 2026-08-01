import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

// Komponen Modular
import NbmWarning from "../admin/_components/NbmWarning";
import DashboardProfile from "./_components/DashboardProfile";
import SidebarPemohon from "./_components/SidebarPemohon";
import HeaderPemohon from "./_components/HeaderPemohon";
import AsetTable from "./_components/AsetTable";
import FormKelolaTim from "./_components/FormKelolaTim"; // ✅ Impor Modul Kelola Tim

// Import 4 Form
import FormPengajuanLayanan from "./_components/FormPengajuanLayanan";
import FormPendataanMedsos from "./_components/FormPendataanMedsos";
import FormPendataanDomain from "./_components/FormPendataanDomain";
import FormPendataanAkun from "./_components/FormPendataanAkun";
import type { Aset, PicInfo, StaffCheck } from "@/types/diasmu";

// Import Server Actions Modular Terenkripsi
import { checkStatusStaff } from "./actions/staffActions"; // ✅ Jalur Deteksi Staf Baru
import { apiUrl, authHeaders, auditLog, jsonAuthHeaders } from "@/lib/security";

export const runtime = "edge";

type Props = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function PengajuanPage(props: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const searchParams = await props.searchParams;
  const activeTab = searchParams?.tab || "profil";
  const referenceDate = new Date().toISOString().slice(0, 10);

  const userNbm = session.user?.nbm as string;
  const userName = session.user?.name as string;
  const userEmail = session.user?.email as string;
  const userImage = session.user?.image as string;
  const userPhone = session.user?.phone || session.user?.nomor_wa || "";

  // FETCH DATA: CEK STATUS PIC, STAF, & ASET
  let picInfo: PicInfo = { isRegistered: false, status: null, data: null };
  let asetHandled: Aset[] = [];

  // ✅ AMBIL STATUS OTORITAS PERAN (PIC UTAMA ATAU SUB-STAF TIM)
  const staffCheck: StaffCheck = await checkStatusStaff(userNbm || userEmail);
  const allowedType = staffCheck.allowedType; 
  const canAccessType = (type: string) => allowedType === "all" || allowedType === type;

  const identifier = userNbm || userEmail;

  if (identifier) {
    try {
      // ✅ BUNGKUS IDENTIFIER AGAR KARAKTER EMAIL (@) AMAN DI URL
      const encodedId = encodeURIComponent(identifier);
      
      // Get data aset terproteksi token rahasia internal
      const resAset = await fetch(apiUrl(`/api/aset/pic/${encodedId}`), { 
        cache: "no-store",
        headers: authHeaders()
      });
      if (resAset.ok) asetHandled = await resAset.json();
      
      if (userNbm) {
        const encodedNbm = encodeURIComponent(userNbm);
        const resPic = await fetch(apiUrl(`/api/check-pic/${encodedNbm}`), { 
          cache: "no-store",
          headers: authHeaders()
        });
        if (resPic.ok) picInfo = await resPic.json();
      }
    } catch (error) { console.error("Gagal fetch data:", error); }
  }

  // Akun staf otomatis ter-approve mengikuti pintu gerbang PIC Utama (bosnya)
  const isApproved = picInfo.status === 'approved' || staffCheck.isStaff;

  // Penentuan Judul Header Sesuai Tab (Adaptif untuk owner maupun staf)
  let headerTitle = "Pendaftaran Pemohon";
  if (activeTab === 'aset') headerTitle = "Aset Digital Terdaftar";
  else if (activeTab === 'tim') headerTitle = "Kelola Anggota Tim Kerja"; 
  else if (isApproved) {
    if (activeTab === 'add-layanan') headerTitle = "Pengajuan Subdomain & Email";
    else if (activeTab === 'add-medsos') headerTitle = "Pendataan Akun Medsos";
    else if (activeTab === 'add-domain') headerTitle = "Pendataan Domain Mandiri";
    else if (activeTab === 'add-akun') headerTitle = "Pendataan Akun Sistem & Infra";
    else headerTitle = "Profil PIC";
  } else if (picInfo.status === 'pending') {
    headerTitle = "Status Pendaftaran";
  }

  // SERVER ACTION: PENDAFTARAN PIC BARU
  async function submitPicRegistration(formData: FormData) {
    "use server";
    const institution = formData.get("institution") as string;
    const emailInstansi = formData.get("emailInstansi") as string;
    const catatan = formData.get("catatan") as string;
    const emailToSave = userEmail || formData.get("email") as string;
    const phoneToSave = userPhone || formData.get("phone") as string;
    const fileTugas = formData.get("suratTugas") as File;
    const filePermohonan = formData.get("suratPermohonan") as File;

    let suratTugasName = ""; let suratPermohonanName = "";
    try {
      if (fileTugas && fileTugas.size > 0) {
        const up1 = new FormData(); up1.append("document", fileTugas);
        const r1 = await fetch(apiUrl("/api/upload"), { 
          method: "POST", body: up1, headers: authHeaders()
        });
        if (r1.ok) suratTugasName = (await r1.json()).filename;
      }
      if (filePermohonan && filePermohonan.size > 0) {
        const up2 = new FormData(); up2.append("document", filePermohonan);
        const r2 = await fetch(apiUrl("/api/upload"), { 
          method: "POST", body: up2, headers: authHeaders()
        });
        if (r2.ok) suratPermohonanName = (await r2.json()).filename;
      }
      await fetch(apiUrl("/api/pics"), {
        method: "POST", 
        headers: jsonAuthHeaders(),
        body: JSON.stringify({ nbm: userNbm, name: userName, institution, phone: phoneToSave, email: emailToSave, surat_tugas: suratTugasName, surat_permohonan: suratPermohonanName, catatan, email_instansi: emailInstansi })
      });
      await auditLog("pic.registration.submitted", { actor: userNbm || userEmail, nbm: userNbm, institution });
      revalidatePath("/pengajuan"); 
    } catch (error) { console.error(error); }
  }

  return (
    <div className="diasmu-app flex h-[100dvh] overflow-hidden">
      {/* Kirim properti allowedType, isApproved, dan userNbm ke sidebar */}
      <SidebarPemohon activeTab={activeTab} isApproved={isApproved} userNbm={userNbm} allowedType={allowedType} />

      <div className="flex h-[100dvh] min-w-0 flex-1 flex-col overflow-hidden">
        <HeaderPemohon title={headerTitle} userName={userName} userNbm={userNbm} userImage={userImage} />

        <details className="ui-mobile-nav">
          <summary>Menu pemohon <span aria-hidden="true">+</span></summary>
          <nav aria-label="Navigasi pemohon mobile">
            <Link href="?tab=profil">Profil</Link>
            <Link href="?tab=aset">Aset terdaftar</Link>
            {isApproved && allowedType === "all" && <Link href="?tab=tim">Kelola tim</Link>}
            {isApproved && canAccessType("subdomain") && <Link href="?tab=add-layanan">Subdomain & Email</Link>}
            {isApproved && canAccessType("medsos") && <Link href="?tab=add-medsos">Media sosial</Link>}
            {isApproved && canAccessType("domain") && <Link href="?tab=add-domain">Domain mandiri</Link>}
            {isApproved && canAccessType("akun") && <Link href="?tab=add-akun">Sistem & Infra</Link>}
          </nav>
        </details>

        <main className="flex-1 overflow-y-auto">
          <div className="ui-page-content">
          
          {/* ========================================== */}
          {/* LOGIKA KONDISI KHUSUS USER YANG BELUM BER-NBM */}
          {/* ========================================== */}
          {!userNbm && !staffCheck.isStaff && (
            <>
              {activeTab === 'profil' && <NbmWarning />}
              {activeTab === 'aset' && asetHandled.length > 0 && (
                <div className="max-w-5xl animate-in fade-in duration-500">
                  <AsetTable asetHandled={asetHandled} referenceDate={referenceDate} />
                </div>
              )}
            </>
          )}

          {/* Form Pendaftaran PIC Utama Pertama Kali */}
          {userNbm && !picInfo.isRegistered && !staffCheck.isStaff && (
            <section className="ui-panel mx-auto max-w-3xl p-6 md:p-8">
              <div className="mb-7 border-b border-[#e2e7ee] pb-5">
                <h2 className="text-lg font-semibold text-[#172033]">Pendaftaran Penanggung Jawab</h2>
                <p className="mt-1 text-xs text-[#667085]">Lengkapi data dan berkas resmi untuk membuka modul pengajuan.</p>
              </div>
              <form action={submitPicRegistration} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nama</label><input type="text" value={userName} disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600" /></div>
                  <div><label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">NBM</label><input type="text" value={userNbm} disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Nama Instansi / Unit Kerja *</label><input type="text" name="institution" required className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold" /></div>
                  <div><label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Email Instansi Resmi *</label><input type="email" name="emailInstansi" required className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold" /></div>
                </div>
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Surat Tugas *</label><input type="file" name="suratTugas" accept=".pdf,.png,.jpg,.jpeg" required className="w-full text-sm border bg-white rounded-xl file:bg-[#004282] file:text-white file:border-0 file:py-2 file:px-4 file:rounded-xl" /></div>
                  <div><label className="block text-[10px] font-black text-slate-700 uppercase tracking-widest mb-1.5">Surat Permohonan *</label><input type="file" name="suratPermohonan" accept=".pdf,.png,.jpg,.jpeg" required className="w-full text-sm border bg-white rounded-xl file:bg-[#004282] file:text-white file:border-0 file:py-2 file:px-4 file:rounded-xl" /></div>
                </div>
                <button type="submit" className="ui-button ui-button-primary w-full">Kirim Berkas Pendaftaran</button>
              </form>
            </section>
          )}

          {userNbm && picInfo.isRegistered && picInfo.status === 'pending' && (
            <div className="ui-panel mx-auto mt-10 max-w-2xl border-amber-200 bg-[#fff3df] p-8 text-center">
              <h3 className="text-base font-semibold text-[#8a4b08]">Pendaftaran sedang ditinjau</h3>
            </div>
          )}

          {/* KONTEN UTAMA ADAPTIF USER APPROVED / STRUKTUR TIM STAF */}
          {isApproved && (
            <div className="w-full min-w-0 animate-in fade-in duration-300">
              
              {activeTab === 'profil' && userNbm && !staffCheck.isStaff && (
                <div className="max-w-2xl">
                  <DashboardProfile 
                    userName={userName} 
                    userNbm={userNbm} 
                    institution={picInfo.data?.institution || ""} 
                    emailInstansi={picInfo.data?.email_instansi || ""} 
                    suratTugas={picInfo.data?.surat_tugas || ""}
                    suratPermohonan={picInfo.data?.surat_permohonan || ""}
                  />
                </div>
              )}

              {activeTab === 'profil' && !userNbm && staffCheck.isStaff && (
                <div className="w-full min-w-0"><AsetTable asetHandled={asetHandled} referenceDate={referenceDate} /></div>
              )}

              {activeTab === 'aset' && (
                <div className="w-full min-w-0"><AsetTable asetHandled={asetHandled} referenceDate={referenceDate} /></div>
              )}

              {/* ✅ STRUKTUR MODUL BARU: KELOLA ANGGOTA TIM KERJA */}
              {activeTab === 'tim' && userNbm && !staffCheck.isStaff && (
                <div className="w-full max-w-[1180px]"><FormKelolaTim picNbm={userNbm} /></div>
              )}

              {activeTab === 'add-layanan' && canAccessType("subdomain") && (
                <div className="max-w-3xl"><FormPengajuanLayanan userNbm={identifier} institution={picInfo.data?.institution || "Instansi Tim"} /></div>
              )}

              {activeTab === 'add-medsos' && canAccessType("medsos") && (
                <div className="max-w-3xl"><FormPendataanMedsos userNbm={identifier} institution={picInfo.data?.institution || "Instansi Tim"} /></div>
              )}

              {activeTab === 'add-domain' && canAccessType("domain") && (
                <div className="max-w-3xl"><FormPendataanDomain userNbm={identifier} institution={picInfo.data?.institution || "Instansi Tim"} /></div>
              )}

              {activeTab === 'add-akun' && canAccessType("akun") && (
                <div className="max-w-3xl"><FormPendataanAkun userNbm={identifier} institution={picInfo.data?.institution || "Instansi Tim"} /></div>
              )}

              {["tim", "add-layanan", "add-medsos", "add-domain", "add-akun"].includes(activeTab) && (
                (activeTab === "tim" && staffCheck.isStaff) ||
                (activeTab === "add-layanan" && !canAccessType("subdomain")) ||
                (activeTab === "add-medsos" && !canAccessType("medsos")) ||
                (activeTab === "add-domain" && !canAccessType("domain")) ||
                (activeTab === "add-akun" && !canAccessType("akun"))
              ) && (
                <div className="max-w-2xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
                  <h3 className="text-lg font-black uppercase italic text-amber-800">Akses Modul Dibatasi</h3>
                  <p className="mt-2 text-sm font-semibold leading-7 text-amber-700">Akun Anda tidak memiliki otoritas untuk membuka modul ini. Silakan hubungi PIC utama atau admin jika perlu perluasan akses.</p>
                </div>
              )}

            </div>
          )}

          </div>
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
