"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { addMinutes, setHours, setMinutes, format, isBefore, startOfDay, endOfDay } from "date-fns";

// --- 1. VERİ GETİRME FONKSİYONLARI (READ) ---

// Randevu listesini getirir
export async function getAppointments() {
  return await prisma.appointment.findMany({
    include: {
      user: true,
      service: true
    },
    orderBy: {
      date: 'desc'
    }
  });
}

// Dropdown'lar için aktif hizmetleri getirir
export async function getServicesForDropdown() {
  const services = await prisma.service.findMany({
    where: { isActive: true }
  });

  // Client Component hatasını önlemek için Decimal -> Number çevrimi
  return services.map(service => ({
    ...service,
    price: Number(service.price)
  }));
}

// Yeni randevu formu için gerekli verileri (Hizmetler ve Müşteriler) getirir
export async function getFormData() {
  const rawServices = await prisma.service.findMany({
    where: { isActive: true },
  });
  
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" }, // Sadece müşterileri getir
    orderBy: { name: "asc" },
  });

  // Client Component hatasını önlemek için Decimal -> Number çevrimi
  const services = rawServices.map(service => ({
    ...service,
    price: Number(service.price)
  }));

  return { services, customers };
}

// Belirli bir tarih ve hizmet için müsait saatleri hesaplar
export async function getAvailableSlots(dateStr: string, serviceId: string) {
  // Kontrol: Değerler boşsa işlem yapma
  if (!dateStr || !serviceId) return [];

  // HATA ÇÖZÜMÜ: Gelen ID sayı bile olsa String'e çeviriyoruz
  const idAsString = String(serviceId);

  const service = await prisma.service.findUnique({ 
    where: { id: idAsString } 
  });
  
  if (!service) return [];

  const selectedDate = new Date(dateStr);
  const startHour = 9; // Mesai başlangıcı 09:00
  const endHour = 18;  // Mesai bitişi 18:00
  const interval = 30; // 30 dakikalık periyotlar

  // O günkü mevcut randevuları çek
  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);

  const appointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
      status: { not: "CANCELLED" },
    },
  });

  const slots = [];
  let currentTime = setMinutes(setHours(selectedDate, startHour), 0);
  const endTime = setMinutes(setHours(selectedDate, endHour), 0);

  // Mesai saatleri içinde döngü kur
  while (isBefore(currentTime, endTime)) {
    const slotEnd = addMinutes(currentTime, service.duration);
    
    // Eğer hizmet süresi mesai bitimini aşıyorsa o saati atla
    if (isBefore(endTime, slotEnd)) break;

    // Çakışma kontrolü
    const isConflict = appointments.some((appt) => {
      const apptStart = new Date(appt.date);
      const apptEnd = new Date(appt.endDate);
      
      return (
        (currentTime >= apptStart && currentTime < apptEnd) || // Başlangıç çakışması
        (slotEnd > apptStart && slotEnd <= apptEnd) ||       // Bitiş çakışması
        (currentTime <= apptStart && slotEnd >= apptEnd)     // Kapsama çakışması
      );
    });

    if (!isConflict) {
      slots.push(format(currentTime, "HH:mm"));
    }

    currentTime = addMinutes(currentTime, interval);
  }

  return slots;
}

// --- 2. İŞLEM FONKSİYONLARI (CREATE / UPDATE / DELETE) ---

// YENİ RANDEVU OLUŞTURMA
export async function createAppointment(formData: FormData) {
  const userId = formData.get("userId") as string;
  const serviceId = formData.get("serviceId") as string;
  const dateStr = formData.get("date") as string; // "2024-02-20"
  const timeStr = formData.get("time") as string; // "14:30"

  if (!userId || !serviceId || !dateStr || !timeStr) {
    return { success: false, error: "Tüm alanları doldurun." };
  }

  // Tarih ve Saati birleştir
  const [hours, minutes] = timeStr.split(":").map(Number);
  const startDate = setMinutes(setHours(new Date(dateStr), hours), minutes);

  const service = await prisma.service.findUnique({ where: { id: String(serviceId) } });
  if (!service) return { success: false, error: "Hizmet bulunamadı." };

  const endDate = addMinutes(startDate, service.duration);

  // Çakışma Kontrolü (Tekrar)
  const conflict = await prisma.appointment.findFirst({
    where: {
      status: { not: "CANCELLED" },
      OR: [
        { date: { lt: endDate }, endDate: { gt: startDate } },
      ],
    },
  });

  if (conflict) {
    return { success: false, error: "Seçilen saat maalesef dolu." };
  }

  await prisma.appointment.create({
    data: {
      userId,
      serviceId,
      date: startDate,
      endDate: endDate,
      status: "APPROVED",
    },
  });

  revalidatePath("/admin/randevular");
  return { success: true };
}

// RANDEVU GÜNCELLEME (Edit Dialog için)
export async function updateAppointment(formData: FormData) {
  const id = formData.get("id") as string;
  const dateString = formData.get("date") as string;
  const serviceId = formData.get("serviceId") as string;

  const newStartDate = new Date(dateString);

  const service = await prisma.service.findUnique({
    where: { id: String(serviceId) },
  });

  if (!service) throw new Error("Hizmet bulunamadı.");

  const newEndDate = addMinutes(newStartDate, service.duration);

  // Çakışma kontrolü (Kendi ID'si hariç)
  const conflict = await prisma.appointment.findFirst({
    where: {
      NOT: { id: id },
      OR: [
        {
          date: { lt: newEndDate },
          endDate: { gt: newStartDate },
        },
      ],
      status: { not: "CANCELLED" }
    },
  });

  if (conflict) {
    return { success: false, error: "Seçilen saatte başka bir randevu mevcut!" };
  }

  await prisma.appointment.update({
    where: { id },
    data: {
      date: newStartDate,
      endDate: newEndDate,
      serviceId: serviceId,
    },
  });

  revalidatePath("/admin/randevular");
  return { success: true };
}

// RANDEVU TAMAMLAMA
export async function completeAppointment(id: string) {
  try {
    await prisma.appointment.update({
      where: { id },
      data: { status: "COMPLETED" },
    });
    
    revalidatePath("/admin/randevular");
    return { success: true };
  } catch (error) {
    console.error("Hata:", error);
    return { success: false, error: "İşlem başarısız." };
  }
}