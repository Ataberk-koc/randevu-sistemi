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
import { Loader2, Plus, CalendarX, Clock } from "lucide-react"; // İkonlar burada
import { toast } from "sonner";

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
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [status, setStatus] = useState<string>(""); 
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [loading, setLoading] = useState(false);

 useEffect(() => {
      getFormData().then((data) => {
      setServices(data.services as unknown as Service[]);
      setCustomers(data.customers as unknown as Customer[]);
    });
  }, []);

  const handleCheckAvailability = async () => {
    if (!selectedService || !selectedDate) return;
    setLoading(true);
    const service = services.find(s => s.id === selectedService);
    if (!service) return; 

    const response = await getAvailableSlots(
        selectedDate.toISOString(), 
        service.duration, 
        service.bufferTime
    ) as unknown as AvailabilityResponse;
    
    setSlots(response.slots);
    setStatus(response.status);
    setLoading(false);
    setStep(2);
  };

  const handleSave = async (userId: string) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("serviceId", selectedService);
    formData.append("userId", userId);
    formData.append("date", selectedSlot);

    await createAppointment(formData);
    toast.success("Randevu oluşturuldu!");
    setOpen(false);
    setStep(1);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600"><Plus className="mr-2 h-4 w-4" /> Yeni Randevu</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Randevu Oluştur</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
            {/* ADIM 1: SEÇİM */}
            {step === 1 && (
                <div className="space-y-4">
                    <Select onValueChange={setSelectedService} value={selectedService}>
                        <SelectTrigger><SelectValue placeholder="Hizmet seç..." /></SelectTrigger>
                        <SelectContent>{services.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent>
                    </Select>
                    <div className="flex justify-center border rounded-md p-2">
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={tr} />
                    </div>
                    <Button onClick={handleCheckAvailability} disabled={loading} className="w-full">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Saatleri Göster"}
                    </Button>
                </div>
            )}

            {/* ADIM 2: SAATLER VE DURUM KONTROLÜ */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="min-h-37.5 flex flex-col justify-center">
                        {status === "OPEN" ? (
                            <div className="grid grid-cols-3 gap-2">
                                {slots.map((slot) => (
                                    <Button key={slot} variant="outline" onClick={() => { setSelectedSlot(slot); setStep(3); }}>
                                        {format(new Date(slot), "HH:mm")}
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-6 bg-slate-50 rounded-lg border border-dashed">
                                {status === "CLOSED" ? (
                                    <>
                                        <CalendarX className="mx-auto h-10 w-10 text-red-400 mb-2" />
                                        <p className="text-sm font-bold text-red-600">İşletme Bugün Kapalı</p>
                                    </>
                                ) : (
                                    <>
                                        <Clock className="mx-auto h-10 w-10 text-orange-400 mb-2" />
                                        <p className="text-sm font-bold text-orange-600">Bugün Yer Kalmadı</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <Button variant="ghost" onClick={() => setStep(1)} className="w-full">Geri Dön</Button>
                </div>
            )}

            {/* ADIM 3: MÜŞTERİ */}
            {step === 3 && (
                <div className="space-y-4">
                    <Select onValueChange={handleSave} disabled={loading}>
                        <SelectTrigger><SelectValue placeholder="Müşteri seç..." /></SelectTrigger>
                        <SelectContent>{customers.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name || c.email}</SelectItem>))}</SelectContent>
                    </Select>
                    <Button variant="ghost" onClick={() => setStep(2)} className="w-full">Geri Dön</Button>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}