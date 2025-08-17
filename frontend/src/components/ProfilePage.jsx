import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '../hooks/useAuth'
import Layout from './Layout'
import SocialAccountsManager from './SocialAccountsManager'
import SubscriptionManagement from './SubscriptionManagement'
import { 
  User,
  Mail,
  Calendar,
  Shield,
  Save,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react'

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth()
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || ''
      }))
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setMessage({ type: '', text: '' })
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setMessage({ type: 'error', text: 'Имя и фамилия обязательны' })
      return
    }

    try {
      setLoading(true)
      setMessage({ type: '', text: '' })
      
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email
      }

      const result = await updateProfile(updateData)
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Профиль успешно обновлен' })
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Произошла ошибка при обновлении профиля' })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    
    if (!formData.current_password || !formData.new_password) {
      setMessage({ type: 'error', text: 'Заполните все поля для смены пароля' })
      return
    }

    if (formData.new_password !== formData.confirm_password) {
      setMessage({ type: 'error', text: 'Новые пароли не совпадают' })
      return
    }

    if (formData.new_password.length < 6) {
      setMessage({ type: 'error', text: 'Новый пароль должен содержать минимум 6 символов' })
      return
    }

    try {
      setLoading(true)
      setMessage({ type: '', text: '' })
      
      const result = await updateProfile({
        current_password: formData.current_password,
        new_password: formData.new_password
      })
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Пароль успешно изменен' })
        setFormData(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
          confirm_password: ''
        }))
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Произошла ошибка при смене пароля' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (window.confirm('Вы уверены, что хотите выйти из системы?')) {
      try {
        await logout()
        // Перенаправление произойдет автоматически через useAuth
      } catch (error) {
        setMessage({ type: 'error', text: 'Ошибка при выходе из системы' })
      }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Заголовок */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Профиль пользователя</h1>
          <p className="text-gray-600 mt-1">
            Управляйте своими личными данными, подпиской и настройками аккаунта
          </p>
        </div>

        {/* Вкладки */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Профиль</TabsTrigger>
            <TabsTrigger value="subscription">Подписка</TabsTrigger>
            <TabsTrigger value="social">Соц. сети</TabsTrigger>
          </TabsList>

          {/* Вкладка профиля */}
          <TabsContent value="profile" className="space-y-6">
            {/* Информация об аккаунте */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Информация об аккаунте</span>
                    </CardTitle>
                    <CardDescription>
                      Основная информация о вашем аккаунте
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Выйти из системы
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-gray-600">Полное имя</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.email}</p>
                    <p className="text-sm text-gray-600">Email адрес</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatDate(user.created_at)}
                    </p>
                    <p className="text-sm text-gray-600">Дата регистрации</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.is_admin ? 'default' : 'secondary'}>
                        {user.is_admin ? 'Администратор' : 'Пользователь'}
                      </Badge>
                      <Badge variant={user.is_active ? 'default' : 'destructive'}>
                        {user.is_active ? 'Активен' : 'Заблокирован'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">Статус аккаунта</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Редактирование профиля */}
        <Card>
          <CardHeader>
            <CardTitle>Редактировать профиль</CardTitle>
            <CardDescription>
              Обновите свою личную информацию
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Имя *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Ваше имя"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="last_name">Фамилия *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Ваша фамилия"
                    required
                  />
                </div>
              </div>
              
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
              
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Сохранение...' : 'Сохранить изменения'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Смена пароля */}
        <Card>
          <CardHeader>
            <CardTitle>Смена пароля</CardTitle>
            <CardDescription>
              Обновите пароль для повышения безопасности
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Текущий пароль</Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    name="current_password"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={formData.current_password}
                    onChange={handleInputChange}
                    placeholder="Введите текущий пароль"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password">Новый пароль</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      name="new_password"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={formData.new_password}
                      onChange={handleInputChange}
                      placeholder="Минимум 6 символов"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Подтвердите пароль</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      name="confirm_password"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      placeholder="Повторите новый пароль"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Изменение...' : 'Изменить пароль'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Социальные аккаунты */}
        <SocialAccountsManager user={user} />

        {/* Сообщения */}
        {message.text && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
          </TabsContent>

          {/* Вкладка подписки */}
          <TabsContent value="subscription">
            <SubscriptionManagement 
              onUpgrade={() => window.location.href = '/pricing'}
            />
          </TabsContent>

          {/* Вкладка социальных сетей */}
          <TabsContent value="social">
            <SocialAccountsManager user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

