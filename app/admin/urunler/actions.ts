"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Tüm ürünleri en yeniden en eskiye doğru getirir.
 */
export async function getProducts() {
  return await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Ürünü ID varsa günceller, yoksa yeni kayıt oluşturur.
 */
export async function upsertProduct(formData: FormData) {
  const id = formData.get("id") as string | null;
  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string) || 0;
  const stock = parseInt(formData.get("stock") as string) || 0;
  const description = formData.get("description") as string || "";
  
  // taxRate için varsayılan olarak 20 (KDV) atanır, formdan gelirse o kullanılır.
  const taxRateValue = formData.get("taxRate");
  const taxRate = taxRateValue ? parseFloat(taxRateValue as string) : 20;

  const data = {
    name,
    price,
    stock,
    description,
    taxRate,
    isActive: true, // Ürün varsayılan olarak aktif oluşturulur/güncellenir
  };

  try {
    if (id && id !== "undefined" && id !== "") {
      // GÜNCELLEME (Update)
      await prisma.product.update({
        where: { id },
        data,
      });
    } else {
      // YENİ KAYIT (Create)
      await prisma.product.create({
        data,
      });
    }

    revalidatePath("/admin/stok");
    return { success: true };
  } catch (error) {
    console.error("Ürün kaydedilirken hata oluştu:", error);
    return { success: false, error: "İşlem sırasında bir hata oluştu." };
  }
}

/**
 * Belirtilen ID'ye sahip ürünü siler.
 */
export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({ 
      where: { id } 
    });
    revalidatePath("/admin/stok");
    return { success: true };
  } catch (error) {
    console.error("Ürün silinirken hata oluştu:", error);
    return { success: false, error: "Ürün silinemedi." };
  }
}