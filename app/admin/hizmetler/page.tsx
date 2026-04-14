import { getServices, deleteService } from "./actions";
import { ServiceDialog } from "./service-dialog"; // import yoluna dikkat
import { getProducts } from "../urunler/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Clock } from "lucide-react";

export default async function ServicesPage() {
  const services = await getServices();
  const products = (await getProducts()) || [];

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hizmet Yönetimi</h1>
          <p className="text-slate-500">Randevu alınabilecek hizmetleri ve sürelerini yönetin.</p>
        </div>
        <ServiceDialog products={products} />
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hizmet Adı</TableHead>
              <TableHead>Süre</TableHead>
              <TableHead>Ücret</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                  Henüz hizmet eklenmemiş.
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">
                    <div>
                      {service.name}
                      {service.description && (
                        <p className="text-xs text-slate-400 mt-0.5 font-normal">{service.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-3.5 h-3.5" />
                      {service.duration} dk
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    {Number(service.price).toFixed(2)} ₺
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* DÜZENLEME BUTONU */}
                      <ServiceDialog 
                        service={{
                          ...service,
                          price: Number(service.price)
                        }}
                        products={products}
                      />
                      
                      {/* SİLME BUTONU */}
                      <form action={async () => {
                        "use server";
                        await deleteService(service.id);
                      }}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}