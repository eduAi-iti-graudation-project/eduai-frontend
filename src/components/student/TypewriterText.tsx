import { useEffect, useState } from "react"
import { RichText } from "@/components/shared/RichText"

const TICK_MS = 26

export function TypewriterText({ text }: { text: string }) {
  const words = text.split(" ")
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (words.length === 0) return

    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= words.length) {
          window.clearInterval(id)
          return c
        }
        return c + 1
      })
    }, TICK_MS)

    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  return <RichText text={words.slice(0, count).join(" ")} />
}
