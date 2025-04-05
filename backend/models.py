# models.py (в корне backend)
from datetime import datetime
from backend import db
import secrets
from sqlalchemy import Index


class Queue(db.Model):
    __tablename__ = 'queue'

    id = db.Column(db.Integer, primary_key=True)
    nickname = db.Column(db.String(100), nullable=False, index=True)
    joined_at = db.Column(db.DateTime, default=db.func.now(), index=True)

    # Новое поле — когда игрок последний раз пытался записаться (для кулдауна)
    last_joined_at = db.Column(db.DateTime, nullable=True, index=True)

    __table_args__ = (
        Index('idx_queue_nickname_joined', 'nickname', 'joined_at'),
    )


class Song(db.Model):
    __tablename__ = 'songs'

    id = db.Column(db.Integer, primary_key=True)
    youtube_url = db.Column(db.String(255), nullable=False, unique=True, index=True)
    added_at = db.Column(db.DateTime, default=db.func.now(), index=True)


class ActivePlayers(db.Model):
    __tablename__ = 'active_players'

    id = db.Column(db.Integer, primary_key=True)
    nickname = db.Column(db.String(100), nullable=False, index=True)
    moved_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index('idx_active_players_nickname_moved', 'nickname', 'moved_at'),
    )


class SongOrder(db.Model):
    """Модель для заказа песни"""
    __tablename__ = 'song_orders'

    id = db.Column(db.Integer, primary_key=True)
    order_code = db.Column(db.String(10), unique=True, nullable=False, index=True)
    nickname = db.Column(db.String(100), nullable=False, index=True)
    status = db.Column(db.String(20), default="pending", index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    confirmed_at = db.Column(db.DateTime, nullable=True, index=True)

    # Информация о песне
    youtube_url = db.Column(db.String(255), nullable=True, index=True)
    song_title = db.Column(db.String(255), nullable=True)
    artist = db.Column(db.String(255), nullable=True)

    # Метаданные
    played = db.Column(db.Boolean, default=False, index=True)
    played_at = db.Column(db.DateTime, nullable=True, index=True)

    __table_args__ = (
        Index('idx_song_order_status_created', 'status', 'created_at'),
    )

    @classmethod
    def generate_order_code(cls):
        """Генерирует уникальный код заказа"""
        while True:
            code = secrets.token_urlsafe(4)[:6].upper()
            if not cls.query.filter_by(order_code=code).first():
                return code

    def confirm_donation(self):
        """Подтверждает донат и активирует заказ"""
        self.status = "confirmed"
        self.confirmed_at = datetime.utcnow()
        db.session.commit()

    def add_song_details(self, youtube_url, song_title=None, artist=None):
        """Добавляет информацию о песне после подтверждения"""
        self.youtube_url = youtube_url
        self.song_title = song_title
        self.artist = artist
        self.status = "completed"
        db.session.commit()

    def mark_as_played(self):
        """Отмечает песню как воспроизведенную"""
        self.played = True
        self.played_at = datetime.utcnow()
        db.session.commit()

    def to_dict(self):
        """Преобразует объект в словарь для API"""
        return {
            "id": self.id,
            "order_code": self.order_code,
            "nickname": self.nickname,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "confirmed_at": self.confirmed_at.isoformat() if self.confirmed_at else None,
            "youtube_url": self.youtube_url,
            "song_title": self.song_title,
            "artist": self.artist,
            "played": self.played,
            "played_at": self.played_at.isoformat() if self.played_at else None
        }


class CompletedPlayers(db.Model):
    __tablename__ = 'completed_players'

    id = db.Column(db.Integer, primary_key=True)
    nickname = db.Column(db.String(50), nullable=False, index=True)
    rating = db.Column(db.Float, nullable=True, index=True)  # Рейтинг в виде float для среднего значения
    games_played = db.Column(db.Integer, default=1, index=True)  # Поле для хранения количества игр
    completed_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        Index('idx_completed_players_nickname_rating', 'nickname', 'rating'),
    )

    def __repr__(self):
        return f'<CompletedPlayer {self.nickname}>'
