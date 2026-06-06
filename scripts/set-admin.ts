import { prisma } from "@/lib/prisma"

async function main() {
  const updated = await prisma.user.update({
    where: { email: "pastina.fede@gmail.com" },
    data: { role: "ADMIN" },
    select: { email: true, role: true }
  })
  console.log("Updated:", updated)
}
main().then(() => prisma.$disconnect()).catch(console.error)
