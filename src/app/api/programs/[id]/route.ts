import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getProgram(id: string, userId: string) {
  return prisma.program.findFirst({
    where: { id, OR: [{ userId }, { createdById: userId }] },
    include: {
      days: {
        include: { exercises: { include: { exercise: true }, orderBy: { order: "asc" } } },
        orderBy: { dayNumber: "asc" },
      },
    },
  })
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const program = await getProgram(id, session.user.id)
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(program)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const existing = await getProgram(id, session.user.id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()

  if (body.isActive) {
    await prisma.program.updateMany({
      where: { userId: existing.userId, isActive: true, id: { not: id } },
      data: { isActive: false },
    })
  }

  // Replace days: delete all existing, recreate
  await prisma.programDay.deleteMany({ where: { programId: id } })

  const program = await prisma.program.update({
    where: { id },
    data: {
      name: body.name,
      weeks: body.weeks ?? existing.weeks,
      isActive: body.isActive ?? existing.isActive,
      weeklyRules: body.weeklyRules ?? existing.weeklyRules,
      days: {
        create: (body.days ?? []).map((day: { dayNumber: number; name: string; exercises?: Array<{ exerciseId: string; order: number; targetSets?: number; targetRepsLow?: number; targetRepsHigh?: number; intensityZone?: string; plannedLoads?: Record<string, number> }> }) => ({
          dayNumber: day.dayNumber,
          name: day.name,
          exercises: {
            create: (day.exercises ?? []).map((ex) => ({
              exerciseId: ex.exerciseId,
              order: ex.order,
              targetSets: ex.targetSets ?? 3,
              targetRepsLow: ex.targetRepsLow ?? 8,
              targetRepsHigh: ex.targetRepsHigh ?? 12,
              intensityZone: ex.intensityZone ?? null,
              plannedLoads: ex.plannedLoads ?? {},
            })),
          },
        })),
      },
    },
    include: {
      days: { include: { exercises: { include: { exercise: true } } } },
    },
  })

  return NextResponse.json(program)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const existing = await getProgram(id, session.user.id)
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.program.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
