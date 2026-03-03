import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SubscriptionGuard } from "@/components/auth/SubscriptionGuard";
import { PageLoader } from "@/components/ui/page-loader";
import { WorkspaceThemeBridge } from "@/components/layout/WorkspaceThemeBridge";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Billing from "./pages/Billing";
import GmailOAuthCallback from "./pages/GmailOAuthCallback";
import OutlookOAuthCallback from "./pages/OutlookOAuthCallback";
import NotFound from "./pages/NotFound";

const PharmacyProspecting = lazy(() => import("./pages/PharmacyProspecting"));
const PharmacyOperations = lazy(() => import("./pages/PharmacyOperations"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WorkspaceThemeBridge />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <Index />
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />

              {/* Canonical entity routes */}
              <Route path="/prospecting/entities" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <PharmacyProspecting />
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              <Route path="/prospecting/entities/herbalists" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <PharmacyProspecting clientType="herbalist" />
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />

              <Route path="/operations/entities" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <PharmacyOperations />
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />
              <Route path="/operations/entities/herbalists" element={
                <ProtectedRoute>
                  <SubscriptionGuard>
                    <PharmacyOperations clientType="herbalist" />
                  </SubscriptionGuard>
                </ProtectedRoute>
              } />

              {/* Legacy route redirects */}
              <Route path="/prospecting" element={<Navigate to="/prospecting/entities" replace />} />
              <Route path="/prospecting/herbalists" element={<Navigate to="/prospecting/entities/herbalists" replace />} />
              <Route path="/operations" element={<Navigate to="/operations/entities" replace />} />
              <Route path="/operations/herbalists" element={<Navigate to="/operations/entities/herbalists" replace />} />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              <Route path="/billing" element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              } />

              <Route path="/integrations/gmail/callback" element={
                <ProtectedRoute>
                  <GmailOAuthCallback />
                </ProtectedRoute>
              } />

              <Route path="/integrations/outlook/callback" element={
                <ProtectedRoute>
                  <OutlookOAuthCallback />
                </ProtectedRoute>
              } />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
