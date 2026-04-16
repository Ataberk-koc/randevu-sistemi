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
  const duration = parseInt(formData.get("duration") as string) || 30;
  const description = formData.get("description") as string || "";

  // Ürünler (çoklu)
  const products: { id: string; quantity: number }[] = [];
  for (const [key, value] of formData.entries()) {
    const match = key.match(/^products\[(\d+)\]\[(id|quantity)\]$/);
    if (match) {
      const idx = parseInt(match[1]);
      const field = match[2];
      if (!products[idx]) products[idx] = { id: "", quantity: 1 };
      if (field === "id") products[idx].id = value as string;
      if (field === "quantity") products[idx].quantity = parseInt(value as string) || 1;
    }
  }

  const data = {
    name,
    price,
    duration,
    description,
    isActive: true,
  };

  try {
    let service;
    if (id && id !== "undefined" && id !== "") {
      // GÜNCELLEME
      service = await prisma.service.update({
        where: { id },
        data,
      });
      // Eski ilişkileri sil
      await prisma.serviceProduct.deleteMany({ where: { serviceId: id } });
    } else {
      // YENİ KAYIT
      service = await prisma.service.create({ data });
    }

    // Ürün ilişkilerini ekle
    if (service && products.length > 0) {
      await prisma.serviceProduct.createMany({
        data: products.map((prod) => ({
          serviceId: service.id,
          productId: prod.id,
          quantity: prod.quantity,
        })),
      });
    }

    revalidatePath("/admin/hizmetler");
    return { success: true };
  } catch (error) {
    console.error("Hizmet işlem hatası:", error);
    return { success: false, error: "İşlem başarısız oldu." };
  }
}

export async function deleteService(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  try {
    await prisma.service.delete({ where: { id } });
    revalidatePath("/admin/hizmetler");
  } catch (error) {
    console.error("Silme hatası:", error);
    throw new Error("Silinemedi.");
  }
}