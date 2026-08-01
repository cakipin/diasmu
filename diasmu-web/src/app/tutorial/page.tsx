import Link from "next/link";
import { auth } from "@/auth";
import { PublicFooter, PublicHeader } from "../_components/PublicChrome";

export const runtime = "edge";

const steps = [
  {
    title: "Masuk dengan Muhammadiyah ID",
    text: "Pilih Masuk dengan SSO. Pastikan akun Muhammadiyah ID aktif dan NBM/e-KTAM sudah terhubung untuk mendaftar sebagai PIC utama.",
    detail: "Nama dan NBM akan dibaca otomatis dari identitas SSO Anda.",
  },
  {
    title: "Daftarkan diri sebagai PIC",
    text: "Lengkapi nama instansi atau unit kerja, email instansi, surat tugas, dan surat permohonan pada halaman Pendaftaran Penanggung Jawab.",
    detail: "Dokumen yang diterima: PDF, PNG, JPG, atau JPEG.",
  },
  {
    title: "Tunggu persetujuan admin",
    text: "Setelah berkas dikirim, status pendaftaran akan tampil sebagai sedang ditinjau. Modul pengajuan terbuka setelah admin menyetujui PIC.",
    detail: "Gunakan data resmi agar proses verifikasi tidak tertunda.",
  },
  {
    title: "Pilih jenis aset digital",
    text: "Gunakan menu Tambah Aset untuk memilih Subdomain & Email, Akun Media Sosial, Domain Mandiri, atau Akun Sistem & Infrastruktur.",
    detail: "Pilih kategori yang paling sesuai agar data tersimpan dengan struktur yang tepat.",
  },
  {
    title: "Lengkapi dan kirim data aset",
    text: "Isi identitas layanan, tujuan penggunaan, masa aktif, kontak, kredensial atau data pemulihan yang diperlukan, serta lampiran pendukung bila tersedia.",
    detail: "Periksa kembali ejaan domain, alamat email, dan masa aktif sebelum mengirim.",
  },
  {
    title: "Pantau aset dan kelola tim",
    text: "Buka Aset Digital Terdaftar untuk melihat data yang telah masuk. PIC utama juga dapat mengundang staf dan membatasi otoritas akses sesuai bagian kerja.",
    detail: "Cabut akses anggota tim ketika tanggung jawabnya selesai atau berubah.",
  },
];

const assetTypes = [
  ["Subdomain & Email", "Permohonan subdomain dan alamat email resmi di lingkungan layanan Muhammadiyah."],
  ["Media Sosial", "Pendataan akun sosial resmi beserta identitas, tautan, dan informasi pemulihan."],
  ["Domain Mandiri", "Inventaris domain yang telah dimiliki unit, termasuk registrar dan masa aktif."],
  ["Sistem & Infrastruktur", "Pendataan hosting, cloud, repositori, server, panel, atau akun layanan teknis."],
];

export default async function TutorialPage() {
  const session = await auth();
  const primaryHref = session ? "/pengajuan" : "/login";
  const primaryLabel = session ? "Buka Dashboard" : "Mulai Pengajuan";

  return (
    <main className="min-h-screen bg-white text-slate-900 selection:bg-[#007a4d] selection:text-white">
      <PublicHeader actionHref={primaryHref} actionLabel={primaryLabel} />

      <section className="border-b border-slate-200 bg-[#f5f9f7] px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div><p className="text-sm font-semibold text-[#007a4d]">Panduan DiasMu</p><h1 className="mt-4 text-5xl font-semibold tracking-[-0.055em] text-[#14213d] sm:text-6xl">Tutorial pengajuan aset digital.</h1></div>
          <div className="lg:pb-2"><p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">Ikuti enam langkah berikut agar pendaftaran PIC dan pengajuan aset berjalan tertib, lengkap, dan mudah diverifikasi.</p><div className="mt-6 flex flex-wrap gap-3"><Link href={primaryHref} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#004282] px-5 text-sm font-semibold text-white">{primaryLabel}</Link><a href="#langkah" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700">Lihat Langkah</a></div></div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-5 py-12 sm:px-8">
        <div className="mx-auto grid max-w-[1240px] gap-5 md:grid-cols-3">
          {[["01", "Akun siap", "Muhammadiyah ID aktif dan NBM terhubung."], ["02", "Dokumen siap", "Surat tugas dan surat permohonan resmi."], ["03", "Data siap", "Identitas instansi dan rincian aset yang akurat."]].map(([number, title, text]) => <div key={number} className="border-l-2 border-[#007a4d] pl-5"><span className="text-xs font-semibold text-[#007a4d]">{number}</span><h2 className="mt-2 font-semibold text-[#14213d]">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div>)}
        </div>
      </section>

      <section id="langkah" className="bg-white px-5 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-[1060px]">
          <div className="max-w-xl"><p className="text-sm font-semibold text-[#007a4d]">Langkah Pengajuan</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-[#14213d]">Dari identitas hingga pengelolaan.</h2></div>
          <ol className="mt-12 border-t border-slate-200">
            {steps.map((step, index) => (
              <li key={step.title} className="grid gap-4 border-b border-slate-200 py-8 sm:grid-cols-[70px_230px_1fr] sm:gap-6">
                <span className="text-2xl font-semibold text-[#007a4d]">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="text-lg font-semibold text-[#14213d]">{step.title}</h3>
                <div><p className="text-sm leading-7 text-slate-600">{step.text}</p><p className="mt-3 text-xs font-medium leading-5 text-[#004282]">Catatan: {step.detail}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#f5f9f7] px-5 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div><p className="text-sm font-semibold text-[#007a4d]">Jenis Aset</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-[#14213d]">Pilih formulir yang tepat.</h2><p className="mt-5 text-sm leading-7 text-slate-600">Setiap kategori memiliki bidang data yang disesuaikan dengan kebutuhan pengelolaan aset tersebut.</p></div>
            <div className="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
              {assetTypes.map(([title, text]) => <div key={title} className="bg-white p-6"><svg viewBox="0 0 24 24" className="h-5 w-5 text-[#007a4d]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 7.5h16M6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11A2.5 2.5 0 0 1 6.5 4Z" /></svg><h3 className="mt-5 font-semibold text-[#14213d]">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="rounded-2xl border border-slate-200 p-7 sm:p-9"><h2 className="text-2xl font-semibold tracking-[-0.03em] text-[#14213d]">Checklist sebelum mengirim</h2><ul className="mt-6 space-y-4">{["Nama instansi dan email resmi sudah benar.", "Surat tugas dan surat permohonan dapat dibaca.", "Tujuan penggunaan aset dijelaskan dengan jelas.", "Data kontak, pemulihan, dan masa aktif telah diperiksa.", "Kredensial hanya dibagikan melalui jalur yang disediakan."].map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600"><svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-[#0a9b62]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>{item}</li>)}</ul></div>
          <div className="rounded-2xl bg-[#0b2a4a] p-7 text-white sm:p-9"><h2 className="text-2xl font-semibold tracking-[-0.03em]">Masih membutuhkan bantuan?</h2><p className="mt-4 text-sm leading-7 text-slate-300">Hubungi tim LabMu jika identitas NBM belum terbaca, dokumen gagal diunggah, atau modul pengajuan tidak sesuai kewenangan akun Anda.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><a href="mailto:labs@muhammadiyah.or.id" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-[#0b2a4a]">Email LabMu</a><a href="tel:+6281128701912" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/20 px-5 text-sm font-semibold text-white">+62 811-2870-1912</a></div></div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
