// app/admin/services/page.tsx
import { prisma } from "@/lib/prisma";
import { ServiceDialog } from "./service-dialog";
import { deleteService } from "./action";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, Banknote } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ServicesPage() {
  // 1. Veritabanından hizmetleri çek (Server Component gücü!)
  const rawServices = await prisma.service.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // Decimal → number dönüşümü (Client Component'lere gönderilebilmesi için)
  const services = rawServices.map((s) => ({
    ...s,
    price: Number(s.price),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hizmetler</h1>
            <p className="text-slate-500">İşletmenizin sunduğu hizmetleri buradan yönetin.</p>
        </div>
        <ServiceDialog />
      </div>

      <div className="border rounded-lg bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hizmet Adı</TableHead>
              <TableHead>Süre</TableHead>
              <TableHead>Fiyat</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell>
                    <div className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-4 h-4" />
                        {service.duration} dk (+{service.bufferTime} dk mola)
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-1 font-semibold text-green-600">
                        <Banknote className="w-4 h-4" />
                        {service.price.toFixed(2)} ₺
                    </div>
                </TableCell>
                <TableCell className="text-right">
                  <form action={deleteService.bind(null, service.id)}>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
            
            {services.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                        Henüz hiç hizmet eklenmemiş. Yukarıdan ekleyebilirsiniz.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}