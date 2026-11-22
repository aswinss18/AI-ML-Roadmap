import json
import os
import re
from datetime import date
from typing import Annotated, Literal
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, StreamingResponse
from openai import APIError, BadRequestError, OpenAI
from pydantic import BaseModel, Field, StringConstraints

from airline_agent.tools import SYSTEM_PROMPT, AirLineAgentTools, relative_date_word


app = FastAPI(title="Airline Agent")
origins = os.getenv("AIRLINE_AGENT_UI_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in origins.split(",") if origin.strip()],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama", timeout=120, max_retries=0)
airline = AirLineAgentTools()
flight_tools = {
    "search_flights": airline.search_flights,
    "get_flight_status": airline.get_flight_status,
}
chat_tools = [
    {
        "type": "function",
        "function": {key: value for key, value in tool.items() if key != "type"},
    }
    for tool in airline.tools
]

MessageText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=8000)]
LookupText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: MessageText


class ChatRequest(BaseModel):
    message: MessageText
    model: LookupText
    think: bool = False
    history: list[ChatTurn] = Field(default_factory=list, max_length=12)
    timezone: LookupText = "Asia/Kolkata"


class ChatResponse(BaseModel):
    message: MessageText
    status: Literal["chat", "error", "tool call"]
    tool_calls: list[dict] = Field(default_factory=list)


class RouteSearch(BaseModel):
    origin: LookupText
    destination: LookupText | None = None
    departure_date: date


class FlightSearch(BaseModel):
    flight_number: LookupText
    flight_date: date


@app.get("/")
def root():
    return {"message": "Hello World"}


@app.get("/models")
def get_models():
    try:
        models = client.models.list()
    except APIError as exc:
        raise HTTPException(status_code=502, detail="Could not reach Ollama to load models.") from exc
    return {"models": [model.id for model in models.data]}


@app.post("/flights/search")
def search_flights(request: RouteSearch):
    return airline.search_flights(request.origin, request.destination, request.departure_date.isoformat())


@app.post("/flights/status")
def flight_status(request: FlightSearch):
    return airline.get_flight_status(request.flight_number, request.flight_date.isoformat())


@app.post("/chat-airline-agent", response_class=PlainTextResponse)
def chat_airline_agent(request: ChatRequest, accept: Annotated[str, Header()] = ""):
    try:
        ZoneInfo(request.timezone)
    except (ValueError, ZoneInfoNotFoundError) as exc:
        raise HTTPException(status_code=422, detail="Supply a valid IANA time zone.") from exc

    events = chat_events(request)
    if "application/x-ndjson" in accept.lower():
        return StreamingResponse(
            (json.dumps(event, ensure_ascii=False) + "\n" for event in events),
            media_type="application/x-ndjson",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    for event in events:
        if event["type"] == "error":
            raise HTTPException(status_code=502, detail=event["message"])
        if event["type"] == "delta":
            return StreamingResponse(text_chunks(event["text"], events), media_type="text/plain")
    raise HTTPException(status_code=502, detail="Ollama returned an empty answer.")


def text_chunks(first, events):
    yield first
    for event in events:
        if event["type"] == "delta":
            yield event["text"]
        elif event["type"] == "error":
            raise RuntimeError(event["message"])


def explicit_relative_route(message: str) -> tuple[str, str | None, str] | None:
    cleaned = " ".join(re.sub(r"[.!?,;…/]+", " ", message.casefold()).split())
    cleaned = cleaned.removesuffix(" please")
    route = re.fullmatch(
        r"(?:(?:show(?: me)?|find(?: me)?|list|any|are there any|what (?:are|were) the) )?"
        r"(?:flights?|fligths?) (?:on )?(?:(?P<date>\w+) )?"
        r"from (?P<origin>.+?) to (?P<destination>.+)",
        cleaned,
    )
    if not route:
        return None

    origin, destination = route["origin"], route["destination"]
    date_before = relative_date_word(route["date"] or "")
    if route["date"] and not date_before:
        return None
    place, _, last_word = destination.rpartition(" ")
    date_after = relative_date_word(last_word) if place else None
    if date_after:
        destination = place.removesuffix(" on")
    if (date_before and date_after and date_before != date_after) or not (date_before or date_after):
        return None
    if re.search(r"\b(and|or|via|with|only|after|before)\b", f"{origin} {destination}"):
        return None
    return origin, route_destination(destination), date_before or date_after


def route_destination(value: str) -> str | None:
    if value.strip().casefold() in {"", "null", "none", "any", "anywhere", "any destination", "any other place"}:
        return None
    return value


def flight_tool_end(name, call_id, result):
    count = len(result.get("flights", ()))
    failed = "error" in result
    detail = "Lookup unsuccessful" if failed else f"{count} flight {'record' if count == 1 else 'records'}"
    return {"type": "tool_end", "tool": name, "id": call_id, "detail": detail, "failed": failed}


def route_reply(result, departure_date):
    if "error" in result:
        return result["error"]["message"]
    if not result["flights"]:
        return result["notice"]

    examples = []
    for flight in result["flights"][:4]:
        departure, arrival = flight["departure"], flight["arrival"]
        number = flight["flight_number"] or flight["flight_icao"] or "Flight number unavailable"
        status = (flight["status"] or "Status unavailable").replace("_", " ").capitalize()
        details = f"**{number}** · {departure['iata']} → {arrival['iata']} · {status}"
        if departure["scheduled"]:
            details += f" · Scheduled departure: `{departure['scheduled']}`"
        examples.append(f"- {details}")

    reply = f"Aviationstack returned flight records for **{departure_date}**.\n\n" + "\n".join(examples)
    if result["truncated"] or len(result["flights"]) > len(examples):
        reply += "\n\nThis reply shows a subset of the live records."
    return reply


def chat_events(request: ChatRequest):
    direct_route = explicit_relative_route(request.message)
    relative_dates = set(re.findall(r"\b(today|tomorrow|yesterday)\b", request.message.casefold()))
    if direct_route:
        relative_dates.add(direct_route[2])
    clock_reported = bool(relative_dates)
    if clock_reported:
        yield {"type": "tool_start", "tool": "get_datetime", "id": 0}
    clock = airline.get_datetime(request.timezone)
    if clock_reported:
        detail = ", ".join(f"{word} · {clock[word]}" for word in ("yesterday", "today", "tomorrow") if word in relative_dates)
        yield {"type": "tool_end", "tool": "get_datetime", "id": 0, "detail": f"{detail} ({clock['timezone']})"}

    if direct_route:
        origin, destination, day = direct_route
        departure_date = clock[day]
        yield {"type": "tool_start", "tool": "search_flights", "id": 1}
        result = flight_tools["search_flights"](origin, destination, departure_date)
        yield flight_tool_end("search_flights", 1, result)
        yield {"type": "delta", "text": route_reply(result, departure_date)}
        yield {"type": "done"}
        return

    yield {"type": "thinking"}
    messages = [
        {"role": "system", "content": f"{SYSTEM_PROMPT}\nLocal clock for this request: {json.dumps(clock)}"},
        *(turn.model_dump() for turn in request.history),
        {"role": "user", "content": request.message},
    ]

    reasoning_effort = "medium" if request.think else "none"
    try:
        call_count = 0
        available_tools = chat_tools
        for _ in range(3):
            completion = client.chat.completions.create(
                model=request.model, messages=messages, tools=available_tools, reasoning_effort=reasoning_effort,
            )
            answer = completion.choices[0].message if completion.choices else None
            if not answer or not (answer.content or answer.tool_calls):
                yield {"type": "error", "message": "Ollama returned an empty answer."}
                return
            if not answer.tool_calls:
                yield {"type": "delta", "text": answer.content}
                yield {"type": "done"}
                return
            if call_count + len(answer.tool_calls) > 4:
                break

            messages.append(answer.model_dump(exclude_none=True, include={"role", "content", "tool_calls"}))
            results = []
            for call in answer.tool_calls:
                call_count += 1
                name = call.function.name if call.type == "function" else ""
                if name == "get_datetime":
                    if not clock_reported:
                        yield {"type": "tool_start", "tool": name, "id": call_count}
                        yield {"type": "tool_end", "tool": name, "id": call_count, "detail": f"{clock['today']} · {clock['timezone']}"}
                        clock_reported = True
                    result = clock
                else:
                    if name in flight_tools:
                        yield {"type": "tool_start", "tool": name, "id": call_count}
                    result = run_flight_tool(call, clock)
                    results.append(result)
                    if name in flight_tools:
                        yield flight_tool_end(name, call_count, result)

                tool_payload = {key: value for key, value in result.items() if key != "pricing_available"}
                if len(result.get("flights", ())) > 6:
                    tool_payload.update(flights=result["flights"][:6], truncated=True)
                messages.append({"role": "tool", "tool_call_id": call.id, "content": json.dumps(tool_payload, ensure_ascii=False)})

            if not results:
                available_tools = [tool for tool in chat_tools if tool["function"]["name"] != "get_datetime"]
                yield {"type": "thinking"}
                continue
            if not any(result.get("flights") for result in results):
                notices = [result["error"]["message"] if "error" in result else result["notice"] for result in results]
                yield {"type": "delta", "text": "\n\n".join(dict.fromkeys(notices))}
                yield {"type": "done"}
                return

            yield {"type": "writing"}
            with client.chat.completions.create(
                model=request.model, messages=messages, stream=True, reasoning_effort=reasoning_effort,
            ) as stream:
                has_reply = False
                for chunk in stream:
                    if chunk.choices and (content := chunk.choices[0].delta.content):
                        has_reply = True
                        yield {"type": "delta", "text": content}
            if not has_reply:
                reply = "\n\n".join(
                    route_reply(result, result.get("departure_date") or result.get("flight_date"))
                    for result in results
                )
                yield {"type": "delta", "text": reply}
            yield {"type": "done"}
            return

        yield {"type": "error", "message": "The model requested too many lookups. Try one route or date at a time."}
    except BadRequestError as exc:
        message = "Ollama rejected the chat request. Choose an installed model that supports tools."
        if request.think and "does not support thinking" in exc.message:
            message = "This model does not support thinking. Turn off Think or choose another model."
        yield {"type": "error", "message": message}
    except APIError:
        yield {"type": "error", "message": "Ollama could not answer. Check the model and try again."}


def run_flight_tool(call, clock):
    if call.type != "function" or call.function.name not in flight_tools:
        return {"error": {"message": "This flight tool is unavailable."}}
    try:
        arguments = json.loads(call.function.arguments)
        if not isinstance(arguments, dict) or not all(
            isinstance(value, str) or (
                call.function.name == "search_flights" and key == "destination" and value is None
            )
            for key, value in arguments.items()
        ):
            raise ValueError("The tool expects text arguments.")
        destination = arguments.get("destination")
        if call.function.name == "search_flights" and isinstance(destination, str):
            arguments["destination"] = route_destination(destination)
        date_field = "departure_date" if call.function.name == "search_flights" else "flight_date"
        requested_date = relative_date_word(arguments.get(date_field, ""))
        if requested_date:
            arguments[date_field] = clock[requested_date]
        return flight_tools[call.function.name](**arguments)
    except (TypeError, ValueError):
        return {"error": {"message": "The model supplied invalid flight lookup arguments."}}
