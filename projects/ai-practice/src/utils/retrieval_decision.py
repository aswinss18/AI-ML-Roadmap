from decision import decide
from semantic_retrieval import retrieve


def retrieve_or_abstain(
    question: str,
    min_score: float,
    top_k: int = 2,
) -> dict:
    candidates = retrieve(question, top_k=top_k)
    return decide(candidates, min_score)




print(retrieve_or_abstain(question="What is the theory of relativity?", min_score=0.4))