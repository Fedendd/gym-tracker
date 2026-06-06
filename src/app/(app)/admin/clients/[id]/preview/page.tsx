import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { ArrowLeft, Dumbbell, Salad, Trophy, Eye } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default async function ClientPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard")

  const client = await prisma.user.findUnique({
    where: { id, role: "USER" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      dietNote: { select: { title: true, description: true, content: true, updatedAt: true } },
      programs: {
        where: { isActive: true },
        select: { id: true, name: true, weeks: true, days: { select: { name: true }, orderBy: { dayNumber: "asc" } } },
        take: 1,
      },
      workoutSessions: {
        where: { completed: true },
        orderBy: { date: "desc" },
        take: 5,
        include: {
          sets: { where: { completed: true }, include: { exercise: true }, orderBy: { setNumber: "asc" } },
          programDay: { select: { name: true } },
        },
      },
      personalRecords: {
        orderBy: { date: "desc" },
        take: 5,
        include: { exercise: { select: { nameIt: true, name: true } } },
      },
    },
  })

  if (!client) redirect(`/admin/clients`)

  const activeProgram = client.programs[0] ?? null

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Admin preview banner */}
      <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-xl">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-sm font-medium">
          <Eye className="h-4 w-4" />
          Vista simulata di <span className="font-bold ml-1">{client.name ?? client.email}</span>
        </div>
        <Link
          href={`/admin/clients/${id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Torna alla scheda
        </Link>
      </div>

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">Ciao, {client.name?.split(" ")[0] ?? "utente"} 👋</h1>
        <p className="text-muted-foreground text-sm">{format(new Date(), "EEEE d MMMM yyyy", { locale: it })}</p>
      </div>

      {/* Active program */}
      {activeProgram ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Dumbbell className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-sm">{activeProgram.name}</p>
              <p className="text-xs text-muted-foreground">
                {activeProgram.days.map((d) => d.name).join(" · ")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-muted-foreground">Nessun programma attivo</CardContent>
        </Card>
      )}

      {/* Diet note */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Salad className="h-4 w-4 text-emerald-500" />
            {client.dietNote?.title || "Piano alimentare"}
          </CardTitle>
          {client.dietNote?.description && (
            <p className="text-sm text-muted-foreground">{client.dietNote.description}</p>
          )}
        </CardHeader>
        <CardContent>
          {client.dietNote?.content ? (
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
              {client.dietNote.content}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">Nessun piano assegnato ancora.</p>
          )}
        </CardContent>
      </Card>

      {/* Recent workouts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Dumbbell className="h-4 w-4" /> Ultimi allenamenti
          </CardTitle>
        </CardHeader>
        <CardContent>
          {client.workoutSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun allenamento ancora.</p>
          ) : (
            <div className="space-y-2">
              {client.workoutSessions.map((ws) => {
                const volume = ws.sets.reduce((a, s) => a + (s.weight ?? 0) * (s.reps ?? 0), 0)
                const exercises = [...new Set(ws.sets.map((s) => s.exercise.nameIt ?? s.exercise.name))]
                return (
                  <div key={ws.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{ws.programDay?.name ?? "Sessione libera"}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(ws.date), "d MMM yyyy", { locale: it })}
                        {volume > 0 && ` · ${(volume / 1000).toFixed(1)}t`}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exercises.slice(0, 3).map((e) => (
                          <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Records */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" /> Personal Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {client.personalRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun record ancora.</p>
          ) : (
            <div className="space-y-3">
              {client.personalRecords.map((pr, i) => (
                <div key={i} className="flex items-center justify-between">
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
        </CardContent>
      </Card>
    </div>
  )
}
