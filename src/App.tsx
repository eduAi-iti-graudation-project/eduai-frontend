import { Toaster } from "sonner"
import { StudentAssignmentForm } from "./components/StudentAssignmentForm"

function App() {
  return (
    <>
      <StudentAssignmentForm />
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
