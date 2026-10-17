from decision import decide

candidates = [
    {"id": "gravity-relativity", "score": 0.55},
    {"id": "black-holes", "score": 0.18},
]

result = decide(candidates, min_score=0.4)

assert result["status"] == "retrieved"
assert [
    document["id"] for document in result["documents"]
] == ["gravity-relativity"]

assert decide([], 0.4) == {
    "status": "insufficient_evidence",
    "documents": [],
}

print("Decision checks passed.")