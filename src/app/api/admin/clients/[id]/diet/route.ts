import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const { title, description, content } = await req.json()

  const note = await prisma.dietNote.upsert({
    where: { userId: id },
    create: {
      userId: id,
      title: title ?? "Piano alimentare",
      description: description ?? "",
      content: content ?? "",
      updatedById: session.user.id,
    },
    update: {
      title: title ?? "Piano alimentare",
      description: description ?? "",
      content: content ?? "",
      updatedById: session.user.id,
    },
  })

  return NextResponse.json(note)
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  if (session.user.role !== "ADMIN" && session.user.id !== id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const note = await prisma.dietNote.findUnique({ where: { userId: id } })
  return NextResponse.json(note ?? { title: "Piano alimentare", description: "", content: "" })
}
