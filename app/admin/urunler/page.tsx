import { getProducts } from "./actions";
import { ProductDialog } from "./product-dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "./actions";

export default async function StokPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ürün & Stok Yönetimi</h1>
          <p className="text-slate-500">Satışını yaptığınız ürünlerin stok durumunu yönetin.</p>
        </div>
        <ProductDialog />
      </div>

      <div className="bg-white rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün Adı</TableHead>
              <TableHead>Stok Adedi</TableHead>
              <TableHead>Birim Fiyat</TableHead>
              <TableHead>Vergi Oranı</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-slate-500">
                  Henüz ürün eklenmemiş.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${product.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {product.stock} adet
                    </span>
                  </TableCell>
                  <TableCell>{Number(product.price).toLocaleString('tr-TR')} ₺</TableCell>
                  <TableCell>{product.taxRate} %</TableCell>
                  <TableCell className="text-right">
                    <form action={async () => { "use server"; await deleteProduct(product.id); }}>
                       <Button variant="ghost" size="icon" className="text-red-500">
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </form>
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