import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '../hooks/useAuth'
import Layout from './Layout'
import SEOHead, { SEOConfigs } from './SEOHead'
import { DinoHelper } from './DinoMascot'
import { 
  FolderOpen, 
  Link as LinkIcon, 
  Plus, 
  TrendingUp,
  Users,
  Eye,
  Calendar
} from 'lucide-react'

export default function Dashboard() {
  const { user, apiRequest } = useAuth()
  const [projects, setProjects] = useState([])
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalReferences: 0,
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Загружаем проекты
      const projectsData = await apiRequest('/projects')
      setProjects(projectsData.projects || [])
      
      // Подсчитываем статистику
      const totalProjects = projectsData.projects?.length || 0
      const totalReferences = projectsData.projects?.reduce((sum, project) => 
        sum + (project.references_count || 0), 0) || 0
      
      setStats({
        totalProjects,
        totalReferences,
        recentActivity: projectsData.projects?.slice(0, 5) || []
      })
      
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
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
      <SEOHead {...SEOConfigs.dashboard} />
      <div className="space-y-8">
        {/* Заголовок */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Добро пожаловать, {user?.first_name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Управляйте своими проектами и референсами
            </p>
          </div>
          
          <Link to="/projects">
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="mr-2 h-5 w-5" />
              Создать проект
            </Button>
          </Link>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего проектов</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalProjects > 0 ? 'Активные проекты' : 'Создайте первый проект'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего референсов</CardTitle>
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReferences}</div>
              <p className="text-xs text-muted-foreground">
                Сохраненные ссылки
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активность</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.recentActivity.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Недавние обновления
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Быстрые действия */}
        <Card>
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
            <CardDescription>
              Часто используемые функции для работы с проектами
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/projects">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <Plus className="h-6 w-6" />
                  <span>Новый проект</span>
                </Button>
              </Link>
              
              <Link to="/projects">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <FolderOpen className="h-6 w-6" />
                  <span>Мои проекты</span>
                </Button>
              </Link>
              
              <Link to="/profile">
                <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span>Профиль</span>
                </Button>
              </Link>
              
              {user?.is_admin && (
                <Link to="/admin">
                  <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                    <Eye className="h-6 w-6" />
                    <span>Админ панель</span>
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Последние проекты */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Последние проекты</CardTitle>
              <CardDescription>
                Ваши недавно обновленные проекты
              </CardDescription>
            </div>
            {projects.length > 0 && (
              <Link to="/projects">
                <Button variant="outline" size="sm">
                  Все проекты
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Пока нет проектов
                </h3>
                <p className="text-gray-600 mb-4">
                  Создайте свой первый проект для управления референсами
                </p>
                <Link to="/projects">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Создать проект
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FolderOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{project.title}</h4>
                        <p className="text-sm text-gray-600">
                          {project.references_count} референсов
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          <Calendar className="inline h-4 w-4 mr-1" />
                          {formatDate(project.updated_at)}
                        </p>
                        {project.is_public && (
                          <Badge variant="secondary" className="mt-1">
                            Публичный
                          </Badge>
                        )}
                      </div>
                      
                      <Link to={`/projects/${project.id}`}>
                        <Button variant="outline" size="sm">
                          Открыть
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Помощник динозавр */}
      <DinoHelper 
        context="dashboard"
        tips={[
          "💡 Создайте свой первый проект, чтобы начать работу с рефералами!",
          "📊 Проверяйте аналитику регулярно для отслеживания прогресса.",
          "🎯 Используйте теги для организации проектов по категориям.",
          "🔗 Делитесь публичными проектами для привлечения новых пользователей."
        ]}
        position="bottom-right"
      />
    </Layout>
  )
}

