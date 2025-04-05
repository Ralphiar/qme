# import os
#
# class Config:
#     SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:1111aaaa@localhost/brightkate'
#     SQLALCHEMY_TRACK_MODIFICATIONS = False
#     SECRET_KEY = os.environ.get('SECRET_KEY') or '1111aaaa'
#     COOLDOWN_MINUTES = 1
import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'postgresql://qme_user:Bdb&s4gb3b4#)Jm*@localhost/qme_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'some-hardcoded-super-secret'
    COOLDOWN_MINUTES = 1
