from fastapi import FastAPI
from pydantic import BaseModel, Field
from utils.web_scraper import scraper
from openai import OpenAI

app = FastAPI()


# //oolama open source model
Model = "gpt-oss:latest"

client = OpenAI(base_url="http://localhost:8080/v1", api_key="YOUR_API_KEY",timeout=30,max_retries=3)


SYSTEM_PROMPT = "You are a professional sales brochure generator. Your task is to create a compelling and persuasive sales brochure based on the provided content. The brochure should be well-structured, engaging, and tailored to the target audience. Use clear headings, bullet points, and persuasive language to highlight the key features and benefits of the product or service. Ensure that the brochure is visually appealing and easy to read. Avoid using overly technical jargon and focus on creating a brochure that effectively communicates the value proposition to potential customers."


class ScrapeRequest(BaseModel):
    url: str = Field(
        min_length=5,
        max_length=2048,
        description="The URL of the webpage to scrape.",
    )




@app.get("/")
async def root():
    return {"message": "Welcome to the Sales Brochure Generator API!"}


@app.post("/generate-brochure")
async def generate_brochure(request: ScrapeRequest):

    # Scrape the content from the provided URL
    scraped_content = scraper(request.url)

    if "An error occurred" in scraped_content:
        return {"error": scraped_content}

    # Prepare the prompt for the model
    prompt = f"{SYSTEM_PROMPT}\n\nContent:\n{scraped_content}"

    try:
        # Generate the sales brochure using the model
        response = client.chat.completions.create(
            model=Model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": scraped_content},
            ],
            max_tokens=1000,
            temperature=0.7,
        )

        brochure_text = response.choices[0].message.content

        return {"brochure": brochure_text}

    except Exception as e:
        return {"error": str(e)}