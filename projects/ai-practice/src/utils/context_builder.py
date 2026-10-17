import json


def build_context(documents: list[dict]) -> str:
    sources = [
        {
            "source_id": document["id"],
            "text": document["text"],
        }
        for document in documents
    ]

    return json.dumps(sources, ensure_ascii=False, indent=2)