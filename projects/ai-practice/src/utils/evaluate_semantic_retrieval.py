from semantic_retrieval import retrieve

cases = [
    # Ambiguous / overlapping science concepts
    {
        "question": "Why does matter behave differently under extreme gravitational conditions?",
        "expected_id": "gravity-relativity",
    },
    {
        "question": "What happens when an object becomes dense enough to strongly distort space and time?",
        "expected_id": "black-holes",
    },
    {
        "question": "Why can energy production inside stars eventually stop?",
        "expected_id": "nuclear-fusion-stars",
    },
    {
        "question": "Why can very massive stars have very different endings from smaller stars?",
        "expected_id": "black-holes",
    },

    # Biology overlap
    {
        "question": "Why does the body respond faster when it encounters the same pathogen again?",
        "expected_id": "human-immune-system",
    },
    {
        "question": "How can exposure to a harmless version of a pathogen protect someone later?",
        "expected_id": "vaccines",
    },
    {
        "question": "Why can killing harmful bacteria sometimes affect beneficial organisms too?",
        "expected_id": "microbiome",
    },
    {
        "question": "Why might a bacterial infection become harder to treat over time?",
        "expected_id": "antibiotic-resistance",
    },
    {
        "question": "What process allows traits encoded in genetic material to pass between generations?",
        "expected_id": "dna-genetics",
    },
    {
        "question": "How can researchers deliberately alter a specific region of genetic material?",
        "expected_id": "crispr-gene-editing",
    },

    # Chemistry / physics overlap
    {
        "question": "Why do some atoms give away electrons while others share them?",
        "expected_id": "chemical-bonds",
    },
    {
        "question": "Why do elements in the same column often behave similarly?",
        "expected_id": "periodic-table",
    },
    {
        "question": "Why does some energy become less useful after physical processes occur?",
        "expected_id": "thermodynamics",
    },
    {
        "question": "What explains why an object changes its motion when a net force acts on it?",
        "expected_id": "newtons-laws",
    },
    {
        "question": "Why could an electrical current theoretically persist without continuously losing energy?",
        "expected_id": "superconductivity",
    },

    # Earth science overlap
    {
        "question": "Why are earthquakes and volcanoes often found in similar regions?",
        "expected_id": "plate-tectonics",
    },
    {
        "question": "What causes stored energy underground to suddenly be released as seismic waves?",
        "expected_id": "earthquakes",
    },
    {
        "question": "Why does material from deep inside Earth sometimes escape onto the surface?",
        "expected_id": "volcanoes",
    },
    {
        "question": "How can movement deep inside Earth reshape the planet's surface over millions of years?",
        "expected_id": "plate-tectonics",
    },

    # Climate / environment overlap
    {
        "question": "Why does adding more carbon dioxide to the atmosphere change Earth's temperature?",
        "expected_id": "greenhouse-effect",
    },
    {
        "question": "Why can increasing carbon dioxide affect marine organisms even without directly heating the water?",
        "expected_id": "ocean-acidification",
    },
    {
        "question": "How can water that evaporates from one place eventually return somewhere else?",
        "expected_id": "water-cycle",
    },

    # Energy / cellular biology overlap
    {
        "question": "What process lets organisms extract usable energy from energy-rich molecules?",
        "expected_id": "cellular-respiration",
    },
    {
        "question": "How can light energy eventually become energy stored in organic molecules?",
        "expected_id": "photosynthesis",
    },
    {
        "question": "Why are photosynthesis and cellular respiration closely related but opposite in some ways?",
        "expected_id": "photosynthesis",
    },

    # AI overlap
    {
        "question": "How can a computer discover useful relationships in data without explicit rules for every case?",
        "expected_id": "machine-learning-science",
    },
    {
        "question": "What kind of computational model learns through many connected processing units arranged in layers?",
        "expected_id": "neural-networks",
    },
    {
        "question": "Why can a system improve predictions after being exposed to more examples?",
        "expected_id": "machine-learning-science",
    },

    # More indirect / paraphrased
    {
        "question": "What determines whether a radioactive material disappears quickly or persists for a long time?",
        "expected_id": "radioactive-decay",
    },
    {
        "question": "Why is it impossible to predict exactly when one unstable nucleus will break apart?",
        "expected_id": "radioactive-decay",
    },
    {
        "question": "How can scientists know a distant planet exists even when they cannot directly see it?",
        "expected_id": "exoplanets",
    },
    {
        "question": "Why might a distant star periodically become slightly dimmer?",
        "expected_id": "exoplanets",
    },

    # Deliberately confusing neighboring concepts
    {
        "question": "Which concept best explains why stronger gravity can change the passage of time?",
        "expected_id": "gravity-relativity",
    },
    {
        "question": "Which concept best explains why light may never reach an outside observer from beyond a certain boundary?",
        "expected_id": "black-holes",
    },
    {
        "question": "Which biological mechanism explains long-term recognition of previously encountered pathogens?",
        "expected_id": "human-immune-system",
    },
    {
        "question": "Which medical approach intentionally trains that recognition mechanism before infection occurs?",
        "expected_id": "vaccines",
    },

    # Hard semantic wording
    {
        "question": "What phenomenon removes ordinary electrical resistance under certain physical conditions?",
        "expected_id": "superconductivity",
    },
    {
        "question": "What framework explains why heat naturally spreads and why some transformations are irreversible?",
        "expected_id": "thermodynamics",
    },
    {
        "question": "What explains large-scale rearrangement of Earth's crust through slowly moving rigid sections?",
        "expected_id": "plate-tectonics",
    },
    {
        "question": "What explains the gradual chemical change in seawater caused by absorption of atmospheric carbon dioxide?",
        "expected_id": "ocean-acidification",
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