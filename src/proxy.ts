import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth")

  if (!isPublic) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET })
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
