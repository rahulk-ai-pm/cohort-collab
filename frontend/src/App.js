import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import ChatbotWidget from '@/components/ChatbotWidget';
import LoginPage from '@/pages/LoginPage';
import AuthCallback from '@/pages/AuthCallback';
import OnboardingPage from '@/pages/OnboardingPage';
import DashboardPage from '@/pages/DashboardPage';
import DirectoryPage from '@/pages/DirectoryPage';
import DiscussionsPage from '@/pages/DiscussionsPage';
import DiscussionDetailPage from '@/pages/DiscussionDetailPage';
import ProjectsPage from '@/pages/ProjectsPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import CaseStudiesPage from '@/pages/CaseStudiesPage';
import CaseStudyDetailPage from '@/pages/CaseStudyDetailPage';
import AdminDashboard from '@/pages/AdminDashboard';

function AppRouter() {
  const location = useLocation();

  // CRITICAL: Detect session_id in URL fragment synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  const showNav = !['/login', '/onboarding'].includes(location.pathname);

  return (
    <>
      {showNav && <Navbar />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={
          <ProtectedRoute><OnboardingPage /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/directory" element={
          <ProtectedRoute><DirectoryPage /></ProtectedRoute>
        } />
        <Route path="/discussions" element={
          <ProtectedRoute><DiscussionsPage /></ProtectedRoute>
        } />
        <Route path="/discussions/:id" element={
          <ProtectedRoute><DiscussionDetailPage /></ProtectedRoute>
        } />
        <Route path="/projects" element={
          <ProtectedRoute><ProjectsPage /></ProtectedRoute>
        } />
        <Route path="/projects/:id" element={
          <ProtectedRoute><ProjectDetailPage /></ProtectedRoute>
        } />
        <Route path="/case-studies" element={
          <ProtectedRoute><CaseStudiesPage /></ProtectedRoute>
        } />
        <Route path="/case-studies/:id" element={
          <ProtectedRoute><CaseStudyDetailPage /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="*" element={<LoginPage />} />
      </Routes>
      {showNav && <ChatbotWidget />}
      <Toaster position="top-right" />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
