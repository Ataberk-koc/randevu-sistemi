// app/admin/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Scissors, 
  Package, 
  Settings, 
  LogOut,
  User
} from "lucide-react";
import { cn } from "@/lib/utils"; // Shadcn'den gelen sınıf birleştirici
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Menü elemanları
  const menuItems = [
    {
      title: "Özet (Dashboard)",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Randevu Takvimi",
      href: "/admin/randevular",
      icon: CalendarDays,
    },
    {
      title: "Hizmet Yönetimi",
      href: "/admin/hizmetler",
      icon: Scissors,
    },
    {
      title: "Ürün & Stok",
      href: "/admin/urunler",
      icon: Package,
    },
    {
      title: "Ayarlar",
      href: "/admin/ayarlar",
      icon: Settings,
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* SOL MENÜ (SIDEBAR) */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold tracking-tight text-blue-400">RandevuSistemi</h2>
          <p className="text-xs text-slate-400 mt-1">Yönetim Paneli</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
               <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium">Süper Admin</p>
              <p className="text-xs text-slate-400">Yönetici</p>
            </div>
          </div>
          
          <Link href="/">
             <Button variant="destructive" className="w-full gap-2" size="sm">
                <LogOut className="w-4 h-4" />
                Çıkış Yap
             </Button>
          </Link>
        </div>
      </aside>

      {/* SAĞ TARAF (İÇERİK ALANI) */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
      <Toaster position="top-right" />
    </div>
  );
}