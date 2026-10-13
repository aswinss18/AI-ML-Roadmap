from semantic_retrieval import retrieve

cases = [
    {
        "question": "How do stars produce energy?",
        "expected_id": "nuclear-fusion-stars",
    },
    {
        "question": "What happens when a massive star collapses?",
        "expected_id": "black-holes",
    },
    {
        "question": "How does gravity affect spacetime?",
        "expected_id": "gravity-relativity",
    },
    {
        "question": "How are planets outside our solar system discovered?",
        "expected_id": "exoplanets",
    },
    {
        "question": "How can scientists modify DNA?",
        "expected_id": "crispr-gene-editing",
    },
    {
        "question": "What cells produce antibodies?",
        "expected_id": "human-immune-system",
    },
    {
        "question": "Why do earthquakes happen near plate boundaries?",
        "expected_id": "plate-tectonics",
    },
    {
        "question": "How does carbon dioxide affect oceans?",
        "expected_id": "ocean-acidification",
    },
    {
        "question": "What causes global warming?",
        "expected_id": "greenhouse-effect",
    },
    {
        "question": "What happens when unstable atoms decay?",
        "expected_id": "radioactive-decay",
    },
    {
        "question": "What is the difference between ionic and covalent bonding?",
        "expected_id": "chemical-bonds",
    },
    {
        "question": "How do cells generate ATP?",
        "expected_id": "cellular-respiration",
    },
    {
        "question": "How do vaccines create immune memory?",
        "expected_id": "vaccines",
    },
    {
        "question": "Why can bacteria stop responding to antibiotics?",
        "expected_id": "antibiotic-resistance",
    },
    {
        "question": "Which technology has zero electrical resistance?",
        "expected_id": "superconductivity",
    },

    # Harder semantic/paraphrased cases
    {
        "question": "Why can't light escape from some extremely massive objects in space?",
        "expected_id": "black-holes",
    },
    {
        "question": "What biological tool allows researchers to rewrite genetic information?",
        "expected_id": "crispr-gene-editing",
    },
    {
        "question": "Why are some medicines no longer effective against certain bacteria?",
        "expected_id": "antibiotic-resistance",
    },
    {
        "question": "Why is seawater becoming more acidic when atmospheric carbon dioxide increases?",
        "expected_id": "ocean-acidification",
    },
    {
        "question": "What allows electricity to flow without losing energy as heat?",
        "expected_id": "superconductivity",
    },
    {
        "question": "Why does time move differently near very massive objects?",
        "expected_id": "gravity-relativity",
    },
    {
        "question": "How can the immune system remember a virus for years?",
        "expected_id": "human-immune-system",
    },
    {
        "question": "What process converts sunlight into stored chemical energy?",
        "expected_id": "photosynthesis",
    },
    {
        "question": "What causes the ground to suddenly shake?",
        "expected_id": "earthquakes",
    },
    {
        "question": "How does molten rock reach Earth's surface?",
        "expected_id": "volcanoes",
    },
    {
        "question": "How does water move between oceans, land, and the atmosphere?",
        "expected_id": "water-cycle",
    },
    {
        "question": "How is hereditary information stored inside living organisms?",
        "expected_id": "dna-genetics",
    },
    {
        "question": "How do plants make food using sunlight?",
        "expected_id": "photosynthesis",
    },
    {
        "question": "How does the body release energy from glucose?",
        "expected_id": "cellular-respiration",
    },
    {
        "question": "Why do tectonic plates cause mountains and ocean trenches?",
        "expected_id": "plate-tectonics",
    },
    {
        "question": "What happens to half of a radioactive sample over one half-life?",
        "expected_id": "radioactive-decay",
    },
    {
        "question": "Which scientific theory explains force, mass, and acceleration?",
        "expected_id": "newtons-laws",
    },
    {
        "question": "What scientific field studies heat, work, energy, and entropy?",
        "expected_id": "thermodynamics",
    },
    {
        "question": "How are chemical elements organized by atomic number?",
        "expected_id": "periodic-table",
    },
    {
        "question": "What happens when atoms share or transfer electrons?",
        "expected_id": "chemical-bonds",
    },
    {
        "question": "How does the body defend itself against pathogens?",
        "expected_id": "human-immune-system",
    },
    {
        "question": "How do vaccines prepare the body before a real infection?",
        "expected_id": "vaccines",
    },
    {
        "question": "What microorganisms live inside the human digestive system?",
        "expected_id": "microbiome",
    },
    {
        "question": "How can computers learn patterns from scientific data?",
        "expected_id": "machine-learning-science",
    },
    {
        "question": "What computational system uses layers of interconnected artificial neurons?",
        "expected_id": "neural-networks",
    },
]


def evaluate(top_k: int) -> None:
    hits = 0

    for case in cases:
        results = retrieve(case["question"], top_k=top_k)
        returned_ids = [result["id"] for result in results]

        passed = case["expected_id"] in returned_ids
        hits += int(passed)

        print(f"\nQuestion: {case['question']}")
        print(f"Retrieved: {returned_ids}")
        print(f"Expected: {case['expected_id']}")
        print(f"Hit: {passed}")

    print(f"\nHit rate @{top_k}: {hits}/{len(cases)}")
    print(f"Percentage: {hits / len(cases):.0%}")


if __name__ == "__main__":
    evaluate(top_k=1)
    evaluate(top_k=2)