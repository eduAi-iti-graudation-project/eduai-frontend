import { describe, expect, it } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { afterEach } from "vitest"
import { OperationsProvider } from "@/providers/operations-provider"
import { useOperations, useOperation, useOperationId } from "@/providers/use-operations"
import { GlobalActivityIndicator } from "@/components/shared/GlobalActivityIndicator"

afterEach(cleanup)

function Driver() {
  const { register, update, remove } = useOperations()
  const id = useOperationId("lab-generate")
  return (
    <>
      <button
        onClick={() =>
          register({
            id,
            kind: "lab-generate",
            label: "Generating lab…",
            step: "thinking",
            lastToolStep: null,
          })
        }
      >
        start
      </button>
      <button onClick={() => update(id, { step: "search_curriculum", lastToolStep: "search_curriculum" })}>
        step
      </button>
      <button onClick={() => remove(id)}>stop</button>
    </>
  )
}

function LookupDriver() {
  const { register, update, remove } = useOperations()
  // The registering hook creates its OWN random id; useOperation must find the
  // running operation by kind, never by a freshly minted id.
  const id = useOperationId("lab-refine")
  const active = useOperation("lab-refine")
  return (
    <>
      <span data-testid="active">{active ? active.step ?? "running" : "none"}</span>
      <button
        onClick={() =>
          register({
            id,
            kind: "lab-refine",
            label: "Refining lab…",
            step: "thinking",
            lastToolStep: null,
          })
        }
      >
        start
      </button>
      <button onClick={() => update(id, { step: "modify_lab", lastToolStep: "modify_lab" })}>step</button>
      <button onClick={() => remove(id)}>stop</button>
    </>
  )
}

describe("operations store + GlobalActivityIndicator", () => {
  it("shows a pill while an operation is running and hides it after remove", () => {
    const { getByRole, queryByText } = render(
      <OperationsProvider>
        <Driver />
        <GlobalActivityIndicator />
      </OperationsProvider>,
    )

    expect(queryByText("Generating lab…")).not.toBeInTheDocument()

    fireEvent.click(getByRole("button", { name: "start" }))
    expect(screen.getByText("Generating lab…")).toBeInTheDocument()

    fireEvent.click(getByRole("button", { name: "step" }))
    expect(screen.getByText("search curriculum")).toBeInTheDocument()

    fireEvent.click(getByRole("button", { name: "stop" }))
    expect(queryByText("Generating lab…")).not.toBeInTheDocument()
  })

  it("survives page navigation: the operation stays visible after the page unmounts", () => {
    // Provider is mounted once above the router (as in main.tsx); only the
    // page swaps on navigation, so its local operation state is lost — but the
    // store-backed indicator keeps showing the running operation.
    function Shell({ page }: { page: "driver" | "other" }) {
      return (
        <OperationsProvider>
          {page === "driver" ? <Driver /> : null}
          <GlobalActivityIndicator />
        </OperationsProvider>
      )
    }

    const { getByRole, rerender } = render(<Shell page="driver" />)
    fireEvent.click(getByRole("button", { name: "start" }))
    expect(screen.getByText("Generating lab…")).toBeInTheDocument()

    // Navigate to another tab — the Driver page unmounts.
    rerender(<Shell page="other" />)
    expect(screen.getByText("Generating lab…")).toBeInTheDocument()
  })

  it("useOperation finds a running operation by kind even though the id was minted elsewhere", () => {
    const { getByRole, getByTestId } = render(
      <OperationsProvider>
        <LookupDriver />
      </OperationsProvider>,
    )

    expect(getByTestId("active").textContent).toBe("none")

    fireEvent.click(getByRole("button", { name: "start" }))
    expect(getByTestId("active").textContent).toBe("thinking")

    fireEvent.click(getByRole("button", { name: "step" }))
    expect(getByTestId("active").textContent).toBe("modify_lab")

    fireEvent.click(getByRole("button", { name: "stop" }))
    expect(getByTestId("active").textContent).toBe("none")
  })
})