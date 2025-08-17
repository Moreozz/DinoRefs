from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.database import db
from src.models.like import Like
from src.models.project import Project
from src.models.reference import Reference
from src.models.user import User
from src.services.notification_service import NotificationService

likes_bp = Blueprint('likes', __name__)

@likes_bp.route('/api/projects/<int:project_id>/like', methods=['POST'])
@jwt_required()
def toggle_project_like(project_id):
    """Переключение лайка проекта"""
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    is_like = data.get('is_like', True)  # True = лайк, False = дизлайк
    
    project = Project.query.get_or_404(project_id)
    
    # Проверяем существующий лайк
    existing_like = Like.query.filter_by(
        user_id=current_user_id,
        project_id=project_id
    ).first()
    
    try:
        if existing_like:
            if existing_like.is_like == is_like:
                # Убираем лайк/дизлайк
                db.session.delete(existing_like)
                action = 'removed'
            else:
                # Меняем лайк на дизлайк или наоборот
                existing_like.is_like = is_like
                action = 'changed'
        else:
            # Создаем новый лайк/дизлайк
            new_like = Like(
                user_id=current_user_id,
                project_id=project_id,
                is_like=is_like
            )
            db.session.add(new_like)
            action = 'added'
        
        db.session.commit()
        
        # Отправляем уведомление владельцу проекта о лайке (только при добавлении лайка)
        if action == 'added' and is_like and project.user_id != current_user_id:
            liker = User.query.get(current_user_id)
            
            NotificationService.send_notification(
                user_id=project.user_id,
                type='project_liked',
                title=f'Новый лайк проекта "{project.title}"',
                message=f'{liker.first_name} {liker.last_name} поставил лайк вашему проекту "{project.title}"',
                data={
                    'project_id': project_id,
                    'project_title': project.title,
                    'liker_name': f'{liker.first_name} {liker.last_name}',
                    'liker_id': current_user_id
                }
            )
        
        # Получаем обновленную статистику
        stats = Like.get_stats(project_id=project_id)
        
        return jsonify({
            'message': f'Лайк {action}',
            'action': action,
            'stats': stats
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка обработки лайка: {str(e)}'}), 500

@likes_bp.route('/api/references/<int:reference_id>/like', methods=['POST'])
@jwt_required()
def toggle_reference_like(reference_id):
    """Переключение лайка референса"""
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    is_like = data.get('is_like', True)  # True = лайк, False = дизлайк
    
    reference = Reference.query.get_or_404(reference_id)
    
    # Проверяем существующий лайк
    existing_like = Like.query.filter_by(
        user_id=current_user_id,
        reference_id=reference_id
    ).first()
    
    try:
        if existing_like:
            if existing_like.is_like == is_like:
                # Убираем лайк/дизлайк
                db.session.delete(existing_like)
                action = 'removed'
            else:
                # Меняем лайк на дизлайк или наоборот
                existing_like.is_like = is_like
                action = 'changed'
        else:
            # Создаем новый лайк/дизлайк
            new_like = Like(
                user_id=current_user_id,
                reference_id=reference_id,
                is_like=is_like
            )
            db.session.add(new_like)
            action = 'added'
        
        db.session.commit()
        
        # Получаем обновленную статистику
        stats = Like.get_stats(reference_id=reference_id)
        
        return jsonify({
            'message': f'Лайк {action}',
            'action': action,
            'stats': stats
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка обработки лайка: {str(e)}'}), 500

@likes_bp.route('/api/likes/stats', methods=['GET'])
def get_likes_stats():
    """Получение статистики лайков для объекта"""
    project_id = request.args.get('project_id', type=int)
    reference_id = request.args.get('reference_id', type=int)
    comment_id = request.args.get('comment_id', type=int)
    
    if not any([project_id, reference_id, comment_id]):
        return jsonify({'error': 'Требуется project_id, reference_id или comment_id'}), 400
    
    stats = Like.get_stats(
        project_id=project_id,
        reference_id=reference_id,
        comment_id=comment_id
    )
    
    return jsonify(stats)

@likes_bp.route('/api/likes/user', methods=['GET'])
@jwt_required()
def get_user_likes():
    """Получение лайков пользователя"""
    current_user_id = get_jwt_identity()
    project_id = request.args.get('project_id', type=int)
    reference_id = request.args.get('reference_id', type=int)
    comment_id = request.args.get('comment_id', type=int)
    
    query = Like.query.filter_by(user_id=current_user_id)
    
    if project_id:
        query = query.filter_by(project_id=project_id)
    elif reference_id:
        query = query.filter_by(reference_id=reference_id)
    elif comment_id:
        query = query.filter_by(comment_id=comment_id)
    else:
        # Возвращаем все лайки пользователя
        likes = query.all()
        return jsonify({
            'likes': [like.to_dict() for like in likes]
        })
    
    like = query.first()
    
    return jsonify({
        'has_like': like is not None,
        'is_like': like.is_like if like else None,
        'like': like.to_dict() if like else None
    })

