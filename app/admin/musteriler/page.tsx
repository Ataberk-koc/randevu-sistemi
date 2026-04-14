// app/admin/musteriler/page.tsx
import { getCustomers } from "./actions";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { User, Phone, ChevronRight } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CustomerDialog } from "./customer-dialog";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Müşteriler</h1>
          <p className="text-slate-500">Kayıtlı müşterileriniz ve harcama alışkanlıkları.</p>
        </div>
        <CustomerDialog />
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Müşteri Bilgisi</TableHead>
              <TableHead>Telefon / Email</TableHead>
              <TableHead>Son Randevu</TableHead>
              <TableHead>Toplam Randevu</TableHead>
              <TableHead className="text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => {
              const lastAppt = customer.customerAppointments[0];
              return (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-600" />
                      </div>
                      <span className="font-medium">{customer.name || "İsimsiz Müşteri"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2 text-slate-600">
                        {customer.phone && (
                          <>
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                            <a
                              href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Whatsapp'tan yaz"
                            >
                              <span className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 ml-1">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" className="w-4 h-4"><path d="M380.9 97.1C339-18.6 197.5-35.6 110.6 51.3c-87 87-69.9 228.5 45.8 270.3l-12.7 46.5c-2.2 8.1 5.3 15.6 13.4 13.4l46.5-12.7c41.8 19.2 89.2 19.2 131 0 115.7-41.8 132.8-183.3 45.8-270.3zM224 400c-39.8 0-77.2-13.7-107.2-36.7l-60.7 16.6 16.6-60.7C61.7 277.2 48 239.8 48 200 48 104.5 104.5 48 200 48s152 56.5 152 152c0 39.8-13.7 77.2-36.7 107.2l16.6 60.7-60.7-16.6C301.2 386.3 263.8 400 224 400z"/></svg>
                              </span>
                            </a>
                          </>
                        )}
                        {!customer.phone && (
                          <span className="text-slate-400">Telefon yok</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        {customer.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {lastAppt ? (
                      format(new Date(lastAppt.date), "d MMM yyyy", { locale: tr })
                    ) : (
                      "Randevu yok"
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      {customer.customerAppointments.length} Seans
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/musteriler/${customer.id}`}>
                      <Button variant="ghost" size="sm" className="gap-2">
                        Detay Gör <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {customers.length === 0 && (
          <p className="text-center py-10 text-slate-500">Henüz kayıtlı müşteri bulunmuyor.</p>
        )}
      </div>
    </div>
  );
}