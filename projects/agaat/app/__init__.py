# app/__init__.py
from flask import Flask
from dotenv import load_dotenv

def create_app():
    app = Flask(__name__)    
    load_dotenv()
    app.secret_key = os.getenv('SECRET_KEY')
    return app