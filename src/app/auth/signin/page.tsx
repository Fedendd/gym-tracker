"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dumbbell } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Get CSRF token
      const csrfRes = await fetch("/api/auth/csrf")
      const { csrfToken } = await csrfRes.json()

      // POST credentials — follow redirect to see final URL
      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          email,
          password,
          csrfToken,
          callbackUrl: "/dashboard",
        }),
        redirect: "follow",
      })

      const finalUrl = res.url
      if (res.redirected && !finalUrl.includes("error=")) {
        window.location.href = "/dashboard"
      } else if (finalUrl.includes("error=")) {
        setError("Email o password errati")
        setLoading(false)
      } else if (res.ok) {
        window.location.href = "/dashboard"
      } else {
        setError("Errore durante l'accesso. Riprova.")
        setLoading(false)
      }
    } catch {
      setError("Errore di rete. Controlla la connessione.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary">
              <Dumbbell className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Gym Tracker</CardTitle>
          <CardDescription>Accedi al tuo account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tua@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Accesso in corso..." : "Accedi"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Non hai un account?{" "}
            <Link
              href="/auth/register"
              className={cn(
                "underline",
                buttonVariants({ variant: "link", size: "sm" }),
                "p-0 h-auto"
              )}
            >
              Registrati
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
