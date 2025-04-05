# reset_db.py

from backend.app import app
from backend.models import db

with app.app_context():
    print("⏳ Удаляем все таблицы...")
    db.drop_all()
    print("✅ Все таблицы удалены.")

    print("🔧 Создаём таблицы заново...")
    db.create_all()
    print("🎉 Таблицы успешно созданы.")
