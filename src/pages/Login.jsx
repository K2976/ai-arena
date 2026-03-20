import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn } from 'lucide-react'
import { loginUser, loginWithGoogle } from '../services/api'
import './FeaturePages.css'
import './Auth.css'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [googleEmail, setGoogleEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await loginUser({ username, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Unable to sign in right now.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (!googleEmail.trim()) {
      setError('Add your email for Google sign in.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await loginWithGoogle(googleEmail.trim())
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Google sign in unavailable.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.section
      className="auth-page glass"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="auth-head">
        <div className="feature-badge"><LogIn size={14} /> User Access</div>
        <h1>Sign In</h1>
        <p>Continue with your account to load your personal dashboard data.</p>
      </div>

      <form className="auth-form" onSubmit={handleLogin}>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Username"
          autoComplete="username"
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          type="password"
          autoComplete="current-password"
        />
        <div className="auth-actions">
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </div>
      </form>

      <div className="auth-form">
        <input
          value={googleEmail}
          onChange={(event) => setGoogleEmail(event.target.value)}
          placeholder="Google Email"
          type="email"
        />
        <button className="auth-alt" type="button" onClick={handleGoogleLogin} disabled={loading}>
          {loading ? 'Please wait...' : 'Continue with Google'}
        </button>
      </div>

      {error ? <p className="auth-error">{error}</p> : null}

      <p className="auth-footer">
        New here? <Link to="/register">Create account</Link>
      </p>
    </motion.section>
  )
}
