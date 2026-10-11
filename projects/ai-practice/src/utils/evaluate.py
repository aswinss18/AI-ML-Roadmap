import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

cases = [
    {
        "name": "Technical text",
        "text": (
            "A team uses React for its dashboard and FastAPI for its backend. "
            "PostgreSQL stores customer orders. The team added caching "
            "to reduce repeated database queries."
        ),
        "allowed_technologies": {"React", "FastAPI", "PostgreSQL"},
    },
    {
        "name": "No technologies",
        "text": (
            "A bakery introduced advance orders to reduce food waste. "
            "Customers choose a collection time before production starts. "
            "Last-minute cancellations still cause losses."
        ),
        "allowed_technologies": set(),
    },

        {
        "name": "No technologies",
        "text": (
            "The project started on 12 March and serves 250 customers."
        ),
        "allowed_technologies": set(),
    },
]

for case in cases:
    request = Request(
        "http://127.0.0.1:8000/summarize",
        data=json.dumps({"text": case["text"]}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=60) as response:
            result = json.load(response)

        summary = result["summary"]

        allowed = {
            name.casefold() for name in case["allowed_technologies"]
        }
        returned = {
            name.casefold() for name in summary["mentioned_technologies"]
        }

        checks = {
            "correct_source_length":
                result["source_length"] == len(case["text"]),
            "one_to_three_points":
                1 <= len(summary["key_points"]) <= 3,
            "no_unexpected_technologies":
                returned.issubset(allowed),
        }

        print(f"\n{case['name']}")
        print(json.dumps(checks, indent=2))
        print(json.dumps(summary, indent=2, ensure_ascii=False))

    except HTTPError as exc:
        print(f"{case['name']}: API error {exc.code}")
    except (URLError, TimeoutError) as exc:
        print(f"{case['name']}: Connection error: {exc}")