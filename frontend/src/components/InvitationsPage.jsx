import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '../hooks/useAuth'
import Layout from './Layout'
import { 
  Mail,
  Calendar,
  FolderOpen,
  CheckCircle,
  XCircle,
  Users,
  Crown,
  Edit,
  Eye
} from 'lucide-react'

export default function InvitationsPage() {
  const { apiRequest } = useAuth()
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    loadInvitations()
  }, [])

  const loadInvitations = async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/invitations')
      setInvitations(data.invitations || [])
    } catch (error) {
      console.error('Ошибка загрузки приглашений:', error)
      setMessage({ type: 'error', text: 'Ошибка загрузки приглашений' })
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async (invitationId) => {
    try {
      await apiRequest(`/invitations/${invitationId}/accept`, {
        method: 'POST'
      })

      setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
      setMessage({ type: 'success', text: 'Приглашение принято' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка принятия приглашения' })
    }
  }

  const handleDeclineInvitation = async (invitationId) => {
    try {
      await apiRequest(`/invitations/${invitationId}/decline`, {
        method: 'POST'
      })

      setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
      setMessage({ type: 'success', text: 'Приглашение отклонено' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка отклонения приглашения' })
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />
      case 'editor':
        return <Edit className="h-4 w-4 text-blue-600" />
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-600" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleName = (role) => {
    switch (role) {
      case 'owner':
        return 'Владелец'
      case 'editor':
        return 'Редактор'
      case 'viewer':
        return 'Просмотр'
      default:
        return role
    }
  }

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'editor':
        return 'secondary'
      case 'viewer':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
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
      <div className="space-y-8">
        {/* Заголовок */}
        <div className="flex items-center space-x-3">
          <Mail className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Приглашения</h1>
            <p className="text-gray-600 mt-1">
              Приглашения в проекты от других пользователей
            </p>
          </div>
        </div>

        {/* Сообщения */}
        {message.text && (
          <Alert className={`${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Список приглашений */}
        {invitations.length > 0 ? (
          <div className="grid gap-6">
            {invitations.map((invitation) => (
              <Card key={invitation.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FolderOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {invitation.project.title}
                        </CardTitle>
                        
                        <CardDescription className="text-base mb-3">
                          {invitation.project.description || 'Описание проекта отсутствует'}
                        </CardDescription>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>
                              Приглашение от {invitation.inviter.first_name} {invitation.inviter.last_name}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(invitation.invited_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Badge variant={getRoleBadgeVariant(invitation.role)}>
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(invitation.role)}
                        <span>{getRoleName(invitation.role)}</span>
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <Button 
                      onClick={() => handleAcceptInvitation(invitation.id)}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Принять</span>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => handleDeclineInvitation(invitation.id)}
                      className="flex items-center space-x-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Отклонить</span>
                    </Button>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Роль "{getRoleName(invitation.role)}"</strong> позволяет:
                    </p>
                    <ul className="text-sm text-gray-600 mt-1 ml-4 list-disc">
                      {invitation.role === 'viewer' && (
                        <>
                          <li>Просматривать проект и все референсы</li>
                          <li>Использовать поиск по проекту</li>
                        </>
                      )}
                      {invitation.role === 'editor' && (
                        <>
                          <li>Просматривать проект и все референсы</li>
                          <li>Добавлять новые референсы</li>
                          <li>Редактировать и удалять референсы</li>
                          <li>Использовать все функции проекта</li>
                        </>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Нет приглашений
              </h3>
              <p className="text-gray-600 mb-6">
                У вас пока нет приглашений в проекты от других пользователей
              </p>
              <p className="text-sm text-gray-500">
                Когда кто-то пригласит вас в свой проект, приглашение появится здесь
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}

