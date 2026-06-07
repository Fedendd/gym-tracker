"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ChevronLeft, Search, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Exercise { id: string; name: string; nameIt: string | null; category: string }
interface DayExercise {
  exerciseId: string; exerciseName: string
  targetSets: number; targetRepsLow: number; targetRepsHigh: number
  intensityZone: string; plannedLoads: Record<string, string>
}
interface Day { dayNumber: number; name: string; exercises: DayExercise[] }

const CATEGORIES = [
  { key: "PUSH", label: "Spinta" }, { key: "PULL", label: "Tirata" },
  { key: "LEGS", label: "Gambe" }, { key: "CORE", label: "Core" },
  { key: "FULL_BODY", label: "Full Body" },
]

export default function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [weeks, setWeeks] = useState("6")
  const [weeklyRules, setWeeklyRules] = useState<Record<string, string>>({})
  const [showWeeklyRules, setShowWeeklyRules] = useState(false)
  const [days, setDays] = useState<Day[]>([])
  const [exerciseQuery, setExerciseQuery] = useState("")
  const [exerciseResults, setExerciseResults] = useState<Exercise[]>([])
  const [addingToDayIndex, setAddingToDayIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newExName, setNewExName] = useState("")
  const [newExCategory, setNewExCategory] = useState("PUSH")
  const [creatingEx, setCreatingEx] = useState(false)

  // Load program
  useEffect(() => {
    fetch(`/api/programs/${id}`)
      .then((r) => r.json())
      .then((p) => {
        setName(p.name)
        setWeeks(String(p.weeks))
        setWeeklyRules(
          typeof p.weeklyRules === "object" && p.weeklyRules !== null
            ? Object.fromEntries(Object.entries(p.weeklyRules as Record<string, unknown>).map(([k, v]) => [k, String(v)]))
            : {}
        )
        setDays(
          p.days.map((d: { dayNumber: number; name: string; exercises: Array<{ exerciseId: string; exercise: { name: string; nameIt: string | null }; targetSets: number; targetRepsLow: number; targetRepsHigh: number; intensityZone: string | null; plannedLoads: Record<string, number> }> }) => ({
            dayNumber: d.dayNumber,
            name: d.name,
            exercises: d.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              exerciseName: e.exercise.nameIt ?? e.exercise.name,
              targetSets: e.targetSets,
              targetRepsLow: e.targetRepsLow,
              targetRepsHigh: e.targetRepsHigh,
              intensityZone: e.intensityZone ?? "",
              plannedLoads: Object.fromEntries(
                Object.entries(e.plannedLoads).map(([k, v]) => [k, String(v)])
              ),
            })),
          }))
        )
        setLoading(false)
      })
      .catch(() => { toast.error("Errore nel caricamento"); setLoading(false) })
  }, [id])

  useEffect(() => {
    if (exerciseQuery.length < 2) { setExerciseResults([]); setShowCreateForm(false); return }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/exercises?q=${encodeURIComponent(exerciseQuery)}`)
      const data = await res.json()
      setExerciseResults(data.exercises ?? [])
      setShowCreateForm(false)
    }, 300)
    return () => clearTimeout(t)
  }, [exerciseQuery])

  const addDay = () => setDays([...days, { dayNumber: days.length + 1, name: `Day ${days.length + 1}`, exercises: [] }])
  const removeDay = (i: number) => setDays(days.filter((_, idx) => idx !== i))

  const addExerciseToDay = (dayIndex: number, ex: Exercise) => {
    const nd = [...days]
    nd[dayIndex].exercises.push({ exerciseId: ex.id, exerciseName: ex.nameIt ?? ex.name, targetSets: 3, targetRepsLow: 8, targetRepsHigh: 12, intensityZone: "", plannedLoads: {} })
    setDays(nd)
    setExerciseQuery(""); setExerciseResults([]); setAddingToDayIndex(null); setShowCreateForm(false)
  }

  const handleCreateExercise = async (dayIndex: number) => {
    if (!newExName.trim()) return
    setCreatingEx(true)
    const res = await fetch("/api/exercises", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newExName.trim(), nameIt: newExName.trim(), category: newExCategory, muscleGroup: [] }) })
    setCreatingEx(false)
    if (!res.ok) { toast.error("Errore nella creazione"); return }
    const ex: Exercise = await res.json()
    toast.success(`"${ex.nameIt ?? ex.name}" aggiunto`)
    addExerciseToDay(dayIndex, ex)
    setNewExName(""); setNewExCategory("PUSH")
  }

  const removeExercise = (di: number, ei: number) => { const nd = [...days]; nd[di].exercises.splice(ei, 1); setDays(nd) }

  const updateExercise = (di: number, ei: number, field: keyof DayExercise, value: string | number) => {
    const nd = [...days]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(nd[di].exercises[ei] as any)[field] = value
    setDays(nd)
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Inserisci il nome"); return }
    setSaving(true)
    const res = await fetch(`/api/programs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, weeks: parseInt(weeks), isActive: true,
        weeklyRules: Object.fromEntries(Object.entries(weeklyRules).filter(([, v]) => v.trim())),
        days: days.map((d) => ({
          dayNumber: d.dayNumber, name: d.name,
          exercises: d.exercises.map((e, i) => ({
            exerciseId: e.exerciseId, order: i,
            targetSets: e.targetSets, targetRepsLow: e.targetRepsLow, targetRepsHigh: e.targetRepsHigh,
            intensityZone: e.intensityZone || null,
            plannedLoads: Object.fromEntries(Object.entries(e.plannedLoads).map(([k, v]) => [k, parseFloat(v) || 0])),
          })),
        })),
      }),
    })
    setSaving(false)
    if (res.ok) { toast.success("Programma aggiornato!"); router.push("/programs") }
    else toast.error("Errore nel salvataggio")
  }

  const handleDelete = async () => {
    if (!confirm("Eliminare questo programma? L'operazione è irreversibile.")) return
    setDeleting(true)
    const res = await fetch(`/api/programs/${id}`, { method: "DELETE" })
    setDeleting(false)
    if (res.ok) { toast.success("Programma eliminato"); router.push("/programs") }
    else toast.error("Errore nell'eliminazione")
  }

  const numWeeks = parseInt(weeks) || 6

  if (loading) return <div className="max-w-4xl mx-auto p-8 text-center text-muted-foreground">Caricamento...</div>

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/programs" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">Modifica programma</h1>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Eliminazione..." : "Elimina"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nome programma *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Durata (settimane)</Label>
            <Select value={weeks} onValueChange={(v) => v && setWeeks(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                  <SelectItem key={w} value={String(w)}>{w} {w === 1 ? "settimana" : "settimane"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Regole settimanali */}
      <Card>
        <CardContent className="p-0">
          <button className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-muted/40 transition-colors rounded-xl" onClick={() => setShowWeeklyRules(!showWeeklyRules)}>
            <span>Regole per settimana <span className="text-muted-foreground font-normal">(opzionale)</span></span>
            {showWeeklyRules ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {showWeeklyRules && (
            <div className="px-4 pb-4 space-y-3">
              <p className="text-xs text-muted-foreground">Una regola per riga — ogni riga viene mostrata come punto separato durante l'allenamento.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: numWeeks }, (_, i) => i + 1).map((w) => (
                  <div key={w} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Settimana {w}</Label>
                    <Textarea className="text-sm min-h-[72px] resize-none" placeholder={"Una regola per riga, es:\nFocus tecnica 1-2\" salita\nUltima serie a cedimento"} value={weeklyRules[String(w)] ?? ""} onChange={(e) => setWeeklyRules((prev) => ({ ...prev, [String(w)]: e.target.value }))} rows={3} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {days.map((day, dayIdx) => (
        <Card key={dayIdx}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Input className="font-semibold text-base w-48" value={day.name} onChange={(e) => { const nd = [...days]; nd[dayIdx].name = e.target.value; setDays(nd) }} />
              <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => removeDay(dayIdx)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {day.exercises.map((ex, exIdx) => (
              <div key={exIdx} className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{ex.exerciseName}</p>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => removeExercise(dayIdx, exIdx)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Serie</Label>
                    <Input type="number" inputMode="numeric" className="h-8 text-sm" value={ex.targetSets} onChange={(e) => updateExercise(dayIdx, exIdx, "targetSets", parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rep min</Label>
                    <Input type="number" inputMode="numeric" className="h-8 text-sm" value={ex.targetRepsLow} onChange={(e) => updateExercise(dayIdx, exIdx, "targetRepsLow", parseInt(e.target.value))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Rep max</Label>
                    <Input type="number" inputMode="numeric" className="h-8 text-sm" value={ex.targetRepsHigh} onChange={(e) => updateExercise(dayIdx, exIdx, "targetRepsHigh", parseInt(e.target.value))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Peso di partenza (kg) <span className="text-muted-foreground font-normal">— opzionale</span></Label>
                  <Input type="number" inputMode="decimal" step="0.5" className="h-8 text-sm font-mono w-32" placeholder="—" value={ex.plannedLoads["1"] ?? ""} onChange={(e) => { const nd = [...days]; nd[dayIdx].exercises[exIdx].plannedLoads["1"] = e.target.value; setDays(nd) }} />
                </div>
              </div>
            ))}

            {addingToDayIndex === dayIdx ? (
              <div className="border border-dashed rounded-lg p-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Cerca in italiano o inglese..." value={exerciseQuery} onChange={(e) => { setExerciseQuery(e.target.value); setShowCreateForm(false) }} autoFocus />
                </div>
                {exerciseResults.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    {exerciseResults.slice(0, 8).map((ex) => (
                      <button key={ex.id} className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center justify-between gap-2" onClick={() => addExerciseToDay(dayIdx, ex)}>
                        <span>{ex.nameIt ?? ex.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {ex.nameIt && ex.name !== ex.nameIt && <span className="text-xs text-muted-foreground">{ex.name}</span>}
                          <Badge variant="outline" className="text-xs">{ex.category}</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {exerciseQuery.length >= 2 && exerciseResults.length === 0 && !showCreateForm && (
                  <div className="text-center py-3 text-sm text-muted-foreground">
                    <p>Nessun esercizio trovato per <strong>"{exerciseQuery}"</strong></p>
                    <button className="mt-2 text-primary underline-offset-2 hover:underline text-sm" onClick={() => { setNewExName(exerciseQuery); setShowCreateForm(true) }}>+ Aggiungilo alla libreria</button>
                  </div>
                )}
                {showCreateForm && (
                  <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nuovo esercizio</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Nome</Label>
                        <Input className="h-8 text-sm" value={newExName} onChange={(e) => setNewExName(e.target.value)} autoFocus />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Categoria</Label>
                        <Select value={newExCategory} onValueChange={(v) => v && setNewExCategory(v)}>
                          <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleCreateExercise(dayIdx)} disabled={creatingEx || !newExName.trim()}>{creatingEx ? "Aggiunta..." : "Aggiungi e inserisci"}</Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>Annulla</Button>
                    </div>
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={() => { setAddingToDayIndex(null); setExerciseQuery(""); setExerciseResults([]); setShowCreateForm(false) }}>Chiudi</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setAddingToDayIndex(dayIdx)}>
                <Plus className="h-4 w-4 mr-1" /> Aggiungi esercizio
              </Button>
            )}
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" className="w-full" onClick={addDay}><Plus className="h-4 w-4 mr-2" /> Aggiungi giorno</Button>

      <div className="flex gap-3 justify-end pb-6">
        <Link href="/programs" className={cn(buttonVariants({ variant: "outline" }))}>Annulla</Link>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Salvataggio..." : "Salva modifiche"}</Button>
      </div>
    </div>
  )
}
