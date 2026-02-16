// app/admin/stok/product-dialog.tsx
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
import { Plus, Loader2 } from "lucide-react";
import { upsertProduct } from "./actions";
import { toast } from "sonner";

export function ProductDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      await upsertProduct(formData);
      toast.success("Ürün başarıyla kaydedildi.");
      setOpen(false);
    } catch {
      toast.error("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Yeni Ürün Ekle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ürün Bilgileri</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Ürün Adı</Label>
            <Input
              id="name"
              name="name"
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
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
            <Input
              id="description"
              name="description"
              placeholder="Ürün detayları..."
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
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taxRate">KDV Oranı (%)</Label>
              <Input
                id="taxRate"
                name="taxRate"
                type="number"
                defaultValue="20"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Kaydet"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
