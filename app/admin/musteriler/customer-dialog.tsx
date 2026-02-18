"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Adres için
import { UserPlus, Loader2 } from "lucide-react";
import { createCustomer } from "./actions";


import { toast, Toaster } from "sonner";

export function CustomerDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await createCustomer(formData);
    if (result?.success) {
      toast.success("Müşteri kaydı oluşturuldu.");
      setOpen(false);
    } else {
      toast.error(result?.message || "Müşteri eklenirken bir sorun oluştu.");
    }
    setLoading(false);
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" /> Yeni Müşteri Ekle
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Yeni Müşteri Kaydı</DialogTitle>
              <DialogDescription>
                Müşterinin bilgilerini buraya girin. Şifre zorunlu değildir.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Ad Soyad</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Örn: Ahmet Yılmaz"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefon Numarası</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="05xx xxx xx xx"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-posta</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ornegin@mail.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Adres</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="Müşterinin açık adresi..."
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  "Müşteriyi Kaydet"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </>
  );
}
