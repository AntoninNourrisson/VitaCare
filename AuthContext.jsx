import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    try {
      const res = await api.get('/auth/me.php')
      setUser(res.data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMe() }, [fetchMe])

  const login = async (email, mot_de_passe) => {
    const res = await api.post('/auth/login.php', { email, mot_de_passe })
    setUser(res.data.user)
    return res.data.user
  }

  const logout = async () => {
    await api.post('/auth/logout.php')
    setUser(null)
  }

  const register = async (formData) => {
    const res = await api.post('/auth/register.php', formData)
    return res.data
  }

  const updateUser = (partial) => setUser(prev => ({ ...prev, ...partial }))

  const isAdmin     = user?.role === 'admin'
  const isPraticien = user?.role === 'praticien' || user?.role === 'admin'
  const isSportif   = !!user

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateUser, isAdmin, isPraticien, isSportif }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
