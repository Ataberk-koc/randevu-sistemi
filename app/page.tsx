import { BookingForm } from "./booking-form";
import { Scissors } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header / Navbar */}
      <header className="bg-white border-b py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
          <Scissors className="h-6 w-6" />
          <span>ATA Yazılım Çözümleri</span>{" "}
          {/* İşletme Adını Buraya Yazabilirsin */}
        </div>
         <a
          href="/randevu-sorgula"
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          Randevumu Sorgula
        </a>
        <a
          href="/login"
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          Personel Girişi
        </a>
       
      </header>

      {/* Hero Section & Form */}
      <main className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Size Özel Hizmetler İçin <br className="hidden md:block" /> Hemen
            Randevu Alın
          </h1>
          <p className="text-lg text-slate-600">
            Sıra beklemeden, dilediğiniz saatte ve dilediğiniz hizmet için
            yerinizi hemen ayırtın.
          </p>
        </div>

        {/* Randevu Sihirbazını Buraya Çağırıyoruz */}
        <BookingForm />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6 text-center text-sm text-slate-500">
        <p>© 2026 ATA Kreatif Merkezi - Tüm Hakları Saklıdır.</p>
      </footer>
    </div>
  );
}
