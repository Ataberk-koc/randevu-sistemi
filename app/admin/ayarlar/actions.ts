// app/admin/ayarlar/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveSettings(formData: FormData) {
  // 0'dan 6'ya kadar günleri döngüyle al (Pazar=0, ... Cmt=6)
  for (let i = 0; i <= 6; i++) {
    const startTime = formData.get(`startTime-${i}`) as string;
    const endTime = formData.get(`endTime-${i}`) as string;
    
    // Checkbox işaretliyse "on" değeri gelir, işaretli değilse null gelir.
    const isClosed = formData.get(`isClosed-${i}`) === "on";

    // Veritabanını güncelle
    await prisma.workingDay.update({
      where: { dayOfWeek: i },
      data: {
        startTime,
        endTime,
        isClosed,
      },
    });
  }

  // İşlem bitince sayfayı yenile ki kullanıcı yeni saatleri görsün
  revalidatePath("/admin/ayarlar");
}