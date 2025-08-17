from flask import Blueprint, request, jsonify
from src.models import db, User, Project, Reference
from src.routes.auth import verify_token

references_bp = Blueprint('references', __name__)

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

@references_bp.route('/projects/<int:project_id>/references', methods=['POST'])
def create_reference(project_id):
    """Создание нового референса"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        # Проверка принадлежности проекта пользователю
        project = Project.query.filter_by(id=project_id, user_id=user.id).first()
        if not project:
            return jsonify({'error': 'Проект не найден'}), 404
        
        data = request.get_json()
        
        if not data.get('title'):
            return jsonify({'error': 'Название референса обязательно'}), 400
        
        reference = Reference(
            title=data['title'],
            url=data.get('url', ''),
            description=data.get('description', ''),
            category=data.get('category', ''),
            project_id=project_id
        )
        
        # Установка тегов
        if 'tags' in data:
            reference.set_tags(data['tags'])
        
        db.session.add(reference)
        db.session.commit()
        
        return jsonify({
            'message': 'Референс успешно создан',
            'reference': reference.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@references_bp.route('/references/<int:reference_id>', methods=['GET'])
def get_reference(reference_id):
    """Получение референса"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        reference = Reference.query.join(Project).filter(
            Reference.id == reference_id,
            Project.user_id == user.id
        ).first()
        
        if not reference:
            return jsonify({'error': 'Референс не найден'}), 404
        
        return jsonify({
            'reference': reference.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@references_bp.route('/references/<int:reference_id>', methods=['PUT'])
def update_reference(reference_id):
    """Обновление референса"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        reference = Reference.query.join(Project).filter(
            Reference.id == reference_id,
            Project.user_id == user.id
        ).first()
        
        if not reference:
            return jsonify({'error': 'Референс не найден'}), 404
        
        data = request.get_json()
        
        if 'title' in data:
            if not data['title']:
                return jsonify({'error': 'Название референса не может быть пустым'}), 400
            reference.title = data['title']
        
        if 'url' in data:
            reference.url = data['url']
        
        if 'description' in data:
            reference.description = data['description']
        
        if 'category' in data:
            reference.category = data['category']
        
        if 'tags' in data:
            reference.set_tags(data['tags'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Референс успешно обновлен',
            'reference': reference.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@references_bp.route('/references/<int:reference_id>', methods=['DELETE'])
def delete_reference(reference_id):
    """Удаление референса"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        reference = Reference.query.join(Project).filter(
            Reference.id == reference_id,
            Project.user_id == user.id
        ).first()
        
        if not reference:
            return jsonify({'error': 'Референс не найден'}), 404
        
        db.session.delete(reference)
        db.session.commit()
        
        return jsonify({'message': 'Референс успешно удален'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@references_bp.route('/projects/<int:project_id>/references', methods=['GET'])
def get_project_references(project_id):
    """Получение всех референсов проекта"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        # Проверка принадлежности проекта пользователю
        project = Project.query.filter_by(id=project_id, user_id=user.id).first()
        if not project:
            return jsonify({'error': 'Проект не найден'}), 404
        
        # Параметры фильтрации
        category = request.args.get('category')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        query = Reference.query.filter_by(project_id=project_id)
        
        if category:
            query = query.filter_by(category=category)
        
        # Пагинация
        references = query.order_by(Reference.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'references': [ref.to_dict() for ref in references.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': references.total,
                'pages': references.pages,
                'has_next': references.has_next,
                'has_prev': references.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

