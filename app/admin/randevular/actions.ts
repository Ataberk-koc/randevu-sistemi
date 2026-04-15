"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { addMinutes, setHours, setMinutes, format, isBefore, startOfDay, endOfDay } from "date-fns";
import { sendEmail } from "@/lib/mail"; 
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
  let currentTime = setMinutes(setHours(selectedDate, startHour), startMinute);
  const endTime = setMinutes(setHours(selectedDate, endHour), endMinute);

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

  const service = await prisma.service.findUnique({ where: { id: String(serviceId) } });
  if (!service) return { success: false, error: "Hizmet bulunamadı." };

  const endDate = addMinutes(startDate, service.duration);

  // Hizmet bitiş saati çalışma saatleri içinde mi kontrol et
  const appointmentEndMinutes = endDate.getHours() * 60 + endDate.getMinutes();
  if (appointmentEndMinutes > workEndMinutes) {
    return { success: false, error: `Hizmet süresi çalışma saatlerini aşıyor. Çalışma saatleri: ${workingDay?.startTime} - ${workingDay?.endTime}` };
  }

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

  // İşletme takviminde bu gün kapalı mı kontrol et (Arka uç doğrulaması)
  const dayOfWeek = newStartDate.getDay(); // 0: Pazar, 1: Pazartesi, ...
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

  const appointmentStartMinutes = newStartDate.getHours() * 60 + newStartDate.getMinutes();
  const workStartMinutes = workStartHour * 60 + workStartMinute;
  const workEndMinutes = workEndHour * 60 + workEndMinute;

  if (appointmentStartMinutes < workStartMinutes || appointmentStartMinutes >= workEndMinutes) {
    return { success: false, error: `Seçilen saat çalışma saatleri dışında. Çalışma saatleri: ${workingDay?.startTime} - ${workingDay?.endTime}` };
  }

  const service = await prisma.service.findUnique({
    where: { id: String(serviceId) },
  });

  if (!service) throw new Error("Hizmet bulunamadı.");

  const newEndDate = addMinutes(newStartDate, service.duration);

  // Hizmet bitiş saati çalışma saatleri içinde mi kontrol et
  const appointmentEndMinutes = newEndDate.getHours() * 60 + newEndDate.getMinutes();
  if (appointmentEndMinutes > workEndMinutes) {
    return { success: false, error: `Hizmet süresi çalışma saatlerini aşıyor. Çalışma saatleri: ${workingDay?.startTime} - ${workingDay?.endTime}` };
  }

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

// RANDEVU TAMAMLAMA (STOK DÜŞME VE OTOMATİK GİDER YAZMA EKLENDİ)
export async function completeAppointment(id: string) {
  try {
    // 1. Randevuyu ve içindeki hizmetin kullandığı ürünleri (usages) çekiyoruz
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { 
        service: {
          include: { usages: { include: { product: true } } }
        }
      }
    });

    if (!appointment) return { success: false, error: "Randevu bulunamadı." };

    // 2. Randevunun durumunu "COMPLETED" yap
    await prisma.appointment.update({
      where: { id },
      data: { status: "COMPLETED" },
    });

    // 3. Kullanılan ürünler varsa Stoktan düş ve Giderek yaz
    if (appointment.service.usages && appointment.service.usages.length > 0) {
      for (const usage of appointment.service.usages) {
        
        // A) Stoktan Düş
        await prisma.product.update({
          where: { id: usage.product.id },
          data: { stock: { decrement: usage.quantity } }
        });

        // B) Gider (Expense) Tablosuna Yaz
        // (Ürünün price değerini maliyet kabul ediyoruz. Eğer gerçek maliyeti
        // farklıysa ileride Product tablosuna 'cost' diye bir alan eklenebilir)
        const expenseAmount = Number(usage.product.price) * usage.quantity;
        
        await prisma.expense.create({
          data: {
            title: `Otomatik Gider: ${usage.product.name} (Adet: ${usage.quantity})`,
            amount: expenseAmount,
            category: "AUTO", // Sistem tarafından otomatik eklendiğini belirtir
            description: `${appointment.service.name} hizmeti tamamlandığı için stoktan düşüldü.`,
          }
        });
      }
    }
    
    revalidatePath("/admin/randevular");
    revalidatePath("/admin/giderler"); // Yeni yapacağımız gider sayfasını da tetikle
    revalidatePath("/admin/dashboard"); // Dashboard'u tetikle
    
    return { success: true };
  } catch (error) {
    console.error("Hata:", error);
    return { success: false, error: "İşlem başarısız." };
  }
}

export async function approveAppointment(id: string) {
  try {
    // 1. Randevuyu güncelle ve müşteri bilgilerini çek
    const appt = await prisma.appointment.update({
      where: { id },
      data: { status: "APPROVED" },
      include: { user: true, service: true }, // Mail atabilmek için detayları getir
    });

    // 2. E-Posta Gönder
    const formattedDate = format(new Date(appt.date), "d MMMM yyyy HH:mm");
    await sendEmail({
      to: appt.user.email,
      subject: "Randevunuz Onaylandı! ✅",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #059669;">Randevunuz Onaylandı!</h2>
          <p>Merhaba <strong>${appt.user.name || 'Değerli Müşterimiz'}</strong>,</p>
          <p><strong>${appt.service.name}</strong> hizmeti için oluşturduğunuz randevu talebiniz başarıyla onaylanmıştır.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;">📅 <strong>Tarih & Saat:</strong> ${formattedDate}</p>
            <p style="margin: 0;">💰 <strong>Tutar:</strong> ${appt.service.price} ₺</p>
          </div>
          <p>Sizi işletmemizde görmek için sabırsızlanıyoruz. Herhangi bir değişiklik için bizimle iletişime geçebilirsiniz.</p>
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">Saygılarımızla,<br/>ATA Kreatif Merkezi</p>
        </div>
      `,
    });

    revalidatePath("/admin/randevular");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "İşlem başarısız." };
  }
}

// RANDEVUYU İPTAL ETME/REDDETME (-> CANCELLED) + E-POSTA
export async function cancelAppointment(id: string) {
  try {
    // 1. Randevuyu iptal et ve müşteri bilgilerini çek
    const appt = await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { user: true, service: true },
    });

    // 2. E-Posta Gönder
    const formattedDate = format(new Date(appt.date), "d MMMM yyyy HH:mm");
    await sendEmail({
      to: appt.user.email,
      subject: "Randevunuz İptal Edildi ❌",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #dc2626;">Randevu İptali</h2>
          <p>Merhaba <strong>${appt.user.name || 'Değerli Müşterimiz'}</strong>,</p>
          <p>Üzülerek bildiririz ki <strong>${formattedDate}</strong> tarihli <strong>${appt.service.name}</strong> randevunuz işletmemiz tarafından iptal edilmiştir.</p>
          <p>Uygun olan farklı bir gün veya saat için web sitemizden yeniden randevu oluşturabilirsiniz.</p>
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">Saygılarımızla,<br/>ATA Kreatif Merkezi</p>
        </div>
      `,
    });

    revalidatePath("/admin/randevular");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "İşlem başarısız." };
  }
}