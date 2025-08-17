import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'

const OAuthCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [status, setStatus] = useState('processing') // processing, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const provider = searchParams.get('provider')
    const error = searchParams.get('error')

    if (error) {
      setStatus('error')
      setMessage(`Ошибка авторизации: ${error}`)
      
      // Отправляем сообщение родительскому окну (если это popup)
      if (window.opener) {
        window.opener.postMessage({
          type: 'oauth_error',
          error: error
        }, window.location.origin)
        window.close()
        return
      }
      
      // Перенаправляем на страницу входа через 3 секунды
      setTimeout(() => {
        navigate('/auth')
      }, 3000)
      return
    }

    if (token && provider) {
      setStatus('success')
      setMessage(`Успешная авторизация через ${getProviderDisplayName(provider)}`)
      
      // Если это popup окно, отправляем сообщение родительскому окну
      if (window.opener) {
        window.opener.postMessage({
          type: 'oauth_success',
          token: token,
          provider: provider
        }, window.location.origin)
        window.close()
        return
      }
      
      // Если это обычное окно, выполняем вход
      try {
        login(token)
        setTimeout(() => {
          navigate('/dashboard')
        }, 1500)
      } catch (error) {
        setStatus('error')
        setMessage('Ошибка при сохранении токена авторизации')
      }
    } else {
      setStatus('error')
      setMessage('Отсутствуют необходимые параметры авторизации')
      
      setTimeout(() => {
        navigate('/auth')
      }, 3000)
    }
  }, [searchParams, navigate, login])

  const getProviderDisplayName = (provider) => {
    const names = {
      google: 'Google',
      github: 'GitHub',
      vk: 'ВКонтакте',
      telegram: 'Telegram'
    }
    return names[provider] || provider
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'border-blue-200 bg-blue-50'
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            DinoRefs
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Обработка авторизации
          </p>
        </div>

        <div className={`rounded-lg border-2 p-8 ${getStatusColor()}`}>
          <div className="flex flex-col items-center space-y-4">
            {getStatusIcon()}
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {status === 'processing' && 'Обработка авторизации...'}
                {status === 'success' && 'Авторизация успешна!'}
                {status === 'error' && 'Ошибка авторизации'}
              </h3>
              
              {message && (
                <p className="text-sm text-gray-600">
                  {message}
                </p>
              )}
            </div>

            {status === 'processing' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
              </div>
            )}

            {status === 'success' && (
              <Alert className="w-full">
                <AlertDescription>
                  Перенаправляем в личный кабинет...
                </AlertDescription>
              </Alert>
            )}

            {status === 'error' && (
              <Alert className="w-full" variant="destructive">
                <AlertDescription>
                  Перенаправляем на страницу входа...
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Если перенаправление не произошло автоматически,{' '}
            <button
              onClick={() => navigate(status === 'success' ? '/dashboard' : '/auth')}
              className="text-blue-600 hover:text-blue-500 underline"
            >
              нажмите здесь
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default OAuthCallback

