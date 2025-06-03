from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
from datetime import datetime, timedelta
import pandas as pd
import os
from google import genai
from typing import List, Dict, Any
import json
import re

# Initialize Flask app
app = Flask(__name__)
app.secret_key = 'aviation-crew-scheduler-ai-2025'
app.permanent_session_lifetime = timedelta(hours=24)

# Gemini API setup
GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY'  # Replace with your actual Gemini API key
genai_client = genai.Client(api_key='AIzaSyA04MfGxycBuwJ0OqIL2x_6JsKoJCDU7gk')

class CrewSchedulerAI:
    def __init__(self):
        self.load_data()
        
    def load_data(self):
        """Load data from CSV files"""
        try:
            # Try to load users.csv
            users_path = 'app/users.csv'
            if os.path.exists(users_path):
                print(f"Loading users from: {users_path}")
                self.users_df = pd.read_csv(users_path)
                print(f"Loaded {len(self.users_df)} users")
            else:
                print(f"Users file not found at: {users_path}")
                self.users_df = pd.DataFrame()
            
            # Load other CSV files
            shifts_path = 'app/shifts.csv'
            if os.path.exists(shifts_path):
                self.shifts_df = pd.read_csv(shifts_path)
            else:
                print(f"Shifts file not found at: {shifts_path}")
                self.shifts_df = pd.DataFrame()
                
            pickup_shifts_path = 'app/pickup_shifts.csv'
            if os.path.exists(pickup_shifts_path):
                self.pickup_shifts_df = pd.read_csv(pickup_shifts_path)
            else:
                print(f"Pickup shifts file not found at: {pickup_shifts_path}")
                self.pickup_shifts_df = pd.DataFrame()
                
            flights_path = 'app/flights.csv'
            if os.path.exists(flights_path):
                self.flights_df = pd.read_csv(flights_path)
            else:
                print(f"Flights file not found at: {flights_path}")
                self.flights_df = pd.DataFrame()
                
        except Exception as e:
            print(f"Error loading data: {e}")
            self.initialize_empty_dataframes()
    
    def initialize_empty_dataframes(self):
        """Initialize empty DataFrames with proper structure"""
        self.users_df = pd.DataFrame()
        self.shifts_df = pd.DataFrame()
        self.pickup_shifts_df = pd.DataFrame()
        self.flights_df = pd.DataFrame()
    
    def get_user_by_index(self, index: int) -> Dict[str, Any]:
        """Get user by index (0-based)"""
        if self.users_df.empty or index >= len(self.users_df):
            # Return a fallback user if CSV is empty or index is out of range
            return {
                'id': 'pilot_004',
                'username': 'demo_user',
                'name': 'Demo Pilot',
                'role': 'Captain',
                'email': 'demo@airline.com',
                'license': 'ATPL-12345',
                'base': 'JFK',
                'phone': '555-0123',
                'experience_years': 8,
                'aircraft_certifications': 'B737, A320',
                'language_skills': 'English',
                'availability_status': 'active'
            }
        
        user_row = self.users_df.iloc[index]
        user_dict = user_row.to_dict()
        
        # Clean up NaN values
        for key, value in user_dict.items():
            if pd.isna(value):
                user_dict[key] = '' if isinstance(value, str) else value
        
        return user_dict
    
    def save_data(self):
        """Save data to CSV files"""
        try:
            if not self.users_df.empty:
                self.users_df.to_csv('app/users.csv', index=False)
            if not self.shifts_df.empty:
                self.shifts_df.to_csv('app/shifts.csv', index=False)
            if not self.pickup_shifts_df.empty:
                self.pickup_shifts_df.to_csv('app/pickup_shifts.csv', index=False)
            if not self.flights_df.empty:
                self.flights_df.to_csv('app/flights.csv', index=False)
        except Exception as e:
            print(f"Error saving data: {e}")
    
    def get_pilot_shifts(self, pilot_id: str) -> List[Dict]:
        """Get shifts for a specific pilot"""
        if self.shifts_df.empty:
            return []
        
        pilot_shifts = self.shifts_df[self.shifts_df['pilot_id'] == pilot_id]
        shifts_list = pilot_shifts.to_dict('records')
        
        # Clean up NaN values in shifts
        for shift in shifts_list:
            for key, value in shift.items():
                if pd.isna(value):
                    shift[key] = '' if key in ['flight_number', 'route', 'aircraft', 'status'] else value
        
        return shifts_list
    
    def get_available_pickup_shifts(self) -> List[Dict]:
        """Get available pickup shifts"""
        if self.pickup_shifts_df.empty:
            return []
        
        available_shifts = self.pickup_shifts_df[self.pickup_shifts_df['status'] == 'available']
        shifts_list = available_shifts.to_dict('records')
        
        # Clean up NaN values in pickup shifts
        for shift in shifts_list:
            for key, value in shift.items():
                if pd.isna(value):
                    shift[key] = '' if key in ['flight_number', 'route', 'aircraft', 'need', 'priority'] else value
        
        return shifts_list
    
    def get_flights_info(self, flight_number: str = None) -> List[Dict]:
        """Get flight information, optionally filtered by flight number"""
        if self.flights_df.empty:
            return []
        
        if flight_number:
            flights = self.flights_df[self.flights_df['flight_number'].str.contains(flight_number, case=False, na=False)]
        else:
            flights = self.flights_df
        
        flights_list = flights.to_dict('records')
        
        # Clean up NaN values in flights
        for flight in flights_list:
            for key, value in flight.items():
                if pd.isna(value):
                    flight[key] = '' if key in ['flight_number', 'route', 'aircraft', 'status'] else value
        
        return flights_list
    
    def get_flight_details(self, flight_number: str) -> Dict:
        """Get detailed information about a specific flight"""
        flights = self.get_flights_info(flight_number)
        if flights:
            return flights[0]
        return {}
    
    def pickup_shift(self, pilot_id: str, shift_id: str) -> bool:
        """Process shift pickup"""
        if self.pickup_shifts_df.empty:
            return False
        
        # Find the pickup shift
        shift_idx = self.pickup_shifts_df[
            (self.pickup_shifts_df['id'] == shift_id) & 
            (self.pickup_shifts_df['status'] == 'available')
        ].index
        
        if len(shift_idx) == 0:
            return False
        
        # Update pickup shift status
        self.pickup_shifts_df.loc[shift_idx[0], 'status'] = 'taken'
        self.pickup_shifts_df.loc[shift_idx[0], 'taken_by'] = pilot_id
        self.pickup_shifts_df.loc[shift_idx[0], 'taken_time'] = datetime.now().isoformat()
        
        # Add to pilot's shifts
        pickup_shift = self.pickup_shifts_df.loc[shift_idx[0]].to_dict()
        new_shift = {
            'id': f"shift_{len(self.shifts_df)+1:03d}",
            'pilot_id': pilot_id,
            'shift_date': pickup_shift['shift_date'],
            'shift_type': pickup_shift['shift_type'],
            'start_time': pickup_shift['start_time'],
            'end_time': pickup_shift['end_time'],
            'flight_number': pickup_shift['flight_number'],
            'route': pickup_shift['route'],
            'aircraft': pickup_shift['aircraft'],
            'status': 'scheduled'
        }
        
        new_shift_df = pd.DataFrame([new_shift])
        self.shifts_df = pd.concat([self.shifts_df, new_shift_df], ignore_index=True)
        self.save_data()
        return True
    
    def delete_shift(self, pilot_id: str, flight_number: str) -> bool:
        """Delete a shift"""
        if self.shifts_df.empty:
            return False
        
        shift_idx = self.shifts_df[
            (self.shifts_df['pilot_id'] == pilot_id) & 
            (self.shifts_df['flight_number'] == flight_number)
        ].index
        
        if len(shift_idx) == 0:
            return False
        
        self.shifts_df = self.shifts_df.drop(shift_idx[0])
        self.shifts_df.reset_index(drop=True, inplace=True)
        self.save_data()
        return True
    
    def get_ai_suggestions(self, pilot_id: str, preferences: Dict = None) -> str:
        """Get AI-powered suggestions using Gemini"""
        if not genai_client:
            return self.get_basic_suggestions(pilot_id, preferences)
        
        # Get pilot info
        pilot_info = self.users_df[self.users_df['id'] == pilot_id]
        if pilot_info.empty:
            return "Unable to find pilot information."
        
        pilot = pilot_info.iloc[0].to_dict()
        available_shifts = self.get_available_pickup_shifts()
        flights_info = self.get_flights_info()
        current_shifts = self.get_pilot_shifts(pilot_id)
        
        # Prepare context for AI
        context = {
            "pilot": pilot,
            "available_shifts": available_shifts,
            "flights_info": flights_info,
            "current_shifts": current_shifts,
            "preferences": preferences or {}
        }
        
        prompt = f"""
        You are an AI assistant for aviation crew scheduling. Analyze the following data and provide intelligent shift recommendations.

        PILOT PROFILE:
        - Name: {pilot.get('name', 'Unknown')}
        - Role: {pilot.get('role', 'Unknown')}
        - Base: {pilot.get('base', 'Unknown')}
        - Experience: {pilot.get('experience_years', 'Unknown')} years
        - Aircraft Certifications: {pilot.get('aircraft_certifications', 'Unknown')}
        - Current Shifts: {len(current_shifts)}

        AVAILABLE PICKUP SHIFTS:
        {json.dumps(available_shifts, indent=2)}

        FLIGHT INFORMATION:
        {json.dumps(flights_info[:10], indent=2)}  # Limit to first 10 flights

        USER PREFERENCES:
        {json.dumps(preferences or {}, indent=2)}

        Please provide:
        1. Top 3 recommended shifts with detailed reasoning
        2. Consider factors like: pilot qualifications, base location, flight duration, aircraft type, workload balance
        3. Mention any weather or operational considerations if relevant
        4. Format as a friendly, professional response        

        Keep the response concise but informative.
        """
        
        try:
            response = genai_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=[{"role": "user", "parts": [{"text": prompt}]}]
            )
            return response.text
        except Exception as e:
            print(f"Gemini API error: {e}")
            return self.get_basic_suggestions(pilot_id, preferences)
    
    def get_basic_suggestions(self, pilot_id: str, preferences: Dict = None) -> str:
        """Fallback basic suggestions when AI is not available"""
        suggestions = self.suggest_shifts(pilot_id)
        if not suggestions:
            return "No suitable shifts available at the moment. I'll notify you when new opportunities arise!"
        
        response = "🤖 **AI Recommendations Based on Your Profile:**\n\n"
        for i, shift in enumerate(suggestions[:3], 1):
            response += f"**{i}. Flight {shift['flight_number']}** - {shift['route']}\n"
            response += f"📅 {shift['shift_date']} | ⏰ {shift['start_time']}-{shift['end_time']}\n"
            response += f"✈️ Aircraft: {shift.get('aircraft', 'N/A')} | Priority: {shift.get('priority', 'Medium')}\n"
            response += f"💡 **Why recommended:** {', '.join(shift['reasons'][:3])}\n"
            response += f"📊 **Match Score:** {shift['suggestion_score']}/100\n\n"
        
        return response
    
    def suggest_shifts(self, pilot_id: str) -> List[Dict]:
        """AI-powered shift suggestions based on pilot profile and needs"""
        if self.pickup_shifts_df.empty or self.users_df.empty:
            return []
        
        # Get pilot info
        pilot_info = self.users_df[self.users_df['id'] == pilot_id]
        if pilot_info.empty:
            return []
        
        pilot = pilot_info.iloc[0]
        available_shifts = self.get_available_pickup_shifts()
        
        # Enhanced AI logic for suggestions
        suggestions = []
        for shift in available_shifts:
            score = 0
            reasons = []
            
            # Helper function to safely get string values
            def safe_str(value, default=''):
                if pd.isna(value) or value is None:
                    return default
                return str(value)
            
            # Role compatibility (highest weight)
            pilot_role = safe_str(pilot.get('role', ''))
            shift_need = safe_str(shift.get('need', ''))
            if pilot_role and shift_need and pilot_role.lower() in shift_need.lower():
                score += 50
                reasons.append(f"Perfect match for {pilot_role} role")
            
            # Aircraft certification match
            pilot_certs = safe_str(pilot.get('aircraft_certifications', ''))
            shift_aircraft = safe_str(shift.get('aircraft', ''))
            if pilot_certs and shift_aircraft:
                cert_list = [cert.strip() for cert in pilot_certs.split(',')]
                if any(cert in shift_aircraft for cert in cert_list):
                    score += 40
                    reasons.append(f"Certified for {shift_aircraft}")
            
            # Base location preference
            pilot_base = safe_str(pilot.get('base', ''))
            shift_route = safe_str(shift.get('route', ''))
            if pilot_base and shift_route and pilot_base in shift_route:
                score += 30
                reasons.append("Departs from your home base")
            
            # Experience level matching
            experience = pilot.get('experience_years', 0)
            if pd.notna(experience) and experience > 0:
                if experience >= 10:
                    score += 20
                    reasons.append("Senior pilot - suitable for any route")
                elif experience >= 5:
                    score += 15
                    reasons.append("Good experience level")
                else:
                    score += 10
                    reasons.append("Building experience")
            
            # Priority weighting
            priority_scores = {'high': 40, 'medium': 20, 'low': 10}
            priority = safe_str(shift.get('priority', 'low'))
            priority_score = priority_scores.get(priority.lower(), 10)
            score += priority_score
            reasons.append(f"{priority.title()} priority assignment")
            
            # Date proximity (prefer sooner shifts)
            try:
                shift_date_str = safe_str(shift.get('shift_date', ''))
                if shift_date_str:
                    shift_date = datetime.strptime(shift_date_str, '%Y-%m-%d')
                    days_ahead = (shift_date - datetime.now()).days
                    if 0 <= days_ahead <= 3:
                        score += 25
                        reasons.append("Urgent - needed very soon")
                    elif 4 <= days_ahead <= 7:
                        score += 20
                        reasons.append("Coming up this week")
                    elif 8 <= days_ahead <= 14:
                        score += 15
                        reasons.append("Good planning timeline")
            except:
                pass
            
            # Flight duration consideration
            try:
                start_time = safe_str(shift.get('start_time', ''))
                end_time = safe_str(shift.get('end_time', ''))
                if start_time and end_time:
                    start = datetime.strptime(start_time, '%H:%M')
                    end = datetime.strptime(end_time, '%H:%M')
                    duration = (end - start).seconds / 3600
                    if duration <= 4:
                        score += 15
                        reasons.append("Short flight - easy workload")
                    elif duration <= 8:
                        score += 10
                        reasons.append("Standard flight duration")
            except:
                pass
            
            if score > 30:  # Lower threshold for more suggestions
                suggestions.append({
                    **shift,
                    'suggestion_score': score,
                    'reasons': reasons
                })
        
        # Sort by score
        suggestions.sort(key=lambda x: x['suggestion_score'], reverse=True)
        return suggestions[:5]  # Top 5 suggestions
    
    def process_ai_chat(self, message: str, user_context: Dict) -> str:
        """Enhanced chat processing with flight info and AI integration"""
        message = message.lower().strip()
        
        # Context-aware responses
        if any(word in message for word in ['hello', 'hi', 'hey', 'good morning', 'good afternoon']):
            return f"Hello {user_context.get('name', 'Captain')}! 👨‍✈️ How can I help you with your schedule today? I can assist with shifts, flight info, and recommendations."
        
        elif any(word in message for word in ['pickup', 'pick up', 'available shifts', 'open shifts']):
            available = self.get_available_pickup_shifts()
            if not available:
                return "I don't see any available pickup shifts right now. I'll notify you when new ones become available."
            
            response = f"🛫 **Found {len(available)} available pickup shifts:**\n\n"
            for shift in available[:5]:  # Show top 5
                flight_details = self.get_flight_details(shift['flight_number'])
                response += f"✈️ **{shift['flight_number']}** - {shift['route']}\n"
                response += f"📅 {shift['shift_date']} | ⏰ {shift['start_time']}-{shift['end_time']}\n"
                response += f"👨‍✈️ Need: {shift.get('need', 'Not specified')} | 🔴 Priority: {shift.get('priority', 'Medium')}\n"
                response += f"✈️ Aircraft: {shift.get('aircraft', 'N/A')}\n"
                if flight_details:
                    response += f"📊 Status: {flight_details.get('status', 'Unknown')}\n"
                response += "\n"
            
            response += "💡 Type a flight number to pick it up, or ask for 'AI suggestions' for personalized recommendations!"
            return response
        
        elif any(word in message for word in ['suggest', 'recommend', 'ai suggestions', 'what should', 'best for me']):
            # Extract preferences from message
            preferences = {}
            if 'short' in message or 'quick' in message:
                preferences['duration'] = 'short'
            if 'long' in message or 'international' in message:
                preferences['duration'] = 'long'
            if 'today' in message or 'urgent' in message:
                preferences['timing'] = 'urgent'
            if 'next week' in message:
                preferences['timing'] = 'planned'
            
            return self.get_ai_suggestions(user_context['id'], preferences)
        
        elif any(word in message for word in ['flight info', 'flight details', 'status of']):
            # Extract flight number from message if present
            flight_match = re.search(r'[A-Z]{2,3}[0-9]{2,4}', message.upper())
            if flight_match:
                flight_number = flight_match.group()
                flight_details = self.get_flight_details(flight_number)
                if flight_details:
                    response = f"🛫 **Flight {flight_number} Details:**\n\n"
                    response += f"🛫 Route: {flight_details.get('route', 'N/A')}\n"
                    response += f"📊 Status: {flight_details.get('status', 'Unknown')}\n"
                    response += f"✈️ Aircraft: {flight_details.get('aircraft', 'N/A')}\n"
                    response += f"⏰ Departure: {flight_details.get('departure_time', 'N/A')}\n"
                    response += f"🛬 Arrival: {flight_details.get('arrival_time', 'N/A')}\n"
                    return response
                else:
                    return f"❌ Flight {flight_number} not found in our system."
            else:
                flights = self.get_flights_info()
                if not flights:
                    return "No flight information available at the moment."
                
                response = "🛫 **Current Flight Information:**\n\n"
                for flight in flights[:5]:  # Show top 5
                    response += f"✈️ **{flight.get('flight_number', 'N/A')}**\n"
                    response += f"🛫 {flight.get('route', 'N/A')}\n"
                    response += f"📊 Status: {flight.get('status', 'Unknown')}\n"
                    response += f"✈️ Aircraft: {flight.get('aircraft', 'N/A')}\n\n"
                
                response += "💡 Ask about a specific flight by mentioning its number (e.g., 'status of AA123')"
                return response
        
        elif any(word in message for word in ['delete', 'remove', 'cancel', 'drop']):
            shifts = self.get_pilot_shifts(user_context['id'])
            if not shifts:
                return "You don't have any shifts to remove right now."
            
            # Check if specific flight mentioned
            flight_match = re.search(r'[A-Z]{2,3}[0-9]{2,4}', message.upper())
            if flight_match:
                flight_number = flight_match.group()
                return f"⚠️ Are you sure you want to cancel flight {flight_number}? This action cannot be undone. (Type 'yes' to confirm)"
            
            response = "📋 **Your current shifts:**\n\n"
            for shift in shifts:
                response += f"✈️ {shift['flight_number']} - {shift['shift_date']} ({shift.get('route', 'N/A')})\n"
            
            response += "\n💡 Specify which flight to cancel (e.g., 'cancel AA123')"
            return response
        
        elif any(word in message for word in ['schedule', 'shifts', 'my flights', 'my schedule']):
            shifts = self.get_pilot_shifts(user_context['id'])
            if not shifts:
                return "✅ Your schedule is clear! No flights assigned at the moment. Ready for some pickup shifts?"
            
            response = f"📋 **Your upcoming schedule ({len(shifts)} flights):**\n\n"
            sorted_shifts = sorted(shifts, key=lambda x: x.get('shift_date', ''))
            for shift in sorted_shifts:
                flight_details = self.get_flight_details(shift['flight_number'])
                response += f"✈️ **{shift['flight_number']}**\n"
                response += f"📅 {shift['shift_date']} | ⏰ {shift['start_time']}-{shift['end_time']}\n"
                response += f"🛫 {shift.get('route', 'N/A')}\n"
                response += f"✈️ {shift.get('aircraft', 'N/A')}\n"
                if flight_details:
                    response += f"📊 Status: {flight_details.get('status', 'Scheduled')}\n"
                response += "\n"
            
            return response
        
        elif re.search(r'[A-Z]{2,3}[0-9]{2,4}', message.upper()):
            # Flight number mentioned - check if it's for pickup
            flight_match = re.search(r'[A-Z]{2,3}[0-9]{2,4}', message.upper())
            flight_number = flight_match.group()
            
            # Check if it's an available pickup shift
            available_shifts = self.get_available_pickup_shifts()
            for shift in available_shifts:
                if shift['flight_number'].upper() == flight_number:
                    return f"🛫 **Ready to pick up {flight_number}?**\n\n📅 Date: {shift['shift_date']}\n⏰ Time: {shift['start_time']}-{shift['end_time']}\n🛫 Route: {shift['route']}\n👨‍✈️ Need: {shift.get('need', 'Not specified')}\n\n✅ Type 'yes' to confirm pickup or 'no' to cancel"
            
            return f"Flight {flight_number} is not available for pickup. Check available shifts or flight info."
        
        elif any(word in message for word in ['help', 'what can you do', 'commands', 'assist']):
            return ("🤖 **I'm your AI Aviation Assistant!** Here's what I can help you with:\n\n"
                   "📋 **Schedule Management:**\n"
                   "• 'show my schedule' - View your current flights\n"
                   "• 'available shifts' - See pickup opportunities\n"
                   "• 'cancel AA123' - Remove a specific flight\n\n"
                   "🛫 **Flight Information:**\n"
                   "• 'flight info' - Current flight status\n"
                   "• 'status of AA123' - Specific flight details\n\n"
                   "🤖 **AI Features:**\n"
                   "• 'AI suggestions' - Personalized recommendations\n"
                   "• 'suggest short flights' - Preference-based matching\n\n"
                   "✈️ **Quick Actions:**\n"
                   "• Type any flight number to pick it up\n"
                   "• Natural language questions work too!")
        
        else:
            # Use Gemini for complex queries if available
            if genai_client:
                try:
                    system_prompt = f"""You are an AI assistant for aviation crew scheduling. 
                    Help the pilot with their query about scheduling, flights, or aviation-related questions.
                    Keep responses professional, concise, and helpful.
                    
                    Pilot Context: {user_context.get('name', 'Pilot')} - {user_context.get('role', 'Unknown role')}
                    Base: {user_context.get('base', 'Unknown')}
                    
                    User Query: {message}"""
                    
                    response = genai_client.models.generate_content(
                        model="gemini-2.0-flash",
                        contents=[{"role": "user", "parts": [{"text": system_prompt}]}]
                    )
                    return response.text
                except Exception as e:
                    print(f"Gemini error: {e}")
            
            return ("I understand you're asking about your schedule. I can help you with:\n"
                   "• 📋 View your current schedule and flights\n"
                   "• ✈️ Find and pick up available shifts\n"
                   "• 🤖 Get AI-powered personalized recommendations\n"
                   "• ❌ Cancel or modify existing flights\n"
                   "• 📊 Check detailed flight information and status\n"
                   "• 🌤️ Weather and operational considerations\n\n"
                   "What would you like to do? You can ask naturally or mention specific flight numbers!")

# Initialize the AI scheduler
scheduler_ai = CrewSchedulerAI()

# Routes
@app.route('/')
def index():
    # Directly load the 4th user (index 3) from CSV and go to dashboard
    user = scheduler_ai.get_user_by_index(3)  # 4th user (0-based indexing)
    
    session.clear()
    session['user'] = user
    session.permanent = True
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
def dashboard():
    # Always ensure we have a user - get 4th user if session is empty
    if 'user' not in session:
        user = scheduler_ai.get_user_by_index(3)
        session['user'] = user
        session.permanent = True
    else:
        user = session['user']
    
    shifts = scheduler_ai.get_pilot_shifts(user['id'])
    pickup_shifts = scheduler_ai.get_available_pickup_shifts()
    flight_info = scheduler_ai.get_flights_info()
    suggestions = scheduler_ai.suggest_shifts(user['id'])
    
    today = datetime.now().strftime('%Y-%m-%d')
    stats = {
        'total_shifts': len(shifts),
        'upcoming_shifts': len([s for s in shifts if s.get('shift_date', '') >= today]),
        'available_pickups': len(pickup_shifts),
        'suggestions': len(suggestions)
    }
    
    return render_template('dashboard.html', 
                         user=user, 
                         shifts=shifts, 
                         pickup_shifts=pickup_shifts,
                         flight_info=flight_info,
                         suggestions=suggestions,
                         stats=stats)

@app.route('/api/chat', methods=['POST'])
def api_chat():
    # Ensure we have a user - get 4th user if session is empty
    if 'user' not in session:
        user = scheduler_ai.get_user_by_index(3)
        session['user'] = user
        session.permanent = True
    else:
        user = session['user']
    
    message = request.json.get('message', '').strip()
    
    if not message:
        return jsonify({'error': 'Empty message'}), 400
    
    # Handle confirmation responses
    if session.get('pending_action'):
        action = session.pop('pending_action')
        
        if action['type'] == 'pickup_confirm' and message.lower() in ['yes', 'y', 'confirm', 'ok']:
            success = scheduler_ai.pickup_shift(user['id'], action['shift_id'])
            if success:
                return jsonify({'response': f"✅ **Success!** You've picked up flight {action['flight_number']}!\n\n📋 The shift has been added to your schedule and saved to the system.\n💡 Check your dashboard to see the updated schedule."})
            else:
                return jsonify({'response': "❌ **Failed to pick up shift.** It may no longer be available or there was a system error. Please try again or contact support."})
        
        elif action['type'] == 'delete_confirm' and message.lower() in ['yes', 'y', 'confirm', 'ok']:
            success = scheduler_ai.delete_shift(user['id'], action['flight_number'])
            if success:
                return jsonify({'response': f"✅ **Flight {action['flight_number']} cancelled successfully!**\n\n📋 The shift has been removed from your schedule and the changes have been saved.\n💡 This shift is now available for other pilots to pick up."})
            else:
                return jsonify({'response': "❌ **Failed to cancel shift.** The flight may not exist in your schedule or there was a system error. Please check your schedule and try again."})
        
        elif message.lower() in ['no', 'n', 'cancel', 'abort']:
            return jsonify({'response': "✅ **Action cancelled.** No changes have been made to your schedule."})
    
    # Check for flight numbers in message for pickup
    import re
    flight_match = re.search(r'([A-Z]{2,3}[0-9]{2,4})', message.upper())
    if flight_match:
        flight_number = flight_match.group(1)
        
        # Check if it's an available pickup shift
        pickup_shifts = scheduler_ai.get_available_pickup_shifts()
        for shift in pickup_shifts:
            if shift['flight_number'].upper() == flight_number:
                # Get additional flight details
                flight_details = scheduler_ai.get_flight_details(flight_number)
                session['pending_action'] = {
                    'type': 'pickup_confirm',
                    'shift_id': shift['id'],
                    'flight_number': flight_number
                }
                
                response = f"🛫 **Ready to pick up Flight {flight_number}?**\n\n"
                response += f"📅 **Date:** {shift['shift_date']}\n"
                response += f"⏰ **Time:** {shift['start_time']} - {shift['end_time']}\n"
                response += f"🛫 **Route:** {shift['route']}\n"
                response += f"✈️ **Aircraft:** {shift.get('aircraft', 'N/A')}\n"
                response += f"👨‍✈️ **Position Needed:** {shift.get('need', 'Not specified')}\n"
                response += f"🔴 **Priority:** {shift.get('priority', 'Medium')}\n"
                
                if flight_details:
                    response += f"📊 **Flight Status:** {flight_details.get('status', 'Scheduled')}\n"
                
                # Calculate flight duration
                try:
                    from datetime import datetime
                    start = datetime.strptime(shift['start_time'], '%H:%M')
                    end = datetime.strptime(shift['end_time'], '%H:%M')
                    duration = (end - start).seconds / 3600
                    response += f"⏱️ **Duration:** {duration:.1f} hours\n"
                except:
                    pass
                
                response += f"\n✅ **Type 'yes' to confirm pickup** or 'no' to cancel"
                return jsonify({'response': response})
        
        # Check if it's for deletion from user's shifts
        if any(word in message.lower() for word in ['cancel', 'delete', 'remove', 'drop']):
            user_shifts = scheduler_ai.get_pilot_shifts(user['id'])
            for shift in user_shifts:
                if shift['flight_number'].upper() == flight_number:
                    session['pending_action'] = {
                        'type': 'delete_confirm',
                        'flight_number': flight_number
                    }
                    
                    response = f"⚠️ **Confirm Cancellation of Flight {flight_number}**\n\n"
                    response += f"📅 **Date:** {shift['shift_date']}\n"
                    response += f"⏰ **Time:** {shift['start_time']} - {shift['end_time']}\n"
                    response += f"🛫 **Route:** {shift.get('route', 'N/A')}\n"
                    response += f"\n🚨 **Warning:** This action cannot be undone. The shift will be removed from your schedule and made available for other pilots.\n"
                    response += f"\n✅ **Type 'yes' to confirm cancellation** or 'no' to keep the shift"
                    return jsonify({'response': response})
            
            return jsonify({'response': f"❌ Flight {flight_number} not found in your current schedule. Use 'my schedule' to see your flights."})
    
    # Process with enhanced AI
    try:
        response = scheduler_ai.process_ai_chat(message, user)
        return jsonify({'response': response})
    except Exception as e:
        print(f"Error in chat processing: {e}")
        return jsonify({'response': "❌ Sorry, I encountered an error processing your request. Please try again or contact support if the issue persists."})

@app.route('/api/flights/<flight_number>')
def get_flight_info(flight_number):
    """API endpoint to get specific flight information"""
    if 'user' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    flight_details = scheduler_ai.get_flight_details(flight_number.upper())
    if flight_details:
        return jsonify({'flight': flight_details})
    else:
        return jsonify({'error': 'Flight not found'}), 404

@app.route('/api/pickup/<shift_id>', methods=['POST'])
def pickup_shift_api(shift_id):
    """API endpoint to pick up a shift"""
    if 'user' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = session['user']
    success = scheduler_ai.pickup_shift(user['id'], shift_id)
    
    if success:
        return jsonify({'success': True, 'message': 'Shift picked up successfully'})
    else:
        return jsonify({'success': False, 'message': 'Failed to pick up shift'})

@app.route('/api/cancel/<flight_number>', methods=['DELETE'])
def cancel_shift_api(flight_number):
    """API endpoint to cancel a shift"""
    if 'user' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = session['user']
    success = scheduler_ai.delete_shift(user['id'], flight_number.upper())
    
    if success:
        return jsonify({'success': True, 'message': 'Shift cancelled successfully'})
    else:
        return jsonify({'success': False, 'message': 'Failed to cancel shift'})

@app.route('/api/suggestions')
def get_suggestions():
    """API endpoint to get AI suggestions"""
    if 'user' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    user = session['user']
    preferences = request.args.to_dict()  # Get preferences from query parameters
    
    suggestions_text = scheduler_ai.get_ai_suggestions(user['id'], preferences)
    suggestions_data = scheduler_ai.suggest_shifts(user['id'])
    
    return jsonify({
        'suggestions_text': suggestions_text,
        'suggestions_data': suggestions_data
    })

@app.route('/api/refresh_data', methods=['POST'])
def refresh_data():
    """API endpoint to refresh data from CSV files"""
    if 'user' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        scheduler_ai.load_data()
        return jsonify({'success': True, 'message': 'Data refreshed successfully'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to refresh data: {str(e)}'})

if __name__ == '__main__':
    print("🚁 Aviation Crew Scheduler AI Starting...")
    print("🤖 AI Features:", "Enabled" if genai_client else "Disabled (Set GEMINI_API_KEY)")
    print("📊 Loading data from CSV files...")
    
    # Create app directory if it doesn't exist
    os.makedirs('app', exist_ok=True)
    
    app.run(debug=True, host='0.0.0.0', port=5000)