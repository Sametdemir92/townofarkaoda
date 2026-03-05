// ============================================
// NextAuth Konfigurasyonu
// ============================================

import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 gun
  },
  pages: {
    signIn: "/auth/giris",
    newUser: "/auth/kayit",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Kullanici Adi", type: "text" },
        password: { label: "Sifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Kullanici adi ve sifre gerekli")
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        })

        if (!user) {
          throw new Error("Kullanici bulunamadi")
        }

        const isValid = await compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error("Sifre hatali")
        }

        return {
          id: user.id,
          name: user.username,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).username = token.username as string
      }
      return session
    },
  },
}
