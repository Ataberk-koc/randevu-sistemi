import { getProducts } from "./actions";
import { ProductDialog } from "./product-dialog";
import { ProductDeleteButton } from "./product-delete-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
export const dynamic = "force-dynamic";

export default async function StokPage() {
  const products = await getProducts();

  return (
    <div className="space-y-6">
      {/* Üst Başlık ve Ekleme Butonu */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Ürün & Stok Yönetimi
          </h1>
          <p className="text-slate-500">
            Satışını yaptığınız ürünlerin stok durumunu yönetin.
          </p>
        </div>
        <ProductDialog />
      </div>

      {/* Tablo Alanı */}
      <div className="bg-white rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün Adı</TableHead>
              <TableHead>Stok Durumu</TableHead>
              <TableHead>Birim Fiyat</TableHead>
              <TableHead>KDV</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-slate-500"
                >
                  Henüz ürün eklenmemiş.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  {/* 1. Ürün Adı */}
                  <TableCell className="font-medium">{product.name}</TableCell>

                  {/* 2. Stok (Renkli Görünüm) */}
                  <TableCell>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.stock < 5
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {product.stock} adet
                    </span>
                  </TableCell>

                  {/* 3. Fiyat */}
                  <TableCell>
                    {Number(product.price).toFixed(2)} ₺
                  </TableCell>

                  {/* 4. Vergi Oranı */}
                  <TableCell>%{Number(product.taxRate)}</TableCell>

                  {/* 5. İşlemler (Düzenle ve Sil Yan Yana) */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Düzenleme Modalı */}
                      <ProductDialog
                        product={{
                          ...product,
                          price: Number(product.price),
                          taxRate: Number(product.taxRate),
                          description: product.description || null,
                        }}
                      />

                      {/* Silme İşlemi */}
                      <ProductDeleteButton
                        productId={product.id}
                        productName={product.name}
                      />
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