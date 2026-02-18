// app/admin/musteriler/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getCustomers() {
  return await prisma.user.findMany({
    where: {
      role: Role.CUSTOMER // Sadece müşterileri getir
    },
    include: {
      appointments: {
        include: {
          service: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function createCustomer(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const email = formData.get("email") as string; // Email opsiyonel
  const address = formData.get("address") as string | null;

  try {
    await prisma.user.create({
      data: {
        name,
        phone,
        email: email || `${phone}@placeholder.com`,
        address: address || null,
        role: Role.CUSTOMER,
        password: "",
      },
    });
    revalidatePath("/admin/musteriler");
    return { success: true };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002" &&
      "meta" in error &&
      Array.isArray((error as { meta?: { target?: string[] } }).meta?.target) &&
      ((error as { meta?: { target?: string[] } }).meta?.target as string[]).includes("email")
    ) {
      return { success: false, message: "Bu e-posta adresiyle zaten bir kullanıcı var." };
    }
    return { success: false, message: "Bir hata oluştu. Lütfen tekrar deneyin." };
  }
}