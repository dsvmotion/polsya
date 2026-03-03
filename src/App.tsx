import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SubscriptionGuard } from "@/components/auth/SubscriptionGuard";
import { PageLoader } from "@/components/ui/page-loader";
import { WorkspaceThemeBridge } from "@/components/layout/WorkspaceThemeBridge";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
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
const Reports = lazy(() => import("./pages/Reports"));
const Team = lazy(() => import("./pages/Team"));
const IntegrationsPage = lazy(() => import("./pages/Integrations"));

const queryClient = new QueryClient();

function ProspectingByType() {
  const { typeKey } = useParams<{ typeKey: string }>();
  return <PharmacyProspecting clientType={typeKey} />;
}

function OperationsByType() {
  const { typeKey } = useParams<{ typeKey: string }>();
  return <PharmacyOperations clientType={typeKey} />;
}

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
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

                  {/* Protected routes inside AppLayout */}
                  <Route element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={
                      <SubscriptionGuard><Index /></SubscriptionGuard>
                    } />

                    {/* Prospecting */}
                    <Route path="prospecting/entities" element={
                      <SubscriptionGuard><PharmacyProspecting /></SubscriptionGuard>
                    } />
                    <Route path="prospecting/entities/:typeKey" element={
                      <SubscriptionGuard><ProspectingByType /></SubscriptionGuard>
                    } />

                    {/* Operations */}
                    <Route path="operations/entities" element={
                      <SubscriptionGuard><PharmacyOperations /></SubscriptionGuard>
                    } />
                    <Route path="operations/entities/:typeKey" element={
                      <SubscriptionGuard><OperationsByType /></SubscriptionGuard>
                    } />

                    {/* Reports */}
                    <Route path="reports" element={
                      <SubscriptionGuard><Reports /></SubscriptionGuard>
                    } />

                    {/* Team */}
                    <Route path="team" element={<Team />} />

                    {/* Integrations page */}
                    <Route path="integrations" element={
                      <SubscriptionGuard><IntegrationsPage /></SubscriptionGuard>
                    } />

                    {/* Profile & Billing */}
                    <Route path="profile" element={<Profile />} />
                    <Route path="billing" element={<Billing />} />

                    {/* OAuth callbacks */}
                    <Route path="integrations/gmail/callback" element={<GmailOAuthCallback />} />
                    <Route path="integrations/outlook/callback" element={<OutlookOAuthCallback />} />
                  </Route>

                  {/* Legacy redirects */}
                  <Route path="/prospecting" element={<Navigate to="/prospecting/entities" replace />} />
                  <Route path="/operations" element={<Navigate to="/operations/entities" replace />} />

                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
