import os
import re
import unicodedata
from datetime import date
from functools import cache
from itertools import product

import airportsdata
import requests


SYSTEM_PROMPT = """You are Lisa, an airline assistant. Keep answers concise and use the flight tools
to verify flight details. Ask for missing dates or locations and never invent a flight or fare.

Aviationstack provides recent flight records. Describe search results as flight records and report
the scheduled or actual times returned by the tool. Ticket prices, seat availability, future schedule
verification, baggage policies, and booking actions are unavailable through this integration.
When a search is empty or truncated, explain the limits of the live feed.
"""


airline_tools = [
    {
        "type": "function",
        "name": "search_flights",
        "description": (
            "Find recent Aviationstack flight records for a specific route and departure date. "
            "The results include status and times. Fare and seat availability are unavailable."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "origin": {
                    "type": "string",
                    "description": "Departure city, IATA metro code, or IATA airport code",
                },
                "destination": {
                    "type": "string",
                    "description": "Arrival city, IATA metro code, or IATA airport code",
                },
                "departure_date": {
                    "type": "string",
                    "description": "Departure date in YYYY-MM-DD format",
                },
            },
            "required": ["origin", "destination", "departure_date"],
            "additionalProperties": False,
        },
        "strict": True,
    },
    {
        "type": "function",
        "name": "get_flight_status",
        "description": "Check status, times and delays for a flight in the recent live feed.",
        "parameters": {
            "type": "object",
            "properties": {
                "flight_number": {
                    "type": "string",
                    "description": "Flight designator including the airline, such as AA1 or AAL1",
                },
                "flight_date": {
                    "type": "string",
                    "description": "Departure date in YYYY-MM-DD format",
                },
            },
            "required": ["flight_number", "flight_date"],
            "additionalProperties": False,
        },
        "strict": True,
    },
]

_FLIGHTS_URL = "https://api.aviationstack.com/v1/flights"
_PAGE_SIZE = 100
_RESULT_LIMIT = 20


class _AviationstackError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


def _error(code: str, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


def _validate_date(value: str) -> None:
    try:
        valid = date.fromisoformat(value).isoformat() == value
    except ValueError:
        valid = False
    if not valid:
        raise ValueError("Enter a valid flight date in YYYY-MM-DD format.")


def _normalize_location(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value.casefold())
    plain = "".join(char for char in normalized if not unicodedata.combining(char))
    return " ".join(plain.split())


@cache
def _airport_directory():
    return airportsdata.load("IATA"), airportsdata.load_iata_macs()


def _airport_codes(location: str) -> tuple[str, ...]:
    airports, metro_areas = _airport_directory()
    code = location.strip().upper()
    if code in airports:
        return (code,)
    if code in metro_areas:
        return tuple(sorted(metro_areas[code]["airports"]))

    name = _normalize_location(location)
    if not name:
        raise ValueError("Enter a city name or IATA airport code.")
    for metro in metro_areas.values():
        if name == _normalize_location(metro["name"]):
            return tuple(sorted(metro["airports"]))

    matches = [
        airport for airport in airports.values()
        if name in (_normalize_location(airport["city"]), _normalize_location(airport["name"]))
    ]
    if not matches:
        raise ValueError(f"No airport found for {location!r}. Enter an IATA airport code.")
    if len({(airport["country"], airport["subd"]) for airport in matches}) > 1:
        raise ValueError(f"{location!r} matches multiple locations. Enter an IATA airport code.")
    return tuple(sorted(airport["iata"] for airport in matches))


def _flight_summary(record: dict) -> dict:
    flight = record.get("flight") or {}
    result = {
        "flight_number": flight.get("iata"),
        "flight_icao": flight.get("icao"),
        "flight_date": record.get("flight_date"),
        "status": record.get("flight_status"),
        "airline": (record.get("airline") or {}).get("name"),
    }
    for direction in ("departure", "arrival"):
        details = record.get(direction) or {}
        result[direction] = {
            field: details.get(field)
            for field in ("iata", "airport", "scheduled", "estimated", "actual", "delay", "terminal", "gate")
        }
    return result


class AirLineAgentTools:
    def __init__(self, access_key: str | None = None):
        self.tools = airline_tools
        self._access_key = access_key

    def _fetch_flights(self, **filters: str) -> tuple[list[dict], bool]:
        access_key = self._access_key if self._access_key is not None else os.getenv("AVIATIONSTACK_ACCESS_KEY")
        if not access_key or not access_key.strip():
            raise _AviationstackError("missing_access_key", "Set AVIATIONSTACK_ACCESS_KEY before looking up flights.")

        try:
            response = requests.get(
                _FLIGHTS_URL,
                params={"access_key": access_key.strip(), "limit": _PAGE_SIZE, **filters},
                timeout=(5, 15),
                allow_redirects=False,
            )
        except requests.RequestException:
            raise _AviationstackError("upstream_unavailable", "Could not connect to Aviationstack.") from None

        try:
            payload = response.json()
        except ValueError:
            payload = {}

        upstream_error = payload.get("error") if isinstance(payload, dict) else None
        upstream_code = upstream_error.get("code") if isinstance(upstream_error, dict) else None
        if response.status_code == 401 or upstream_code in ("invalid_access_key", "missing_access_key", "inactive_user"):
            raise _AviationstackError("invalid_access_key", "Aviationstack rejected the configured access key.")
        if response.status_code == 429 or upstream_code in ("usage_limit_reached", "rate_limit_reached"):
            raise _AviationstackError("request_limit_reached", "Aviationstack's request limit was reached.")
        if response.status_code == 403 or upstream_code in ("function_access_restricted", "https_access_restricted"):
            raise _AviationstackError("plan_restricted", "Aviationstack restricted access to this request.")
        if response.status_code != 200 or upstream_error or not isinstance(payload, dict):
            raise _AviationstackError("upstream_error", "Aviationstack could not return flight records.")

        records = payload.get("data")
        pagination = payload.get("pagination")
        total = pagination.get("total") if isinstance(pagination, dict) else None
        if not isinstance(records, list) or not all(isinstance(record, dict) for record in records):
            raise _AviationstackError("invalid_response", "Aviationstack returned an unexpected flight response.")
        return records, isinstance(total, int) and total > len(records)

    def search_flights(self, origin: str, destination: str, departure_date: str) -> dict:
        try:
            _validate_date(departure_date)
            departures = _airport_codes(origin)
            arrivals = _airport_codes(destination)
        except ValueError as exc:
            return _error("invalid_input", str(exc))

        routes = [(dep, arr) for dep, arr in product(departures, arrivals) if dep != arr]
        if not routes:
            return _error("invalid_route", "Choose different departure and arrival airports.")

        flights = []
        truncated = False
        try:
            for dep, arr in routes:
                records, has_more = self._fetch_flights(dep_iata=dep, arr_iata=arr)
                truncated |= has_more
                flights.extend(
                    _flight_summary(record)
                    for record in records
                    if record.get("flight_date") == departure_date
                    and (record.get("departure") or {}).get("iata") == dep
                    and (record.get("arrival") or {}).get("iata") == arr
                )
        except _AviationstackError as exc:
            return _error(exc.code, str(exc))

        flights.sort(key=lambda flight: flight["departure"]["scheduled"] or "")
        return {
            "source": "aviationstack_live",
            "departure_date": departure_date,
            "departure_airports": list(departures),
            "arrival_airports": list(arrivals),
            "flights": flights[:_RESULT_LIMIT],
            "truncated": truncated or len(flights) > _RESULT_LIMIT,
            "pricing_available": False,
        }

    def get_flight_status(self, flight_number: str, flight_date: str) -> dict:
        try:
            _validate_date(flight_date)
        except ValueError as exc:
            return _error("invalid_input", str(exc))

        number = "".join(flight_number.upper().split())
        if re.fullmatch(r"[A-Z]{3}[0-9]{1,4}[A-Z]?", number):
            field = "flight_icao"
        elif re.fullmatch(r"(?:[A-Z][A-Z0-9]|[0-9][A-Z])[0-9]{1,4}[A-Z]?", number):
            field = "flight_iata"
        else:
            return _error("invalid_input", "Enter a flight designator such as AA1 or AAL1.")

        try:
            records, has_more = self._fetch_flights(**{field: number})
        except _AviationstackError as exc:
            return _error(exc.code, str(exc))
        flights = [_flight_summary(record) for record in records if record.get("flight_date") == flight_date]
        return {
            "source": "aviationstack_live",
            "flight_date": flight_date,
            "flights": flights[:_RESULT_LIMIT],
            "truncated": has_more or len(flights) > _RESULT_LIMIT,
        }

    def get_ticket_price(self, flight_id: str, travel_class: str) -> dict:
        return _error("pricing_unavailable", "Aviationstack flight records contain no ticket prices.")
