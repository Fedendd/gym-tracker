"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserPlus, ChevronRight, Dumbbell } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { it } from "date-fns/locale"

interface Client {
  id: string
  name: string | null
  email: string
  createdAt: string
  programs: { id: string; name: string }[]
  workoutSessions: { date: string }[]
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/clients")
      .then((r) => r.json())
      .then((d) => { setClients(d); setLoading(false) })
  }, [])

  const initials = (c: Client) =>
    c.name ? c.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : c.email[0].toUpperCase()

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clienti</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? "..." : `${clients.length} clienti registrati`}
          </p>
        </div>
        <Link href="/admin/invites">
          <Button size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invita cliente
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Dumbbell className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Nessun cliente ancora</p>
          <p className="text-sm mt-1">Crea un link invito per aggiungere il primo cliente</p>
          <Link href="/admin/invites" className="mt-4 inline-block">
            <Button size="sm" variant="outline">Crea invito</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => {
            const lastWorkout = client.workoutSessions[0]
            const activeProgram = client.programs[0]
            return (
              <Link key={client.id} href={`/admin/clients/${client.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center gap-4 py-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                        {initials(client)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{client.name ?? "—"}</p>
                      <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {activeProgram && (
                          <Badge variant="secondary" className="text-xs">
                            {activeProgram.name}
                          </Badge>
                        )}
                        {lastWorkout && (
                          <span className="text-xs text-muted-foreground">
                            Ultimo workout{" "}
                            {formatDistanceToNow(new Date(lastWorkout.date), { addSuffix: true, locale: it })}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
