
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, HttpUrl, ValidationError
from openai import OpenAI, APIError, APITimeoutError
from utils.web_scraper import scraper

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

MODEL = "gpt-oss:latest"

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",
    timeout=300.0,
    max_retries=0
)

SYSTEM_PROMPT = """
You are a professional sales brochure generator.

Generate a compelling sales brochure based ONLY on the website content.

Return a JSON object with EXACTLY these fields:
- heading: string
- description: string
- bullet_points: array of 4 to 6 strings
- summary: string

Do not return Markdown.
Do not use code fences.
Do not add any text outside the JSON object.
Do not invent unsupported claims.
"""


class ScrapeRequest(BaseModel):
    url: HttpUrl


class BrochureResponse(BaseModel):
    heading: str = Field(min_length=1)
    description: str = Field(min_length=1)
    bullet_points: list[str] = Field(min_length=4, max_length=6)
    summary: str = Field(min_length=1)


class GenerateBrochureResponse(BaseModel):
    status: str
    data: BrochureResponse


@app.get("/")
def root():
    return {"message": "Sales Brochure Generator API"}


@app.post(
    "/generate-brochure",
    response_model=GenerateBrochureResponse
)
def generate_brochure(request: ScrapeRequest):

    try:
        content = scraper(str(request.url))

        if not isinstance(content, str) or not content.strip():
            raise HTTPException(
                status_code=422,
                detail="No website content found"
            )

        if content.startswith("An error occurred"):
            raise HTTPException(
                status_code=502,
                detail=content
            )

        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": (
                        "Generate a brochure from this website:\n\n"
                        + content[:10000]
                    )
                }
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "sales_brochure",
                    "strict": True,
                    "schema": BrochureResponse.model_json_schema()
                }
            },
            temperature=0.2
        )

        raw_content = response.choices[0].message.content

        if not raw_content:
            raise HTTPException(
                status_code=502,
                detail="Ollama returned an empty response"
            )

        # Validate and parse JSON string into a Pydantic model
        brochure = BrochureResponse.model_validate_json(raw_content)

        return GenerateBrochureResponse(
            status="success",
            data=brochure
        )

    except HTTPException:
        raise

    except APITimeoutError:
        raise HTTPException(
            status_code=504,
            detail="Ollama inference timed out"
        )

    except ValidationError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Model returned invalid JSON: {e}"
        )

    except APIError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Ollama API error: {e}"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {e}"
        )
