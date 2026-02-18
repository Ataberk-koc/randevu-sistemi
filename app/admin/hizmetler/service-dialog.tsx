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
}

export function ServiceDialog({ service }: { service?: Service }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
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
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <Pencil className="h-4 w-4" />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Ücret (₺)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                defaultValue={service ? Number(service.price) : ""}
                placeholder="0.00"
                required
              />
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