// app/admin/formlar/page.tsx
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { FormTemplate } from "@prisma/client";
import Link from "next/link";
import { FormDialog } from "./form-dialog";
import { DeleteFormButton } from "./delete-form-button";

export default async function FormTemplatesPage() {
  // Veritabanından yüklenen şablonları çekiyoruz
  const templates = await prisma.formTemplate.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Form & Doküman Şablonları</h1>
          <p className="text-muted-foreground mt-2">
            İşletmenizde kullandığınız hazır PDF formlarını, onam belgelerini veya sözleşmeleri buradan yönetin.
          </p>
        </div>
        
        {/* PDF Yükleme Dialog'ını tetikleyecek buton */}
        <FormDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {templates.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300">
            <FileText className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Henüz bir form şablonu yüklenmedi.</p>
          </div>
        ) : (
          templates.map((template: FormTemplate) => (
            <div key={template.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-red-100 p-2 rounded-lg text-red-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 line-clamp-2">{template.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(template.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </div>
              
              {template.description && (
                <p className="text-sm text-slate-600 mb-4 flex-1 line-clamp-2">{template.description}</p>
              )}

              <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-slate-100">
                <div className="flex gap-2">
                  {/* PDF'i yeni sekmede açmak için */}
                  <Link href={template.fileUrl} target="_blank" className="flex-1">
                    <Button variant="outline" className="w-full gap-2 text-xs" size="sm">
                      <Eye className="w-3 h-3" />
                      Görüntüle
                    </Button>
                  </Link>
                  
                  {/* Cihaza indirmek için (download attribute'u ile) */}
                  <Link href={template.fileUrl} download className="flex-1">
                    <Button className="w-full gap-2 text-xs bg-slate-900" size="sm">
                      <Download className="w-3 h-3" />
                      İndir
                    </Button>
                  </Link>
                </div>
                
                {/* Silme Butonu */}
                <DeleteFormButton id={template.id} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}