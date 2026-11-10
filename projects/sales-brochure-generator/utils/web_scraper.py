import re
import colorsys
import math
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


CSS_COLOR_PATTERN = re.compile(
    r"(?:#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})\b"
    r"|(?:rgb|hsl|oklab|oklch|lab|lch|color)a?\([^)]*\))",
    re.IGNORECASE,
)
CSS_VARIABLE_PATTERN = re.compile(r"--([\w-]+)\s*:\s*([^;{}]+)", re.IGNORECASE)
CSS_VARIABLE_REFERENCE_PATTERN = re.compile(
    r"var\(\s*--[\w-]+(?:\s*,\s*[^)]*)?\)",
    re.IGNORECASE,
)
CSS_DECLARATION_PATTERN = re.compile(
    r"(?P<property>background-color|background|color|border-color|fill)"
    r"\s*:\s*(?P<value>[^;{}]+)",
    re.IGNORECASE,
)
CSS_RULE_PATTERN = re.compile(r"([^{}]+)\{([^{}]*)\}")
COLOR_ROLE_ALIASES = {
    "primary_color": (
        "primary-color",
        "color-primary",
        "brand-primary",
        "primary",
        "brand-color",
        "brand",
        "accent-color",
        "color-accent",
        "accent",
        "theme-color",
    ),
    "secondary_color": (
        "secondary-color",
        "color-secondary",
        "brand-secondary",
        "secondary",
    ),
    "tertiary_color": (
        "tertiary-color",
        "color-tertiary",
        "brand-tertiary",
        "tertiary",
    ),
}
CSS_KEYWORDS = {"currentcolor", "inherit", "initial", "revert", "unset"}


def _read_css_stylesheets(soup, page_url):
    stylesheets = []
    attempted = 0
    for link in soup.find_all("link", rel=lambda rel: rel and "stylesheet" in rel):
        href = link.get("href")
        if not href:
            continue

        stylesheet_url = urljoin(page_url, href)
        if urlparse(stylesheet_url).scheme not in {"http", "https"}:
            continue

        if attempted == 8:
            break
        attempted += 1

        try:
            response = requests.get(
                stylesheet_url,
                timeout=5,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            response.raise_for_status()
            stylesheets.append(response.text[:1_000_000])
        except requests.RequestException:
            continue

    return stylesheets


def _extract_css_variables(css_sources):
    variables = {}
    for css in css_sources:
        for name, value in CSS_VARIABLE_PATTERN.findall(css):
            value = value.strip()
            if (
                CSS_COLOR_PATTERN.fullmatch(value)
                and value.lower() not in CSS_KEYWORDS
            ) or CSS_VARIABLE_REFERENCE_PATTERN.fullmatch(value):
                variables[name.lower()] = value
    return variables


def _resolve_css_variable(value, variables):
    for _ in range(5):
        match = re.fullmatch(r"var\(\s*--([\w-]+)(?:\s*,[^)]*)?\)", value)
        if not match:
            return value if CSS_COLOR_PATTERN.fullmatch(value) else None
        value = variables.get(match.group(1).lower(), "")
        if not value:
            return None
    return None


def _find_role_color(aliases, variables):
    for alias in aliases:
        for name, value in variables.items():
            if name == alias or name.endswith(f"-{alias}"):
                resolved = _resolve_css_variable(value, variables)
                if resolved:
                    return resolved
    return None


def _hex_rgb(color):
    if not color.startswith("#"):
        return None

    value = color[1:]
    if len(value) in (3, 4):
        value = "".join(character * 2 for character in value[:3])
    elif len(value) == 8:
        value = value[:6]
    if len(value) != 6:
        return None

    try:
        return tuple(int(value[index:index + 2], 16) / 255 for index in (0, 2, 4))
    except ValueError:
        return None


def _declared_color_candidates(css_sources):
    candidates = {}
    for css in css_sources:
        for selector, declarations in CSS_RULE_PATTERN.findall(css):
            selector = selector.lower()
            for match in CSS_DECLARATION_PATTERN.finditer(declarations):
                property_name = match.group("property").lower()
                value = match.group("value")
                selector_bonus = 4 if re.search(
                    r"brand|accent|primary|cta|button|action",
                    selector,
                ) else 1
                property_weight = 3 if property_name in {
                    "background",
                    "background-color",
                } else 1
                for color in CSS_COLOR_PATTERN.findall(value):
                    if not color.startswith("#"):
                        continue
                    normalized = color.lower()
                    candidate = candidates.setdefault(
                        normalized,
                        {"color": color, "score": 0, "backgrounds": 0, "foregrounds": 0},
                    )
                    candidate["score"] += selector_bonus * property_weight
                    if property_name in {"background", "background-color"}:
                        candidate["backgrounds"] += 1
                    elif property_name == "color":
                        candidate["foregrounds"] += 1

        for match in CSS_DECLARATION_PATTERN.finditer(css):
            property_name = match.group("property").lower()
            if property_name not in {"background", "background-color", "color"}:
                continue
            for color in CSS_COLOR_PATTERN.findall(match.group("value")):
                if not color.startswith("#"):
                    continue
                normalized = color.lower()
                candidate = candidates.setdefault(
                    normalized,
                    {"color": color, "score": 0, "backgrounds": 0, "foregrounds": 0},
                )
                candidate["score"] += 1
                if property_name in {"background", "background-color"}:
                    candidate["backgrounds"] += 1
                elif property_name == "color":
                    candidate["foregrounds"] += 1

    return candidates


def _infer_palette_colors(candidates):
    primary = None
    secondary = None
    tertiary = None
    primary_score = -1
    secondary_score = -1
    tertiary_score = -1

    for candidate in candidates.values():
        rgb = _hex_rgb(candidate["color"])
        if rgb is None:
            continue

        _, lightness, saturation = colorsys.rgb_to_hls(*rgb)
        if saturation >= 0.18:
            score = saturation * candidate["score"]
            if candidate["backgrounds"]:
                score += saturation * candidate["backgrounds"] * 2
            if score > primary_score:
                primary = candidate["color"]
                primary_score = score

        if candidate["backgrounds"] and lightness >= 0.72:
            score = math.sqrt(candidate["backgrounds"]) * (
                0.5 + saturation * 2
            )
            if score > secondary_score:
                secondary = candidate["color"]
                secondary_score = score

        if candidate["foregrounds"] and lightness <= 0.38:
            score = candidate["foregrounds"] * (1 - lightness) * (1 + saturation * 0.2)
            if score > tertiary_score:
                tertiary = candidate["color"]
                tertiary_score = score

    return {
        role: color
        for role, color in (
            ("primary_color", primary),
            ("secondary_color", secondary),
            ("tertiary_color", tertiary),
        )
        if color is not None
    }


def extract_brand_colors(soup, page_url=None):
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

    css_sources = _read_css_stylesheets(soup, page_url) if page_url else []
    css_sources.extend(style.get_text() for style in soup.find_all("style"))
    css_sources.extend(tag.get("style", "") for tag in soup.find_all(style=True))
    css_variables = _extract_css_variables(css_sources)
    declared_colors = _infer_palette_colors(
        _declared_color_candidates(css_sources)
    )

    for role, aliases in COLOR_ROLE_ALIASES.items():
        if role not in colors:
            value = _find_role_color(aliases, css_variables)
            if value is None:
                value = declared_colors.get(role)
            if value:
                colors[role] = value

    return colors


def scraper(url, max_chars=None):
    """Fetch a page and return its text and discovered brand colors."""
    try:
        response = requests.get(
            url,
            timeout=15,
            headers={"User-Agent": "Mozilla/5.0"},
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        text_content = soup.get_text(separator=" ", strip=True)
        colors = extract_brand_colors(soup, response.url)

        if max_chars is not None:
            text_content = text_content[:max_chars]

        return {
            "text": text_content,
            "style": colors,
        }

    except requests.exceptions.RequestException as error:
        return f"An error occurred while fetching the URL: {error}"
    except Exception as error:
        return f"An unexpected error occurred: {error}"
