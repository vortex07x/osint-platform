import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import HUDOverlay from '../components/HUDOverlay'

function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register' | 'forgot'
  const [otpStep, setOtpStep] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, register, forgotPassword, resetPassword } = useAuth()
  const navigate = useNavigate()

  const resetFormState = () => {
    setError('')
    setMessage('')
    setOtpStep(false)
    setOtp('')
    setNewPassword('')
  }

  const switchMode = (newMode) => {
    resetFormState()
    setMode(newMode)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await login(email, password)
        navigate('/dashboard')
      } else if (mode === 'register') {
        await register(email, password, fullName)
        navigate('/dashboard')
      } else if (mode === 'forgot') {
        if (!otpStep) {
          const res = await forgotPassword(email)
          setMessage(res.message)
          setOtpStep(true)
        } else {
          const res = await resetPassword(email, otp, newPassword)
          setMessage(res.message)
          setTimeout(() => switchMode('login'), 1500)
        }
      }
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
            {mode === 'login' && 'AUTHENTICATE TO CONTINUE'}
            {mode === 'register' && 'CREATE ACCOUNT'}
            {mode === 'forgot' && (otpStep ? 'ENTER CODE & NEW PASSWORD' : 'RESET PASSWORD')}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <input
                type="text"
                placeholder="FULL NAME"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
              />
            )}

            {mode !== 'forgot' && (
              <>
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
              </>
            )}

            {mode === 'forgot' && !otpStep && (
              <input
                type="email"
                placeholder="EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
              />
            )}

            {mode === 'forgot' && otpStep && (
              <>
                <input
                  type="text"
                  placeholder="6-DIGIT CODE"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="input-field"
                  maxLength={6}
                  required
                />
                <input
                  type="password"
                  placeholder="NEW PASSWORD"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  required
                />
              </>
            )}

            {error && <p className="auth-error">{error}</p>}
            {message && <p className="auth-message">{message}</p>}

            <button type="submit" disabled={loading} className="auth-submit">
              {loading
                ? 'PLEASE WAIT...'
                : mode === 'login'
                ? 'LOGIN'
                : mode === 'register'
                ? 'REGISTER'
                : otpStep
                ? 'RESET PASSWORD'
                : 'SEND RESET CODE'}
            </button>
          </form>

          {mode === 'login' && (
            <p className="auth-forgot-link" onClick={() => switchMode('forgot')}>
              Forgot password?
            </p>
          )}

          {mode !== 'forgot' ? (
            <p className="auth-toggle">
              {mode === 'register' ? 'Already have an account?' : "Don't have an account?"}{' '}
              <span onClick={() => switchMode(mode === 'register' ? 'login' : 'register')}>
                {mode === 'register' ? 'LOGIN' : 'REGISTER'}
              </span>
            </p>
          ) : (
            <p className="auth-toggle">
              <span onClick={() => switchMode('login')}>← BACK TO LOGIN</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login