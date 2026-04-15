"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPublicServices, getPublicStaff, getPublicAvailableSlots, createPublicAppointment, getClosedDates } from "./actions";
import { Loader2, CalendarClock, CheckCircle2, User } from "lucide-react"; 
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
}

interface Staff {
  id: string;
  name: string;
}

export function BookingForm() {
  const [step, setStep] = useState(1);
  
  const [services, setServices] = useState<Service[]>([]); 
  const [staffList, setStaffList] = useState<Staff[]>([]); 
  const [slots, setSlots] = useState<string[]>([]);
  const [closedDayOfWeeks, setClosedDayOfWeeks] = useState<number[]>([]);
  const [daysOffDates, setDaysOffDates] = useState<string[]>([]);
  
  const [selectedService, setSelectedService] = useState<Service | null>(null); 
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null); 
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const services = await getPublicServices();
        setServices(services as Service[]);
      } catch (err) {
        console.error('Hizmetler yüklenemedi:', err);
      }

      try {
        const staff = await getPublicStaff();
        setStaffList(staff as Staff[]);
      } catch (err) {
        console.error('Personel yüklenemedi:', err);
      }

      try {
        console.log('getClosedDates çağrılıyor...');
        const closedData = await getClosedDates();
        console.log('Kapalı günler geri geldi:', closedData); // Debug log - DEĞERLENDIR
        console.log('Kapalı dayOfWeeks:', closedData.closedDayOfWeeks);
        setClosedDayOfWeeks(closedData.closedDayOfWeeks);
        setDaysOffDates(closedData.daysOffDates);
      } catch (err) {
        console.error('Kapalı günler yüklenemedi:', err);
      }
    };

    loadData();
  }, []);

  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && selectedService && selectedStaff) {
      setLoading(true);
      const availableSlots = await getPublicAvailableSlots(date.toISOString(), selectedService.id, selectedStaff.id);
      setSlots(availableSlots);
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot || !selectedService || !selectedStaff) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("serviceId", selectedService.id);
    formData.append("staffId", selectedStaff.id);
    formData.append("date", selectedDate.toISOString());
    formData.append("time", selectedSlot);

    const result = await createPublicAppointment(formData);
    
    if (result.success) {
      setStep(5); // Başarılı ekranı
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  if (step === 5) {
    return (
      <div className="text-center py-12 px-4 bg-white rounded-2xl shadow-xl border border-emerald-100">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Randevu Talebiniz Alındı!</h3>
        <p className="text-slate-500 mb-6">İşletmemiz randevunuzu inceleyip en kısa sürede onaylayacaktır. Seçtiğiniz saat sizin için ayrıldı.</p>
        <Button onClick={() => window.location.reload()} variant="outline">Yeni Bir Randevu Al</Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border overflow-hidden max-w-3xl mx-auto">
      {/* İlerleme Çubuğu */}
      <div className="flex bg-slate-50 border-b text-xs sm:text-sm font-medium">
        <div className={`flex-1 text-center py-3 ${step >= 1 ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400"}`}>1. Hizmet</div>
        <div className={`flex-1 text-center py-3 ${step >= 2 ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400"}`}>2. Personel</div>
        <div className={`flex-1 text-center py-3 ${step >= 3 ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400"}`}>3. Zaman</div>
        <div className={`flex-1 text-center py-3 ${step >= 4 ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400"}`}>4. Bilgiler</div>
      </div>

      <div className="p-6 sm:p-8">
        
        {/* ADIM 1: HİZMET SEÇİMİ */}
        {step === 1 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((service) => (
              <div 
                key={service.id} 
                onClick={() => { setSelectedService(service); setStep(2); }}
                className="p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-bold text-slate-900">{service.name}</h4>
                  {service.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{service.description}</p>}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md">{service.duration} dk</span>
                  <span className="font-bold text-blue-600">{service.price} ₺</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ADIM 2: PERSONEL SEÇİMİ */}
        {step === 2 && (
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              {staffList.map((staff) => (
                <div 
                  key={staff.id} 
                  onClick={() => { 
                    setSelectedStaff(staff); 
                    setStep(3); 
                    // Otomatik olarak bugünün saatlerini getir
                    if (selectedDate) handleDateSelect(selectedDate);
                  }}
                  className="p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all flex items-center gap-4"
                >
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{staff.name}</h4>
                    <p className="text-xs text-slate-500">Uzman Personel</p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setStep(1)} className="mt-6 text-slate-500 w-full">Geri Dön</Button>
          </div>
        )}

        {/* ADIM 3: TARİH VE SAAT SEÇİMİ */}
        {step === 3 && (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 border rounded-xl p-2 bg-slate-50">
              <Calendar 
                mode="single" 
                selected={selectedDate} 
                onSelect={handleDateSelect} 
                locale={tr} 
                disabled={(date) => {
                  // Geçmiş günleri disable et
                  if (date < new Date(new Date().setHours(0,0,0,0))) return true;
                  
                  // Pazar (0), Pazartesi (1), vb. kontrol
                  if (closedDayOfWeeks.includes(date.getDay())) return true;
                  
                  // Özel tatil günlerini kontrol et
                  const dateStr = date.toISOString().split('T')[0];
                  if (daysOffDates.includes(dateStr)) return true;
                  
                  return false;
                }}
                className="bg-transparent"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-bold mb-4 text-slate-900 flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-blue-500"/>
                {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: tr })}
              </h4>
              <p className="text-sm text-slate-500 mb-4">{selectedStaff?.name} için uygun saatler:</p>
              
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>
              ) : slots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((slot) => (
                    <Button 
                      key={slot} 
                      variant="outline" 
                      onClick={() => { setSelectedSlot(slot); setStep(4); }}
                      className="hover:bg-blue-600 hover:text-white"
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-orange-50 rounded-xl border border-orange-100">
                  <p className="text-orange-600 font-medium">Bu tarihte uygun saat yok.</p>
                </div>
              )}
              <Button variant="ghost" onClick={() => setStep(2)} className="mt-6 text-slate-500 w-full">Geri Dön</Button>
            </div>
          </div>
        )}

        {/* ADIM 4: MÜŞTERİ BİLGİLERİ */}
        {step === 4 && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-xl mb-6 flex items-center justify-between">
              <div>
                <p className="font-bold text-blue-900">{selectedService?.name}</p>
                <p className="text-sm text-blue-700">{selectedDate && format(selectedDate, "d MMMM yyyy", { locale: tr })} - Saat: {selectedSlot}</p>
                <p className="text-xs font-medium text-blue-600 mt-1">Uzman: {selectedStaff?.name}</p>
              </div>
              <p className="font-bold text-xl text-blue-900">{selectedService?.price} ₺</p>
            </div>

            <div className="grid gap-2">
              <Label>Ad Soyad</Label>
              <Input name="name" placeholder="Örn: Ahmet Yılmaz" required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>E-Posta Adresi</Label>
                <Input name="email" type="email" placeholder="mail@ornek.com" required />
              </div>
              <div className="grid gap-2">
                <Label>Telefon Numarası</Label>
                <Input name="phone" type="tel" placeholder="05XX XXX XX XX" required />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setStep(3)} className="w-1/3">Geri</Button>
              <Button type="submit" className="w-2/3 bg-blue-600" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Randevuyu Tamamla"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}