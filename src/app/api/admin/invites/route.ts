import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const invites = await prisma.invite.findMany({
    where: { createdById: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(invites)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { email } = await req.json().catch(() => ({}))

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const invite = await prisma.invite.create({
    data: {
      email: email || null,
      createdById: session.user.id,
      expiresAt,
    },
  })

  return NextResponse.json(invite, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  await prisma.invite.deleteMany({
    where: { id, createdById: session.user.id },
  })

  return NextResponse.json({ ok: true })
}
