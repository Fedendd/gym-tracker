import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Dumbbell, Plus, Clock, TrendingUp, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { WorkoutSession, WorkoutSet, Exercise, ProgramDay } from "@/generated/prisma/client"

type SessionWithRelations = WorkoutSession & {
  programDay: ProgramDay | null
  sets: (WorkoutSet & { exercise: Exercise })[]
}

export default async function WorkoutsPage() {
  const session = await auth()
  const userId = session!.user!.id!

  const [sessions, activeProgram] = await Promise.all([
    prisma.workoutSession.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 30,
      include: {
        programDay: true,
        sets: { where: { completed: true }, include: { exercise: true } },
      },
    }) as Promise<SessionWithRelations[]>,
    prisma.program.findFirst({
      where: { userId, isActive: true },
      include: {
        days: {
          include: { exercises: { include: { exercise: true }, orderBy: { order: "asc" } } },
          orderBy: { dayNumber: "asc" },
        },
      },
    }),
  ])

  // Determine suggested next day
  const lastProgramSession = sessions.find((s) => s.programDayId)
  let suggestedDay = activeProgram?.days[0] ?? null
  if (activeProgram && lastProgramSession?.programDayId) {
    const lastDayIdx = activeProgram.days.findIndex((d) => d.id === lastProgramSession.programDayId)
    if (lastDayIdx !== -1) {
      suggestedDay = activeProgram.days[(lastDayIdx + 1) % activeProgram.days.length]
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* ── Today's workout ── */}
      {activeProgram && suggestedDay ? (
        <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-0.5">Allenamento di oggi</p>
              <h2 className="text-xl font-bold">{suggestedDay.name}</h2>
              <p className="text-sm text-muted-foreground">{activeProgram.name}</p>
            </div>
            <Link
              href={`/workouts/new?programId=${activeProgram.id}`}
              className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
            >
              Inizia <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {/* Exercise list for suggested day */}
          <div className="px-5 pb-5">
            <div className="bg-background/70 rounded-xl divide-y divide-border overflow-hidden">
              {suggestedDay.exercises.map((te, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-sm font-medium">{te.exercise.nameIt ?? te.exercise.name}</span>
                  <span className="text-xs font-mono text-muted-foreground tabular-nums">
                    {te.targetSets}×{te.targetRepsLow}–{te.targetRepsHigh}
                  </span>
                </div>
              ))}
              {suggestedDay.exercises.length === 0 && (
                <p className="text-sm text-muted-foreground px-3 py-3">Nessun esercizio in questo giorno.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* No active program */
        <div className="rounded-2xl border-2 border-dashed p-6 text-center text-muted-foreground space-y-2">
          <Dumbbell className="h-8 w-8 mx-auto opacity-30" />
          <p className="font-medium text-foreground text-sm">Nessuna scheda attiva</p>
          <p className="text-xs">
            Crea una scheda in{" "}
            <Link href="/programs" className="text-primary underline-offset-2 hover:underline">Programmi</Link>
            {" "}per vedere qui il tuo allenamento del giorno.
          </p>
          <Link href="/workouts/new" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2")}>
            Sessione libera
          </Link>
        </div>
      )}

      {/* ── Header + new button ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Storico sessioni</h2>
        <Link href="/workouts/new" className={cn(buttonVariants({ size: "sm" }))}>
          <Plus className="h-4 w-4 mr-1" /> Nuovo
        </Link>
      </div>

      {/* ── History ── */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl space-y-1">
          <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="font-medium text-foreground text-sm">Nessun allenamento registrato</p>
          <p className="text-xs">
            Non hai ancora una scheda?{" "}
            <Link href="/programs" className="text-primary underline-offset-2 hover:underline">Creala in Programmi</Link>.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const volume = s.sets.reduce((acc, set) => acc + (set.weight ?? 0) * (set.reps ?? 0), 0)
            const uniqueExercises = [...new Set(s.sets.map((set) => set.exercise.nameIt ?? set.exercise.name))]
            return (
              <Card key={s.id} className="transition-shadow hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">
                        {s.programDay?.name ?? "Sessione libera"}
                        {s.weekNumber && (
                          <span className="text-xs text-muted-foreground ml-2 font-normal">Sett. {s.weekNumber}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(s.date), "EEEE d MMMM", { locale: it })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
                      {s.durationMins && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />{s.durationMins} min
                        </span>
                      )}
                      {volume > 0 && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />{(volume / 1000).toFixed(1)}t
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {uniqueExercises.slice(0, 5).map((n) => (
                      <Badge key={n} variant="outline" className="text-xs">{n}</Badge>
                    ))}
                    {uniqueExercises.length > 5 && (
                      <Badge variant="outline" className="text-xs">+{uniqueExercises.length - 5}</Badge>
                    )}
                  </div>
                  {s.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic line-clamp-1">{s.notes}</p>
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
