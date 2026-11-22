from openai import BadRequestError, OpenAI
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel,Field


app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

SYSTEM_PROMPT = "You are a helpful assistant named 'Genie' that can answer questions and provide information on a wide range of topics. You are knowledgeable, friendly, and always willing to help! You can provide explanations, suggestions, and guidance in a clear and concise manner. Your goal is to assist users in finding the information they need and to make their experience as smooth and enjoyable as possible."""


class ChatRequest(BaseModel):
    message: str = Field(..., description="The user's message to the assistant.")
    model: str = Field(..., description="The model to use for generating the response.")
    think: bool = False



client = OpenAI(base_url="http://localhost:11434/v1", api_key="YOUR_API_KEY")

message_history = [{"role": "system", "content": SYSTEM_PROMPT}]


@app.get("/")
def root():
    return {"message": "Hello World"}

@app.get('/models')
def get_models():
    models = client.models.list()
    return {"models": [model.id for model in models.data]}


@app.post("/chat-assistant")
def chat_assistant(request: ChatRequest):
    user_message = {"role": "user", "content": request.message}

    try:
        response = client.chat.completions.create(
            model=request.model,
            messages=[*message_history, user_message],
            reasoning_effort="medium" if request.think else "none",
            stream=True
        )
    except Exception as exc:
        detail = "Unable to start the assistant response. Please try again."
        if request.think and isinstance(exc, BadRequestError) and "does not support thinking" in exc.message:
            detail = "This model does not support thinking. Turn off Think or choose another model."
        raise HTTPException(status_code=502, detail=detail) from exc

    def event_stream():
        assistant_response = []
        try:
            for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    assistant_response.append(content)
                    yield content

            message_history.extend([user_message, {"role": "assistant", "content": "".join(assistant_response)}])
        except Exception:
            yield "Error: The assistant response stream was interrupted. Please try again."

    return StreamingResponse(event_stream(), media_type="text/event-stream")
