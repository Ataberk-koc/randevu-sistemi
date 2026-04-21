"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Loader2, CalendarClock } from "lucide-react";
import { updateAppointment } from "./actions";
import { toast } from "sonner";
import { format } from "date-fns";

// --- TİP TANIMLAMALARI (Interface) ---
interface Service {
  id: string;
  name: string;
  duration: number;
  price?: number; // BU SATIRI EKLE (Opsiyonel olabilir diye ? koydum ama genelde doludur)
}

interface User {
  name: string | null;
  email: string;
}

interface Appointment {
  id: string;
  date: Date | string;
  serviceId: string;
  user: User;
  service: Service;
}
// -------------------------------------

export function EditAppointmentDialog({ 
  appointment, 
  services 
}: { 
  appointment: Appointment; // any yerine Appointment tipi
  services: Service[];      // any[] yerine Service[] tipi
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Tarih formatlama
  const defaultDate = format(appointment.date as Date, "yyyy-MM-dd'T'HH:mm");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const result = await updateAppointment(formData);
      
      if (result.success) {
        toast.success("Randevu saati güncellendi.");
        setOpen(false);
      } else {
        toast.error(result.error || "Hata oluştu.");
      }
    } catch {
      toast.error("Beklenmedik bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-2 text-blue-600 hover:text-blue-700">
          <Pencil className="h-3.5 w-3.5" /> Düzenle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Randevuyu Güncelle</DialogTitle>
        </DialogHeader>
        
        <form action={handleSubmit} className="space-y-4 pt-4">
          <input type="hidden" name="id" value={appointment.id} />
          
          {/* Müşteri Adı */}
          <div className="grid gap-2">
            <Label>Müşteri</Label>
            <Input 
              value={appointment.user.name || appointment.user.email} 
              disabled 
              className="bg-slate-100" 
            />
          </div>

          {/* Tarih ve Saat */}
          <div className="grid gap-2">
            <Label>Yeni Tarih ve Saat</Label>
            <div className="relative">
                <CalendarClock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input 
                    type="datetime-local" 
                    name="date" 
                    defaultValue={defaultDate} 
                    className="pl-9"
                    required 
                />
            </div>
          </div>

          {/* Hizmet Seçimi */}
          <div className="grid gap-2">
            <Label>Hizmet</Label>
            <Select name="serviceId" defaultValue={appointment.serviceId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.duration} dk)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Değişiklikleri Kaydet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}