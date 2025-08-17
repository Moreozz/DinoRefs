from flask import Blueprint, request, jsonify
from src.models import db, User, Project, Reference
from src.routes.auth import verify_token

projects_bp = Blueprint('projects', __name__)

def get_current_user():
    """Получает текущего пользователя из токена"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    user_id = verify_token(token)
    
    if not user_id:
        return None
    
    return User.query.get(user_id)

@projects_bp.route('/projects', methods=['GET'])
def get_projects():
    """Получение списка проектов пользователя"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        projects = Project.query.filter_by(user_id=user.id).order_by(Project.updated_at.desc()).all()
        
        return jsonify({
            'projects': [project.to_dict() for project in projects]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/projects', methods=['POST'])
def create_project():
    """Создание нового проекта"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        # Проверяем лимиты подписки
        from src.services.subscription_service import SubscriptionService
        can_create, message = SubscriptionService.can_create_project(user.id)
        
        if not can_create:
            return jsonify({'error': message, 'upgrade_required': True}), 403
        
        data = request.get_json()
        
        if not data.get('title'):
            return jsonify({'error': 'Название проекта обязательно'}), 400
        
        project = Project(
            title=data['title'],
            description=data.get('description', ''),
            user_id=user.id,
            is_public=data.get('is_public', False)
        )
        
        # Если проект публичный, генерируем ссылки
        if project.is_public:
            project.generate_public_slug()
            project.generate_short_code()
        
        db.session.add(project)
        db.session.commit()
        
        return jsonify({
            'message': 'Проект успешно создан',
            'project': project.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/projects/<int:project_id>', methods=['GET'])
def get_project(project_id):
    """Получение проекта с референсами"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        project = Project.query.filter_by(id=project_id, user_id=user.id).first()
        if not project:
            return jsonify({'error': 'Проект не найден'}), 404
        
        return jsonify({
            'project': project.to_dict_with_references()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    """Обновление проекта"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        project = Project.query.filter_by(id=project_id, user_id=user.id).first()
        if not project:
            return jsonify({'error': 'Проект не найден'}), 404
        
        data = request.get_json()
        
        if 'title' in data:
            if not data['title']:
                return jsonify({'error': 'Название проекта не может быть пустым'}), 400
            project.title = data['title']
        
        if 'description' in data:
            project.description = data['description']
        
        if 'is_public' in data:
            old_is_public = project.is_public
            project.is_public = data['is_public']
            
            # Если проект стал публичным, генерируем ссылки
            if project.is_public and not old_is_public:
                project.generate_public_slug()
                project.generate_short_code()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Проект успешно обновлен',
            'project': project.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    """Удаление проекта"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        project = Project.query.filter_by(id=project_id, user_id=user.id).first()
        if not project:
            return jsonify({'error': 'Проект не найден'}), 404
        
        db.session.delete(project)
        db.session.commit()
        
        return jsonify({'message': 'Проект успешно удален'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@projects_bp.route('/projects/<int:project_id>/search', methods=['GET'])
def search_in_project(project_id):
    """Поиск по референсам в проекте"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        project = Project.query.filter_by(id=project_id, user_id=user.id).first()
        if not project:
            return jsonify({'error': 'Проект не найден'}), 404
        
        query = request.args.get('q', '').strip()
        if not query:
            return jsonify({'references': []}), 200
        
        # Поиск по названию, описанию и тегам
        references = Reference.query.filter(
            Reference.project_id == project_id,
            db.or_(
                Reference.title.contains(query),
                Reference.description.contains(query),
                Reference.tags.contains(query),
                Reference.url.contains(query)
            )
        ).all()
        
        return jsonify({
            'references': [ref.to_dict() for ref in references],
            'query': query,
            'count': len(references)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

