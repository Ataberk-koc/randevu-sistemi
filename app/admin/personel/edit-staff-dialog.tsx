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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateStaff } from "./actions";
import type { User } from "@prisma/client";

export function EditStaffDialog({ staff }: { staff: User }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(staff.name);
  const [email, setEmail] = useState(staff.email);
  const [phone, setPhone] = useState(staff.phone || "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await updateStaff({
      id: staff.id,
      name,
      email,
      phone,
    });
    if (result.success) {
      toast.success("Personel başarıyla güncellendi.");
      setOpen(false);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50">
          Düzenle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Personel Bilgilerini Düzenle</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="grid gap-2">
            <Label>Ad Soyad</Label>
            <Input value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label>E-Posta</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
          </div>
          <div className="grid gap-2">
            <Label>Telefon</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : "Kaydet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
