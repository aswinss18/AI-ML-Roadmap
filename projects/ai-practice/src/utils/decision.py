def decide(candidates: list[dict], min_score: float) -> dict:
    accepted = [
        document
        for document in candidates
        if document["score"] >= min_score
    ]

    return {
        "status": (
            "retrieved" if accepted else "insufficient_evidence"
        ),
        "documents": accepted,
    }