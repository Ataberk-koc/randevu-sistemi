// app/admin/dashboard/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { Role } from "@prisma/client";

export async function getDashboardStats() {
  // Yerel saat ile bugünün başını ve sonunu hesapla
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  
  // Yerel saat ile gün başı (00:00:00)
  const todayStart = new Date(year, month, date, 0, 0, 0, 0);
  // Yerel saat ile gün sonu (23:59:59)
  const todayEnd = new Date(year, month, date, 23, 59, 59, 999);
  
  // 1. Bugünün randevu sayısı
  const todayAppointmentsCount = await prisma.appointment.count({
    where: {
      date: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  // 2. Yaklaşan 5 randevu
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      date: { gte: now },
    },
    take: 5,
    include: {
      user: true,
      service: true,
    },
    orderBy: { date: 'asc' },
  });

  // 3. Toplam Hizmet Sayısı
  const totalServices = await prisma.service.count({
    where: { isActive: true }
  });

  // 4. Bugünün tahmini kazancı
  const todayAppointments = await prisma.appointment.findMany({
    where: {
      date: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    include: { service: true }
  });

  const todayEarning = todayAppointments.reduce((sum, appt) => {
    return sum + Number(appt.service.price);
  }, 0);

  // 5. Toplam Müşteri Sayısı (Sadece CUSTOMER rolündekiler)
  const totalCustomers = await prisma.user.count({
    where: {
      role: Role.CUSTOMER
    }
  });

  // 6. Kritik Stoktaki Ürünler (Stoku 5 veya daha az olanlar)
  const lowStockProducts = await prisma.product.findMany({
    where: {
      stock: {
        lte: 5
      },
      isActive: true
    }
  });

  // 7. Son Kayıt Olan 5 Müşteri
  const latestCustomers = await prisma.user.findMany({
    where: {
      role: Role.CUSTOMER
    },
    take: 5,
    orderBy: {
      createdAt: 'desc'
    }
  });

  return {
    todayAppointmentsCount,
    upcomingAppointments,
    totalServices,
    todayEarning,
    totalCustomers,
    lowStockProducts,
    latestCustomers // Dashboard'da listelemek için eklendi
  };
}