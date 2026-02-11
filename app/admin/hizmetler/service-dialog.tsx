// app/admin/services/service-dialog.tsx
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
import { PlusCircle } from "lucide-react";
import { createService } from "./action"; // Az önce yazdığımız action

export function ServiceDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <PlusCircle className="w-4 h-4" />
          Yeni Hizmet Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yeni Hizmet Oluştur</DialogTitle>
          <DialogDescription>
            Listeye yeni bir hizmet ekleyin. Fiyat ve süre bilgilerini girin.
          </DialogDescription>
        </DialogHeader>
        
        {/* Server Action Formu */}
        <form
          action={async (formData) => {
            await createService(formData); // Kaydet
            setOpen(false); // Pencereyi kapat
          }}
          className="space-y-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Hizmet Adı</Label>
            <Input id="name" name="name" placeholder="Örn: Saç Kesimi" required />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Fiyat (TL)</Label>
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
                placeholder="İşlem sonrası temizlik süresi" 
            />
          </div>

          <DialogFooter>
            <Button type="submit">Kaydet</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}