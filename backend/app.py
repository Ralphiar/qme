import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
import secrets

# Инициализация приложения
app = Flask(__name__)

# Конфигурация базы данных
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    'DATABASE_URL', 
    "postgresql://postgres@localhost/brightkate"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Генерация секретного ключа для сессий
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(16))

# Инициализация расширений
from backend.models import db
db.init_app(app)
migrate = Migrate(app, db)

# Включение CORS для всех маршрутов
CORS(app)

# Импорт маршрутов
from backend import routes

# Создание таблиц базы данных при запуске
with app.app_context():
    db.create_all()

# Точка входа для запуска приложения
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)