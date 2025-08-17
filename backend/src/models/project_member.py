from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

# Импортируем db из models/__init__.py
from . import db

class ProjectMember(db.Model):
    __tablename__ = 'project_members'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='viewer')  # owner, editor, viewer
    invited_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    invited_at = db.Column(db.DateTime, default=datetime.utcnow)
    joined_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, declined
    
    # Отношения
    project = db.relationship('Project', backref='members')
    user = db.relationship('User', foreign_keys=[user_id], backref='project_memberships')
    inviter = db.relationship('User', foreign_keys=[invited_by])
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'user_id': self.user_id,
            'role': self.role,
            'status': self.status,
            'invited_at': self.invited_at.isoformat() if self.invited_at else None,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
            'user': {
                'id': self.user.id,
                'first_name': self.user.first_name,
                'last_name': self.user.last_name,
                'email': self.user.email
            } if self.user else None,
            'inviter': {
                'id': self.inviter.id,
                'first_name': self.inviter.first_name,
                'last_name': self.inviter.last_name
            } if self.inviter else None
        }
    
    @staticmethod
    def get_user_role_in_project(user_id, project_id):
        """Получить роль пользователя в проекте"""
        member = ProjectMember.query.filter_by(
            user_id=user_id, 
            project_id=project_id,
            status='accepted'
        ).first()
        
        if member:
            return member.role
            
        # Проверяем, является ли пользователь владельцем проекта
        from src.models.project import Project
        project = Project.query.get(project_id)
        if project and project.user_id == user_id:
            return 'owner'
            
        return None
    
    @staticmethod
    def user_can_access_project(user_id, project_id):
        """Проверить, может ли пользователь получить доступ к проекту"""
        role = ProjectMember.get_user_role_in_project(user_id, project_id)
        return role is not None
    
    @staticmethod
    def user_can_edit_project(user_id, project_id):
        """Проверить, может ли пользователь редактировать проект"""
        role = ProjectMember.get_user_role_in_project(user_id, project_id)
        return role in ['owner', 'editor']
    
    @staticmethod
    def user_can_manage_members(user_id, project_id):
        """Проверить, может ли пользователь управлять участниками"""
        role = ProjectMember.get_user_role_in_project(user_id, project_id)
        return role == 'owner'

