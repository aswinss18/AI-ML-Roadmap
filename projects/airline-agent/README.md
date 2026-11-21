# Airline agent

Install the dependencies and set your Aviationstack key in the PowerShell session.

```powershell
uv sync
$env:AVIATIONSTACK_ACCESS_KEY = '<your Aviationstack key>'
```

Look up recent flights by city, IATA metro code, or airport code. Use a date near
the present when trying the examples.

```python
from airline_agent.tools import AirLineAgentTools

tools = AirLineAgentTools()
tools.search_flights("New York", "LAX", "2026-11-21")
tools.search_flights("Paris", departure_date="2026-11-21")
tools.get_flight_status("AA1", "2026-11-21")
```

Aviationstack's free plan supplies flight status and timing. City names are
resolved locally, and requests use the provider's airport or flight designator
filters. The requested date is matched against the first page of recent results
for each airport pair, departure airport, or flight designator. Omit the
destination to list departures to any airport. Results are limited to 20 records,
with a `truncated` flag when more records may be available. An empty result
means the live feed returned no matching records in the pages checked.

Ticket prices, bookable seat inventory, and future schedules are unavailable
through this integration. `AirLineAgentTools.tools` exposes the two live lookups
and a local date/time tool for relative dates. Chat accepts an optional IANA
timezone and defaults to `Asia/Kolkata`. Clients can request tool progress and
reply chunks by sending `Accept: application/x-ndjson` to
`POST /chat-airline-agent`.
