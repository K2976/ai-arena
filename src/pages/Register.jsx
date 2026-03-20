import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import { registerUser } from '../services/api'
import './FeaturePages.css'
import './Auth.css'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await registerUser(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Unable to create account right now.')
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
        <div className="feature-badge"><UserPlus size={14} /> User Access</div>
        <h1>Register</h1>
        <p>Create your profile to unlock user-specific training, nutrition, and streak tracking.</p>
      </div>

      <form className="auth-form" onSubmit={handleRegister}>
        <input
          value={form.username}
          onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
          placeholder="Username"
          autoComplete="username"
        />
        <input
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          placeholder="Email"
          type="email"
          autoComplete="email"
        />
        <input
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          placeholder="Password (min 8 chars)"
          type="password"
          autoComplete="new-password"
        />

        <div className="auth-actions">
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
        </div>
      </form>

      {error ? <p className="auth-error">{error}</p> : null}

      <p className="auth-footer">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </motion.section>
  )
}
