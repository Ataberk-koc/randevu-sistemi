import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  
  // Bu fonksiyon sunucuda çalışır (Backend API yazmaya gerek kalmadan!)
  async function loginAction(formData: FormData) {
    "use server"; 

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // 1. Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 2. Kullanıcı yoksa veya şifre yanlışsa
    if (!user || !(await compare(password, user.password))) {
      console.log("Hatalı giriş!");
      // Gerçek projede burada UI'ya hata mesajı döneriz, şimdilik console'a yazsın.
      return; 
    }

    // 3. Giriş Başarılı! Çerez oluştur.
    const cookieStore = await cookies();
    
    // Basit bir güvenlik önlemi: Sadece user ID'yi saklayalım.
    cookieStore.set("admin_session", user.id, { 
      httpOnly: true, // JavaScript ile erişilemesin (Güvenlik)
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 // 1 gün geçerli
    });

    // 4. Admin paneline ışınla
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <Card className="w-100 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Yönetici Girişi</CardTitle>
          <CardDescription className="text-center">
            Randevu sistemini yönetmek için giriş yapın.
          </CardDescription>
        </CardHeader>
        <form action={loginAction}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                defaultValue="admin@admin.com" // Test kolaylığı için dolu gelsin
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                defaultValue="123123" // Test kolaylığı için dolu gelsin
                required 
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Giriş Yap
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}