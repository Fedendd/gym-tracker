"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Trophy } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, subMonths } from "date-fns"
import { it } from "date-fns/locale"

interface WorkoutSession {
  id: string
  date: string
  durationMins: number | null
  sets: Array<{
    exerciseId: string
    weight: number | null
    reps: number | null
    completed: boolean
    exercise: { name: string; nameIt: string | null }
  }>
}

interface CardioSession {
  id: string
  date: string
  type: string
  durationMins: number
  distanceKm: number | null
}

interface PR {
  id: string
  weight: number
  reps: number
  date: string
  exercise: { name: string; nameIt: string | null }
}

export default function AnalyticsPage() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([])
  const [cardio, setCardio] = useState<CardioSession[]>([])
  const [prs, setPrs] = useState<PR[]>([])
  const [selectedExercise, setSelectedExercise] = useState<string>("")

  useEffect(() => {
    Promise.all([
      fetch("/api/workouts").then((r) => r.json()),
      fetch("/api/cardio").then((r) => r.json()),
    ]).then(([w, c]) => {
      setWorkouts(w)
      setCardio(c)

      // Extract PRs per exercise from all sets
      const bestByExercise: Record<string, PR> = {}
      w.forEach((session: WorkoutSession) => {
        session.sets.forEach((s) => {
          if (!s.weight || !s.reps || !s.completed) return
          const key = s.exerciseId
          const existing = bestByExercise[key]
          const volume = s.weight * s.reps
          if (!existing || volume > existing.weight * existing.reps) {
            bestByExercise[key] = {
              id: key,
              weight: s.weight,
              reps: s.reps,
              date: session.date,
              exercise: s.exercise,
            }
          }
        })
      })
      const prList = Object.values(bestByExercise)
      setPrs(prList)
      if (prList.length > 0) setSelectedExercise(prList[0].id)
    })
  }, [])

  // Weekly volume chart
  const now = new Date()
  const weeks = eachWeekOfInterval({
    start: startOfWeek(subMonths(now, 3)),
    end: endOfWeek(now),
  })

  const weeklyVolumeData = weeks.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart)
    const weekWorkouts = workouts.filter((w) => {
      const d = new Date(w.date)
      return d >= weekStart && d <= weekEnd
    })
    const volume = weekWorkouts.reduce((acc, w) => {
      return acc + w.sets.filter((s) => s.completed).reduce((a, s) => a + (s.weight ?? 0) * (s.reps ?? 0), 0)
    }, 0)
    const cardioMins = cardio
      .filter((c) => { const d = new Date(c.date); return d >= weekStart && d <= weekEnd })
      .reduce((a, c) => a + c.durationMins, 0)

    return {
      week: format(weekStart, "d MMM", { locale: it }),
      volume: Math.round(volume),
      cardio: cardioMins,
    }
  })

  // Exercise progress chart
  const exerciseData = workouts.flatMap((w) =>
    w.sets
      .filter((s) => s.exerciseId === selectedExercise && s.completed && s.weight && s.reps)
      .map((s) => ({
        date: format(new Date(w.date), "d MMM", { locale: it }),
        weight: s.weight,
        volume: (s.weight ?? 0) * (s.reps ?? 0),
      }))
  )

  const selectedPR = prs.find((p) => p.id === selectedExercise)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" /> Progressi
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Analisi dei tuoi allenamenti nel tempo</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{workouts.length}</p>
            <p className="text-xs text-muted-foreground mt-1">allenamenti totali</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{cardio.length}</p>
            <p className="text-xs text-muted-foreground mt-1">sessioni cardio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">
              {Math.round(workouts.reduce((acc, w) => acc + (w.durationMins ?? 0), 0) / 60)}h
            </p>
            <p className="text-xs text-muted-foreground mt-1">ore totali di forza</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">
              {Math.round(cardio.reduce((acc, c) => acc + c.durationMins, 0) / 60)}h
            </p>
            <p className="text-xs text-muted-foreground mt-1">ore totali cardio</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly volume */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Volume settimanale (ultimi 3 mesi)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyVolumeData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="volume" name="Volume (kg)" fill="#156f45" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="right" dataKey="cardio" name="Cardio (min)" fill="#d97706" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Exercise progress */}
      {prs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" /> Progressione esercizio
              </CardTitle>
              <Select value={selectedExercise} onValueChange={(v) => v && setSelectedExercise(v)}>
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {prs.map((pr) => (
                    <SelectItem key={pr.id} value={pr.id}>
                      {pr.exercise.nameIt ?? pr.exercise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPR && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">
                  PR: {selectedPR.weight}kg × {selectedPR.reps}
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {exerciseData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nessun dato per questo esercizio
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={exerciseData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="weight" name="Peso (kg)" stroke="#156f45" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* PR table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" /> Tutti i Personal Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nessun PR ancora. Inizia ad allenarti!
            </p>
          ) : (
            <div className="divide-y">
              {prs.map((pr) => (
                <div key={pr.id} className="flex items-center justify-between py-3">
                  <p className="text-sm font-medium">{pr.exercise.nameIt ?? pr.exercise.name}</p>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-mono">
                      {pr.weight}kg × {pr.reps}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(pr.date), "d MMM yyyy", { locale: it })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
