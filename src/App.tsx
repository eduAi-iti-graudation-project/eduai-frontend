import { RouterProvider } from "react-router-dom"
import { Toaster } from "sonner"
import { router } from "./router"

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
