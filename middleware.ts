import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    // İstersen burada ekstra kontroller yapabilirsin
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Token varsa kullanıcı giriş yapmış demektir
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  // Sadece admin altındaki sayfaları koru
  matcher: ["/admin/:path*"],
};