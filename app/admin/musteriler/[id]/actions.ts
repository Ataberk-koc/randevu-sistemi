// app/admin/musteriler/[id]/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteCustomer(id: string) {
  // First, delete all appointments for this user (to avoid FK constraint error)
  await prisma.appointment.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/musteriler");
}

export async function updateCustomer(id: string, data: { name?: string; phone?: string; email?: string; address?: string }) {
  await prisma.user.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/musteriler");
}
