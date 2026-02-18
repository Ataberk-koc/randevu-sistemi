// app/admin/dashboard/page.tsx
import { getDashboardStats } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, Banknote, Scissors, AlertTriangle, Package } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";

// --- Tip Tanımlamaları ---
interface AppointmentItem {
  id: string;
  date: Date;
  user: {
    name: string | null;
    email: string;
  };
  service: {
    name: string;
  };
}

interface ProductItem {
  id: string;
  name: string;
  stock: number;
}

interface CustomerItem {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date;
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Yönetim Paneli</h1>
          <p className="text-slate-500">İşletmenizin bugünkü özet durumu.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-900">{format(new Date(), "d MMMM yyyy", { locale: tr })}</p>
          <p className="text-xs text-slate-500">{format(new Date(), "eeee", { locale: tr })}</p>
        </div>
      </div>

      {/* Kritik Stok Uyarıları */}
      {stats.lowStockProducts && stats.lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-800">Kritik Stok Uyarısı!</h3>
            <p className="text-xs text-amber-700 mt-1">
              Aşağıdaki ürünlerin stoğu 5 adedin altına düştü: 
              <span className="font-bold ml-1">
                {stats.lowStockProducts.map((p: ProductItem) => p.name).join(", ")}
              </span>
            </p>
            <Link href="/admin/stok" className="text-xs font-bold text-amber-900 underline mt-2 inline-block">
              Stokları Güncelle
            </Link>
          </div>
        </div>
      )}

      {/* İstatistik Kartları */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugünkü Randevular</CardTitle>
            <CalendarDays className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointmentsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bugünkü Tahmini Kazanç</CardTitle>
            <Banknote className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.todayEarning} ₺</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Hizmetler</CardTitle>
            <Scissors className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kayıtlı Müşteri</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-7">
        {/* Yaklaşan Randevular Listesi */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Sıradaki Randevular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingAppointments.length > 0 ? (
                stats.upcomingAppointments.map((appt: AppointmentItem) => (
                  <div key={appt.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900">{appt.user.name || appt.user.email}</p>
                      <p className="text-sm text-slate-500">{appt.service.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">{format(new Date(appt.date), "HH:mm")}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(appt.date), "d MMMM", { locale: tr })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Yakın zamanda randevu bulunmuyor.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sağ Kolon: Stok ve Yeni Müşteriler */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" /> Stok Özeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                 {stats.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                     stats.lowStockProducts.map((p: ProductItem) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{p.name}</span>
                          <span className="font-bold text-red-600">{p.stock} adet kaldı</span>
                      </div>
                     ))
                 ) : (
                     <p className="text-xs text-slate-500 text-center py-4">Tüm stoklar yeterli düzeyde.</p>
                 )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" /> Yeni Müşteriler
              </CardTitle>
              <Link href="/admin/musteriler" className="text-xs text-blue-600 hover:underline font-medium">
                Tümünü Gör
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.latestCustomers && stats.latestCustomers.length > 0 ? (
                  stats.latestCustomers.map((customer: CustomerItem) => (
                    <div key={customer.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-slate-900">
                          {customer.name || customer.email.split('@')[0]}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {format(new Date(customer.createdAt), "d MMMM HH:mm", { locale: tr })}
                        </p>
                      </div>
                      <Link href={`/admin/musteriler/${customer.id}`}>
                        <button className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors">
                          Profil
                        </button>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">Henüz müşteri kaydı yok.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}