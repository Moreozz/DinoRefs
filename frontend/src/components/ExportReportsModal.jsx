import React, { useState, useEffect } from 'react';

const ExportReportsModal = ({ isOpen, onClose, reportType = 'revenue_trends', dateRange = '30', selectedMetrics = [] }) => {
  const [exportFormats, setExportFormats] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchExportFormats();
    }
  }, [isOpen]);

  const fetchExportFormats = async () => {
    try {
      const response = await fetch('http://localhost:5002/api/reports/export-formats');
      const data = await response.json();
      setExportFormats(data.formats || []);
    } catch (error) {
      console.error('Ошибка загрузки форматов экспорта:', error);
      // Fallback форматы
      setExportFormats([
        {
          id: 'pdf',
          name: 'PDF отчет',
          description: 'Профессиональный отчет с графиками и таблицами',
          icon: '📄',
          size: 'Средний размер файла'
        },
        {
          id: 'excel',
          name: 'Excel файл',
          description: 'Интерактивные таблицы и графики для анализа',
          icon: '📊',
          size: 'Большой размер файла'
        },
        {
          id: 'csv',
          name: 'CSV данные',
          description: 'Сырые данные для импорта в другие системы',
          icon: '📋',
          size: 'Малый размер файла'
        }
      ]);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Симуляция прогресса
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const exportData = {
        report_type: reportType,
        date_range: dateRange,
        selected_metrics: selectedMetrics.length > 0 ? selectedMetrics : ['revenue', 'users', 'conversions']
      };

      let endpoint = '';
      switch (selectedFormat) {
        case 'pdf':
          endpoint = 'http://localhost:5002/api/reports/generate-pdf';
          break;
        case 'excel':
          endpoint = 'http://localhost:5002/api/reports/generate-excel';
          break;
        case 'csv':
          endpoint = 'http://localhost:5002/api/reports/generate-csv';
          break;
        default:
          throw new Error('Неподдерживаемый формат экспорта');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData)
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      if (response.ok) {
        // Получаем blob файла
        const blob = await response.blob();
        
        // Определяем имя файла из заголовков или создаем свое
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `dinorefs_report_${new Date().toISOString().slice(0, 10)}.${selectedFormat}`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        // Создаем ссылку для скачивания
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Показываем уведомление об успехе
        alert(`Отчет успешно экспортирован в формате ${selectedFormat.toUpperCase()}!`);
        
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      alert(`Ошибка при экспорте отчета: ${error.message}`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  if (!isOpen) return null;

  const reportTypeNames = {
    'revenue_trends': 'Тренды доходов',
    'user_growth': 'Рост пользователей',
    'conversion_funnel': 'Воронка конверсий',
    'engagement_metrics': 'Метрики вовлеченности',
    'project_performance': 'Эффективность проектов',
    'cohort_analysis': 'Когортный анализ'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Экспорт отчета</h3>
            <p className="text-sm text-gray-500 mt-1">
              {reportTypeNames[reportType] || 'Аналитический отчет'} • {dateRange} дней
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isExporting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Контент */}
        <div className="p-6">
          {!isExporting ? (
            <>
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Выберите формат экспорта:</h4>
                <div className="space-y-3">
                  {exportFormats.map((format) => (
                    <label
                      key={format.id}
                      className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedFormat === format.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="exportFormat"
                        value={format.id}
                        checked={selectedFormat === format.id}
                        onChange={(e) => setSelectedFormat(e.target.value)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="text-lg mr-2">{format.icon}</span>
                          <span className="font-medium text-gray-900">{format.name}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{format.description}</p>
                        <p className="text-xs text-gray-500">{format.size}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Информация о содержимом */}
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Содержимое отчета:</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Сводная таблица ключевых метрик</li>
                  <li>• Детальные данные по дням</li>
                  <li>• Графики и визуализации</li>
                  <li>• Выводы и рекомендации</li>
                  {selectedFormat === 'excel' && <li>• Интерактивные графики Excel</li>}
                  {selectedFormat === 'csv' && <li>• Сырые данные для анализа</li>}
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Генерируем отчет...</h4>
              <p className="text-sm text-gray-600 mb-4">
                Создаем {selectedFormat.toUpperCase()} файл с вашими данными
              </p>
              
              {/* Прогресс бар */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">{exportProgress}% завершено</p>
            </div>
          )}
        </div>

        {/* Кнопки */}
        {!isExporting && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Экспортировать
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportReportsModal;

