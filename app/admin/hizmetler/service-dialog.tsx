"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Pencil } from "lucide-react";
import { upsertService } from "./actions";
import { toast } from "sonner";
// Prisma tipleri için import (Decimal hatası almamak için any kaçışını kullanacağız veya tip tanımlayacağız)
import { Decimal } from "@prisma/client/runtime/library";

interface Service {
  id: string;
  name: string;
  price: Decimal | number | string;
  duration: number;
  description?: string | null;
  products?: { id: string; name: string; quantity: number }[];
}


export function ServiceDialog({ service, products }: { service?: Service, products: { id: string; name: string; price?: number }[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // Always derive initial selectedProducts from service prop only once on mount
  const [selectedProducts, setSelectedProducts] = useState<{ id: string; name: string; price: number; quantity: number }[]>(() => {
    if (!service?.products) return [];
    return service.products.map((p) => {
      const prod = products.find((pr) => pr.id === p.id);
      return {
        id: p.id,
        name: p.name,
        price: prod?.price ?? 0,
        quantity: p.quantity,
      };
    });
  });
  const [price, setPrice] = useState<number>(service ? Number(service.price) : 0);
  const [profit, setProfit] = useState<string>("");
  const [showProductSelect, setShowProductSelect] = useState(false);


  function handleProductToggle(productId: string) {
    setSelectedProducts((prev) => {
      const exists = prev.find((p) => p.id === productId);
      if (exists) {
        return prev.filter((p) => p.id !== productId);
      } else {
        const prod = products.find((p) => p.id === productId);
        if (!prod) return prev;
        return [...prev, { id: prod.id, name: prod.name, price: prod.price ?? 0, quantity: 1 }];
      }
    });
  }

  // Update price when selectedProducts or profit changes
  useEffect(() => {
    const productsTotal = selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    setPrice(productsTotal + (profit ? Number(profit) : 0));
  }, [selectedProducts, profit]);

  const productsTotal = selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const totalPrice = productsTotal + (profit ? Number(profit) : 0);


  function handleQuantityChange(productId: string, quantity: number) {
    setSelectedProducts((prev) => prev.map((p) => p.id === productId ? { ...p, quantity } : p));
  }


  async function handleSubmit(formData: FormData) {
    setLoading(true);
    // Ürünleri formData'ya ekle
    selectedProducts.forEach((prod, idx) => {
      formData.append(`products[${idx}][id]`, prod.id);
      formData.append(`products[${idx}][quantity]`, String(prod.quantity));
    });
    formData.set("price", String(productsTotal));
    formData.set("profit", profit ? String(profit) : "");
    formData.set("totalPrice", String(totalPrice));
    try {
      const result = await upsertService(formData);
      if (result.success) {
        toast.success(service ? "Hizmet güncellendi." : "Hizmet oluşturuldu.");
        setOpen(false);
      } else {
        toast.error("Bir hata oluştu.");
      }
    } catch {
      toast.error("Beklenmedik bir hata.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {service ? (
          <Button variant="outline" className="flex items-center gap-2">
            <Pencil className="mr-2 h-4 w-4" /> Düzenle
          </Button>
        ) : (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Yeni Hizmet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? "Hizmeti Düzenle" : "Yeni Hizmet Ekle"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-4">
          {/* Düzenleme için gizli ID */}
          {service && <input type="hidden" name="id" value={service.id} />}

          <div className="grid gap-2">
            <Label htmlFor="name">Hizmet Adı</Label>
            <Input
              id="name"
              name="name"
              defaultValue={service?.name}
              placeholder="Örn: Saç Kesimi"
              required
            />
          </div>


          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Ürün Ücreti (₺)</Label>
              <Input
                value={productsTotal > 0 ? productsTotal : ""}
                readOnly
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profit">Kar (₺)</Label>
              <Input
                id="profit"
                name="profit"
                type="number"
                step="0.01"
                value={profit}
                onChange={e => setProfit(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder=""
                autoComplete="off"
              />
            </div>
            <div className="grid gap-2">
              <Label>Toplam Ücret (₺)</Label>
              <Input
                value={totalPrice > 0 ? totalPrice : ""}
                readOnly
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="duration">Süre (Dakika)</Label>
            <Input
              id="duration"
              name="duration"
              type="number"
              defaultValue={service?.duration || 30}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Kullanılacak Ürünler</Label>
            <div className="border rounded p-2 bg-gray-50">
              {products.length === 0 && <span className="text-gray-400">Ürün bulunamadı</span>}
              {products.map((product) => {
                const checked = selectedProducts.some((p) => p.id === product.id);
                return (
                  <div key={product.id} className="flex items-center gap-2 py-1">
                    <Checkbox checked={checked} onCheckedChange={() => handleProductToggle(product.id)} id={`prod-${product.id}`} />
                    <label htmlFor={`prod-${product.id}`} className="flex-1 cursor-pointer select-none">
                      {product.name} <span className="text-xs text-gray-500">({typeof product.price === 'number' ? product.price.toFixed(2) : ''} ₺)</span>
                    </label>
                    {checked && (
                      <>
                        <input
                          type="number"
                          min={1}
                          value={selectedProducts.find((p) => p.id === product.id)?.quantity || 1}
                          onChange={e => handleQuantityChange(product.id, Number(e.target.value))}
                          className="w-16 border rounded px-2 py-1"
                        />
                        <span>adet</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
            <Input
              id="description"
              name="description"
              defaultValue={service?.description || ""}
              placeholder="Hizmet detayları..."
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (service ? "Güncelle" : "Kaydet")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}