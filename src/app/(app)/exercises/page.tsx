"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BookOpen, Search, Play } from "lucide-react"

interface Exercise {
  id: string
  name: string
  nameIt: string | null
  category: string
  muscleGroup: string[]
  gifUrl: string | null
  youtubeUrl: string | null
  description: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  PUSH: "Spinta",
  PULL: "Tirata",
  LEGS: "Gambe",
  CORE: "Core",
  FULL_BODY: "Full Body",
}

function getYouTubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)
  return m ? m[1] : null
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchExercises = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (category !== "all") params.set("category", category)
    const res = await fetch(`/api/exercises?${params}`)
    const data = await res.json()
    setExercises(data)
    setLoading(false)
  }, [query, category])

  useEffect(() => {
    const t = setTimeout(fetchExercises, 300)
    return () => clearTimeout(t)
  }, [fetchExercises])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" /> Libreria Esercizi
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Clicca su un esercizio per vedere la demo
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca esercizio..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={(v) => v && setCategory(v)}>
          <SelectTrigger className="w-40">
            <SelectValue>
              {category === "all" ? "Tutte" : (CATEGORY_LABELS[category] ?? category)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nessun esercizio trovato</p>
          <p className="text-sm mt-1">Prova a cercare con un termine diverso</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {exercises.map((ex) => (
            <Card
              key={ex.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelected(ex)}
            >
              <CardContent className="p-3">
                {ex.gifUrl ? (
                  <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-muted">
                    <img src={ex.gifUrl} alt={ex.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-muted flex items-center justify-center mb-2">
                    <BookOpen className="h-8 w-8 text-muted-foreground opacity-40" />
                  </div>
                )}
                <p className="text-sm font-medium leading-tight">{ex.nameIt ?? ex.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {CATEGORY_LABELS[ex.category] ?? ex.category}
                  </Badge>
                  {ex.youtubeUrl && (
                    <span className="text-red-500">
                      <Play className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Exercise detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.nameIt ?? selected.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{CATEGORY_LABELS[selected.category] ?? selected.category}</Badge>
                  {selected.muscleGroup.map((m) => (
                    <Badge key={m} variant="outline">{m}</Badge>
                  ))}
                </div>

                {/* YouTube player */}
                {selected.youtubeUrl && getYouTubeId(selected.youtubeUrl) && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${getYouTubeId(selected.youtubeUrl)}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* GIF fallback */}
                {!selected.youtubeUrl && selected.gifUrl && (
                  <div className="flex justify-center">
                    <img
                      src={selected.gifUrl}
                      alt={selected.name}
                      className="rounded-lg max-h-64 object-contain"
                    />
                  </div>
                )}

                {selected.description && (
                  <p className="text-sm text-muted-foreground">{selected.description}</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
