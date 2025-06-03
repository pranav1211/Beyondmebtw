#!/usr/bin/env python3
"""
Data Initialization Script for Aviation Crew Scheduler
Creates or updates the data.json file with proper structure and sample data.
"""

import json
import os
from datetime import datetime, timedelta
import random

def create_sample_data():
    """Create comprehensive sample data for the aviation crew scheduler."""
    
    # Base date for scheduling (today + next 30 days)
    base_date = datetime.now()
    
    # Sample crew members with realistic aviation roles
    crew_members = [
        {
            "id": "CREW001",
            "name": "Captain Sarah Johnson",
            "role": "Captain",
            "license": "ATPL",
            "aircraft_types": ["B737", "A320", "B777"],
            "base": "LAX",
            "max_flight_hours_month": 100,
            "current_hours_month": 45,
            "status": "available",
            "contact": {
                "phone": "+1-555-0101",
                "email": "s.johnson@airline.com"
            },
            "certifications": ["IFR", "Type Rating B737", "Type Rating A320"],
            "languages": ["English", "Spanish"]
        },
        {
            "id": "CREW002",
            "name": "First Officer Mike Chen",
            "role": "First Officer",
            "license": "CPL",
            "aircraft_types": ["B737", "A320"],
            "base": "LAX",
            "max_flight_hours_month": 85,
            "current_hours_month": 32,
            "status": "available",
            "contact": {
                "phone": "+1-555-0102",
                "email": "m.chen@airline.com"
            },
            "certifications": ["IFR", "Multi-Engine"],
            "languages": ["English", "Mandarin"]
        },
        {
            "id": "CREW003",
            "name": "Captain Emma Rodriguez",
            "role": "Captain",
            "license": "ATPL",
            "aircraft_types": ["B777", "B787", "A350"],
            "base": "JFK",
            "max_flight_hours_month": 95,
            "current_hours_month": 67,
            "status": "on_duty",
            "contact": {
                "phone": "+1-555-0103",
                "email": "e.rodriguez@airline.com"
            },
            "certifications": ["IFR", "Type Rating B777", "Type Rating B787"],
            "languages": ["English", "Spanish", "Portuguese"]
        },
        {
            "id": "CREW004",
            "name": "Flight Engineer David Kim",
            "role": "Flight Engineer",
            "license": "CPL",
            "aircraft_types": ["B747", "DC-10"],
            "base": "LAX",
            "max_flight_hours_month": 90,
            "current_hours_month": 28,
            "status": "available",
            "contact": {
                "phone": "+1-555-0104",
                "email": "d.kim@airline.com"
            },
            "certifications": ["A&P License", "FCC Radio License"],
            "languages": ["English", "Korean"]
        },
        {
            "id": "CREW005",
            "name": "Captain Lisa Thompson",
            "role": "Captain",
            "license": "ATPL",
            "aircraft_types": ["A320", "A321", "A319"],
            "base": "ORD",
            "max_flight_hours_month": 100,
            "current_hours_month": 54,
            "status": "available",
            "contact": {
                "phone": "+1-555-0105",
                "email": "l.thompson@airline.com"
            },
            "certifications": ["IFR", "Type Rating A320 Family"],
            "languages": ["English", "French"]
        },
        {
            "id": "CREW006",
            "name": "First Officer James Wilson",
            "role": "First Officer",
            "license": "CPL",
            "aircraft_types": ["B737", "B757"],
            "base": "ORD",
            "max_flight_hours_month": 85,
            "current_hours_month": 41,
            "status": "sick_leave",
            "contact": {
                "phone": "+1-555-0106",
                "email": "j.wilson@airline.com"
            },
            "certifications": ["IFR", "Multi-Engine"],
            "languages": ["English"]
        }
    ]
    
    # Sample aircraft fleet
    aircraft = [
        {
            "id": "AC001",
            "registration": "N123AA",
            "type": "B737",
            "model": "Boeing 737-800",
            "capacity": 189,
            "range_nm": 2935,
            "base": "LAX",
            "status": "active",
            "last_maintenance": (base_date - timedelta(days=15)).isoformat(),
            "next_maintenance": (base_date + timedelta(days=45)).isoformat(),
            "flight_hours": 12450,
            "cycles": 8932
        },
        {
            "id": "AC002",
            "registration": "N456BB",
            "type": "A320",
            "model": "Airbus A320-200",
            "capacity": 174,
            "range_nm": 3300,
            "base": "LAX",
            "status": "active",
            "last_maintenance": (base_date - timedelta(days=8)).isoformat(),
            "next_maintenance": (base_date + timedelta(days=52)).isoformat(),
            "flight_hours": 8765,
            "cycles": 6421
        },
        {
            "id": "AC003",
            "registration": "N789CC",
            "type": "B777",
            "model": "Boeing 777-300ER",
            "capacity": 396,
            "range_nm": 7370,
            "base": "JFK",
            "status": "active",
            "last_maintenance": (base_date - timedelta(days=22)).isoformat(),
            "next_maintenance": (base_date + timedelta(days=38)).isoformat(),
            "flight_hours": 15632,
            "cycles": 4521
        },
        {
            "id": "AC004",
            "registration": "N321DD",
            "type": "A321",
            "model": "Airbus A321-200",
            "capacity": 220,
            "range_nm": 3200,
            "base": "ORD",
            "status": "maintenance",
            "last_maintenance": base_date.isoformat(),
            "next_maintenance": (base_date + timedelta(days=60)).isoformat(),
            "flight_hours": 9876,
            "cycles": 7234
        }
    ]
    
    # Generate sample flights for the next 30 days
    flights = []
    flight_routes = [
        ("LAX", "JFK", 5.5, "Domestic"),
        ("JFK", "LAX", 6.0, "Domestic"),
        ("LAX", "ORD", 4.0, "Domestic"),
        ("ORD", "LAX", 4.5, "Domestic"),
        ("JFK", "LHR", 7.5, "International"),
        ("LHR", "JFK", 8.0, "International"),
        ("LAX", "NRT", 11.5, "International"),
        ("NRT", "LAX", 10.0, "International"),
        ("ORD", "FRA", 8.5, "International"),
        ("FRA", "ORD", 9.0, "International")
    ]
    
    for i in range(50):  # Generate 50 sample flights
        route = random.choice(flight_routes)
        flight_date = base_date + timedelta(days=random.randint(1, 30))
        flight_time = flight_date.replace(
            hour=random.randint(6, 22),
            minute=random.choice([0, 15, 30, 45])
        )
        
        # Calculate arrival time
        arrival_time = flight_time + timedelta(hours=route[2])
        
        flight = {
            "id": f"FL{1000 + i}",
            "flight_number": f"AA{1000 + i}",
            "origin": route[0],
            "destination": route[1],
            "departure_time": flight_time.isoformat(),
            "arrival_time": arrival_time.isoformat(),
            "aircraft_id": random.choice([ac["id"] for ac in aircraft if ac["status"] == "active"]),
            "flight_type": route[3],
            "duration_hours": route[2],
            "status": random.choice(["scheduled", "confirmed", "delayed", "cancelled"]),
            "crew_assigned": [],
            "passengers": random.randint(50, 200),
            "cargo_weight": random.randint(1000, 15000)
        }
        flights.append(flight)
    
    # Sample schedules linking crew to flights
    schedules = []
    for i, flight in enumerate(flights[:20]):  # Schedule first 20 flights
        # Assign captain and first officer
        available_captains = [c for c in crew_members if c["role"] == "Captain" and c["status"] == "available"]
        available_fos = [c for c in crew_members if c["role"] == "First Officer" and c["status"] == "available"]
        
        if available_captains and available_fos:
            captain = random.choice(available_captains)
            fo = random.choice(available_fos)
            
            schedule = {
                "id": f"SCH{1000 + i}",
                "flight_id": flight["id"],
                "crew_assignments": [
                    {
                        "crew_id": captain["id"],
                        "role": "Captain",
                        "duty_start": (datetime.fromisoformat(flight["departure_time"]) - timedelta(hours=1)).isoformat(),
                        "duty_end": (datetime.fromisoformat(flight["arrival_time"]) + timedelta(hours=0.5)).isoformat()
                    },
                    {
                        "crew_id": fo["id"],
                        "role": "First Officer",
                        "duty_start": (datetime.fromisoformat(flight["departure_time"]) - timedelta(hours=1)).isoformat(),
                        "duty_end": (datetime.fromisoformat(flight["arrival_time"]) + timedelta(hours=0.5)).isoformat()
                    }
                ],
                "status": "confirmed",
                "created_date": (base_date - timedelta(days=random.randint(1, 10))).isoformat(),
                "notes": f"Regular scheduled flight {flight['flight_number']}"
            }
            schedules.append(schedule)
    
    # Airport data
    airports = [
        {
            "code": "LAX",
            "name": "Los Angeles International Airport",
            "city": "Los Angeles",
            "country": "USA",
            "timezone": "America/Los_Angeles",
            "coordinates": {"lat": 33.9425, "lon": -118.4081}
        },
        {
            "code": "JFK",
            "name": "John F. Kennedy International Airport",
            "city": "New York",
            "country": "USA",
            "timezone": "America/New_York",
            "coordinates": {"lat": 40.6413, "lon": -73.7781}
        },
        {
            "code": "ORD",
            "name": "O'Hare International Airport",
            "city": "Chicago",
            "country": "USA",
            "timezone": "America/Chicago",
            "coordinates": {"lat": 41.9742, "lon": -87.9073}
        },
        {
            "code": "LHR",
            "name": "London Heathrow Airport",
            "city": "London",
            "country": "UK",
            "timezone": "Europe/London",
            "coordinates": {"lat": 51.4700, "lon": -0.4543}
        },
        {
            "code": "NRT",
            "name": "Narita International Airport",
            "city": "Tokyo",
            "country": "Japan",
            "timezone": "Asia/Tokyo",
            "coordinates": {"lat": 35.7720, "lon": 140.3929}
        },
        {
            "code": "FRA",
            "name": "Frankfurt Airport",
            "city": "Frankfurt",
            "country": "Germany",
            "timezone": "Europe/Berlin",
            "coordinates": {"lat": 50.0379, "lon": 8.5622}
        }
    ]
    
    # User authentication data
    users = [
        {
            "username": "admin",
            "password": "admin123",
            "name": "System Administrator",
            "role": "admin",
            "email": "admin@airline.com",
            "created": datetime.now().isoformat()
        },
        {
            "username": "pilot1",
            "password": "pilot123",
            "name": "Captain Sarah Johnson",
            "role": "pilot",
            "email": "s.johnson@airline.com",
            "created": datetime.now().isoformat()
        },
        {
            "username": "pilot2",
            "password": "pilot123",
            "name": "First Officer Mike Chen",
            "role": "pilot",
            "email": "m.chen@airline.com",
            "created": datetime.now().isoformat()
        },
        {
            "username": "crew1",
            "password": "crew123",
            "name": "Flight Attendant Lisa Wong",
            "role": "steward",
            "email": "l.wong@airline.com",
            "created": datetime.now().isoformat()
        },
        {
            "username": "ground1",
            "password": "ground123",
            "name": "Ground Crew Chief Tom Brown",
            "role": "ground_crew",
            "email": "t.brown@airline.com",
            "created": datetime.now().isoformat()
        }
    ]
    
    # System configuration
    config = {
        "system_name": "Aviation Crew Scheduler",
        "version": "2.0",
        "last_updated": datetime.now().isoformat(),
        "settings": {
            "max_duty_hours_day": 14,
            "max_flight_hours_day": 8,
            "min_rest_hours": 10,
            "currency_requirements": {
                "landings_90_days": 3,
                "ifr_approaches_6_months": 6
            },
            "notification_settings": {
                "email_reminders": True,
                "schedule_changes": True,
                "maintenance_alerts": True
            }
        }
    }
    
    # Generate sample shifts for crew scheduling
    shifts = []
    shift_types = ["Morning", "Afternoon", "Night", "Standby"]
    
    for i in range(30):  # Generate 30 sample shifts
        shift_date = (base_date + timedelta(days=random.randint(1, 15))).strftime('%Y-%m-%d')
        shift_type = random.choice(shift_types)
        
        # Define shift times based on type
        if shift_type == "Morning":
            start_time, end_time = "06:00", "14:00"
        elif shift_type == "Afternoon":
            start_time, end_time = "14:00", "22:00"
        elif shift_type == "Night":
            start_time, end_time = "22:00", "06:00"
        else:  # Standby
            start_time, end_time = "08:00", "16:00"
        
        shift = {
            "id": f"SH{1000 + i}",
            "crew_id": random.choice([c["id"] for c in crew_members]),
            "shift_date": shift_date,
            "shift_type": shift_type,
            "start_time": start_time,
            "end_time": end_time,
            "location": random.choice(["LAX", "JFK", "ORD"]),
            "status": random.choice(["scheduled", "confirmed", "completed"]),
            "notes": f"{shift_type} shift at {shift_date}"
        }
        shifts.append(shift)
    
    # Sample statistics for dashboard
    stats = {
        "total_flights_today": len([f for f in flights if f["departure_time"].startswith(base_date.strftime('%Y-%m-%d'))]),
        "active_crew": len([c for c in crew_members if c["status"] == "available"]),
        "flights_on_time": len([f for f in flights if f["status"] == "scheduled"]),
        "maintenance_due": len([a for a in aircraft if a["status"] == "maintenance"]),
        "last_updated": datetime.now().isoformat()
    }
    
    # Recent activities for dashboard
    recent_activities = [
        {
            "id": 1,
            "timestamp": (datetime.now() - timedelta(minutes=30)).isoformat(),
            "type": "schedule_update",
            "message": "Flight AA1001 crew assignment updated",
            "user": "admin"
        },
        {
            "id": 2,
            "timestamp": (datetime.now() - timedelta(hours=1)).isoformat(),
            "type": "status_change",
            "message": "Captain Sarah Johnson marked available",
            "user": "pilot1"
        },
        {
            "id": 3,
            "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
            "type": "maintenance",
            "message": "Aircraft N321DD entered maintenance",
            "user": "ground1"
        }
    ]
    
    # Compile all data
    data = {
        "metadata": {
            "created": datetime.now().isoformat(),
            "version": "2.0",
            "description": "Aviation Crew Scheduler Database",
            "record_count": {
                "users": len(users),
                "crew_members": len(crew_members),
                "aircraft": len(aircraft),
                "flights": len(flights),
                "schedules": len(schedules),
                "shifts": len(shifts),
                "airports": len(airports)
            }
        },
        "users": users,
        "crew_members": crew_members,
        "aircraft": aircraft,
        "flights": flights,
        "schedules": schedules,
        "shifts": shifts,
        "airports": airports,
        "stats": stats,
        "recent_activities": recent_activities,
        "config": config
    }
    
    return data

def save_data_to_file(data, filename="data.json"):
    """Save data to JSON file with proper formatting."""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✅ Data successfully saved to {filename}")
        print(f"📊 Records created: {data['metadata']['record_count']}")
        return True
    except Exception as e:
        print(f"❌ Error saving data to {filename}: {str(e)}")
        return False

def validate_data_structure(data):
    """Validate the data structure and required fields."""
    required_sections = ['crew_members', 'aircraft', 'flights', 'schedules', 'airports', 'config']
    
    for section in required_sections:
        if section not in data:
            print(f"❌ Missing required section: {section}")
            return False
    
    # Validate crew members have required fields
    required_crew_fields = ['id', 'name', 'role', 'license', 'aircraft_types', 'base', 'status']
    for crew in data['crew_members']:
        for field in required_crew_fields:
            if field not in crew:
                print(f"❌ Crew member {crew.get('id', 'unknown')} missing field: {field}")
                return False
    
    # Validate aircraft have required fields
    required_aircraft_fields = ['id', 'registration', 'type', 'status', 'base']
    for aircraft in data['aircraft']:
        for field in required_aircraft_fields:
            if field not in aircraft:
                print(f"❌ Aircraft {aircraft.get('id', 'unknown')} missing field: {field}")
                return False
    
    print("✅ Data structure validation passed")
    return True

def main():
    """Main function to create and save aviation crew scheduler data."""
    print("🛫 Aviation Crew Scheduler - Data Initialization")
    print("=" * 50)
    
    # Check if data.json already exists
    if os.path.exists("data.json"):
        response = input("📁 data.json already exists. Overwrite? (y/N): ").strip().lower()
        if response != 'y':
            print("❌ Operation cancelled.")
            return
    
    print("📝 Generating sample data...")
    data = create_sample_data()
    
    print("🔍 Validating data structure...")
    if not validate_data_structure(data):
        print("❌ Data validation failed. Aborting.")
        return
    
    print("💾 Saving data to file...")
    if save_data_to_file(data):
        print("\n🎉 Data initialization completed successfully!")
        print(f"📅 Database contains data from {datetime.now().strftime('%Y-%m-%d')} onwards")
        print("🚀 You can now run your aviation crew scheduler application.")
    else:
        print("\n❌ Data initialization failed!")

if __name__ == "__main__":
    main()