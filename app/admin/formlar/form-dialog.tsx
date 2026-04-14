"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlusCircle, Upload } from "lucide-react";
import { toast } from "sonner";

export function FormDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      const response = await fetch("/api/upload-form", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Bir hata oluştu");
      } else {
        toast.success("Form şablonu başarıyla eklendi!");
        setOpen(false);
        setFileName("");
        if (formRef.current) {
          formRef.current.reset();
        }
        // Sayfayı yenile
        window.location.reload();
      }
    } catch (error) {
      toast.error("Bir hata oluştu");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="w-4 h-4" />
          Yeni PDF Şablonu Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Form Şablonu Ekle</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Şablon Başlığı *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Örn: Lazer Epilasyon Onay Formu"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="İsteğe bağlı Not..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">PDF Dosyası *</Label>
            <div className="relative">
              <input
                id="file"
                name="file"
                type="file"
                accept=".pdf"
                required
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setFileName(file?.name || "");
                }}
                className="hidden"
              />
              <label
                htmlFor="file"
                className="flex items-center justify-center w-full px-4 py-8 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition"
              >
                <div className="text-center">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700">
                    {fileName || "PDF dosyası seçin"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Sadece PDF dosyaları</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
