import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const BASE_IMG = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"

interface FreeExercise {
  id: string
  name: string
  category: string
  equipment: string | null
  primaryMuscles: string[]
  secondaryMuscles: string[]
  instructions: string[]
  images: string[]
  level: string
  force: string | null
}

const PUSH_MUSCLES = ["chest", "shoulders", "triceps", "front delts"]
const PULL_MUSCLES = ["lats", "middle back", "lower back", "traps", "biceps", "forearms"]
const LEG_MUSCLES  = ["quadriceps", "hamstrings", "glutes", "calves", "adductors", "abductors"]
const CORE_MUSCLES = ["abdominals", "obliques"]

const GOOD_EQUIPMENT = new Set([
  "barbell", "dumbbell", "cable", "machine", "kettlebells",
  "body only", "bands", "e-z curl bar", "ez curl bar", "other"
])

const GOOD_CATEGORIES = new Set([
  "strength", "powerlifting", "olympic weightlifting", "plyometrics"
])

function mapCategory(muscles: string[]): "PUSH" | "PULL" | "LEGS" | "CORE" | "FULL_BODY" {
  const m = muscles.map((s) => s.toLowerCase())
  const hasLegs = m.some((s) => LEG_MUSCLES.some((l) => s.includes(l)))
  const hasPush = m.some((s) => PUSH_MUSCLES.some((l) => s.includes(l)))
  const hasPull = m.some((s) => PULL_MUSCLES.some((l) => s.includes(l)))
  const hasCore = m.some((s) => CORE_MUSCLES.some((l) => s.includes(l)))

  if (hasLegs && !hasPush && !hasPull) return "LEGS"
  if (hasPush && !hasLegs && !hasPull) return "PUSH"
  if (hasPull && !hasLegs && !hasPush) return "PULL"
  if (hasCore && !hasLegs && !hasPush && !hasPull) return "CORE"
  return "FULL_BODY"
}

function toMuscleGroups(muscles: string[]): string[] {
  const map: Record<string, string> = {
    abdominals: "Addominali",
    abductors: "Abduttori",
    adductors: "Adduttori",
    biceps: "Bicipiti",
    calves: "Polpacci",
    chest: "Petto",
    forearms: "Avambracci",
    glutes: "Glutei",
    hamstrings: "Femorali",
    "hip flexors": "Flessori Anca",
    lats: "Dorsali",
    "lower back": "Lombari",
    "middle back": "Dorsali Medi",
    neck: "Collo",
    obliques: "Obliqui",
    quadriceps: "Quadricipiti",
    shoulders: "Deltoide",
    traps: "Trapezio",
    triceps: "Tricipiti",
  }
  return [...new Set(muscles.map((m) => map[m.toLowerCase()] ?? m))]
}

async function main() {
  const res = await fetch("https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json")
  const allExercises: FreeExercise[] = await res.json()
  console.log(`Totale esercizi nel DB libero: ${allExercises.length}`)

  // Filter: good category + good equipment + has images
  const filtered = allExercises.filter((e) => {
    const catOk  = GOOD_CATEGORIES.has(e.category)
    const equipOk = e.equipment == null || GOOD_EQUIPMENT.has(e.equipment)
    const hasImg = e.images.length > 0
    return catOk && equipOk && hasImg
  })
  console.log(`Dopo filtro palestra: ${filtered.length} esercizi`)

  let inserted = 0
  let updated = 0

  for (const ex of filtered) {
    const imageId = ex.images[0].replace(/\.(jpg|gif)$/, "").split("/")[0]
    const gifUrl  = `${BASE_IMG}/${imageId}/0.jpg`
    const category = mapCategory(ex.primaryMuscles)
    const muscleGroup = toMuscleGroups([...ex.primaryMuscles, ...ex.secondaryMuscles.slice(0, 2)])
    const description = ex.instructions.slice(0, 3).join(" ").slice(0, 500) || null

    const existing = await prisma.exercise.findUnique({ where: { id: ex.id } })
    if (existing) {
      // Update only image URL if missing
      if (!existing.gifUrl) {
        await prisma.exercise.update({ where: { id: ex.id }, data: { gifUrl } })
        updated++
      }
    } else {
      await prisma.exercise.create({
        data: {
          id:          ex.id,
          name:        ex.name,
          nameIt:      null,
          category,
          muscleGroup,
          gifUrl,
          description,
          isGlobal:    true,
        },
      })
      inserted++
    }
  }

  const total = await prisma.exercise.count()
  console.log(`\nInseriti: ${inserted}, aggiornati: ${updated}`)
  console.log(`Totale esercizi nel DB: ${total}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
