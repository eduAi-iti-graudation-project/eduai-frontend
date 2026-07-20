import { Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { LoginPage } from "./pages/LoginPage"
import { SignupPage } from "./pages/SignupPage"

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
