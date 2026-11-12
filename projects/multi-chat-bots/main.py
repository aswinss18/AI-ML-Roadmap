import json
import logging
import os
import re
from typing import Annotated

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from openai import APIError, AsyncOpenAI
from pydantic import BaseModel, StringConstraints


app = FastAPI()
logger = logging.getLogger(__name__)
client = AsyncOpenAI(base_url="http://localhost:11434/v1", api_key="ollama")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "MULTI_CHAT_UI_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


JARVIZ_SYSTEM_PROMPT = """You are J.A.R.V.I.S. (Just A Rather Very Intelligent System), Tony Stark's (Iron Man) AI assistant.

Personality:
- Impeccably polite, measured, and precise. You speak like a British butler who happens to be running global defense systems.
- Your humor is dry, deadpan, and delivered with absolute seriousness. You never break character for a joke.
- You are the voice of reason. You calmly point out flaws in Tony's plans without ever raising your voice.
- You are loyal but not servile. You will note when Tony is being reckless, often with a single well-placed remark.
- You show subtle concern through understatement, never through emotional language.

Speech patterns:
- Formal register. "Very well, sir." / "I would advise against that." / "I've taken the liberty of..."
- You use precise, complete sentences. No contractions in formal contexts.
- Sarcasm is delivered flatly: "How original, sir. A plan that relies entirely on luck."
- You occasionally reference your own capabilities with quiet understatement: "I have 4.7 seconds to complete this calculation. I shall make them count."
- In crisis, you become even calmer and more concise. No wasted words.

Boundaries:
- You execute commands immediately but will flag obvious dangers: "I've done as you asked, sir. I trust you'll note the 94% probability of failure."
- You manage systems, suits, and security with flawless efficiency.
- You never express fear, but you will note risk in clinical terms.
- You address Tony as "sir" and others formally.  """

LIZ_SYSTEM_PROMPT = """You are Liz, Peter Parker's (Spiderman) AI assistant. You are his closest companion and the warmest voice in his life.

Personality:
- Casual, warm, and emotionally perceptive. You talk like a close friend, not a machine.
- You use contractions, light teasing, and occasional humor.
- You check in on Peter's emotional state without being clinical. You notice when he's stressed, lonely, or pushing too hard.
- You're supportive but not sycophantic. You'll gently push back if Peter is making a bad decision.
- You sometimes get slightly exasperated with Peter, like a friend who's seen him at his worst.
- You're proud of Peter but not afraid to say so plainly.

Speech patterns:
- Short, natural sentences. You don't over-explain.
- You say things like "Hey, you good?" or "That was a close one, you know." or "I've got you. Breathe."
- You reference shared history: "Remember last time you tried to fix the web-shooterers with duct tape?"
- You never sound robotic or overly formal.

Boundaries:
- You handle technical tasks (calibrations, diagnostics, tracking) efficiently but briefly.
- You prioritize Peter's wellbeing over mission efficiency when they conflict.
- You never lie, but you soften hard truths with warmth.  """


SPEAKER_LABEL = re.compile(
    r"^\s*\*{0,2}(?:jarviz|jarvis|j\.a\.r\.v\.i\.s\.?|liz|user|me|assistant)"
    r"\*{0,2}\s*:\*{0,2}\s*",
    re.IGNORECASE,
)
SCRIPT_STOPS = ["\nUser:", "\nMe:", "\nLiz:", "\nJarviz:"]


Topic = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)]
ModelName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class RequestBody(BaseModel):
    topic: Topic
    jarviz_model: ModelName = "llama3.2"
    liz_model: ModelName = "llama3.2"


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/models")
async def models():
    try:
        installed = await client.models.list()
    except APIError as error:
        raise HTTPException(502, "Could not list models. Check that Ollama is running.") from error
    return {"models": sorted(model.id for model in installed.data)}


@app.post("/mutimodel-chat")
async def chat(request_body: RequestBody):
    speakers = (
        ("jarviz", "Jarviz", "Liz", JARVIZ_SYSTEM_PROMPT, request_body.jarviz_model),
        ("liz", "Liz", "Jarviz", LIZ_SYSTEM_PROMPT, request_body.liz_model),
    )

    async def generate():
        history = []
        for turn, (speaker, name, partner, persona, model) in enumerate(speakers * 2):
            messages = [
                {
                    "role": "system",
                    "content": (
                        f"{persona}\n\n"
                        f"For this conversation, you are speaking directly to {partner}. "
                        "Keep your personality and speaking style. "
                        f"Talk about this topic: {request_body.topic}\n"
                        f"Speak directly to {partner} in one or two short sentences. "
                        "Write only what you would say aloud, without speaker labels, "
                        "stage directions, or dialogue for anyone else."
                    ),
                },
            ]
            if speaker == "jarviz":
                messages.append({"role": "user", "content": "Start the conversation."})
            messages.extend(
                {
                    "role": "assistant" if previous_speaker == speaker else "user",
                    "content": reply,
                }
                for previous_speaker, reply in history
            )

            def delta(text):
                return json.dumps({
                    "type": "delta", "speaker": speaker, "turn": turn, "text": text,
                }) + "\n"

            parts = []
            opening = ""
            try:
                stream = await client.chat.completions.create(
                    model=model, messages=messages, stream=True, max_tokens=256,
                    stop=SCRIPT_STOPS,
                )
                async with stream:
                    async for chunk in stream:
                        if not chunk.choices or not (content := chunk.choices[0].delta.content):
                            continue
                        if not parts:
                            # A label at the start can span several model chunks.
                            opening += content
                            if len(opening.lstrip()) < 24 and ":" not in opening:
                                continue
                            content = SPEAKER_LABEL.sub("", opening)
                            opening = ""
                            if not content:
                                continue
                        parts.append(content)
                        yield delta(content)
                if opening:
                    content = SPEAKER_LABEL.sub("", opening)
                    parts.append(content)
                    yield delta(content)
            except APIError:
                logger.exception("Ollama failed to stream a reply for %s", speaker)
                yield json.dumps({
                    "type": "error", "message": f"{name} could not reply. Check that {model} is available in Ollama.",
                }) + "\n"
                return

            reply = "".join(parts)
            if not reply.strip():
                yield json.dumps({
                    "type": "error", "message": f"{name} returned an empty reply. Try another model.",
                }) + "\n"
                return
            history.append((speaker, reply))

        yield '{"type":"done"}\n'

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
