
import math

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, HttpUrl, ValidationError
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

OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_TIMEOUT = 300.0
CHARS_PER_TOKEN_ESTIMATE = 3

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
    model: str = Field(default="gpt-oss:latest", min_length=1)


class BrochureCopy(BaseModel):
    heading: str = Field(min_length=1)
    description: str = Field(min_length=1)
    bullet_points: list[str] = Field(min_length=4, max_length=6)
    summary: str = Field(min_length=1)


class BrochureResponse(BrochureCopy):
    colors: dict[str, str] = Field(default_factory=dict)


class GenerateBrochureResponse(BaseModel):
    status: str
    data: BrochureResponse


def get_model_context_length(model: str) -> int:
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/show",
            json={"model": model},
            timeout=15.0,
        )
        response.raise_for_status()
        model_data = response.json()
    except requests.Timeout as error:
        raise HTTPException(
            status_code=504,
            detail="Timed out while checking the selected Ollama model",
        ) from error
    except requests.RequestException as error:
        raise HTTPException(
            status_code=502,
            detail=f"Could not inspect the selected Ollama model: {error}",
        ) from error
    except ValueError as error:
        raise HTTPException(
            status_code=502,
            detail="Ollama returned invalid model information",
        ) from error

    if not isinstance(model_data, dict):
        raise HTTPException(
            status_code=502,
            detail="Ollama returned invalid model information",
        )

    model_info = model_data.get("model_info")
    if not isinstance(model_info, dict):
        raise HTTPException(
            status_code=502,
            detail="Ollama did not provide model context information",
        )

    architecture = model_info.get("general.architecture")
    context_length = model_info.get(f"{architecture}.context_length")
    if (
        not isinstance(context_length, int)
        or isinstance(context_length, bool)
        or context_length < 1
    ):
        raise HTTPException(
            status_code=502,
            detail=(
                f"Could not determine the context window for Ollama model "
                f"'{model}'. Check that the model is installed and Ollama is up to date."
            ),
        )

    return context_length


def get_context_settings(context_length: int) -> tuple[int, int, int]:
    output_tokens = min(512, max(128, context_length // 8))
    prompt_reserve = min(512, max(64, context_length // 8))
    input_tokens = context_length - output_tokens - prompt_reserve
    if input_tokens < 1:
        raise HTTPException(
            status_code=502,
            detail="The selected model's context window is too small for brochure generation",
        )

    max_content_chars = input_tokens * CHARS_PER_TOKEN_ESTIMATE
    return output_tokens, prompt_reserve, max_content_chars


@app.get("/")
def root():
    return {"message": "Sales Brochure Generator API"}


@app.post(
    "/generate-brochure",
    response_model=GenerateBrochureResponse
)
def generate_brochure(request: ScrapeRequest):

    try:
        model_context_length = get_model_context_length(request.model)
        output_tokens, prompt_reserve, max_content_chars = get_context_settings(
            model_context_length
        )
        scraped_data = scraper(str(request.url), max_chars=max_content_chars)
        if isinstance(scraped_data, str):
            raise HTTPException(status_code=502, detail=scraped_data)
        if not isinstance(scraped_data, dict):
            raise HTTPException(
                status_code=502,
                detail="The website scraper returned an invalid response",
            )

        content = scraped_data.get("text")
        if not isinstance(content, str) or not content.strip():
            raise HTTPException(
                status_code=422,
                detail="No website content found"
            )

        scraped_colors = scraped_data.get("style")
        if not isinstance(scraped_colors, dict):
            scraped_colors = {}
        colors = {
            color_name: color_value
            for color_name in (
                "primary_color",
                "secondary_color",
                "tertiary_color",
            )
            if isinstance(
                color_value := scraped_colors.get(color_name),
                str,
            )
            and color_value.strip()
        }

        estimated_input_tokens = math.ceil(
            len(content) / CHARS_PER_TOKEN_ESTIMATE
        )
        request_context_length = min(
            model_context_length,
            estimated_input_tokens + prompt_reserve + output_tokens,
        )
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": request.model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": (
                            "Generate a brochure from this website:\n\n"
                            + content
                        ),
                    },
                ],
                "format": BrochureCopy.model_json_schema(),
                "stream": False,
                "options": {
                    "num_ctx": request_context_length,
                    "num_predict": output_tokens,
                    "temperature": 0.2,
                    "repeat_penalty": 1.1,
                },
            },
            timeout=OLLAMA_TIMEOUT,
        )
        response.raise_for_status()
        response_data = response.json()

        if not isinstance(response_data, dict):
            raise HTTPException(
                status_code=502,
                detail="Ollama returned an invalid response",
            )

        message = response_data.get("message")
        raw_content = message.get("content") if isinstance(message, dict) else None

        if not raw_content:
            raise HTTPException(
                status_code=502,
                detail="Ollama returned an empty response"
            )

        # Validate and parse JSON string into a Pydantic model
        brochure_copy = BrochureCopy.model_validate_json(raw_content)
        brochure = BrochureResponse(
            **brochure_copy.model_dump(),
            colors=colors,
        )

        return GenerateBrochureResponse(
            status="success",
            data=brochure
        )

    except HTTPException:
        raise

    except ValidationError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Model returned invalid JSON: {e}"
        )

    except requests.Timeout as e:
        raise HTTPException(
            status_code=504,
            detail="Ollama inference timed out",
        ) from e

    except requests.HTTPError as e:
        error_detail = e.response.text if e.response is not None else str(e)
        raise HTTPException(
            status_code=502,
            detail=f"Ollama API error: {error_detail}",
        ) from e

    except requests.RequestException as e:
        raise HTTPException(
            status_code=502,
            detail=f"Could not connect to Ollama: {e}",
        ) from e

    except ValueError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Ollama returned an invalid response: {e}",
        ) from e

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {e}"
        )
