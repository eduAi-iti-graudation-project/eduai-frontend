import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { QuizDifficultyBadge } from "@/components/quiz/QuizDifficultyBadge"

describe("QuizDifficultyBadge", () => {
  it("renders the label for each difficulty", () => {
    const { rerender } = render(<QuizDifficultyBadge difficulty="EASY" />)
    expect(screen.getByText("Easy")).toBeTruthy()

    rerender(<QuizDifficultyBadge difficulty="MEDIUM" />)
    expect(screen.getByText("Medium")).toBeTruthy()

    rerender(<QuizDifficultyBadge difficulty="HARD" />)
    expect(screen.getByText("Hard")).toBeTruthy()
  })
})