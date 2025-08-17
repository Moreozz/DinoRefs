import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '../hooks/useAuth'
import { usePlanLimits } from '../hooks/usePlanLimits'
import Layout from './Layout'
import PublicLinksModal from './PublicLinksModal'
import ReferralCampaignWizard from './ReferralCampaignWizard'
import PlanLimitNotification from './PlanLimitNotification'
import { 
  Plus,
  FolderOpen,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Link as LinkIcon,
  Search,
  Share2,
  Users,
  Target
} from 'lucide-react'

export default function ProjectsPage() {
  const { apiRequest } = useAuth()
  const { canCreate, checkProjectLimit, incrementUsage } = usePlanLimits('free') // TODO: получать план из контекста пользователя
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('updated_at') // 'title', 'created_at', 'updated_at', 'references_count'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc', 'desc'
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'public', 'private'
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [showPublicLinksModal, setShowPublicLinksModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showReferralWizard, setShowReferralWizard] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: false
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const data = await apiRequest('/projects')
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setFormError('Название проекта обязательно')
      return
    }

    // Проверяем лимит проектов
    if (!canCreate.project) {
      const limitInfo = checkProjectLimit()
      setFormError(`Достигнут лимит проектов (${limitInfo.currentValue}/${limitInfo.maxValue}). Обновите план для создания большего количества проектов.`)
      return
    }

    try {
      setFormLoading(true)
      setFormError('')
      
      const data = await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify(formData)
      })

      setProjects(prev => [data.project, ...prev])
      incrementUsage('projects') // Обновляем счетчик использования
      setShowCreateDialog(false)
      setFormData({ title: '', description: '', is_public: false })
    } catch (error) {
      setFormError(error.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateProject = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setFormError('Название проекта обязательно')
      return
    }

    try {
      setFormLoading(true)
      setFormError('')
      
      const data = await apiRequest(`/projects/${editingProject.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      })

      setProjects(prev => prev.map(p => 
        p.id === editingProject.id ? data.project : p
      ))
      setEditingProject(null)
      setFormData({ title: '', description: '', is_public: false })
    } catch (error) {
      setFormError(error.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteProject = async (project) => {
    if (!confirm(`Вы уверены, что хотите удалить проект "${project.title}"?`)) {
      return
    }

    try {
      await apiRequest(`/projects/${project.id}`, {
        method: 'DELETE'
      })

      setProjects(prev => prev.filter(p => p.id !== project.id))
    } catch (error) {
      console.error('Ошибка удаления проекта:', error)
    }
  }

  const openEditDialog = (project) => {
    setEditingProject(project)
    setFormData({
      title: project.title,
      description: project.description || '',
      is_public: project.is_public
    })
    setFormError('')
  }

  const closeDialog = () => {
    setShowCreateDialog(false)
    setEditingProject(null)
    setFormData({ title: '', description: '', is_public: false })
    setFormError('')
  }

  const openPublicLinksModal = (project) => {
    setSelectedProject(project)
    setShowPublicLinksModal(true)
  }

  const closePublicLinksModal = () => {
    setShowPublicLinksModal(false)
    setSelectedProject(null)
  }

  const handleCreateReferralCampaign = async (campaignData) => {
    try {
      const data = await apiRequest('/referrals/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignData)
      })
      
      console.log('Реферальная кампания создана:', data)
      // Можно добавить уведомление об успехе
    } catch (error) {
      console.error('Ошибка создания реферальной кампании:', error)
      throw error
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const filteredProjects = projects
    .filter(project => {
      // Поиск по названию и описанию
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()))
      
      // Фильтр по статусу
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'public' && project.is_public) ||
        (filterStatus === 'private' && !project.is_public)
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'references_count':
          aValue = a.references_count || 0
          bValue = b.references_count || 0
          break
        case 'created_at':
          aValue = new Date(a.created_at || 0)
          bValue = new Date(b.created_at || 0)
          break
        case 'updated_at':
        default:
          aValue = new Date(a.updated_at || 0)
          bValue = new Date(b.updated_at || 0)
          break
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

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
        {/* Заголовок и действия */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Мои проекты</h1>
            <p className="text-gray-600 mt-1">
              Управляйте своими проектами и референсами
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Уведомление о лимитах проектов */}
            {!canCreate.project && (
              <PlanLimitNotification
                planId="free"
                limitType="maxProjects"
                currentValue={checkProjectLimit().currentValue}
                exceeded={true}
                onUpgrade={() => window.location.href = '/pricing'}
                className="mb-4"
              />
            )}
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button 
                  size="lg"
                  disabled={!canCreate.project}
                  title={!canCreate.project ? 'Достигнут лимит проектов для вашего плана' : ''}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Создать проект
                </Button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать новый проект</DialogTitle>
                <DialogDescription>
                  Заполните информацию о проекте для управления референсами
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Название проекта *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Введите название проекта"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Опишите ваш проект"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_public"
                      checked={formData.is_public}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, is_public: checked }))
                      }
                    />
                    <Label htmlFor="is_public">Сделать проект публичным</Label>
                  </div>
                  
                  {formError && (
                    <Alert variant="destructive">
                      <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Отмена
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? 'Создание...' : 'Создать проект'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => setShowReferralWizard(true)}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Target className="mr-2 h-5 w-5" />
            Создать реферальную кампанию
          </Button>
          </div>
        </div>

        {/* Поиск и фильтры */}
        {projects.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск проектов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {/* Фильтр по статусу */}
              <div className="flex gap-1">
                <Button 
                  variant={filterStatus === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  Все
                </Button>
                <Button 
                  variant={filterStatus === 'public' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilterStatus('public')}
                >
                  Публичные
                </Button>
                <Button 
                  variant={filterStatus === 'private' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilterStatus('private')}
                >
                  Приватные
                </Button>
              </div>
              
              {/* Сортировка */}
              <div className="flex gap-1">
                <Button 
                  variant={sortBy === 'updated_at' && sortOrder === 'desc' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => { setSortBy('updated_at'); setSortOrder('desc') }}
                >
                  Новые
                </Button>
                <Button 
                  variant={sortBy === 'title' && sortOrder === 'asc' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => { setSortBy('title'); setSortOrder('asc') }}
                >
                  А-Я
                </Button>
                <Button 
                  variant={sortBy === 'references_count' && sortOrder === 'desc' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => { setSortBy('references_count'); setSortOrder('desc') }}
                >
                  Популярные
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Список проектов */}
        {projects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Пока нет проектов
              </h3>
              <p className="text-gray-600 mb-4">
                Создайте свой первый проект для управления референсами
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Создать проект
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow min-h-[200px]">
                <CardHeader className="pb-3">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FolderOpen className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg leading-tight break-words mb-2">{project.title}</CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              <LinkIcon className="h-3 w-3 mr-1" />
                              {project.references_count} референсов
                            </Badge>
                            {project.is_public && (
                              <Badge variant="outline" className="text-xs">
                                Публичный
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(project)}
                        className="flex-1 min-w-[120px]"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Редактировать
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteProject(project)}
                        className="text-red-600 hover:text-red-700 flex-1 min-w-[100px]"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {project.description && (
                    <CardDescription className="mb-3 line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(project.updated_at)}
                    </div>
                    
                    <Link to={`/projects/${project.id}`}>
                      <Button variant="outline" size="sm">
                        Открыть
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Диалог редактирования */}
        <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать проект</DialogTitle>
              <DialogDescription>
                Измените информацию о проекте
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateProject}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Название проекта *</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Введите название проекта"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Описание</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Опишите ваш проект"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-is_public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_public: checked }))
                    }
                  />
                  <Label htmlFor="edit-is_public">Сделать проект публичным</Label>
                </div>
                
                {formError && (
                  <Alert variant="destructive">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Отмена
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Модальное окно публичных ссылок */}
        <PublicLinksModal
          isOpen={showPublicLinksModal}
          onClose={closePublicLinksModal}
          project={selectedProject}
        />

        {/* Мастер создания реферальной кампании */}
        <ReferralCampaignWizard
          isOpen={showReferralWizard}
          onClose={() => setShowReferralWizard(false)}
          onSave={handleCreateReferralCampaign}
        />
      </div>
    </Layout>
  )
}

