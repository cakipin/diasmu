import Image from "next/image";
import Link from "next/link";

type PublicHeaderProps = {
  actionHref: string;
  actionLabel: string;
};

type KhgtCalendarDay = {
  gregorian_date: number;
  gregorian_month: number;
  gregorian_year: number;
  hijri_date: number;
};

type KhgtCalendarMonth = {
  hijri_month: string;
  hijri_month_name?: string;
  hijri_year: number;
  days: Array<KhgtCalendarDay | null>;
};

type KhgtCalendarResponse = {
  success: boolean;
  data?: KhgtCalendarMonth[];
};

const JAKARTA_TIME_ZONE = "Asia/Jakarta";

function getJakartaDate() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: JAKARTA_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const getPart = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);

  return {
    now,
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
  };
}

async function getPublicCalendarDate() {
  const jakartaDate = getJakartaDate();
  const gregorianLabel = new Intl.DateTimeFormat("id-ID", {
    timeZone: JAKARTA_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(jakartaDate.now);
  const isoDate = `${jakartaDate.year}-${String(jakartaDate.month).padStart(2, "0")}-${String(jakartaDate.day).padStart(2, "0")}`;

  try {
    const response = await fetch(`https://api-khgt.muhammadiyah.or.id/api/calendar/${jakartaDate.year}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) throw new Error("KHGT calendar unavailable");

    const calendar = (await response.json()) as KhgtCalendarResponse;
    const hijriDate = calendar.data?.flatMap((month) =>
      month.days
        .filter((day): day is KhgtCalendarDay => Boolean(day))
        .map((day) => ({
          ...day,
          hijriMonth: month.hijri_month_name || month.hijri_month,
          hijriYear: month.hijri_year,
        })),
    ).find((day) =>
      day.gregorian_year === jakartaDate.year
      && day.gregorian_month === jakartaDate.month - 1
      && day.gregorian_date === jakartaDate.day,
    );

    if (!calendar.success || !hijriDate) throw new Error("KHGT date not found");

    return {
      gregorian: `${gregorianLabel} M`,
      hijri: `${hijriDate.hijri_date} ${hijriDate.hijriMonth} ${hijriDate.hijriYear} H`,
      isoDate,
    };
  } catch {
    return {
      gregorian: `${gregorianLabel} M`,
      hijri: "Tanggal KHGT belum tersedia",
      isoDate,
    };
  }
}

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com",
    icon: (
      <path d="M7.5 2.75h9A4.75 4.75 0 0 1 21.25 7.5v9a4.75 4.75 0 0 1-4.75 4.75h-9a4.75 4.75 0 0 1-4.75-4.75v-9A4.75 4.75 0 0 1 7.5 2.75Zm9.75 2.5h.01M12 7.5A4.5 4.5 0 1 0 12 16.5 4.5 4.5 0 0 0 12 7.5Z" />
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com",
    icon: <path d="M14 21v-8h3l.5-3H14V8.5c0-.87.29-1.5 1.75-1.5H18V4.3c-.39-.05-1.73-.15-3.29-.15C11.46 4.15 9.25 6.08 9.25 8.9V10H6v3h3.25v8H14Z" />,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com",
    icon: <path d="M5.5 8.5V19m0-14.5v.01M10 19v-6.25c0-2.13 4.5-2.32 4.5.25v6m0-6.5V19M10 9v10" />,
  },
];

export async function PublicHeader({ actionHref, actionLabel }: PublicHeaderProps) {
  const calendarDate = await getPublicCalendarDate();

  return (
    <header className="sticky inset-x-0 top-0 z-[60] w-full border-b border-slate-200/80 bg-white/95 shadow-[0_1px_10px_rgba(15,23,42,0.05)] backdrop-blur">
      <div className="bg-[#007a4d] text-white">
        <div className="mx-auto flex min-h-9 max-w-[1240px] items-center px-5 py-2 text-[10px] font-medium sm:px-8 sm:text-[11px]">
          <div className="flex min-w-0 items-center gap-2.5" aria-label="Tanggal Masehi dan Hijriah KHGT hari ini">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-white/85" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 2v3M17 2v3M3.5 8.5h17M5.5 4h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
            </svg>
            <time dateTime={calendarDate.isoDate} className="whitespace-nowrap capitalize">{calendarDate.gregorian}</time>
            <span className="text-white/45" aria-hidden="true">•</span>
            <a href="https://khgt.muhammadiyah.or.id" target="_blank" rel="noreferrer" className="truncate whitespace-nowrap text-white/85 transition hover:text-white" title="Kalender Hijriah Global Tunggal Muhammadiyah">
              {calendarDate.hijri}
            </a>
          </div>
        </div>
      </div>
      <nav className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-5 sm:px-8" aria-label="Navigasi utama">
        <Link href="/" className="flex items-center gap-3" aria-label="DiasMu, beranda">
          <span className="grid h-10 w-10 grid-cols-2 gap-1 rounded-xl bg-[#0b2a4a] p-2.5" aria-hidden="true">
            <span className="rounded-[2px] border border-white" />
            <span className="rounded-[2px] border border-white" />
            <span className="rounded-[2px] border border-white" />
            <span className="rounded-[2px] border border-white" />
          </span>
          <span>
            <strong className="block text-xl font-bold tracking-[-0.04em] text-[#14213d]">Dias<span className="text-[#1265e5]">Mu</span></strong>
            <small className="block text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">Pusat Kendali Aset</small>
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          <Link href="/#manfaat" className="text-sm font-medium text-slate-600 transition hover:text-[#004282]">Manfaat</Link>
          <Link href="/tutorial" className="text-sm font-medium text-slate-600 transition hover:text-[#004282]">Tutorial Pengajuan</Link>
          <Link href="/#regulasi" className="text-sm font-medium text-slate-600 transition hover:text-[#004282]">Tata Kelola</Link>
          <Link href="/#kontak" className="text-sm font-medium text-slate-600 transition hover:text-[#004282]">Kontak</Link>
        </div>

        <Link href={actionHref} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#004282] px-4 text-xs font-semibold text-white transition hover:bg-[#003566] sm:px-5 sm:text-sm">
          {actionLabel}
        </Link>
      </nav>
    </header>
  );
}

export function MuhammadiyahIdentity({ plain = false }: { plain?: boolean }) {
  return (
    <div className={plain ? "inline-flex items-center" : "inline-flex items-center rounded-xl bg-[#007a4d] px-4 py-3 shadow-sm"}>
      <Image
        src="/logo-muhammadiyah-white.png"
        alt="Muhammadiyah"
        width={225}
        height={52}
        className="h-8 w-auto"
        priority
        unoptimized
      />
    </div>
  );
}

export function PublicFooter() {
  return (
    <footer id="kontak" className="bg-[#07192e] text-white">
      <div className="border-b border-white/10 bg-[#007a4d]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-lg font-semibold">Butuh bantuan untuk pengajuan aset?</p>
            <p className="mt-1 text-sm text-white/75">Tim LabMu siap membantu unit dan amal usaha Muhammadiyah.</p>
          </div>
          <a href="mailto:labs@muhammadiyah.or.id" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-[#00613d] transition hover:bg-emerald-50">
            Hubungi Tim LabMu
          </a>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_0.8fr_0.9fr_1fr]">
        <div>
          <MuhammadiyahIdentity plain />
          <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
            DiasMu membantu Persyarikatan mencatat, mengendalikan, dan menjaga keberlanjutan aset digital secara tertib dan amanah.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Navigasi</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
            <Link href="/">Beranda</Link>
            <Link href="/tutorial">Tutorial Pengajuan</Link>
            <Link href="/#regulasi">Tata Kelola</Link>
            <Link href="/login">Masuk SSO</Link>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Ekosistem</h2>
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
            <a href="https://labs.muhammadiyah.or.id" target="_blank" rel="noreferrer">LabMu</a>
            <a href="https://muhammadiyah.id" target="_blank" rel="noreferrer">Muhammadiyah ID</a>
            <a href="https://masa.muhammadiyah.or.id" target="_blank" rel="noreferrer">MASA</a>
            <a href="https://muhammadiyah.or.id" target="_blank" rel="noreferrer">Muhammadiyah</a>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold">Kontak LabMu</h2>
          <address className="mt-4 space-y-3 text-sm not-italic leading-6 text-slate-300">
            <p>Jl. K.H. Djawad Faqih MG3/858, Yogyakarta 55153</p>
            <p>
              <a
                href="https://wa.me/6281128701912"
                target="_blank"
                rel="noreferrer"
                aria-label="Hubungi LabMu melalui WhatsApp di +62 811-2870-1912"
                className="inline-flex items-center gap-2 transition hover:text-[#25d366]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.5-4.4a8.4 8.4 0 1 1 15.5-4.5Z" />
                  <path d="M8.4 7.8c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.8 1.9c.1.3.1.5-.1.7l-.6.8c-.2.2-.1.4 0 .6.5 1 1.3 1.8 2.3 2.3.2.1.4.2.6 0l.8-1c.2-.2.4-.3.7-.2l1.8.9c.3.1.4.3.4.5 0 .4-.2 1.4-.9 2-.6.5-1.4.8-2.3.6-1.4-.3-3.1-1.1-4.8-2.7-1.4-1.3-2.4-3-2.7-4.3-.3-1 .1-1.6.4-2.1Z" />
                </svg>
                <span>+62 811-2870-1912</span>
              </a>
            </p>
            <p><a href="mailto:labs@muhammadiyah.or.id">labs@muhammadiyah.or.id</a></p>
          </address>
          <div className="mt-5 flex gap-2" aria-label="Media sosial LabMu">
            {socialLinks.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label} className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-slate-300 transition hover:border-white/40 hover:text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{social.icon}</svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto grid max-w-[1240px] items-center justify-items-center gap-3 px-5 py-5 text-center text-xs text-slate-400 sm:grid-cols-[1fr_auto_1fr] sm:px-8 sm:text-left">
          <p className="sm:justify-self-start">© {new Date().getFullYear()} DiasMu. Dikembangkan oleh LabMu.</p>
          <a href="https://labs.muhammadiyah.or.id" target="_blank" rel="noreferrer" aria-label="Kunjungi situs LabMu" className="inline-flex items-center opacity-80 transition hover:opacity-100">
            <Image src="/logo-labmu.png?v=20260716" alt="LabMu" width={2971} height={780} className="h-6 w-auto brightness-0 invert" unoptimized />
          </a>
          <p className="sm:justify-self-end">Amanah digital untuk Persyarikatan.</p>
        </div>
      </div>
    </footer>
  );
}
