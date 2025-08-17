import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '../hooks/useAuth';
import Layout from './Layout';
import ReferralCampaignWizard from './ReferralCampaignWizard';
import { 
  Plus,
  Target,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Users,
  TrendingUp,
  Search,
  BarChart3,
  Link as LinkIcon,
  Share2,
  Play,
  Pause,
  Copy,
  ExternalLink,
  Gift,
  Zap
} from 'lucide-react';

export default function ReferralsPage() {
  const { apiRequest } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [stats, setStats] = useState({
    total_campaigns: 0,
    active_campaigns: 0,
    total_clicks: 0,
    total_conversions: 0
  });

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/referrals/campaigns');
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Ошибка загрузки кампаний:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiRequest('/referrals/dashboard');
      setStats(data.stats || {});
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const handleCreateCampaign = async (campaignData) => {
    try {
      // Кампания уже создана в мастере, просто обновляем список
      setCampaigns(prev => [campaignData, ...prev]);
      fetchStats(); // Обновляем статистику
      setShowCreateWizard(false);
    } catch (error) {
      console.error('Ошибка обновления списка кампаний:', error);
      throw error;
    }
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setShowCreateWizard(true);
  };

  const handleUpdateCampaign = async (updatedCampaign) => {
    try {
      const data = await apiRequest(`/referrals/campaigns/${editingCampaign.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedCampaign)
      });
      
      setCampaigns(prev => prev.map(c => 
        c.id === editingCampaign.id ? data.campaign : c
      ));
      fetchStats();
      setEditingCampaign(null);
      setShowCreateWizard(false);
    } catch (error) {
      console.error('Ошибка обновления кампании:', error);
      throw error;
    }
  };

  const handleToggleCampaign = async (campaign) => {
    try {
      const data = await apiRequest(`/referrals/campaigns/${campaign.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...campaign,
          is_active: !campaign.is_active
        })
      });
      
      setCampaigns(prev => prev.map(c => 
        c.id === campaign.id ? data.campaign : c
      ));
      fetchStats();
    } catch (error) {
      console.error('Ошибка обновления кампании:', error);
    }
  };

  const handleDeleteCampaign = async (campaign) => {
    if (!confirm(`Вы уверены, что хотите удалить кампанию "${campaign.title}"?`)) {
      return;
    }

    try {
      await apiRequest(`/referrals/campaigns/${campaign.id}`, {
        method: 'DELETE'
      });

      setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
      fetchStats();
    } catch (error) {
      console.error('Ошибка удаления кампании:', error);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Можно добавить уведомление об успехе
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCampaignTypeLabel = (type) => {
    const types = {
      invitation: 'Приглашение',
      promotion: 'Продвижение',
      contest: 'Конкурс',
      event: 'Мероприятие',
      lead_generation: 'Лидогенерация'
    };
    return types[type] || type;
  };

  const getCampaignTypeColor = (type) => {
    const colors = {
      invitation: 'bg-blue-100 text-blue-800',
      promotion: 'bg-green-100 text-green-800',
      contest: 'bg-purple-100 text-purple-800',
      event: 'bg-orange-100 text-orange-800',
      lead_generation: 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (campaign.description && campaign.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const StatCard = ({ icon: Icon, title, value, description, color = "blue" }) => {
    const colorClasses = {
      blue: "bg-blue-50 text-blue-600 border-blue-200",
      green: "bg-green-50 text-green-600 border-green-200",
      purple: "bg-purple-50 text-purple-600 border-purple-200",
      orange: "bg-orange-50 text-orange-600 border-orange-200"
    };

    return (
      <Card className={`border ${colorClasses[color]}`}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-white">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-sm font-medium">{title}</div>
              <div className="text-xs opacity-75">{description}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const CampaignCard = ({ campaign }) => {
    const conversionRate = campaign.total_clicks > 0 
      ? ((campaign.total_conversions / campaign.total_clicks) * 100).toFixed(1)
      : 0;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <CardTitle className="text-lg">{campaign.title}</CardTitle>
                <Badge 
                  variant={campaign.is_active ? "default" : "secondary"}
                  className={campaign.is_active ? "bg-green-100 text-green-800" : ""}
                >
                  {campaign.is_active ? 'Активна' : 'Неактивна'}
                </Badge>
                <Badge className={getCampaignTypeColor(campaign.campaign_type)}>
                  {getCampaignTypeLabel(campaign.campaign_type)}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {campaign.description || 'Без описания'}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleToggleCampaign(campaign)}>
                  {campaign.is_active ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Приостановить
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Активировать
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEditCampaign(campaign)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Редактировать
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/referrals/${campaign.id}/analytics`)}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Аналитика
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeleteCampaign(campaign)}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{campaign.total_clicks || 0}</div>
              <div className="text-xs text-gray-500">Переходы</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{campaign.total_conversions || 0}</div>
              <div className="text-xs text-gray-500">Конверсии</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{conversionRate}%</div>
              <div className="text-xs text-gray-500">Конверсия</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{campaign.total_rewards || 0}</div>
              <div className="text-xs text-gray-500">Награды</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Создана {formatDate(campaign.created_at)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{campaign.channels_count || 0} каналов</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => copyToClipboard(campaign.short_url)}
              className="flex-1"
            >
              <Copy className="mr-2 h-4 w-4" />
              Копировать ссылку
            </Button>
            <Button size="sm" variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Поделиться
            </Button>
            <Button size="sm" variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Открыть
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Заголовок */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Реферальные кампании</h1>
            <p className="text-gray-600 mt-1">
              Создавайте и управляйте реферальными кампаниями
            </p>
          </div>
          
          <Button 
            size="lg"
            onClick={() => setShowCreateWizard(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-5 w-5" />
            Создать кампанию
          </Button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Target}
            title="Всего кампаний"
            value={stats.total_campaigns || 0}
            description="Созданных кампаний"
            color="blue"
          />
          <StatCard
            icon={Zap}
            title="Активных"
            value={stats.active_campaigns || 0}
            description="Запущенных кампаний"
            color="green"
          />
          <StatCard
            icon={TrendingUp}
            title="Переходов"
            value={stats.total_clicks || 0}
            description="Всего кликов"
            color="purple"
          />
          <StatCard
            icon={Gift}
            title="Конверсий"
            value={stats.total_conversions || 0}
            description="Завершенных действий"
            color="orange"
          />
        </div>

        {/* Поиск */}
        {campaigns.length > 0 && (
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск кампаний..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Список кампаний */}
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Пока нет реферальных кампаний
              </h3>
              <p className="text-gray-600 mb-4">
                Создайте свою первую реферальную кампанию для привлечения пользователей
              </p>
              <Button 
                onClick={() => setShowCreateWizard(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Создать первую кампанию
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCampaigns.map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}

        {/* Мастер создания/редактирования кампании */}
        <ReferralCampaignWizard
          isOpen={showCreateWizard}
          onClose={() => {
            setShowCreateWizard(false);
            setEditingCampaign(null);
          }}
          onSave={editingCampaign ? handleUpdateCampaign : handleCreateCampaign}
          initialData={editingCampaign}
          isEditing={!!editingCampaign}
        />
      </div>
    </Layout>
  );
}

