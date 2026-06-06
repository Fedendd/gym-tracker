"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Salad, Download } from "lucide-react"
import { format } from "date-fns"
import { it } from "date-fns/locale"

interface DietNote {
  title: string
  description: string
  content: string
  updatedAt?: string
}

export default function DietaPage() {
  const { data: session } = useSession()
  const [note, setNote] = useState<DietNote | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return
    fetch(`/api/admin/clients/${session.user.id}/diet`)
      .then((r) => r.json())
      .then((d) => { setNote(d); setLoading(false) })
  }, [session])

  const hasContent = note?.content || note?.description

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {note?.title || "Piano alimentare"}
          </h1>
          {note?.description && (
            <p className="text-muted-foreground text-sm mt-1">{note.description}</p>
          )}
          {!note?.description && (
            <p className="text-muted-foreground text-sm mt-1">Le indicazioni nutrizionali del tuo coach</p>
          )}
        </div>
        {hasContent && (
          <Button variant="outline" size="sm" onClick={() => window.print()} className="no-print">
            <Download className="h-4 w-4 mr-2" />
            Esporta PDF
          </Button>
        )}
      </div>

      {loading ? (
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
      ) : !hasContent ? (
        <div className="text-center py-16 text-muted-foreground">
          <Salad className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium text-base">Nessun piano alimentare ancora</p>
          <p className="text-sm mt-1">Il tuo coach aggiungerà presto le indicazioni nutrizionali</p>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Salad className="h-4 w-4 text-emerald-500" />
              {note?.title || "Indicazioni del coach"}
            </CardTitle>
            {note?.description && (
              <p className="text-sm text-muted-foreground">{note.description}</p>
            )}
            {note?.updatedAt && (
              <p className="text-xs text-muted-foreground no-print">
                Aggiornato il {format(new Date(note.updatedAt), "d MMMM yyyy", { locale: it })}
              </p>
            )}
          </CardHeader>
          {note?.content && (
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                {note.content}
              </pre>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
