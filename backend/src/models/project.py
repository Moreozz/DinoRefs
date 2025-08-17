from src.database import db
from datetime import datetime
import secrets
import string

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_public = db.Column(db.Boolean, default=False)
    
    # Публичные ссылки и статистика
    public_slug = db.Column(db.String(50), unique=True, nullable=True)
    short_code = db.Column(db.String(20), unique=True, nullable=True)
    view_count = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    references = db.relationship('Reference', backref='project', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Project {self.title}>'

    def generate_public_slug(self):
        """Генерирует уникальный slug для публичного доступа"""
        if not self.public_slug:
            # Создаем slug из названия проекта
            base_slug = ''.join(c.lower() if c.isalnum() else '-' for c in self.title)
            base_slug = base_slug.strip('-')[:30]
            
            # Проверяем уникальность
            counter = 1
            slug = base_slug
            while Project.query.filter_by(public_slug=slug).first():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.public_slug = slug

    def generate_short_code(self):
        """Генерирует короткий код для ссылки"""
        if not self.short_code:
            while True:
                code = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
                if not Project.query.filter_by(short_code=code).first():
                    self.short_code = code
                    break

    def get_public_url(self, base_url=""):
        """Возвращает публичную ссылку на проект"""
        if self.is_public and self.public_slug:
            return f"{base_url}/public/{self.public_slug}"
        return None

    def get_short_url(self, base_url=""):
        """Возвращает короткую ссылку на проект"""
        if self.is_public and self.short_code:
            return f"{base_url}/s/{self.short_code}"
        return None

    def increment_view_count(self):
        """Увеличивает счетчик просмотров"""
        self.view_count += 1
        db.session.commit()

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'user_id': self.user_id,
            'is_public': self.is_public,
            'public_slug': self.public_slug,
            'short_code': self.short_code,
            'view_count': self.view_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'references_count': len(self.references) if self.references else 0
        }

    def to_dict_with_references(self):
        """Включает список референсов"""
        data = self.to_dict()
        data['references'] = [ref.to_dict() for ref in self.references] if self.references else []
        return data

    def to_public_dict(self):
        """Публичная версия данных (без приватной информации)"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'public_slug': self.public_slug,
            'view_count': self.view_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'references_count': len(self.references) if self.references else 0
        }

