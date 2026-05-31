import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Navbar      from './components/Navbar'
import Footer      from './components/Footer'
import Spinner     from './components/Spinner'

import Home          from './pages/Home'
import Services      from './pages/Services'
import ServiceDetail from './pages/ServiceDetail'
import Activities    from './pages/Activities'
import ActivityDetail from './pages/ActivityDetail'
import Login         from './pages/Login'
import Register      from './pages/Register'
import Profile       from './pages/Profile'
import Dashboard     from './pages/Dashboard'
import History       from './pages/History'
import Notifications from './pages/Notifications'
import Admin         from './pages/Admin'
import Cart          from './pages/Cart'
import NotFound      from './pages/NotFound'

function PrivateRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner fullscreen />
  if (!user) return <Navigate to="/login" replace />
  if (requiredRole === 'admin' && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  if (requiredRole === 'staff' && !['admin', 'praticien'].includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner fullscreen />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/services"  element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/activities"   element={<Activities />} />
          <Route path="/activities/:id" element={<ActivityDetail />} />

          <Route path="/login"    element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

          <Route path="/profile"       element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/dashboard"     element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/history"       element={<PrivateRoute><History /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="/cart"          element={<PrivateRoute><Cart /></PrivateRoute>} />

          <Route path="/admin" element={<PrivateRoute requiredRole="staff"><Admin /></PrivateRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
