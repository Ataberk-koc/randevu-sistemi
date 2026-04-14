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
import { createStaff } from "./actions";
import { toast } from "sonner";

export function StaffDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const result = await createStaff(formData);
    
    if (result.success) {
      toast.success("Personel başarıyla eklendi.");
      setOpen(false);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="w-4 h-4" /> Yeni Personel Ekle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Personel Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label>Ad Soyad</Label>
            <Input name="name" required placeholder="Örn: Ayşe Yılmaz" />
          </div>
          <div className="grid gap-2">
            <Label>E-Posta</Label>
            <Input name="email" type="email" required placeholder="personel@sirket.com" />
          </div>
          <div className="grid gap-2">
            <Label>Telefon</Label>
            <Input name="phone" required placeholder="05XX XXX XX XX" />
          </div>
          <div className="grid gap-2">
            <Label>Giriş Şifresi</Label>
            <Input name="password" type="password" required placeholder="******" />
            <p className="text-xs text-slate-500">Personel sisteme bu şifre ile giriş yapacaktır.</p>
          </div>
          
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : "Kaydet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}