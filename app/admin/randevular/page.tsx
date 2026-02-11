// app/admin/randevular/page.tsx
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {Clock, User } from "lucide-react";
import {NewAppointment} from "./new-appointment";
export default async function AppointmentsPage() {
  // Varsayılan olarak bugünün ve yarının randevularını çekelim (Basit görünüm)
  const appointments = await prisma.appointment.findMany({
    include: {
      user: true,
      service: true,
    },
    orderBy: { date: 'asc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Randevu Takvimi</h1>
            <p className="text-slate-500">Randevuları yönetin ve boşlukları görün.</p>
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
                <div key={appt.id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <div className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                            {format(new Date(appt.date), "d MMM", { locale: tr })}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded border ${
                            appt.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50'
                        }`}>
                            {appt.status}
                        </span>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-1">{appt.service.name}</h3>
                    
                    <div className="space-y-1 text-sm text-slate-600">
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
            ))
        )}
      </div>
    </div>
  );
}