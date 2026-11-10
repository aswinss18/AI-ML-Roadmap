import re

from bs4 import BeautifulSoup
import requests


CSS_COLOR_PATTERN = r"(?:#[\da-f]{3,8}\b|(?:rgb|hsl)a?\([^)]*\))"
CSS_VARIABLE_PATTERN = re.compile(
    rf"--([\w-]+)\s*:\s*({CSS_COLOR_PATTERN})",
    re.IGNORECASE,
)
COLOR_ROLE_ALIASES = {
    "primary_color": ("primary", "primary-color", "color-primary", "accent", "brand", "theme", "logo"),
    "secondary_color": ("secondary", "secondary-color", "color-secondary"),
    "tertiary_color": ("tertiary", "tertiary-color", "color-tertiary"),
}


def extract_brand_colors(soup):
    colors = {}
    metadata_names = {
        "primary_color": ("theme-color", "primary-color"),
        "secondary_color": ("secondary-color",),
        "tertiary_color": ("tertiary-color",),
    }

    for role, names in metadata_names.items():
        for name in names:
            meta = soup.find("meta", attrs={"name": name})
            if meta and meta.get("content"):
                colors[role] = meta["content"].strip()
                break

    css = "\n".join(style.get_text() for style in soup.find_all("style"))
    css_variables = {
        name.lower(): value.strip()
        for name, value in CSS_VARIABLE_PATTERN.findall(css)
    }

    for role, aliases in COLOR_ROLE_ALIASES.items():
        if role in colors:
            continue

        for alias in aliases:
            value = css_variables.get(alias)
            if value:
                colors[role] = value
                break

        if role not in colors:
            for name, value in css_variables.items():
                if any(alias in name for alias in aliases):
                    colors[role] = value
                    break

    return colors


def scraper(url, max_chars=None):
    """
    Scrapes the content of a given URL and returns the text content.

    Args:
        url (str): The URL of the webpage to scrape."""
    
    try:
        # Fetch the content of the URL
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad responses

        # Parse the HTML content using BeautifulSoup
        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract text from the parsed HTML
        text_content = soup.get_text(separator=' ', strip=True)
        colors = extract_brand_colors(soup)

        if max_chars is not None:
            text_content = text_content[:max_chars]

        return {
            "text": text_content,
            "style": colors,
        }

    except requests.exceptions.RequestException as e:
        return f"An error occurred while fetching the URL: {e}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"