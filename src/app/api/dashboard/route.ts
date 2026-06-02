import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth, subMonths } from "date-fns"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const now = new Date()

  const [lastWorkout, prs, monthSessions, monthCardio, activeProgram] = await Promise.all([
    prisma.workoutSession.findFirst({
      where: { userId, completed: true },
      orderBy: { date: "desc" },
      include: {
        sets: { include: { exercise: true } },
        programDay: true,
      },
    }),
    prisma.personalRecord.findMany({
      where: { userId },
      include: { exercise: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.workoutSession.findMany({
      where: {
        userId,
        date: { gte: startOfMonth(subMonths(now, 2)), lte: endOfMonth(now) },
      },
      select: { date: true, completed: true },
    }),
    prisma.cardioSession.findMany({
      where: {
        userId,
        date: { gte: startOfMonth(subMonths(now, 2)), lte: endOfMonth(now) },
      },
      select: { date: true, type: true, durationMins: true },
    }),
    prisma.program.findFirst({
      where: { userId, isActive: true },
      include: { days: { include: { exercises: true } } },
    }),
  ])

  return NextResponse.json({
    lastWorkout,
    prs,
    calendarSessions: [
      ...monthSessions.map((s) => ({ date: s.date, type: "strength" as const, completed: s.completed })),
      ...monthCardio.map((c) => ({ date: c.date, type: "cardio" as const, completed: true })),
    ],
    activeProgram,
  })
}
