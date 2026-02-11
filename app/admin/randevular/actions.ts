"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { addMinutes, isBefore, setHours, setMinutes, startOfDay, getDay } from "date-fns";

export async function getFormData() {
  const rawServices = await prisma.service.findMany({ where: { isActive: true } });
  const rawCustomers = await prisma.user.findMany(); 
  const services = rawServices.map(s => ({ ...s, price: Number(s.price), createdAt: s.createdAt.toISOString(), updatedAt: s.updatedAt.toISOString() }));
  const customers = rawCustomers.map(c => ({ ...c, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString() }));
  return { services, customers };
}

export async function getAppointments(date: Date) {
  const start = startOfDay(date);
  return await prisma.appointment.findMany({
    where: { date: { gte: start, lt: addMinutes(start, 1440) } },
    include: { user: true, service: true }
  });
}

export async function getAvailableSlots(dateStr: string, duration: number, buffer: number) {
  const date = new Date(dateStr);
  const workingDay = await prisma.workingDay.findUnique({ where: { dayOfWeek: getDay(date) } });
  if (!workingDay || workingDay.isClosed) return { slots: [], status: "CLOSED" };

  const [sh, sm] = workingDay.startTime.split(':').map(Number);
  const [eh, em] = workingDay.endTime.split(':').map(Number);
  let current = setMinutes(setHours(date, sh), sm);
  const end = setMinutes(setHours(date, eh), em);
  const appts = await getAppointments(date);
  const slots = [];

  while (isBefore(current, end)) {
    const sEnd = addMinutes(current, duration + buffer);
    if (isBefore(end, sEnd)) break;
    const overlap = appts.some(a => (current >= a.date && current < a.endDate) || (sEnd > a.date && sEnd <= a.endDate));
    if (!overlap) slots.push(current.toISOString());
    current = addMinutes(current, 30);
  }
  return { slots, status: slots.length > 0 ? "OPEN" : "FULL" };
}

export async function createAppointment(formData: FormData) {
  const sId = formData.get("serviceId") as string;
  const uId = formData.get("userId") as string;
  const dStr = formData.get("date") as string;
  const service = await prisma.service.findUnique({ where: { id: sId } });
  if (!service) return;
  const start = new Date(dStr);
  await prisma.appointment.create({ data: { date: start, endDate: addMinutes(start, service.duration), serviceId: sId, userId: uId, status: "APPROVED" } });
  revalidatePath("/admin/randevular");
}