"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function getDashboardStats() {
  const today = new Date();
  
  // Bugünün randevu sayısı
  const todayAppointmentsCount = await prisma.appointment.count({
    where: {
      date: {
        gte: startOfDay(today),
        lte: endOfDay(today),
      },
    },
  });

  // Yaklaşan 5 randevu
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

  // Toplam Hizmet Sayısı
  const totalServices = await prisma.service.count({
    where: { isActive: true }
  });

  // Bugünün tahmini kazancı
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

  return {
    todayAppointmentsCount,
    upcomingAppointments,
    totalServices,
    todayEarning
  };
}