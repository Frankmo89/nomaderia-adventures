import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DestinationDetailSkeleton } from "@/components/LoadingSkeletons";

// Rutas públicas críticas — carga inmediata
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DestinationDetail from "./pages/DestinationDetail";
import GearListing from "./pages/GearListing";
import GearArticleDetail from "./pages/GearArticleDetail";
import BlogListing from "./pages/BlogListing";
import BlogPostDetail from "./pages/BlogPostDetail";

// Rutas secundarias — lazy load
const BudgetCalculator = lazy(() => import("./pages/BudgetCalculator"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminDestinations = lazy(() => import("./pages/admin/AdminDestinations"));
const AdminDestinationForm = lazy(() => import("./pages/admin/AdminDestinationForm"));
const AdminGearArticles = lazy(() => import("./pages/admin/AdminGearArticles"));
const AdminGearArticleForm = lazy(() => import("./pages/admin/AdminGearArticleForm"));
const AdminQuizResponses = lazy(() => import("./pages/admin/AdminQuizResponses"));
const AdminSubscribers = lazy(() => import("./pages/admin/AdminSubscribers"));
const AdminBlogPosts = lazy(() => import("./pages/admin/AdminBlogPosts"));
const AdminBlogPostForm = lazy(() => import("./pages/admin/AdminBlogPostForm"));

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
                <Route path="blog-posts" element={<AdminBlogPosts />} />
                <Route path="blog-posts/new" element={<AdminBlogPostForm />} />
                <Route path="blog-posts/:id/edit" element={<AdminBlogPostForm />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
