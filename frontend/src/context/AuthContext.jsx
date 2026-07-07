import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'http://127.0.0.1:8000'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = sessionStorage.getItem('osint_token')
    if (savedToken) {
      setToken(savedToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
      fetchMe(savedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchMe = async (tok) => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${tok}` }
      })
      setUser(res.data)
    } catch (err) {
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password })
    const { access_token, user } = res.data
    sessionStorage.setItem('osint_token', access_token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    setToken(access_token)
    setUser(user)
    return user
  }

  const register = async (email, password, fullName) => {
    const res = await axios.post(`${API_URL}/auth/register`, {
      email, password, full_name: fullName
    })
    const { access_token, user } = res.data
    sessionStorage.setItem('osint_token', access_token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    setToken(access_token)
    setUser(user)
    return user
  }

  const logout = () => {
    sessionStorage.removeItem('osint_token')
    delete axios.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  const forgotPassword = async (email) => {
    const res = await axios.post(`${API_URL}/auth/forgot-password`, { email })
    return res.data
  }

  const resetPassword = async (email, otp, newPassword) => {
    const res = await axios.post(`${API_URL}/auth/reset-password`, {
      email,
      otp,
      new_password: newPassword
    })
    return res.data
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}