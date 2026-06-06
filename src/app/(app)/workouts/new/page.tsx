"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ChevronLeft, Check, Search, BookOpen } from "lucide-react"
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

  const [mode, setMode] = useState<"free" | "program">(programIdParam ? "program" : "free")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [notes, setNotes] = useState("")
  const [weekNumber, setWeekNumber] = useState("1")
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [program, setProgram] = useState<Program | null>(null)
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Exercise[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [demoExercise, setDemoExercise] = useState<Exercise | null>(null)
  const [saving, setSaving] = useState(false)
  const [startTime] = useState(Date.now())

  const loadProgram = useCallback(async (id: string) => {
    const res = await fetch("/api/programs")
    const programs: Program[] = await res.json()
    const p = programs.find((p) => p.id === id)
    if (p) {
      setProgram(p)
      if (p.days.length > 0) setSelectedDayId(p.days[0].id)
    }
  }, [])

  useEffect(() => {
    if (programIdParam) loadProgram(programIdParam)
  }, [programIdParam, loadProgram])

  // When a day is selected in program mode, populate exercise groups from template
  useEffect(() => {
    if (mode !== "program" || !program || !selectedDayId) return
    const day = program.days.find((d) => d.id === selectedDayId)
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
  }, [selectedDayId, weekNumber, program, mode])

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/exercises?q=${searchQuery}`)
      setSearchResults(await res.json())
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
        programId: mode === "program" ? programIdParam : null,
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
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/workouts" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Nuovo allenamento</h1>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "free" | "program")}>
            <TabsList className="w-full">
              <TabsTrigger value="free" className="flex-1">Sessione libera</TabsTrigger>
              <TabsTrigger value="program" className="flex-1">Da programma</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            {mode === "program" && program && (
              <div className="space-y-1.5">
                <Label>Settimana</Label>
                <Select value={weekNumber} onValueChange={(v) => v && setWeekNumber(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: program.weeks }, (_, i) => i + 1).map((w) => (
                      <SelectItem key={w} value={String(w)}>Settimana {w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {mode === "program" && program && (
            <div className="space-y-1.5">
              <Label>Giorno</Label>
              <div className="flex gap-2">
                {program.days.map((d) => (
                  <Button
                    key={d.id}
                    variant={selectedDayId === d.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDayId(d.id)}
                  >
                    {d.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exercises */}
      <div className="space-y-3">
        {exerciseGroups.map((group, groupIdx) => (
          <Card key={groupIdx}>
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
                <div className="flex gap-1 shrink-0">
                  {(group.gifUrl || group.youtubeUrl) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      aria-label="Mostra demo esercizio"
                      onClick={() => setDemoExercise({ id: group.exerciseId, name: group.exerciseName, nameIt: group.exerciseName, category: "", gifUrl: group.gifUrl, youtubeUrl: group.youtubeUrl })}
                    >
                      <BookOpen className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-12 gap-1 text-xs text-muted-foreground mb-1 px-1">
                <span className="col-span-1">Set</span>
                <span className="col-span-4">Peso (kg)</span>
                <span className="col-span-3">Reps</span>
                <span className="col-span-2" title="Rate of Perceived Exertion: 1 = sforzo minimo, 10 = massimo sforzo possibile">RPE <span className="text-[10px] opacity-60">1–10</span></span>
                <span className="col-span-2 text-center">✓</span>
              </div>
              {group.sets.map((set, setIdx) => (
                <div key={setIdx} className={cn("grid grid-cols-12 gap-1 items-center transition-opacity duration-150", set.completed && "opacity-50")}>
                  <span className="col-span-1 text-xs font-mono text-center text-muted-foreground">{set.setNumber}</span>
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
      </div>

      {/* Add exercise */}
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
        <Button variant="outline" className="w-full border-dashed" onClick={() => setShowSearch(true)}>
          <Plus className="h-4 w-4 mr-2" /> Aggiungi esercizio
        </Button>
      )}

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Note sessione</Label>
          <Textarea
            placeholder="Come ti sei sentito? Hai notato progressi?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
        <Button className="w-full" onClick={handleSave} disabled={saving || exerciseGroups.length === 0}>
          {saving ? "Salvataggio..." : "Salva allenamento"}
        </Button>
      </div>

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
                  <img src={demoExercise.gifUrl} alt={demoExercise.name} className="rounded-lg max-h-64 object-contain" />
                </div>
              ) : null}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
