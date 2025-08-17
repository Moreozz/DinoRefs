import React, { useState, useEffect } from 'react';
import { X, Copy, QrCode, ExternalLink, Eye, Share2, CheckCircle } from 'lucide-react';

const PublicLinksModal = ({ isOpen, onClose, project }) => {
  const [links, setLinks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isOpen && project) {
      generateLinks();
      fetchStats();
    }
  }, [isOpen, project]);

  const generateLinks = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${project.id}/public-links`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setLinks(data);
      } else {
        setError(data.error || 'Ошибка генерации ссылок');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${project.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
    }
  };

  const generateQRCode = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${project.id}/qr-code`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setQrCode(data.qr_code);
      } else {
        setError(data.error || 'Ошибка генерации QR-кода');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  const shareLink = async (url) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project.title,
          text: project.description,
          url: url
        });
      } catch (err) {
        console.error('Ошибка шаринга:', err);
      }
    } else {
      copyToClipboard(url, 'share');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Публичные ссылки
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!project.is_public ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Проект не публичный
              </h3>
              <p className="text-gray-600">
                Сделайте проект публичным, чтобы создать ссылки для шаринга
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {loading && !links ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Генерация ссылок...</p>
                </div>
              ) : links ? (
                <div className="space-y-6">
                  {/* Stats */}
                  {stats && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Eye className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">Просмотров:</span>
                        </div>
                        <span className="font-semibold text-gray-900">{stats.view_count}</span>
                      </div>
                    </div>
                  )}

                  {/* Public URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Публичная ссылка
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={links.public_url}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(links.public_url, 'public')}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Копировать"
                      >
                        {copied === 'public' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-600" />
                        )}
                      </button>
                      <button
                        onClick={() => shareLink(links.public_url)}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Поделиться"
                      >
                        <Share2 className="h-4 w-4 text-gray-600" />
                      </button>
                      <a
                        href={links.public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Открыть"
                      >
                        <ExternalLink className="h-4 w-4 text-gray-600" />
                      </a>
                    </div>
                  </div>

                  {/* Short URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Короткая ссылка
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={links.short_url}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(links.short_url, 'short')}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Копировать"
                      >
                        {copied === 'short' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-600" />
                        )}
                      </button>
                      <button
                        onClick={() => shareLink(links.short_url)}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Поделиться"
                      >
                        <Share2 className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        QR-код
                      </label>
                      <button
                        onClick={generateQRCode}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                      >
                        <QrCode className="h-4 w-4 mr-1" />
                        {qrCode ? 'Обновить' : 'Создать'}
                      </button>
                    </div>
                    
                    {qrCode ? (
                      <div className="text-center">
                        <img
                          src={qrCode}
                          alt="QR-код проекта"
                          className="mx-auto border border-gray-200 rounded-lg"
                          style={{ maxWidth: '200px' }}
                        />
                        <p className="mt-2 text-xs text-gray-500">
                          Сканируйте для быстрого доступа
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <QrCode className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          Нажмите "Создать" для генерации QR-кода
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Tips */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      💡 Советы по использованию:
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Используйте короткую ссылку в социальных сетях</li>
                      <li>• QR-код удобен для печатных материалов</li>
                      <li>• Публичная ссылка содержит название проекта</li>
                    </ul>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicLinksModal;

