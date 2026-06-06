import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar, BottomNav } from "@/components/layout/sidebar"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={{ ...session.user, role: (session.user as { role?: string }).role ?? "USER" }} />
      <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6 pb-20 md:pb-6">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
