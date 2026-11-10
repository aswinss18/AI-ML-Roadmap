from bs4 import BeautifulSoup
import requests

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
        primary_color = soup.find('meta', attrs={'name': 'theme-color'})
        secondary_color = soup.find('meta', attrs={'name': 'secondary-color'})
        tertiary_color = soup.find('meta', attrs={'name': 'tertiary-color'})

        if max_chars is not None:
            text_content = text_content[:max_chars]

        return {
            "text": text_content,
            "style": {
                "primary_color": primary_color.get("content") if primary_color else None,
                "secondary_color": secondary_color.get("content") if secondary_color else None,
                "tertiary_color": tertiary_color.get("content") if tertiary_color else None,
            },
        }

    except requests.exceptions.RequestException as e:
        return f"An error occurred while fetching the URL: {e}"
    except Exception as e:
        return f"An unexpected error occurred: {e}"