from datetime import datetime
from src.database import db

class Comment(db.Model):
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Связи
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=True)
    reference_id = db.Column(db.Integer, db.ForeignKey('references.id'), nullable=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=True)  # Для вложенных комментариев
    
    # Статистика
    likes_count = db.Column(db.Integer, default=0)
    is_moderated = db.Column(db.Boolean, default=True)
    is_deleted = db.Column(db.Boolean, default=False)
    
    # Отношения
    user = db.relationship('User', backref='comments')
    project = db.relationship('Project', backref='comments')
    reference = db.relationship('Reference', backref='comments')
    parent = db.relationship('Comment', remote_side=[id], backref='replies')
    
    def to_dict(self, include_replies=True):
        """Преобразование в словарь для JSON"""
        result = {
            'id': self.id,
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else 'Неизвестный пользователь',
            'project_id': self.project_id,
            'reference_id': self.reference_id,
            'parent_id': self.parent_id,
            'likes_count': self.likes_count,
            'is_moderated': self.is_moderated,
            'is_deleted': self.is_deleted
        }
        
        if include_replies and self.replies:
            result['replies'] = [reply.to_dict(include_replies=False) for reply in self.replies if not reply.is_deleted]
        
        return result
    
    def can_edit(self, user_id):
        """Проверка прав на редактирование"""
        return self.user_id == user_id
    
    def can_delete(self, user_id, is_admin=False):
        """Проверка прав на удаление"""
        return self.user_id == user_id or is_admin

