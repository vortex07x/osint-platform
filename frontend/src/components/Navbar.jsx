import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
    setMenuOpen(false)
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo" onClick={closeMenu}>
        OSINT<span>//</span>PLATFORM
      </Link>

      <div className="navbar-links">
        <Link to="/" className="navbar-link">HOME</Link>
        <Link to="/dashboard" className="navbar-link">DASHBOARD</Link>
        <Link to="/about" className="navbar-link">ABOUT</Link>
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

      <button
        className={`navbar-burger ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>

      {menuOpen && (
        <div className="navbar-mobile-menu">
          <Link to="/" className="navbar-mobile-link" onClick={closeMenu}>HOME</Link>
          <Link to="/dashboard" className="navbar-mobile-link" onClick={closeMenu}>DASHBOARD</Link>
          <Link to="/about" className="navbar-mobile-link" onClick={closeMenu}>ABOUT</Link>
          {user ? (
            <>
              <span className="navbar-mobile-user">{user.email}</span>
              <button onClick={handleLogout} className="navbar-btn" style={{ marginTop: '8px' }}>LOGOUT</button>
            </>
          ) : (
            <Link to="/login" className="navbar-btn" style={{ marginTop: '8px' }} onClick={closeMenu}>LOGIN</Link>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar