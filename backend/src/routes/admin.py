from flask import Blueprint, request, jsonify
from src.models import db, User, Project, Reference
from src.routes.auth import verify_token

admin_bp = Blueprint('admin', __name__)

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

def require_admin():
    """Проверяет права администратора"""
    user = get_current_user()
    if not user:
        return None, jsonify({'error': 'Требуется авторизация'}), 401
    
    if not user.is_admin:
        return None, jsonify({'error': 'Недостаточно прав'}), 403
    
    return user, None, None

@admin_bp.route('/admin/users', methods=['GET'])
def get_users():
    """Получение списка пользователей"""
    try:
        user, error_response, status_code = require_admin()
        if error_response:
            return error_response, status_code
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '').strip()
        
        query = User.query
        
        if search:
            query = query.filter(
                db.or_(
                    User.email.contains(search),
                    User.first_name.contains(search),
                    User.last_name.contains(search)
                )
            )
        
        users = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'users': [user.to_dict() for user in users.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': users.total,
                'pages': users.pages,
                'has_next': users.has_next,
                'has_prev': users.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/users/<int:user_id>/toggle-status', methods=['POST'])
def toggle_user_status(user_id):
    """Блокировка/разблокировка пользователя"""
    try:
        admin_user, error_response, status_code = require_admin()
        if error_response:
            return error_response, status_code
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'Пользователь не найден'}), 404
        
        if user.id == admin_user.id:
            return jsonify({'error': 'Нельзя заблокировать самого себя'}), 400
        
        user.is_active = not user.is_active
        db.session.commit()
        
        status = 'разблокирован' if user.is_active else 'заблокирован'
        
        return jsonify({
            'message': f'Пользователь {status}',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/projects', methods=['GET'])
def get_all_projects():
    """Получение всех проектов"""
    try:
        user, error_response, status_code = require_admin()
        if error_response:
            return error_response, status_code
        
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search', '').strip()
        
        query = Project.query.join(User)
        
        if search:
            query = query.filter(
                db.or_(
                    Project.title.contains(search),
                    Project.description.contains(search),
                    User.email.contains(search)
                )
            )
        
        projects = query.order_by(Project.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Добавляем информацию о владельце
        projects_data = []
        for project in projects.items:
            project_dict = project.to_dict()
            project_dict['owner'] = project.owner.to_dict_safe()
            projects_data.append(project_dict)
        
        return jsonify({
            'projects': projects_data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': projects.total,
                'pages': projects.pages,
                'has_next': projects.has_next,
                'has_prev': projects.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/projects/<int:project_id>', methods=['DELETE'])
def delete_project_admin(project_id):
    """Удаление проекта администратором"""
    try:
        user, error_response, status_code = require_admin()
        if error_response:
            return error_response, status_code
        
        project = Project.query.get(project_id)
        if not project:
            return jsonify({'error': 'Проект не найден'}), 404
        
        db.session.delete(project)
        db.session.commit()
        
        return jsonify({'message': 'Проект удален администратором'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/admin/stats', methods=['GET'])
def get_admin_stats():
    """Получение статистики для админ панели"""
    try:
        user, error_response, status_code = require_admin()
        if error_response:
            return error_response, status_code
        
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        total_projects = Project.query.count()
        public_projects = Project.query.filter_by(is_public=True).count()
        total_references = Reference.query.count()
        
        return jsonify({
            'stats': {
                'total_users': total_users,
                'active_users': active_users,
                'blocked_users': total_users - active_users,
                'total_projects': total_projects,
                'public_projects': public_projects,
                'private_projects': total_projects - public_projects,
                'total_references': total_references
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

