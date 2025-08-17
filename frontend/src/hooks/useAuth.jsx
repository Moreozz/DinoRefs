import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // API базовый URL
  const API_BASE = 'http://localhost:5002/api'

  // Функция для выполнения API запросов
  const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Произошла ошибка')
    }

    return data
  }

  // Проверка токена при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const data = await apiRequest('/auth/me')
        setUser(data.user)
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error)
        localStorage.removeItem('token')
        setToken(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [token])

  // Регистрация
  const register = async (userData) => {
    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      })

      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Авторизация
  const login = async (credentials) => {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })

      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Выход
  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    // Принудительно перезагружаем страницу для полной очистки состояния
    window.location.href = '/auth'
  }

  // Обновление профиля
  const updateProfile = async (profileData) => {
    try {
      const data = await apiRequest('/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      })

      setUser(data.user)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const value = {
    user,
    loading,
    token,
    register,
    login,
    logout,
    updateProfile,
    apiRequest,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

