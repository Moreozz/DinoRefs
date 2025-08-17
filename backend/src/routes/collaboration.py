from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models import db
from src.models.user import User
from src.models.project import Project
from src.models.project_member import ProjectMember
from src.services.notification_service import NotificationService
from datetime import datetime

collaboration_bp = Blueprint('collaboration', __name__)

@collaboration_bp.route('/projects/<int:project_id>/members', methods=['GET'])
@jwt_required()
def get_project_members(project_id):
    """Получить список участников проекта"""
    current_user_id = get_jwt_identity()
    
    # Проверяем доступ к проекту
    if not ProjectMember.user_can_access_project(current_user_id, project_id):
        return jsonify({'error': 'Доступ запрещен'}), 403
    
    # Получаем участников
    members = ProjectMember.query.filter_by(
        project_id=project_id,
        status='accepted'
    ).all()
    
    # Добавляем владельца проекта
    project = Project.query.get_or_404(project_id)
    owner_member = {
        'id': None,
        'project_id': project_id,
        'user_id': project.user_id,
        'role': 'owner',
        'status': 'accepted',
        'invited_at': project.created_at.isoformat(),
        'joined_at': project.created_at.isoformat(),
        'user': {
            'id': project.user.id,
            'first_name': project.user.first_name,
            'last_name': project.user.last_name,
            'email': project.user.email
        }
    }
    
    members_data = [member.to_dict() for member in members]
    members_data.insert(0, owner_member)  # Владелец всегда первый
    
    return jsonify({
        'members': members_data,
        'total': len(members_data)
    })

@collaboration_bp.route('/projects/<int:project_id>/invite', methods=['POST'])
@jwt_required()
def invite_user_to_project(project_id):
    """Пригласить пользователя в проект"""
    current_user_id = get_jwt_identity()
    
    # Проверяем права на управление участниками
    if not ProjectMember.user_can_manage_members(current_user_id, project_id):
        return jsonify({'error': 'Недостаточно прав для приглашения пользователей'}), 403
    
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    role = data.get('role', 'viewer')
    
    if not email:
        return jsonify({'error': 'Email обязателен'}), 400
    
    if role not in ['viewer', 'editor']:
        return jsonify({'error': 'Недопустимая роль'}), 400
    
    # Ищем пользователя по email
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Пользователь с таким email не найден'}), 404
    
    # Проверяем, не является ли пользователь владельцем
    project = Project.query.get_or_404(project_id)
    if user.id == project.user_id:
        return jsonify({'error': 'Нельзя пригласить владельца проекта'}), 400
    
    # Проверяем, не приглашен ли уже
    existing_member = ProjectMember.query.filter_by(
        project_id=project_id,
        user_id=user.id
    ).first()
    
    if existing_member:
        if existing_member.status == 'accepted':
            return jsonify({'error': 'Пользователь уже участвует в проекте'}), 400
        elif existing_member.status == 'pending':
            return jsonify({'error': 'Приглашение уже отправлено'}), 400
        else:
            # Повторное приглашение после отклонения
            existing_member.status = 'pending'
            existing_member.role = role
            existing_member.invited_by = current_user_id
            existing_member.invited_at = datetime.utcnow()
    else:
        # Создаем новое приглашение
        member = ProjectMember(
            project_id=project_id,
            user_id=user.id,
            role=role,
            invited_by=current_user_id,
            status='pending'
        )
        db.session.add(member)
    
    try:
        db.session.commit()
        
        # Отправляем уведомление о приглашении
        project = Project.query.get(project_id)
        inviter = User.query.get(current_user_id)
        
        NotificationService.send_notification(
            user_id=user.id,
            type='project_invitation',
            title=f'Приглашение в проект "{project.title}"',
            message=f'{inviter.first_name} {inviter.last_name} пригласил вас присоединиться к проекту "{project.title}" в роли {role}',
            data={
                'project_id': project_id,
                'project_title': project.title,
                'inviter_name': f'{inviter.first_name} {inviter.last_name}',
                'role': role
            }
        )
        
        return jsonify({
            'message': 'Приглашение отправлено',
            'user': {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email
            },
            'role': role
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка отправки приглашения'}), 500

@collaboration_bp.route('/projects/<int:project_id>/members/<int:member_id>', methods=['PUT'])
@jwt_required()
def update_member_role(project_id, member_id):
    """Изменить роль участника проекта"""
    current_user_id = get_jwt_identity()
    
    # Проверяем права на управление участниками
    if not ProjectMember.user_can_manage_members(current_user_id, project_id):
        return jsonify({'error': 'Недостаточно прав'}), 403
    
    data = request.get_json()
    new_role = data.get('role')
    
    if new_role not in ['viewer', 'editor']:
        return jsonify({'error': 'Недопустимая роль'}), 400
    
    member = ProjectMember.query.filter_by(
        id=member_id,
        project_id=project_id
    ).first_or_404()
    
    member.role = new_role
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Роль участника обновлена',
            'member': member.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка обновления роли'}), 500

@collaboration_bp.route('/projects/<int:project_id>/members/<int:member_id>', methods=['DELETE'])
@jwt_required()
def remove_member_from_project(project_id, member_id):
    """Удалить участника из проекта"""
    current_user_id = get_jwt_identity()
    
    # Проверяем права на управление участниками
    if not ProjectMember.user_can_manage_members(current_user_id, project_id):
        return jsonify({'error': 'Недостаточно прав'}), 403
    
    member = ProjectMember.query.filter_by(
        id=member_id,
        project_id=project_id
    ).first_or_404()
    
    try:
        db.session.delete(member)
        db.session.commit()
        return jsonify({'message': 'Участник удален из проекта'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка удаления участника'}), 500

@collaboration_bp.route('/invitations', methods=['GET'])
@jwt_required()
def get_user_invitations():
    """Получить приглашения пользователя"""
    current_user_id = get_jwt_identity()
    
    invitations = ProjectMember.query.filter_by(
        user_id=current_user_id,
        status='pending'
    ).all()
    
    invitations_data = []
    for invitation in invitations:
        invitation_dict = invitation.to_dict()
        invitation_dict['project'] = {
            'id': invitation.project.id,
            'title': invitation.project.title,
            'description': invitation.project.description
        }
        invitations_data.append(invitation_dict)
    
    return jsonify({
        'invitations': invitations_data,
        'total': len(invitations_data)
    })

@collaboration_bp.route('/invitations/<int:invitation_id>/accept', methods=['POST'])
@jwt_required()
def accept_invitation(invitation_id):
    """Принять приглашение в проект"""
    current_user_id = get_jwt_identity()
    
    invitation = ProjectMember.query.filter_by(
        id=invitation_id,
        user_id=current_user_id,
        status='pending'
    ).first_or_404()
    
    invitation.status = 'accepted'
    invitation.joined_at = datetime.utcnow()
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Приглашение принято',
            'project': {
                'id': invitation.project.id,
                'title': invitation.project.title
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка принятия приглашения'}), 500

@collaboration_bp.route('/invitations/<int:invitation_id>/decline', methods=['POST'])
@jwt_required()
def decline_invitation(invitation_id):
    """Отклонить приглашение в проект"""
    current_user_id = get_jwt_identity()
    
    invitation = ProjectMember.query.filter_by(
        id=invitation_id,
        user_id=current_user_id,
        status='pending'
    ).first_or_404()
    
    invitation.status = 'declined'
    
    try:
        db.session.commit()
        return jsonify({'message': 'Приглашение отклонено'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Ошибка отклонения приглашения'}), 500

