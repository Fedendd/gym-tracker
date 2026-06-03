"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Dumbbell, Search, Play, X } from "lucide-react"
import { cn } from "@/lib/utils"

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

const CATEGORIES = [
  { key: "all",       label: "Tutti",     color: "bg-zinc-800 text-white" },
  { key: "PUSH",      label: "Spinta",    color: "bg-blue-600 text-white" },
  { key: "PULL",      label: "Tirata",    color: "bg-emerald-600 text-white" },
  { key: "LEGS",      label: "Gambe",     color: "bg-orange-500 text-white" },
  { key: "CORE",      label: "Core",      color: "bg-red-600 text-white" },
  { key: "FULL_BODY", label: "Full Body", color: "bg-purple-600 text-white" },
]

const CATEGORY_COLORS: Record<string, string> = {
  PUSH:      "bg-blue-100 text-blue-700",
  PULL:      "bg-emerald-100 text-emerald-700",
  LEGS:      "bg-orange-100 text-orange-700",
  CORE:      "bg-red-100 text-red-700",
  FULL_BODY: "bg-purple-100 text-purple-700",
}

function getYouTubeId(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)
  return m ? m[1] : null
}

function ExerciseImage({ src, alt, animate = false }: { src: string | null; alt: string; animate?: boolean }) {
  const [err, setErr] = useState(false)
  const [frame, setFrame] = useState(0)

  // Derive the alternate frame URL (0.jpg ↔ 1.jpg)
  const src1 = src?.replace("/0.jpg", "/1.jpg") ?? null
  const currentSrc = frame === 0 ? src : src1

  useEffect(() => {
    if (!animate || !src || err) return
    const interval = setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 700)
    return () => clearInterval(interval)
  }, [animate, src, err])

  if (!src || err) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted gap-2">
        <Dumbbell className="h-8 w-8 text-muted-foreground/30" />
        <span className="text-xs text-muted-foreground/50 text-center px-2 leading-tight">{alt}</span>
      </div>
    )
  }
  return (
    <img
      src={currentSrc ?? src}
      alt={alt}
      className="w-full h-full object-cover transition-opacity duration-300"
      onError={() => setErr(true)}
    />
  )
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)

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
    const t = setTimeout(fetchExercises, 250)
    return () => clearTimeout(t)
  }, [fetchExercises])

  const catLabel = CATEGORIES.find((c) => c.key === category)?.label ?? "Tutti"

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Libreria Esercizi</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {loading ? "..." : `${exercises.length} esercizi`} · Clicca per vedere la demo
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cerca esercizio..."
          className="pl-9 h-11"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
              category === cat.key
                ? cat.color + " shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium text-base">Nessun esercizio trovato</p>
          <p className="text-sm mt-1">Prova con un termine diverso o cambia categoria</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
          {exercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelected(ex)}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted shadow-sm hover:shadow-lg transition-all duration-300 text-left"
            >
              <ExerciseImage src={ex.gifUrl} alt={ex.nameIt ?? ex.name} />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {/* Text */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-semibold leading-tight line-clamp-2">
                  {ex.nameIt ?? ex.name}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", CATEGORY_COLORS[ex.category])}>
                    {CATEGORIES.find((c) => c.key === ex.category)?.label ?? ex.category}
                  </span>
                  {ex.youtubeUrl && (
                    <span className="bg-red-500 rounded-full p-0.5">
                      <Play className="h-2.5 w-2.5 text-white fill-white" />
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
          {selected && (
            <>
              {/* Image header */}
              <div className="relative h-64 bg-muted">
                <ExerciseImage src={selected.gifUrl} alt={selected.nameIt ?? selected.name} animate />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <DialogHeader>
                    <DialogTitle className="text-white text-xl font-bold leading-tight">
                      {selected.nameIt ?? selected.name}
                    </DialogTitle>
                  </DialogHeader>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", CATEGORY_COLORS[selected.category])}>
                    {CATEGORIES.find((c) => c.key === selected.category)?.label}
                  </span>
                  {selected.muscleGroup.map((m) => (
                    <Badge key={m} variant="outline" className="text-xs">{m}</Badge>
                  ))}
                </div>

                {/* YouTube embed */}
                {selected.youtubeUrl && getYouTubeId(selected.youtubeUrl) && (
                  <div className="aspect-video rounded-xl overflow-hidden bg-black">
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${getYouTubeId(selected.youtubeUrl)}?autoplay=0&rel=0`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
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
