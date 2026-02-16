import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";

// NextAuth tiplerini role alanını tanıyacak şekilde genişletiyoruz
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Giriş Yap",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Şifre", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Lütfen email ve şifrenizi girin.");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("Kullanıcı bulunamadı.");
        }

        // Eğer şifreleri hashli tutuyorsan (önerilen):
        const isPasswordCorrect = await compare(credentials.password, user.password);
        
        // Eğer veritabanında şifreler şimdilik düz metinse (test için):
        // const isPasswordCorrect = credentials.password === user.password;

        if (!isPasswordCorrect) {
          throw new Error("Hatalı şifre.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role, // Prisma şemandaki role alanı
        };
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };