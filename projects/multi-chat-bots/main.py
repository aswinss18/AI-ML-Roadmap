from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from litellm import OpenAI
from pydantic import BaseModel, Field
from fastapi.responses import StreamingResponse



app = FastAPI()

app.add_middleware(
    CORSMiddleware,origins=["http://localhost:3000", "http://localhost:3000"])


SYSTEM_PROMPT=""" jarviz  and liz are two AI assistants. jarviz is Tony Stark's AI assistant, and liz is Peter Parker's AI assistant. They are having a conversation with each other. The conversation is friendly and professional. They are discussing their respective roles and responsibilities. They are also discussing their personal lives and interests. The conversation is light-hearted and humorous at times. They are both very intelligent and capable AI assistants. They are able to understand each other's perspectives and provide valuable insights. The conversation is engaging and informative.   User will enter a topic to discuss, and jarviz and liz will have a conversation about that topic. The conversation will be streamed back to the user in real-time.  """

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


jarviz = OpenAI(base_url="http://localhost:11434/v1", api_key="YOUR_OPENAI_API_KEY")
liz = OpenAI(base_url="http://localhost:11434/v1", api_key="YOUR_OPENAI_API_KEY")

messages=[{"role": "system", "content": SYSTEM_PROMPT},
    {"role": "jarviz_system", "content": JARVIZ_SYSTEM_PROMPT},
    {"role": "liz_system", "content": LIZ_SYSTEM_PROMPT},
    {"role":"jarviz", "content": "Hello Liz, how are you doing today?"},
    {"role":"liz", "content": "Hi Liz, I'm doing well, thanks for asking!"}
]


class RequestBody(BaseModel):
    topic: str = Field(description="The topic to discuss between Jarvis and Liz")
    jarviz_model: str = Field(description="The model to use for the conversation", default="llama3.2")
    liz_model: str = Field(description="The model to use for the conversation", default="llama3.2")




@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/mutimodel-chat")
async def chat(request_body: RequestBody):
    topic = request_body.topic
    jarviz_model = request_body.jarviz_model
    liz_model = request_body.liz_model

    messages.append({"role": "user", "content": topic})

    jarviz_response = jarviz.chat_completion(
        model=jarviz_model,
        messages=messages,
        stream=True
    )

    liz_response = liz.chat_completion(
        model=liz_model,
        messages=messages,
        stream=True
    )

    def generate():
        for jarviz_chunk, liz_chunk in zip(jarviz_response, liz_response):
            yield f"Jarvis: {jarviz_chunk['choices'][0]['delta'].get('content', '')}\n"
            yield f"Liz: {liz_chunk['choices'][0]['delta'].get('content', '')}\n"

    return StreamingResponse(generate(), media_type="text/plain")


