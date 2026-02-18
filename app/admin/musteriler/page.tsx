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
              const lastAppt = customer.appointments[0];
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
                        <Phone className="h-3 w-3" /> {customer.email} {/* Şemanda telefon varsa buraya ekleyebilirsin */}
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
                      {customer.appointments.length} Seans
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