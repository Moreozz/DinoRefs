from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def init_db(app):
    """Инициализация базы данных"""
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dinorefs.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
    
    return db

def get_db():
    """Получение экземпляра базы данных"""
    return db

