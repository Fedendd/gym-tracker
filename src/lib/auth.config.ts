import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

// Config leggera senza adapter Prisma — usata nel proxy (Edge Runtime)
export const authConfig: NextAuthConfig = {
  providers: [
    // Il provider Credentials è dichiarato qui ma la verifica
    // avviene in auth.ts dove Prisma è disponibile
    Credentials({ credentials: { email: {}, password: {} } }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isPublic =
        nextUrl.pathname.startsWith("/auth") ||
        nextUrl.pathname.startsWith("/api/auth")
      if (!isLoggedIn && !isPublic) return false
      return true
    },
  },
}
