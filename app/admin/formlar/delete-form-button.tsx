"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteFormTemplate } from "./actions";
import { toast } from "sonner";
import { useState } from "react";

export function DeleteFormButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Bu form şablonunu silmek istediğinize emin misiniz?")) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteFormTemplate(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Form şablonu başarıyla silindi!");
      }
    } catch (error) {
      toast.error("Silme işlemi başarısız oldu");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      className="w-full gap-2 text-xs"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 className="w-3 h-3" />
      {loading ? "Siliniyor..." : "Sil"}
    </Button>
  );
}
