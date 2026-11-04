import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './hooks/useAuthStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
const TripsPage = lazy(() => import('./pages/TripsPage'))
const TripDetailPage = lazy(() => import('./pages/TripDetailPage'))
const NewTripPage = lazy(() => import('./pages/NewTripPage'))
const AuctionPage = lazy(() => import('./pages/AuctionPage'))
const ExplorePage = lazy(() => import('./pages/ExplorePage'))
const MyBidsPage = lazy(() => import('./pages/MyBidsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import LandingPage from './pages/LandingPage'
import NotFoundPage from './pages/NotFoundPage'
import Layout from './components/Layout'
import { Spinner } from './components/ui/Spinner'

function PageFallback() {
  return (
    <div className="flex justify-center py-16" role="status" aria-label="Cargando">
      <Spinner />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

// "/" muestra la portada pública; con sesión iniciada va directo al panel
function Home() {
  const { token } = useAuthStore()
  return token ? <Navigate to="/dashboard" replace /> : <LandingPage />
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="trips" element={<TripsPage />} />
          <Route path="trips/new" element={<NewTripPage />} />
          <Route path="trips/:id" element={<TripDetailPage />} />
          <Route path="auctions" element={<AuctionPage />} />
          <Route path="auctions/:id" element={<AuctionPage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="my-bids" element={<MyBidsPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </>
  )
}
