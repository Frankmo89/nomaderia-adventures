import { Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DestinationDetailSkeleton } from "@/components/LoadingSkeletons";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import WhatsAppButton from "@/components/WhatsAppButton";

// Rutas públicas críticas — carga inmediata
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Servicios from "./pages/Servicios";

// Rutas públicas secundarias — lazy load con retry automático
const DestinationDetail = lazyWithRetry(() => import("./pages/DestinationDetail"));
const GearListing = lazyWithRetry(() => import("./pages/GearListing"));
const GearArticleDetail = lazyWithRetry(() => import("./pages/GearArticleDetail"));
const BlogListing = lazyWithRetry(() => import("./pages/BlogListing"));
const BlogPostDetail = lazyWithRetry(() => import("./pages/BlogPostDetail"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const SobreNosotros = lazyWithRetry(() => import("./pages/SobreNosotros"));

// Rutas secundarias — lazy load con retry automático
const BudgetCalculator = lazyWithRetry(() => import("./pages/BudgetCalculator"));
const AdminLogin = lazyWithRetry(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazyWithRetry(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazyWithRetry(() => import("./pages/admin/AdminDashboard"));
const AdminDestinations = lazyWithRetry(() => import("./pages/admin/AdminDestinations"));
const AdminDestinationForm = lazyWithRetry(() => import("./pages/admin/AdminDestinationForm"));
const AdminGearArticles = lazyWithRetry(() => import("./pages/admin/AdminGearArticles"));
const AdminGearArticleForm = lazyWithRetry(() => import("./pages/admin/AdminGearArticleForm"));
const AdminQuizResponses = lazyWithRetry(() => import("./pages/admin/AdminQuizResponses"));
const AdminSubscribers = lazyWithRetry(() => import("./pages/admin/AdminSubscribers"));
const AdminItineraryRequests = lazyWithRetry(() => import("./pages/admin/AdminItineraryRequests"));
const AdminBlogPosts = lazyWithRetry(() => import("./pages/admin/AdminBlogPosts"));
const AdminBlogPostForm = lazyWithRetry(() => import("./pages/admin/AdminBlogPostForm"));
const AdminEmailLogs = lazyWithRetry(() => import("./pages/admin/AdminEmailLogs"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos — datos frescos sin refetch innecesario
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
              <Route path="/destinos/:slug" element={<ErrorBoundary><DestinationDetail /></ErrorBoundary>} />
              <Route path="/gear" element={<ErrorBoundary><GearListing /></ErrorBoundary>} />
              <Route path="/gear/:slug" element={<ErrorBoundary><GearArticleDetail /></ErrorBoundary>} />
              <Route path="/calculadora" element={<ErrorBoundary><BudgetCalculator /></ErrorBoundary>} />
              <Route path="/blog" element={<ErrorBoundary><BlogListing /></ErrorBoundary>} />
              <Route path="/blog/:slug" element={<ErrorBoundary><BlogPostDetail /></ErrorBoundary>} />
              <Route path="/privacidad" element={<ErrorBoundary><PrivacyPolicy /></ErrorBoundary>} />
              <Route path="/servicios" element={<ErrorBoundary><Servicios /></ErrorBoundary>} />
              <Route path="/sobre-nosotros" element={<ErrorBoundary><SobreNosotros /></ErrorBoundary>} />
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
                <Route path="subscribers" element={<AdminSubscribers />} />
                <Route path="itinerary-requests" element={<AdminItineraryRequests />} />
                <Route path="blog-posts" element={<AdminBlogPosts />} />
                <Route path="blog-posts/new" element={<AdminBlogPostForm />} />
                <Route path="blog-posts/:id/edit" element={<AdminBlogPostForm />} />
                <Route path="email-logs" element={<AdminEmailLogs />} />
              </Route>
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          <WhatsAppButton />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
