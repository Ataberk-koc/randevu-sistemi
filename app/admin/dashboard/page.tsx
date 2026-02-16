import { getDashboardStats } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, Banknote, Scissors } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Yönetim Paneli</h1>
        <p className="text-muted-foreground">İşletmenizin bugünkü özet durumu.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugünkü Randevular</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointmentsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugünkü Kazanç</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.todayEarning} ₺</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Hizmetler</CardTitle>
            <Scissors className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Müşteri</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sıradaki Randevular</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.upcomingAppointments.length > 0 ? (
              stats.upcomingAppointments.map((appt) => (
                <div key={appt.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="font-medium">{appt.user.name || appt.user.email}</p>
                    <p className="text-sm text-muted-foreground">{appt.service.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{format(new Date(appt.date), "HH:mm")}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(appt.date), "d MMMM", { locale: tr })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Yakın zamanda randevu bulunmuyor.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}