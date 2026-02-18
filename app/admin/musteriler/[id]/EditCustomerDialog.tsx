"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { updateCustomer } from "./actions";

import type { User } from "@prisma/client";
export function EditCustomerDialog({ customer }: { customer: User }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: customer.name || "",
    phone: customer.phone || "",
    email: customer.email || "",
    address: customer.address || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await updateCustomer(customer.id, form);
    setLoading(false);
    setOpen(false);
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs">
          <Pencil className="w-4 h-4" /> Düzenle
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Müşteri Bilgilerini Düzenle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Input name="name" value={form.name} onChange={handleChange} placeholder="Ad Soyad" required />
          <Input name="phone" value={form.phone} onChange={handleChange} placeholder="Telefon" required />
          <Input name="email" value={form.email} onChange={handleChange} placeholder="E-posta" required />
          <Textarea name="address" value={form.address} onChange={handleChange} placeholder="Adres" />
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Kaydediliyor..." : "Kaydet"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
