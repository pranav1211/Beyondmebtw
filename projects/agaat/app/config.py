import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'aviation-crew-scheduler-secret-key-2025'
    
    # Session configuration
    SESSION_PERMANENT = True
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    
    # Data directory
    DATA_DIR = 'data'
    
    # File paths
    USERS_FILE = os.path.join(DATA_DIR, 'users.json')
    CREW_FILE = os.path.join(DATA_DIR, 'crew.json')
    SCHEDULES_FILE = os.path.join(DATA_DIR, 'schedules.json')
    
    # Google Gemini API
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY') or 'your-gemini-api-key-here'
    
    # Create data directory if it doesn't exist
    os.makedirs(DATA_DIR, exist_ok=True)