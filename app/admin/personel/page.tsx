import { getStaffList } from "./actions";
import { StaffDialog } from "./staff-dialog";
import { EditStaffDialog } from "./edit-staff-dialog";
import { DeleteStaffButton } from "./DeleteStaffButton";
import { User, Mail, Phone, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default async function StaffPage() {
  const staffList = await getStaffList();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Personel Yönetimi</h1>
          <p className="text-slate-500">İşletmenizde çalışan uzmanları ve yetkilileri yönetin.</p>
        </div>
        <StaffDialog />
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Personel</th>
                <th className="px-6 py-4">İletişim</th>
                <th className="px-6 py-4">Kayıt Tarihi</th>
                <th className="px-6 py-4">Yetki</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Henüz hiç personel eklenmemiş.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {staff.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-900">{staff.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-3.5 h-3.5" /> {staff.email}
                      </div>
                      {staff.phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="w-3.5 h-3.5" /> {staff.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {format(new Date(staff.createdAt), "d MMM yyyy", { locale: tr })}
                    </td>
                    <td className="px-6 py-4">
                      {staff.role === "ADMIN" ? (
                        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Yönetici
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                          <User className="w-3.5 h-3.5" /> Uzman (Personel)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      <EditStaffDialog staff={staff} />
                      {/* Admin kendisini yanlışlıkla silmesin diye kontrol */}
                      {staff.role !== "ADMIN" && (
                        <DeleteStaffButton id={staff.id} />
                      )}
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