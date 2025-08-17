import React from 'react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Пользовательское соглашение
            </h1>
            <p className="text-gray-600">
              Действует с 16 августа 2025 года
            </p>
          </div>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                1. Общие положения
              </h2>
              <p className="text-gray-700 mb-4">
                Настоящее Пользовательское соглашение (далее — «Соглашение») регулирует отношения 
                между ИП/ООО [Наименование] (далее — «Администрация», «Мы») и пользователем 
                (далее — «Пользователь», «Вы») при использовании веб-сервиса DinoRefs 
                (далее — «Сервис»), доступного по адресу dinorefs.ru.
              </p>
              <p className="text-gray-700 mb-4">
                DinoRefs — это платформа для управления референсами и реферальными программами, 
                предоставляющая инструменты для создания, отслеживания и монетизации 
                реферальных кампаний.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  <strong>Важно:</strong> Регистрируясь в Сервисе или используя его функции, 
                  вы подтверждаете, что полностью прочитали, поняли и согласились с условиями 
                  настоящего Соглашения.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                2. Описание Сервиса
              </h2>
              <p className="text-gray-700 mb-4">
                DinoRefs предоставляет следующие основные функции:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">📁 Управление проектами</h3>
                  <p className="text-sm text-blue-700">
                    Создание и управление реферальными проектами с настройкой параметров
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">📊 Аналитика и отчеты</h3>
                  <p className="text-sm text-green-700">
                    Детальная статистика, графики и экспорт данных в различных форматах
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-800 mb-2">💰 Монетизация</h3>
                  <p className="text-sm text-purple-700">
                    Система тарифных планов с различными уровнями функциональности
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-medium text-orange-800 mb-2">🔗 Реферальные ссылки</h3>
                  <p className="text-sm text-orange-700">
                    Генерация и отслеживание уникальных реферальных ссылок
                  </p>
                </div>
              </div>
              <p className="text-gray-700">
                Администрация оставляет за собой право изменять функциональность Сервиса, 
                добавлять новые возможности или временно ограничивать доступ к отдельным 
                функциям для технического обслуживания.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                3. Регистрация и учетная запись
              </h2>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-800 mb-2">Требования к регистрации</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Возраст не менее 18 лет или согласие родителей/опекунов</li>
                    <li>• Действующий адрес электронной почты</li>
                    <li>• Предоставление достоверной информации</li>
                    <li>• Согласие с условиями настоящего Соглашения</li>
                  </ul>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-gray-800 mb-2">Ответственность за учетную запись</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Обеспечение конфиденциальности пароля</li>
                    <li>• Немедленное уведомление о компрометации аккаунта</li>
                    <li>• Ответственность за все действия под вашей учетной записью</li>
                    <li>• Запрет на передачу доступа третьим лицам</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                4. Тарифные планы и оплата
              </h2>
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">План</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Стоимость</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Основные возможности</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2 text-sm font-medium text-gray-700">🥚 Dino Egg (Free)</td>
                      <td className="px-4 py-2 text-sm text-gray-600">Бесплатно</td>
                      <td className="px-4 py-2 text-sm text-gray-600">До 100 рефералов/месяц, базовая аналитика</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm font-medium text-gray-700">🦕 Baby Dino</td>
                      <td className="px-4 py-2 text-sm text-gray-600">2,000₽/мес или 19,200₽/год</td>
                      <td className="px-4 py-2 text-sm text-gray-600">До 1,000 рефералов, расширенная аналитика</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm font-medium text-gray-700">🦖 T-Rex</td>
                      <td className="px-4 py-2 text-sm text-gray-600">8,500₽/мес или 71,400₽/год</td>
                      <td className="px-4 py-2 text-sm text-gray-600">До 10,000 рефералов, AI-аналитика, экспорт</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm font-medium text-gray-700">👑 Dino King</td>
                      <td className="px-4 py-2 text-sm text-gray-600">От 100,000₽/год</td>
                      <td className="px-4 py-2 text-sm text-gray-600">Безлимитно, white-label, API, поддержка 24/7</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">💳 Условия оплаты</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Оплата производится через ЮMoney или СБП</li>
                    <li>• Списание средств происходит автоматически</li>
                    <li>• При годовой оплате предоставляются скидки до 40%</li>
                    <li>• НДС включен в стоимость (при наличии)</li>
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">🔄 Возврат средств</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Возврат возможен в течение 14 дней с момента оплаты</li>
                    <li>• При использовании функций возврат не производится</li>
                    <li>• Возврат осуществляется тем же способом, что и оплата</li>
                    <li>• Срок возврата: до 10 рабочих дней</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                5. Права и обязанности сторон
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">👤 Права пользователя</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Использовать Сервис в соответствии с выбранным тарифом</li>
                    <li>• Получать техническую поддержку</li>
                    <li>• Экспортировать свои данные</li>
                    <li>• Расторгнуть соглашение в любое время</li>
                    <li>• Требовать защиты персональных данных</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">⚖️ Обязанности пользователя</h3>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Соблюдать условия настоящего Соглашения</li>
                    <li>• Предоставлять достоверную информацию</li>
                    <li>• Не нарушать права третьих лиц</li>
                    <li>• Своевременно оплачивать услуги</li>
                    <li>• Уведомлять о проблемах безопасности</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                6. Запрещенные действия
              </h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-medium text-red-800 mb-3">
                  🚫 При использовании Сервиса запрещается:
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">Технические нарушения</h4>
                    <ul className="text-sm text-red-600 space-y-1">
                      <li>• Попытки взлома или обхода защиты</li>
                      <li>• Использование автоматизированных средств</li>
                      <li>• Перегрузка серверов</li>
                      <li>• Внедрение вредоносного кода</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">Содержательные нарушения</h4>
                    <ul className="text-sm text-red-600 space-y-1">
                      <li>• Размещение незаконного контента</li>
                      <li>• Нарушение авторских прав</li>
                      <li>• Спам и массовые рассылки</li>
                      <li>• Мошенничество и обман</li>
                    </ul>
                  </div>
                </div>
              </div>
              <p className="text-gray-700">
                За нарушение указанных требований Администрация имеет право заблокировать 
                учетную запись без возврата средств и уведомить соответствующие органы.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                7. Ответственность и ограничения
              </h2>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">⚠️ Ограничение ответственности</h4>
                  <p className="text-sm text-gray-600">
                    Сервис предоставляется "как есть". Администрация не гарантирует 
                    бесперебойную работу, отсутствие ошибок или соответствие ваших ожиданий. 
                    Максимальная ответственность ограничена суммой, уплаченной за услуги.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">🔧 Техническое обслуживание</h4>
                  <p className="text-sm text-gray-600">
                    Мы оставляем за собой право проводить плановые технические работы 
                    с предварительным уведомлением пользователей. В экстренных случаях 
                    доступ может быть ограничен без предварительного уведомления.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">💾 Сохранность данных</h4>
                  <p className="text-sm text-gray-600">
                    Мы принимаем разумные меры для защиты ваших данных, но не можем 
                    гарантировать абсолютную безопасность. Рекомендуем регулярно 
                    создавать резервные копии важных данных.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                8. Интеллектуальная собственность
              </h2>
              <p className="text-gray-700 mb-4">
                Все права на Сервис, включая программное обеспечение, дизайн, товарные знаки 
                и контент, принадлежат Администрации или используются на законных основаниях.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">✅ Вам разрешается</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Использовать Сервис по назначению</li>
                    <li>• Создавать ссылки на публичные страницы</li>
                    <li>• Упоминать DinoRefs в контексте использования</li>
                  </ul>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">❌ Вам запрещается</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Копировать код или дизайн</li>
                    <li>• Использовать товарные знаки</li>
                    <li>• Создавать производные продукты</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                9. Расторжение соглашения
              </h2>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-800 mb-2">Расторжение пользователем</h4>
                  <p className="text-sm text-gray-600">
                    Вы можете прекратить использование Сервиса в любое время, удалив 
                    учетную запись в настройках профиля. При наличии активной подписки 
                    она будет действовать до окончания оплаченного периода.
                  </p>
                </div>
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-medium text-gray-800 mb-2">Расторжение администрацией</h4>
                  <p className="text-sm text-gray-600">
                    Мы можем заблокировать доступ при нарушении условий Соглашения, 
                    неоплате услуг или по требованию государственных органов. 
                    О блокировке мы уведомим по электронной почте.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                10. Применимое право и разрешение споров
              </h2>
              <p className="text-gray-700 mb-4">
                Настоящее Соглашение регулируется законодательством Российской Федерации. 
                Все споры подлежат рассмотрению в судах по месту нахождения Администрации.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">📞 Досудебное урегулирование</h4>
                <p className="text-sm text-blue-700">
                  Перед обращением в суд стороны обязуются предпринять попытку 
                  досудебного урегулирования спора. Претензии направляются на 
                  адрес support@dinorefs.ru и рассматриваются в течение 30 дней.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                11. Контактная информация
              </h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">📧 Техническая поддержка</h4>
                    <p className="text-sm text-gray-600">support@dinorefs.ru</p>
                    <p className="text-sm text-gray-600">Время ответа: до 24 часов</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">💼 Юридические вопросы</h4>
                    <p className="text-sm text-gray-600">legal@dinorefs.ru</p>
                    <p className="text-sm text-gray-600">Время ответа: до 5 рабочих дней</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Почтовый адрес:</strong> [Адрес организации]<br/>
                    <strong>ОГРН/ОГРНИП:</strong> [Номер]<br/>
                    <strong>ИНН:</strong> [Номер]
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                12. Заключительные положения
              </h2>
              <p className="text-gray-700 mb-4">
                Настоящее Соглашение может быть изменено Администрацией в одностороннем 
                порядке. О существенных изменениях мы уведомим по электронной почте 
                не менее чем за 30 дней до вступления в силу.
              </p>
              <p className="text-gray-700">
                Если какое-либо положение Соглашения будет признано недействительным, 
                остальные положения сохраняют свою силу. Актуальная версия всегда 
                доступна по адресу: dinorefs.ru/terms
              </p>
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

export default TermsOfService;

