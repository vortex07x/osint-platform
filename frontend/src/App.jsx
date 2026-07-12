import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import ScanResults from './pages/ScanResults'
import Login from './pages/Login'
import CustomCursor from './components/CustomCursor'
import Navbar from './components/Navbar'
import './App.css'
import About from './pages/About'
import NeonGridCursor from './components/NeonGridCursor'

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
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/scan/:scanId" element={<ProtectedRoute><ScanResults /></ProtectedRoute>} />
      <Route path="/about" element={<About />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CustomCursor />
        <NeonGridCursor />
        <Navbar />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App