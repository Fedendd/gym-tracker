import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { subMonths, startOfMonth, endOfMonth, format, isSameDay } from "date-fns"
import { it } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Dumbbell, Activity, Trophy, Calendar, TrendingUp, ClipboardList, Flame, Plus } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type {
  WorkoutSession, WorkoutSet, Exercise, ProgramDay, PersonalRecord, CardioSession, Program
} from "@/generated/prisma/client"

type SessionWithSets = WorkoutSession & {
  sets: (WorkoutSet & { exercise: Exercise })[]
  programDay: ProgramDay | null
}
type PRWithExercise = PersonalRecord & { exercise: Exercise }
type ProgramWithDays = Program & { days: { id: string; name: string; dayNumber: number }[] }

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id!
  const now = new Date()

  // Start of current week (Monday)
  const startOfThisWeek = new Date(now)
  startOfThisWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  startOfThisWeek.setHours(0, 0, 0, 0)

  const [lastWorkout, , prs, allSessions, allCardio, activeProgram, monthSessions] = await Promise.all([
    prisma.workoutSession.findFirst({
      where: { userId, completed: true },
      orderBy: { date: "desc" },
      include: {
        sets: { where: { completed: true }, include: { exercise: true }, orderBy: { setNumber: "asc" } },
        programDay: true,
      },
    }) as Promise<SessionWithSets | null>,
    prisma.cardioSession.findFirst({ where: { userId }, orderBy: { date: "desc" } }) as Promise<CardioSession | null>,
    prisma.personalRecord.findMany({
      where: { userId },
      include: { exercise: true },
      orderBy: { date: "desc" },
      take: 5,
    }) as Promise<PRWithExercise[]>,
    prisma.workoutSession.findMany({
      where: { userId, date: { gte: startOfMonth(subMonths(now, 2)), lte: endOfMonth(now) }, completed: true },
      select: { date: true },
    }),
    prisma.cardioSession.findMany({
      where: { userId, date: { gte: startOfMonth(subMonths(now, 2)), lte: endOfMonth(now) } },
      select: { date: true },
    }),
    prisma.program.findFirst({
      where: { userId, isActive: true },
      include: { days: { orderBy: { dayNumber: "asc" }, select: { id: true, name: true, dayNumber: true } } },
    }) as Promise<ProgramWithDays | null>,
    // Monthly sessions with sets for volume calculation
    prisma.workoutSession.findMany({
      where: { userId, date: { gte: startOfMonth(now), lte: endOfMonth(now) }, completed: true },
      select: { sets: { where: { completed: true }, select: { weight: true, reps: true } } },
    }),
  ])

  const allTrainingDays = [
    ...allSessions.map((s) => ({ date: s.date, kind: "strength" as const })),
    ...allCardio.map((c) => ({ date: c.date, kind: "cardio" as const })),
  ]

  const trainingThisMonth = allTrainingDays.filter(
    (d) => new Date(d.date) >= startOfMonth(now) && new Date(d.date) <= endOfMonth(now)
  ).length

  const trainingThisWeek = allTrainingDays.filter(
    (d) => new Date(d.date) >= startOfThisWeek && new Date(d.date) <= now
  ).length

  const totalMonthlyVolume = monthSessions.reduce(
    (acc, s) => acc + s.sets.reduce((a, set) => a + (set.weight ?? 0) * (set.reps ?? 0), 0),
    0
  )

  const groupedExercises = lastWorkout?.sets.reduce<Record<string, typeof lastWorkout.sets>>((acc, set) => {
    const name = set.exercise.nameIt ?? set.exercise.name
    if (!acc[name]) acc[name] = []
    acc[name].push(set)
    return acc
  }, {}) ?? {}

  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), 1)
    d.setDate(1 - d.getDay() + i)
    return d
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ciao, {session?.user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(now, "EEEE d MMMM yyyy", { locale: it })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/cardio?new=1" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            + Cardio
          </Link>
          <Link href="/workouts/new" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="h-4 w-4 mr-1" /> Allenamento
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: <Flame className="h-4 w-4 text-primary" />,
            iconBg: "bg-primary/10",
            value: trainingThisWeek,
            label: "sessioni questa settimana",
          },
          {
            icon: <TrendingUp className="h-4 w-4 text-[oklch(0.52_0.155_55)] dark:text-[oklch(0.72_0.155_55)]" />,
            iconBg: "bg-[oklch(0.65_0.155_55)]/10 dark:bg-[oklch(0.72_0.155_55)]/15",
            value: totalMonthlyVolume > 0 ? `${(totalMonthlyVolume / 1000).toFixed(1)}t` : "—",
            label: "volume questo mese",
          },
          {
            icon: <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />,
            iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
            value: prs.length,
            label: "personal records",
          },
          {
            icon: <Activity className="h-4 w-4 text-primary" />,
            iconBg: "bg-primary/10",
            value: trainingThisMonth,
            label: "sessioni questo mese",
          },
        ].map((stat, i) => (
          <Card key={i} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.iconBg}`}>{stat.icon}</div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active program banner */}
      {activeProgram ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{activeProgram.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeProgram.days.length} giorni ·{" "}
                    {activeProgram.days.map((d) => d.name).join(", ")}
                  </p>
                </div>
              </div>
              <Link href="/workouts/new" className={cn(buttonVariants({ size: "sm" }))}>
                <Dumbbell className="h-3.5 w-3.5 mr-1.5" /> Inizia sessione
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Nessun programma attivo</p>
                <p className="text-xs text-muted-foreground">Crea il tuo programma periodizzato</p>
              </div>
            </div>
            <Link href="/programs/new" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Crea programma
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(now, "MMMM yyyy", { locale: it })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
                <div key={d} className="text-xs text-muted-foreground font-medium py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const isCurrentMonth = day.getMonth() === now.getMonth()
                const isToday = isSameDay(day, now)
                const strengthDay = allTrainingDays.find(
                  (d) => d.kind === "strength" && isSameDay(new Date(d.date), day)
                )
                const cardioDay = allTrainingDays.find(
                  (d) => d.kind === "cardio" && isSameDay(new Date(d.date), day)
                )
                return (
                  <div
                    key={i}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative",
                      !isCurrentMonth && "opacity-30",
                      isToday && "ring-2 ring-primary",
                      strengthDay && !cardioDay && "bg-primary/15 dark:bg-primary/25 text-primary font-semibold",
                      cardioDay && !strengthDay && "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold",
                      strengthDay && cardioDay && "bg-primary/15 dark:bg-primary/25 text-primary font-semibold",
                    )}
                  >
                    {day.getDate()}
                    {(strengthDay || cardioDay) && (
                      <span className="absolute bottom-0.5 flex gap-0.5">
                        {strengthDay && <span className="h-1 w-1 rounded-full bg-primary" />}
                        {cardioDay && <span className="h-1 w-1 rounded-full bg-amber-500" />}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex gap-4 mt-3 justify-end">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary" /> Forza
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Cardio
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Records */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Personal Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nessun PR ancora. Inizia ad allenarti!
              </p>
            ) : (
              <div className="space-y-3">
                {prs.map((pr) => (
                  <div key={pr.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{pr.exercise.nameIt ?? pr.exercise.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(pr.date), "d MMM", { locale: it })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {pr.weight}kg × {pr.reps}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <Link href="/analytics" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full mt-4")}>
              Vedi tutti i progressi
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Last workout */}
      {lastWorkout && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Ultimo allenamento
                {lastWorkout.programDay && (
                  <Badge variant="outline" className="ml-2">{lastWorkout.programDay.name}</Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(lastWorkout.date), "d MMM", { locale: it })}
                </span>
                {lastWorkout.durationMins && (
                  <Badge variant="secondary">{lastWorkout.durationMins} min</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {Object.keys(groupedExercises).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna serie registrata.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(groupedExercises).map(([name, sets]) => (
                  <div key={name} className="bg-muted/40 rounded-lg p-3">
                    <p className="text-sm font-semibold mb-2">{name}</p>
                    <div className="space-y-1">
                      {sets.map((s) => (
                        <div key={s.id} className="flex justify-between text-xs text-muted-foreground">
                          <span>Set {s.setNumber}</span>
                          <span className="font-mono">
                            {s.weight ? `${s.weight}kg` : "—"} × {s.reps ?? "—"}
                            {s.rpe ? ` @${s.rpe}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/workouts" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mt-4")}>
              Vedi storico completo →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
