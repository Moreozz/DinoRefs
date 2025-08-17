import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Loader2 } from 'lucide-react'

const SocialLoginButtons = ({ onSuccess, onError, className = "" }) => {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState(null)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      const response = await fetch(`${window.API_BASE_URL || ''}/api/oauth/providers`)
      const data = await response.json()
      setProviders(data.providers || [])
    } catch (error) {
      console.error('Ошибка загрузки провайдеров:', error)
    }
  }

  const handleSocialLogin = async (provider) => {
    if (!provider.available) {
      onError?.('Этот способ входа временно недоступен')
      return
    }

    setLoadingProvider(provider.name)
    setLoading(true)

    try {
      const response = await fetch(`${window.API_BASE_URL || ''}/api/oauth/${provider.name}/login`)
      const data = await response.json()

      if (data.auth_url) {
        // Открываем OAuth окно
        const popup = window.open(
          data.auth_url,
          'oauth_popup',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        )

        // Слушаем сообщения от popup окна
        const messageListener = (event) => {
          if (event.origin !== window.location.origin) return

          if (event.data.type === 'oauth_success') {
            popup.close()
            window.removeEventListener('message', messageListener)
            onSuccess?.(event.data.token, event.data.provider)
            setLoading(false)
            setLoadingProvider(null)
          } else if (event.data.type === 'oauth_error') {
            popup.close()
            window.removeEventListener('message', messageListener)
            onError?.(event.data.error)
            setLoading(false)
            setLoadingProvider(null)
          }
        }

        window.addEventListener('message', messageListener)

        // Проверяем, если popup закрыт пользователем
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed)
            window.removeEventListener('message', messageListener)
            setLoading(false)
            setLoadingProvider(null)
          }
        }, 1000)
      } else {
        throw new Error('Не удалось получить URL авторизации')
      }
    } catch (error) {
      onError?.(error.message)
      setLoading(false)
      setLoadingProvider(null)
    }
  }

  const getProviderIcon = (provider) => {
    const icons = {
      google: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      github: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
      ),
      vk: (
        <svg className="w-5 h-5" fill="#0077FF" viewBox="0 0 24 24">
          <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1.01-1.49-.9-1.49.45v1.57c0 .417-.133.667-1.25.667-1.85 0-3.898-1.119-5.352-3.202-2.18-3.035-2.784-5.32-2.784-5.793 0-.267.108-.517.45-.517h1.744c.367 0 .5.15.642.5.708 1.825 1.908 3.42 2.399 2.2.317-.783.267-2.533.117-2.9-.217-.533-.633-.683-1.183-.733-.45-.042.283-.517.617-.683.5-.25 1.317-.267 2.317-.25 1.4.025 1.817.1 2.367.233.733.175.75.6.667 1.867-.05.767-.117 2.033.283 2.433.267.267.917-.117 2.083-2.183.717-1.267 1.267-2.75 1.267-2.75.083-.183.208-.267.417-.267h1.744c.5 0 .6.25.5.517-.167.767-2.017 3.183-2.017 3.183-.417.617-.35.883 0 1.417.25.4 1.067 1.05 1.617 1.683.917.933 1.617 1.683 1.8 2.217.183.533-.1.8-.617.8z"/>
        </svg>
      ),
      telegram: (
        <svg className="w-5 h-5" fill="#0088cc" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      )
    }
    return icons[provider.name] || null
  }

  const getProviderColor = (provider) => {
    const colors = {
      google: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
      github: 'bg-gray-900 hover:bg-gray-800 text-white',
      vk: 'bg-blue-600 hover:bg-blue-700 text-white',
      telegram: 'bg-blue-500 hover:bg-blue-600 text-white'
    }
    return colors[provider.name] || 'bg-gray-600 hover:bg-gray-700 text-white'
  }

  if (providers.length === 0) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Или войдите через
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {providers.map((provider) => (
          <Button
            key={provider.name}
            variant="outline"
            onClick={() => handleSocialLogin(provider)}
            disabled={loading || !provider.available}
            className={`w-full h-11 ${getProviderColor(provider)} transition-all duration-200`}
          >
            {loadingProvider === provider.name ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <span className="mr-2">
                {getProviderIcon(provider)}
              </span>
            )}
            {provider.available ? (
              `Войти через ${provider.display_name}`
            ) : (
              `${provider.display_name} (скоро)`
            )}
          </Button>
        ))}
      </div>

      {loading && (
        <Alert>
          <AlertDescription>
            Перенаправляем на страницу авторизации...
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default SocialLoginButtons

