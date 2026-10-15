# 3. Classify Student Scores
# scores = [95, 82, 67, 40, 73, 58, 91]


# Rules:
# 90–100 → excellent
# 75–89  → good
# 50–74  → average
# 0–49   → fail

# Return a dictionary containing the count for each category.



scores = [95, 82, 67, 40, 73, 58, 91,100,0,76,54,34,5,6,89,99,23,43,12,10]


def classify_scores(scores):
    dict={"excellent":0,"good":0,"average":0,"fail":0}

    for score in scores:
        if 90<=score<=100:
            dict["excellent"]=dict["excellent"]+1

        elif 75<=score<=89:
            dict["good"]=dict["good"]+1

        elif 50<=score<=74:
            dict["average"]=dict["average"]+1

        else:
            dict["fail"]=dict["fail"]+1  


    print(dict)        





classify_scores(scores)