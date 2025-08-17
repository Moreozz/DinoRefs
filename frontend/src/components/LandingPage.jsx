import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FolderOpen, 
  Link as LinkIcon, 
  Users, 
  QrCode, 
  Search, 
  Settings,
  Zap,
  Shield,
  Globe
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🦕</span>
            </div>
            <span className="text-xl font-bold text-gray-900">DinoRefs</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Возможности
            </a>
            <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">
              О системе
            </a>
            <a href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">
              Контакты
            </a>
          </nav>
          
          <div className="flex items-center space-x-3">
            <Link to="/auth">
              <Button variant="outline">Войти</Button>
            </Link>
            <Link to="/auth">
              <Button>Регистрация</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Управляйте проектами и{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              референсами легко
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Создавайте коллекции ссылок, делитесь проектами с командой и находите вдохновение в одном месте
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-3">
                <Zap className="mr-2 h-5 w-5" />
                Начать бесплатно
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                📖 Посмотреть демо
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Все необходимые инструменты
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Полный набор функций для эффективного управления проектами и референсами
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Управление проектами</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Создавайте проекты, добавляйте описания и организуйте свои референсы по категориям
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <LinkIcon className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Коллекции ссылок</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Сохраняйте полезные ссылки, добавляйте описания и теги для быстрого поиска
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Совместная работа</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Делитесь проектами с командой, получайте обратную связь и работайте вместе
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <QrCode className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>QR-коды</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Генерируйте QR-коды для быстрого доступа к проектам с мобильных устройств
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Поиск и фильтры</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Находите нужные референсы быстро с помощью поиска по тегам и категориям
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Настраиваемые поля</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Добавляйте собственные поля для хранения дополнительной информации
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Почему выбирают DinoRefs?
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Безопасность данных</h3>
                    <p className="text-gray-600">
                      Ваши проекты и референсы защищены современными методами шифрования
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Быстрая работа</h3>
                    <p className="text-gray-600">
                      Мгновенный поиск, быстрая загрузка и отзывчивый интерфейс
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Globe className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Доступ везде</h3>
                    <p className="text-gray-600">
                      Работайте с любого устройства - компьютера, планшета или телефона
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Начните прямо сейчас</h3>
              <p className="text-blue-100 mb-6">
                Создайте свой первый проект за 2 минуты. Никаких сложных настроек.
              </p>
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="w-full">
                  Создать аккаунт бесплатно
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🦕</span>
                </div>
                <span className="text-xl font-bold">DinoRefs</span>
              </div>
              <p className="text-gray-400">
                Современная система управления проектами и референсами
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Продукт</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Возможности</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Цены</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Поддержка</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Документация</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Помощь</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Контакты</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Компания</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">О нас</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Блог</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Карьера</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 DinoRefs. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

