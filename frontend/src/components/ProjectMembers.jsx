import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '../hooks/useAuth'
import { 
  Users,
  UserPlus,
  Crown,
  Edit,
  Eye,
  MoreVertical,
  Trash2,
  Mail,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function ProjectMembers({ projectId, userRole }) {
  const { apiRequest } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'viewer'
  })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    loadMembers()
  }, [projectId])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const data = await apiRequest(`/projects/${projectId}/members`)
      setMembers(data.members || [])
    } catch (error) {
      console.error('Ошибка загрузки участников:', error)
      setMessage({ type: 'error', text: 'Ошибка загрузки участников' })
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async (e) => {
    e.preventDefault()
    
    if (!inviteData.email.trim()) {
      setMessage({ type: 'error', text: 'Email обязателен' })
      return
    }

    try {
      setInviteLoading(true)
      setMessage({ type: '', text: '' })
      
      await apiRequest(`/projects/${projectId}/invite`, {
        method: 'POST',
        body: JSON.stringify(inviteData)
      })

      setMessage({ type: 'success', text: 'Приглашение отправлено' })
      setShowInviteDialog(false)
      setInviteData({ email: '', role: 'viewer' })
      
      // Обновляем список участников
      loadMembers()
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Ошибка отправки приглашения' })
    } finally {
      setInviteLoading(false)
    }
  }

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await apiRequest(`/projects/${projectId}/members/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      })

      setMembers(prev => prev.map(member => 
        member.id === memberId ? { ...member, role: newRole } : member
      ))
      
      setMessage({ type: 'success', text: 'Роль участника обновлена' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка обновления роли' })
    }
  }

  const handleRemoveMember = async (member) => {
    if (!confirm(`Удалить ${member.user.first_name} ${member.user.last_name} из проекта?`)) {
      return
    }

    try {
      await apiRequest(`/projects/${projectId}/members/${member.id}`, {
        method: 'DELETE'
      })

      setMembers(prev => prev.filter(m => m.id !== member.id))
      setMessage({ type: 'success', text: 'Участник удален из проекта' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка удаления участника' })
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
      year: 'numeric'
    })
  }

  const canManageMembers = userRole === 'owner'

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Участники проекта</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Участники проекта</span>
            </CardTitle>
            <CardDescription>
              {members.length} {members.length === 1 ? 'участник' : 'участников'}
            </CardDescription>
          </div>
          
          {canManageMembers && (
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Пригласить
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Пригласить пользователя</DialogTitle>
                  <DialogDescription>
                    Отправьте приглашение пользователю для совместной работы над проектом
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleInviteUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email пользователя</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={inviteData.email}
                      onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Роль</Label>
                    <Select 
                      value={inviteData.role} 
                      onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">
                          <div className="flex items-center space-x-2">
                            <Eye className="h-4 w-4" />
                            <span>Просмотр - может просматривать проект</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="editor">
                          <div className="flex items-center space-x-2">
                            <Edit className="h-4 w-4" />
                            <span>Редактор - может добавлять и редактировать</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowInviteDialog(false)}
                    >
                      Отмена
                    </Button>
                    <Button type="submit" disabled={inviteLoading}>
                      {inviteLoading ? 'Отправка...' : 'Отправить приглашение'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {message.text && (
          <Alert className={`mb-4 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <AlertDescription className={message.type === 'error' ? 'text-red-800' : 'text-green-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id || `owner-${member.user_id}`} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">
                      {member.user.first_name} {member.user.last_name}
                    </p>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(member.role)}
                        <span>{getRoleName(member.role)}</span>
                      </div>
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3 w-3" />
                      <span>{member.user.email}</span>
                    </div>
                    
                    {member.joined_at && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>Присоединился {formatDate(member.joined_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {canManageMembers && member.role !== 'owner' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {member.role !== 'editor' && (
                      <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'editor')}>
                        <Edit className="mr-2 h-4 w-4" />
                        Сделать редактором
                      </DropdownMenuItem>
                    )}
                    
                    {member.role !== 'viewer' && (
                      <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'viewer')}>
                        <Eye className="mr-2 h-4 w-4" />
                        Только просмотр
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem 
                      onClick={() => handleRemoveMember(member)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Удалить из проекта
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
        
        {members.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Пока нет участников</p>
            {canManageMembers && (
              <p className="text-sm">Пригласите пользователей для совместной работы</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

