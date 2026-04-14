"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteStaff } from "./actions";
import { toast } from "sonner";

export function DeleteStaffButton({ id, disabled }: { id: string; disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Bu personeli silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      const result = await deleteStaff(id);
      if (result.success) {
        toast.success("Personel silindi.");
      } else {
        toast.error(result.error || "Silinemedi.");
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-500 hover:text-red-700 hover:bg-red-50"
      onClick={handleDelete}
      disabled={isPending || disabled}
      aria-label="Personeli Sil"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );
}
