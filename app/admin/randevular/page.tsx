import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Clock, User, CheckCircle2 } from "lucide-react";
import { NewAppointment } from "./new-appointment";
import { EditAppointmentDialog } from "./edit-appointment-dialog";
import { Button } from "@/components/ui/button";
import { completeAppointment } from "./actions";

export default async function AppointmentsPage() {
  // 1. Ham verileri çekiyoruz (Decimal içerir)
  const rawAppointments = await prisma.appointment.findMany({
    include: {
      user: true,
      service: true,
    },
    orderBy: { date: 'asc' }
  });

  const rawServices = await prisma.service.findMany({
    where: { isActive: true },
  });

  // 2. VERİ TEMİZLİĞİ: Tüm Decimal alanları Number'a çeviriyoruz
  // Bu işlem hatayı kaynağında çözer.
  const appointments = rawAppointments.map(appt => ({
    ...appt,
    service: {
      ...appt.service,
      price: Number(appt.service.price) // Fiyatı sayıya çevir
    }
  }));

  const services = rawServices.map(service => ({
    ...service,
    price: Number(service.price) // Fiyatı sayıya çevir
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Randevu Takvimi</h1>
          <p className="text-slate-500">Randevuları yönetin, düzenleyin ve stok durumunu güncelleyin.</p>
        </div>
        <NewAppointment />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {appointments.length === 0 ? (
          <div className="col-span-full text-center py-10 bg-white rounded-lg border border-dashed">
            <p className="text-slate-500">Henüz hiç randevu yok.</p>
          </div>
        ) : (
          appointments.map((appt) => (
            <div key={appt.id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                {/* Üst Kısım: Tarih ve Durum */}
                <div className="flex justify-between items-start mb-2">
                  <div className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                    {format(new Date(appt.date), "d MMM", { locale: tr })}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded border ${
                    appt.status === 'COMPLETED' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : appt.status === 'APPROVED' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-gray-50'
                  }`}>
                    {appt.status === 'COMPLETED' ? 'Tamamlandı' : appt.status}
                  </span>
                </div>
                
                <h3 className="font-bold text-lg mb-1">{appt.service.name}</h3>
                
                {/* Detaylar */}
                <div className="space-y-1 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {format(new Date(appt.date), "HH:mm")} - {format(new Date(appt.endDate), "HH:mm")}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {appt.user.name || appt.user.email}
                  </div>
                </div>
              </div>

              {/* BUTONLAR ALANI */}
              <div className="flex gap-2 mt-2">
                {/* Düzenle Butonu */}
                <div className="flex-1">
                    <EditAppointmentDialog 
                        appointment={appt} // Artık temizlenmiş veriyi gönderiyoruz
                        services={services} 
                    />
                </div>

                {/* Tamamla Butonu */}
                {appt.status !== 'COMPLETED' && (
                  <form action={async () => {
                    "use server";
                    await completeAppointment(appt.id);
                  }} className="flex-1">
                    <Button 
                      className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      size="sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Tamamla
                    </Button>
                  </form>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}