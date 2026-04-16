"use server";

import { prisma } from "@/lib/prisma";
import { addMinutes, setHours, setMinutes, format, isBefore, startOfDay, endOfDay } from "date-fns";
import { revalidatePath } from "next/cache"; 

// 1. Vitrinde Gösterilecek Hizmetleri Çeker
export async function getPublicServices() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    select: { id: true, name: true, duration: true, price: true, description: true } 
  });
  return services.map(s => ({ ...s, price: Number(s.price) }));
}

// 2. Vitrinde Gösterilecek Personelleri Çeker
export async function getPublicStaff() {
  return await prisma.user.findMany({
    where: { 
      role: { in: ["STAFF", "ADMIN"] } // Personel veya Admin olanları getir
    },
    select: { id: true, name: true }
  });
}

// YENİ: 2.5. Calendar'da gösterilecek kapalı günleri getir
export async function getClosedDates(): Promise<{ closedDayOfWeeks: number[]; daysOffDates: string[] }> {
  try {
    // İşletme takviminden kapalı günleri getir (Pazar=0, Pazartesi=1, vb.)
    const workingDays = await prisma.workingDay.findMany({
      where: { isClosed: true },
      select: { dayOfWeek: true }
    });

    // Özel tatil günlerini getir
    const daysOff = await prisma.dayOff.findMany({
      select: { date: true }
    });

    // dayOfWeek listesi: pazar (0), pazartesi (1), ..., cumartesi (6)
    const closedDayOfWeeks = workingDays
      .filter(w => typeof w.dayOfWeek === 'number')
      .map(w => w.dayOfWeek);
    
    return {
      closedDayOfWeeks,
      daysOffDates: daysOff.map(d => d.date.toISOString().split('T')[0]) // "2024-02-20" formatı
    };
  } catch (error) {
    console.error('getClosedDates hatası:', error);
    return {
      closedDayOfWeeks: [],
      daysOffDates: []
    };
  }
}

// 3. Müşteriye PERSONEL BAZLI Müsait Saatleri Gösterir
export async function getPublicAvailableSlots(dateStr: string, serviceId: string, staffId: string) {
  if (!dateStr || !serviceId || !staffId) return [];

  const service = await prisma.service.findUnique({ where: { id: String(serviceId) } });
  if (!service) return [];

  const selectedDate = new Date(dateStr);
  
  // İşletme takviminde bu gün kapalı mı kontrol et
  const dayOfWeek = selectedDate.getDay(); // 0: Pazar, 1: Pazartesi, ...
  const workingDay = await prisma.workingDay.findUnique({
    where: { dayOfWeek }
  });
  
  // Gün kapalı ise müsait saat yok
  if (workingDay?.isClosed) {
    return [];
  }

  // WorkingDay'den gerçek mesai saatlerini oku
  const [startHourStr, startMinStr] = workingDay?.startTime.split(':') || ['09', '00'];
  const [endHourStr, endMinStr] = workingDay?.endTime.split(':') || ['18', '00'];
  const startHour = parseInt(startHourStr);
  const startMinute = parseInt(startMinStr);
  const endHour = parseInt(endHourStr);
  const endMinute = parseInt(endMinStr);
  const interval = 30; 

  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);

  // SADECE SEÇİLEN PERSONELİN RANDEVULARINI GETİR (Çakışmayı önler)
  const appointments = await prisma.appointment.findMany({
    where: {
      date: { gte: dayStart, lte: dayEnd },
      status: { not: "CANCELLED" },
      staffId: staffId, 
    },
  });

  const slots = [];
  let currentTime = setMinutes(setHours(selectedDate, startHour), startMinute);
  const endTime = setMinutes(setHours(selectedDate, endHour), endMinute);

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

    if (!isConflict && isBefore(new Date(), currentTime)) {
      slots.push(format(currentTime, "HH:mm"));
    }
    currentTime = addMinutes(currentTime, interval);
  }
  return slots;
}

// 4. Müşterinin Kendi Randevusunu Oluşturması (Personel Id ile)
export async function createPublicAppointment(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || ""; 
  const serviceId = formData.get("serviceId") as string;
  const staffId = formData.get("staffId") as string; // PERSONEL ID EKLENDİ
  const dateStr = formData.get("date") as string;
  const timeStr = formData.get("time") as string;

  if (!name || !email || !serviceId || !staffId || !dateStr || !timeStr) {
    return { success: false, error: "Lütfen tüm zorunlu alanları doldurun." };
  }

  try {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { 
          name, email, phone, role: "CUSTOMER",
          password: Math.random().toString(36).slice(-8) 
        }
      });
    }

    const [hours, minutes] = timeStr.split(":").map(Number);
    const startDate = setMinutes(setHours(new Date(dateStr), hours), minutes);

    // İşletme takviminde bu gün kapalı mı kontrol et (Arka uç doğrulaması)
    const dayOfWeek = startDate.getDay(); // 0: Pazar, 1: Pazartesi, ...
    const workingDay = await prisma.workingDay.findUnique({
      where: { dayOfWeek }
    });
    
    if (workingDay?.isClosed) {
      return { success: false, error: "İşletme bu gün kapalı. Lütfen açık bir gün seçin." };
    }

    // Çalışma saatleri kontrolü
    const [startHourStr, startMinStr] = workingDay?.startTime.split(':') || ['09', '00'];
    const [endHourStr, endMinStr] = workingDay?.endTime.split(':') || ['18', '00'];
    const workStartHour = parseInt(startHourStr);
    const workStartMinute = parseInt(startMinStr);
    const workEndHour = parseInt(endHourStr);
    const workEndMinute = parseInt(endMinStr);

    const appointmentStartMinutes = startDate.getHours() * 60 + startDate.getMinutes();
    const workStartMinutes = workStartHour * 60 + workStartMinute;
    const workEndMinutes = workEndHour * 60 + workEndMinute;

    if (appointmentStartMinutes < workStartMinutes || appointmentStartMinutes >= workEndMinutes) {
      return { success: false, error: `Seçilen saat çalışma saatleri dışında. Çalışma saatleri: ${workingDay?.startTime} - ${workingDay?.endTime}` };
    }

    const service = await prisma.service.findUnique({
      where: { id: String(serviceId) },
      include: { usages: { include: { product: true } } },
    });
    if (!service) return { success: false, error: "Hizmet bulunamadı." };

    const endDate = addMinutes(startDate, service.duration);

    // Hizmet bitiş saati çalışma saatleri içinde mi kontrol et
    const appointmentEndMinutes = endDate.getHours() * 60 + endDate.getMinutes();
    if (appointmentEndMinutes > workEndMinutes) {
      return { success: false, error: `Hizmet süresi çalışma saatlerini aşıyor. Çalışma saatleri: ${workingDay?.startTime} - ${workingDay?.endTime}` };
    }

    // PERSONEL BAZLI ÇAKIŞMA KONTROLÜ
    const conflict = await prisma.appointment.findFirst({
      where: {
        status: { not: "CANCELLED" },
        staffId: staffId,
        OR: [{ date: { lt: endDate }, endDate: { gt: startDate } }],
      },
    });

    if (conflict) {
      return { success: false, error: "Seçilen personelin bu saati az önce doldu, lütfen başka bir saat seçin." };
    }

    // Transaction: Randevu, ürün stok düşüşü ve gider kaydı
    await prisma.$transaction(async (tx) => {
      // 1. Randevu oluştur
      const appointment = await tx.appointment.create({
        data: {
          userId: user.id,
          serviceId,
          staffId,
          date: startDate,
          endDate: endDate,
          status: "PENDING",
        },
      });

      // 2. Ürünlerin adisyon kalemlerini ve giderlerini ekle, toplam maliyeti hesapla
      let toplamUrunMaliyeti = 0;
      for (const usage of service.usages) {
        const urunMaliyet = Number(usage.product.price) * usage.quantity;
        toplamUrunMaliyeti += urunMaliyet;
        // Stok düş
        await tx.product.update({
          where: { id: usage.productId },
          data: { stock: { decrement: usage.quantity } },
        });
        // Adisyon kalemi (ürün)
        await tx.appointmentItem.create({
          data: {
            appointmentId: appointment.id,
            name: usage.product.name,
            type: "PRODUCT",
            quantity: usage.quantity,
            unitPrice: usage.product.price,
            taxRate: usage.product.taxRate,
            totalPrice: urunMaliyet,
          },
        });
        // Gider kaydı
        await tx.expense.create({
          data: {
            title: `${service.name} için ${usage.product.name} kullanımı`,
            amount: urunMaliyet,
            date: new Date(),
          },
        });
      }

      // 3. Kar adisyon kalemi ekle (hizmet fiyatı - ürün maliyeti)
      const kar = Number(service.price) - toplamUrunMaliyeti;
      if (kar > 0) {
        await tx.appointmentItem.create({
          data: {
            appointmentId: appointment.id,
            name: "Kar",
            type: "SERVICE",
            quantity: 1,
            unitPrice: kar,
            taxRate: 0,
            totalPrice: kar,
          },
        });
      }
      // 4. Toplam tutar adisyon kalemi (görselde göstermek için isterseniz, yoksa frontendde hesaplanabilir)
      // await tx.appointmentItem.create({
      //   data: {
      //     appointmentId: appointment.id,
      //     name: "Toplam Tutar",
      //     type: "SERVICE",
      //     quantity: 1,
      //     unitPrice: Number(service.price),
      //     taxRate: 0,
      //     totalPrice: Number(service.price),
      //   },
      // });
    });
    revalidatePath("/admin/randevular");
    revalidatePath("/admin/dashboard");

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "İşlem sırasında bir hata oluştu." };
  }
}

// 5. Müşterinin E-posta ile Kendi Randevularını Sorgulaması
export async function getCustomerAppointments(email: string) {
  if (!email) return { success: false, error: "Lütfen bir e-posta adresi girin." };
  
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customerAppointments: { // BURASI GÜNCELLENDİ (İlişki adı değiştiği için)
          include: { service: true, staff: true }, // PERSONEL DETAYI DA EKLENDİ
          orderBy: { date: 'desc' } 
        }
      }
    });

    if (!user || user.customerAppointments.length === 0) {
      return { success: false, error: "Bu e-posta adresine ait bir randevu bulunamadı." };
    }

    const formattedAppointments = user.customerAppointments.map(appt => ({
      id: appt.id,
      serviceName: appt.service.name,
      staffName: appt.staff?.name || "Belirtilmedi",
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