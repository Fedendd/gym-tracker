"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export async function loginAction(_prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  console.log("[LOGIN] tentativo per:", email)
  console.log("[LOGIN] password ricevuta:", password ? `${password.length} chars` : "VUOTA")

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    })
    console.log("[LOGIN] signIn ha restituito (no throw):", result)
    return { redirect: true }
  } catch (error) {
    console.log("[LOGIN] errore tipo:", error instanceof AuthError ? "AuthError" : typeof error)
    if (error && typeof error === "object" && "digest" in error) {
      console.log("[LOGIN] digest:", (error as { digest: string }).digest)
    }

    if (error instanceof AuthError) {
      console.log("[LOGIN] AuthError cause:", (error as AuthError).cause)
      return { error: "Email o password errati" }
    }

    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest: string }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      console.log("[LOGIN] NEXT_REDIRECT rilevato — cookie settati, redirect al client")
      return { redirect: true }
    }

    console.log("[LOGIN] errore sconosciuto:", error)
    throw error
  }
}
