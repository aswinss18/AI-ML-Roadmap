# 6. Classify API Latency
# latencies = [120, 450, 80, 900, 230, 1500, 310]


# Rules:
# < 200 ms        → fast
# 200–499 ms      → normal
# 500–999 ms      → slow
# >= 1000 ms      → very_slow


latencies = [120, 450, 80, 900, 230, 1500, 310]

def classify_latency(latencies):
    dict={
    "fast": 0,
    "normal": 0,
    "slow": 0,
    "very_slow": 0}

    for latency in latencies:
        if latency<200:
            dict["fast"]=dict["fast"]+1

        elif 200<=latency<=499:
            dict["normal"]=dict["normal"]+1

        elif 500<=latency<=999:
            dict["slow"]=dict["slow"]+1

        else:
            dict["very_slow"]=dict["very_slow"]+1          


    print(dict)          





classify_scores(latencies)