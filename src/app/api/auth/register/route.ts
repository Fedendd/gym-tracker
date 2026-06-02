import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()

  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Email e password (min 6 caratteri) sono obbligatori" },
      { status: 400 }
    )
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email già registrata" }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name: name || null, email, hashedPassword },
  })

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
}
