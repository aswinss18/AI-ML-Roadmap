from sentence_transformers import SentenceTransformer, util

documents = [
    {
        "id": "gravity-relativity",
        "text": (
            "Einstein's general theory of relativity describes gravity as the curvature of spacetime "
            "caused by mass and energy. Massive objects such as stars and planets distort spacetime, "
            "and nearby objects follow paths determined by that curvature. General relativity explains "
            "planetary orbits, gravitational lensing, black holes, gravitational time dilation, and gravitational waves."
        ),
    },
    {
        "id": "black-holes",
        "text": (
            "Black holes are regions of spacetime where gravity becomes so strong that nothing can escape "
            "after crossing the event horizon. Many black holes form from the collapse of massive stars. "
            "Astronomers detect black holes by observing nearby stellar motion, X-rays from hot accretion disks, "
            "and gravitational waves produced when black holes collide."
        ),
    },
    {
        "id": "nuclear-fusion-stars",
        "text": (
            "Stars generate energy through nuclear fusion. In the core of the Sun, hydrogen nuclei combine "
            "through a sequence of reactions that eventually produce helium. A small amount of mass is converted "
            "into energy according to Einstein's equation E equals mc squared. Fusion provides the energy that "
            "allows stars to produce heat, light, and other forms of electromagnetic radiation."
        ),
    },
    {
        "id": "exoplanets",
        "text": (
            "Exoplanets are planets that orbit stars outside the Solar System. Astronomers commonly discover them "
            "using the transit method and radial velocity measurements. The transit method detects small reductions "
            "in a star's brightness when a planet passes in front of it. Scientists analyze some exoplanet atmospheres "
            "to search for gases that may reveal information about climate, chemistry, or possible habitability."
        ),
    },
    {
        "id": "quantum-mechanics",
        "text": (
            "Quantum mechanics describes the behavior of matter and energy at atomic and subatomic scales. "
            "Particles such as electrons can exhibit wave-particle duality and exist in combinations of states "
            "known as superpositions. Quantum theory uses probabilities to predict measurement outcomes and forms "
            "the theoretical foundation of technologies including lasers, transistors, semiconductors, and quantum computers."
        ),
    },
    {
        "id": "electromagnetic-spectrum",
        "text": (
            "The electromagnetic spectrum contains different forms of electromagnetic radiation including radio waves, "
            "microwaves, infrared radiation, visible light, ultraviolet radiation, X-rays, and gamma rays. "
            "All electromagnetic waves travel at the speed of light in a vacuum but differ in wavelength and frequency. "
            "Different regions of the spectrum are used in communication, astronomy, medicine, imaging, and scientific research."
        ),
    },
    {
        "id": "photosynthesis",
        "text": (
            "Photosynthesis is the biological process through which plants, algae, and some microorganisms convert "
            "light energy into chemical energy. Plants absorb carbon dioxide from the atmosphere and water through "
            "their roots. Using energy captured by chlorophyll, these substances are converted primarily into sugars, "
            "while oxygen is released as a byproduct. Photosynthesis plays a major role in Earth's carbon and oxygen cycles."
        ),
    },
    {
        "id": "cellular-respiration",
        "text": (
            "Cellular respiration is the process cells use to release usable energy from nutrients such as glucose. "
            "In aerobic respiration, glucose reacts with oxygen through several biochemical pathways, including glycolysis, "
            "the citric acid cycle, and oxidative phosphorylation. Much of the released energy is stored in molecules "
            "of ATP, which cells use to power processes such as transport, movement, growth, and chemical synthesis."
        ),
    },
    {
        "id": "dna-genetics",
        "text": (
            "DNA is the molecule that stores hereditary information in most living organisms. It consists of two strands "
            "forming a double helix and contains four nucleotide bases: adenine, thymine, cytosine, and guanine. "
            "The sequence of these bases encodes biological information. Genes are specific DNA regions that can influence "
            "traits by providing instructions for producing functional RNA molecules and proteins."
        ),
    },
    {
        "id": "crispr-gene-editing",
        "text": (
            "CRISPR is a gene-editing technology derived from defense mechanisms found in bacteria. "
            "Researchers can design guide RNA molecules that direct proteins such as Cas9 toward specific DNA sequences. "
            "The Cas protein can cut the DNA at the selected location, allowing scientists to remove, modify, or insert "
            "genetic material. CRISPR is widely studied in medicine, agriculture, biotechnology, and genetic research."
        ),
    },
    {
        "id": "natural-selection",
        "text": (
            "Natural selection is an evolutionary process in which inherited traits that improve survival or reproduction "
            "can become more common within a population over generations. Individuals within a species vary genetically, "
            "and some variations may provide advantages under particular environmental conditions. Natural selection does "
            "not intentionally create traits; instead, environmental pressures influence which existing variations are more successfully reproduced."
        ),
    },
    {
        "id": "human-immune-system",
        "text": (
            "The human immune system protects the body against pathogens such as bacteria, viruses, fungi, and parasites. "
            "Innate immunity provides rapid and relatively general defenses, while adaptive immunity can recognize specific "
            "antigens and develop immunological memory. B cells can produce antibodies, while T cells perform several roles "
            "including coordinating immune responses and destroying infected cells."
        ),
    },
    {
        "id": "vaccines",
        "text": (
            "Vaccines train the immune system to recognize particular pathogens without requiring a person to experience "
            "the full disease. Vaccines may contain weakened pathogens, inactivated material, proteins, viral vectors, "
            "or genetic instructions such as messenger RNA. Exposure to these antigens activates adaptive immunity and "
            "can create memory cells that respond more quickly if the real pathogen is encountered later."
        ),
    },
    {
        "id": "plate-tectonics",
        "text": (
            "Plate tectonics describes the movement of large sections of Earth's lithosphere over the softer asthenosphere. "
            "These tectonic plates move slowly because of processes occurring within Earth's mantle. Their interactions "
            "produce many geological features including mountains, ocean trenches, volcanoes, and earthquakes. "
            "Plate boundaries are commonly classified as divergent, convergent, or transform boundaries."
        ),
    },
    {
        "id": "earthquakes",
        "text": (
            "Earthquakes occur when stored elastic energy in Earth's crust is suddenly released, usually along geological faults. "
            "The released energy travels through Earth as seismic waves. Seismometers measure these vibrations and help scientists "
            "estimate an earthquake's location and magnitude. Earthquakes are particularly common near tectonic plate boundaries, "
            "although they can also occur within plate interiors."
        ),
    },
    {
        "id": "volcanoes",
        "text": (
            "Volcanoes form when molten rock, gases, and other material from beneath Earth's surface reach the crust. "
            "Magma that reaches the surface is called lava. Volcanic activity frequently occurs near tectonic plate boundaries "
            "and hotspots. Eruptions can range from relatively gentle lava flows to explosive events that release ash, rocks, "
            "and gases high into the atmosphere."
        ),
    },
    {
        "id": "water-cycle",
        "text": (
            "The water cycle describes the continuous movement of water between Earth's surface and atmosphere. "
            "Solar energy causes water to evaporate from oceans, lakes, and soil. Water vapor cools and condenses into clouds, "
            "eventually returning to the surface as precipitation. Water can then flow through rivers, enter groundwater systems, "
            "freeze into glaciers, or return to the atmosphere through evaporation and plant transpiration."
        ),
    },
    {
        "id": "greenhouse-effect",
        "text": (
            "The greenhouse effect is a natural process in which certain atmospheric gases absorb and re-emit infrared radiation, "
            "helping keep Earth's surface warmer than it would otherwise be. Important greenhouse gases include carbon dioxide, "
            "methane, water vapor, and nitrous oxide. Increasing concentrations of some greenhouse gases due to human activities "
            "can strengthen this effect and alter Earth's climate."
        ),
    },
    {
        "id": "ocean-acidification",
        "text": (
            "Ocean acidification occurs when seawater absorbs carbon dioxide from the atmosphere. Dissolved carbon dioxide reacts "
            "with water and forms carbonic acid, producing chemical changes that reduce seawater pH and carbonate ion availability. "
            "These changes can affect marine organisms such as corals and shell-forming species that rely on carbonate compounds "
            "to build calcium carbonate structures."
        ),
    },
    {
        "id": "periodic-table",
        "text": (
            "The periodic table organizes chemical elements according to atomic number and recurring chemical properties. "
            "Elements within the same group often behave similarly because they have related outer-electron configurations. "
            "The table includes metals, nonmetals, metalloids, noble gases, halogens, alkali metals, and other categories. "
            "Its structure allows chemists to predict bonding behavior, reactivity, and trends such as atomic radius."
        ),
    },
    {
        "id": "chemical-bonds",
        "text": (
            "Chemical bonds form when atoms interact through their electrons. In ionic bonding, electrons are transferred "
            "between atoms, creating oppositely charged ions that attract each other. In covalent bonding, atoms share electrons. "
            "Metallic bonding involves electrons that are relatively free to move among many atoms. Bond type strongly influences "
            "physical properties such as melting point, conductivity, hardness, and solubility."
        ),
    },
    {
        "id": "acids-and-bases",
        "text": (
            "Acids and bases are important classes of chemical substances. Under the Brønsted-Lowry definition, an acid donates "
            "a proton while a base accepts a proton. The pH scale is commonly used to describe the acidity or basicity of aqueous "
            "solutions. A lower pH generally indicates greater hydrogen ion activity, while a higher pH indicates more basic conditions."
        ),
    },
    {
        "id": "radioactive-decay",
        "text": (
            "Radioactive decay occurs when an unstable atomic nucleus spontaneously transforms into a more stable configuration. "
            "Different decay processes can emit alpha particles, beta particles, gamma radiation, or other products. "
            "Each radioactive isotope has a characteristic half-life, which represents the time required for half of a large sample "
            "of unstable nuclei to decay. Radioactive isotopes are used in medicine, research, industry, and geological dating."
        ),
    },
    {
        "id": "newtons-laws",
        "text": (
            "Newton's laws of motion describe relationships between forces and the motion of objects. The first law states that "
            "an object remains at rest or moves with constant velocity unless acted upon by a net external force. The second law "
            "relates net force, mass, and acceleration. The third law states that forces occur in equal and opposite interaction pairs."
        ),
    },
    {
        "id": "thermodynamics",
        "text": (
            "Thermodynamics studies energy, heat, work, and their relationships in physical systems. The first law expresses "
            "conservation of energy. The second law introduces entropy and explains why many natural processes have a preferred "
            "direction. Thermodynamic principles are essential for understanding engines, refrigerators, power plants, chemical reactions, "
            "atmospheric processes, and the behavior of stars."
        ),
    },
    {
        "id": "superconductivity",
        "text": (
            "Superconductivity is a physical phenomenon in which some materials lose electrical resistance below a critical temperature. "
            "Superconductors can carry electrical current with extremely small energy losses and can also exhibit the Meissner effect, "
            "where magnetic fields are expelled from the material. Superconductivity has applications in MRI machines, particle accelerators, "
            "high-field magnets, sensors, and experimental quantum computing systems."
        ),
    },
    {
        "id": "machine-learning-science",
        "text": (
            "Machine learning is a field of computer science that develops algorithms capable of identifying patterns from data. "
            "Supervised learning uses labeled examples, while unsupervised learning searches for structure without predefined labels. "
            "Machine learning is increasingly used in scientific research for tasks such as protein structure prediction, astronomical "
            "classification, climate modeling, medical image analysis, and particle physics."
        ),
    },
    {
        "id": "neural-networks",
        "text": (
            "Artificial neural networks are computational models composed of interconnected processing units arranged in layers. "
            "During training, numerical parameters called weights are adjusted so that the network produces outputs closer to desired results. "
            "Deep neural networks contain multiple processing layers and are widely used for image recognition, language processing, "
            "speech recognition, scientific prediction, and generative artificial intelligence."
        ),
    },
    {
        "id": "antibiotic-resistance",
        "text": (
            "Antibiotic resistance occurs when bacterial populations evolve mechanisms that allow them to survive exposure to antibiotics. "
            "Resistance can emerge through genetic mutations or through the transfer of resistance genes between bacteria. "
            "Overuse and inappropriate use of antibiotics can increase selective pressure favoring resistant strains. "
            "Antibiotic resistance is a major challenge for modern medicine because it can make bacterial infections harder to treat."
        ),
    },
    {
        "id": "microbiome",
        "text": (
            "The human microbiome consists of microorganisms that live on and inside the human body, particularly in the digestive tract. "
            "These microbial communities contain bacteria, fungi, viruses, and other microorganisms. Gut microbes can participate in digestion, "
            "vitamin production, immune regulation, and metabolism. Researchers are studying how changes in microbiome composition may be "
            "associated with nutrition, disease, medication use, and other biological factors."
        ),
    },
]

model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)

document_texts = [
    document["text"]
    for document in documents
]

# Compute document embeddings once, not for every question.
document_embeddings = model.encode_document(
    document_texts,
    convert_to_tensor=True,
)


def retrieve(question: str, top_k: int = 2) -> list[dict]:
    question_embedding = model.encode_query(
        [question],
        convert_to_tensor=True,
    )

    hits = util.semantic_search(
        question_embedding,
        document_embeddings,
        top_k=top_k,
    )[0]

    return [
        {
            "id": documents[hit["corpus_id"]]["id"],
            "text": documents[hit["corpus_id"]]["text"],
            "score": float(hit["score"]),
        }
        for hit in hits
    ]


questions = [
    "How do stars produce energy?",
    "What happens when a massive star collapses?",
    "How does gravity affect spacetime?",
    "How are planets outside our solar system discovered?",
    "How can scientists modify DNA?",
    "What cells produce antibodies?",
    "Why do earthquakes happen near plate boundaries?",
    "How does carbon dioxide affect oceans?",
    "What causes global warming?",
    "What happens when unstable atoms decay?",
    "What is the difference between ionic and covalent bonding?",
    "How do cells generate ATP?",
    "How do vaccines create immune memory?",
    "Why can bacteria stop responding to antibiotics?",
    "Which technology has zero electrical resistance?",
]

for question in questions:
    print(f"\nQuestion: {question}")

    for result in retrieve(question):
        print(
            f"- {result['id']} "
            f"(score: {result['score']:.3f})"
        )