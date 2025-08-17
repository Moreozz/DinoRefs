import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Loader2, Link2, Unlink, Star, Plus, Trash2 } from 'lucide-react'
import SocialLoginButtons from './SocialLoginButtons'

const SocialAccountsManager = ({ user }) => {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAddAccount, setShowAddAccount] = useState(false)

  useEffect(() => {
    fetchSocialAccounts()
  }, [])

  const fetchSocialAccounts = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${window.API_BASE_URL || ''}/api/oauth/accounts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      } else {
        throw new Error('Не удалось загрузить социальные аккаунты')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSetPrimary = async (accountId) => {
    setActionLoading(accountId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${window.API_BASE_URL || ''}/api/oauth/accounts/${accountId}/primary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setSuccess('Основной способ входа обновлен')
        fetchSocialAccounts()
      } else {
        throw new Error('Не удалось обновить основной аккаунт')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnlinkAccount = async (accountId) => {
    if (!confirm('Вы уверены, что хотите отвязать этот аккаунт?')) {
      return
    }

    setActionLoading(accountId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${window.API_BASE_URL || ''}/api/oauth/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setSuccess('Аккаунт отвязан')
        fetchSocialAccounts()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Не удалось отвязать аккаунт')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSocialLoginSuccess = (token, provider) => {
    setSuccess(`Аккаунт ${getProviderDisplayName(provider)} успешно привязан`)
    setShowAddAccount(false)
    fetchSocialAccounts()
  }

  const handleSocialLoginError = (error) => {
    setError(error)
    setShowAddAccount(false)
  }

  const getProviderDisplayName = (provider) => {
    const names = {
      google: 'Google',
      github: 'GitHub',
      vk: 'ВКонтакте',
      telegram: 'Telegram'
    }
    return names[provider] || provider
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
    return icons[provider] || <Link2 className="w-5 h-5" />
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Социальные аккаунты</CardTitle>
          <CardDescription>
            Управление способами входа в систему
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Загрузка...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Социальные аккаунты</CardTitle>
        <CardDescription>
          Управление способами входа в систему
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <Link2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет привязанных аккаунтов
            </h3>
            <p className="text-gray-500 mb-4">
              Привяжите социальные аккаунты для быстрого входа
            </p>
            <Button onClick={() => setShowAddAccount(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить аккаунт
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getProviderIcon(account.provider)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {getProviderDisplayName(account.provider)}
                      </span>
                      {account.is_primary && (
                        <Badge variant="default" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Основной
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {account.provider_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!account.is_primary && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetPrimary(account.id)}
                      disabled={actionLoading === account.id}
                    >
                      {actionLoading === account.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Star className="w-4 h-4" />
                      )}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnlinkAccount(account.id)}
                    disabled={actionLoading === account.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    {actionLoading === account.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={() => setShowAddAccount(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить еще один аккаунт
            </Button>
          </div>
        )}

        {showAddAccount && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Добавить новый аккаунт</h4>
            <SocialLoginButtons
              onSuccess={handleSocialLoginSuccess}
              onError={handleSocialLoginError}
            />
            <Button
              variant="ghost"
              onClick={() => setShowAddAccount(false)}
              className="w-full mt-3"
            >
              Отмена
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SocialAccountsManager

