import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './hooks/useAuthStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TripsPage from './pages/TripsPage'
import TripDetailPage from './pages/TripDetailPage'
import NewTripPage from './pages/NewTripPage'
import AuctionPage from './pages/AuctionPage'
import Layout from './components/Layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="trips" element={<TripsPage />} />
          <Route path="trips/new" element={<NewTripPage />} />
          <Route path="trips/:id" element={<TripDetailPage />} />
          <Route path="auctions" element={<AuctionPage />} />
          <Route path="auctions/:id" element={<AuctionPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}
