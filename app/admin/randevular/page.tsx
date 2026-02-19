import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Clock, User, CheckCircle2, XCircle, ThumbsUp } from "lucide-react";
import { NewAppointment } from "./new-appointment";
import { EditAppointmentDialog } from "./edit-appointment-dialog";
import { Button } from "@/components/ui/button";
import { completeAppointment, approveAppointment, cancelAppointment } from "./actions";

export default async function AppointmentsPage() {
  const rawAppointments = await prisma.appointment.findMany({
    include: { user: true, service: true },
    orderBy: { date: 'asc' }
  });

  const rawServices = await prisma.service.findMany({
    where: { isActive: true },
  });

  const appointments = rawAppointments.map(appt => ({
    ...appt,
    service: {
      ...appt.service,
      price: Number(appt.service.price)
    }
  }));

  const services = rawServices.map(service => ({
    ...service,
    price: Number(service.price)
  }));

  // Durumlara göre renk ve metin tanımlamaları
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded border border-yellow-200">Onay Bekliyor</span>;
      case 'APPROVED': return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded border border-blue-200">Onaylandı</span>;
      case 'COMPLETED': return <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded border border-emerald-200">Tamamlandı</span>;
      case 'CANCELLED': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded border border-red-200">İptal Edildi</span>;
      case 'REJECTED': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded border border-red-200">Reddedildi</span>;
      default: return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Randevu Takvimi</h1>
          <p className="text-slate-500">Randevuları yönetin, onaylayın ve stok durumunu güncelleyin.</p>
        </div>
        <NewAppointment />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {appointments.length === 0 ? (
          <div className="col-span-full text-center py-10 bg-white border border-dashed rounded-lg">
            <p className="text-slate-500">Henüz hiç randevu yok.</p>
          </div>
        ) : (
          appointments.map((appt) => (
            <div key={appt.id} className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded">
                    {format(new Date(appt.date), "d MMMM yyyy", { locale: tr })}
                  </div>
                  {getStatusBadge(appt.status)}
                </div>
                
                <h3 className="font-bold text-lg mb-2 text-slate-900">{appt.service.name}</h3>
                
                <div className="space-y-2 text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{format(new Date(appt.date), "HH:mm")} - {format(new Date(appt.endDate), "HH:mm")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    <span>{appt.user.name || appt.user.email}</span>
                  </div>
                  {appt.user.phone && (
                    <div className="text-xs text-slate-500 ml-6">📞 {appt.user.phone}</div>
                  )}
                </div>
              </div>

              {/* BUTONLAR ALANI: Duruma göre şartlı render ediliyor */}
              <div className="flex flex-col gap-2 mt-2">
                
                {/* 1. Beklemede (PENDING) Olanlar İçin: Onayla ve İptal Et */}
                {appt.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <form action={async () => { "use server"; await approveAppointment(appt.id); }} className="flex-1">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2" size="sm">
                        <ThumbsUp className="w-4 h-4" /> Onayla
                      </Button>
                    </form>
                    <form action={async () => { "use server"; await cancelAppointment(appt.id); }} className="flex-1">
                      <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 gap-2" size="sm">
                        <XCircle className="w-4 h-4" /> Reddet
                      </Button>
                    </form>
                  </div>
                )}

                {/* 2. Onaylı (APPROVED) Olanlar İçin: Tamamla ve İptal Et */}
                {appt.status === 'APPROVED' && (
                  <div className="flex gap-2">
                    <form action={async () => { "use server"; await completeAppointment(appt.id); }} className="flex-[2]">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2" size="sm">
                        <CheckCircle2 className="w-4 h-4" /> Tamamla
                      </Button>
                    </form>
                    <form action={async () => { "use server"; await cancelAppointment(appt.id); }} className="flex-1">
                      <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700" size="sm">
                        İptal
                      </Button>
                    </form>
                  </div>
                )}

                {/* Düzenle Butonu: Sadece İptal edilmemiş ve Tamamlanmamışsa görünür */}
                {(appt.status === 'PENDING' || appt.status === 'APPROVED') && (
                  <div className="mt-1">
                    <EditAppointmentDialog appointment={appt} services={services} />
                  </div>
                )}

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}