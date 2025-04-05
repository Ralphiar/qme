from backend import app, db
from flask_migrate import Migrate
from config import Config

app.config.from_object(Config)

# Инициализируем миграцию
migrate = Migrate(app, db)

if __name__ == '__main__':
    app.run(debug=True)