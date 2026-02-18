"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Pencil } from "lucide-react";
import { upsertProduct } from "./actions";
import { toast } from "sonner";
// Prisma Decimal türünü import ediyoruz
import { Decimal } from "@prisma/client/runtime/library";

// Ürün tipini güncelledik (any yerine Decimal | number | string)
interface Product {
  id: string;
  name: string;
  price: Decimal | number | string;
  stock: number;
  description?: string | null;
  taxRate?: Decimal | number | string;
}

export function ProductDialog({ product }: { product?: Product }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const result = await upsertProduct(formData);
      if (result.success) {
        toast.success(product ? "Ürün güncellendi." : "Ürün başarıyla kaydedildi.");
        setOpen(false);
      } else {
        toast.error(result.error || "Bir hata oluştu.");
      }
    } catch {
      toast.error("Sistemsel bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {product ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Yeni Ürün Ekle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{product ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-4">
          {/* Düzenleme modu için gizli ID */}
          {product && <input type="hidden" name="id" value={product.id} />}

          <div className="grid gap-2">
            <Label htmlFor="name">Ürün Adı</Label>
            <Input
              id="name"
              name="name"
              defaultValue={product?.name}
              placeholder="Örn: Saç Bakım Yağı"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Birim Fiyat (₺)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                // Decimal tipini number'a çeviriyoruz
                defaultValue={product ? Number(product.price) : ""}
                placeholder="0.00"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">Stok Adedi</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                defaultValue={product?.stock}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="taxRate">KDV Oranı (%)</Label>
            <Input
              id="taxRate"
              name="taxRate"
              type="number"
              // Decimal tipini number'a çeviriyoruz
              defaultValue={product ? Number(product.taxRate) : "20"}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
            <Input
              id="description"
              name="description"
              defaultValue={product?.description || ""}
              placeholder="Ürün detayları..."
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              product ? "Değişiklikleri Kaydet" : "Ürünü Ekle"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}