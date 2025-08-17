import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import SocialLoginButtons from './SocialLoginButtons'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    confirmPassword: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToCookies: false
  })

  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setError('')
  }

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Заполните все обязательные поля')
      return false
    }

    if (!isLogin) {
      if (!formData.first_name || !formData.last_name) {
        setError('Заполните имя и фамилию')
        return false
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Пароли не совпадают')
        return false
      }

      if (formData.password.length < 6) {
        setError('Пароль должен содержать минимум 6 символов')
        return false
      }

      // Проверка согласий для регистрации (требования РФ)
      if (!formData.agreeToTerms || !formData.agreeToPrivacy || !formData.agreeToCookies) {
        setError('Необходимо согласиться со всеми условиями')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      let result
      
      if (isLogin) {
        result = await login({
          email: formData.email,
          password: formData.password
        })
      } else {
        result = await register({
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name
        })
      }

      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Произошла ошибка. Попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLoginSuccess = (token, provider) => {
    // Сохраняем токен и перенаправляем
    localStorage.setItem('token', token)
    navigate('/dashboard')
  }

  const handleSocialLoginError = (error) => {
    setError(error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Кнопка возврата */}
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Вернуться на главную
        </Link>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🦕</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">DinoRefs</span>
            </div>
            
            <CardTitle className="text-2xl">
              {isLogin ? 'Вход в систему' : 'Создание аккаунта'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Введите свои данные для входа' 
                : 'Заполните форму для регистрации'
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Имя и фамилия для регистрации */}
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">Имя *</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Ваше имя"
                      required={!isLogin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Фамилия *</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Ваша фамилия"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  required
                />
              </div>

              {/* Пароль */}
              <div className="space-y-2">
                <Label htmlFor="password">Пароль *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={isLogin ? 'Ваш пароль' : 'Минимум 6 символов'}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Подтверждение пароля для регистрации */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Подтвердите пароль *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Повторите пароль"
                    required={!isLogin}
                  />
                </div>
              )}

              {/* Согласия для регистрации (требования РФ) */}
              {!isLogin && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agreeToTerms"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, agreeToTerms: checked }))
                      }
                    />
                    <Label htmlFor="agreeToTerms" className="text-sm">
                      Я согласен с{' '}
                      <a href="#" className="text-blue-600 hover:underline">
                        условиями использования
                      </a>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agreeToPrivacy"
                      name="agreeToPrivacy"
                      checked={formData.agreeToPrivacy}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, agreeToPrivacy: checked }))
                      }
                    />
                    <Label htmlFor="agreeToPrivacy" className="text-sm">
                      Я согласен с{' '}
                      <a href="#" className="text-blue-600 hover:underline">
                        политикой конфиденциальности
                      </a>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agreeToCookies"
                      name="agreeToCookies"
                      checked={formData.agreeToCookies}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, agreeToCookies: checked }))
                      }
                    />
                    <Label htmlFor="agreeToCookies" className="text-sm">
                      Я согласен на использование cookies
                    </Label>
                  </div>
                </div>
              )}

              {/* Ошибка */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Кнопка отправки */}
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={loading}
              >
                {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Создать аккаунт')}
              </Button>
            </form>

            {/* Социальная авторизация */}
            <SocialLoginButtons
              onSuccess={handleSocialLoginSuccess}
              onError={handleSocialLoginError}
              className="mt-6"
            />

            {/* Переключение между входом и регистрацией */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
                {' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError('')
                    setFormData({
                      email: '',
                      password: '',
                      first_name: '',
                      last_name: '',
                      confirmPassword: '',
                      agreeToTerms: false,
                      agreeToPrivacy: false,
                      agreeToCookies: false
                    })
                  }}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {isLogin ? 'Зарегистрироваться' : 'Войти'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

