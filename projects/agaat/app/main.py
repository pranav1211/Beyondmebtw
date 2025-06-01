from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from datetime import datetime, timedelta
import json
import os
from chatbot import KeywordChatbot

# Initialize Flask app
app = Flask(__name__)
app.secret_key = 'pv1'
app.permanent_session_lifetime = timedelta(hours=24)

# Initialize chatbot
chatbot = KeywordChatbot("data.json")

# Load data from JSON file - NO FALLBACK
def load_data():
    """Load data from JSON file without fallback."""
    try:
        if not os.path.exists('data.json'):
            raise FileNotFoundError("data.json file not found")
        
        with open('data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            print("✅ Data loaded successfully from data.json")
            return data
    except FileNotFoundError:
        error_msg = "❌ ERROR: data.json file not found. Please create the data file first."
        print(error_msg)
        return {"error": error_msg, "loaded": False}
    except json.JSONDecodeError as e:
        error_msg = f"❌ ERROR: Invalid JSON format in data.json: {str(e)}"
        print(error_msg)
        return {"error": error_msg, "loaded": False}
    except Exception as e:
        error_msg = f"❌ ERROR: Failed to load data.json: {str(e)}"
        print(error_msg)
        return {"error": error_msg, "loaded": False}

# Simple data manager class
class DataManager:
    def __init__(self, data):
        self.data = data
    
    def get_dashboard_data(self, user):
        """Get dashboard data for a user"""
        # Check if data loaded successfully
        if isinstance(self.data, dict) and "error" in self.data:
            return {
                'schedules': [],
                'conflicts': [],
                'crew_member': None,
                'error': self.data["error"]
            }
        
        schedules = []
        conflicts = []
        
        # Find user's crew member data
        crew_member = None
        for crew in self.data.get('crew_members', []):
            if crew['name'] == user['name'] or crew.get('email', '').startswith(user.get('username', '')):
                crew_member = crew
                break
        
        if crew_member:
            # Get shifts for this crew member
            for shift in self.data.get('shifts', []):
                if shift.get('crew_id') == crew_member['id']:
                    schedules.append(shift)
        
        return {
            'schedules': schedules,
            'conflicts': conflicts,
            'crew_member': crew_member
        }
    
    def get_available_shifts_by_role(self, role):
        """Get available shifts for a specific role"""
        if isinstance(self.data, dict) and "error" in self.data:
            return []
        
        return [shift for shift in self.data.get('available_shifts', []) if shift.get('role') == role]
    
    def get_conflicts_for_user(self, user):
        """Get scheduling conflicts for a user"""
        if isinstance(self.data, dict) and "error" in self.data:
            return []
        
        conflicts = []
        dashboard_data = self.get_dashboard_data(user)
        
        # Check for overlapping shifts
        schedules = dashboard_data['schedules']
        for i, shift1 in enumerate(schedules):
            for shift2 in schedules[i+1:]:
                if shift1.get('shift_date') == shift2.get('shift_date'):
                    try:
                        # Check time overlap
                        start1 = datetime.strptime(shift1['start_time'], '%H:%M').time()
                        end1 = datetime.strptime(shift1['end_time'], '%H:%M').time()
                        start2 = datetime.strptime(shift2['start_time'], '%H:%M').time()
                        end2 = datetime.strptime(shift2['end_time'], '%H:%M').time()
                        
                        if (start1 <= start2 < end1) or (start1 < end2 <= end1):
                            conflicts.append({
                                'date': shift1['shift_date'],
                                'message': f"Overlapping shifts: {shift1['shift_type']} and {shift2['shift_type']}"
                            })
                    except (KeyError, ValueError) as e:
                        print(f"Error processing shift times: {e}")
        
        return conflicts

# Load data on startup
DATA = load_data()
data_manager = DataManager(DATA)

def authenticate_user(username, password):
    """Authenticate user credentials"""
    # Check if data loaded successfully
    if isinstance(DATA, dict) and "error" in DATA:
        return None
    
    for user in DATA.get('users', []):
        if user['username'] == username and user['password'] == password:
            return {
                'username': username,
                'name': user['name'],
                'role': user['role']
            }
    return None

def get_user_schedules(user):
    """Get schedules for a specific user"""
    # Check if data loaded successfully
    if isinstance(DATA, dict) and "error" in DATA:
        return []
    
    schedules = []
    user_crew = None
    
    # Find crew member data
    for crew in DATA.get('crew_members', []):
        if crew['name'] == user['name'] or crew.get('email', '').startswith(user.get('username', '')):
            user_crew = crew
            break
    
    # Get flights assigned to this crew member
    for flight in DATA.get('flights', []):
        if user_crew and user_crew['id'] in flight.get('assigned_crew', []):
            try:
                schedule = {
                    'flight_number': flight['flight_number'],
                    'route': flight['route'],
                    'departure_time': flight['departure_time'][:10] + ' ' + flight['departure_time'][11:16],
                    'arrival_time': flight['arrival_time'][:10] + ' ' + flight['arrival_time'][11:16],
                    'aircraft': flight['aircraft'],
                    'status': flight['status'],
                    'date': flight['departure_time'][:10]
                }
                schedules.append(schedule)
            except (KeyError, IndexError) as e:
                print(f"Error processing flight data: {e}")
    
    return schedules

@app.route('/', methods=['GET', 'POST'])
def index():
    # Check if data loaded successfully
    if isinstance(DATA, dict) and "error" in DATA:
        flash(f'System Error: {DATA["error"]}', 'error')
        return render_template('error.html', error=DATA["error"])
    
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = authenticate_user(username, password)
        if user:
            session['user'] = user
            session.permanent = True
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password!', 'error')
    
    if 'user' in session:
        return redirect(url_for('dashboard'))
    
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    # Check if data loaded successfully
    if isinstance(DATA, dict) and "error" in DATA:
        flash(f'System Error: {DATA["error"]}', 'error')
        return render_template('error.html', error=DATA["error"])
    
    if 'user' not in session:
        flash('Please log in to access the dashboard.', 'error')
        return redirect(url_for('index'))
    
    user = session['user']
    schedules = get_user_schedules(user)
    
    # Get crew data for admin
    crew_data = DATA.get('crew_members', []) if user['role'] == 'admin' else []
    
    return render_template('dashboard.html', 
                         user=user, 
                         schedules=schedules, 
                         crew_data=crew_data,
                         stats=DATA.get('stats', {}),
                         recent_activities=DATA.get('recent_activities', []))

@app.route('/logout')
def logout():
    session.pop('user', None)
    flash('Logged out successfully!', 'success')
    return redirect(url_for('index'))

@app.route('/chat', methods=['POST'])
def chat():
    if 'user' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = session['user']
    message = request.json.get('message', '')
    
    if not message.strip():
        return jsonify({'error': 'Empty message'}), 400
    
    try:
        # Use the KeywordChatbot instance
        response = chatbot.get_response(message, user)
        return jsonify(response)
    
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({
            'text': f'Sorry, I encountered an error: {str(e)}',
            'suggestions': ['Try again', 'Contact support', 'View help', 'Check status'],
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        })

@app.route('/status')
def status():
    """System status endpoint"""
    data_status = {
        'data_file_exists': os.path.exists('data.json'),
        'data_loaded': not (isinstance(DATA, dict) and "error" in DATA),
        'chatbot_ready': chatbot is not None,
        'timestamp': datetime.now().isoformat()
    }
    
    if isinstance(DATA, dict) and "error" in DATA:
        data_status['error'] = DATA["error"]
    else:
        data_status['data_summary'] = {
            'users': len(DATA.get('users', [])),
            'crew_members': len(DATA.get('crew_members', [])),
            'flights': len(DATA.get('flights', [])),
            'shifts': len(DATA.get('shifts', []))
        }
    
    return jsonify(data_status)

if __name__ == '__main__':
    print("🚀 Starting Aviation Crew Scheduler...")
    print("📱 Access at: http://localhost:5000")
    
    # Check data file status
    if isinstance(DATA, dict) and "error" in DATA:
        print(f"\n❌ {DATA['error']}")
        print("💡 Please create data.json file or run the data initialization script.")
    else:
        print("\n✅ Data loaded successfully!")
        print("\n👥 Available Login Credentials:")
        for user in DATA.get('users', []):
            print(f"   {user['role'].title()}: {user['username']} / {user['password']}")
    
    print(f"\n🔧 System Status: http://localhost:5000/status")
    
    app.run(debug=True, host='0.0.0.0', port=5000)