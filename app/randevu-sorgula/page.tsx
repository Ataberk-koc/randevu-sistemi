"use client";

import { useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCustomerAppointments } from "@/app/actions";
import { Search, Loader2, CalendarClock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// 1. DÜZELTME: Veri tipimizi açıkça tanımlıyoruz
interface Appointment {
  id: string;
  serviceName: string;
  date: Date | string;
  endDate: Date | string;
  status: string;
  price: number;
}

export default function AppointmentQueryPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 2. DÜZELTME: <any[]> yerine tanımladığımız <Appointment[]> tipini kullanıyoruz
  const [appointments, setAppointments] = useState<Appointment[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const result = await getCustomerAppointments(email);
    
    if (result.success) {
      // result.appointments'ı Appointment[] olarak kabul etmesini söylüyoruz
      setAppointments((result.appointments as Appointment[]) || []);
      toast.success("Randevularınız bulundu.");
    } else {
      setAppointments(null);
      toast.error(result.error);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200">⏳ Onay Bekliyor</span>;
      case 'APPROVED': return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">✅ Onaylandı</span>;
      case 'COMPLETED': return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">🌟 Tamamlandı</span>;
      case 'CANCELLED': return <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-200">❌ İptal Edildi</span>;
      case 'REJECTED': return <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-200">🚫 Reddedildi</span>;
      default: return <span className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1 rounded-full border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center">
      <div className="max-w-xl w-full">
        {/* Üst Kısım & Geri Dönüş */}
        <Link href="/" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Ana Sayfaya Dön
        </Link>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Randevumu Sorgula</h1>
          <p className="text-slate-500 mb-6">Randevu alırken kullandığınız e-posta adresini girerek güncel randevu durumunuzu öğrenebilirsiniz.</p>
          
          <form onSubmit={handleSearch} className="flex gap-3">
            <Input 
              type="email" 
              placeholder="E-posta adresiniz..." 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              <span className="ml-2 hidden sm:inline">Sorgula</span>
            </Button>
          </form>
        </div>

        {/* Sonuçlar Alanı */}
        {appointments && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-blue-500" />
              Geçmiş ve Gelecek Randevularınız ({appointments.length})
            </h3>
            
            {appointments.map((appt) => (
              <div key={appt.id} className="bg-white p-5 rounded-xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-lg text-slate-900">{appt.serviceName}</h4>
                  <p className="text-slate-500 text-sm mt-1">
                    {format(appt.date, "d MMMM yyyy, EEEE", { locale: tr })} <br/>
                    <strong className="text-slate-700">Saat:</strong> {format(appt.date, "HH:mm")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(appt.status)}
                  <span className="font-extrabold text-slate-900">{appt.price} ₺</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}