export default function NbmWarning() {
  return (
    <div className="bg-white border-2 border-amber-500 rounded-2xl overflow-hidden shadow-xl mb-10 max-w-4xl mx-auto">
      <div className="bg-amber-500 p-4 flex items-center gap-3">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h4 className="text-xl font-black text-white uppercase tracking-tight">NBM Belum Terdeteksi!</h4>
      </div>
      
      <div className="p-8 flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 space-y-4">
          <p className="text-slate-700 leading-relaxed">
            Maaf, akun Anda belum memiliki **Nomor Baku Muhammadiyah (NBM)** yang terhubung dengan SSO. 
            Sesuai regulasi organisasi, Anda wajib memiliki e-KTAM (NBM) untuk dapat didaftarkan sebagai Admin atau PIC aset digital Muhammadiyah.
          </p>
          <p className="text-sm font-bold text-[#004282]">Silakan unduh aplikasi MASA untuk mengurus e-KTAM (NBM) Anda secara mandiri:</p>
        </div>

        {/* TOMBOL DOWNLOAD */}
        <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
          <a 
            href="https://play.google.com/store/apps/details?id=com.labmu.masa&hl=id&pli=1" 
            target="_blank" 
            className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:scale-105 transition-transform shadow-lg border border-slate-700"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Play Store" className="h-8" />
            <div className="text-left">
              <p className="text-[10px] uppercase leading-none opacity-70">Download on</p>
              <p className="text-lg font-bold leading-none">Google Play</p>
            </div>
          </a>

          <a 
            href="https://apps.apple.com/us/app/masa/id6753329539" 
            target="_blank" 
            className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl hover:scale-105 transition-transform shadow-lg border border-slate-700"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="App Store" className="h-8" />
            <div className="text-left">
              <p className="text-[10px] uppercase leading-none opacity-70">Download on</p>
              <p className="text-lg font-bold leading-none">App Store</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
