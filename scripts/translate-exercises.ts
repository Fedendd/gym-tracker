import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Ordered from most specific to most generic to avoid partial replacements
const RULES: [RegExp, string][] = [
  // ── Compound movements (before individual words) ──
  [/Romanian Deadlift/gi,           "Stacco Rumeno"],
  [/Sumo Deadlift/gi,               "Stacco Sumo"],
  [/Stiff[- ]Leg(?:ged)? Deadlift/gi,"Stacco Gambetese"],
  [/Deadlift/gi,                    "Stacco da Terra"],

  [/Bulgarian Split Squat/gi,       "Squat Bulgaro"],
  [/Goblet Squat/gi,                "Squat Goblet"],
  [/Hack Squat/gi,                  "Hack Squat"],
  [/Front Squat/gi,                 "Squat Frontale"],
  [/Box Squat/gi,                   "Squat al Box"],
  [/Pause Squat/gi,                 "Squat con Pausa"],
  [/Overhead Squat/gi,              "Squat Sopra la Testa"],
  [/Split Squat/gi,                 "Squat Diviso"],
  [/Squat/gi,                       "Squat"],

  [/Barbell Hip Thrust/gi,          "Hip Thrust con Bilanciere"],
  [/Hip Thrust/gi,                  "Hip Thrust"],
  [/Glute Bridge/gi,                "Ponte dei Glutei"],
  [/Glute[- ]Ham Raise/gi,          "GHR"],

  [/Incline (?:Barbell|Dumbbell) (?:Bench )?Press/gi, "Panca Inclinata"],
  [/Decline (?:Barbell|Dumbbell) (?:Bench )?Press/gi, "Panca Declinata"],
  [/Flat (?:Barbell|Dumbbell) (?:Bench )?Press/gi,    "Panca Piana"],
  [/Barbell Bench Press[^a-z]*/gi,  "Panca Piana con Bilanciere"],
  [/Dumbbell Bench Press/gi,        "Panca Piana Manubri"],
  [/Close[- ]Grip Bench Press/gi,   "Panca Presa Stretta"],
  [/Bench Press/gi,                 "Panca"],

  [/Overhead Press/gi,              "Press Sopra la Testa"],
  [/Military Press/gi,              "Press Militare"],
  [/Shoulder Press/gi,              "Press Spalle"],
  [/Chest Press/gi,                 "Chest Press"],
  [/Leg Press/gi,                   "Leg Press"],
  [/Press/gi,                       "Press"],

  [/Wide[- ]Grip Lat Pulldown/gi,   "Lat Machine Presa Larga"],
  [/Lat Pulldown/gi,                "Lat Machine"],
  [/Pulldown/gi,                    "Tirata Verticale"],
  [/Pull[- ]Up/gi,                  "Trazioni Pronazione"],
  [/Pullups?/gi,                    "Trazioni"],
  [/Chin[- ]Up/gi,                  "Trazioni Supinazione"],

  [/Seated Cable Row[s]?/gi,        "Rematore ai Cavi Seduto"],
  [/Bent[- ]Over Barbell Row/gi,    "Rematore con Bilanciere"],
  [/Bent[- ]Over Row/gi,            "Rematore Busto Chino"],
  [/One[- ]Arm Dumbbell Row/gi,     "Rematore Monobracchio"],
  [/Cable Row/gi,                   "Rematore ai Cavi"],
  [/Barbell Row/gi,                 "Rematore con Bilanciere"],
  [/Dumbbell Row/gi,                "Rematore con Manubri"],
  [/Rows?/gi,                       "Rematore"],

  [/Cable Crossover/gi,             "Croci ai Cavi"],
  [/Dumbbell Fly|Dumbbell Flye/gi,  "Croci con Manubri"],
  [/Pec Deck/gi,                    "Pec Deck"],
  [/Flyes?|Flies/gi,                "Croci"],
  [/Crossover/gi,                   "Crossover"],

  [/Tricep[s]? Pushdown/gi,         "Pushdown Tricipiti"],
  [/Skull Crusher/gi,               "Skull Crusher"],
  [/Tricep[s]? Extension/gi,        "Estensione Tricipiti"],
  [/Tricep[s]? Dip[s]?/gi,          "Dip Tricipiti"],
  [/Overhead Tricep[s]? Extension/gi,"Estensione Tricipiti Sopra la Testa"],
  [/Dips?/gi,                       "Dip"],

  [/Barbell Curl/gi,                "Curl con Bilanciere"],
  [/Dumbbell Curl/gi,               "Curl con Manubri"],
  [/Hammer Curl/gi,                 "Hammer Curl"],
  [/Preacher Curl/gi,               "Curl al Palo"],
  [/Concentration Curl/gi,          "Curl di Concentrazione"],
  [/Cable Curl/gi,                  "Curl ai Cavi"],
  [/Spider Curl/gi,                 "Spider Curl"],
  [/Zottman Curl/gi,                "Curl Zottman"],
  [/Reverse Curl/gi,                "Curl Inverso"],
  [/Curl/gi,                        "Curl"],

  [/Face Pull/gi,                   "Face Pull"],
  [/Upright Row/gi,                 "Alzata al Mento"],
  [/Shrug/gi,                       "Scrollata Spalle"],

  [/Dumbbell Lateral Raise/gi,      "Alzate Laterali Manubri"],
  [/Cable Lateral Raise/gi,         "Alzate Laterali ai Cavi"],
  [/Lateral Raise/gi,               "Alzate Laterali"],
  [/Front Raise/gi,                 "Alzate Frontali"],
  [/Rear Delt (?:Fly|Raise)/gi,     "Croci per Deltoide Posteriore"],

  [/Leg Curl/gi,                    "Leg Curl"],
  [/Leg Extension/gi,               "Leg Extension"],
  [/Calf Raise/gi,                  "Alzate Polpacci"],
  [/Leg Raise/gi,                   "Alzate Gambe"],
  [/Lunge[s]?/gi,                   "Affondi"],
  [/Step[- ]Up[s]?/gi,              "Step-Up"],
  [/Box Jump/gi,                    "Salto al Box"],

  [/Ab Wheel Rollout/gi,            "Rotella Addominali"],
  [/Ab Rollout/gi,                  "Rollout Addominali"],
  [/Cable Crunch/gi,                "Crunch ai Cavi"],
  [/Sit[- ]Up/gi,                   "Sit-Up"],
  [/Crunch/gi,                      "Crunch"],
  [/Plank/gi,                       "Plank"],
  [/Hanging Leg Raise/gi,           "Alzate Gambe Appeso"],
  [/Hollow Body/gi,                 "Hollow Body"],
  [/L[- ]Sit/gi,                    "L-Sit"],
  [/Dragon Flag/gi,                 "Dragon Flag"],
  [/Russian Twist/gi,               "Russian Twist"],
  [/Windmill/gi,                    "Windmill"],
  [/Good Morning/gi,                "Good Morning"],
  [/Back Extension/gi,              "Estensione Schiena"],
  [/Hyperextension/gi,              "Iperestensione"],

  [/Clean and (?:Jerk|Press)/gi,    "Clean and Jerk"],
  [/Power Clean/gi,                 "Power Clean"],
  [/Hang Clean/gi,                  "Hang Clean"],
  [/Clean/gi,                       "Clean"],
  [/Snatch/gi,                      "Strappo"],
  [/Jerk/gi,                        "Jerk"],

  [/Kettlebell Swing/gi,            "Swing con Kettlebell"],
  [/Turkish Get[- ]Up/gi,           "Turkish Get-Up"],
  [/Kettlebell/gi,                  "Kettlebell"],

  [/Mountain Climber/gi,            "Mountain Climber"],
  [/Burpee/gi,                      "Burpee"],
  [/Jump Squat/gi,                  "Squat con Salto"],
  [/Box Jump/gi,                    "Salto al Box"],

  // ── Equipment (after compounds) ──
  [/Barbell/gi,     "Bilanciere"],
  [/Dumbbells?/gi,  "Manubri"],
  [/Cable/gi,       "Cavo"],
  [/Leverage/gi,    "Macchina"],
  [/Lever\b/gi,     "Macchina"],
  [/Machine/gi,     "Macchina"],
  [/Smith/gi,       "Smith Machine"],
  [/Sled\b/gi,      "Slittia"],
  [/EZ[- ]?(?:Curl[- ])?Bar/gi, "Bilanciere EZ"],
  [/Trap Bar/gi,    "Trap Bar"],

  // ── Position modifiers ──
  [/Incline\b/gi,       "Inclinato"],
  [/Decline\b/gi,       "Declinato"],
  [/Flat\b/gi,          "Piana"],
  [/Seated/gi,          "Seduto"],
  [/Standing/gi,        "In Piedi"],
  [/Lying\b/gi,         "Sdraiato"],
  [/Prone\b/gi,         "Prono"],
  [/Supine\b/gi,        "Supino"],
  [/Overhead\b/gi,      "Sopra la Testa"],
  [/Behind[- ]Neck/gi,  "Dietro la Nuca"],
  [/One[- ]Arm\b/gi,    "Monobracchio"],
  [/Single[- ]Arm\b/gi, "Monobracchio"],
  [/One[- ]Leg\b/gi,    "Monopodalico"],
  [/Single[- ]Leg\b/gi, "Monopodalico"],
  [/Unilateral/gi,      "Unilaterale"],
  [/Bilateral/gi,       "Bilaterale"],
  [/Alternating?\b/gi,  "Alternato"],
  [/Alternate\b/gi,     "Alternato"],
  [/Weighted\b/gi,      "Zavorrato"],
  [/Assisted\b/gi,      "Assistito"],
  [/Elevated\b/gi,      "Elevato"],
  [/Narrow\b/gi,        "Presa Stretta"],
  [/Wide[- ]Grip/gi,    "Presa Larga"],
  [/Close[- ]Grip/gi,   "Presa Stretta"],
  [/Neutral[- ]Grip/gi, "Presa Neutra"],
  [/Reverse[- ]Grip/gi, "Presa Inversa"],
  [/Reverse\b/gi,       "Inverso"],
  [/Paused?\b/gi,       "con Pausa"],
  [/Partial\b/gi,       "Parziale"],
  [/Full\b/gi,          "Completo"],
  [/Slow\b/gi,          "Lento"],
  [/Explosive\b/gi,     "Esplosivo"],
  [/Isometric\b/gi,     "Isometrico"],
  [/Eccentric\b/gi,     "Eccentrico"],

  // ── Body parts ──
  [/Chest\b/gi,        "Petto"],
  [/Back\b/gi,         "Schiena"],
  [/Shoulders?\b/gi,   "Spalle"],
  [/Biceps?\b/gi,      "Bicipiti"],
  [/Triceps?\b/gi,     "Tricipiti"],
  [/Glutes?\b/gi,      "Glutei"],
  [/Hamstrings?\b/gi,  "Femorali"],
  [/Quadriceps?\b/gi,  "Quadricipiti"],
  [/Quads?\b/gi,       "Quadricipiti"],
  [/Calves\b/gi,       "Polpacci"],
  [/Calf\b/gi,         "Polpaccio"],
  [/Abs?\b/gi,         "Addominali"],
  [/Obliques?\b/gi,    "Obliqui"],
  [/Forearms?\b/gi,    "Avambracci"],
  [/Lats?\b/gi,        "Dorsali"],
  [/Traps?\b/gi,       "Trapezio"],
  [/Hips?\b/gi,        "Anca"],
  [/Neck\b/gi,         "Collo"],
  [/Wrist\b/gi,        "Polso"],
  [/Ankle\b/gi,        "Caviglia"],
  [/Core\b/gi,         "Core"],
  [/Upper\b/gi,        "Alto"],
  [/Lower\b/gi,        "Basso"],
  [/Mid(?:dle)?\b/gi,  "Medio"],
  [/Front\b/gi,        "Frontale"],
  [/Rear\b/gi,         "Posteriore"],
  [/Side\b/gi,         "Laterale"],
  [/Inner\b/gi,        "Interno"],
  [/Outer\b/gi,        "Esterno"],

  // ── Cleanup ──
  [/[-_]+/g,       " "],
  [/\s{2,}/g,      " "],
]

function translate(name: string): string {
  let r = name
  for (const [pattern, replacement] of RULES) {
    r = r.replace(pattern, replacement)
  }
  return r.trim()
}

async function main() {
  // Only translate exercises without Italian name
  const exercises = await prisma.exercise.findMany({
    where: { nameIt: null },
    select: { id: true, name: true },
  })

  console.log(`Traduzione di ${exercises.length} esercizi...`)

  let count = 0
  for (const ex of exercises) {
    const nameIt = translate(ex.name)
    if (nameIt !== ex.name) {
      await prisma.exercise.update({ where: { id: ex.id }, data: { nameIt } })
      count++
    }
  }

  console.log(`✓ Tradotti: ${count}/${exercises.length}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
