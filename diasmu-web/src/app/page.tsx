import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { MuhammadiyahIdentity, PublicFooter, PublicHeader } from "./_components/PublicChrome";

export const runtime = "edge";

const capabilities = [
  ["01", "Identitas terverifikasi", "Pemohon terhubung dengan Muhammadiyah ID dan NBM agar penanggung jawab dapat ditelusuri."],
  ["02", "Inventaris terpusat", "Domain, email, media sosial, dan akun infrastruktur tercatat dalam satu pusat kendali."],
  ["03", "Delegasi terkendali", "Akses kerja dapat diberikan sesuai peran tanpa memindahkan kepemilikan aset organisasi."],
];

const securityReasons = [
  ["Kepemilikan organisasi", "Aset tidak lagi bergantung pada akun pribadi pengurus dan tetap terkelola saat terjadi pergantian amanah."],
  ["Jejak pengelolaan", "Data PIC, unit kerja, kredensial, masa aktif, serta dokumen pendukung tersimpan secara terstruktur."],
  ["Keamanan berlapis", "Validasi identitas dan pembatasan hak akses membantu mengurangi risiko akses tanpa kewenangan."],
];

const regulations = [
  "Gunakan akun Muhammadiyah ID yang valid dan telah terhubung dengan NBM/e-KTAM untuk PIC utama.",
  "Siapkan identitas instansi, email resmi, surat tugas, dan surat permohonan sebelum mendaftar sebagai PIC.",
  "Setiap aset harus memiliki tujuan penggunaan yang jelas dan relevan dengan layanan atau dakwah Persyarikatan.",
  "Delegasikan akses hanya kepada anggota tim yang membutuhkan dan tinjau kembali akses secara berkala.",
];

export default async function Home() {
  const session = await auth();
  const primaryHref = session ? "/pengajuan" : "/login";
  const primaryLabel = session ? "Buka Dashboard" : "Masuk dengan SSO";

  return (
    <main className="min-h-screen overflow-x-clip bg-white text-slate-900 selection:bg-[#007a4d] selection:text-white">
      <PublicHeader actionHref={primaryHref} actionLabel={primaryLabel} />

      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-[linear-gradient(180deg,#f2f8f5_0%,#ffffff_100%)]" aria-hidden="true" />
        <div className="relative mx-auto grid min-h-[680px] max-w-[1240px] items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="max-w-2xl">
            <MuhammadiyahIdentity />
            <h1 className="mt-8 max-w-[12ch] text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-[#14213d] sm:text-6xl lg:text-[72px]">
              Amanah digital, dikelola dalam satu kendali.
            </h1>
            <p className="mt-7 max-w-[58ch] text-base leading-8 text-slate-600 sm:text-lg">
              DiasMu adalah platform inventaris dan pengendalian akses aset digital untuk unit, majelis, dan amal usaha di lingkungan Persyarikatan Muhammadiyah.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={primaryHref} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#004282] px-6 text-sm font-semibold text-white transition hover:bg-[#003566]">
                {primaryLabel}
                <svg viewBox="0 0 24 24" className="ml-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
              </Link>
              <Link href="/tutorial" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-[#004282] hover:text-[#004282]">
                Pelajari Cara Pengajuan
              </Link>
            </div>
            <p className="mt-8 flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="h-2 w-2 rounded-full bg-[#0a9b62]" aria-hidden="true" />
              Terintegrasi dengan Muhammadiyah ID · Dikembangkan oleh LabMu
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="overflow-hidden rounded-[28px] bg-[#0b2a4a] p-5 shadow-[0_28px_70px_rgba(9,35,62,0.22)] sm:p-7">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <Image src="/logo-muhammadiyah-white.png" alt="Muhammadiyah" width={225} height={52} className="h-7 w-auto" priority unoptimized />
                <span className="rounded-md bg-emerald-400/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Terkendali</span>
              </div>
              <div className="py-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Pusat Kendali Aset Digital</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">Satu catatan resmi untuk setiap aset.</h2>
                <p className="mt-4 text-sm leading-7 text-slate-300">Menjaga keberlanjutan layanan organisasi saat pengurus, tim, atau kebutuhan operasional berubah.</p>
              </div>
              <div className="grid gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-2">
                {["Domain & Email", "Media Sosial", "Sistem & Infra", "Delegasi Tim"].map((item) => (
                  <div key={item} className="flex items-center gap-3 bg-[#102f50] px-4 py-4 text-sm font-medium text-white">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#f8fafc]">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-14 sm:px-8 md:grid-cols-3">
          {capabilities.map(([number, title, text]) => (
            <div key={number} className="grid grid-cols-[40px_1fr] gap-3">
              <span className="text-sm font-semibold text-[#007a4d]">{number}</span>
              <div><h2 className="text-lg font-semibold text-[#14213d]">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section id="manfaat" className="bg-white px-5 py-24 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
            <div>
              <p className="text-sm font-semibold text-[#007a4d]">Mengapa DiasMu</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-[#14213d] sm:text-5xl">Aset digital adalah amanah organisasi.</h2>
              <p className="mt-6 text-base leading-8 text-slate-600">Pengelolaannya perlu tertib, terlacak, dan tetap berkelanjutan melampaui masa tugas perorangan.</p>
            </div>
            <div className="border-t border-slate-200">
              {securityReasons.map(([title, text], index) => (
                <div key={title} className="grid gap-3 border-b border-slate-200 py-7 sm:grid-cols-[44px_180px_1fr] sm:gap-5">
                  <span className="text-sm font-semibold text-slate-400">0{index + 1}</span>
                  <h3 className="font-semibold text-[#14213d]">{title}</h3>
                  <p className="text-sm leading-7 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0b2a4a] px-5 py-20 text-white sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-[1240px] items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold text-emerald-300">Tutorial Pengajuan</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Mulai dengan alur yang jelas.</h2>
            <p className="mt-5 max-w-lg text-base leading-8 text-slate-300">Dari menyiapkan dokumen PIC hingga memantau aset dan memberi akses kepada tim, seluruh langkah tersedia dalam panduan singkat.</p>
            <Link href="/tutorial" className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-[#0b2a4a] transition hover:bg-slate-100">Buka Tutorial Lengkap</Link>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3">
            {[["1", "Masuk & daftar", "Gunakan SSO lalu lengkapi data PIC."], ["2", "Ajukan aset", "Pilih jenis aset dan isi data yang diperlukan."], ["3", "Pantau & kelola", "Periksa status dan delegasikan akses tim."]].map(([number, title, text]) => (
              <li key={number} className="bg-[#102f50] p-6"><span className="text-2xl font-semibold text-emerald-300">{number}</span><h3 className="mt-8 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{text}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section id="regulasi" className="bg-white px-5 py-24 sm:px-8 lg:py-28">
        <div className="mx-auto max-w-[1240px]">
          <div className="max-w-2xl"><p className="text-sm font-semibold text-[#007a4d]">Tata Kelola</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-[#14213d]">Sebelum mengajukan aset.</h2><p className="mt-5 text-base leading-8 text-slate-600">Pastikan data dan dokumen dapat dipertanggungjawabkan untuk kepentingan Persyarikatan.</p></div>
          <div className="mt-12 grid gap-x-12 md:grid-cols-2">
            {regulations.map((item, index) => (
              <div key={item} className="flex gap-5 border-t border-slate-200 py-6"><span className="text-sm font-semibold text-[#007a4d]">0{index + 1}</span><p className="text-sm leading-7 text-slate-700">{item}</p></div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
