from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from backend.config import Config
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.config.from_object(Config)

db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Импортируем маршруты после создания приложения
from backend.routes import queue_routes, admin_routes, song_routes
from backend.routes import queue_routes, admin_routes, song_routes, rating_routes