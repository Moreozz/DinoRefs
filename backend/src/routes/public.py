from flask import Blueprint, request, jsonify
from src.models import db, Project, Reference

public_bp = Blueprint('public', __name__)

@public_bp.route('/public/projects', methods=['GET'])
def get_public_projects():
    """Получение списка публичных проектов"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 12, type=int)
        search = request.args.get('search', '').strip()
        
        query = Project.query.filter_by(is_public=True)
        
        if search:
            query = query.filter(
                db.or_(
                    Project.title.contains(search),
                    Project.description.contains(search)
                )
            )
        
        projects = query.order_by(Project.updated_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'projects': [project.to_public_dict() for project in projects.items],
            'pagination': {
                'page': page,
                'pages': projects.pages,
                'per_page': per_page,
                'total': projects.total,
                'has_next': projects.has_next,
                'has_prev': projects.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@public_bp.route('/public/<slug>', methods=['GET'])
def get_public_project_by_slug(slug):
    """Получение публичного проекта по slug"""
    try:
        project = Project.query.filter_by(public_slug=slug, is_public=True).first()
        if not project:
            return jsonify({'error': 'Проект не найден или не является публичным'}), 404
        
        # Увеличиваем счетчик просмотров
        project.increment_view_count()
        
        # Получаем референсы
        references = Reference.query.filter_by(project_id=project.id).order_by(Reference.created_at.desc()).all()
        
        project_data = project.to_public_dict()
        project_data['references'] = [ref.to_dict() for ref in references]
        
        return jsonify({
            'project': project_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@public_bp.route('/s/<short_code>', methods=['GET'])
def redirect_short_link(short_code):
    """Редирект по короткой ссылке"""
    try:
        project = Project.query.filter_by(short_code=short_code, is_public=True).first()
        if not project:
            return jsonify({'error': 'Ссылка не найдена или недоступна'}), 404
        
        # Увеличиваем счетчик просмотров
        project.increment_view_count()
        
        return jsonify({
            'redirect_url': f'/public/{project.public_slug}',
            'project': project.to_public_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@public_bp.route('/projects/<int:project_id>/public-links', methods=['POST'])
def generate_public_links(project_id):
    """Генерация публичных ссылок для проекта (только для владельца)"""
    try:
        from src.routes.projects import get_current_user
        
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        project = Project.query.filter_by(id=project_id, user_id=user.id).first()
        if not project:
            return jsonify({'error': 'Проект не найден'}), 404
        
        if not project.is_public:
            return jsonify({'error': 'Проект должен быть публичным'}), 400
        
        # Генерируем slug и короткий код если их нет
        project.generate_public_slug()
        project.generate_short_code()
        
        db.session.commit()
        
        base_url = request.host_url.rstrip('/')
        
        return jsonify({
            'public_url': project.get_public_url(base_url),
            'short_url': project.get_short_url(base_url),
            'public_slug': project.public_slug,
            'short_code': project.short_code,
            'qr_code_url': f"{base_url}/api/projects/{project_id}/qr-code"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@public_bp.route('/projects/<int:project_id>/qr-code', methods=['GET'])
def get_qr_code(project_id):
    """Генерация QR-кода для проекта"""
    try:
        from src.routes.projects import get_current_user
        import qrcode
        import io
        import base64
        
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        project = Project.query.filter_by(id=project_id, user_id=user.id).first()
        if not project:
            return jsonify({'error': 'Проект не найден'}), 404
        
        if not project.is_public or not project.short_code:
            return jsonify({'error': 'Проект должен быть публичным с сгенерированной ссылкой'}), 400
        
        # Генерируем QR-код
        base_url = request.host_url.rstrip('/')
        short_url = project.get_short_url(base_url)
        
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(short_url)
        qr.make(fit=True)
        
        # Создаем изображение
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Конвертируем в base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return jsonify({
            'qr_code': f"data:image/png;base64,{qr_code_base64}",
            'url': short_url
        }), 200
        
    except ImportError:
        return jsonify({'error': 'QR-код генерация недоступна. Установите библиотеку qrcode'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@public_bp.route('/projects/<int:project_id>/stats', methods=['GET'])
def get_project_stats(project_id):
    """Получение статистики проекта (только для владельца)"""
    try:
        from src.routes.projects import get_current_user
        
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Требуется авторизация'}), 401
        
        project = Project.query.filter_by(id=project_id, user_id=user.id).first()
        if not project:
            return jsonify({'error': 'Проект не найден'}), 404
        
        return jsonify({
            'view_count': project.view_count,
            'is_public': project.is_public,
            'has_public_links': bool(project.public_slug and project.short_code),
            'references_count': len(project.references) if project.references else 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

