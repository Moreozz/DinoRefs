import React, { useState, useEffect } from 'react';
import { Search, Eye, Calendar, ExternalLink } from 'lucide-react';

const PublicProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    has_next: false,
    has_prev: false
  });

  const fetchPublicProjects = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '12'
      });
      
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetch(`/api/public/projects?${params}`);
      const data = await response.json();

      if (response.ok) {
        setProjects(data.projects);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Ошибка загрузки проектов');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicProjects();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPublicProjects(1, searchQuery);
  };

  const handlePageChange = (newPage) => {
    fetchPublicProjects(newPage, searchQuery);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка публичных проектов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🦕 DinoRefs - Публичные проекты
              </h1>
              <p className="mt-2 text-gray-600">
                Исследуйте коллекции референсов от сообщества
              </p>
            </div>
            
            {/* Search */}
            <form onSubmit={handleSearch} className="mt-4 sm:mt-0 flex">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Поиск проектов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition-colors"
              >
                Найти
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {projects.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🦕</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Публичных проектов пока нет
            </h3>
            <p className="text-gray-600">
              {searchQuery ? 'По вашему запросу ничего не найдено' : 'Станьте первым, кто поделится своим проектом!'}
            </p>
          </div>
        ) : (
          <>
            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {project.title}
                      </h3>
                      <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                    
                    {project.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        <span>{project.view_count} просмотров</span>
                      </div>
                      <div className="flex items-center">
                        <span>{project.references_count} референсов</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-400 mb-4">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatDate(project.created_at)}</span>
                    </div>
                    
                    <a
                      href={`/public/${project.public_slug}`}
                      className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Открыть проект
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.has_prev}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Назад
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const page = i + 1;
                    const isActive = page === pagination.page;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm rounded-lg ${
                          isActive
                            ? 'bg-purple-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.has_next}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Далее
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="mt-8 text-center text-sm text-gray-500">
              Показано {projects.length} из {pagination.total} проектов
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PublicProjectsPage;

