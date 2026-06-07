import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const programs = await prisma.program.findMany({
    where: { userId: session.user.id },
    include: {
      days: {
        include: {
          exercises: { include: { exercise: true }, orderBy: { order: "asc" } },
        },
        orderBy: { dayNumber: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(programs)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  // Admin can create a program for a specific client
  const targetUserId = (session.user.role === "ADMIN" && body.clientId)
    ? body.clientId
    : session.user.id

  if (body.isActive) {
    await prisma.program.updateMany({
      where: { userId: targetUserId, isActive: true },
      data: { isActive: false },
    })
  }

  const program = await prisma.program.create({
    data: {
      userId: targetUserId,
      createdById: session.user.id,
      name: body.name,
      weeks: body.weeks ?? 6,
      isActive: body.isActive ?? true,
      weeklyRules: body.weeklyRules ?? {},
      days: {
        create: (body.days ?? []).map((day: { dayNumber: number; name: string; exercises?: Array<{ exerciseId: string; order: number; targetSets?: number; targetRepsLow?: number; targetRepsHigh?: number; intensityZone?: string; plannedLoads?: Record<string, number> }> }) => ({
          dayNumber: day.dayNumber,
          name: day.name,
          exercises: {
            create: (day.exercises ?? []).map((ex: { exerciseId: string; order: number; targetSets?: number; targetRepsLow?: number; targetRepsHigh?: number; intensityZone?: string; plannedLoads?: Record<string, number> }) => ({
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

  return NextResponse.json(program, { status: 201 })
}
