// app/admin/randevular/page.tsx
import { prisma } from "@/lib/prisma";
import { NewAppointment } from "./new-appointment";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Clock, User, CalendarDays } from "lucide-react";

export default async function AppointmentsPage() {
  // Veritabanından randevuları çek (Tarihe göre sıralı)
  const appointments = await prisma.appointment.findMany({
    include: {
      user: true,
      service: true,
    },
    orderBy: { date: 'asc' }
  });

  return (
    <div className="space-y-6">
      {/* Üst Başlık ve Buton Alanı */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Randevu Takvimi</h1>
            <p className="text-slate-500">Randevuları yönetin ve yaklaşan işlemleri görün.</p>
        </div>
        <NewAppointment />
      </div>

      {/* Randevu Listesi Grid Yapısı */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {appointments.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <CalendarDays className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-lg font-medium text-slate-900">Henüz hiç randevu yok.</p>
                <p className="text-sm text-slate-500">Yeni bir randevu oluşturarak başlayın.</p>
            </div>
        ) : (
            appointments.map((appt) => (
                <div key={appt.id} className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
                    <div>
                        {/* Tarih ve Durum Rozeti */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-100">
                                {format(new Date(appt.date), "d MMM", { locale: tr })}
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${
                                appt.status === 'APPROVED' 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : 'bg-gray-50 text-gray-600 border-gray-200'
                            }`}>
                                {appt.status === 'APPROVED' ? 'Onaylı' : appt.status}
                            </span>
                        </div>
                        
                        {/* Hizmet Adı */}
                        <h3 className="font-bold text-lg text-slate-800 mb-1 leading-tight">
                            {appt.service.name}
                        </h3>
                        
                        {/* Detaylar */}
                        <div className="space-y-2 mt-3 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span>
                                    {format(new Date(appt.date), "HH:mm")} - {format(new Date(appt.endDate), "HH:mm")}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                <User className="w-4 h-4 text-slate-400" />
                                <span className="truncate">
                                    {appt.user.name || appt.user.email}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}