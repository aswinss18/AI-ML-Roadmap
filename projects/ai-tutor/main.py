import json
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import APIError, OpenAI
from pydantic import BaseModel, Field
from fastapi.responses import StreamingResponse


app = FastAPI()
logger = logging.getLogger(__name__)
# Ollama
client = OpenAI(base_url="http://localhost:11434/v1", api_key="YOUR_OPENAI_API_KEY")  

app.add_middleware(
    CORSMiddleware,
    allow_origins=["localhost:3000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



class RequestBody(BaseModel):
    question: str = Field(description="The question to ask the AI tutor")
    model: str = Field(description="The model to use for the AI tutor",default="llama3.2")    
      

SYSTEM_PROMPT = """You are an AI tutor that provides detailed explanations and step-by-step solutions to questions. 
Your responses should be clear, concise, and educational, helping the user understand the concepts behind the answers.
You teach the asking question like to a 6 year old, using simple language and examples. You should also provide additional context and background information to enhance the user's understanding of the topic. """




@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/teach-stream")
def teach_stream(request_body: RequestBody):
    """
    Endpoint to stream responses from the AI tutor based on the provided question and model.
    """
    def generate_events():
        try:
            response = client.chat.completions.create(
                model=request_body.model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": request_body.question},
                ],
                stream=True,
            )

            for chunk in response:
                content = chunk.choices[0].delta.content
                if content:
                    yield f"data: {json.dumps({'content': content})}\n\n"

            yield "data: [DONE]\n\n"
        except APIError:
            logger.exception("AI tutor stream failed")
            error = {
                "detail": (
                    "The AI model could not complete the request. Check that "
                    "Ollama is running and the selected model is available."
                )
            }
            yield f"event: error\ndata: {json.dumps(error)}\n\n"

    return StreamingResponse(
        generate_events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )