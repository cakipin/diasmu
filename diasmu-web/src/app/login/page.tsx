import SignInButton from "./SignInButton";

type SearchParams = Promise<{ callbackUrl?: string }>;

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const requestedCallback = params.callbackUrl || "/pengajuan";
  const callbackUrl = requestedCallback.startsWith("/") ? requestedCallback : "/pengajuan";

  return (
    <main className="grid min-h-[100dvh] bg-[#f7f8fa] lg:grid-cols-[minmax(320px,0.72fr)_1.28fr]">
      <section className="hidden flex-col justify-between bg-[linear-gradient(180deg,#0b1b34,#071428)] p-10 text-white lg:flex xl:p-14">
        <div className="ui-brand !h-auto !border-0 !p-0">
          <span className="ui-brand-mark" aria-hidden="true"><span /><span /><span /><span /></span>
          <strong className="ui-brand-name">Dias<span>Mu</span></strong>
        </div>

        <div className="max-w-sm">
          <h1 className="text-3xl font-semibold leading-tight tracking-[-0.8px]">Kelola aset digital organisasi dalam satu ruang kerja.</h1>
          <p className="mt-4 max-w-xs text-sm leading-6 text-[#aebbd0]">Pendataan, pengajuan, dan kontrol akses untuk unit Muhammadiyah.</p>
        </div>

        <p className="text-[10px] text-[#7888a2]">Persyarikatan Muhammadiyah</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[410px]">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="ui-brand-mark" aria-hidden="true"><span /><span /><span /><span /></span>
            <strong className="text-xl font-bold tracking-tight text-[#172033]">Dias<span className="text-[#1265e5]">Mu</span></strong>
          </div>

          <div className="ui-panel p-6 sm:p-8">
            <div className="mb-7">
              <h2 className="text-xl font-semibold tracking-[-0.35px] text-[#172033]">Masuk ke DiasMu</h2>
              <p className="mt-2 text-xs leading-5 text-[#667085]">Gunakan akun Muhammadiyah ID untuk mengakses pengajuan dan pengelolaan aset.</p>
            </div>

            <SignInButton redirectTo={callbackUrl} />

            <p className="mt-6 border-t border-[#e2e7ee] pt-5 text-center text-[10px] leading-5 text-[#98a2b3]">
              Akses hanya untuk akun yang terdaftar di ekosistem Muhammadiyah.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
