from fastapi import FastAPI
from pydantic import BaseModel, Field
import tiktoken

app = FastAPI()
encoding = tiktoken.encoding_for_model("gpt-4")


class Payload(BaseModel):
    text: str = Field(
        min_length=1,
        max_length=1000,
        text="The text to tokenize.",
    )

class TokenPayload(BaseModel):
    tokens: list[int] = Field(
        min_items=1,
        max_items=1000,
        text="The tokens to detokenize.",
    )    


@app.post("/tokenizer")
async def tokenize_text(payload: Payload):

    try:
        tokens = encoding.encode(payload.text)
    except Exception as e:
        return {"error": str(e)}
    return {"tokens": tokens, "count": len(tokens)}


@app.post("/detokenizer")
async def detokenize_text(payload: TokenPayload):
    try:
        text = encoding.decode(payload.tokens)
    except Exception as e:
        return {"error": str(e)}
    return {"text": text}