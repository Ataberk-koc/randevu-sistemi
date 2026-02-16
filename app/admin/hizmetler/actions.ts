// app/admin/hizmetler/action.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function upsertService(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string);
  const duration = parseInt(formData.get("duration") as string);
  const bufferTime = parseInt(formData.get("bufferTime") as string) || 0;
  
  // Dialog'dan gelen JSON formatındaki ürün listesini alıyoruz
  const usedProductsRaw = formData.get("usedProducts") as string;
  const usedProducts = JSON.parse(usedProductsRaw || "[]");

  // Hizmeti oluştur veya güncelle (Upsert)
  const service = await prisma.service.upsert({
    where: { id: id || "new_service" },
    update: {
      name,
      price,
      duration,
      bufferTime,
    },
    create: {
      name,
      price,
      duration,
      bufferTime,
    },
  });

  // Reçete (Hizmet-Ürün ilişkisi) senkronizasyonu
  // Önce bu hizmete ait eski ürün bağlarını siliyoruz
  await prisma.serviceProduct.deleteMany({
    where: { serviceId: service.id },
  });

  // Eğer ürün seçildiyse yeni bağları oluşturuyoruz
  if (usedProducts.length > 0) {
    await prisma.serviceProduct.createMany({
      data: usedProducts.map((p: { id: string, quantity: number }) => ({
        serviceId: service.id,
        productId: p.id,
        quantity: p.quantity,
      })),
    });
  }

  revalidatePath("/admin/hizmetler");
}

export async function deleteService(id: string) {
  await prisma.service.delete({
    where: { id },
  });

  revalidatePath("/admin/hizmetler");
}