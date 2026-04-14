"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function saveFormTemplate(formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const file = formData.get("file") as File;

    if (!title || !file) {
      return { error: "Başlık ve dosya gereklidir." };
    }

    // Dosya adını oluştur
    const fileName = `${Date.now()}-${file.name}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "forms");
    
    // Dizin oluştur (yoksa)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    const buffer = await file.arrayBuffer();
    
    await writeFile(filePath, Buffer.from(buffer));

    // Veritabanına kaydet
    const template = await prisma.formTemplate.create({
      data: {
        title,
        description: description || null,
        fileUrl: `/uploads/forms/${fileName}`,
        fileType: file.type,
      },
    });

    revalidatePath("/admin/formlar");
    return { success: true, template };
  } catch (error) {
    console.error("Form şablonu kaydedilirken hata:", error);
    return { error: "Dosya kaydedilirken hata oluştu." };
  }
}

export async function deleteFormTemplate(id: string) {
  try {
    const template = await prisma.formTemplate.delete({
      where: { id },
    });

    // Dosyayı sil (isteğe bağlı)
    // const filePath = path.join(process.cwd(), "public", template.fileUrl);
    // if (existsSync(filePath)) {
    //   await unlink(filePath);
    // }

    revalidatePath("/admin/formlar");
    return { success: true };
  } catch (error) {
    console.error("Form şablonu silinirken hata:", error);
    return { error: "Silme işlemi başarısız oldu." };
  }
}
