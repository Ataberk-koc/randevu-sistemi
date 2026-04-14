import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Phone, MapPin, Mail, Calendar } from "lucide-react";
// Basit bir WhatsApp ikon SVG'si
const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-4 h-4"><path d="M380.9 97.1C339-18.6 197.5-35.6 110.6 51.3c-87 87-69.9 228.5 45.8 270.3l-12.7 46.5c-2.2 8.1 5.3 15.6 13.4 13.4l46.5-12.7c41.8 19.2 89.2 19.2 131 0 115.7-41.8 132.8-183.3 45.8-270.3zM224 400c-39.8 0-77.2-13.7-107.2-36.7l-60.7 16.6 16.6-60.7C61.7 277.2 48 239.8 48 200 48 104.5 104.5 48 200 48s152 56.5 152 152c0 39.8-13.7 77.2-36.7 107.2l16.6 60.7-60.7-16.6C301.2 386.3 263.8 400 224 400z"/></svg>
);
import { EditCustomerDialog } from "./EditCustomerDialog";
import { DeleteCustomerButton } from "./DeleteCustomerButton";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  if (!id) return notFound();

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      customerAppointments: {
        include: { service: true },
        orderBy: { date: 'desc' }
      }
    }
  });

  if (!customer) return notFound();

  // Finansal özet: Sadece tamamlanmış (COMPLETED) randevuları hesapla
  const totalSpent = customer.customerAppointments
    .filter(a => a.status === "COMPLETED")
    .reduce((sum, a) => sum + Number(a.service.price), 0);

  return (
    <div className="space-y-6 p-8">
      {/* Üst Profil Kartı */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm">
            <User className="h-10 w-10 text-slate-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">{customer.name || "İsimsiz Müşteri"}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-4 bg-slate-50 px-2 py-1 rounded border">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                  {customer.phone || "Telefon yok"}
                </span>
                {customer.phone && (
                  <a
                    href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-green-600 hover:text-green-800 font-semibold px-2"
                  >
                    <WhatsAppIcon />
                    <span className="hidden sm:inline">Whatsapp'tan yaz</span>
                  </a>
                )}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border">
                <Mail className="w-3.5 h-3.5 text-orange-500" /> {customer.email || "E-posta yok"}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border">
                <MapPin className="w-3.5 h-3.5 text-red-500" /> {customer.address || "Adres bilgisi girilmemiş"}
              </span>
            </div>
          </div>
        </div>
        {/* Sil ve Düzenle Butonları */}
        <div className="flex gap-2 mt-4 md:mt-0">
          <DeleteCustomerButton customerId={customer.id} />
          <EditCustomerDialog customer={JSON.parse(JSON.stringify({
            ...customer,
            // If you add more Decimal fields to User, add them here
            customerAppointments: customer.customerAppointments.map(appt => ({
              ...appt,
              service: {
                ...appt.service,
                price: appt.service.price?.toString?.() ?? appt.service.price
              }
            }))
          }))} />
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider">Toplam Ciro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-900">{totalSpent}</span>
              <span className="text-emerald-600 font-bold text-lg">₺</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider">Seans Sayısı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900">{customer.customerAppointments.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase text-slate-500 tracking-wider">Kayıt Tarihi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-slate-700">
              {format(new Date(customer.createdAt), "d MMMM yyyy", { locale: tr })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* İşlem Geçmişi Tablosu */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-500" /> İşlem Geçmişi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold">Tarih</TableHead>
                <TableHead className="font-bold">Hizmet</TableHead>
                <TableHead className="font-bold text-right">Tutar</TableHead>
                <TableHead className="font-bold text-center">Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.customerAppointments.length > 0 ? (
                customer.customerAppointments.map((appt) => (
                  <TableRow key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="text-slate-600 font-medium">
                      {format(new Date(appt.date), "d MMM yyyy HH:mm", { locale: tr })}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">{appt.service.name}</TableCell>
                    <TableCell className="text-right font-bold text-slate-900">{Number(appt.service.price)} ₺</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase ${
                        appt.status === "COMPLETED" 
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {appt.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                    Müşteriye ait henüz bir randevu kaydı bulunmamaktadır.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}