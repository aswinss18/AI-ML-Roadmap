import os
import json

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from dotenv import load_dotenv
from groq import Groq


load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

app = FastAPI()


class SummarizeRequest(BaseModel):
    text: str = Field(
        min_length=5,
        max_length=1000,
        description="The text to summarize.",
    )


class StructuredSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    one_line_summary: str
    key_points: list[str]
    mentioned_technologies: list[str]


class SummarizeResponse(BaseModel):
    summary: StructuredSummary
    source_length: int


@app.post("/summarize", response_model=SummarizeResponse)
def summarize(request: SummarizeRequest):
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Summarize the supplied text. "
                        "Preserve important facts and do not invent details."
                    ),
                },
                {
                    "role": "user",
                    "content": request.text,
                },
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "structured_summary",
                    "strict": True,
                    "schema": StructuredSummary.model_json_schema(),
                },
            },
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("Groq returned an empty response.")

        summary = StructuredSummary.model_validate_json(content)

        return SummarizeResponse(
            summary=summary,
            source_length=len(request.text),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"The AI service could not generate a summary. Exact error: {exc}",
        ) from exc
### Gemini API Key



# import os

# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel, Field
# from dotenv import load_dotenv
# from google import genai
# from google.genai import types


# load_dotenv()

# client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# app = FastAPI()


# class SummarizeRequest(BaseModel):
#     text: str = Field(
#         min_length=5,
#         max_length=1000,
#         description="The text to summarize.",
#     )


# class StructuredSummary(BaseModel):
#     title: str
#     one_line_summary: str
#     key_points: list[str]
#     mentioned_technologies: list[str]


# class SummarizeResponse(BaseModel):
#     summary: StructuredSummary
#     source_length: int


# @app.post("/summarize", response_model=SummarizeResponse)
# def summarize(request: SummarizeRequest):
#     try:
#         response = client.models.generate_content(
#             model="gemini-3.8-flash",
#             contents=request.text,
#             config=types.GenerateContentConfig(
#                 system_instruction=(
#                     "Summarize the supplied text. "
#                     "Preserve important facts and do not invent details."
#                 ),
#                 response_mime_type="application/json",
#                 response_schema=StructuredSummary,
#             ),
#         )

#         return SummarizeResponse(
#             summary=response.parsed,
#             source_length=len(request.text),
#         )

#     except Exception as exc:
#         raise HTTPException(
#             status_code=502,
#             detail=f"The AI service could not generate a summary. Exact error: {exc}",
#         ) from exc




