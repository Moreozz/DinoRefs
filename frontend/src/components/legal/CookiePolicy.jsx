import React from 'react';

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Политика использования Cookies
            </h1>
            <p className="text-gray-600">
              Действует с 16 августа 2025 года
            </p>
          </div>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                1. Что такое cookies
              </h2>
              <p className="text-gray-700 mb-4">
                Cookies (куки) — это небольшие текстовые файлы, которые сохраняются на вашем 
                устройстве при посещении веб-сайтов. Они помогают сайтам запоминать информацию 
                о ваших предпочтениях и обеспечивают корректную работу различных функций.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 mb-2">
                  🍪 DinoRefs использует cookies для:
                </h3>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Обеспечения безопасности и авторизации</li>
                  <li>Сохранения ваших настроек и предпочтений</li>
                  <li>Анализа использования сервиса</li>
                  <li>Улучшения пользовательского опыта</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                2. Типы cookies, которые мы используем
              </h2>
              <div className="space-y-6">
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <h3 className="text-lg font-medium text-green-800 mb-3">
                    🔐 Необходимые cookies (обязательные)
                  </h3>
                  <p className="text-green-700 mb-3">
                    Эти cookies критически важны для работы сайта и не могут быть отключены.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-green-200">
                      <thead className="bg-green-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-sm font-medium text-green-800">Cookie</th>
                          <th className="px-3 py-2 text-left text-sm font-medium text-green-800">Назначение</th>
                          <th className="px-3 py-2 text-left text-sm font-medium text-green-800">Срок</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-green-200">
                        <tr>
                          <td className="px-3 py-2 text-sm text-green-700">auth_token</td>
                          <td className="px-3 py-2 text-sm text-green-600">Авторизация пользователя</td>
                          <td className="px-3 py-2 text-sm text-green-600">До выхода</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-sm text-green-700">csrf_token</td>
                          <td className="px-3 py-2 text-sm text-green-600">Защита от CSRF атак</td>
                          <td className="px-3 py-2 text-sm text-green-600">Сессия</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-sm text-green-700">session_id</td>
                          <td className="px-3 py-2 text-sm text-green-600">Идентификация сессии</td>
                          <td className="px-3 py-2 text-sm text-green-600">24 часа</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <h3 className="text-lg font-medium text-blue-800 mb-3">
                    ⚙️ Функциональные cookies
                  </h3>
                  <p className="text-blue-700 mb-3">
                    Сохраняют ваши настройки и предпочтения для улучшения опыта использования.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-blue-200">
                      <thead className="bg-blue-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-sm font-medium text-blue-800">Cookie</th>
                          <th className="px-3 py-2 text-left text-sm font-medium text-blue-800">Назначение</th>
                          <th className="px-3 py-2 text-left text-sm font-medium text-blue-800">Срок</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-200">
                        <tr>
                          <td className="px-3 py-2 text-sm text-blue-700">theme_preference</td>
                          <td className="px-3 py-2 text-sm text-blue-600">Тема интерфейса (светлая/темная)</td>
                          <td className="px-3 py-2 text-sm text-blue-600">1 год</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-sm text-blue-700">language</td>
                          <td className="px-3 py-2 text-sm text-blue-600">Выбранный язык интерфейса</td>
                          <td className="px-3 py-2 text-sm text-blue-600">1 год</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-sm text-blue-700">dashboard_layout</td>
                          <td className="px-3 py-2 text-sm text-blue-600">Настройки дашборда</td>
                          <td className="px-3 py-2 text-sm text-blue-600">6 месяцев</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                  <h3 className="text-lg font-medium text-purple-800 mb-3">
                    📊 Аналитические cookies
                  </h3>
                  <p className="text-purple-700 mb-3">
                    Помогают понять, как пользователи взаимодействуют с сайтом для его улучшения.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-purple-200">
                      <thead className="bg-purple-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-sm font-medium text-purple-800">Cookie</th>
                          <th className="px-3 py-2 text-left text-sm font-medium text-purple-800">Назначение</th>
                          <th className="px-3 py-2 text-left text-sm font-medium text-purple-800">Срок</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-200">
                        <tr>
                          <td className="px-3 py-2 text-sm text-purple-700">_analytics_id</td>
                          <td className="px-3 py-2 text-sm text-purple-600">Уникальный идентификатор пользователя</td>
                          <td className="px-3 py-2 text-sm text-purple-600">2 года</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-sm text-purple-700">_page_views</td>
                          <td className="px-3 py-2 text-sm text-purple-600">Статистика просмотров страниц</td>
                          <td className="px-3 py-2 text-sm text-purple-600">30 дней</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-sm text-purple-700">_session_duration</td>
                          <td className="px-3 py-2 text-sm text-purple-600">Длительность сессий</td>
                          <td className="px-3 py-2 text-sm text-purple-600">30 дней</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                3. Управление cookies
              </h2>
              <p className="text-gray-700 mb-4">
                Вы можете управлять использованием cookies несколькими способами:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-green-800 mb-3">
                    🎛️ Настройки DinoRefs
                  </h3>
                  <p className="text-green-700 mb-3">
                    В настройках профиля вы можете:
                  </p>
                  <ul className="text-sm text-green-600 space-y-1">
                    <li>• Отключить аналитические cookies</li>
                    <li>• Управлять функциональными cookies</li>
                    <li>• Очистить сохраненные данные</li>
                    <li>• Сбросить настройки к умолчанию</li>
                  </ul>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-800 mb-3">
                    🌐 Настройки браузера
                  </h3>
                  <p className="text-blue-700 mb-3">
                    В браузере вы можете:
                  </p>
                  <ul className="text-sm text-blue-600 space-y-1">
                    <li>• Заблокировать все cookies</li>
                    <li>• Удалить существующие cookies</li>
                    <li>• Настроить исключения для сайтов</li>
                    <li>• Включить режим инкогнито</li>
                  </ul>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-yellow-800 mb-2">
                  ⚠️ Важно знать
                </h4>
                <p className="text-sm text-yellow-700">
                  Отключение необходимых cookies может привести к некорректной работе сайта. 
                  Некоторые функции могут стать недоступными или работать неправильно.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                4. Инструкции по управлению cookies в браузерах
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">🔍 Google Chrome</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Откройте меню Chrome → Настройки</li>
                    <li>Перейдите в "Конфиденциальность и безопасность"</li>
                    <li>Выберите "Файлы cookie и другие данные сайтов"</li>
                    <li>Настройте параметры по своему усмотрению</li>
                  </ol>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">🦊 Mozilla Firefox</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Откройте меню Firefox → Настройки</li>
                    <li>Перейдите в раздел "Приватность и защита"</li>
                    <li>В блоке "Куки и данные сайтов" нажмите "Управление данными"</li>
                    <li>Настройте или удалите cookies</li>
                  </ol>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">🧭 Safari</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Откройте Safari → Настройки</li>
                    <li>Перейдите на вкладку "Конфиденциальность"</li>
                    <li>Настройте параметры cookies</li>
                    <li>Нажмите "Управлять данными веб-сайтов"</li>
                  </ol>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">🌐 Microsoft Edge</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Откройте меню Edge → Настройки</li>
                    <li>Выберите "Конфиденциальность, поиск и службы"</li>
                    <li>В разделе "Очистить данные браузера" нажмите "Выбрать элементы"</li>
                    <li>Управляйте cookies и данными сайтов</li>
                  </ol>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                5. Cookies третьих сторон
              </h2>
              <p className="text-gray-700 mb-4">
                DinoRefs может использовать сервисы третьих сторон, которые устанавливают 
                собственные cookies:
              </p>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">💳 Платежные системы</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    ЮMoney и СБП могут устанавливать cookies для обработки платежей и предотвращения мошенничества.
                  </p>
                  <div className="flex space-x-4 text-xs">
                    <a href="https://yoomoney.ru/page?id=526052" className="text-blue-600 hover:text-blue-800">
                      Политика ЮMoney
                    </a>
                    <a href="https://sbp.nspk.ru/privacy/" className="text-blue-600 hover:text-blue-800">
                      Политика СБП
                    </a>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">📊 Аналитика</h4>
                  <p className="text-sm text-gray-600">
                    Мы используем собственную систему аналитики, которая не передает данные третьим лицам 
                    и полностью соответствует российскому законодательству.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                6. Согласие на использование cookies
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-medium text-blue-800 mb-2">
                  ✅ Как мы получаем согласие
                </h3>
                <ul className="text-blue-700 space-y-2">
                  <li>• При первом посещении сайта отображается уведомление о cookies</li>
                  <li>• При регистрации вы подтверждаете согласие с политикой</li>
                  <li>• В настройках профиля можно изменить предпочтения</li>
                  <li>• Согласие можно отозвать в любое время</li>
                </ul>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-2">
                  🔄 Отзыв согласия
                </h3>
                <p className="text-green-700">
                  Вы можете отозвать согласие на использование необязательных cookies в любое время 
                  через настройки профиля или обратившись в службу поддержки. Это не повлияет 
                  на законность обработки, осуществлявшейся до отзыва согласия.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                7. Безопасность cookies
              </h2>
              <p className="text-gray-700 mb-4">
                Мы применяем следующие меры для защиты cookies:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">🔐 Технические меры</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Использование флагов Secure и HttpOnly</li>
                    <li>• Шифрование чувствительных данных</li>
                    <li>• Ограничение времени жизни cookies</li>
                    <li>• Регулярная ротация ключей</li>
                  </ul>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">🛡️ Организационные меры</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Минимизация собираемых данных</li>
                    <li>• Регулярный аудит cookies</li>
                    <li>• Обучение персонала</li>
                    <li>• Мониторинг безопасности</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                8. Изменения в политике
              </h2>
              <p className="text-gray-700 mb-4">
                Мы можем обновлять данную политику для отражения изменений в наших практиках 
                или по юридическим причинам. О существенных изменениях мы уведомим:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Через уведомление на сайте</li>
                <li>По электронной почте (для зарегистрированных пользователей)</li>
                <li>Через push-уведомления в приложении</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                9. Контактная информация
              </h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  По вопросам использования cookies обращайтесь:
                </h3>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> cookies@dinorefs.ru</p>
                  <p><strong>Техническая поддержка:</strong> support@dinorefs.ru</p>
                  <p><strong>Время ответа:</strong> до 24 часов</p>
                </div>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
              <p>Последнее обновление: 16 августа 2025 года</p>
              <p>Версия документа: 1.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;

