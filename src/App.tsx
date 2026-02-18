import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DestinationDetail from "./pages/DestinationDetail";
import GearListing from "./pages/GearListing";
import GearArticleDetail from "./pages/GearArticleDetail";
import BudgetCalculator from "./pages/BudgetCalculator";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDestinations from "./pages/admin/AdminDestinations";
import AdminDestinationForm from "./pages/admin/AdminDestinationForm";
import AdminGearArticles from "./pages/admin/AdminGearArticles";
import AdminGearArticleForm from "./pages/admin/AdminGearArticleForm";
import AdminQuizResponses from "./pages/admin/AdminQuizResponses";
import AdminSubscribers from "./pages/admin/AdminSubscribers";
import BlogListing from "./pages/BlogListing";
import BlogPostDetail from "./pages/BlogPostDetail";
import AdminBlogPosts from "./pages/admin/AdminBlogPosts";
import AdminBlogPostForm from "./pages/admin/AdminBlogPostForm";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/destinos/:slug" element={<DestinationDetail />} />
          <Route path="/gear" element={<GearListing />} />
          <Route path="/gear/:slug" element={<GearArticleDetail />} />
          <Route path="/calculadora" element={<BudgetCalculator />} />
          <Route path="/blog" element={<BlogListing />} />
          <Route path="/blog/:slug" element={<BlogPostDetail />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
