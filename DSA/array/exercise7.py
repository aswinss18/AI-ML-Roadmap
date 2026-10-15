# 2. Count Positive, Negative, and Zero
# nums = [-3, 5, 0, -1, 8, 0, 2]


# Return:
# {    "positive": 3,    "negative": 2,    "zero": 2}


# Starter:


nums = [-3, 5, 0, -1, 8, 0, 2]


def count_positive_negative(arr):
    dict={"positive":0,"negative":0,"zero":0,"zero":0}


    for item in arr:
        if item==0:
            dict["zero"]=dict["zero"]+1
        elif item>0:
            dict["positive"]=dict["positive"]+1
        else:
            dict["negative"]=dict["negative"]+1    

    print(dict)




count_positive_negative(nums)