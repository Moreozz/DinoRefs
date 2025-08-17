#!/usr/bin/env python3
"""
Точка входа для развертывания DinoRefs Backend
"""
import sys
import os

# Добавляем src в путь для импортов
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.main import app

if __name__ == '__main__':
    # Для локальной разработки
    app.run(host='0.0.0.0', port=5000, debug=True)
else:
    # Для продакшн развертывания
    application = app

