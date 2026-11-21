import json
from json import tool
import os
from datetime import date
from typing import Annotated, Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, StreamingResponse
from openai import APIError, BadRequestError, OpenAI
from pydantic import BaseModel, Field, StringConstraints

from airline_agent.tools import SYSTEM_PROMPT, AirLineAgentTools


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
    history: list[ChatTurn] = Field(default_factory=list, max_length=12)


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
def chat_airline_agent(request: ChatRequest):
    messages = [
        {"role": "system", "content": f"{SYSTEM_PROMPT}\nToday's date is {date.today().isoformat()}."},
        *(turn.model_dump() for turn in request.history),
        {"role": "user", "content": request.message},
    ]

    try:
        completion = client.chat.completions.create(
            model=request.model,
            messages=messages,
            tools=chat_tools,
        )
        if not completion.choices:
            raise HTTPException(status_code=502, detail="Ollama returned an empty answer.")
        answer = completion.choices[0].message
        if not answer.tool_calls:
            if not answer.content:
                raise HTTPException(status_code=502, detail="Ollama returned an empty answer.")
            return PlainTextResponse(answer.content)

        if len(answer.tool_calls) > 4:
            raise HTTPException(status_code=502, detail="The model requested too many lookups. Try one route at a time.")

        messages.append(answer.model_dump(exclude_none=True, include={"role", "content", "tool_calls"}))
        results = []
        for call in answer.tool_calls:
            result = run_flight_tool(call)
            results.append(result)
            tool_payload = {key: value for key, value in result.items() if key != "pricing_available"}
            if len(result.get("flights", ())) > 6:
                tool_payload.update(flights=result["flights"][:6], truncated=True)
            messages.append({
                "role": "tool",
                "tool_call_id": call.id,
                "content": json.dumps(tool_payload, ensure_ascii=False),
            })

        if not any(result.get("flights") for result in results):
            notices = [result["error"]["message"] if "error" in result else result["notice"] for result in results]
            return PlainTextResponse("\n\n".join(dict.fromkeys(notices)))

        stream = client.chat.completions.create(model=request.model, messages=messages, stream=True)
    except BadRequestError as exc:
        raise HTTPException(
            status_code=502,
            detail="Ollama rejected the chat request. Choose an installed model that supports tools.",
        ) from exc
    except APIError as exc:
        raise HTTPException(status_code=502, detail="Ollama could not answer. Check the model and try again.") from exc

    def reply_chunks():
        with stream:
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

    return StreamingResponse(reply_chunks(), media_type="text/plain")


def run_flight_tool(call):
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
            if destination.strip().casefold() in {"", "null", "none", "any", "anywhere", "any destination", "any other place"}:
                arguments["destination"] = None
        return flight_tools[call.function.name](**arguments)
    except (TypeError, ValueError):
        return {"error": {"message": "The model supplied invalid flight lookup arguments."}}
