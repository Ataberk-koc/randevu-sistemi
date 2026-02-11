// app/admin/ayarlar/page.tsx
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  // Veritabanından tüm çalışma günlerini çekiyoruz (0'dan 6'ya sıralı)
  const workingDays = await prisma.workingDay.findMany({
    orderBy: {
      dayOfWeek: 'asc',
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">İşletme Ayarları</h1>
        <p className="text-slate-500">
          Çalışma saatlerini ve randevu aralıklarını buradan yönetebilirsiniz.
        </p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-slate-50/50">
          <h2 className="font-semibold text-lg text-slate-800">Haftalık Çalışma Saatleri</h2>
        </div>
        
        <div className="p-6">
          {/* Çektiğimiz verileri form bileşenine prop olarak gönderiyoruz */}
          <SettingsForm workingDays={workingDays} />
        </div>
      </div>
    </div>
  );
}