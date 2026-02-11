"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createService(formData: FormData) {
  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string);
  const duration = parseInt(formData.get("duration") as string);
  const bufferTime = parseInt(formData.get("bufferTime") as string);

  await prisma.service.create({
    data: {
      name,
      price,
      duration,
      bufferTime,
    },
  });

  revalidatePath("/admin/services");
}

export async function deleteService(id: string) {
  await prisma.service.delete({
    where: { id },
  });

  revalidatePath("/admin/services");
}