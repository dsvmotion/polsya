import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PageLoader } from "@/components/ui/page-loader";
import { WorkspaceThemeBridge } from "@/components/layout/WorkspaceThemeBridge";
import { AppLayout } from "@/components/layout/AppLayout";
import { PlatformLayout } from "@/components/layout/PlatformLayout";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Billing from "./pages/Billing";
import GmailOAuthCallback from "./pages/GmailOAuthCallback";
import OutlookOAuthCallback from "./pages/OutlookOAuthCallback";
import NotFound from "./pages/NotFound";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { LandingOrRedirect } from "@/components/landing/LandingOrRedirect";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { CookieConsent } from "@/components/CookieConsent";

const PharmacyProspecting = lazy(() => import("./pages/PharmacyProspecting"));
const PharmacyOperations = lazy(() => import("./pages/PharmacyOperations"));
const Reports = lazy(() => import("./pages/Reports"));
const Team = lazy(() => import("./pages/Team"));
const IntegrationsPage = lazy(() => import("./pages/Integrations"));
const PlatformDashboard = lazy(() => import("./pages/PlatformDashboard"));
const PlatformBilling = lazy(() => import("./pages/PlatformBilling"));
const PlatformOrganizationDetail = lazy(() => import("./pages/PlatformOrganizationDetail"));
const PlatformContactMessages = lazy(() => import("./pages/PlatformContactMessages"));
const PlatformLogs = lazy(() => import("./pages/PlatformLogs"));

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
                  {/* Public routes - landing, features, pricing, contact, legal */}
                  <Route path="/" element={<PublicLayout />}>
                    <Route index element={<LandingOrRedirect />} />
                    <Route path="features" element={<Features />} />
                    <Route path="pricing" element={<Pricing />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="terms" element={<Terms />} />
                    <Route path="privacy" element={<Privacy />} />
                  </Route>

                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Protected routes inside AppLayout (dashboard, prospecting, etc.) */}
                  <Route element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }>
                    <Route path="dashboard" element={<Index />} />

                    {/* Prospecting */}
                    <Route path="prospecting/entities" element={<PharmacyProspecting />} />
                    <Route path="prospecting/entities/:typeKey" element={<ProspectingByType />} />

                    {/* Operations */}
                    <Route path="operations/entities" element={<PharmacyOperations />} />
                    <Route path="operations/entities/:typeKey" element={<OperationsByType />} />

                    {/* Reports */}
                    <Route path="reports" element={<Reports />} />

                    {/* Team */}
                    <Route path="team" element={<Team />} />

                    {/* Integrations page */}
                    <Route path="integrations" element={<IntegrationsPage />} />

                    {/* Profile & Billing */}
                    <Route path="profile" element={<Profile />} />
                    <Route path="billing" element={<Billing />} />

                    {/* OAuth callbacks */}
                    <Route path="integrations/gmail/callback" element={<GmailOAuthCallback />} />
                    <Route path="integrations/outlook/callback" element={<OutlookOAuthCallback />} />
                  </Route>

                  {/* Platform admin routes (solo propietarios de la plataforma) */}
                  <Route path="platform" element={
                    <ProtectedRoute>
                      <PlatformLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<PlatformDashboard />} />
                    <Route path="billing" element={<PlatformBilling />} />
                    <Route path="contact-messages" element={<PlatformContactMessages />} />
                    <Route path="logs" element={<PlatformLogs />} />
                    <Route path="org/:orgId" element={<PlatformOrganizationDetail />} />
                  </Route>

                  {/* Legacy redirects */}
                  <Route path="/prospecting" element={<Navigate to="/prospecting/entities" replace />} />
                  <Route path="/operations" element={<Navigate to="/operations/entities" replace />} />

                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <CookieConsent />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
