"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ChevronLeft, Search } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Exercise {
  id: string
  name: string
  nameIt: string | null
  category: string
}

interface DayExercise {
  exerciseId: string
  exerciseName: string
  targetSets: number
  targetRepsLow: number
  targetRepsHigh: number
  intensityZone: string
  plannedLoads: Record<string, string>
}

interface Day {
  dayNumber: number
  name: string
  exercises: DayExercise[]
}

export default function NewProgramPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [weeks, setWeeks] = useState("6")
  const [days, setDays] = useState<Day[]>([
    { dayNumber: 1, name: "Day 1", exercises: [] },
    { dayNumber: 2, name: "Day 2", exercises: [] },
    { dayNumber: 3, name: "Day 3", exercises: [] },
  ])
  const [exerciseQuery, setExerciseQuery] = useState("")
  const [exerciseResults, setExerciseResults] = useState<Exercise[]>([])
  const [addingToDayIndex, setAddingToDayIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (exerciseQuery.length < 2) { setExerciseResults([]); return }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/exercises?q=${exerciseQuery}`)
      setExerciseResults(await res.json())
    }, 300)
    return () => clearTimeout(t)
  }, [exerciseQuery])

  const addDay = () => {
    setDays([...days, { dayNumber: days.length + 1, name: `Day ${days.length + 1}`, exercises: [] }])
  }

  const removeDay = (i: number) => {
    setDays(days.filter((_, idx) => idx !== i))
  }

  const addExerciseToDay = (dayIndex: number, ex: Exercise) => {
    const newDays = [...days]
    newDays[dayIndex].exercises.push({
      exerciseId: ex.id,
      exerciseName: ex.nameIt ?? ex.name,
      targetSets: 3,
      targetRepsLow: 8,
      targetRepsHigh: 12,
      intensityZone: "",
      plannedLoads: {},
    })
    setDays(newDays)
    setExerciseQuery("")
    setExerciseResults([])
    setAddingToDayIndex(null)
  }

  const removeExercise = (dayIdx: number, exIdx: number) => {
    const newDays = [...days]
    newDays[dayIdx].exercises.splice(exIdx, 1)
    setDays(newDays)
  }

  const updateExercise = (dayIdx: number, exIdx: number, field: keyof DayExercise, value: string | number) => {
    const newDays = [...days]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(newDays[dayIdx].exercises[exIdx] as any)[field] = value
    setDays(newDays)
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Inserisci il nome del programma"); return }
    setSaving(true)
    const res = await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        weeks: parseInt(weeks),
        isActive: true,
        days: days.map((d) => ({
          dayNumber: d.dayNumber,
          name: d.name,
          exercises: d.exercises.map((e, i) => ({
            exerciseId: e.exerciseId,
            order: i,
            targetSets: e.targetSets,
            targetRepsLow: e.targetRepsLow,
            targetRepsHigh: e.targetRepsHigh,
            intensityZone: e.intensityZone || null,
            plannedLoads: Object.fromEntries(
              Object.entries(e.plannedLoads).map(([k, v]) => [k, parseFloat(v) || 0])
            ),
          })),
        })),
      }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success("Programma creato!")
      router.push("/programs")
    } else {
      toast.error("Errore nel salvataggio")
    }
  }

  const numWeeks = parseInt(weeks) || 6

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/programs" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">Nuovo programma</h1>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nome programma *</Label>
            <Input
              placeholder="es. Programma Forza 6 Settimane"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Durata (settimane)</Label>
            <Select value={weeks} onValueChange={(v) => v && setWeeks(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[4, 6, 8, 10, 12].map((w) => (
                  <SelectItem key={w} value={String(w)}>{w} settimane</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {days.map((day, dayIdx) => (
        <Card key={dayIdx}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Input
                className="font-semibold text-base w-48"
                value={day.name}
                onChange={(e) => {
                  const nd = [...days]; nd[dayIdx].name = e.target.value; setDays(nd)
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive h-8 w-8"
                onClick={() => removeDay(dayIdx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {day.exercises.map((ex, exIdx) => (
              <div key={exIdx} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{ex.exerciseName}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={() => removeExercise(dayIdx, exIdx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Serie</Label>
                    <Input
                      type="number"
                      className="h-8 text-sm"
                      value={ex.targetSets}
                      onChange={(e) => updateExercise(dayIdx, exIdx, "targetSets", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rep min</Label>
                    <Input
                      type="number"
                      className="h-8 text-sm"
                      value={ex.targetRepsLow}
                      onChange={(e) => updateExercise(dayIdx, exIdx, "targetRepsLow", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rep max</Label>
                    <Input
                      type="number"
                      className="h-8 text-sm"
                      value={ex.targetRepsHigh}
                      onChange={(e) => updateExercise(dayIdx, exIdx, "targetRepsHigh", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Zona intensità</Label>
                    <Input
                      className="h-8 text-sm"
                      placeholder="60-75%"
                      value={ex.intensityZone}
                      onChange={(e) => updateExercise(dayIdx, exIdx, "intensityZone", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-2 block">Carichi per settimana (kg)</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {Array.from({ length: numWeeks }, (_, w) => w + 1).map((week) => (
                      <div key={week} className="space-y-0.5">
                        <Label className="text-xs text-muted-foreground">W{week}</Label>
                        <Input
                          type="number"
                          className="h-7 text-xs font-mono"
                          placeholder="—"
                          value={ex.plannedLoads[String(week)] ?? ""}
                          onChange={(e) => {
                            const nd = [...days]
                            nd[dayIdx].exercises[exIdx].plannedLoads[String(week)] = e.target.value
                            setDays(nd)
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Add exercise */}
            {addingToDayIndex === dayIdx ? (
              <div className="border border-dashed rounded-lg p-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8"
                    placeholder="Cerca esercizio..."
                    value={exerciseQuery}
                    onChange={(e) => setExerciseQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                {exerciseResults.length > 0 && (
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    {exerciseResults.slice(0, 6).map((ex) => (
                      <button
                        key={ex.id}
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center justify-between"
                        onClick={() => addExerciseToDay(dayIdx, ex)}
                      >
                        <span>{ex.nameIt ?? ex.name}</span>
                        <Badge variant="outline" className="text-xs">{ex.category}</Badge>
                      </button>
                    ))}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => { setAddingToDayIndex(null); setExerciseQuery(""); setExerciseResults([]) }}
                >
                  Annulla
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() => setAddingToDayIndex(dayIdx)}
              >
                <Plus className="h-4 w-4 mr-1" /> Aggiungi esercizio
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" className="w-full" onClick={addDay}>
        <Plus className="h-4 w-4 mr-2" /> Aggiungi giorno
      </Button>

      <div className="flex gap-3 justify-end">
        <Link href="/programs" className={cn(buttonVariants({ variant: "outline" }))}>Annulla</Link>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvataggio..." : "Crea programma"}
        </Button>
      </div>
    </div>
  )
}
