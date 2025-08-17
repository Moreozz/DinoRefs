from src.database import db
from datetime import datetime

class Reference(db.Model):
    __tablename__ = 'references'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    url = db.Column(db.String(500))
    description = db.Column(db.Text)
    tags = db.Column(db.String(500))  # Теги через запятую
    category = db.Column(db.String(100))
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f'<Reference {self.title}>'

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'url': self.url,
            'description': self.description,
            'tags': self.tags.split(',') if self.tags else [],
            'category': self.category,
            'project_id': self.project_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def set_tags(self, tags_list):
        """Устанавливает теги из списка"""
        if isinstance(tags_list, list):
            self.tags = ','.join(tags_list)
        else:
            self.tags = tags_list

    def get_tags(self):
        """Возвращает теги как список"""
        return self.tags.split(',') if self.tags else []

