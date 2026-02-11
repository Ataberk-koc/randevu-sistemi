import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  // Veritabanından gerçek sayıları çekelim ki çalıştığını görelim
  const serviceCount = await prisma.service.count();
  const productCount = await prisma.product.count();
  const userCount = await prisma.user.count();

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Hoş Geldin, Admin! 👋</h1>
          <p className="text-slate-600">Sistemin sorunsuz çalışıyor.</p>
        </div>
        <Link href="/">
           <Button variant="outline">Çıkış Yap</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Özet Kartları */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-medium text-slate-500">Kayıtlı Hizmetler</h3>
          <p className="text-4xl font-bold mt-2 text-indigo-600">{serviceCount}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-medium text-slate-500">Kayıtlı Ürünler</h3>
          <p className="text-4xl font-bold mt-2 text-emerald-600">{productCount}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-medium text-slate-500">Toplam Kullanıcı</h3>
            <p className="text-4xl font-bold mt-2 text-blue-600">{userCount}</p>
        </div>
      </div>
      
      <div className="mt-10 p-6 bg-blue-50 rounded-lg border border-blue-100">
        <h2 className="font-bold text-lg text-blue-800">🚀 Sıradaki Görev:</h2>
        <p className="text-blue-700 mt-2">
          Admin girişi ve veritabanı bağlantısı tamam! 
          Sıradaki adımda <strong>Randevu Takvimini</strong> veya <strong>Hizmet Ekleme Formunu</strong> yapabiliriz.
        </p>
      </div>
    </div>
  );
}