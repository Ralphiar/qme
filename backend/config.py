import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:1111aaaa@localhost/brightkate'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get('SECRET_KEY') or '1111aaaa'
    COOLDOWN_MINUTES = 1
