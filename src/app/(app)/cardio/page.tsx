"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { it } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Activity, Plus, Clock, MapPin, Heart } from "lucide-react"
import { toast } from "sonner"

interface CardioSession {
  id: string
  date: string
  type: string
  durationMins: number
  distanceKm: number | null
  avgHeartRate: number | null
  calories: number | null
  notes: string | null
}

const TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  CORSA: { label: "Corsa", emoji: "🏃" },
  CICLISMO: { label: "Ciclismo", emoji: "🚴" },
  HIIT: { label: "HIIT", emoji: "⚡" },
  CAMMINATA: { label: "Camminata", emoji: "🚶" },
  NUOTO: { label: "Nuoto", emoji: "🏊" },
  ALTRO: { label: "Altro", emoji: "🏋️" },
}

export default function CardioPage() {
  const [sessions, setSessions] = useState<CardioSession[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    type: "CORSA",
    durationMins: "",
    distanceKm: "",
    avgHeartRate: "",
    calories: "",
    notes: "",
  })

  const fetchSessions = async () => {
    const res = await fetch("/api/cardio")
    const data = await res.json()
    setSessions(data)
  }

  useEffect(() => { fetchSessions() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.durationMins) { toast.error("Inserisci la durata"); return }

    const res = await fetch("/api/cardio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        durationMins: parseInt(form.durationMins),
        distanceKm: form.distanceKm ? parseFloat(form.distanceKm) : null,
        avgHeartRate: form.avgHeartRate ? parseInt(form.avgHeartRate) : null,
        calories: form.calories ? parseInt(form.calories) : null,
      }),
    })

    if (res.ok) {
      toast.success("Sessione cardio salvata!")
      setOpen(false)
      setForm({ date: format(new Date(), "yyyy-MM-dd"), type: "CORSA", durationMins: "", distanceKm: "", avgHeartRate: "", calories: "", notes: "" })
      fetchSessions()
    } else {
      toast.error("Errore nel salvataggio")
    }
  }

  const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMins, 0)
  const avgDuration = sessions.length ? Math.round(totalMinutes / sessions.length) : 0

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" /> Cardio
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Traccia le tue sessioni aerobiche</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Nuova sessione</Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aggiungi sessione cardio</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPE_LABELS).map(([k, { label, emoji }]) => (
                        <SelectItem key={k} value={k}>{emoji} {label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Durata (min) *</Label>
                  <Input
                    type="number"
                    placeholder="15"
                    value={form.durationMins}
                    onChange={(e) => setForm({ ...form, durationMins: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Distanza (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="3.5"
                    value={form.distanceKm}
                    onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>FC media (bpm)</Label>
                  <Input
                    type="number"
                    placeholder="145"
                    value={form.avgHeartRate}
                    onChange={(e) => setForm({ ...form, avgHeartRate: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Calorie</Label>
                  <Input
                    type="number"
                    placeholder="200"
                    value={form.calories}
                    onChange={(e) => setForm({ ...form, calories: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Note</Label>
                <Textarea
                  placeholder="Come ti sei sentito..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full">Salva sessione</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{sessions.length}</p>
            <p className="text-xs text-muted-foreground mt-1">sessioni totali</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totalMinutes}</p>
            <p className="text-xs text-muted-foreground mt-1">minuti totali</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{avgDuration}</p>
            <p className="text-xs text-muted-foreground mt-1">min media sessione</p>
          </CardContent>
        </Card>
      </div>

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nessuna sessione cardio</p>
          <p className="text-sm mt-1">Inizia aggiungendo la tua prima sessione</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const t = TYPE_LABELS[s.type] ?? { label: s.type, emoji: "🏋️" }
            return (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{t.emoji}</span>
                      <div>
                        <p className="font-medium">{t.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(s.date), "d MMMM yyyy", { locale: it })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{s.durationMins} min</span>
                      </div>
                      {s.distanceKm && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{s.distanceKm} km</span>
                        </div>
                      )}
                      {s.avgHeartRate && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Heart className="h-3.5 w-3.5 text-red-400" />
                          <span>{s.avgHeartRate} bpm</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {s.notes && (
                    <p className="text-xs text-muted-foreground mt-2 pl-11">{s.notes}</p>
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
