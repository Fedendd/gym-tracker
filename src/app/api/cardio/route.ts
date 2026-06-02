import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sessions = await prisma.cardioSession.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: 30,
  })

  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const cardio = await prisma.cardioSession.create({
    data: {
      userId: session.user.id,
      date: new Date(body.date),
      type: body.type,
      durationMins: body.durationMins,
      distanceKm: body.distanceKm ?? null,
      avgHeartRate: body.avgHeartRate ?? null,
      calories: body.calories ?? null,
      notes: body.notes ?? null,
    },
  })

  return NextResponse.json(cardio, { status: 201 })
}
