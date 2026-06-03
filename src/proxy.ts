import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth")

  if (!isPublic) {
    // NextAuth v5 usa "authjs.session-token" (non "next-auth.session-token" di v4)
    // Su HTTPS (produzione) il cookie ha il prefisso __Secure-
    const secure = req.nextUrl.protocol === "https:"
    const cookieName = secure
      ? "__Secure-authjs.session-token"
      : "authjs.session-token"

    const token = await getToken({ req, secret: process.env.AUTH_SECRET, cookieName })
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
