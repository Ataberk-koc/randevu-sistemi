"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProducts() {
  return await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function upsertProduct(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string);
  const stock = parseInt(formData.get("stock") as string);
  const description = formData.get("description") as string;
  // Hatanın sebebi olan taxRate alanını ekliyoruz
  const taxRate = parseFloat(formData.get("taxRate") as string) || 20; 

  if (id) {
    await prisma.product.update({
      where: { id },
      data: { name, price, stock, description, taxRate },
    });
  } else {
    await prisma.product.create({
      data: { 
        name, 
        price, 
        stock, 
        description, 
        taxRate // Artık hata vermeyecek
      },
    });
  }

  revalidatePath("/admin/stok");
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/stok");
}