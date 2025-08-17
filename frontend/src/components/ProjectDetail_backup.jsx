import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '../hooks/useAuth'
import Layout from './Layout'
import ProjectMembers from './ProjectMembers'
import { 
  Plus,
  ArrowLeft,
  Link as LinkIcon,
  ExternalLink,
  MoreVertical,
  Edit,
  Trash2,
  Search,
  Tag,
  Calendar,
  Globe,
  Users
} from 'lucide-react'

export default function ProjectDetail() {
  const { id } = useParams()
  const { apiRequest } = useAuth()
  const [project, setProject] = useState(null)
  const [references, setReferences] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingReference, setEditingReference] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    category: '',
    tags: ''
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('references')

  useEffect(() => {
    loadProject()
  }, [id])

  const loadProject = async () => {
    try {
      setLoading(true)
      const data = await apiRequest(`/projects/${id}`)
      setProject(data.project)
      setReferences(data.project.references || [])
    } catch (error) {
      console.error('Ошибка загрузки проекта:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReference = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setFormError('Название референса обязательно')
      return
    }

    try {
      setFormLoading(true)
      setFormError('')
      
      const requestData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      }
      
      const data = await apiRequest(`/projects/${id}/references`, {
        method: 'POST',
        body: JSON.stringify(requestData)
      })

      setReferences(prev => [data.reference, ...prev])
      setShowCreateDialog(false)
      setFormData({ title: '', url: '', description: '', category: '', tags: '' })
    } catch (error) {
      setFormError(error.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateReference = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setFormError('Название референса обязательно')
      return
    }

    try {
      setFormLoading(true)
      setFormError('')
      
      const requestData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      }
      
      const data = await apiRequest(`/references/${editingReference.id}`, {
        method: 'PUT',
        body: JSON.stringify(requestData)
      })

      setReferences(prev => prev.map(r => 
        r.id === editingReference.id ? data.reference : r
      ))
      setEditingReference(null)
      setFormData({ title: '', url: '', description: '', category: '', tags: '' })
    } catch (error) {
      setFormError(error.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteReference = async (reference) => {
    if (!confirm(`Вы уверены, что хотите удалить референс "${reference.title}"?`)) {
      return
    }

    try {
      await apiRequest(`/references/${reference.id}`, {
        method: 'DELETE'
      })

      setReferences(prev => prev.filter(r => r.id !== reference.id))
    } catch (error) {
      console.error('Ошибка удаления референса:', error)
    }
  }

  const openEditDialog = (reference) => {
    setEditingReference(reference)
    setFormData({
      title: reference.title,
      url: reference.url || '',
      description: reference.description || '',
      category: reference.category || '',
      tags: reference.tags ? reference.tags.join(', ') : ''
    })
    setFormError('')
  }

  const closeDialog = () => {
    setShowCreateDialog(false)
    setEditingReference(null)
    setFormData({ title: '', url: '', description: '', category: '', tags: '' })
    setFormError('')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const filteredReferences = references.filter(reference =>
    reference.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (reference.description && reference.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (reference.category && reference.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (reference.tags && reference.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  )

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Проект не найден</h2>
          <Link to="/projects">
            <Button>Вернуться к проектам</Button>
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Навигация */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Link to="/projects" className="hover:text-gray-900 transition-colors">
            Проекты
          </Link>
          <span>/</span>
          <span className="text-gray-900">{project.title}</span>
        </div>

        {/* Заголовок проекта */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <Link to="/projects">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад
                </Button>
              </Link>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
            
            <div className="flex items-center space-x-4 mb-4">
              <Badge variant="secondary">
                <LinkIcon className="h-3 w-3 mr-1" />
                {references.length} референсов
              </Badge>
              {project.is_public && (
                <Badge variant="outline">
                  <Globe className="h-3 w-3 mr-1" />
                  Публичный
                </Badge>
              )}
              <span className="text-sm text-gray-500">
                <Calendar className="inline h-4 w-4 mr-1" />
                Обновлен {formatDate(project.updated_at)}
              </span>
            </div>
            
            {project.description && (
              <p className="text-gray-600">{project.description}</p>
            )}
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Добавить референс
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Добавить новый референс</DialogTitle>
                <DialogDescription>
                  Заполните информацию о референсе
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateReference}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Название *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Введите название референса"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Опишите референс"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Категория</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="Например: Дизайн"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="tags">Теги</Label>
                      <Input
                        id="tags"
                        value={formData.tags}
                        onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="тег1, тег2, тег3"
                      />
                    </div>
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
                    {formLoading ? 'Добавление...' : 'Добавить референс'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Вкладки */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('references')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'references'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <LinkIcon className="h-4 w-4 mr-2 inline" />
              Референсы ({references.length})
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="h-4 w-4 mr-2 inline" />
              Участники
            </button>
          </nav>
        </div>

        {/* Контент вкладок */}
        {activeTab === 'references' && (
          <div className="space-y-6">{/* Поиск */}
        {references.length > 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск референсов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Список референсов */}
        {references.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Пока нет референсов
              </h3>
              <p className="text-gray-600 mb-4">
                Добавьте первый референс в этот проект
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить референс
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReferences.map((reference) => (
              <Card key={reference.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg">{reference.title}</CardTitle>
                        {reference.url && (
                          <a
                            href={reference.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {reference.category && (
                          <Badge variant="outline" className="text-xs">
                            {reference.category}
                          </Badge>
                        )}
                        <span>
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {formatDate(reference.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(reference)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteReference(reference)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {reference.description && (
                    <CardDescription className="mb-3">
                      {reference.description}
                    </CardDescription>
                  )}
                  
                  {reference.url && (
                    <div className="mb-3">
                      <a
                        href={reference.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm break-all"
                      >
                        {reference.url}
                      </a>
                    </div>
                  )}
                  
                  {reference.tags && reference.tags.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-gray-400" />
                      <div className="flex flex-wrap gap-1">
                        {reference.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {activeTab === 'members' && (
          <div className="space-y-6">
            <ProjectMembers projectId={id} userRole="owner" />
          </div>
        )}

        {/* Диалог редактирования */}
        <Dialog open={!!editingReference} onOpenChange={() => setEditingReference(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Редактировать референс</DialogTitle>
              <DialogDescription>
                Измените информацию о референсе
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateReference}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Название *</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Введите название референса"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-url">URL</Label>
                  <Input
                    id="edit-url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Описание</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Опишите референс"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Категория</Label>
                    <Input
                      id="edit-category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Например: Дизайн"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-tags">Теги</Label>
                    <Input
                      id="edit-tags"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="тег1, тег2, тег3"
                    />
                  </div>
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
      </div>
    </Layout>
  )
}

