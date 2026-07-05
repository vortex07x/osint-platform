import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="dotted-grid" />
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h1 className="brand-title" style={{ fontSize: '32px', textAlign: 'center', marginBottom: '8px' }}>
          OSINT // PLATFORM
        </h1>
        <p className="brand-subtitle" style={{ textAlign: 'center', marginBottom: '32px' }}>
          {isRegister ? 'CREATE ACCOUNT' : 'AUTHENTICATE TO CONTINUE'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

          {error && (
            <p style={{ color: '#EF4444', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '8px' }}>
            {loading ? 'PLEASE WAIT...' : isRegister ? 'REGISTER' : 'LOGIN'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#6B7280', fontFamily: "'JetBrains Mono', monospace" }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <span
            onClick={() => setIsRegister(!isRegister)}
            style={{ color: '#FF4D2D', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegister ? 'LOGIN' : 'REGISTER'}
          </span>
        </p>
      </div>
    </div>
  )
}

export default Login