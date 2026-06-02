import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { ClipboardList, Plus, Dumbbell } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default async function ProgramsPage() {
  const session = await auth()
  const programs = await prisma.program.findMany({
    where: { userId: session!.user!.id! },
    include: {
      days: {
        include: {
          exercises: { include: { exercise: true }, orderBy: { order: "asc" } },
          _count: { select: { sessions: true } },
        },
        orderBy: { dayNumber: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" /> Programmi
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestisci le tue schede di allenamento
          </p>
        </div>
        <Link href="/programs/new" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4 mr-2" /> Nuovo programma
        </Link>
      </div>

      {programs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nessun programma</p>
          <p className="text-sm mt-1 mb-4">Crea il tuo primo programma periodizzato</p>
          <Link href="/programs/new" className={cn(buttonVariants())}>Crea programma</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {programs.map((program) => (
            <Card key={program.id} className={program.isActive ? "ring-2 ring-primary" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{program.name}</CardTitle>
                    {program.isActive && <Badge className="text-xs">Attivo</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{program.weeks} settimane</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(program.createdAt), "d MMM yyyy", { locale: it })}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {program.days.map((day) => (
                    <div key={day.id} className="bg-muted/40 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{day.name}</p>
                        <span className="text-xs text-muted-foreground">{day._count.sessions} sessioni</span>
                      </div>
                      <div className="space-y-1">
                        {day.exercises.slice(0, 4).map((te) => (
                          <div key={te.id} className="flex justify-between text-xs text-muted-foreground">
                            <span className="truncate">{te.exercise.nameIt ?? te.exercise.name}</span>
                            <span className="font-mono ml-2 shrink-0">{te.targetSets}×{te.targetRepsLow}-{te.targetRepsHigh}</span>
                          </div>
                        ))}
                        {day.exercises.length > 4 && (
                          <p className="text-xs text-muted-foreground">+{day.exercises.length - 4} altri</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/workouts/new?programId=${program.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    <Dumbbell className="h-3.5 w-3.5 mr-1.5" /> Inizia sessione
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
