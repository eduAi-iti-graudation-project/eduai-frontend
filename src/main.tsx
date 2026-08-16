import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './providers/auth-provider'
import { BillingProvider } from './providers/billing-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient({
 defaultOptions: {
  queries: {
   staleTime: 1000 * 60 * 5,
   retry: 1,
  },
 },
})

createRoot(document.getElementById('root')!).render(
 <StrictMode>
  <QueryClientProvider client={queryClient}>
   <AuthProvider>
    <BillingProvider>
     <TooltipProvider>
      <App />
     </TooltipProvider>
    </BillingProvider>
   </AuthProvider>
  </QueryClientProvider>
 </StrictMode>,
)
