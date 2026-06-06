"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ArrowLeft, Dumbbell, Salad, Activity, Trophy, Save, Check, User, Eye, Download, Plus, ClipboardList
} from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ClientDetail {
  id: string
  name: string | null
  email: string
  phone: string | null
  dateOfBirth: string | null
  createdAt: string
  dietNote: { title: string; description: string; content: string; updatedAt: string } | null
  programs: { id: string; name: string; weeks: number; isActive: boolean; createdAt: string }[]
  workoutSessions: {
    id: string; date: string; durationMins: number | null; completed: boolean
    program: { name: string } | null; programDay: { name: string } | null
  }[]
  cardioSessions: { id: string; date: string; type: string; durationMins: number; distanceKm: number | null }[]
  personalRecords: { weight: number; reps: number; date: string; exercise: { nameIt: string | null; name: string } }[]
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [tab, setTab] = useState<"overview" | "profile" | "diet" | "workouts" | "records">("overview")

  // Diet state
  const [dietTitle, setDietTitle] = useState("")
  const [dietDescription, setDietDescription] = useState("")
  const [dietContent, setDietContent] = useState("")
  const [savingDiet, setSavingDiet] = useState(false)
  const [savedDiet, setSavedDiet] = useState(false)

  // Profile state
  const [profileName, setProfileName] = useState("")
  const [profilePhone, setProfilePhone] = useState("")
  const [profileDob, setProfileDob] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/clients/${id}`)
      .then((r) => r.json())
      .then((d: ClientDetail) => {
        setClient(d)
        setDietTitle(d.dietNote?.title ?? "Piano alimentare")
        setDietDescription(d.dietNote?.description ?? "")
        setDietContent(d.dietNote?.content ?? "")
        setProfileName(d.name ?? "")
        setProfilePhone(d.phone ?? "")
        setProfileDob(d.dateOfBirth ? d.dateOfBirth.slice(0, 10) : "")
      })
  }, [id])

  const saveDiet = async () => {
    setSavingDiet(true)
    const res = await fetch(`/api/admin/clients/${id}/diet`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: dietTitle, description: dietDescription, content: dietContent }),
    })
    setSavingDiet(false)
    if (res.ok) {
      setSavedDiet(true)
      setTimeout(() => setSavedDiet(false), 2000)
    } else {
      toast.error("Errore nel salvataggio")
    }
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    const res = await fetch(`/api/admin/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: profileName || null,
        phone: profilePhone || null,
        dateOfBirth: profileDob || null,
      }),
    })
    setSavingProfile(false)
    if (res.ok) {
      const updated = await res.json()
      setClient((prev) => prev ? { ...prev, ...updated } : prev)
      setSavedProfile(true)
      setTimeout(() => setSavedProfile(false), 2000)
    } else {
      toast.error("Errore nel salvataggio")
    }
  }

  const printDiet = () => {
    const w = window.open("", "_blank", "width=800,height=700")
    if (!w) return
    w.document.write(`
      <html>
      <head>
        <title>${dietTitle}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 2.5rem; max-width: 700px; margin: 0 auto; color: #111; }
          h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
          .desc { color: #666; font-size: 0.95rem; margin-bottom: 1.5rem; }
          hr { border: none; border-top: 1px solid #eee; margin: 1.5rem 0; }
          pre { white-space: pre-wrap; font-family: inherit; line-height: 1.7; font-size: 0.95rem; }
          .footer { margin-top: 2rem; font-size: 0.8rem; color: #999; }
        </style>
      </head>
      <body>
        <h1>${dietTitle}</h1>
        ${dietDescription ? `<p class="desc">${dietDescription}</p>` : ""}
        <hr />
        <pre>${dietContent}</pre>
        <p class="footer">Piano generato il ${new Date().toLocaleDateString("it-IT")}</p>
      </body>
      </html>
    `)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 400)
  }

  if (!client) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded-xl" />
      </div>
    )
  }

  const initials = client.name
    ? client.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : client.email[0].toUpperCase()

  const hasDiet = !!(client.dietNote?.content || client.dietNote?.description)
  const activeProgram = client.programs.find((p) => p.isActive)

  const TABS = [
    { key: "overview", label: "Panoramica", icon: Dumbbell },
    { key: "profile",  label: "Profilo",    icon: User },
    { key: "diet",     label: "Dieta",      icon: Salad },
    { key: "workouts", label: "Workout",    icon: Activity },
    { key: "records",  label: "Record",     icon: Trophy },
  ] as const

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold leading-tight truncate">{client.name ?? "—"}</h1>
          <p className="text-sm text-muted-foreground truncate">{client.email}</p>
        </div>
        <Link
          href={`/admin/clients/${id}/preview`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <Eye className="h-3.5 w-3.5" /> Simula
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
              tab === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Panoramica */}
      {tab === "overview" && (
        <div className="space-y-3">
          {/* Status card */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Stato assegnazioni</p>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <Salad className="h-4 w-4 text-emerald-500" /> Piano dieta
                </span>
                {hasDiet
                  ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0">{client.dietNote?.title ?? "Attivo"}</Badge>
                  : <Badge variant="outline" className="text-muted-foreground">Non assegnato</Badge>
                }
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-blue-500" /> Programma allenamento
                </span>
                {activeProgram
                  ? <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-0">{activeProgram.name}</Badge>
                  : <Badge variant="outline" className="text-muted-foreground">Non assegnato</Badge>
                }
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Programmi</p>
                <p className="text-2xl font-bold mt-1">{client.programs.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Workout</p>
                <p className="text-2xl font-bold mt-1">{client.workoutSessions.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {client.workoutSessions.filter((s) => s.completed).length} completati
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Cardio</p>
                <p className="text-2xl font-bold mt-1">{client.cardioSessions.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Record</p>
                <p className="text-2xl font-bold mt-1">{client.personalRecords.length}</p>
              </CardContent>
            </Card>
            <Card className="col-span-2">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Iscritto il</p>
                <p className="font-medium">{format(new Date(client.createdAt), "d MMMM yyyy", { locale: it })}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Profilo */}
      {tab === "profile" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Scheda cliente</CardTitle>
            <p className="text-sm text-muted-foreground">Informazioni anagrafiche del cliente</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prof-name">Nome completo</Label>
              <Input
                id="prof-name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Mario Rossi"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={client.email} disabled className="bg-muted text-muted-foreground" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-phone">Telefono</Label>
              <Input
                id="prof-phone"
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="+39 333 1234567"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-dob">Data di nascita</Label>
              <Input
                id="prof-dob"
                type="date"
                value={profileDob}
                onChange={(e) => setProfileDob(e.target.value)}
              />
            </div>
            <div className="pt-1">
              <Button onClick={saveProfile} disabled={savingProfile} className="gap-2">
                {savedProfile ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {savingProfile ? "Salvataggio..." : savedProfile ? "Salvato!" : "Salva scheda"}
              </Button>
            </div>
            <div className="pt-2 border-t text-xs text-muted-foreground">
              Iscritto il {format(new Date(client.createdAt), "d MMMM yyyy", { locale: it })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dieta */}
      {tab === "diet" && (
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Piano dieta</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Visibile al cliente nella sezione Dieta.
                  </p>
                </div>
                {(dietContent || dietDescription) && (
                  <Button variant="outline" size="sm" onClick={printDiet} className="gap-1.5 shrink-0">
                    <Download className="h-3.5 w-3.5" /> PDF
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="diet-title">Nome del piano</Label>
                <Input
                  id="diet-title"
                  value={dietTitle}
                  onChange={(e) => setDietTitle(e.target.value)}
                  placeholder="es. Piano di massa, Definizione estiva..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="diet-desc">Descrizione breve</Label>
                <Input
                  id="diet-desc"
                  value={dietDescription}
                  onChange={(e) => setDietDescription(e.target.value)}
                  placeholder="es. 2500 kcal · focus su ipertrofia · 6 pasti"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="diet-content">Dettaglio piano pasti</Label>
                <Textarea
                  id="diet-content"
                  value={dietContent}
                  onChange={(e) => setDietContent(e.target.value)}
                  placeholder="Colazione: ...&#10;Pranzo: ...&#10;Cena: ..."
                  className="min-h-[260px] resize-none font-mono text-sm"
                />
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={saveDiet} disabled={savingDiet} className="gap-2">
                  {savedDiet ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                  {savingDiet ? "Salvataggio..." : savedDiet ? "Salvato!" : "Salva"}
                </Button>
                {client.dietNote?.updatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Aggiornato: {format(new Date(client.dietNote.updatedAt), "d MMM yyyy, HH:mm", { locale: it })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workout */}
      {tab === "workouts" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {client.workoutSessions.length} sessioni registrate
            </p>
            <Link
              href={`/programs/new?clientId=${id}&clientName=${encodeURIComponent(client.name ?? client.email)}`}
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
            >
              <Plus className="h-3.5 w-3.5" /> Crea scheda
            </Link>
          </div>
          {client.workoutSessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
              <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p>Nessun workout ancora</p>
            </div>
          ) : client.workoutSessions.map((ws) => (
            <Card key={ws.id}>
              <CardContent className="flex items-center gap-3 py-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${ws.completed ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {ws.programDay?.name ?? ws.program?.name ?? "Allenamento libero"}
                  </p>
                  {ws.program && ws.programDay && (
                    <p className="text-xs text-muted-foreground">{ws.program.name}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">
                    {format(new Date(ws.date), "d MMM", { locale: it })}
                  </p>
                  {ws.durationMins && (
                    <p className="text-xs text-muted-foreground">{ws.durationMins} min</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Record */}
      {tab === "records" && (
        <div className="space-y-2">
          {client.personalRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p>Nessun record ancora</p>
            </div>
          ) : client.personalRecords.map((pr, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm">{pr.exercise.nameIt ?? pr.exercise.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(pr.date), "d MMM yyyy", { locale: it })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{pr.weight} kg</p>
                  <p className="text-xs text-muted-foreground">{pr.reps} rip</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
