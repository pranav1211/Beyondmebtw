import json
import os
import re
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

class KeywordChatbot:
    def __init__(self, data_file_path: str = "data.json"):
        """
        Initialize keyword-based chatbot with data file.
        
        Args:
            data_file_path (str): Path to the data.json file (now in root directory)
        """
        self.data_file_path = data_file_path
        self.aviation_data = self._load_aviation_data()
        
        # Enhanced keyword patterns for different queries
        self.keyword_patterns = {
            'schedule': ['schedule', 'shift', 'duty', 'when', 'time', 'today', 'tomorrow', 'next', 'my duties', 'assigned', 'roster', 'work', 'upcoming'],
            'flight': ['flight', 'trip', 'departure', 'arrival', 'gate', 'aircraft', 'plane', 'takeoff', 'landing', 'route', 'destination'],
            'crew': ['crew', 'staff', 'pilot', 'steward', 'ground', 'team', 'colleague', 'captain', 'first officer', 'attendant', 'members'],
            'status': ['status', 'available', 'busy', 'free', 'working', 'off', 'duty status', 'current status', 'on duty', 'off duty'],
            'weather': ['weather', 'forecast', 'rain', 'wind', 'storm', 'clear', 'conditions', 'visibility', 'temperature'],
            'help': ['help', 'how', 'what', 'explain', 'guide', 'instructions', 'commands', 'usage', 'manual'],
            'greeting': ['hello', 'hi', 'good morning', 'good afternoon', 'good evening', 'hey', 'greetings', 'howdy'],
            'available_shifts': ['available shifts', 'open shifts', 'pickup', 'extra work', 'overtime', 'volunteer', 'vacant', 'need crew'],
            'conflicts': ['conflict', 'overlap', 'double booking', 'clash', 'problem', 'issue', 'scheduling conflict'],
            'aircraft': ['aircraft', 'airplane', 'plane', 'fleet', 'maintenance', 'airworthy', 'registration', 'tail number'],
            'airports': ['airport', 'destination', 'origin', 'hub', 'base', 'terminal', 'gate', 'runway'],
            'time_off': ['time off', 'vacation', 'leave', 'sick', 'personal', 'holiday', 'absent', 'pto', 'break'],
            'training': ['training', 'recurrent', 'certification', 'license', 'currency', 'check ride', 'simulator', 'course'],
            'emergency': ['emergency', 'urgent', 'critical', 'mayday', 'pan pan', 'alert', 'help needed'],
            'admin': ['add', 'remove', 'delete', 'create', 'assign', 'unassign', 'modify', 'update crew', 'edit'],
            'pay': ['pay', 'salary', 'wage', 'payment', 'payroll', 'earnings', 'compensation'],
            'overtime': ['overtime', 'ot', 'extra hours', 'additional pay', 'double time'],
            'swap': ['swap', 'trade', 'exchange', 'switch', 'change shift'],
            'location': ['where', 'location', 'base', 'station', 'hangar', 'terminal'],
            'contact': ['contact', 'phone', 'email', 'reach', 'call', 'message']
        }
        
        # Define response templates
        self.response_templates = {
            'schedule': self._handle_schedule_query,
            'flight': self._handle_flight_query,
            'crew': self._handle_crew_query,
            'status': self._handle_status_query,
            'weather': self._handle_weather_query,
            'help': self._handle_help_query,
            'greeting': self._handle_greeting,
            'available_shifts': self._handle_available_shifts,
            'conflicts': self._handle_conflicts,
            'aircraft': self._handle_aircraft_query,
            'airports': self._handle_airports_query,
            'time_off': self._handle_time_off_query,
            'training': self._handle_training_query,
            'emergency': self._handle_emergency,
            'admin': self._handle_admin_commands,
            'pay': self._handle_pay_query,
            'overtime': self._handle_overtime_query,
            'swap': self._handle_swap_query,
            'location': self._handle_location_query,
            'contact': self._handle_contact_query,
            'default': self._handle_default_query
        }
    
    def _load_aviation_data(self) -> Dict[str, Any]:
        """Load aviation data from JSON file."""
        try:
            if os.path.exists(self.data_file_path):
                with open(self.data_file_path, 'r', encoding='utf-8') as file:
                    data = json.load(file)
                    print(f"✅ Successfully loaded data from {self.data_file_path}")
                    return data
            else:
                error_msg = f"❌ Error: {self.data_file_path} not found. Please ensure the data file exists."
                print(error_msg)
                return {"error": error_msg, "loaded": False}
        except json.JSONDecodeError as e:
            error_msg = f"❌ Error: Invalid JSON format in {self.data_file_path}: {str(e)}"
            print(error_msg)
            return {"error": error_msg, "loaded": False}
        except Exception as e:
            error_msg = f"❌ Error loading data file: {str(e)}"
            print(error_msg)
            return {"error": error_msg, "loaded": False}
    
    def _save_data(self) -> bool:
        """Save current data to JSON file."""
        try:
            with open(self.data_file_path, 'w', encoding='utf-8') as file:
                json.dump(self.aviation_data, file, indent=2, ensure_ascii=False)
            print(f"✅ Data saved to {self.data_file_path}")
            return True
        except Exception as e:
            print(f"❌ Error saving data: {e}")
            return False
    
    def _detect_intent(self, message: str) -> str:
        """Detect user intent based on keywords with priority."""
        message_lower = message.lower()
        
        # Check for edit/admin commands first (highest priority)
        if any(word in message_lower for word in ['add', 'create', 'remove', 'delete', 'update', 'change', 'assign', 'unassign']):
            return 'admin'
        
        # Check for emergency keywords (high priority)
        if any(word in message_lower for word in self.keyword_patterns['emergency']):
            return 'emergency'
        
        # Check other intents by priority
        intent_priorities = [
            'available_shifts', 'conflicts', 'schedule', 'flight', 
            'aircraft', 'crew', 'status', 'time_off', 'training',
            'airports', 'weather', 'pay', 'overtime', 'swap',
            'location', 'contact', 'greeting', 'help'
        ]
        
        for intent in intent_priorities:
            if any(keyword in message_lower for keyword in self.keyword_patterns[intent]):
                return intent
        
        return 'default'
    
    def _find_user_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Find user data by name from users array."""
        for user in self.aviation_data.get('users', []):
            if user.get('name', '').lower() == name.lower():
                return user
        return None
    
    def _find_crew_member_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Find crew member by name."""
        for crew in self.aviation_data.get('crew_members', []):
            if crew.get('name', '').lower() == name.lower():
                return crew
        return None
    
    def _get_user_schedules(self, user_name: str) -> List[Dict[str, Any]]:
        """Get all schedules for a user."""
        schedules = []
        
        # Find crew member
        crew_member = self._find_crew_member_by_name(user_name)
        if not crew_member:
            return []
        
        crew_id = crew_member.get('id')
        
        # Get shifts
        for shift in self.aviation_data.get('shifts', []):
            if shift.get('crew_id') == crew_id:
                schedules.append({
                    'type': 'shift',
                    'data': shift,
                    'datetime': self._parse_shift_datetime(shift)
                })
        
        # Get flight assignments
        for schedule in self.aviation_data.get('schedules', []):
            for crew_assignment in schedule.get('crew_assignments', []):
                if crew_assignment.get('crew_id') == crew_id:
                    flight = self._get_flight_by_id(schedule.get('flight_id'))
                    if flight:
                        schedules.append({
                            'type': 'flight',
                            'data': flight,
                            'assignment': crew_assignment,
                            'datetime': self._parse_flight_datetime(flight)
                        })
        
        # Sort by datetime
        schedules.sort(key=lambda x: x.get('datetime', datetime.min))
        return schedules
    
    def _parse_shift_datetime(self, shift: Dict[str, Any]) -> datetime:
        """Parse shift datetime."""
        try:
            date_str = shift.get('shift_date', '')
            time_str = shift.get('start_time', '00:00')
            datetime_str = f"{date_str} {time_str}"
            return datetime.strptime(datetime_str, '%Y-%m-%d %H:%M')
        except:
            return datetime.min
    
    def _parse_flight_datetime(self, flight: Dict[str, Any]) -> datetime:
        """Parse flight datetime."""
        try:
            departure_time = flight.get('departure_time', '')
            if 'T' in departure_time:
                return datetime.fromisoformat(departure_time.replace('Z', ''))
            else:
                return datetime.strptime(departure_time, '%Y-%m-%d %H:%M:%S')
        except:
            return datetime.min
    
    def _get_flight_by_id(self, flight_id: str) -> Optional[Dict[str, Any]]:
        """Get flight by ID."""
        for flight in self.aviation_data.get('flights', []):
            if flight.get('id') == flight_id:
                return flight
        return None
    
    def _handle_schedule_query(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle schedule-related queries with enhanced details."""
        if "error" in self.aviation_data:
            return {"text": self.aviation_data["error"], "suggestions": ["Check data file", "Contact admin"]}
        
        user_name = user.get('name', 'User')
        schedules = self._get_user_schedules(user_name)
        
        today = datetime.now().date()
        
        if 'today' in message.lower():
            today_schedules = [s for s in schedules if s.get('datetime', datetime.min).date() == today]
            text = self._format_schedule_response(today_schedules, f"Today's Schedule for {user_name}")
        elif 'tomorrow' in message.lower():
            tomorrow = today + timedelta(days=1)
            tomorrow_schedules = [s for s in schedules if s.get('datetime', datetime.min).date() == tomorrow]
            text = self._format_schedule_response(tomorrow_schedules, f"Tomorrow's Schedule for {user_name}")
        elif 'week' in message.lower():
            week_end = today + timedelta(days=7)
            week_schedules = [s for s in schedules if today <= s.get('datetime', datetime.min).date() <= week_end]
            text = self._format_schedule_response(week_schedules, f"This Week's Schedule for {user_name}")
        else:
            # Show next 5 upcoming items
            now = datetime.now()
            upcoming = [s for s in schedules if s.get('datetime', datetime.min) >= now][:5]
            text = self._format_schedule_response(upcoming, f"Upcoming Schedule for {user_name}")
        
        suggestions = self._get_schedule_suggestions(user.get('role', 'user'))
        return {"text": text, "suggestions": suggestions}
    
    def _format_schedule_response(self, schedules: List[Dict[str, Any]], title: str) -> str:
        """Format schedule response."""
        if not schedules:
            return f"{title}:\n\n📅 No scheduled duties found."
        
        text = f"{title}:\n\n"
        
        for i, schedule in enumerate(schedules, 1):
            if schedule['type'] == 'shift':
                shift = schedule['data']
                dt = schedule['datetime']
                text += f"{i}. 🔄 **{shift.get('shift_type', 'Shift')}**\n"
                text += f"   📅 {dt.strftime('%A, %B %d, %Y')}\n"
                text += f"   ⏰ {shift.get('start_time')} - {shift.get('end_time')}\n"
                text += f"   📍 {shift.get('location', 'Not specified')}\n"
                text += f"   📋 Status: {shift.get('status', 'Unknown')}\n\n"
            
            elif schedule['type'] == 'flight':
                flight = schedule['data']
                assignment = schedule['assignment']
                dt = schedule['datetime']
                text += f"{i}. ✈️ **Flight {flight.get('flight_number')}**\n"
                text += f"   📅 {dt.strftime('%A, %B %d, %Y')}\n"
                text += f"   🛫 {flight.get('origin')} → {flight.get('destination')}\n"
                text += f"   ⏰ Departure: {dt.strftime('%H:%M')}\n"
                text += f"   👨‍✈️ Role: {assignment.get('role', 'Crew Member')}\n"
                text += f"   📋 Status: {flight.get('status', 'Scheduled')}\n\n"
        
        return text.strip()
    
    def _get_schedule_suggestions(self, role: str) -> List[str]:
        """Get schedule-specific suggestions based on role."""
        base_suggestions = ["View today", "View tomorrow", "View week", "Check conflicts"]
        
        role_suggestions = {
            'pilot': ["Flight details", "Aircraft info", "Weather", "Available flights"],
            'steward': ["Passenger info", "Service notes", "Available shifts", "Swap shifts"],
            'ground_crew': ["Equipment status", "Maintenance schedule", "Available shifts"],
            'admin': ["Manage schedules", "Assign crew", "View all conflicts", "Generate reports"]
        }
        
        return base_suggestions + role_suggestions.get(role, ["Available shifts", "Contact scheduler"])
    
    def _handle_available_shifts(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle available shifts queries."""
        if "error" in self.aviation_data:
            return {"text": self.aviation_data["error"], "suggestions": ["Check data file", "Contact admin"]}
        
        user_role = user.get('role', 'user')
        available_shifts = []
        
        # Find unassigned shifts
        for shift in self.aviation_data.get('shifts', []):
            if not shift.get('crew_id') and shift.get('status') == 'scheduled':
                if self._shift_matches_role(shift, user_role):
                    available_shifts.append(shift)
        
        # Find flights needing crew
        flight_opportunities = []
        for schedule in self.aviation_data.get('schedules', []):
            crew_assignments = schedule.get('crew_assignments', [])
            if len(crew_assignments) < self._get_required_crew_count(schedule):
                flight = self._get_flight_by_id(schedule.get('flight_id'))
                if flight:
                    flight_opportunities.append({
                        'flight': flight,
                        'schedule': schedule,
                        'roles_needed': self._get_roles_needed(schedule, user_role)
                    })
        
        text = f"🔍 Available opportunities for {user_role}:\n\n"
        
        if available_shifts:
            text += "🔄 **Available Shifts:**\n"
            for i, shift in enumerate(available_shifts[:5], 1):
                dt = self._parse_shift_datetime(shift)
                text += f"{i}. {shift.get('shift_type')} - {dt.strftime('%m/%d %H:%M')}\n"
                text += f"   📍 {shift.get('location', 'Not specified')}\n"
                text += f"   💰 Pay: ${shift.get('pay_rate', 'TBD')}/hour\n\n"
        
        if flight_opportunities:
            text += "✈️ **Flight Opportunities:**\n"
            for i, opp in enumerate(flight_opportunities[:5], 1):
                flight = opp['flight']
                dt = self._parse_flight_datetime(flight)
                text += f"{i}. Flight {flight.get('flight_number')} - {dt.strftime('%m/%d %H:%M')}\n"
                text += f"   🛫 {flight.get('origin')} → {flight.get('destination')}\n"
                text += f"   👥 Roles needed: {', '.join(opp['roles_needed'])}\n\n"
        
        if not available_shifts and not flight_opportunities:
            text += "📭 No available opportunities at this time.\n"
            text += "Check back later or contact your scheduler for updates."
        
        suggestions = ["Pick up shift", "View requirements", "Contact scheduler", "Set availability", "View pay rates"]
        return {"text": text.strip(), "suggestions": suggestions}
    
    def _shift_matches_role(self, shift: Dict[str, Any], user_role: str) -> bool:
        """Check if shift matches user role."""
        shift_type = shift.get('shift_type', '').lower()
        required_roles = shift.get('required_roles', [])
        
        if required_roles:
            return user_role in required_roles
        
        # Basic matching based on shift type
        role_mappings = {
            'pilot': ['flight', 'cockpit', 'captain', 'first officer'],
            'steward': ['cabin', 'service', 'passenger', 'attendant'],
            'ground_crew': ['ground', 'maintenance', 'baggage', 'fuel'],
            'admin': ['admin', 'management', 'dispatch']
        }
        
        user_keywords = role_mappings.get(user_role, [])
        return any(keyword in shift_type for keyword in user_keywords)
    
    def _get_required_crew_count(self, schedule: Dict[str, Any]) -> int:
        """Get required crew count for a flight."""
        # This would typically be based on aircraft type, flight duration, etc.
        return 4  # Default: 2 pilots + 2 flight attendants
    
    def _get_roles_needed(self, schedule: Dict[str, Any], user_role: str = None) -> List[str]:
        """Get roles needed for a flight."""
        current_assignments = schedule.get('crew_assignments', [])
        current_roles = [assignment.get('role') for assignment in current_assignments]
        
        required_roles = ['captain', 'first_officer', 'flight_attendant', 'flight_attendant']
        needed_roles = []
        
        for role in required_roles:
            if role not in current_roles:
                needed_roles.append(role)
        
        # Filter by user role if specified
        if user_role:
            role_mappings = {
                'pilot': ['captain', 'first_officer'],
                'steward': ['flight_attendant'],
                'ground_crew': ['ground_crew']
            }
            user_applicable_roles = role_mappings.get(user_role, [])
            needed_roles = [role for role in needed_roles if role in user_applicable_roles]
        
        return needed_roles
    
    def _handle_pay_query(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle pay-related queries."""
        user_name = user.get('name', 'User')
        user_role = user.get('role', 'user')
        
        # Mock pay data - in real system this would come from payroll
        pay_rates = {
            'pilot': {'base': 85, 'overtime': 127.50, 'holiday': 170},
            'steward': {'base': 35, 'overtime': 52.50, 'holiday': 70},
            'ground_crew': {'base': 25, 'overtime': 37.50, 'holiday': 50},
            'admin': {'base': 40, 'overtime': 60, 'holiday': 80}
        }
        
        rates = pay_rates.get(user_role, pay_rates['ground_crew'])
        
        text = f"💰 **Pay Information for {user_name}:**\n\n"
        text += f"💵 Base Rate: ${rates['base']}/hour\n"
        text += f"⏰ Overtime Rate: ${rates['overtime']}/hour (1.5x)\n"
        text += f"🎉 Holiday Rate: ${rates['holiday']}/hour (2x)\n\n"
        
        # Add recent earnings summary (mock data)
        text += "📊 **Recent Earnings:**\n"
        text += f"This Month: $3,240 (projected)\n"
        text += f"Last Month: $2,980\n"
        text += f"YTD: $16,750\n"
        
        suggestions = ["View payslip", "Overtime opportunities", "Holiday schedule", "Tax info", "Direct deposit"]
        return {"text": text, "suggestions": suggestions}
    
    def _handle_overtime_query(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle overtime-related queries."""
        text = "⏰ **Overtime Opportunities:**\n\n"
        text += "🔍 Current overtime shifts available:\n"
        text += "• Weekend maintenance shift - Saturday 6AM-6PM\n"
        text += "• Holiday coverage - Memorial Day\n"
        text += "• Emergency standby - On-call this week\n\n"
        text += "💡 **Overtime Rules:**\n"
        text += "• 1.5x pay after 40 hours/week\n"
        text += "• 2x pay on holidays\n"
        text += "• Maximum 60 hours/week per regulations\n"
        
        suggestions = ["Sign up for OT", "View OT history", "Check regulations", "Calculate pay", "Set preferences"]
        return {"text": text, "suggestions": suggestions}
    
    def _handle_swap_query(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle shift swap requests."""
        text = "🔄 **Shift Swap Center:**\n\n"
        text += "📋 **Your shifts available for swap:**\n"
        text += "• June 15 - Morning shift (6AM-2PM)\n"
        text += "• June 20 - Flight AA123 (Captain)\n\n"
        text += "🔍 **Requested swaps from others:**\n"
        text += "• Lisa Wong wants to swap June 18 evening shift\n"
        text += "• Mike Chen looking for weekend coverage\n\n"
        text += "⚠️ All swaps must be approved by scheduling."
        
        suggestions = ["Post swap request", "Browse swaps", "Accept swap", "Swap history", "Contact scheduler"]
        return {"text": text, "suggestions": suggestions}
    
    def _handle_location_query(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle location-related queries."""
        text = "📍 **Location Information:**\n\n"
        text += "🏢 **Main Hub:** Terminal A, Gate A1-A20\n"
        text += "🔧 **Maintenance:** Hangar 3, Bay 1-4\n"
        text += "👥 **Crew Room:** Terminal A, Level 2\n"
        text += "☕ **Break Areas:** Gates A10, B15, C8\n"
        text += "🚗 **Parking:** Employee Lot E, Level P2\n"
        
        suggestions = ["Get directions", "Parking info", "Facility map", "Contact info", "Emergency exits"]
        return {"text": text, "suggestions": suggestions}
    
    def _handle_contact_query(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle contact information queries."""
        text = "📞 **Important Contacts:**\n\n"
        text += "🗓️ **Scheduling:** (555) 123-4567\n"
        text += "🏥 **Medical:** (555) 123-4568\n"
        text += "🔧 **Maintenance:** (555) 123-4569\n"
        text += "🚨 **Emergency:** 911 or (555) 123-4570\n"
        text += "💰 **Payroll:** (555) 123-4571\n"
        text += "👥 **HR:** (555) 123-4572\n"
        
        suggestions = ["Call scheduling", "Email HR", "Report issue", "Emergency contact", "Directory"]
        return {"text": text, "suggestions": suggestions}
    
    def _handle_conflicts(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle scheduling conflicts queries."""
        if "error" in self.aviation_data:
            return {"text": self.aviation_data["error"], "suggestions": ["Check data file", "Contact admin"]}
        
        user_name = user.get('name', 'User')
        schedules = self._get_user_schedules(user_name)
        conflicts = self._detect_schedule_conflicts(schedules)
        
        if conflicts:
            text = f"⚠️ **Schedule conflicts found for {user_name}:**\n\n"
            for i, conflict in enumerate(conflicts, 1):
                text += f"{i}. {conflict['description']}\n"
                text += f"   📅 {conflict['date']}\n"
                text += f"   ⚠️ {conflict['type']}\n\n"
            text += "Please contact your scheduler to resolve these conflicts."
        else:
            text = f"✅ **No scheduling conflicts found for {user_name}.**\n\n"
            text += "Your schedule looks good! All duties are properly spaced."
        
        suggestions = ["Contact scheduler", "View full schedule", "Request change", "Check availability"]
        return {"text": text, "suggestions": suggestions}
    
    def _detect_schedule_conflicts(self, schedules: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """Detect conflicts in user schedules."""
        conflicts = []
        
        for i in range(len(schedules)):
            for j in range(i + 1, len(schedules)):
                schedule1 = schedules[i]
                schedule2 = schedules[j]
                
                # Check for time overlap
                dt1 = schedule1.get('datetime', datetime.min)
                dt2 = schedule2.get('datetime', datetime.min)
                
                # If within 2 hours of each other, flag as potential conflict
                if abs((dt1 - dt2).total_seconds()) < 7200:  # 2 hours
                    conflicts.append({
                        'date': dt1.strftime('%Y-%m-%d'),
                        'type': 'Time overlap',
                        'description': f"{schedule1['type']} and {schedule2['type']} too close together"
                    })
        
        return conflicts
    
    # Add other handler methods here (weather, aircraft, etc.)
    def _handle_weather_query(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle weather queries."""
        text = "🌤️ **Current Weather Conditions:**\n\n"
        text += "🌡️ Temperature: 72°F (22°C)\n"
        text += "💨 Wind: 10 kts from 270°\n"
        text += "☁️ Conditions: Partly cloudy\n"
        text += "👁️ Visibility: 10+ miles\n"
        text += "📊 Pressure: 30.12 inHg\n\n"
        text += "⚠️ Weather alerts: None\n"
        text += "🔮 Forecast: Fair conditions expected"
        
        suggestions = ["Detailed forecast", "Flight weather", "Airport conditions", "Weather alerts", "Historical data"]
        return {"text": text, "suggestions": suggestions}
    
    def _handle_aircraft_query(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle aircraft queries."""
        if "error" in self.aviation_data:
            return {"text": self.aviation_data["error"], "suggestions": ["Check data file", "Contact admin"]}
        
        aircraft_list = self.aviation_data.get('aircraft', [])
        
        if 'maintenance' in message.lower():
            maintenance_aircraft = [a for a in aircraft_list if a.get('status') == 'maintenance']
            if maintenance_aircraft:
                text = "🔧 **Aircraft in maintenance:**\n\n"
                for ac in maintenance_aircraft:
                    text += f"• {ac.get('registration')} ({ac.get('type')})\n"
                    text += f"  📍 Location: {ac.get('location', 'Unknown')}\n\n"
            else:
                text = "✅ No aircraft currently in maintenance."
        else:
            text = f"✈️ **Fleet Status:**\n\n"
            active_count = len([a for a in aircraft_list if a.get('status') == 'active'])
            maintenance_count = len([a for a in aircraft_list if a.get('status') == 'maintenance'])
            
            text += f"🟢 Active: {active_count} aircraft\n"
            text += f"🔧 Maintenance: {maintenance_count} aircraft\n"
            text += f"📊 Total Fleet: {len(aircraft_list)} aircraft\n"
        
        suggestions = ["Fleet status", "Maintenance schedule", "Aircraft details", "Availability", "Performance data"]
        return {"text": text, "suggestions": suggestions}
    
    def _handle_airports_query(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle airport-related queries."""
        text = "🛫 **Airport Information:**\n\n"
        text += "🏠 **Home Base:** JFK International\n"
        text += "📍 **Hub Airports:**\n"
        text += "• JFK - New York (Primary Hub)\n"
        text += "• LAX - Los Angeles (West Coast Hub)\n"
        text += "• ORD - Chicago (Central Hub)\n\n"
        text += "🌍 **Destinations:** 150+ airports worldwide\n"
        text += "✈️ **Daily Operations:** 200+ flights\n"
        
        suggestions = ["Airport codes", "Destination list", "Hub information", "Ground services", "Terminal maps"]
        return {"text": text, "suggestions": suggestions}
    
    def _handle_time_off_query(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle time off requests and queries."""
        user_name = user.get('name', 'User')
        
        text = f"🏖️ **Time Off Information for {user_name}:**\n\n"
        text += "📊 **Available Balance:**\n"
        text += "• Vacation Days: 18 remaining\n"
        text += "• Sick Days: 8 remaining\n"
        text += "• Personal Days: 3 remaining\n\n"
        text += "📅 **Upcoming Time Off:**\n"
        text += "• June 25-30: Vacation (Approved)\n"
        text += "• July 4: Holiday\n\n"
        text += "⏰ **Recent Requests:**\n"
        text += "• June 15: Personal day (Pending)\n"
        
        suggestions = ["Request time off", "Check balance", "View calendar", "Cancel request", "Holiday schedule"]
        return {"text": text, "suggestions": suggestions}
    
    def _handle_training_query(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle training-related queries."""
        user_role = user.get('role', 'user')
        
        text = f"📚 **Training Information for {user_role}:**\n\n"
        text += "✅ **Current Certifications:**\n"
        text += "• CPR/First Aid: Valid until Dec 2025\n"
        text += "• Security Training: Valid until Sep 2025\n"
        
        if user_role == 'pilot':
            text += "• ATP License: Valid until Mar 2026\n"
            text += "• Type Rating (B737): Valid until Jan 2026\n"
            text += "• Medical Certificate: Class 1, Valid until Nov 2025\n\n"
        elif user_role == 'steward':
            text += "• Cabin Safety: Valid until Aug 2025\n"
            text += "• Food Safety: Valid until Oct 2025\n\n"
        
        text += "📅 **Upcoming Training:**\n"
        text += "• Recurrent Safety Training: July 15, 2025\n"
        text += "• Emergency Procedures: August 2025\n"
        
        suggestions = ["Schedule training", "View certificates", "Training calendar", "Requirements", "Contact instructor"]
        return {"text": text, "suggestions": suggestions}
    
    def _handle_emergency(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle emergency situations."""
        text = "🚨 **EMERGENCY PROTOCOLS ACTIVATED**\n\n"
        text += "📞 **Immediate Actions:**\n"
        text += "1. Call 911 for life-threatening emergencies\n"
        text += "2. Contact Operations Center: (555) 123-4570\n"
        text += "3. Notify your supervisor immediately\n\n"
        text += "📋 **Emergency Contacts:**\n"
        text += "• Medical Emergency: 911\n"
        text += "• Security: (555) 123-4580\n"
        text += "• Maintenance Emergency: (555) 123-4569\n"
        text += "• Operations Center: (555) 123-4570\n\n"
        text += "⚠️ This system is for coordination only. Always use official emergency channels for urgent situations."
        
        suggestions = ["Call 911", "Contact operations", "View procedures", "Report incident", "Get help"]
        return {"text": text, "suggestions": suggestions}
    
    def _handle_admin_commands(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle administrative commands."""
        if user.get('role') != 'admin':
            return {
                "text": "🔒 Access denied. Administrative functions require admin privileges.",
                "suggestions": ["View schedule", "Contact admin", "Request access", "Help"]
            }
        
        text = "👨‍💼 **Administrative Functions:**\n\n"
        text += "📊 **Available Commands:**\n"
        text += "• Add crew member\n"
        text += "• Assign shifts\n"
        text += "• Manage schedules\n"
        text += "• Generate reports\n"
        text += "• View system status\n\n"
        text += "💡 **Quick Actions:**\n"
        text += "• Type 'add crew [name] [role]' to add crew\n"
        text += "• Type 'assign [crew] to [shift]' to assign\n"
        text += "• Type 'report [type]' for reports\n"
        
        suggestions = ["Add crew", "Assign shifts", "Generate report", "System status", "Manage users"]
        return {"text": text, "suggestions": suggestions}
    
    def _handle_crew_query(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle crew-related queries."""
        if "error" in self.aviation_data:
            return {"text": self.aviation_data["error"], "suggestions": ["Check data file", "Contact admin"]}
        
        crew_members = self.aviation_data.get('crew_members', [])
        
        if 'available' in message.lower():
            available_crew = [c for c in crew_members if c.get('status') == 'available']
            text = f"👥 **Available Crew Members ({len(available_crew)}):**\n\n"
            
            for crew in available_crew[:10]:  # Show first 10
                text += f"• {crew.get('name')} ({crew.get('role')})\n"
                text += f"  📧 {crew.get('email', 'N/A')}\n"
                text += f"  📍 Base: {crew.get('base_location', 'N/A')}\n\n"
        
        elif 'contact' in message.lower():
            text = "📞 **Crew Contact Directory:**\n\n"
            for crew in crew_members[:8]:  # Show first 8
                text += f"👤 **{crew.get('name')}** ({crew.get('role')})\n"
                text += f"   📧 {crew.get('email', 'N/A')}\n"
                text += f"   📱 {crew.get('phone', 'N/A')}\n\n"
        
        else:
            # General crew info
            pilots = len([c for c in crew_members if c.get('role') == 'pilot'])
            stewards = len([c for c in crew_members if c.get('role') == 'steward'])
            ground = len([c for c in crew_members if c.get('role') == 'ground_crew'])
            
            text = f"👥 **Crew Overview:**\n\n"
            text += f"✈️ Pilots: {pilots}\n"
            text += f"👩‍✈️ Flight Attendants: {stewards}\n"
            text += f"🔧 Ground Crew: {ground}\n"
            text += f"📊 Total: {len(crew_members)}\n\n"
            text += f"🟢 Available: {len([c for c in crew_members if c.get('status') == 'available'])}\n"
            text += f"🔴 On Duty: {len([c for c in crew_members if c.get('status') == 'on_duty'])}\n"
        
        suggestions = ["Contact crew", "View availability", "Send message", "Schedule meeting", "Crew directory"]
        return {"text": text, "suggestions": suggestions}
    
    def _handle_flight_query(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle flight-related queries."""
        if "error" in self.aviation_data:
            return {"text": self.aviation_data["error"], "suggestions": ["Check data file", "Contact admin"]}
        
        flights = self.aviation_data.get('flights', [])
        
        if 'today' in message.lower():
            today = datetime.now().strftime('%Y-%m-%d')
            today_flights = [f for f in flights if f.get('departure_time', '').startswith(today)]
            
            text = f"✈️ **Today's Flights ({len(today_flights)}):**\n\n"
            for flight in today_flights[:5]:
                dt = self._parse_flight_datetime(flight)
                text += f"🛫 **{flight.get('flight_number')}**\n"
                text += f"   📍 {flight.get('origin')} → {flight.get('destination')}\n"
                text += f"   ⏰ {dt.strftime('%H:%M')} - Status: {flight.get('status', 'Scheduled')}\n"
                text += f"   ✈️ Aircraft: {flight.get('aircraft_id', 'TBD')}\n\n"
        
        elif any(word in message.lower() for word in ['delayed', 'cancelled', 'status']):
            delayed_flights = [f for f in flights if f.get('status') in ['delayed', 'cancelled']]
            
            if delayed_flights:
                text = f"⚠️ **Flight Disruptions ({len(delayed_flights)}):**\n\n"
                for flight in delayed_flights:
                    text += f"🛫 {flight.get('flight_number')}: {flight.get('status').upper()}\n"
                    text += f"   📍 {flight.get('origin')} → {flight.get('destination')}\n"
                    if flight.get('delay_reason'):
                        text += f"   📝 Reason: {flight.get('delay_reason')}\n"
                    text += "\n"
            else:
                text = "✅ No flight disruptions reported."
        
        else:
            # General flight info
            scheduled = len([f for f in flights if f.get('status') == 'scheduled'])
            in_flight = len([f for f in flights if f.get('status') == 'in_flight'])
            completed = len([f for f in flights if f.get('status') == 'completed'])
            
            text = f"✈️ **Flight Operations Summary:**\n\n"
            text += f"📅 Scheduled: {scheduled} flights\n"
            text += f"🛫 In Flight: {in_flight} flights\n"
            text += f"✅ Completed: {completed} flights\n"
            text += f"📊 Total: {len(flights)} flights\n"
        
        suggestions = ["Flight status", "Today's flights", "My flights", "Delays", "Flight details"]
        return {"text": text, "suggestions": suggestions}
    
    def _handle_status_query(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle status queries."""
        user_name = user.get('name', 'User')
        user_role = user.get('role', 'user')
        
        # Mock user status - in real system this would come from duty tracking
        current_time = datetime.now()
        
        text = f"📊 **Status for {user_name}:**\n\n"
        text += f"👤 Role: {user_role.title()}\n"
        text += f"⏰ Current Time: {current_time.strftime('%H:%M')}\n"
        text += f"📅 Date: {current_time.strftime('%B %d, %Y')}\n\n"
        
        # Determine current duty status
        schedules = self._get_user_schedules(user_name)
        current_duty = None
        
        for schedule in schedules:
            schedule_time = schedule.get('datetime', datetime.min)
            if schedule_time.date() == current_time.date():
                # Check if currently on duty (within 1 hour of schedule)
                time_diff = abs((current_time - schedule_time).total_seconds())
                if time_diff < 3600:  # Within 1 hour
                    current_duty = schedule
                    break
        
        if current_duty:
            text += f"🟢 **Current Status:** On Duty\n"
            if current_duty['type'] == 'flight':
                flight = current_duty['data']
                text += f"✈️ Flight: {flight.get('flight_number')}\n"
                text += f"📍 Route: {flight.get('origin')} → {flight.get('destination')}\n"
            else:
                shift = current_duty['data']
                text += f"🔄 Shift: {shift.get('shift_type')}\n"
                text += f"📍 Location: {shift.get('location')}\n"
        else:
            text += f"⚪ **Current Status:** Off Duty\n"
            
            # Find next duty
            upcoming = [s for s in schedules if s.get('datetime', datetime.min) > current_time]
            if upcoming:
                next_duty = upcoming[0]
                next_time = next_duty.get('datetime')
                hours_until = (next_time - current_time).total_seconds() / 3600
                text += f"⏭️ Next Duty: {next_time.strftime('%m/%d %H:%M')} ({hours_until:.1f}h)\n"
        
        text += f"\n📈 **This Month:**\n"
        text += f"• Hours Worked: 142\n"
        text += f"• Flights: 28\n"
        text += f"• Days Off: 8\n"
        
        suggestions = ["View schedule", "Clock in/out", "Request time off", "Change status", "Contact supervisor"]
        return {"text": text, "suggestions": suggestions}
    
    def _handle_greeting(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle greeting messages."""
        user_name = user.get('name', 'User')
        current_hour = datetime.now().hour
        
        if current_hour < 12:
            greeting = "Good morning"
        elif current_hour < 17:
            greeting = "Good afternoon"
        else:
            greeting = "Good evening"
        
        text = f"{greeting}, {user_name}! ✈️\n\n"
        text += "I'm your aviation crew assistant. I can help you with:\n\n"
        text += "📅 Schedule information\n"
        text += "✈️ Flight details\n"
        text += "👥 Crew coordination\n"
        text += "🔄 Available shifts\n"
        text += "💰 Pay information\n"
        text += "📞 Contact information\n\n"
        text += "What would you like to know?"
        
        suggestions = ["My schedule", "Today's duties", "Available shifts", "Flight status", "Contact info", "Help"]
        return {"text": text, "suggestions": suggestions}
    
    def _handle_help_query(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle help requests."""
        text = "🆘 **Aviation Crew Assistant Help**\n\n"
        text += "💬 **What I can help with:**\n\n"
        text += "📅 **Schedule:** 'my schedule', 'today's duties', 'tomorrow'\n"
        text += "✈️ **Flights:** 'flight status', 'my flights', 'delays'\n"
        text += "👥 **Crew:** 'available crew', 'contact info'\n"
        text += "🔄 **Shifts:** 'available shifts', 'overtime', 'swap shifts'\n"
        text += "💰 **Pay:** 'pay rates', 'overtime pay', 'earnings'\n"
        text += "📍 **Location:** 'where is', 'directions', 'facilities'\n"
        text += "⚠️ **Issues:** 'conflicts', 'problems', 'help needed'\n\n"
        text += "💡 **Tips:**\n"
        text += "• Use natural language - I understand context\n"
        text += "• Try specific questions like 'Do I work tomorrow?'\n"
        text += "• Click suggested buttons for quick actions\n"
        
        suggestions = ["View examples", "Contact support", "Feature list", "Quick start", "About system"]
        return {"text": text, "suggestions": suggestions}
    
    def _handle_default_query(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """Handle unrecognized queries."""
        text = "🤔 I'm not sure I understand that request.\n\n"
        text += "Here are some things you can ask me about:\n\n"
        text += "📅 Schedule: 'What's my schedule?', 'Do I work today?'\n"
        text += "✈️ Flights: 'Flight status', 'Today's flights'\n"
        text += "👥 Crew: 'Who's available?', 'Contact info'\n"
        text += "🔄 Shifts: 'Available shifts', 'Overtime opportunities'\n"
        text += "💰 Pay: 'Pay rates', 'My earnings'\n"
        text += "📞 Help: 'Emergency contacts', 'How to use this'\n\n"
        text += "Try rephrasing your question or use the suggested buttons below."
        
        suggestions = ["My schedule", "Flight status", "Available shifts", "Contact info", "Help", "Emergency"]
        return {"text": text, "suggestions": suggestions}
    
    def get_response(self, message: str, user: Dict[str, str]) -> Dict[str, Any]:
        """
        Get chatbot response based on user message and context.
        
        Args:
            message (str): User's message
            user (Dict[str, str]): User information (name, role, etc.)
            
        Returns:
            Dict[str, Any]: Response with text and suggestions
        """
        if not message or not message.strip():
            return {
                "text": "Please type a message to get started! 😊",
                "suggestions": ["My schedule", "Help", "Flight status"]
            }
        
        # Detect intent and get appropriate handler
        intent = self._detect_intent(message)
        handler = self.response_templates.get(intent, self.response_templates['default'])
        
        try:
            response = handler(message, user)
            
            # Ensure response has required fields
            if not isinstance(response, dict):
                response = {"text": str(response), "suggestions": []}
            
            if "text" not in response:
                response["text"] = "Sorry, I encountered an error processing your request."
            
            if "suggestions" not in response:
                response["suggestions"] = ["Help", "My schedule", "Contact support"]
            
            # Limit suggestions to prevent UI overflow
            response["suggestions"] = response["suggestions"][:6]
            
            return response
            
        except Exception as e:
            print(f"Error in chatbot response: {e}")
            return {
                "text": "I encountered an error processing your request. Please try again or contact support.",
                "suggestions": ["Help", "Contact support", "Try again"]
            }

# Example usage and testing
if __name__ == "__main__":
    # Initialize chatbot
    chatbot = KeywordChatbot()
    
    # Test user
    test_user = {
        "name": "Captain Sarah Johnson",
        "role": "pilot",
        "username": "pilot1"
    }
    
    # Test queries
    test_queries = [
        "Hello",
        "What's my schedule today?",
        "Are there any available shifts?",
        "Show me flight status",
        "Any conflicts in my schedule?",
        "What's the weather like?",
        "Emergency help needed",
        "How much do I get paid?",
        "Help me understand this system"
    ]
    
    print("=== Aviation Chatbot Test ===\n")
    
    for query in test_queries:
        print(f"User: {query}")
        response = chatbot.get_response(query, test_user)
        print(f"Bot: {response['text']}")
        print(f"Suggestions: {response['suggestions']}")
        print("-" * 50)