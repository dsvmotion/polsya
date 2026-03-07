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
import { AdminRoute } from "@/components/admin/AdminRoute";
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
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { LandingOrRedirect } from "@/components/landing/LandingOrRedirect";
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

// Admin Console (new)
const AdminLayout = lazy(() => import('./components/admin/layout/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminRoute_Lazy = lazy(() => import('./components/admin/AdminRoute').then(m => ({ default: m.AdminRoute })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminOrganizations = lazy(() => import('./pages/admin/AdminOrganizations'));
const AdminOrganizationDetail_New = lazy(() => import('./pages/admin/AdminOrganizationDetail'));
const AdminSubscriptions = lazy(() => import('./pages/admin/AdminSubscriptions'));
const AdminBillingPage = lazy(() => import('./pages/admin/AdminBilling'));
const AdminSignals = lazy(() => import('./pages/admin/AdminSignals'));
const AdminIngestion = lazy(() => import('./pages/admin/AdminIngestion'));
const AdminAiJobs = lazy(() => import('./pages/admin/AdminAiJobs'));
const AdminModeration = lazy(() => import('./pages/admin/AdminModeration'));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'));
const AdminFeatureFlags = lazy(() => import('./pages/admin/AdminFeatureFlags'));
const AdminAnalytics_New = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminSettings_New = lazy(() => import('./pages/admin/AdminSettings'));

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
const CreativeDiscover = lazy(() => import("./pages/creative/CreativeDiscover"));

// Analytics Hub (Phase 5A)
const AnalyticsOverview = lazy(() => import("./pages/creative/analytics/AnalyticsOverview"));
const PipelineAnalytics = lazy(() => import("./pages/creative/analytics/PipelineAnalytics"));
const ActivityAnalytics = lazy(() => import("./pages/creative/analytics/ActivityAnalytics"));
const CommunicationAnalytics = lazy(() => import("./pages/creative/analytics/CommunicationAnalytics"));
const AIInsights = lazy(() => import("./pages/creative/analytics/AIInsights"));

// Marketing pages (lazy-loaded)
const MarketingLayout = lazy(() => import('./components/marketing/MarketingLayout').then(m => ({ default: m.MarketingLayout })));
const MarketingHome = lazy(() => import('./pages/marketing/Home'));
const MarketingProduct = lazy(() => import('./pages/marketing/Product'));
const MarketingHowItWorks = lazy(() => import('./pages/marketing/HowItWorks'));
const MarketingIntegrations = lazy(() => import('./pages/marketing/Integrations'));
const MarketingUseCases = lazy(() => import('./pages/marketing/UseCases'));
const MarketingPricing = lazy(() => import('./pages/marketing/Pricing'));
const MarketingCustomers = lazy(() => import('./pages/marketing/Customers'));
const MarketingResources = lazy(() => import('./pages/marketing/Resources'));
const MarketingSecurity = lazy(() => import('./pages/marketing/Security'));
const MarketingContact = lazy(() => import('./pages/marketing/Contact'));

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
                  {/* Marketing routes - new light-theme layout */}
                  <Route path="/" element={<MarketingLayout />}>
                    <Route index element={<LandingOrRedirect />} />
                    <Route path="product" element={<MarketingProduct />} />
                    <Route path="how-it-works" element={<MarketingHowItWorks />} />
                    <Route path="integrations" element={<MarketingIntegrations />} />
                    <Route path="use-cases" element={<MarketingUseCases />} />
                    <Route path="pricing" element={<MarketingPricing />} />
                    <Route path="customers" element={<MarketingCustomers />} />
                    <Route path="resources" element={<MarketingResources />} />
                    <Route path="security" element={<MarketingSecurity />} />
                    <Route path="contact" element={<MarketingContact />} />
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

                  {/* Legacy redirect: /platform/* -> /admin */}
                  <Route path="platform" element={<Navigate to="/admin" replace />} />
                  <Route path="platform/*" element={<Navigate to="/admin" replace />} />

                  {/* Creative Intelligence Platform routes */}
                  <Route path="creative" element={
                    <ProtectedRoute>
                      <CreativeLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<CreativeDashboard />} />
                    <Route path="discover" element={<CreativeDiscover />} />
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

                  {/* Product app at /app — alias for /creative */}
                  <Route path="app" element={
                    <ProtectedRoute>
                      <CreativeLayout />
                    </ProtectedRoute>
                  }>
                    <Route index element={<CreativeDashboard />} />
                    <Route path="discover" element={<CreativeDiscover />} />
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
                    <Route path="analytics" element={<AnalyticsOverview />} />
                    <Route path="analytics/pipeline" element={<PipelineAnalytics />} />
                    <Route path="analytics/activity" element={<ActivityAnalytics />} />
                    <Route path="analytics/communication" element={<CommunicationAnalytics />} />
                    <Route path="analytics/insights" element={<AIInsights />} />
                  </Route>

                  {/* Admin Console routes (new) */}
                  <Route path="admin" element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="organizations" element={<AdminOrganizations />} />
                    <Route path="org/:orgId" element={<AdminOrganizationDetail_New />} />
                    <Route path="subscriptions" element={<AdminSubscriptions />} />
                    <Route path="billing" element={<AdminBillingPage />} />
                    <Route path="signals" element={<AdminSignals />} />
                    <Route path="ingestion" element={<AdminIngestion />} />
                    <Route path="ai-jobs" element={<AdminAiJobs />} />
                    <Route path="moderation" element={<AdminModeration />} />
                    <Route path="logs" element={<AdminLogs />} />
                    <Route path="flags" element={<AdminFeatureFlags />} />
                    <Route path="analytics" element={<AdminAnalytics_New />} />
                    <Route path="settings" element={<AdminSettings_New />} />
                  </Route>

                  {/* Legacy redirects */}
                  <Route path="/dashboard" element={<Navigate to="/app" replace />} />
                  <Route path="/features" element={<Navigate to="/product" replace />} />
                  <Route path="/trust" element={<Navigate to="/security" replace />} />
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
