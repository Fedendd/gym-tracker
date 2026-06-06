import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Dumbbell, Plus, Clock, TrendingUp } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { WorkoutSession, WorkoutSet, Exercise, ProgramDay } from "@/generated/prisma/client"

type SessionWithRelations = WorkoutSession & {
  programDay: ProgramDay | null
  sets: (WorkoutSet & { exercise: Exercise })[]
}

export default async function WorkoutsPage() {
  const session = await auth()
  const sessions = await prisma.workoutSession.findMany({
    where: { userId: session!.user!.id! },
    orderBy: { date: "desc" },
    take: 30,
    include: {
      programDay: true,
      sets: {
        where: { completed: true },
        include: { exercise: true },
      },
    },
  }) as SessionWithRelations[]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Dumbbell className="h-6 w-6" /> Allenamenti
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Storico delle tue sessioni</p>
        </div>
        <Link href="/workouts/new" className={cn(buttonVariants())}>
          <Plus className="h-4 w-4 mr-2" /> Nuovo
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
          <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nessun allenamento registrato</p>
          <p className="text-sm mt-1 mb-4">Inizia aggiungendo la tua prima sessione</p>
          <Link href="/workouts/new" className={cn(buttonVariants())}>Inizia allenamento</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const volume = s.sets.reduce((acc, set) => acc + (set.weight ?? 0) * (set.reps ?? 0), 0)
            const uniqueExercises = [...new Set(s.sets.map((set) => set.exercise.nameIt ?? set.exercise.name))]

            return (
              <Card key={s.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <Dumbbell className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {s.programDay?.name ?? "Sessione libera"}
                          {s.weekNumber && (
                            <span className="text-xs text-muted-foreground ml-2">Sett. {s.weekNumber}</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(s.date), "EEEE d MMMM yyyy", { locale: it })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.durationMins && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {s.durationMins} min
                        </div>
                      )}
                      {volume > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {(volume / 1000).toFixed(1)}t
                        </div>
                      )}
                      {s.completed && <Badge variant="secondary" className="text-xs">Completato</Badge>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueExercises.slice(0, 5).map((name) => (
                      <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
                    ))}
                    {uniqueExercises.length > 5 && (
                      <Badge variant="outline" className="text-xs">+{uniqueExercises.length - 5}</Badge>
                    )}
                  </div>
                  {s.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">{s.notes}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
