import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Don't render the navbar on the login/auth page
  if (location.pathname === '/login') {
    return null
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        OSINT<span>//</span>PLATFORM
      </Link>

      <div className="navbar-links">
        <Link to="/" className="navbar-link">HOME</Link>
        <Link to="/dashboard" className="navbar-link">DASHBOARD</Link>
        <a href="#about" className="navbar-link">ABOUT</a>
      </div>

      <div className="navbar-auth">
        {user ? (
          <>
            <span className="navbar-user">{user.email}</span>
            <button onClick={handleLogout} className="navbar-btn">LOGOUT</button>
          </>
        ) : (
          <Link to="/login" className="navbar-btn">LOGIN</Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar