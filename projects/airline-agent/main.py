from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware 
from openai import OpenAI
from pydantic import BaseModel, Field
from src.airline_agent.tools import SYSTEM_PROMPT



app=FastAPI()

CORS_ORIGINS = ["http://localhost:3000"]
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


client = OpenAI(base_url="http://localhost:11434/v1", api_key="YOUR_API_KEY")

message = {"role": "system", "content": SYSTEM_PROMPT}




@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/models")
async def get_models():
    models = client.models.list()
    return {"models": [model.id for model in models.data]}


