import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

interface FreeExercise {
  id: string
  name: string
  images: string[]
}

// Mapping manuale: exercise.id (in DB) → gifUrl
// Immagini da free-exercise-db (yuhonas/free-exercise-db su GitHub)
const BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"

const GIF_MAP: Record<string, string> = {
  "chest-press-machine":        `${BASE}/Lever_Chest_Press/images/0.jpg`,
  "incline-dumbbell-press":     `${BASE}/Dumbbell_Incline_Bench_Press/images/0.jpg`,
  "flat-barbell-bench-press":   `${BASE}/Barbell_Bench_Press_-_Medium_Grip/images/0.jpg`,
  "cable-crossover":            `${BASE}/Cable_Crossover/images/0.jpg`,
  "pec-deck-machine":           `${BASE}/Pec_Deck_Fly/images/0.jpg`,
  "overhead-press":             `${BASE}/Barbell_Shoulder_Press/images/0.jpg`,
  "dumbbell-lateral-raise":     `${BASE}/Dumbbell_Lateral_Raise/images/0.jpg`,
  "cable-lateral-raise":        `${BASE}/Cable_Lateral_Raise/images/0.jpg`,
  "tricep-pushdown":            `${BASE}/Cable_Pushdown_(with_Bar_attachment)/images/0.jpg`,
  "tricep-overhead-extension":  `${BASE}/Dumbbell_Triceps_Extension/images/0.jpg`,
  "dips":                       `${BASE}/Chest_Dip/images/0.jpg`,
  "pull-up":                    `${BASE}/Pull-up/images/0.jpg`,
  "chin-up":                    `${BASE}/Chin-up/images/0.jpg`,
  "lat-pulldown":               `${BASE}/Wide-Grip_Lat_Pulldown/images/0.jpg`,
  "seated-cable-row":           `${BASE}/Cable_Seated_Row/images/0.jpg`,
  "barbell-row":                `${BASE}/Barbell_Bent_Over_Row/images/0.jpg`,
  "single-arm-dumbbell-row":    `${BASE}/Dumbbell_One_Arm_Row/images/0.jpg`,
  "face-pull":                  `${BASE}/Cable_Face_Pull/images/0.jpg`,
  "barbell-curl":               `${BASE}/Barbell_Curl/images/0.jpg`,
  "dumbbell-curl":              `${BASE}/Dumbbell_Alternate_Bicep_Curl/images/0.jpg`,
  "hammer-curl":                `${BASE}/Dumbbell_Hammer_Curl_with_Wrist_Alternation/images/0.jpg`,
  "squat":                      `${BASE}/Barbell_Full_Squat/images/0.jpg`,
  "leg-press":                  `${BASE}/Lever_Leg_Press/images/0.jpg`,
  "romanian-deadlift":          `${BASE}/Barbell_Romanian_Deadlift/images/0.jpg`,
  "leg-curl":                   `${BASE}/Lever_Lying_Leg_Curl/images/0.jpg`,
  "leg-extension":              `${BASE}/Lever_Leg_Extension/images/0.jpg`,
  "hip-thrust":                 `${BASE}/Barbell_Hip_Thrust/images/0.jpg`,
  "bulgarian-split-squat":      `${BASE}/Barbell_Bulgarian_Split_Squat/images/0.jpg`,
  "calf-raise":                 `${BASE}/Lever_Standing_Calf_Raise/images/0.jpg`,
  "deadlift":                   `${BASE}/Barbell_Deadlift/images/0.jpg`,
  "plank":                      `${BASE}/Plank/images/0.jpg`,
  "ab-wheel-rollout":           `${BASE}/Ab_Wheel_Rollout/images/0.jpg`,
  "cable-crunch":               `${BASE}/Cable_Crunch/images/0.jpg`,
  "hanging-leg-raise":          `${BASE}/Hanging_Leg_Raise/images/0.jpg`,
  "russian-twist":              `${BASE}/Dumbbell_Russian_Twist/images/0.jpg`,
  "barbell-clean-and-press":    `${BASE}/Barbell_Clean_and_Press/images/0.jpg`,
  "kettlebell-swing":           `${BASE}/Kettlebell_Two_Arm_Swing/images/0.jpg`,
  "burpee":                     `${BASE}/Burpee/images/0.jpg`,
}

async function checkUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" })
    return res.ok
  } catch {
    return false
  }
}

async function main() {
  const exercises = await prisma.exercise.findMany()
  console.log(`Aggiornamento GIF per ${exercises.length} esercizi...\n`)

  let ok = 0
  let missing = 0

  for (const ex of exercises) {
    const url = GIF_MAP[ex.id]
    if (!url) {
      console.log(`  ✗ ${ex.nameIt ?? ex.name} — nessun mapping`)
      missing++
      continue
    }

    const valid = await checkUrl(url)
    if (valid) {
      await prisma.exercise.update({ where: { id: ex.id }, data: { gifUrl: url } })
      console.log(`  ✓ ${ex.nameIt ?? ex.name}`)
      ok++
    } else {
      console.log(`  ✗ ${ex.nameIt ?? ex.name} — URL non valido: ${url}`)
      missing++
    }

    await new Promise((r) => setTimeout(r, 100))
  }

  console.log(`\nCompletato: ${ok} OK, ${missing} mancanti`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
