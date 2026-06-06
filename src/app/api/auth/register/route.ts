import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const { name, email, password, inviteToken } = await req.json()

  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Email e password (min 6 caratteri) sono obbligatori" },
      { status: 400 }
    )
  }

  if (!inviteToken) {
    return NextResponse.json(
      { error: "Serve un link di invito per registrarsi" },
      { status: 403 }
    )
  }

  const invite = await prisma.invite.findUnique({ where: { token: inviteToken } })
  if (!invite) {
    return NextResponse.json({ error: "Link di invito non valido" }, { status: 403 })
  }
  if (invite.usedAt) {
    return NextResponse.json({ error: "Questo link di invito è già stato usato" }, { status: 403 })
  }
  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Questo link di invito è scaduto" }, { status: 403 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email già registrata" }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: { name: name || null, email, hashedPassword, role: "USER" },
    }),
    prisma.invite.update({
      where: { token: inviteToken },
      data: { usedAt: new Date() },
    }),
  ])

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
}
