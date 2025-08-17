import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import './App.css'

// Компоненты
import LandingPage from './components/LandingPage'
import AuthPage from './components/AuthPage'
import OAuthCallback from './components/OAuthCallback'
import Dashboard from './components/Dashboard'
import ProjectsPage from './components/ProjectsPage'
import ProjectDetail from './components/ProjectDetail'
import ProfilePage from './components/ProfilePage'
import AdminPage from './components/AdminPage'
import InvitationsPage from './components/InvitationsPage'
import ReferralsPage from './components/ReferralsPage'
import ReferralAnalytics from './components/ReferralAnalytics'
import PublicProjectsPage from './components/PublicProjectsPage'
import PublicProjectDetail from './components/PublicProjectDetail'
import NotificationsPage from './components/NotificationsPage'
import NotificationSettingsPage from './components/NotificationSettingsPage'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import EnhancedAnalyticsDashboard from './components/EnhancedAnalyticsDashboard'
import InteractiveAnalyticsCharts from './components/InteractiveAnalyticsCharts'
import PredictiveAnalytics from './components/PredictiveAnalytics'
import ProjectAnalytics from './components/ProjectAnalytics'
import UserAnalytics from './components/UserAnalytics'
import PricingPage from './components/PricingPage'
import PrivacyPolicy from './components/legal/PrivacyPolicy'
import TermsOfService from './components/legal/TermsOfService'
import CookiePolicy from './components/legal/CookiePolicy'
import { ToastContainer } from './components/NotificationToast'

// Контекст авторизации
import { AuthProvider, useAuth } from './hooks/useAuth'

// Защищенный маршрут
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />
  }
  
  return children
}

// Маршрут только для неавторизованных
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

// Компонент для обработки коротких ссылок
function ShortLinkRedirect() {
  const { shortCode } = useParams()
  
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const response = await fetch(`/api/s/${shortCode}`)
        const data = await response.json()
        
        if (response.ok && data.redirect_url) {
          window.location.href = data.redirect_url
        } else {
          window.location.href = '/public'
        }
      } catch (err) {
        window.location.href = '/public'
      }
    }
    
    handleRedirect()
  }, [shortCode])
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Перенаправление...</p>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/" element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            } />
            
            <Route path="/auth" element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            } />
            
            {/* OAuth callback */}
            <Route path="/auth/callback" element={<OAuthCallback />} />
            
            {/* Публичные проекты (доступны всем) */}
            <Route path="/public" element={<PublicProjectsPage />} />
            <Route path="/public/:slug" element={<PublicProjectDetail />} />
            
            {/* Редирект для коротких ссылок */}
            <Route path="/s/:shortCode" element={<ShortLinkRedirect />} />
            
            {/* Защищенные маршруты */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/projects" element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/projects/:id" element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            
            <Route path="/invitations" element={
              <ProtectedRoute>
                <InvitationsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/referrals" element={
              <ProtectedRoute>
                <ReferralsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/referrals/:campaignId/analytics" element={
              <ProtectedRoute>
                <ReferralAnalytics />
              </ProtectedRoute>
            } />
            
            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/notifications/settings" element={
              <ProtectedRoute>
                <NotificationSettingsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/analytics" element={
              <ProtectedRoute>
                <AnalyticsDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/analytics/enhanced" element={
              <ProtectedRoute>
                <EnhancedAnalyticsDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/analytics/charts" element={
              <ProtectedRoute>
                <InteractiveAnalyticsCharts />
              </ProtectedRoute>
            } />
            
            <Route path="/analytics/predictions" element={
              <ProtectedRoute>
                <PredictiveAnalytics />
              </ProtectedRoute>
            } />
            
            <Route path="/analytics/projects/:projectId" element={
              <ProtectedRoute>
                <ProjectAnalytics />
              </ProtectedRoute>
            } />
            
            <Route path="/analytics/users" element={
              <ProtectedRoute>
                <UserAnalytics />
              </ProtectedRoute>
            } />
            
            <Route path="/pricing" element={
              <ProtectedRoute>
                <PricingPage />
              </ProtectedRoute>
            } />
            
            {/* Юридические страницы (доступны всем) */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />
            
            {/* Перенаправление неизвестных маршрутов */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Контейнер для toast уведомлений */}
          <ToastContainer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

