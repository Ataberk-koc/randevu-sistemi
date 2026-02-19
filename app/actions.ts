"use server";

import { prisma } from "@/lib/prisma";
import { addMinutes, setHours, setMinutes, format, isBefore, startOfDay, endOfDay } from "date-fns";

// 1. Vitrinde Gösterilecek Hizmetleri Çeker
export async function getPublicServices() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    select: { id: true, name: true, duration: true, price: true, description: true } 
  });
  
  return services.map(s => ({ ...s, price: Number(s.price) }));
}

// 2. Müşteriye Müsait Saatleri Gösterir (Admin ile aynı mantık)
export async function getPublicAvailableSlots(dateStr: string, serviceId: string) {
  if (!dateStr || !serviceId) return [];

  const service = await prisma.service.findUnique({ where: { id: String(serviceId) } });
  if (!service) return [];

  const selectedDate = new Date(dateStr);
  const startHour = 9; 
  const endHour = 18;  
  const interval = 30; 

  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);

  // NOT: "CANCELLED" olmayan tüm randevular saati kapatır. (PENDING dahil)
  const appointments = await prisma.appointment.findMany({
    where: {
      date: { gte: dayStart, lte: dayEnd },
      status: { not: "CANCELLED" },
    },
  });

  const slots = [];
  let currentTime = setMinutes(setHours(selectedDate, startHour), 0);
  const endTime = setMinutes(setHours(selectedDate, endHour), 0);

  while (isBefore(currentTime, endTime)) {
    const slotEnd = addMinutes(currentTime, service.duration);
    if (isBefore(endTime, slotEnd)) break;

    const isConflict = appointments.some((appt) => {
      const apptStart = new Date(appt.date);
      const apptEnd = new Date(appt.endDate);
      return (
        (currentTime >= apptStart && currentTime < apptEnd) ||
        (slotEnd > apptStart && slotEnd <= apptEnd) ||
        (currentTime <= apptStart && slotEnd >= apptEnd)
      );
    });

    if (!isConflict && isBefore(new Date(), currentTime)) { // Geçmiş saatleri de gizler
      slots.push(format(currentTime, "HH:mm"));
    }
    currentTime = addMinutes(currentTime, interval);
  }
  return slots;
}

// 3. Müşterinin Kendi Randevusunu Oluşturması ("PENDING" statüsü ile)
export async function createPublicAppointment(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  // DÜZELTME 1: Null olma ihtimalini tamamen ortadan kaldırdık
  const phone = (formData.get("phone") as string) || ""; 
  const serviceId = formData.get("serviceId") as string;
  const dateStr = formData.get("date") as string;
  const timeStr = formData.get("time") as string;

  if (!name || !email || !serviceId || !dateStr || !timeStr) {
    return { success: false, error: "Lütfen tüm zorunlu alanları doldurun." };
  }

  try {
    // Müşteriyi E-Postasından bul, yoksa yeni müşteri hesabı oluştur
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: { 
          name, 
          email, 
          phone, 
          role: "CUSTOMER",
          // DÜZELTME 2: Şema gereği zorunlu olan password alanı için rastgele bir şifre atadık
          password: Math.random().toString(36).slice(-8) 
        }
      });
    }

    const [hours, minutes] = timeStr.split(":").map(Number);
    const startDate = setMinutes(setHours(new Date(dateStr), hours), minutes);

    const service = await prisma.service.findUnique({ where: { id: String(serviceId) } });
    if (!service) return { success: false, error: "Hizmet bulunamadı." };

    const endDate = addMinutes(startDate, service.duration);

    // Son çakışma kontrolü (Müşteri formu doldururken başkası almış olabilir)
    const conflict = await prisma.appointment.findFirst({
      where: {
        status: { not: "CANCELLED" },
        OR: [{ date: { lt: endDate }, endDate: { gt: startDate } }],
      },
    });

    if (conflict) {
      return { success: false, error: "Seçilen saat az önce doldu, lütfen başka bir saat seçin." };
    }

    // RANDEVUYU BEKLEMEDE (PENDING) OLARAK OLUŞTUR
    await prisma.appointment.create({
      data: {
        userId: user.id,
        serviceId,
        date: startDate,
        endDate: endDate,
        status: "PENDING", // Admin onaylayana kadar beklemede
      },
    });

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "İşlem sırasında bir hata oluştu." };
  }
}

// 4. Müşterinin E-posta ile Kendi Randevularını Sorgulaması
export async function getCustomerAppointments(email: string) {
  if (!email) return { success: false, error: "Lütfen bir e-posta adresi girin." };
  
  try {
    // E-postaya göre kullanıcıyı ve randevularını (hizmet detaylarıyla) getir
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        appointments: {
          include: { service: true },
          orderBy: { date: 'desc' } // En yeni randevu en üstte
        }
      }
    });

    if (!user || user.appointments.length === 0) {
      return { success: false, error: "Bu e-posta adresine ait bir randevu bulunamadı." };
    }

    // Decimal tipini Number'a çevirerek Client'a gönder
    const formattedAppointments = user.appointments.map(appt => ({
      id: appt.id,
      serviceName: appt.service.name,
      date: appt.date,
      endDate: appt.endDate,
      status: appt.status,
      price: Number(appt.service.price)
    }));

    return { success: true, appointments: formattedAppointments };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Sorgulama sırasında sistemsel bir hata oluştu." };
  }
}