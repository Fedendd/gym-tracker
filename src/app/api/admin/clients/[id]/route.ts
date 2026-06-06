import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const client = await prisma.user.findUnique({
    where: { id, role: "USER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      createdAt: true,
      dietNote: { select: { title: true, description: true, content: true, updatedAt: true } },
      programs: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, weeks: true, isActive: true, createdAt: true },
      },
      workoutSessions: {
        orderBy: { date: "desc" },
        take: 10,
        select: {
          id: true,
          date: true,
          durationMins: true,
          completed: true,
          program: { select: { name: true } },
          programDay: { select: { name: true } },
        },
      },
      cardioSessions: {
        orderBy: { date: "desc" },
        take: 5,
        select: { id: true, date: true, type: true, durationMins: true, distanceKm: true },
      },
      personalRecords: {
        select: {
          weight: true,
          reps: true,
          date: true,
          exercise: { select: { nameIt: true, name: true } },
        },
        orderBy: { date: "desc" },
        take: 10,
      },
    },
  })

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(client)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const { name, phone, dateOfBirth } = await req.json()

  const updated = await prisma.user.update({
    where: { id, role: "USER" },
    data: {
      name: name ?? undefined,
      phone: phone ?? null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    },
    select: { id: true, name: true, email: true, phone: true, dateOfBirth: true },
  })

  return NextResponse.json(updated)
}
