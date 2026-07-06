import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import HUDOverlay from '../components/HUDOverlay'

function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await register(email, password, fullName)
      } else {
        await login(email, password)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <HUDOverlay />

      <div className="auth-circle">
        <div className="auth-circle-content">
          <p className="auth-tag">// SECURE ACCESS</p>
          <h1 className="auth-title">OSINT // PLATFORM</h1>
          <p className="auth-subtitle">
            {isRegister ? 'CREATE ACCOUNT' : 'AUTHENTICATE TO CONTINUE'}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <input
                type="text"
                placeholder="FULL NAME"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
              />
            )}
            <input
              type="email"
              placeholder="EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
            <input
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? 'PLEASE WAIT...' : isRegister ? 'REGISTER' : 'LOGIN'}
            </button>
          </form>

          <p className="auth-toggle">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <span onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? 'LOGIN' : 'REGISTER'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login