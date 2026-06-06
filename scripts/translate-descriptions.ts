import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function translateText(text: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=it&dt=t&q=${encodeURIComponent(text)}`
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  // Response format: [[["translated", "original", ...], ...], ...]
  const parts: string[] = (data[0] as [string, string][]).map(([t]) => t)
  return parts.join("")
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  const exercises = await prisma.exercise.findMany({
    where: { description: { not: null } },
    select: { id: true, description: true },
  })

  console.log(`Traduzione di ${exercises.length} descrizioni...`)
  let ok = 0
  let failed = 0

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]
    if (!ex.description) continue

    try {
      const translated = await translateText(ex.description)
      await prisma.exercise.update({
        where: { id: ex.id },
        data: { description: translated },
      })
      ok++
      if (ok % 20 === 0) process.stdout.write(`  ${ok}/${exercises.length}\n`)
    } catch (e) {
      failed++
      // On error, clear description rather than show English
      await prisma.exercise.update({ where: { id: ex.id }, data: { description: null } })
    }

    // Rate limit: ~2 req/sec to avoid blocks
    await sleep(500)
  }

  console.log(`\n✓ Tradotte: ${ok} | Rimosse: ${failed}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
