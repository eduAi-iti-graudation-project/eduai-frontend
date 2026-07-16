import { Toaster } from "sonner"
import { InstructorAssignmentForm } from "./components/InstructorAssignmentForm"

function App() {
  return (
    <>
      <InstructorAssignmentForm />
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App