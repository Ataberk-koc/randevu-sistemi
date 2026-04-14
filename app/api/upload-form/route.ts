import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const file = formData.get("file") as File;

    if (!title || !file) {
      return NextResponse.json(
        { error: "Başlık ve dosya gereklidir." },
        { status: 400 }
      );
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

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error("Form şablonu kaydedilirken hata:", error);
    return NextResponse.json(
      { error: "Dosya kaydedilirken hata oluştu." },
      { status: 500 }
    );
  }
}
