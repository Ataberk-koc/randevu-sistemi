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
import { Loader2, Plus, CalendarX, Clock } from "lucide-react";
import { toast } from "sonner"; // Bildirim için

// TİP TANIMLAMALARI
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

interface AvailabilityResponse {
  slots: string[];
  status: string; // 'OPEN' | 'CLOSED' | 'FULL'
}

export function NewAppointment() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1); 
  
  // Data State
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Selection State
  const [slots, setSlots] = useState<string[]>([]);
  const [status, setStatus] = useState<string>(""); // Müsaitlik durumu
  
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // İlk açılışta verileri çek
  useEffect(() => {
    getFormData().then((data) => {
      setServices(data.services as Service[]);
      setCustomers(data.customers as Customer[]);
    });
  }, []);

  // Adım 1 -> 2: Müsaitlik Kontrolü
  const handleCheckAvailability = async () => {
    if (!selectedService || !selectedDate) {
        toast.error("Lütfen hizmet ve tarih seçin.");
        return;
    }
    
    setLoading(true);
    const service = services.find(s => s.id === selectedService);
    
    if (!service) return; 

    try {
        // Server action'dan hem saatleri hem de durumu alıyoruz
        const response = await getAvailableSlots(
            selectedDate.toISOString(), 
            service.duration, 
            service.bufferTime
        ) as AvailabilityResponse; // Tipi zorluyoruz
        
        setSlots(response.slots);
        setStatus(response.status);
        setStep(2);
    } catch  {
        toast.error("Saatler kontrol edilirken bir hata oluştu.");
    } finally {
        setLoading(false);
    }
  };

  // Adım 3 -> Kaydet: Randevuyu oluştur
  const handleSave = async (userId: string) => {
    setLoading(true);
    try {
        const formData = new FormData();
        formData.append("serviceId", selectedService);
        formData.append("userId", userId);
        formData.append("date", selectedSlot);

        await createAppointment(formData);
        
        toast.success("Randevu başarıyla oluşturuldu! 🎉");
        setOpen(false);
        
        // Formu sıfırla
        setStep(1); 
        setSelectedService("");
        setSelectedSlot("");
    } catch  {
        toast.error("Randevu oluşturulurken hata çıktı.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Yeni Randevu
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Randevu Oluştur</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
            {/* ---------------- ADIM 1: HİZMET VE TARİH ---------------- */}
            {step === 1 && (
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Hizmet Seçin</label>
                        <Select onValueChange={setSelectedService} value={selectedService}>
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
                                className="rounded-md border shadow-sm"
                                locale={tr}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} // Geçmiş günleri engelle
                            />
                        </div>
                    </div>
                    <Button 
                        onClick={handleCheckAvailability} 
                        disabled={!selectedService || !selectedDate || loading}
                        className="w-full"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : "Saatleri Göster"}
                    </Button>
                </div>
            )}

            {/* ---------------- ADIM 2: SAAT SEÇİMİ ---------------- */}
            {step === 2 && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-center text-slate-700 border-b pb-2">
                        {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: tr })}
                    </h3>
                    
                    <div className="min-h-[150px]">
                        {/* DURUM: AÇIK */}
                        {status === "OPEN" && slots.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                                {slots.map((slot) => (
                                    <Button
                                        key={slot}
                                        variant={selectedSlot === slot ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            setSelectedSlot(slot);
                                            setStep(3);
                                        }}
                                        className="text-xs"
                                    >
                                        {format(new Date(slot), "HH:mm")}
                                    </Button>
                                ))}
                            </div>
                        )}

                        {/* DURUM: KAPALI */}
                        {status === "CLOSED" && (
                            <div className="flex flex-col items-center justify-center py-6 text-center bg-red-50 rounded-lg border border-red-100 h-full">
                                <CalendarX className="w-10 h-10 text-red-500 mb-2" />
                                <p className="font-bold text-red-700">İşletme Kapalı</p>
                                <p className="text-xs text-red-500 mt-1 px-4">
                                    Seçilen günde hizmet verilmemektedir. Lütfen başka bir gün seçin.
                                </p>
                            </div>
                        )}

                        {/* DURUM: DOLU */}
                        {status === "FULL" && (
                            <div className="flex flex-col items-center justify-center py-6 text-center bg-orange-50 rounded-lg border border-orange-100 h-full">
                                <Clock className="w-10 h-10 text-orange-500 mb-2" />
                                <p className="font-bold text-orange-700">Randevular Dolu</p>
                                <p className="text-xs text-orange-500 mt-1 px-4">
                                    Bugün için tüm saatler alınmış.
                                </p>
                            </div>
                        )}
                    </div>

                    <Button variant="ghost" onClick={() => setStep(1)} className="w-full">
                        Geri Dön
                    </Button>
                </div>
            )}

            {/* ---------------- ADIM 3: MÜŞTERİ SEÇİMİ ---------------- */}
            {step === 3 && (
                <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-blue-600 font-medium">Hizmet:</span>
                            <span className="font-bold text-slate-700">{services.find(s => s.id === selectedService)?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-blue-600 font-medium">Tarih:</span>
                            <span className="font-bold text-slate-700">
                                {selectedSlot && format(new Date(selectedSlot), "d MMMM HH:mm", { locale: tr })}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1 block">Müşteri Seçin</label>
                        <Select onValueChange={handleSave} disabled={loading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Müşteri seç..." />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name || c.email}
                                    </SelectItem>
                                ))}
                                {customers.length === 0 && (
                                    <div className="p-2 text-xs text-center text-muted-foreground">
                                        Kayıtlı müşteri yok.
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <Button variant="ghost" onClick={() => setStep(2)} className="w-full" disabled={loading}>
                        Geri Dön
                    </Button>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}