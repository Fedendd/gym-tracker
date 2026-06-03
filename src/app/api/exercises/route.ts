import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  const category = searchParams.get("category")

  const exercises = await prisma.exercise.findMany({
    where: {
      AND: [
        q ? { OR: [
          { name: { contains: q, mode: "insensitive" } },
          { nameIt: { contains: q, mode: "insensitive" } },
        ]} : {},
        category ? { category: category as never } : {},
      ],
    },
    orderBy: { nameIt: "asc" },
  })

  return NextResponse.json(exercises)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const exercise = await prisma.exercise.create({
    data: {
      name: body.name,
      nameIt: body.nameIt,
      category: body.category,
      muscleGroup: body.muscleGroup ?? [],
      gifUrl: body.gifUrl,
      youtubeUrl: body.youtubeUrl,
      description: body.description,
      isGlobal: false,
    },
  })

  return NextResponse.json(exercise, { status: 201 })
}
