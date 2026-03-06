import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PageLoader } from "@/components/ui/page-loader";
import { WorkspaceThemeBridge } from "@/components/layout/WorkspaceThemeBridge";
import { AppLayout } from "@/components/layout/AppLayout";
import { PlatformLayout } from "@/components/layout/PlatformLayout";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Billing from "./pages/Billing";
import GmailOAuthCallback from "./pages/GmailOAuthCallback";
import OutlookOAuthCallback from "./pages/OutlookOAuthCallback";
import NotionOAuthCallback from "./pages/NotionOAuthCallback";
import GoogleDriveOAuthCallback from "./pages/GoogleDriveOAuthCallback";
import NotFound from "./pages/NotFound";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Trust from "./pages/Trust";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { LandingOrRedirect } from "@/components/landing/LandingOrRedirect";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { CookieConsent } from "@/components/CookieConsent";

const EntityProspecting = lazy(() => import("./pages/EntityProspecting"));
const EntityOperations = lazy(() => import("./pages/EntityOperations"));
const Reports = lazy(() => import("./pages/Reports"));
const Team = lazy(() => import("./pages/Team"));
const IntegrationsPage = lazy(() => import("./pages/Integrations"));
const PlatformDashboard = lazy(() => import("./pages/PlatformDashboard"));
const PlatformBilling = lazy(() => import("./pages/PlatformBilling"));
const PlatformOrganizationDetail = lazy(() => import("./pages/PlatformOrganizationDetail"));
const PlatformAnalytics = lazy(() => import("./pages/PlatformAnalytics"));
const PlatformSettings = lazy(() => import("./pages/PlatformSettings"));
const PlatformContactMessages = lazy(() => import("./pages/PlatformContactMessages"));
const PlatformLogs = lazy(() => import("./pages/PlatformLogs"));

// Creative Intelligence Platform (Phase 0)
const CreativeLayout = lazy(() => import("./components/creative/layout/CreativeLayout").then(m => ({ default: m.CreativeLayout })));
const CreativeDashboard = lazy(() => import("./pages/creative/CreativeDashboard"));
const CreativeClients = lazy(() => import("./pages/creative/CreativeClients"));
const CreativeProjects = lazy(() => import("./pages/creative/CreativeProjects"));
const CreativeOpportunities = lazy(() => import("./pages/creative/CreativeOpportunities"));
const CreativeContacts = lazy(() => import("./pages/creative/CreativeContacts"));
const CreativePortfolios = lazy(() => import("./pages/creative/CreativePortfolios"));
const CreativeIngestion = lazy(() => import("./pages/creative/CreativeIngestion"));
const CreativeStyle = lazy(() => import("./pages/creative/CreativeStyle"));
const CreativeSignals = lazy(() => import("./pages/creative/CreativeSignals"));
const CreativeEnrichment = lazy(() => import("./pages/creative/CreativeEnrichment"));
const CreativeResolution = lazy(() => import("./pages/creative/CreativeResolution"));
const CreativeReports = lazy(() => import("./pages/creative/CreativeReports"));
const CreativeKnowledgeBase = lazy(() => import("./pages/creative/CreativeKnowledgeBase"));
const CreativeWorkflows = lazy(() => import("./pages/creative/CreativeWorkflows"));
const CreativeInbox = lazy(() => import("./pages/creative/CreativeInbox"));
const CreativeCalendar = lazy(() => import("./pages/creative/CreativeCalendar"));

// Analytics Hub (Phase 5A)
const AnalyticsOverview = lazy(() => import("./pages/creative/analytics/AnalyticsOverview"));
const PipelineAnalytics = lazy(() => import("./pages/creative/analytics/PipelineAnalytics"));
const ActivityAnalytics = lazy(() => import("./pages/creative/analytics/ActivityAnalytics"));
const CommunicationAnalytics = lazy(() => import("./pages/creative/analytics/CommunicationAnalytics"));
const AIInsights = lazy(() => import("./pages/creative/analytics/AIInsights"));

const queryClient = new QueryClient();

function ProspectingByType() {
  const { typeKey } = useParams<{ typeKey: string }>();
  return <EntityProspecting clientType={typeKey} />;
}

function OperationsByType() {
  const { typeKey } = useParams<{ typeKey: string }>();
  return <EntityOperations clientType={typeKey} />;
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
              <ImpersonationProvider>
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
                    <Route path="trust" element={<Trust />} />
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
                    <Route path="prospecting/entities" element={<EntityProspecting />} />
                    <Route path="prospecting/entities/:typeKey" element={<ProspectingByType />} />

                    {/* Operations */}
                    <Route path="operations/entities" element={<EntityOperations />} />
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
                    <Route path="integrations/notion/callback" element={<NotionOAuthCallback />} />
                    <Route path="integrations/google-drive/callback" element={<GoogleDriveOAuthCallback />} />
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
                    <Route path="analytics" element={<PlatformAnalytics />} />
                    <Route path="settings" element={<PlatformSettings />} />
                    <Route path="org/:orgId" element={<PlatformOrganizationDetail />} />
                  </Route>

                  {/* Creative Intelligence Platform routes */}
                  <Route path="creative" element={
                    <ProtectedRoute>
                      <CreativeLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<CreativeDashboard />} />
                    <Route path="clients" element={<CreativeClients />} />
                    <Route path="projects" element={<CreativeProjects />} />
                    <Route path="opportunities" element={<CreativeOpportunities />} />
                    <Route path="contacts" element={<CreativeContacts />} />
                    <Route path="portfolios" element={<CreativePortfolios />} />
                    <Route path="ingestion" element={<CreativeIngestion />} />
                    <Route path="style" element={<CreativeStyle />} />
                    <Route path="signals" element={<CreativeSignals />} />
                    <Route path="enrichment" element={<CreativeEnrichment />} />
                    <Route path="resolution" element={<CreativeResolution />} />
                    <Route path="reports" element={<CreativeReports />} />
                    <Route path="knowledge-base" element={<CreativeKnowledgeBase />} />
                    <Route path="workflows" element={<CreativeWorkflows />} />
                    <Route path="inbox" element={<CreativeInbox />} />
                    <Route path="calendar" element={<CreativeCalendar />} />

                    {/* Analytics Hub (Phase 5A) */}
                    <Route path="analytics" element={<AnalyticsOverview />} />
                    <Route path="analytics/pipeline" element={<PipelineAnalytics />} />
                    <Route path="analytics/activity" element={<ActivityAnalytics />} />
                    <Route path="analytics/communication" element={<CommunicationAnalytics />} />
                    <Route path="analytics/insights" element={<AIInsights />} />
                  </Route>

                  {/* Legacy redirects */}
                  <Route path="/prospecting" element={<Navigate to="/prospecting/entities" replace />} />
                  <Route path="/operations" element={<Navigate to="/operations/entities" replace />} />

                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              </ImpersonationProvider>
              <CookieConsent />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
      <SpeedInsights />
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
