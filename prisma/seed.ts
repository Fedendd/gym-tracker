import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const exercises = [
  // PUSH
  { name: "Chest Press Machine", nameIt: "Chest Press (Macchina)", category: "PUSH", muscleGroup: ["Petto", "Tricipiti", "Deltoide Anteriore"] },
  { name: "Incline Dumbbell Press", nameIt: "Panca Inclinata Manubri", category: "PUSH", muscleGroup: ["Petto Alto", "Tricipiti", "Deltoide Anteriore"] },
  { name: "Flat Barbell Bench Press", nameIt: "Panca Piana Bilanciere", category: "PUSH", muscleGroup: ["Petto", "Tricipiti", "Deltoide Anteriore"] },
  { name: "Cable Crossover", nameIt: "Croci ai Cavi", category: "PUSH", muscleGroup: ["Petto"] },
  { name: "Pec Deck Machine", nameIt: "Pec Deck (Macchina Farfalla)", category: "PUSH", muscleGroup: ["Petto"] },
  { name: "Overhead Press", nameIt: "Shoulder Press", category: "PUSH", muscleGroup: ["Deltoide", "Tricipiti"] },
  { name: "Dumbbell Lateral Raise", nameIt: "Alzate Laterali Manubri", category: "PUSH", muscleGroup: ["Deltoide Laterale"] },
  { name: "Cable Lateral Raise", nameIt: "Alzate Laterali ai Cavi", category: "PUSH", muscleGroup: ["Deltoide Laterale"] },
  { name: "Tricep Pushdown", nameIt: "Pushdown Tricipiti (Cavo)", category: "PUSH", muscleGroup: ["Tricipiti"] },
  { name: "Tricep Overhead Extension", nameIt: "Estensione Tricipiti Sopra la Testa", category: "PUSH", muscleGroup: ["Tricipiti"] },
  { name: "Dips", nameIt: "Dip alle Parallele", category: "PUSH", muscleGroup: ["Petto", "Tricipiti"] },

  // PULL
  { name: "Pull Up", nameIt: "Trazioni Pronazione", category: "PULL", muscleGroup: ["Dorsali", "Bicipiti"] },
  { name: "Chin Up", nameIt: "Trazioni Supinazione", category: "PULL", muscleGroup: ["Dorsali", "Bicipiti"] },
  { name: "Lat Pulldown", nameIt: "Lat Machine", category: "PULL", muscleGroup: ["Dorsali", "Bicipiti"] },
  { name: "Seated Cable Row", nameIt: "Rematore ai Cavi (Seduto)", category: "PULL", muscleGroup: ["Dorsali", "Romboidi", "Bicipiti"] },
  { name: "Barbell Row", nameIt: "Rematore con Bilanciere", category: "PULL", muscleGroup: ["Dorsali", "Romboidi", "Bicipiti"] },
  { name: "Single Arm Dumbbell Row", nameIt: "Rematore Monobracchio Manubri", category: "PULL", muscleGroup: ["Dorsali", "Bicipiti"] },
  { name: "Face Pull", nameIt: "Face Pull", category: "PULL", muscleGroup: ["Deltoide Posteriore", "Trapezio"] },
  { name: "Barbell Curl", nameIt: "Curl con Bilanciere", category: "PULL", muscleGroup: ["Bicipiti"] },
  { name: "Dumbbell Curl", nameIt: "Curl con Manubri", category: "PULL", muscleGroup: ["Bicipiti"] },
  { name: "Hammer Curl", nameIt: "Hammer Curl", category: "PULL", muscleGroup: ["Bicipiti", "Brachioradiale"] },

  // LEGS
  { name: "Squat", nameIt: "Squat con Bilanciere", category: "LEGS", muscleGroup: ["Quadricipiti", "Glutei", "Femorali"] },
  { name: "Leg Press", nameIt: "Leg Press", category: "LEGS", muscleGroup: ["Quadricipiti", "Glutei", "Femorali"] },
  { name: "Romanian Deadlift", nameIt: "Stacco Rumeno", category: "LEGS", muscleGroup: ["Femorali", "Glutei"] },
  { name: "Leg Curl", nameIt: "Leg Curl (Macchina)", category: "LEGS", muscleGroup: ["Femorali"] },
  { name: "Leg Extension", nameIt: "Leg Extension (Macchina)", category: "LEGS", muscleGroup: ["Quadricipiti"] },
  { name: "Hip Thrust", nameIt: "Hip Thrust", category: "LEGS", muscleGroup: ["Glutei"] },
  { name: "Bulgarian Split Squat", nameIt: "Squat Bulgaro", category: "LEGS", muscleGroup: ["Quadricipiti", "Glutei"] },
  { name: "Calf Raise", nameIt: "Alzate Polpacci (Macchina)", category: "LEGS", muscleGroup: ["Polpacci"] },
  { name: "Deadlift", nameIt: "Stacco da Terra", category: "LEGS", muscleGroup: ["Femorali", "Glutei", "Dorsali", "Trapezio"] },

  // CORE
  { name: "Plank", nameIt: "Plank", category: "CORE", muscleGroup: ["Core", "Addome"] },
  { name: "Ab Wheel Rollout", nameIt: "Rotella Addominali", category: "CORE", muscleGroup: ["Core", "Addome"] },
  { name: "Cable Crunch", nameIt: "Crunch ai Cavi", category: "CORE", muscleGroup: ["Addome"] },
  { name: "Hanging Leg Raise", nameIt: "Alzate Gambe Appesi", category: "CORE", muscleGroup: ["Addome", "Hip Flexors"] },
  { name: "Russian Twist", nameIt: "Russian Twist", category: "CORE", muscleGroup: ["Addome Obliquo"] },

  // FULL_BODY
  { name: "Barbell Clean and Press", nameIt: "Clean and Press", category: "FULL_BODY", muscleGroup: ["Full Body"] },
  { name: "Kettlebell Swing", nameIt: "Kettlebell Swing", category: "FULL_BODY", muscleGroup: ["Glutei", "Femorali", "Core"] },
  { name: "Burpee", nameIt: "Burpee", category: "FULL_BODY", muscleGroup: ["Full Body"] },
]

async function main() {
  console.log("Seeding exercises...")
  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { id: ex.name.toLowerCase().replace(/\s+/g, "-") },
      update: { nameIt: ex.nameIt, muscleGroup: ex.muscleGroup },
      create: {
        id: ex.name.toLowerCase().replace(/\s+/g, "-"),
        name: ex.name,
        nameIt: ex.nameIt,
        category: ex.category as never,
        muscleGroup: ex.muscleGroup,
        isGlobal: true,
      },
    })
  }
  console.log(`✓ Seeded ${exercises.length} exercises`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
