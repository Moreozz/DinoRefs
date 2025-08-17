#!/usr/bin/env python3
"""
WSGI точка входа для DinoRefs Backend
"""
import sys
import os

# Добавляем src в путь для импортов
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(current_dir, 'src')
sys.path.insert(0, src_dir)

from src.main import app

# Экспортируем приложение для WSGI сервера
application = app

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=False)

