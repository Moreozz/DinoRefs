from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.database import db
from src.models.comment import Comment
from src.models.like import Like
from src.models.user import User
from src.models.project import Project
from src.models.reference import Reference
from src.services.notification_service import NotificationService

comments_bp = Blueprint('comments', __name__)

@comments_bp.route('/api/comments', methods=['GET'])
def get_comments():
    """Получение комментариев для проекта или референса"""
    project_id = request.args.get('project_id', type=int)
    reference_id = request.args.get('reference_id', type=int)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    sort_by = request.args.get('sort_by', 'created_at')  # created_at, likes_count
    
    query = Comment.query.filter_by(is_deleted=False, is_moderated=True, parent_id=None)
    
    if project_id:
        query = query.filter_by(project_id=project_id)
    elif reference_id:
        query = query.filter_by(reference_id=reference_id)
    else:
        return jsonify({'error': 'Требуется project_id или reference_id'}), 400
    
    # Сортировка
    if sort_by == 'likes_count':
        query = query.order_by(Comment.likes_count.desc(), Comment.created_at.desc())
    else:
        query = query.order_by(Comment.created_at.desc())
    
    comments = query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'comments': [comment.to_dict() for comment in comments.items],
        'total': comments.total,
        'pages': comments.pages,
        'current_page': page,
        'has_next': comments.has_next,
        'has_prev': comments.has_prev
    })

@comments_bp.route('/api/comments', methods=['POST'])
@jwt_required()
def create_comment():
    """Создание нового комментария"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('content'):
        return jsonify({'error': 'Содержимое комментария обязательно'}), 400
    
    # Проверяем, что указан проект или референс
    project_id = data.get('project_id')
    reference_id = data.get('reference_id')
    parent_id = data.get('parent_id')
    
    if not project_id and not reference_id:
        return jsonify({'error': 'Требуется project_id или reference_id'}), 400
    
    # Проверяем существование объектов
    if project_id:
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Проект не найден'}), 404
    
    if reference_id:
        reference = Reference.query.get(reference_id)
        if not reference:
            return jsonify({'error': 'Референс не найден'}), 404
    
    if parent_id:
        parent_comment = Comment.query.get(parent_id)
        if not parent_comment:
            return jsonify({'error': 'Родительский комментарий не найден'}), 404
    
    try:
        comment = Comment(
            content=data['content'],
            user_id=current_user_id,
            project_id=project_id,
            reference_id=reference_id,
            parent_id=parent_id
        )
        
        db.session.add(comment)
        db.session.commit()
        
        # Отправляем уведомление владельцу проекта/референса о новом комментарии
        commenter = User.query.get(current_user_id)
        
        if project_id and project.user_id != current_user_id:
            NotificationService.send_notification(
                user_id=project.user_id,
                type='project_commented',
                title=f'Новый комментарий к проекту "{project.title}"',
                message=f'{commenter.first_name} {commenter.last_name} оставил комментарий к вашему проекту "{project.title}"',
                data={
                    'project_id': project_id,
                    'project_title': project.title,
                    'commenter_name': f'{commenter.first_name} {commenter.last_name}',
                    'comment_id': comment.id,
                    'comment_content': comment.content[:100] + ('...' if len(comment.content) > 100 else '')
                }
            )
        elif reference_id and reference.project.user_id != current_user_id:
            NotificationService.send_notification(
                user_id=reference.project.user_id,
                type='reference_commented',
                title=f'Новый комментарий к референсу',
                message=f'{commenter.first_name} {commenter.last_name} оставил комментарий к референсу в проекте "{reference.project.title}"',
                data={
                    'project_id': reference.project_id,
                    'reference_id': reference_id,
                    'project_title': reference.project.title,
                    'commenter_name': f'{commenter.first_name} {commenter.last_name}',
                    'comment_id': comment.id,
                    'comment_content': comment.content[:100] + ('...' if len(comment.content) > 100 else '')
                }
            )
        
        return jsonify({
            'message': 'Комментарий создан успешно',
            'comment': comment.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка создания комментария: {str(e)}'}), 500

@comments_bp.route('/api/comments/<int:comment_id>', methods=['PUT'])
@jwt_required()
def update_comment(comment_id):
    """Обновление комментария"""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    comment = Comment.query.get_or_404(comment_id)
    
    if not comment.can_edit(current_user_id):
        return jsonify({'error': 'Нет прав на редактирование'}), 403
    
    if not data or not data.get('content'):
        return jsonify({'error': 'Содержимое комментария обязательно'}), 400
    
    try:
        comment.content = data['content']
        db.session.commit()
        
        return jsonify({
            'message': 'Комментарий обновлен успешно',
            'comment': comment.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка обновления комментария: {str(e)}'}), 500

@comments_bp.route('/api/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    """Удаление комментария (мягкое удаление)"""
    current_user_id = get_jwt_identity()
    
    comment = Comment.query.get_or_404(comment_id)
    
    # Проверяем права (пользователь может удалить свой комментарий или админ любой)
    user = User.query.get(current_user_id)
    is_admin = user and user.email == 'admin@dinorefs.com'
    
    if not comment.can_delete(current_user_id, is_admin):
        return jsonify({'error': 'Нет прав на удаление'}), 403
    
    try:
        comment.is_deleted = True
        db.session.commit()
        
        return jsonify({'message': 'Комментарий удален успешно'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка удаления комментария: {str(e)}'}), 500

@comments_bp.route('/api/comments/<int:comment_id>/like', methods=['POST'])
@jwt_required()
def toggle_comment_like(comment_id):
    """Переключение лайка комментария"""
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    is_like = data.get('is_like', True)  # True = лайк, False = дизлайк
    
    comment = Comment.query.get_or_404(comment_id)
    
    # Проверяем существующий лайк
    existing_like = Like.query.filter_by(
        user_id=current_user_id,
        comment_id=comment_id
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
                comment_id=comment_id,
                is_like=is_like
            )
            db.session.add(new_like)
            action = 'added'
        
        # Обновляем счетчик лайков в комментарии
        stats = Like.get_stats(comment_id=comment_id)
        comment.likes_count = stats['likes']
        
        db.session.commit()
        
        return jsonify({
            'message': f'Лайк {action}',
            'action': action,
            'stats': stats
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Ошибка обработки лайка: {str(e)}'}), 500

