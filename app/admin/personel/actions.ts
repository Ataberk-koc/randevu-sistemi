
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Personel Güncelle
export async function updateStaff({ id, name, email, phone }: { id: string; name: string; email: string; phone?: string }) {
  if (!id || !name || !email) {
    return { success: false, error: "Lütfen tüm alanları doldurun." };
  }
  try {
    await prisma.user.update({
      where: { id },
      data: { name, email, phone },
    });
    revalidatePath("/admin/personel");
    return { success: true };
  } catch {
    return { success: false, error: "Personel güncellenemedi." };
  }
}

// Personelleri Getir (STAFF ve ADMIN olanlar)
export async function getStaffList() {
  return await prisma.user.findMany({
    where: { 
      role: { in: ["STAFF", "ADMIN"] } 
    },
    orderBy: { createdAt: "desc" }
  });
}

// Yeni Personel Ekle
export async function createStaff(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !phone || !password) {
    return { success: false, error: "Lütfen tüm alanları doldurun." };
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] }
    });

    if (existing) {
      return { success: false, error: "Bu e-posta veya telefon numarası zaten kullanımda." };
    }

    await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password, // Gerçek bir projede bcrypt ile şifrelenmeli
        role: "STAFF" // Rolü otomatik Personel yapıyoruz
      }
    });

    revalidatePath("/admin/personel");
    return { success: true };
  } catch {
    return { success: false, error: "Personel eklenirken bir hata oluştu." };
  }
}

// Personel Sil
export async function deleteStaff(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/personel");
    return { success: true };
  } catch {
    return { success: false, error: "Personel silinemedi. Üzerinde randevu olabilir." };
  }
}