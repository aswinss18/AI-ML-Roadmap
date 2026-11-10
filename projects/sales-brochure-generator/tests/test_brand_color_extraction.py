import unittest
from unittest.mock import Mock, patch

from bs4 import BeautifulSoup

from utils.web_scraper import extract_brand_colors


class BrandColorExtractionTests(unittest.TestCase):
    def test_prefers_accent_over_primary_text_color(self):
        soup = BeautifulSoup(
            """
            <style>
              :root {
                --primary-text: #1c1e21;
                --accent: #ff5500;
              }
            </style>
            """,
            "html.parser",
        )

        self.assertEqual(
            extract_brand_colors(soup),
            {"primary_color": "#ff5500"},
        )

    def test_ignores_non_color_css_values_and_resolves_color_aliases(self):
        soup = BeautifulSoup(
            """
            <style>
              :root {
                --brand-primary: var(--site-accent);
                --site-accent: oklch(0.7 0.15 40);
                --brand-secondary: hover;
              }
            </style>
            """,
            "html.parser",
        )

        self.assertEqual(
            extract_brand_colors(soup),
            {"primary_color": "oklch(0.7 0.15 40)"},
        )

    def test_infers_palette_from_inline_color_declarations_without_brand_variables(self):
        soup = BeautifulSoup(
            """
            <div style="background-color:#FCF5EB;color:#111B21">
              <span style="color:#25d366">WhatsApp</span>
            </div>
            <button style="background-color:#25d366;color:#FFFFFF">
              Download
            </button>
            """,
            "html.parser",
        )

        self.assertEqual(
            extract_brand_colors(soup),
            {
                "primary_color": "#25d366",
                "secondary_color": "#FCF5EB",
                "tertiary_color": "#111B21",
            },
        )

    def test_white_is_not_ranked_as_a_saturated_primary_color(self):
        soup = BeautifulSoup(
            """
            <div style="background-color:#FFFFFF;color:#111B21">
              <span style="color:#25d366">WhatsApp</span>
            </div>
            """,
            "html.parser",
        )

        self.assertEqual(
            extract_brand_colors(soup)["primary_color"],
            "#25d366",
        )

    @patch("utils.web_scraper.requests.get")
    def test_reads_brand_colors_from_linked_stylesheet(self, get):
        stylesheet_response = Mock()
        stylesheet_response.raise_for_status.return_value = None
        stylesheet_response.text = """
            :root {
              --brand-primary: #ff5500;
              --brand-secondary: #ffeecc;
            }
        """
        get.return_value = stylesheet_response
        soup = BeautifulSoup(
            '<link rel="stylesheet" href="/assets/site.css">',
            "html.parser",
        )

        colors = extract_brand_colors(
            soup,
            "https://example.com/products/",
        )

        get.assert_called_once_with(
            "https://example.com/assets/site.css",
            timeout=5,
            headers={"User-Agent": "Mozilla/5.0"},
        )
        self.assertEqual(
            colors,
            {
                "primary_color": "#ff5500",
                "secondary_color": "#ffeecc",
            },
        )


if __name__ == "__main__":
    unittest.main()
