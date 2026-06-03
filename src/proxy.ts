import { NextRequest, NextResponse } from "next/server"

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth")

  if (!isPublic) {
    const allCookies = [...req.cookies.getAll()].map(c => c.name)
    console.log("[PROXY]", pathname, "cookies:", allCookies.join(", ") || "NESSUNO")

    const hasSession =
      req.cookies.has("authjs.session-token") ||
      req.cookies.has("__Secure-authjs.session-token") ||
      req.cookies.has("__Host-authjs.session-token")

    console.log("[PROXY] hasSession:", hasSession)

    if (!hasSession) {
      console.log("[PROXY] redirect a signin")
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
