
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Verification from "./pages/Verification";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import MongoDB from "./pages/MongoDB";
import LiveData from "./pages/LiveData";
import AllLiveData from "./pages/AllLiveData";
import Notifications from "./pages/Notifications";
import ProtectedRoute from "./components/ProtectedRoute";
import MockDataGenerator from "./components/MockDataGenerator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verification" element={<Verification />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mongodb" 
              element={
                <ProtectedRoute>
                  <MongoDB />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/live-data" 
              element={
                <ProtectedRoute>
                  <LiveData />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/all-live-data" 
              element={
                <ProtectedRoute>
                  <AllLiveData />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <MockDataGenerator />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
