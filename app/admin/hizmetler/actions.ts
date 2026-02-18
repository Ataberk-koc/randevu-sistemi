"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getServices() {
  return await prisma.service.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function upsertService(formData: FormData) {
  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string) || 0;
  const duration = parseInt(formData.get("duration") as string) || 30; // Varsayılan 30 dk
  const description = formData.get("description") as string || "";

  const data = {
    name,
    price,
    duration,
    description,
    isActive: true,
  };

  try {
    if (id && id !== "undefined" && id !== "") {
      // GÜNCELLEME
      await prisma.service.update({
        where: { id },
        data,
      });
    } else {
      // YENİ KAYIT
      await prisma.service.create({
        data,
      });
    }

    revalidatePath("/admin/hizmetler");
    return { success: true };
  } catch (error) {
    console.error("Hizmet işlem hatası:", error);
    return { success: false, error: "İşlem başarısız oldu." };
  }
}

export async function deleteService(id: string) {
  try {
    await prisma.service.delete({ where: { id } });
    revalidatePath("/admin/hizmetler");
    return { success: true };
  } catch {
    return { success: false, error: "Silinemedi." };
  }
}