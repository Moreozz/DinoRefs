import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Eye, Calendar, ExternalLink, Tag, Globe } from 'lucide-react';

const PublicProjectDetail = () => {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/public/${slug}`);
        const data = await response.json();

        if (response.ok) {
          setProject(data.project);
        } else {
          setError(data.error || 'Проект не найден');
        }
      } catch (err) {
        setError('Ошибка загрузки проекта');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProject();
    }
  }, [slug]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка проекта...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🦕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Проект не найден</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/public"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться к проектам
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center mb-4">
            <Link
              to="/public"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 transition-colors mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Все проекты
            </Link>
            <div className="flex items-center text-sm text-gray-500">
              <Globe className="h-4 w-4 mr-1" />
              <span>Публичный проект</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {project.title}
          </h1>
          
          {project.description && (
            <p className="text-lg text-gray-600 mb-4">
              {project.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              <span>{project.view_count} просмотров</span>
            </div>
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-1" />
              <span>{project.references_count} референсов</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Создан {formatDate(project.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {project.references && project.references.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Референсы ({project.references.length})
            </h2>
            
            <div className="grid gap-6">
              {project.references.map((reference) => (
                <div
                  key={reference.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {reference.title}
                    </h3>
                    {reference.url && isValidUrl(reference.url) && (
                      <a
                        href={reference.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-purple-600 hover:text-purple-700 transition-colors ml-4"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  
                  {reference.description && (
                    <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                      {reference.description}
                    </p>
                  )}
                  
                  {reference.url && (
                    <div className="mb-4">
                      {isValidUrl(reference.url) ? (
                        <a
                          href={reference.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 transition-colors break-all"
                        >
                          {reference.url}
                        </a>
                      ) : (
                        <span className="text-gray-600 break-all">
                          {reference.url}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {reference.tags && (
                    <div className="flex flex-wrap gap-2">
                      {reference.tags.split(',').map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      Добавлен {formatDate(reference.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Референсов пока нет
            </h3>
            <p className="text-gray-600">
              В этом проекте еще не добавлены референсы
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Создано с помощью
            </p>
            <Link
              to="/"
              className="inline-flex items-center text-purple-600 hover:text-purple-700 transition-colors font-semibold"
            >
              🦕 DinoRefs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProjectDetail;

