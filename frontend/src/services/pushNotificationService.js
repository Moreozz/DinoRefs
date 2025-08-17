// Сервис для работы с push-уведомлениями в браузере

class PushNotificationService {
  constructor() {
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    this.registration = null;
  }

  // Проверить поддержку push-уведомлений
  isNotificationSupported() {
    return this.isSupported;
  }

  // Получить текущий статус разрешений
  getPermissionStatus() {
    return this.permission;
  }

  // Запросить разрешение на уведомления
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Push-уведомления не поддерживаются в этом браузере');
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    if (this.permission === 'denied') {
      throw new Error('Разрешение на уведомления было отклонено');
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        console.log('Разрешение на push-уведомления получено');
        return permission;
      } else {
        throw new Error('Пользователь отклонил разрешение на уведомления');
      }
    } catch (error) {
      console.error('Ошибка запроса разрешения:', error);
      throw error;
    }
  }

  // Показать простое уведомление
  showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('Нет разрешения на показ уведомлений');
      return null;
    }

    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'dinorefs-notification',
      requireInteraction: false,
      silent: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Автоматическое закрытие через 5 секунд (если не указано иное)
      if (!defaultOptions.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, defaultOptions.duration || 5000);
      }

      return notification;
    } catch (error) {
      console.error('Ошибка показа уведомления:', error);
      return null;
    }
  }

  // Показать уведомление с действиями (требует Service Worker)
  async showAdvancedNotification(title, options = {}) {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    if (!this.registration) {
      // Fallback к простому уведомлению
      return this.showNotification(title, options);
    }

    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'dinorefs-notification',
      requireInteraction: false,
      silent: false,
      data: {},
      ...options
    };

    try {
      await this.registration.showNotification(title, defaultOptions);
      return true;
    } catch (error) {
      console.error('Ошибка показа расширенного уведомления:', error);
      // Fallback к простому уведомлению
      return this.showNotification(title, options);
    }
  }

  // Регистрация Service Worker для расширенных уведомлений
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker не поддерживается');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.registration = registration;
      console.log('Service Worker зарегистрирован:', registration);
      return registration;
    } catch (error) {
      console.error('Ошибка регистрации Service Worker:', error);
      return null;
    }
  }

  // Показать уведомление о новом сообщении
  showMessageNotification(senderName, message, projectName = null) {
    const title = projectName 
      ? `${senderName} в проекте ${projectName}`
      : `Сообщение от ${senderName}`;
    
    return this.showNotification(title, {
      body: message,
      icon: '/icons/message.png',
      tag: 'message-notification',
      data: {
        type: 'message',
        sender: senderName,
        project: projectName
      }
    });
  }

  // Показать уведомление о приглашении в проект
  showProjectInvitationNotification(inviterName, projectName, invitationUrl) {
    const title = 'Приглашение в проект';
    const body = `${inviterName} пригласил вас в проект "${projectName}"`;
    
    return this.showAdvancedNotification(title, {
      body,
      icon: '/icons/invitation.png',
      tag: 'project-invitation',
      requireInteraction: true,
      actions: [
        {
          action: 'accept',
          title: 'Принять',
          icon: '/icons/accept.png'
        },
        {
          action: 'view',
          title: 'Посмотреть',
          icon: '/icons/view.png'
        }
      ],
      data: {
        type: 'project_invitation',
        inviter: inviterName,
        project: projectName,
        url: invitationUrl
      }
    });
  }

  // Показать уведомление о лайке
  showLikeNotification(likerName, projectName, projectUrl) {
    const title = 'Новый лайк!';
    const body = `${likerName} поставил лайк вашему проекту "${projectName}"`;
    
    return this.showNotification(title, {
      body,
      icon: '/icons/like.png',
      tag: 'like-notification',
      data: {
        type: 'project_liked',
        liker: likerName,
        project: projectName,
        url: projectUrl
      }
    });
  }

  // Показать уведомление о комментарии
  showCommentNotification(commenterName, projectName, comment, projectUrl) {
    const title = 'Новый комментарий';
    const body = `${commenterName} прокомментировал "${projectName}": ${comment}`;
    
    return this.showAdvancedNotification(title, {
      body,
      icon: '/icons/comment.png',
      tag: 'comment-notification',
      actions: [
        {
          action: 'reply',
          title: 'Ответить',
          icon: '/icons/reply.png'
        },
        {
          action: 'view',
          title: 'Посмотреть',
          icon: '/icons/view.png'
        }
      ],
      data: {
        type: 'project_commented',
        commenter: commenterName,
        project: projectName,
        comment,
        url: projectUrl
      }
    });
  }

  // Показать уведомление о награде за реферала
  showReferralRewardNotification(rewardAmount, rewardType, campaignName) {
    const title = 'Награда получена! 🎉';
    const body = `Вы получили ${rewardAmount} ${rewardType} за реферала в кампании "${campaignName}"`;
    
    return this.showNotification(title, {
      body,
      icon: '/icons/reward.png',
      tag: 'referral-reward',
      requireInteraction: true,
      data: {
        type: 'referral_reward',
        amount: rewardAmount,
        rewardType,
        campaign: campaignName
      }
    });
  }

  // Показать системное уведомление
  showSystemNotification(title, message, actionUrl = null) {
    return this.showAdvancedNotification(title, {
      body: message,
      icon: '/icons/system.png',
      tag: 'system-notification',
      requireInteraction: !!actionUrl,
      actions: actionUrl ? [
        {
          action: 'view',
          title: 'Подробнее',
          icon: '/icons/view.png'
        }
      ] : [],
      data: {
        type: 'system_announcement',
        url: actionUrl
      }
    });
  }

  // Показать уведомление о безопасности
  showSecurityNotification(event, details, actionRequired = false) {
    const title = 'Уведомление о безопасности';
    const body = `${event}: ${details}`;
    
    return this.showAdvancedNotification(title, {
      body,
      icon: '/icons/security.png',
      tag: 'security-notification',
      requireInteraction: actionRequired,
      actions: actionRequired ? [
        {
          action: 'check',
          title: 'Проверить',
          icon: '/icons/security.png'
        }
      ] : [],
      data: {
        type: 'account_security',
        event,
        details,
        actionRequired
      }
    });
  }

  // Обработка кликов по уведомлениям
  handleNotificationClick(event) {
    const notification = event.notification;
    const data = notification.data || {};
    
    notification.close();

    // Определяем действие на основе типа уведомления
    switch (data.type) {
      case 'project_invitation':
        if (event.action === 'accept' && data.url) {
          window.open(data.url, '_blank');
        } else if (event.action === 'view' && data.url) {
          window.open(data.url, '_blank');
        }
        break;
        
      case 'project_commented':
        if (event.action === 'reply' && data.url) {
          window.open(data.url + '#comments', '_blank');
        } else if (event.action === 'view' && data.url) {
          window.open(data.url, '_blank');
        }
        break;
        
      case 'project_liked':
        if (data.url) {
          window.open(data.url, '_blank');
        }
        break;
        
      case 'referral_reward':
        window.open('/referrals', '_blank');
        break;
        
      case 'system_announcement':
        if (data.url) {
          window.open(data.url, '_blank');
        }
        break;
        
      case 'account_security':
        if (event.action === 'check') {
          window.open('/profile/security', '_blank');
        }
        break;
        
      default:
        // Общий обработчик - открываем главную страницу
        window.open('/', '_blank');
    }
  }

  // Очистить все уведомления
  async clearAllNotifications() {
    if (this.registration) {
      const notifications = await this.registration.getNotifications();
      notifications.forEach(notification => notification.close());
    }
  }

  // Получить активные уведомления
  async getActiveNotifications() {
    if (this.registration) {
      return await this.registration.getNotifications();
    }
    return [];
  }

  // Проверить, есть ли активные уведомления с определенным тегом
  async hasActiveNotification(tag) {
    const notifications = await this.getActiveNotifications();
    return notifications.some(notification => notification.tag === tag);
  }
}

// Создаем глобальный экземпляр сервиса
const pushNotificationService = new PushNotificationService();

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Регистрируем Service Worker
    await pushNotificationService.registerServiceWorker();
    
    // Устанавливаем обработчики событий Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'notification-click') {
          pushNotificationService.handleNotificationClick(event.data);
        }
      });
    }
  } catch (error) {
    console.error('Ошибка инициализации push-уведомлений:', error);
  }
});

export default pushNotificationService;

