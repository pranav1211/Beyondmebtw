# app/__init__.py
from flask import Flask

def create_app():
    app = Flask(__name__)
    app.secret_key = 'your-secret-key-here'
    return app