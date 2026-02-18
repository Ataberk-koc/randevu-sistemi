"use client";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteCustomer } from "./actions";
import { useRouter } from "next/navigation";

export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm("Bu müşteriyi silmek istediğinize emin misiniz?")) {
      startTransition(async () => {
        await deleteCustomer(customerId);
        router.push("/admin/musteriler");
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs"
    >
      <Trash2 className="w-4 h-4" /> Sil
    </button>
  );
}
