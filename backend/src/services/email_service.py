import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
from jinja2 import Environment, FileSystemLoader
from datetime import datetime
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailService:
    """Сервис для отправки email уведомлений"""
    
    def __init__(self):
        # Настройки SMTP (можно вынести в переменные окружения)
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', 'noreply@dinorefs.com')
        self.smtp_password = os.getenv('SMTP_PASSWORD', 'your-app-password')
        self.from_email = os.getenv('FROM_EMAIL', 'DinoRefs <noreply@dinorefs.com>')
        
        # Настройка шаблонизатора Jinja2
        template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates', 'email')
        self.jinja_env = Environment(loader=FileSystemLoader(template_dir))
        
    def send_email(self, to_email, subject, html_content, text_content=None):
        """Отправить email"""
        try:
            # Создаем сообщение
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = self.from_email
            message["To"] = to_email
            
            # Добавляем текстовую версию
            if text_content:
                text_part = MIMEText(text_content, "plain", "utf-8")
                message.attach(text_part)
            
            # Добавляем HTML версию
            html_part = MIMEText(html_content, "html", "utf-8")
            message.attach(html_part)
            
            # Создаем SSL контекст
            context = ssl.create_default_context()
            
            # Отправляем email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.smtp_username, self.smtp_password)
                server.sendmail(self.from_email, to_email, message.as_string())
            
            logger.info(f"Email успешно отправлен на {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка отправки email на {to_email}: {str(e)}")
            return False
    
    def render_template(self, template_name, **kwargs):
        """Рендерить шаблон email"""
        try:
            template = self.jinja_env.get_template(template_name)
            return template.render(**kwargs)
        except Exception as e:
            logger.error(f"Ошибка рендеринга шаблона {template_name}: {str(e)}")
            return None
    
    def send_project_invitation_email(self, to_email, user_name, project_name, inviter_name, invitation_link):
        """Отправить email о приглашении в проект"""
        try:
            subject = f"Приглашение в проект {project_name} на DinoRefs"
            
            html_content = self.render_template('project_invitation.html', 
                user_name=user_name,
                project_name=project_name,
                inviter_name=inviter_name,
                invitation_link=invitation_link,
                current_year=datetime.now().year
            )
            
            text_content = f"""
Привет, {user_name}!

{inviter_name} пригласил вас присоединиться к проекту "{project_name}" на платформе DinoRefs.

Чтобы принять приглашение, перейдите по ссылке:
{invitation_link}

С уважением,
Команда DinoRefs
            """.strip()
            
            return self.send_email(to_email, subject, html_content, text_content)
            
        except Exception as e:
            logger.error(f"Ошибка отправки приглашения в проект: {str(e)}")
            return False
    
    def send_project_shared_email(self, to_email, user_name, project_name, sharer_name, project_link):
        """Отправить email о том, что проект поделился"""
        try:
            subject = f"С вами поделились проектом {project_name}"
            
            html_content = self.render_template('project_shared.html',
                user_name=user_name,
                project_name=project_name,
                sharer_name=sharer_name,
                project_link=project_link,
                current_year=datetime.now().year
            )
            
            text_content = f"""
Привет, {user_name}!

{sharer_name} поделился с вами проектом "{project_name}" на DinoRefs.

Посмотреть проект:
{project_link}

С уважением,
Команда DinoRefs
            """.strip()
            
            return self.send_email(to_email, subject, html_content, text_content)
            
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления о поделенном проекте: {str(e)}")
            return False
    
    def send_project_liked_email(self, to_email, user_name, project_name, liker_name, project_link):
        """Отправить email о лайке проекта"""
        try:
            subject = f"Ваш проект {project_name} понравился!"
            
            html_content = self.render_template('project_liked.html',
                user_name=user_name,
                project_name=project_name,
                liker_name=liker_name,
                project_link=project_link,
                current_year=datetime.now().year
            )
            
            text_content = f"""
Привет, {user_name}!

{liker_name} поставил лайк вашему проекту "{project_name}" на DinoRefs.

Посмотреть проект:
{project_link}

С уважением,
Команда DinoRefs
            """.strip()
            
            return self.send_email(to_email, subject, html_content, text_content)
            
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления о лайке: {str(e)}")
            return False
    
    def send_project_commented_email(self, to_email, user_name, project_name, commenter_name, comment_text, project_link):
        """Отправить email о комментарии к проекту"""
        try:
            subject = f"Новый комментарий к проекту {project_name}"
            
            html_content = self.render_template('project_commented.html',
                user_name=user_name,
                project_name=project_name,
                commenter_name=commenter_name,
                comment_text=comment_text,
                project_link=project_link,
                current_year=datetime.now().year
            )
            
            text_content = f"""
Привет, {user_name}!

{commenter_name} оставил комментарий к вашему проекту "{project_name}":

"{comment_text}"

Посмотреть проект:
{project_link}

С уважением,
Команда DinoRefs
            """.strip()
            
            return self.send_email(to_email, subject, html_content, text_content)
            
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления о комментарии: {str(e)}")
            return False
    
    def send_referral_reward_email(self, to_email, user_name, reward_amount, reward_type, campaign_name):
        """Отправить email о получении награды за реферала"""
        try:
            subject = f"Вы получили награду за реферала!"
            
            html_content = self.render_template('referral_reward.html',
                user_name=user_name,
                reward_amount=reward_amount,
                reward_type=reward_type,
                campaign_name=campaign_name,
                current_year=datetime.now().year
            )
            
            text_content = f"""
Привет, {user_name}!

Поздравляем! Вы получили награду за успешное привлечение реферала в кампании "{campaign_name}".

Награда: {reward_amount} {reward_type}

С уважением,
Команда DinoRefs
            """.strip()
            
            return self.send_email(to_email, subject, html_content, text_content)
            
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления о награде: {str(e)}")
            return False
    
    def send_system_announcement_email(self, to_email, user_name, announcement_title, announcement_text, action_link=None):
        """Отправить системное объявление"""
        try:
            subject = f"DinoRefs: {announcement_title}"
            
            html_content = self.render_template('system_announcement.html',
                user_name=user_name,
                announcement_title=announcement_title,
                announcement_text=announcement_text,
                action_link=action_link,
                current_year=datetime.now().year
            )
            
            text_content = f"""
Привет, {user_name}!

{announcement_title}

{announcement_text}

{f'Подробнее: {action_link}' if action_link else ''}

С уважением,
Команда DinoRefs
            """.strip()
            
            return self.send_email(to_email, subject, html_content, text_content)
            
        except Exception as e:
            logger.error(f"Ошибка отправки системного объявления: {str(e)}")
            return False
    
    def send_account_security_email(self, to_email, user_name, security_event, event_details, action_required=False):
        """Отправить уведомление о безопасности аккаунта"""
        try:
            subject = f"DinoRefs: Уведомление о безопасности аккаунта"
            
            html_content = self.render_template('account_security.html',
                user_name=user_name,
                security_event=security_event,
                event_details=event_details,
                action_required=action_required,
                current_year=datetime.now().year
            )
            
            text_content = f"""
Привет, {user_name}!

Уведомление о безопасности аккаунта: {security_event}

Детали: {event_details}

{f'Требуется действие с вашей стороны.' if action_required else 'Никаких действий не требуется.'}

С уважением,
Команда DinoRefs
            """.strip()
            
            return self.send_email(to_email, subject, html_content, text_content)
            
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления о безопасности: {str(e)}")
            return False

# Глобальный экземпляр сервиса
email_service = EmailService()

