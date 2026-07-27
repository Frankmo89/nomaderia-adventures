import { Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DestinationDetailSkeleton } from "@/components/LoadingSkeletons";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import ConciergeLauncher from "@/components/ConciergeLauncher";
import AnalyticsRouteTracker from "@/components/AnalyticsRouteTracker";
import { ScrollProgressBar } from "@/components/ScrollProgressBar";

// Rutas públicas críticas — carga inmediata
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Servicios from "./pages/Servicios";

// Rutas públicas secundarias — lazy load con retry automático
const DestinationDetail = lazyWithRetry(() => import("./pages/DestinationDetail"));
const Destinations = lazyWithRetry(() => import("./pages/Destinations"));
const GearListing = lazyWithRetry(() => import("./pages/GearListing"));
const GearArticleDetail = lazyWithRetry(() => import("./pages/GearArticleDetail"));
const BlogListing = lazyWithRetry(() => import("./pages/BlogListing"));
const BlogPostDetail = lazyWithRetry(() => import("./pages/BlogPostDetail"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsAndConditions = lazyWithRetry(() => import("./pages/TermsAndConditions"));
const Gracias = lazyWithRetry(() => import("./pages/Gracias"));
const SobreNosotros = lazyWithRetry(() => import("./pages/SobreNosotros"));

// Rutas secundarias — lazy load con retry automático
const SentinelLanding = lazyWithRetry(() => import("./pages/SentinelLanding"));
const BudgetCalculator = lazyWithRetry(() => import("./pages/BudgetCalculator"));
const AdminLogin = lazyWithRetry(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazyWithRetry(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazyWithRetry(() => import("./pages/admin/AdminDashboard"));
const AdminDestinations = lazyWithRetry(() => import("./pages/admin/AdminDestinations"));
const AdminDestinationForm = lazyWithRetry(() => import("./pages/admin/AdminDestinationForm"));
const AdminGearArticles = lazyWithRetry(() => import("./pages/admin/AdminGearArticles"));
const AdminGearArticleForm = lazyWithRetry(() => import("./pages/admin/AdminGearArticleForm"));
const AdminQuizResponses = lazyWithRetry(() => import("./pages/admin/AdminQuizResponses"));
const AdminCorreos = lazyWithRetry(() => import("./pages/admin/AdminCorreos"));
const AdminItineraryRequests = lazyWithRetry(() => import("./pages/admin/AdminItineraryRequests"));
const AdminBlogPosts = lazyWithRetry(() => import("./pages/admin/AdminBlogPosts"));
const AdminBlogPostForm = lazyWithRetry(() => import("./pages/admin/AdminBlogPostForm"));
const AdminPermitWindows = lazyWithRetry(() => import("./pages/admin/AdminPermitWindows"));
const AdminPermitAlerts = lazyWithRetry(() => import("./pages/admin/AdminPermitAlerts"));
const AdminGallery = lazyWithRetry(() => import("./pages/admin/AdminGallery"));
const SystemAudit = lazyWithRetry(() => import("./pages/admin/SystemAudit"));
const AdminSentinelLeads = lazyWithRetry(() => import("./pages/admin/AdminSentinelLeads"));
const AdminLeads = lazyWithRetry(() => import("./pages/admin/AdminLeads"));
const AdminSoul = lazyWithRetry(() => import("./pages/admin/AdminSoul"));
const AdminItineraryTemplates = lazyWithRetry(() => import("./pages/admin/AdminItineraryTemplates"));
const AdminItineraryTemplateEditor = lazyWithRetry(() => import("./pages/admin/AdminItineraryTemplateEditor"));
const AdminClientItineraries = lazyWithRetry(() => import("./pages/admin/AdminClientItineraries"));
const AdminClientItineraryNew = lazyWithRetry(() => import("./pages/admin/AdminClientItineraryNew"));
const AdminClientItineraryDetail = lazyWithRetry(() => import("./pages/admin/AdminClientItineraryDetail"));
const AdminClientItineraryPreview = lazyWithRetry(() => import("./pages/admin/AdminClientItineraryPreview"));
const ClientItineraryView = lazyWithRetry(() => import("./pages/ClientItineraryView"));
const ClientItineraryPrintView = lazyWithRetry(() => import("./pages/ClientItineraryPrintView"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos — datos frescos sin refetch innecesario
      retry: 1,                  // 1 reintento en caso de error de red
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="bg-background min-h-screen pt-20">
    <DestinationDetailSkeleton />
  </div>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
              <Route path="/" element={<ErrorBoundary><Index /></ErrorBoundary>} />
              <Route path="/destinos" element={<ErrorBoundary><Destinations /></ErrorBoundary>} />
              <Route path="/destinos/:slug" element={<ErrorBoundary><DestinationDetail /></ErrorBoundary>} />
              <Route path="/gear" element={<ErrorBoundary><GearListing /></ErrorBoundary>} />
              <Route path="/gear/:slug" element={<ErrorBoundary><GearArticleDetail /></ErrorBoundary>} />
              <Route path="/calculadora" element={<ErrorBoundary><BudgetCalculator /></ErrorBoundary>} />
              <Route path="/blog" element={<ErrorBoundary><BlogListing /></ErrorBoundary>} />
              <Route path="/blog/:slug" element={<ErrorBoundary><BlogPostDetail /></ErrorBoundary>} />
              <Route path="/privacidad" element={<ErrorBoundary><PrivacyPolicy /></ErrorBoundary>} />
              <Route path="/terminos" element={<ErrorBoundary><TermsAndConditions /></ErrorBoundary>} />
              <Route path="/gracias" element={<ErrorBoundary><Gracias /></ErrorBoundary>} />
              <Route path="/sentinel" element={<ErrorBoundary><SentinelLanding /></ErrorBoundary>} />
              <Route path="/servicios" element={<ErrorBoundary><Servicios /></ErrorBoundary>} />
              <Route path="/sobre-nosotros" element={<ErrorBoundary><SobreNosotros /></ErrorBoundary>} />
              <Route path="/i/:token" element={<ErrorBoundary><ClientItineraryView /></ErrorBoundary>} />
              <Route path="/i/:token/print" element={<ErrorBoundary><ClientItineraryPrintView /></ErrorBoundary>} />
              <Route path="/admin/login" element={<ErrorBoundary><AdminLogin /></ErrorBoundary>} />
              <Route path="/admin" element={<ErrorBoundary><AdminLayout /></ErrorBoundary>}>
                <Route index element={<AdminDashboard />} />
                <Route path="destinations" element={<AdminDestinations />} />
                <Route path="destinations/new" element={<AdminDestinationForm />} />
                <Route path="destinations/:id/edit" element={<AdminDestinationForm />} />
                <Route path="gear-articles" element={<AdminGearArticles />} />
                <Route path="gear-articles/new" element={<AdminGearArticleForm />} />
                <Route path="gear-articles/:id/edit" element={<AdminGearArticleForm />} />
                <Route path="quiz-responses" element={<AdminQuizResponses />} />
                <Route path="correos" element={<AdminCorreos />} />
                <Route path="subscribers" element={<Navigate to="/admin/correos" replace />} />
                <Route path="email-logs" element={<Navigate to="/admin/correos" replace />} />
                <Route path="itinerary-requests" element={<AdminItineraryRequests />} />
                <Route path="blog-posts" element={<AdminBlogPosts />} />
                <Route path="blog-posts/new" element={<AdminBlogPostForm />} />
                <Route path="blog-posts/:id/edit" element={<AdminBlogPostForm />} />
                <Route path="permit-windows" element={<AdminPermitWindows />} />
                <Route path="permit-alerts" element={<AdminPermitAlerts />} />
                <Route path="gallery" element={<AdminGallery />} />
                <Route path="audit" element={<SystemAudit />} />
                <Route path="sentinel-leads" element={<AdminSentinelLeads />} />
                <Route path="leads" element={<AdminLeads />} />
                <Route path="soul" element={<AdminSoul />} />
                <Route path="itinerary-templates" element={<AdminItineraryTemplates />} />
                <Route path="itinerary-templates/:id" element={<AdminItineraryTemplateEditor />} />
                <Route path="client-itineraries" element={<AdminClientItineraries />} />
                <Route path="client-itineraries/new" element={<AdminClientItineraryNew />} />
                <Route path="client-itineraries/:id" element={<AdminClientItineraryDetail />} />
                <Route path="client-itineraries/:id/preview" element={<AdminClientItineraryPreview />} />
              </Route>
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          <ScrollProgressBar />
          <AnalyticsRouteTracker />
          <ConciergeLauncher />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
