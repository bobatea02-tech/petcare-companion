import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { A11yLiveRegion } from "@/components/A11yLiveRegion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import { GlobalVoiceAssistant } from "@/components/voice/GlobalVoiceAssistant";

// Eager load critical routes
import Index from "./pages/Index";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Lazy load non-critical routes for code splitting
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const VoiceAssistant = lazy(() => import("./pages/VoiceAssistant"));
const Community = lazy(() => import("./pages/Community"));
const Profile = lazy(() => import("./pages/Profile"));
const Messages = lazy(() => import("./pages/Messages"));
const Appointments = lazy(() => import("./pages/Appointments"));
const HealthRecords = lazy(() => import("./pages/HealthRecords"));
const MultiPetComparison = lazy(() => import("./pages/MultiPetComparison"));
const TestMumbaiAPI = lazy(() => import("./pages/TestMumbaiAPI"));
const VetSearch = lazy(() => import("./pages/VetSearch"));
const LandingPreview = lazy(() => import("./pages/LandingPreview"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest via-moss to-sage">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-cream border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-cream font-body">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary featureName="Application">
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <A11yLiveRegion />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              {/* Global Voice Assistant - Available on all dashboard pages */}
              <GlobalVoiceAssistant enabled={true} />
              
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/landing-preview" element={<LandingPreview />} />
                  
                  {/* Onboarding route - public (includes sign-up) */}
                  <Route path="/onboarding" element={<Onboarding />} />
                  
                  {/* Protected routes - require authentication */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary featureName="Dashboard">
                          <Dashboard />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/voice-assistant/:petId" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary featureName="Voice Assistant">
                          <VoiceAssistant />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/community" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary featureName="Community">
                          <Community />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary featureName="Profile">
                          <Profile />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/messages" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary featureName="Messages">
                          <Messages />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/appointments" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary featureName="Appointments">
                          <Appointments />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/health-records/:petId" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary featureName="Health Records">
                          <HealthRecords />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/multi-pet-comparison" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary featureName="Multi-Pet Comparison">
                          <MultiPetComparison />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/vet-search" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary featureName="Vet Search">
                          <VetSearch />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/test-mumbai-api" 
                    element={
                      <ProtectedRoute>
                        <ErrorBoundary featureName="Mumbai API Test">
                          <TestMumbaiAPI />
                        </ErrorBoundary>
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Legacy route - keeping Index for backward compatibility */}
                  <Route path="/index" element={<Index />} />
                  
                  {/* 404 Not Found */}
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
