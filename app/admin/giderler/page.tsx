import { getExpenses, deleteExpense, createExpense } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Trash2, ArrowDownCircle, Bolt, Banknote } from "lucide-react";

export default async function ExpensesPage() {
  const expenses = await getExpenses();

  // Toplam Gider Hesaplama
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Giderler & Maliyetler</h1>
          <p className="text-slate-500">İşletme giderlerinizi ve otomatik stok maliyetlerinizi takip edin.</p>
        </div>
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 flex items-center gap-3">
          <Banknote className="w-8 h-8 opacity-80" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">Toplam Gider</p>
            <p className="text-2xl font-extrabold">{totalExpense.toLocaleString('tr-TR')} ₺</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* SOL: YENİ GİDER EKLEME FORMU */}
        <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-red-500" /> Manuel Gider Ekle
          </h2>
          <form action={async (formData) => {
            "use server";
            await createExpense(formData);
          }} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Gider Başlığı</label>
              <Input name="title" required placeholder="Örn: Elektrik Faturası" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tutar (₺)</label>
              <Input name="amount" type="number" step="0.01" required placeholder="500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Açıklama (Opsiyonel)</label>
              <Input name="description" placeholder="Örn: Şubat Ayı" />
            </div>
            <Button className="w-full bg-slate-900 hover:bg-slate-800">Gideri Kaydet</Button>
          </form>
        </div>

        {/* SAĞ: GİDERLER LİSTESİ */}
        <div className="md:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-slate-600 font-medium">
              <tr>
                <th className="px-4 py-3">Tarih</th>
                <th className="px-4 py-3">Gider Adı</th>
                <th className="px-4 py-3">Tür</th>
                <th className="px-4 py-3 text-right">Tutar</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-slate-500">Henüz hiç gider kaydı yok.</td></tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">
                      {format(expense.date, "d MMM yyyy", { locale: tr })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{expense.title}</p>
                      {expense.description && <p className="text-xs text-slate-500">{expense.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {expense.category === "AUTO" ? (
                        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold">
                          <Bolt className="w-3 h-3" /> Sistem
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">
                          Manuel
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">
                      - {expense.amount} ₺
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={async () => { "use server"; await deleteExpense(expense.id); }}>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}