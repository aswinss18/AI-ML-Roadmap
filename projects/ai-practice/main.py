from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()

class SummarizeRequest(BaseModel):
    text: str = Field(min_length=20)

class SummarizeResponse(BaseModel):
    summary: str
    source_length: int

@app.post("/summarize", response_model=SummarizeResponse)
def summarize(request: SummarizeRequest):
    return SummarizeResponse(
        summary="Mock summary: " + request.text[:60],
        source_length=len(request.text),
    )