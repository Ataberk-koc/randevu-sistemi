// app/admin/hizmetler/page.tsx
import { prisma } from "@/lib/prisma";
import { ServiceDialog } from "./service-dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Scissors } from "lucide-react";
import { deleteService } from "./actions";

export default async function HizmetlerPage() {
  // Hem hizmetleri hem de stoktaki ürünleri çekiyoruz
  const [services, productsRaw] = await Promise.all([
    prisma.service.findMany({
      include: {
        usages: { // Reçetedeki ürünleri görmek istersen
          include: { product: true }
        }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
  ]);

  // Decimal price'ı number'a çeviriyoruz
  const products = productsRaw.map(p => ({
    ...p,
    price: typeof p.price === "object" && p.price?.toNumber ? p.price.toNumber() : p.price
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Scissors className="h-8 w-8 text-blue-600" /> Hizmet Yönetimi
          </h1>
          <p className="text-slate-500">Sunulan hizmetleri ve kullanılan ürün reçetelerini yönetin.</p>
        </div>
        {/* Ürün listesini dialog'a gönderiyoruz */}
        <ServiceDialog products={products} />
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hizmet Adı</TableHead>
              <TableHead>Süre</TableHead>
              <TableHead>Fiyat</TableHead>
              <TableHead>Kullanılan Ürünler</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.name}</TableCell>
                <TableCell>{service.duration} dk</TableCell>
                <TableCell>{Number(service.price)} ₺</TableCell>
                <TableCell>
                  <span className="text-xs text-slate-500">
                    {service.usages.length > 0 
                      ? `${service.usages.length} çeşit ürün` 
                      : "Ürün eklenmemiş"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <form action={async () => { "use server"; await deleteService(service.id); }}>
                    <Button variant="ghost" size="icon" className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}