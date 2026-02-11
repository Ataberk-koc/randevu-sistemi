// app/admin/ayarlar/settings-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; 
import { saveSettings } from "./actions"; 
import { Loader2 } from "lucide-react";

// TİP TANIMLAMASI (Hata Çözücü)
interface WorkingDay {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isClosed: boolean;
}

// Gün isimleri
const gunler = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

// Props kısmında 'any' yerine 'WorkingDay[]' kullanıyoruz
export function SettingsForm({ workingDays }: { workingDays: WorkingDay[] }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
        await saveSettings(formData);
        toast.success("Çalışma saatleri başarıyla güncellendi! 🎉");
    } catch{
        toast.error("Bir hata oluştu.");
    } finally {
        setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {workingDays.map((day) => (
        <div key={day.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 last:border-0 last:pb-0">
          
          <div className="w-32 font-semibold text-lg text-slate-700">
            {gunler[day.dayOfWeek]}
          </div>

          <div className="flex items-center gap-6 flex-1">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id={`closed-${day.dayOfWeek}`}
                name={`isClosed-${day.dayOfWeek}`} 
                defaultChecked={day.isClosed}
                className="w-5 h-5 accent-red-600 cursor-pointer"
              />
              <Label htmlFor={`closed-${day.dayOfWeek}`} className="cursor-pointer font-medium text-slate-600">
                Kapalı
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Input 
                type="time" 
                name={`startTime-${day.dayOfWeek}`}
                defaultValue={day.startTime}
                className="w-32 cursor-pointer"
              />
              <span className="text-slate-400 font-bold">-</span>
              <Input 
                type="time" 
                name={`endTime-${day.dayOfWeek}`}
                defaultValue={day.endTime}
                className="w-32 cursor-pointer"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end pt-4 bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-xl border-t">
        <Button type="submit" size="lg" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
          {loading ? <Loader2 className="animate-spin mr-2" /> : "Ayarları Kaydet ve Güncelle"}
        </Button>
      </div>
    </form>
  );
}