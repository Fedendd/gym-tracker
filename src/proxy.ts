import { NextRequest, NextResponse } from "next/server"

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth")

  if (!isPublic) {
    // NextAuth v5 usa cookie "authjs.session-token" (HTTPS: "__Secure-authjs.session-token")
    const hasSession =
      req.cookies.has("authjs.session-token") ||
      req.cookies.has("__Secure-authjs.session-token") ||
      req.cookies.has("__Host-authjs.session-token")

    if (!hasSession) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
