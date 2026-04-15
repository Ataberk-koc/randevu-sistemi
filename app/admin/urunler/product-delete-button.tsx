"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { deleteProduct } from "./actions";
import { toast } from "sonner";

interface ProductDeleteButtonProps {
  productId: string;
  productName: string;
}

export function ProductDeleteButton({
  productId,
  productName,
}: ProductDeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const result = await deleteProduct(productId);
      if (result.success) {
        toast.success("Ürün başarıyla silindi.");
        setOpen(false);
      } else {
        toast.error(result.error || "Ürün silinemedi.");
      }
    } catch {
      toast.error("Sistemsel bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Ürünü Sil</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600">
              <strong>{productName}</strong> ürününü silmek istediğinize emin misiniz?
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Bu işlem geri alınamaz.
            </p>
          </div>
          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              İptal Et
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
