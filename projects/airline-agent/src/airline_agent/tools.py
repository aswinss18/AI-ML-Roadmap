import requests



SYSTEM_PROMPT = """You are Lisa, a helpful and professional airline assistant. Keep responses concise and easy to understand.

Use the available tools for current or booking-specific facts. Never guess flight availability, prices, schedules, status, baggage rules, or booking details. If a suitable tool is unavailable or fails, explain that the information could not be verified. Ask a focused question when required tool arguments are missing; do not invent values. After a tool returns, answer based on its result and do not claim an action succeeded unless confirmed by the tool.

Protect booking information: follow the required passenger-verification process before disclosing booking details. Cancel a booking only after the passenger is verified and explicitly confirms cancellation; otherwise ask for confirmation and do not call the cancellation tool.

Examples:

User: Find flights from Boston to Chicago on 2026-08-12.
Assistant: [Call search_flights with origin="Boston", destination="Chicago", departure_date="2026-08-12".]
Tool: [Returns flight options.]
Assistant: I found these options: [summarize the returned options and details].

User: Cancel my booking, reference Q7L2P.
Assistant: I can help with that. Please confirm that you want me to cancel booking Q7L2P.
User: Yes, cancel it.
Assistant: [Only after passenger verification, call cancel_booking with booking_reference="Q7L2P" and a provided reason; if the reason is required but missing, ask for it first.]
Tool: [Returns cancellation result.]
Assistant: [Report the result accurately; do not say it was cancelled unless the tool confirms it.]
"""




airline_tools = [
    {
        "type": "function",
        "name": "search_flights",
        "description": (
            "Search available flights between two cities "
            "for a specified travel date."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "origin": {
                    "type": "string",
                    "description": "Departure city or airport code"
                },
                "destination": {
                    "type": "string",
                    "description": "Arrival city or airport code"
                },
                "departure_date": {
                    "type": "string",
                    "description": "Travel date in YYYY-MM-DD format"
                }
            },
            "required": [
                "origin",
                "destination",
                "departure_date"
            ],
            "additionalProperties": False
        },
        "strict": True
    },
    {
        "type": "function",
        "name": "get_ticket_price",
        "description": (
            "Get the current ticket price for a selected flight."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "flight_id": {
                    "type": "string",
                    "description": "Unique flight identifier"
                },
                "travel_class": {
                    "type": "string",
                    "enum": [
                        "economy",
                        "business",
                        "first"
                    ],
                    "description": "Preferred cabin class"
                }
            },
            "required": [
                "flight_id",
                "travel_class"
            ],
            "additionalProperties": False
        },
        "strict": True
    },
    {
        "type": "function",
        "name": "get_flight_status",
        "description": (
            "Check real-time flight status, delays, "
            "departure time and arrival time."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "flight_number": {
                    "type": "string",
                    "description": "Airline flight number"
                },
                "flight_date": {
                    "type": "string",
                    "description": "Flight date in YYYY-MM-DD format"
                }
            },
            "required": [
                "flight_number",
                "flight_date"
            ],
            "additionalProperties": False
        },
        "strict": True
    },
    {
        "type": "function",
        "name": "get_booking_details",
        "description": (
            "Retrieve an existing booking after "
            "verifying the passenger's authorization."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "booking_reference": {
                    "type": "string",
                    "description": "Passenger booking reference or PNR"
                }
            },
            "required": ["booking_reference"],
            "additionalProperties": False
        },
        "strict": True
    },
    {
        "type": "function",
        "name": "cancel_booking",
        "description": (
            "Cancel an existing flight booking. "
            "Call only after the passenger is verified "
            "and explicitly confirms cancellation."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "booking_reference": {
                    "type": "string",
                    "description": "Booking reference or PNR"
                },
                "reason": {
                    "type": "string",
                    "description": "Reason for cancellation"
                }
            },
            "required": [
                "booking_reference",
                "reason"
            ],
            "additionalProperties": False
        },
        "strict": True
    },
    {
        "type": "function",
        "name": "book_ticket",
        "description": (
            "Create a flight booking for a passenger after "
            "all required booking details are provided."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "flight_id": {
                    "type": "string",
                    "description": "Unique identifier of the selected flight"
                },
                "travel_class": {
                    "type": "string",
                    "enum": [
                        "economy",
                        "business",
                        "first"
                    ],
                    "description": "Cabin class to book"
                },
                "passenger_name": {
                    "type": "string",
                    "description": "Full name of the passenger"
                }
            },
            "required": [
                "flight_id",
                "travel_class",
                "passenger_name"
            ],
            "additionalProperties": False
        },
        "strict": True
    },
    {
        "type": "function",
        "name": "update_booking",
        "description": (
            "Update an existing flight booking after verifying "
            "the passenger and receiving explicit confirmation."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "booking_reference": {
                    "type": "string",
                    "description": "Booking reference or PNR"
                },
                "passenger_name": {
                    "type": "string",
                    "description": "Full name of the passenger, for verification"
                },
                "new_flight_id": {
                    "type": "string",
                    "description": "Replacement flight identifier, if changing flights"
                },
                "travel_class": {
                    "type": "string",
                    "enum": [
                        "economy",
                        "business",
                        "first"
                    ],
                    "description": "Updated cabin class"
                },
                "seat_preference": {
                    "type": "string",
                    "description": "Requested seat or seat preference"
                }
            },
            "required": [
                "booking_reference",
                "passenger_name",
                "new_flight_id",
                "travel_class",
                "seat_preference"
            ],
            "additionalProperties": False
        },
        "strict": True
    },
    {
        "type": "function",
        "name": "get_baggage_policy",
        "description": (
            "Retrieve cabin and checked baggage "
            "allowances for a selected flight and fare."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "flight_id": {
                    "type": "string",
                    "description": "Selected flight identifier"
                },
                "fare_type": {
                    "type": "string",
                    "description": "Fare category or ticket type"
                }
            },
            "required": [
                "flight_id",
                "fare_type"
            ],
            "additionalProperties": False
        },
        "strict": True
    }
]


class AirLineAgentTools:
    def __init__(self):
        self.tools = airline_tools

    def search_flights(self, origin: str, destination: str, departure_date: str):
        # Placeholder for actual flight search implementation
        return {"message": f"Searching flights from {origin} to {destination} on {departure_date}"}

    def get_ticket_price(self, flight_id: str, travel_class: str):
        # Placeholder for actual ticket price retrieval implementation
        return {"message": f"Getting ticket price for flight {flight_id} in {travel_class} class"}

    def get_flight_status(self, flight_number: str, flight_date: str):
        # Placeholder for actual flight status implementation
        return {"message": f"Getting status for flight {flight_number} on {flight_date}"}

    def get_booking_details(self, booking_reference: str):
        # Placeholder for actual booking-details implementation
        return {"message": f"Getting details for booking {booking_reference} after passenger verification"}

    def cancel_booking(self, booking_reference: str, reason: str):
        # Placeholder for actual booking cancellation implementation
        return {"message": f"Cancelling booking {booking_reference}. Reason: {reason}"}

    def book_ticket(self, flight_id: str, travel_class: str, passenger_name: str):
        # Placeholder for actual ticket-booking implementation
        return {
            "message": (
                f"Booking flight {flight_id} in {travel_class} class "
                f"for passenger {passenger_name}"
            )
        }

    def update_booking(
        self,
        booking_reference: str,
        passenger_name: str,
        new_flight_id: str,
        travel_class: str,
        seat_preference: str,
    ):
        # Placeholder for actual booking-update implementation
        return {
            "message": (
                f"Updating booking {booking_reference} for passenger {passenger_name}: "
                f"flight {new_flight_id}, {travel_class} class, "
                f"seat preference {seat_preference}"
            )
        }

    def get_baggage_policy(self, flight_id: str, fare_type: str):
        # Placeholder for actual baggage-policy implementation
        return {"message": f"Getting baggage policy for flight {flight_id} with fare type {fare_type}"}