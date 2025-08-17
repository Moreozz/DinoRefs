from datetime import datetime
from src.database import db

class Like(db.Model):
    __tablename__ = 'likes'
    
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Связи
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=True)
    reference_id = db.Column(db.Integer, db.ForeignKey('references.id'), nullable=True)
    comment_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=True)
    
    # Тип лайка (like/dislike)
    is_like = db.Column(db.Boolean, default=True)  # True = лайк, False = дизлайк
    
    # Отношения
    user = db.relationship('User', backref='likes')
    project = db.relationship('Project', backref='likes')
    reference = db.relationship('Reference', backref='likes')
    comment = db.relationship('Comment', backref='likes')
    
    # Уникальные ограничения - один пользователь может поставить только один лайк на объект
    __table_args__ = (
        db.UniqueConstraint('user_id', 'project_id', name='unique_user_project_like'),
        db.UniqueConstraint('user_id', 'reference_id', name='unique_user_reference_like'),
        db.UniqueConstraint('user_id', 'comment_id', name='unique_user_comment_like'),
    )
    
    def to_dict(self):
        """Преобразование в словарь для JSON"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else 'Неизвестный пользователь',
            'project_id': self.project_id,
            'reference_id': self.reference_id,
            'comment_id': self.comment_id,
            'is_like': self.is_like,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    @staticmethod
    def get_stats(project_id=None, reference_id=None, comment_id=None):
        """Получение статистики лайков для объекта"""
        query = Like.query
        
        if project_id:
            query = query.filter_by(project_id=project_id)
        elif reference_id:
            query = query.filter_by(reference_id=reference_id)
        elif comment_id:
            query = query.filter_by(comment_id=comment_id)
        else:
            return {'likes': 0, 'dislikes': 0, 'total': 0}
        
        likes = query.filter_by(is_like=True).count()
        dislikes = query.filter_by(is_like=False).count()
        
        return {
            'likes': likes,
            'dislikes': dislikes,
            'total': likes + dislikes
        }

