import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export const maxDuration = 60;

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
    const fileName = `forms/${Date.now()}-${file.name}`;
    const buffer = await file.arrayBuffer();

    // Vercel Blob'a yükle
    const blob = await put(fileName, Buffer.from(buffer), {
      access: "public",
      contentType: file.type,
    });

    // Veritabanına kaydet
    const template = await prisma.formTemplate.create({
      data: {
        title,
        description: description || null,
        fileUrl: blob.url,
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
