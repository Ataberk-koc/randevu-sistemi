// app/admin/randevular/new-appointment.tsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAppointment, getAvailableSlots, getFormData } from "./actions";
import { Loader2, Plus } from "lucide-react";

// TİP TANIMLAMALARI (Hataları çözen kısım burası)
interface Service {
  id: string;
  name: string;
  duration: number;
  bufferTime: number;
}

interface Customer {
  id: string;
  name: string | null;
  email: string;
}

export function NewAppointment() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1); 
  
  // Artık 'any' değil, yukarıdaki tipleri kullanıyoruz
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getFormData().then((data) => {
      // Gelen veriyi güvenli bir şekilde state'e atıyoruz
      setServices(data.services as Service[]);
      setCustomers(data.customers as Customer[]);
    });
  }, []);

  const handleCheckAvailability = async () => {
    if (!selectedService || !selectedDate) return;
    
    setLoading(true);
    const service = services.find(s => s.id === selectedService);
    
    if (!service) return; // Güvenlik kontrolü

    const availableSlots = await getAvailableSlots(
        selectedDate.toISOString(), 
        service.duration, 
        service.bufferTime
    );
    
    setSlots(availableSlots);
    setLoading(false);
    setStep(2);
  };

  const handleSave = async (userId: string) => {
    const formData = new FormData();
    formData.append("serviceId", selectedService);
    formData.append("userId", userId);
    formData.append("date", selectedSlot);

    await createAppointment(formData);
    setOpen(false);
    setStep(1); 
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600"><Plus className="mr-2 h-4 w-4" /> Yeni Randevu</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Randevu Oluştur</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
            {/* ADIM 1 */}
            {step === 1 && (
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Hizmet Seçin</label>
                        <Select onValueChange={setSelectedService}>
                            <SelectTrigger>
                                <SelectValue placeholder="Hizmet seç..." />
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
                    <div>
                        <label className="text-sm font-medium mb-2 block">Tarih Seçin</label>
                        <div className="border rounded-md p-2 flex justify-center">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="rounded-md border"
                                locale={tr}
                            />
                        </div>
                    </div>
                    <Button 
                        onClick={handleCheckAvailability} 
                        disabled={!selectedService || !selectedDate || loading}
                        className="w-full"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Saatleri Göster"}
                    </Button>
                </div>
            )}

            {/* ADIM 2 */}
            {step === 2 && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-center">
                        {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: tr })} için Müsait Saatler
                    </h3>
                    {/* Tailwind uyarısını düzelttik: max-h-[200px] -> max-h-52 */}
                    <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                        {slots.length > 0 ? slots.map((slot) => (
                            <Button
                                key={slot}
                                variant={selectedSlot === slot ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                    setSelectedSlot(slot);
                                    setStep(3);
                                }}
                            >
                                {format(new Date(slot), "HH:mm")}
                            </Button>
                        )) : (
                            <p className="col-span-3 text-center text-red-500 text-sm">Bu tarihte boş yer yok.</p>
                        )}
                    </div>
                    <Button variant="ghost" onClick={() => setStep(1)} className="w-full">Geri Dön</Button>
                </div>
            )}

            {/* ADIM 3 */}
            {step === 3 && (
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Müşteri Seçin</label>
                        <Select onValueChange={handleSave}>
                            <SelectTrigger>
                                <SelectValue placeholder="Müşteri..." />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name || c.email}
                                    </SelectItem>
                                ))}
                                {customers.length === 0 && <p className="p-2 text-xs text-muted-foreground">Kayıtlı müşteri yok.</p>}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="bg-slate-50 p-4 rounded text-sm space-y-2">
                        <p><strong>Hizmet:</strong> {services.find(s => s.id === selectedService)?.name}</p>
                        <p><strong>Tarih:</strong> {selectedSlot && format(new Date(selectedSlot), "d MMMM HH:mm", { locale: tr })}</p>
                    </div>
                    <Button variant="ghost" onClick={() => setStep(2)} className="w-full">Geri Dön</Button>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}