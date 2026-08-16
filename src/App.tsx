import { RouterProvider } from "react-router-dom"
import { Toaster } from "sonner"
import { router } from "./router"
import { UpgradeDialog } from "./components/billing/UpgradeDialog"
import { GlobalActivityIndicator } from "./components/shared/GlobalActivityIndicator"
import { GlobalMutationBar } from "./components/shared/GlobalMutationBar"
import { useBilling } from "./providers/use-billing"

function UpgradeDialogBridge() {
  const { upgradeOpen, closeUpgrade, requiredTier } = useBilling()
  return <UpgradeDialog open={upgradeOpen} onOpenChange={closeUpgrade} requiredTier={requiredTier} />
}

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <UpgradeDialogBridge />
      <GlobalMutationBar />
      <GlobalActivityIndicator />
      <Toaster richColors position="top-right" />
    </>
  )
}

export default App
