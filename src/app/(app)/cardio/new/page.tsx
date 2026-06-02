import { redirect } from "next/navigation"

export default function CardioNewPage() {
  redirect("/cardio?new=1")
}
