import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import ScanResults from './pages/ScanResults'
import Login from './pages/Login'
import './App.css'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="page"><p className="empty-state">LOADING...</p></div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/scan/:scanId" element={<ProtectedRoute><ScanResults /></ProtectedRoute>} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App