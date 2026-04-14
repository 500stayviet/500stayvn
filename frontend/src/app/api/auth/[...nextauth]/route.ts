import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

// NextAuth 타입 확장
declare module "next-auth" {
  interface User {
    id?: string;
  }
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

const providers = [];
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    })
  );
}
// 운영 환경에서 OAuth 키가 비어 있으면 providers=[]가 되어 /api/auth/session 이 500으로 실패할 수 있다.
// 안전 fallback provider를 항상 하나 추가해 NextAuth 초기화 실패를 방지한다.
providers.push(
  CredentialsProvider({
    name: "Credentials",
    credentials: {},
    async authorize() {
      return null;
    },
  })
);

function resolveNextAuthSecret(): string {
  const explicit = process.env.NEXTAUTH_SECRET?.trim();
  if (explicit) return explicit;
  const adminSecret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (adminSecret) return adminSecret;
  const fromDb = process.env.DATABASE_URL?.trim();
  if (fromDb) {
    return createHash("sha256").update(fromDb).digest("hex");
  }
  return "500stayviet-fallback-auth-secret";
}

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  secret: resolveNextAuthSecret(),
  pages: {
    signIn: '/login',
  },
  /** debug_enabled 경고 방지. 디버그가 필요하면 .env에 NEXTAUTH_DEBUG=true */
  debug: process.env.NEXTAUTH_DEBUG === "true",
});

export { handler as GET, handler as POST };
