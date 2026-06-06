import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const clients = await prisma.user.findMany({
    where: { role: "USER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      programs: {
        where: { isActive: true },
        select: { id: true, name: true },
        take: 1,
      },
      workoutSessions: {
        orderBy: { date: "desc" },
        select: { date: true },
        take: 1,
      },
    },
  })

  return NextResponse.json(clients)
}
