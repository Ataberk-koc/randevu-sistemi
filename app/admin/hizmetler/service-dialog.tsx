"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Package } from "lucide-react";
import { upsertService } from "./actions";

// Hata veren 'any' yerine güvenli tipler tanımlıyoruz
interface Product {
  id: string;
  name: string;
  price: number | string | { toString(): string }; // Decimal uyumluluğu için
  stock: number;
}

interface SelectedProduct {
  id: string;
  quantity: number;
}

export function ServiceDialog({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  const handleProductToggle = (productId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedProducts([...selectedProducts, { id: productId, quantity: 1 }]);
    } else {
      setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
    }
  };

  const handleQuantityChange = (productId: string, qty: number) => {
    setSelectedProducts(
      selectedProducts.map((p) =>
        p.id === productId ? { ...p, quantity: qty } : p
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <PlusCircle className="w-4 h-4" />
          Yeni Hizmet Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Yeni Hizmet Oluştur</DialogTitle>
          <DialogDescription>
            Hizmet detaylarını ve bu hizmette kullanılacak stok ürünlerini belirleyin.
          </DialogDescription>
        </DialogHeader>
        
        <form
          action={async (formData) => {
            formData.append("usedProducts", JSON.stringify(selectedProducts));
            await upsertService(formData); 
            setOpen(false);
            setSelectedProducts([]);
          }}
          className="space-y-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Hizmet Adı</Label>
            <Input id="name" name="name" placeholder="Örn: Saç Kesimi" required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Hizmet Fiyatı (TL)</Label>
              <Input id="price" name="price" type="number" step="0.01" placeholder="500" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Süre (Dk)</Label>
              <Input id="duration" name="duration" type="number" placeholder="45" required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bufferTime">Mola Süresi (Dk)</Label>
            <Input 
                id="bufferTime" 
                name="bufferTime" 
                type="number" 
                defaultValue="10"
            />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Package className="w-4 h-4" /> Kullanılacak Ürünler (Reçete)
            </Label>
            <div className="grid gap-2 border rounded-md p-3 max-h-52 overflow-y-auto bg-slate-50/50">
              {products.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-2">Henüz ürün eklenmemiş.</p>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-4 py-1 border-b last:border-0 border-slate-200">
                    <div className="flex items-center space-x-2">
                      {/* Standart HTML Checkbox kullanarak hata riskini sıfırladık */}
                      <input 
                        type="checkbox"
                        id={`prod-${product.id}`}
                        className="h-4 w-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                        onChange={(e) => handleProductToggle(product.id, e.target.checked)}
                      />
                      <label htmlFor={`prod-${product.id}`} className="text-sm font-medium leading-none cursor-pointer">
                        {product.name}
                      </label>
                    </div>
                    {selectedProducts.find((p) => p.id === product.id) && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">Miktar:</span>
                        <Input 
                          type="number" 
                          className="w-16 h-7 text-xs" 
                          min={1}
                          defaultValue={1}
                          onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full">Hizmeti Kaydet</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}