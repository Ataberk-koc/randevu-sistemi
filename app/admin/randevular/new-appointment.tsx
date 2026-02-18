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
import { Loader2, Plus, Clock } from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  duration: number;
}

interface Customer {
  id: string;
  name: string | null;
  email: string;
}

export function NewAppointment() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  
  // Veri State'leri
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  
  // Seçim State'leri
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  
  const [loading, setLoading] = useState(false);

  // Sayfa yüklendiğinde hizmetleri ve müşterileri çek
  useEffect(() => {
    getFormData().then((data) => {
      setServices(data.services as unknown as Service[]);
      setCustomers(data.customers as unknown as Customer[]);
    });
  }, []);

  // 1. ADIM: Müsait Saatleri Getir
  const handleCheckAvailability = async () => {
    if (!selectedService || !selectedDate) {
      toast.error("Lütfen hizmet ve tarih seçiniz.");
      return;
    }
    
    setLoading(true);
    
    // Actions.ts'deki imzaya uygun çağrı: (dateStr, serviceId)
    const availableSlots = await getAvailableSlots(
        selectedDate.toISOString(), 
        selectedService
    );
    
    setSlots(availableSlots);
    setLoading(false);
    setStep(2);
  };

  // 3. ADIM: Kaydet
  const handleSave = async (userId: string) => {
    if (!selectedDate || !selectedSlot) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("serviceId", selectedService);
    formData.append("userId", userId);
    // Actions.ts createAppointment fonksiyonu "date" ve "time"ı ayrı bekler
    formData.append("date", selectedDate.toISOString());
    formData.append("time", selectedSlot); 

    const result = await createAppointment(formData);
    
    if (result.success) {
        toast.success("Randevu başarıyla oluşturuldu!");
        setOpen(false);
        // Formu sıfırla
        setStep(1);
        setSelectedService("");
        setSelectedSlot("");
    } else {
        toast.error(result.error || "Hata oluştu");
    }
    
    setLoading(false);
  };

  // Modal kapandığında state'i temizle
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
        setStep(1);
        setSlots([]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Yeni Randevu
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
            <DialogTitle>Randevu Oluştur</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
            {/* --- ADIM 1: HİZMET VE TARİH SEÇİMİ --- */}
            {step === 1 && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Hizmet Seçimi</label>
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
                    
                    <div className="flex justify-center border rounded-md p-2">
                        <Calendar 
                            mode="single" 
                            selected={selectedDate} 
                            onSelect={setSelectedDate} 
                            locale={tr} 
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                    </div>
                    
                    <Button onClick={handleCheckAvailability} disabled={loading} className="w-full">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Müsait Saatleri Göster"}
                    </Button>
                </div>
            )}

            {/* --- ADIM 2: SAAT SEÇİMİ --- */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="text-center mb-2">
                        <span className="text-sm text-slate-500">
                            {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: tr })} için müsait saatler:
                        </span>
                    </div>

                    <div className="min-h-[150px] flex flex-col justify-center">
                        {slots.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2">
                                {slots.map((slot) => (
                                    <Button 
                                        key={slot} 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => { 
                                            setSelectedSlot(slot); 
                                            setStep(3); 
                                        }}
                                        className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                    >
                                        {slot}
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-6 bg-slate-50 rounded-lg border border-dashed">
                                <Clock className="mx-auto h-8 w-8 text-orange-400 mb-2" />
                                <p className="text-sm font-bold text-slate-700">Boş Yer Yok</p>
                                <p className="text-xs text-slate-500">Bu tarihte tüm randevular dolu.</p>
                            </div>
                        )}
                    </div>
                    
                    <Button variant="ghost" onClick={() => setStep(1)} className="w-full text-slate-500">
                        Geri Dön
                    </Button>
                </div>
            )}

            {/* --- ADIM 3: MÜŞTERİ SEÇİMİ VE KAYIT --- */}
            {step === 3 && (
                <div className="space-y-4">
                    <div className="bg-blue-50 p-3 rounded-md mb-4 text-sm text-blue-800">
                        <p><strong>Tarih:</strong> {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: tr })}</p>
                        <p><strong>Saat:</strong> {selectedSlot}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Müşteri Seçimi</label>
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
                            </SelectContent>
                        </Select>
                    </div>

                    <Button variant="ghost" onClick={() => setStep(2)} className="w-full text-slate-500" disabled={loading}>
                        Geri Dön
                    </Button>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}