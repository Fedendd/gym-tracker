import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q        = searchParams.get("q") ?? ""
  const category = searchParams.get("category")
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")))
  const skip     = (page - 1) * limit

  const where = {
    AND: [
      q ? { OR: [
        { name:   { contains: q, mode: "insensitive" as const } },
        { nameIt: { contains: q, mode: "insensitive" as const } },
      ]} : {},
      category ? { category: category as never } : {},
    ],
  }

  const [exercises, total] = await Promise.all([
    prisma.exercise.findMany({ where, orderBy: { nameIt: "asc" }, skip, take: limit }),
    prisma.exercise.count({ where }),
  ])

  return NextResponse.json({
    exercises,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const exercise = await prisma.exercise.create({
    data: {
      name:        body.name,
      nameIt:      body.nameIt,
      category:    body.category,
      muscleGroup: body.muscleGroup ?? [],
      gifUrl:      body.gifUrl,
      youtubeUrl:  body.youtubeUrl,
      description: body.description,
      isGlobal:    false,
    },
  })

  return NextResponse.json(exercise, { status: 201 })
}
