// app/admin/randevular/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
// getDay fonksiyonunu ekledik (Haftanın gününü bulmak için)
import { addMinutes, isBefore, setHours, setMinutes, startOfDay, getDay } from "date-fns";

// 1. Form için gerekli verileri çek
export async function getFormData() {
  const services = await prisma.service.findMany({ where: { isActive: true } });
  // Şimdilik sistemdeki tüm kullanıcıları müşteri gibi çekelim
  const customers = await prisma.user.findMany(); 
  return { services, customers };
}

// 2. Belirli bir günün randevularını çek (Takvim için)
export async function getAppointments(date: Date) {
  const start = startOfDay(date);
  const end = addMinutes(start, 24 * 60); // Gün sonu

  return await prisma.appointment.findMany({
    where: {
      date: {
        gte: start,
        lt: end,
      },
    },
    include: {
      user: true,
      service: true,
    },
    orderBy: { date: 'asc' }
  });
}

// 3. Müsait Slotları Hesapla (GÜNCELLENEN AKILLI VERSİYON)
export async function getAvailableSlots(dateStr: string, serviceDuration: number, buffer: number) {
  const date = new Date(dateStr);
  
  // 1. Seçilen tarihin hangi gün olduğunu bul (0: Pazar, 1: Pzt ...)
  const dayIndex = getDay(date);

  // 2. Veritabanından o günün çalışma saatlerini çek
  const workingDay = await prisma.workingDay.findUnique({
    where: { dayOfWeek: dayIndex }
  });

  // Eğer ayar bulunamazsa veya o gün KAPALI ise boş liste dön (Saat gösterme)
  if (!workingDay || workingDay.isClosed) {
    return []; 
  }

  // 3. Adminin girdiği saatleri (Örn: "09:30") parçala
  const [startHour, startMinute] = workingDay.startTime.split(':').map(Number);
  const [endHour, endMinute] = workingDay.endTime.split(':').map(Number);

  // 4. Döngü için Başlangıç ve Bitiş zamanlarını ayarla
  let currentTime = setMinutes(setHours(date, startHour), startMinute);
  const endTime = setMinutes(setHours(date, endHour), endMinute);

  // O günkü mevcut randevuları çek (Çakışma kontrolü için)
  const existingAppointments = await getAppointments(date);
  const slots = [];

  // 5. Slotları oluştur
  while (isBefore(currentTime, endTime)) {
    const slotEnd = addMinutes(currentTime, serviceDuration + buffer);

    // Bu slot, dükkanın kapanış saatini geçiyor mu?
    if (isBefore(endTime, slotEnd)) {
      break;
    }

    // Çakışma kontrolü
    const isOverlapping = existingAppointments.some((appt) => {
      const apptStart = new Date(appt.date);
      const apptEnd = new Date(appt.endDate);
      
      // Slot'un başlangıcı veya bitişi, mevcut randevunun içindeyse çakışma var
      return (
        (currentTime >= apptStart && currentTime < apptEnd) ||
        (slotEnd > apptStart && slotEnd <= apptEnd) ||
        (currentTime <= apptStart && slotEnd >= apptEnd)
      );
    });

    if (!isOverlapping) {
      slots.push(currentTime.toISOString());
    }

    // Bir sonraki slot için 30 dk ilerle
    currentTime = addMinutes(currentTime, 30);
  }

  return slots;
}

// 4. Randevu Oluştur
export async function createAppointment(formData: FormData) {
  const serviceId = formData.get("serviceId") as string;
  const userId = formData.get("userId") as string; // Müşteri ID
  const dateStr = formData.get("date") as string; // Seçilen Slot (ISO String)

  // Hizmet detaylarını al (Süre hesaplamak için)
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new Error("Hizmet bulunamadı");

  const startDate = new Date(dateStr);
  const endDate = addMinutes(startDate, service.duration);

  await prisma.appointment.create({
    data: {
      date: startDate,
      endDate: endDate,
      serviceId,
      userId,
      status: "APPROVED", // Admin eklediği için direkt onaylı
    },
  });

  revalidatePath("/admin/randevular");
}