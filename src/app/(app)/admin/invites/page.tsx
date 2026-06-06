"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Copy, Plus, Trash2, Check, LinkIcon } from "lucide-react"
import { format, isPast } from "date-fns"
import { it } from "date-fns/locale"
import { toast } from "sonner"

interface Invite {
  id: string
  token: string
  email: string | null
  usedAt: string | null
  expiresAt: string
  createdAt: string
}

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const load = () =>
    fetch("/api/admin/invites")
      .then((r) => r.json())
      .then((d) => { setInvites(d); setLoading(false) })

  useEffect(() => { load() }, [])

  const create = async () => {
    setCreating(true)
    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email || undefined }),
    })
    setCreating(false)
    if (res.ok) {
      setEmail("")
      await load()
      toast.success("Link invito creato!")
    } else {
      toast.error("Errore nella creazione")
    }
  }

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/auth/register?invite=${token}`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
    toast.success("Link copiato!")
  }

  const deleteInvite = async (id: string) => {
    await fetch(`/api/admin/invites?id=${id}`, { method: "DELETE" })
    setInvites((prev) => prev.filter((i) => i.id !== id))
  }

  const getStatus = (invite: Invite) => {
    if (invite.usedAt) return { label: "Usato", variant: "secondary" as const }
    if (isPast(new Date(invite.expiresAt))) return { label: "Scaduto", variant: "destructive" as const }
    return { label: "Attivo", variant: "default" as const }
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Link invito</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Crea link per invitare nuovi clienti. Ogni link vale 7 giorni.
        </p>
      </div>

      {/* Create form */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <p className="text-sm font-medium">Nuovo invito</p>
          <div className="flex gap-2">
            <Input
              placeholder="Email del cliente (opzionale)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              type="email"
            />
            <Button onClick={create} disabled={creating} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              {creating ? "..." : "Crea"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            L&apos;email è opzionale — serve solo per ricordare a chi è destinato il link.
          </p>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : invites.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
          <p>Nessun invito creato ancora</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invites.map((invite) => {
            const status = getStatus(invite)
            const isActive = status.label === "Attivo"
            return (
              <Card key={invite.id} className={!isActive ? "opacity-60" : ""}>
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                      {invite.email && (
                        <span className="text-sm font-medium truncate">{invite.email}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Creato {format(new Date(invite.createdAt), "d MMM yyyy", { locale: it })}
                      {" · "}
                      Scade {format(new Date(invite.expiresAt), "d MMM yyyy", { locale: it })}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {isActive && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyLink(invite.token)}
                      >
                        {copied === invite.token ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteInvite(invite.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
