import json
import hashlib
from config import Config

class AuthManager:
    def __init__(self):
        self.config = Config()
    
    def load_json(self, file_path):
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return []
    
    def hash_password(self, password):
        return hashlib.sha256(password.encode()).hexdigest()
    
    def authenticate_user(self, username, password):
        users = self.load_json(self.config.USERS_FILE)
        
        for user in users:
            if user['username'] == username:
                # Check plain text password first (for the demo accounts)
                if user['password'] == password:
                    return self._enrich_user_data(user)
                
                # Then check hashed password
                hashed_input = self.hash_password(password)
                if user['password'] == hashed_input:
                    return self._enrich_user_data(user)
        
        return None
    
    def _enrich_user_data(self, user):
        """Add crew information to user data"""
        if user.get('crew_id'):
            crew_info = self.get_crew_by_id(user['crew_id'])
            if crew_info:
                user['crew_name'] = crew_info['name']
                user['crew_email'] = crew_info['email']
        return user
    
    def get_crew_by_id(self, crew_id):
        crew_data = self.load_json(self.config.CREW_FILE)
        for crew in crew_data:
            if crew['crew_id'] == crew_id:
                return crew
        return None