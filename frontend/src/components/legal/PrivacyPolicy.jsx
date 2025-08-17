import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Политика конфиденциальности
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
                Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок обработки 
                персональных данных пользователей сервиса DinoRefs (далее — «Сервис») в соответствии с 
                требованиями Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных» и иного 
                применимого законодательства Российской Федерации.
              </p>
              <p className="text-gray-700 mb-4">
                Оператором персональных данных является ИП/ООО [Наименование] (далее — «Оператор»), 
                осуществляющий деятельность по адресу: [Адрес], контактный email: support@dinorefs.ru.
              </p>
              <p className="text-gray-700">
                Использование Сервиса означает безоговорочное согласие пользователя с настоящей Политикой 
                и указанными в ней условиями обработки его персональных данных.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                2. Персональные данные, которые мы собираем
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-medium text-blue-800 mb-2">
                  При регистрации мы собираем:
                </h3>
                <ul className="list-disc list-inside text-blue-700 space-y-1">
                  <li>Адрес электронной почты</li>
                  <li>Пароль (в зашифрованном виде)</li>
                  <li>Имя пользователя (по желанию)</li>
                  <li>Дата и время регистрации</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-medium text-green-800 mb-2">
                  При использовании Сервиса мы собираем:
                </h3>
                <ul className="list-disc list-inside text-green-700 space-y-1">
                  <li>Информацию о проектах и референсах</li>
                  <li>Статистику использования функций</li>
                  <li>IP-адрес и данные об устройстве</li>
                  <li>Информацию о браузере и операционной системе</li>
                  <li>Cookies и аналогичные технологии</li>
                </ul>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">
                  При оплате услуг мы собираем:
                </h3>
                <ul className="list-disc list-inside text-yellow-700 space-y-1">
                  <li>Данные для выставления счетов</li>
                  <li>Информацию о платежах (без данных карт)</li>
                  <li>Реквизиты для возврата средств</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                3. Цели обработки персональных данных
              </h2>
              <p className="text-gray-700 mb-4">
                Мы обрабатываем ваши персональные данные исключительно для следующих целей:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">🔐 Авторизация и безопасность</h3>
                  <p className="text-sm text-gray-600">
                    Создание и управление учетной записью, обеспечение безопасности доступа
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">⚙️ Предоставление услуг</h3>
                  <p className="text-sm text-gray-600">
                    Функционирование Сервиса, сохранение проектов и настроек
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">💳 Обработка платежей</h3>
                  <p className="text-sm text-gray-600">
                    Выставление счетов, обработка оплаты, возврат средств
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">📞 Техническая поддержка</h3>
                  <p className="text-sm text-gray-600">
                    Решение технических вопросов, консультации по использованию
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">📊 Аналитика и улучшения</h3>
                  <p className="text-sm text-gray-600">
                    Анализ использования для улучшения функциональности
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">📧 Уведомления</h3>
                  <p className="text-sm text-gray-600">
                    Важные уведомления о работе Сервиса и изменениях
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                4. Правовые основания обработки
              </h2>
              <p className="text-gray-700 mb-4">
                Обработка персональных данных осуществляется на следующих правовых основаниях:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Согласие субъекта персональных данных (ст. 6 Закона № 152-ФЗ)</li>
                <li>Исполнение договора, стороной которого является субъект персональных данных</li>
                <li>Осуществление прав и законных интересов Оператора</li>
                <li>Исполнение обязанностей, возложенных на Оператора законодательством РФ</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                5. Хранение и защита персональных данных
              </h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-medium text-red-800 mb-2">
                  🇷🇺 Соответствие требованиям 152-ФЗ
                </h3>
                <p className="text-red-700">
                  Все персональные данные российских граждан обрабатываются и хранятся 
                  исключительно на территории Российской Федерации в соответствии с 
                  требованиями законодательства.
                </p>
              </div>
              <p className="text-gray-700 mb-4">
                Мы применяем следующие меры защиты персональных данных:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">🔐 Технические меры</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• SSL/TLS шифрование</li>
                    <li>• Хеширование паролей</li>
                    <li>• Регулярные обновления безопасности</li>
                    <li>• Мониторинг доступа</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">👥 Организационные меры</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Ограничение доступа сотрудников</li>
                    <li>• Обучение персонала</li>
                    <li>• Аудит безопасности</li>
                    <li>• Резервное копирование</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                6. Ваши права
              </h2>
              <p className="text-gray-700 mb-4">
                В соответствии с законодательством РФ вы имеете следующие права:
              </p>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-800">Право на информацию</h4>
                  <p className="text-sm text-gray-600">
                    Получение информации о обработке ваших персональных данных
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium text-gray-800">Право на доступ</h4>
                  <p className="text-sm text-gray-600">
                    Доступ к вашим персональным данным и их копиям
                  </p>
                </div>
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-medium text-gray-800">Право на исправление</h4>
                  <p className="text-sm text-gray-600">
                    Исправление неточных или неполных данных
                  </p>
                </div>
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-medium text-gray-800">Право на удаление</h4>
                  <p className="text-sm text-gray-600">
                    Удаление персональных данных при определенных условиях
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-medium text-gray-800">Право на отзыв согласия</h4>
                  <p className="text-sm text-gray-600">
                    Отзыв согласия на обработку персональных данных
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                7. Cookies и аналогичные технологии
              </h2>
              <p className="text-gray-700 mb-4">
                Мы используем cookies для улучшения работы Сервиса:
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Тип cookies</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Назначение</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Срок хранения</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-700">Необходимые</td>
                      <td className="px-4 py-2 text-sm text-gray-600">Авторизация, безопасность</td>
                      <td className="px-4 py-2 text-sm text-gray-600">До выхода из системы</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-700">Функциональные</td>
                      <td className="px-4 py-2 text-sm text-gray-600">Настройки интерфейса</td>
                      <td className="px-4 py-2 text-sm text-gray-600">30 дней</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-700">Аналитические</td>
                      <td className="px-4 py-2 text-sm text-gray-600">Статистика использования</td>
                      <td className="px-4 py-2 text-sm text-gray-600">90 дней</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                8. Передача данных третьим лицам
              </h2>
              <p className="text-gray-700 mb-4">
                Мы не продаем и не передаем ваши персональные данные третьим лицам, за исключением:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Платежных систем (ЮMoney, СБП) для обработки платежей</li>
                <li>Поставщиков технических услуг (хостинг, email-рассылки)</li>
                <li>Случаев, предусмотренных законодательством РФ</li>
                <li>Получения вашего явного согласия</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                9. Контактная информация
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-800 mb-4">
                  По вопросам обработки персональных данных обращайтесь:
                </h3>
                <div className="space-y-2 text-blue-700">
                  <p><strong>Email:</strong> privacy@dinorefs.ru</p>
                  <p><strong>Почтовый адрес:</strong> [Адрес оператора]</p>
                  <p><strong>Телефон:</strong> +7 (XXX) XXX-XX-XX</p>
                  <p><strong>Время работы:</strong> Пн-Пт 9:00-18:00 (МСК)</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                10. Изменения в Политике
              </h2>
              <p className="text-gray-700 mb-4">
                Мы оставляем за собой право вносить изменения в настоящую Политику. 
                О существенных изменениях мы уведомим вас по электронной почте или 
                через уведомления в Сервисе не менее чем за 30 дней до вступления 
                изменений в силу.
              </p>
              <p className="text-gray-700">
                Актуальная версия Политики всегда доступна по адресу: 
                <a href="/privacy" className="text-blue-600 hover:text-blue-800 ml-1">
                  dinorefs.ru/privacy
                </a>
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

export default PrivacyPolicy;

