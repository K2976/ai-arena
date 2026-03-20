import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import Background from './components/Background'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import AIChat from './pages/AIChat'
import ComputerVision from './pages/ComputerVision'
import Analytics from './pages/Analytics'
import AppStore from './pages/AppStore'
import Integrations from './pages/Integrations'
import RepCounter from './pages/RepCounter'
import ShoppingCart from './components/ShoppingCart'
import Login from './pages/Login'
import Register from './pages/Register'
import { isAuthenticated } from './services/api'
import './App.css'

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  const location = useLocation()

  return (
    <div className="app-root">
      <Background />
      <Navbar />
      <main className="content">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
            <Route path="/vision" element={<ProtectedRoute><ComputerVision /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/nutrition" element={<ProtectedRoute><AppStore /></ProtectedRoute>} />
            <Route path="/shopping-cart" element={<ProtectedRoute><ShoppingCart /></ProtectedRoute>} />
            <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
            <Route path="/counter" element={<ProtectedRoute><RepCounter /></ProtectedRoute>} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}
