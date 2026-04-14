"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Tüm Giderleri Getir (En yeniden eskiye)
export async function getExpenses() {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" }
  });
  
  // Decimal'i Number'a çeviriyoruz
  return expenses.map(exp => ({
    ...exp,
    amount: Number(exp.amount)
  }));
}

// Yeni Manuel Gider Ekle
export async function createExpense(formData: FormData) {
  const title = formData.get("title") as string;
  const amountStr = formData.get("amount") as string;
  const description = formData.get("description") as string;

  if (!title || !amountStr) return { success: false, error: "Lütfen başlık ve tutar girin." };

  try {
    await prisma.expense.create({
      data: {
        title,
        amount: parseFloat(amountStr),
        description,
        category: "MANUAL",
      }
    });

    revalidatePath("/admin/giderler");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch  {
    return { success: false, error: "Gider eklenemedi." };
  }
}

// Gider Sil
export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({ where: { id } });
    revalidatePath("/admin/giderler");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Silme işlemi başarısız." };
  }
}