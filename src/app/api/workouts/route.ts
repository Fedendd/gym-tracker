import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sessions = await prisma.workoutSession.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: 30,
    include: {
      programDay: true,
      sets: {
        include: { exercise: true },
        orderBy: { setNumber: "asc" },
      },
    },
  })

  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  const workout = await prisma.workoutSession.create({
    data: {
      userId: session.user.id,
      programId: body.programId ?? null,
      programDayId: body.programDayId ?? null,
      weekNumber: body.weekNumber ?? null,
      date: new Date(body.date),
      durationMins: body.durationMins ?? null,
      notes: body.notes ?? null,
      completed: body.completed ?? true,
      sets: {
        create: (body.sets ?? []).map((s: {
          exerciseId: string
          setNumber: number
          weight?: number
          reps?: number
          rpe?: number
          completed?: boolean
          notes?: string
        }) => ({
          exerciseId: s.exerciseId,
          setNumber: s.setNumber,
          weight: s.weight ?? null,
          reps: s.reps ?? null,
          rpe: s.rpe ?? null,
          completed: s.completed ?? true,
          notes: s.notes ?? null,
        })),
      },
    },
    include: {
      sets: { include: { exercise: true } },
      programDay: true,
    },
  })

  // Update personal records
  const setsByExercise = workout.sets.reduce<Record<string, typeof workout.sets>>((acc, s) => {
    if (!acc[s.exerciseId]) acc[s.exerciseId] = []
    acc[s.exerciseId].push(s)
    return acc
  }, {})

  for (const [exerciseId, sets] of Object.entries(setsByExercise)) {
    const best = sets
      .filter((s) => s.weight && s.reps)
      .sort((a, b) => (b.weight! * b.reps!) - (a.weight! * a.reps!))
    if (!best.length) continue
    const top = best[0]
    await prisma.personalRecord.upsert({
      where: { userId_exerciseId: { userId: session.user.id, exerciseId } },
      create: { userId: session.user.id, exerciseId, weight: top.weight!, reps: top.reps!, date: workout.date },
      update: { weight: top.weight!, reps: top.reps!, date: workout.date },
    })
  }

  return NextResponse.json(workout, { status: 201 })
}
