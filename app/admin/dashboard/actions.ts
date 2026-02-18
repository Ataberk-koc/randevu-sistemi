// app/admin/dashboard/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";
import { Role } from "@prisma/client";

export async function getDashboardStats() {
  const today = new Date();
  
  // 1. Bugünün randevu sayısı
  const todayAppointmentsCount = await prisma.appointment.count({
    where: {
      date: {
        gte: startOfDay(today),
        lte: endOfDay(today),
      },
    },
  });

  // 2. Yaklaşan 5 randevu
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      date: { gte: today },
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
        gte: startOfDay(today),
        lte: endOfDay(today),
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