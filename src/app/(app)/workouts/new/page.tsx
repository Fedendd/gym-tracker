"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ChevronLeft, Check, Search, BookOpen, ClipboardList } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Exercise {
  id: string
  name: string
  nameIt: string | null
  category: string
  gifUrl: string | null
  youtubeUrl: string | null
}

interface SetData {
  exerciseId: string
  exerciseName: string
  setNumber: number
  weight: string
  reps: string
  rpe: string
  completed: boolean
}

interface ExerciseGroup {
  exerciseId: string
  exerciseName: string
  sets: SetData[]
  gifUrl: string | null
  youtubeUrl: string | null
  intensityZone?: string | null
  targetRepsLow?: number
  targetRepsHigh?: number
}

interface ProgramDay {
  id: string
  name: string
  dayNumber: number
  exercises: Array<{
    exerciseId: string
    targetSets: number
    targetRepsLow: number
    targetRepsHigh: number
    intensityZone: string | null
    plannedLoads: Record<string, number>
    exercise: Exercise
  }>
}

interface Program {
  id: string
  name: string
  weeks: number
  isActive: boolean
  days: ProgramDay[]
}

function getYouTubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)
  return m ? m[1] : null
}

export default function NewWorkoutPage() {
  const router = useRouter()
  const params = useSearchParams()
  const programIdParam = params.get("programId")

  const [mode, setMode] = useState<"program" | "free">("program")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [notes, setNotes] = useState("")
  const [weekNumber, setWeekNumber] = useState("1")
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Exercise[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [demoExercise, setDemoExercise] = useState<Exercise | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadingPrograms, setLoadingPrograms] = useState(true)
  const [startTime] = useState(Date.now())

  // Load all programs on mount
  useEffect(() => {
    fetch("/api/programs")
      .then((r) => r.json())
      .then((data: Program[]) => {
        setPrograms(data)
        if (programIdParam) {
          setSelectedProgramId(programIdParam)
        } else {
          const active = data.find((p) => p.isActive) ?? data[0]
          if (active) setSelectedProgramId(active.id)
        }
        setLoadingPrograms(false)
      })
      .catch(() => setLoadingPrograms(false))
  }, [programIdParam])

  // Auto-select first day when program changes
  useEffect(() => {
    if (!selectedProgramId) return
    const prog = programs.find((p) => p.id === selectedProgramId)
    if (prog && prog.days.length > 0) setSelectedDayId(prog.days[0].id)
    else setSelectedDayId(null)
  }, [selectedProgramId, programs])

  const selectedProgram = programs.find((p) => p.id === selectedProgramId) ?? null

  // Populate exercises from selected day + week
  useEffect(() => {
    if (mode !== "program" || !selectedProgram || !selectedDayId) return
    const day = selectedProgram.days.find((d) => d.id === selectedDayId)
    if (!day) return
    const wk = parseInt(weekNumber) || 1
    setExerciseGroups(
      day.exercises.map((te) => ({
        exerciseId: te.exerciseId,
        exerciseName: te.exercise.nameIt ?? te.exercise.name,
        gifUrl: te.exercise.gifUrl,
        youtubeUrl: te.exercise.youtubeUrl,
        intensityZone: te.intensityZone,
        targetRepsLow: te.targetRepsLow,
        targetRepsHigh: te.targetRepsHigh,
        sets: Array.from({ length: te.targetSets }, (_, i) => ({
          exerciseId: te.exerciseId,
          exerciseName: te.exercise.nameIt ?? te.exercise.name,
          setNumber: i + 1,
          weight: te.plannedLoads[String(wk)] ? String(te.plannedLoads[String(wk)]) : "",
          reps: String(te.targetRepsHigh),
          rpe: "",
          completed: false,
        })),
      }))
    )
  }, [selectedDayId, weekNumber, selectedProgram, mode])

  // Exercise search
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/exercises?q=${searchQuery}`)
      const data = await res.json()
      setSearchResults(data.exercises ?? [])
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const addExercise = (ex: Exercise) => {
    setExerciseGroups((prev) => [
      ...prev,
      {
        exerciseId: ex.id,
        exerciseName: ex.nameIt ?? ex.name,
        gifUrl: ex.gifUrl,
        youtubeUrl: ex.youtubeUrl,
        sets: [{ exerciseId: ex.id, exerciseName: ex.nameIt ?? ex.name, setNumber: 1, weight: "", reps: "", rpe: "", completed: false }],
      },
    ])
    setShowSearch(false)
    setSearchQuery("")
  }

  const addSet = (groupIdx: number) => {
    const g = exerciseGroups[groupIdx]
    const newSet: SetData = { ...g.sets[g.sets.length - 1], setNumber: g.sets.length + 1, completed: false }
    const updated = [...exerciseGroups]
    updated[groupIdx].sets.push(newSet)
    setExerciseGroups(updated)
  }

  const removeSet = (groupIdx: number, setIdx: number) => {
    const group = exerciseGroups[groupIdx]
    const snapshot = JSON.parse(JSON.stringify(exerciseGroups)) as ExerciseGroup[]
    const updated = exerciseGroups.map((g) => ({ ...g, sets: [...g.sets] }))
    updated[groupIdx].sets.splice(setIdx, 1)
    if (updated[groupIdx].sets.length === 0) updated.splice(groupIdx, 1)
    else updated[groupIdx].sets.forEach((s, i) => (s.setNumber = i + 1))
    setExerciseGroups(updated)
    toast(`Set rimosso da "${group.exerciseName}"`, {
      action: { label: "Annulla", onClick: () => setExerciseGroups(snapshot) },
    })
  }

  const updateSet = (groupIdx: number, setIdx: number, field: keyof SetData, value: string | boolean) => {
    const updated = [...exerciseGroups]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(updated[groupIdx].sets[setIdx] as any)[field] = value
    setExerciseGroups(updated)
  }

  const handleSave = async () => {
    if (exerciseGroups.length === 0) { toast.error("Aggiungi almeno un esercizio"); return }
    setSaving(true)
    const durationMins = Math.round((Date.now() - startTime) / 60000)
    const allSets = exerciseGroups.flatMap((g) =>
      g.sets.map((s) => ({
        exerciseId: s.exerciseId,
        setNumber: s.setNumber,
        weight: s.weight ? parseFloat(s.weight) : null,
        reps: s.reps ? parseInt(s.reps) : null,
        rpe: s.rpe ? parseInt(s.rpe) : null,
        completed: s.completed,
      }))
    )
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        notes: notes || null,
        programId: mode === "program" ? selectedProgramId : null,
        programDayId: mode === "program" ? selectedDayId : null,
        weekNumber: mode === "program" ? parseInt(weekNumber) : null,
        durationMins,
        completed: true,
        sets: allSets,
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success("Allenamento salvato!")
      router.push("/workouts")
    } else {
      const err = await res.json().catch(() => null)
      toast.error(err?.message ?? `Errore ${res.status}: impossibile salvare l'allenamento`)
    }
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/workouts" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Nuovo allenamento</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {format(new Date(date + "T12:00:00"), "EEEE d MMMM yyyy", { locale: it })}
          </p>
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-36 h-8 text-sm"
        />
      </div>

      {/* ── Step 1: Scheda + Giorno ── */}
      {mode === "program" && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Scheda &amp; Giorno
              </CardTitle>
              <button
                onClick={() => { setMode("free"); setExerciseGroups([]) }}
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
              >
                Sessione libera
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingPrograms ? (
              <div className="space-y-2">
                <div className="h-6 bg-muted animate-pulse rounded w-40" />
                <div className="grid grid-cols-3 gap-2">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />)}
                </div>
              </div>
            ) : programs.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <ClipboardList className="h-9 w-9 mx-auto mb-2 opacity-30" />
                <p className="font-medium text-sm">Nessuna scheda disponibile</p>
                <p className="text-xs mt-1 mb-4 text-muted-foreground">
                  Crea prima la tua scheda in Programmi, poi torna qui per registrare la sessione.
                </p>
                <div className="flex gap-2 justify-center">
                  <Link href="/programs/new" className={cn(buttonVariants({ size: "sm" }))}>
                    <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Crea scheda
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => { setMode("free") }}>
                    Sessione libera
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Program selector */}
                <div className="flex items-center gap-3">
                  {programs.length === 1 ? (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{selectedProgram?.name}</span>
                      {selectedProgram?.isActive && (
                        <Badge className="text-[10px] h-4 px-1.5">Attiva</Badge>
                      )}
                    </div>
                  ) : (
                    <Select value={selectedProgramId ?? ""} onValueChange={setSelectedProgramId}>
                      <SelectTrigger className="w-auto max-w-xs">
                        <SelectValue placeholder="Seleziona scheda" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}{p.isActive ? " ✓" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {selectedProgram && (
                    <Select value={weekNumber} onValueChange={(v) => v && setWeekNumber(v)}>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: selectedProgram.weeks }, (_, i) => i + 1).map((w) => (
                          <SelectItem key={w} value={String(w)}>Settimana {w}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Day picker */}
                {selectedProgram && selectedProgram.days.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedProgram.days.map((d) => {
                      const active = selectedDayId === d.id
                      return (
                        <button
                          key={d.id}
                          onClick={() => setSelectedDayId(d.id)}
                          className={cn(
                            "p-3 rounded-xl border-2 text-left transition-all",
                            active
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40 hover:bg-muted/50"
                          )}
                        >
                          <p className={cn("font-semibold text-sm", active && "text-primary")}>{d.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {d.exercises.length} esercizi
                          </p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Free session banner */}
      {mode === "free" && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">Sessione libera</p>
          {programs.length > 0 && (
            <button
              onClick={() => setMode("program")}
              className="text-xs text-primary underline-offset-2 hover:underline"
            >
              Usa scheda
            </button>
          )}
        </div>
      )}

      {/* ── Step 2: Esercizi ── */}
      {(exerciseGroups.length > 0 || mode === "free") && (
        <div className="space-y-3">
          {exerciseGroups.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
              Esercizi
            </p>
          )}

          {exerciseGroups.map((group, groupIdx) => (
            <Card key={group.exerciseId + groupIdx} className="animate-fade-up">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CardTitle className="text-base truncate">{group.exerciseName}</CardTitle>
                    {group.intensityZone && (
                      <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {group.intensityZone}
                      </span>
                    )}
                    {group.targetRepsLow != null && group.targetRepsHigh != null && (
                      <span className="shrink-0 text-xs text-muted-foreground font-mono">
                        {group.targetRepsLow}–{group.targetRepsHigh} reps
                      </span>
                    )}
                  </div>
                  {(group.gifUrl || group.youtubeUrl) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground"
                      aria-label="Mostra demo esercizio"
                      onClick={() => setDemoExercise({
                        id: group.exerciseId,
                        name: group.exerciseName,
                        nameIt: group.exerciseName,
                        category: "",
                        gifUrl: group.gifUrl,
                        youtubeUrl: group.youtubeUrl,
                      })}
                    >
                      <BookOpen className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-12 gap-1 text-xs text-muted-foreground mb-1 px-1">
                  <span className="col-span-1">Set</span>
                  <span className="col-span-4">Peso (kg)</span>
                  <span className="col-span-3">Reps</span>
                  <span className="col-span-2" title="Rate of Perceived Exertion: 1 = sforzo minimo, 10 = massimo sforzo possibile">
                    RPE <span className="text-[10px] opacity-60">1–10</span>
                  </span>
                  <span className="col-span-2 text-center">✓</span>
                </div>
                {group.sets.map((set, setIdx) => (
                  <div
                    key={setIdx}
                    className={cn(
                      "grid grid-cols-12 gap-1 items-center transition-opacity duration-150",
                      set.completed && "opacity-50"
                    )}
                  >
                    <span className="col-span-1 text-xs font-mono text-center text-muted-foreground">
                      {set.setNumber}
                    </span>
                    <Input
                      className="col-span-4 h-8 text-sm font-mono"
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      placeholder="—"
                      value={set.weight}
                      onChange={(e) => updateSet(groupIdx, setIdx, "weight", e.target.value)}
                    />
                    <Input
                      className="col-span-3 h-8 text-sm font-mono"
                      type="number"
                      inputMode="numeric"
                      placeholder="—"
                      value={set.reps}
                      onChange={(e) => updateSet(groupIdx, setIdx, "reps", e.target.value)}
                    />
                    <Input
                      className="col-span-2 h-8 text-sm font-mono"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={10}
                      placeholder="—"
                      aria-label="RPE (Rate of Perceived Exertion, scala 1-10)"
                      value={set.rpe}
                      onChange={(e) => updateSet(groupIdx, setIdx, "rpe", e.target.value)}
                    />
                    <div className="col-span-2 flex justify-center gap-1">
                      <Button
                        variant={set.completed ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateSet(groupIdx, setIdx, "completed", !set.completed)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => removeSet(groupIdx, setIdx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground border border-dashed h-8"
                  onClick={() => addSet(groupIdx)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Aggiungi set
                </Button>
              </CardContent>
            </Card>
          ))}

          {/* Add exercise (always visible in free mode, or as extra in program mode) */}
          {showSearch ? (
            <Card>
              <CardContent className="p-3">
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Cerca esercizio..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    {searchResults.slice(0, 6).map((ex) => (
                      <button
                        key={ex.id}
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center justify-between"
                        onClick={() => addExercise(ex)}
                      >
                        <span>{ex.nameIt ?? ex.name}</span>
                        <Badge variant="outline" className="text-xs">{ex.category}</Badge>
                      </button>
                    ))}
                  </div>
                )}
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowSearch(false)}>
                  Annulla
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full border-dashed text-muted-foreground"
              onClick={() => setShowSearch(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {mode === "program" ? "Aggiungi esercizio extra" : "Aggiungi esercizio"}
            </Button>
          )}
        </div>
      )}

      {/* ── Step 3: Note + Salva ── */}
      {(exerciseGroups.length > 0 || mode === "free") && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Note sessione</Label>
            <Textarea
              placeholder="Come ti sei sentito? Hai rispettato i carichi? Hai notato progressi?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving || exerciseGroups.length === 0}
          >
            {saving ? "Salvataggio..." : "Salva allenamento"}
          </Button>
        </div>
      )}

      {/* Demo dialog */}
      <Dialog open={!!demoExercise} onOpenChange={(o) => !o && setDemoExercise(null)}>
        <DialogContent className="max-w-xl">
          {demoExercise && (
            <>
              <DialogHeader>
                <DialogTitle>{demoExercise.nameIt ?? demoExercise.name}</DialogTitle>
              </DialogHeader>
              {demoExercise.youtubeUrl && getYouTubeId(demoExercise.youtubeUrl) ? (
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${getYouTubeId(demoExercise.youtubeUrl!)}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : demoExercise.gifUrl ? (
                <div className="flex justify-center">
                  <img
                    src={demoExercise.gifUrl}
                    alt={demoExercise.name}
                    className="rounded-lg max-h-64 object-contain"
                  />
                </div>
              ) : null}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
