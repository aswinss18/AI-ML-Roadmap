# 9. Find the Most Frequent Word
# words = [    "python",    "react",    "python",    "javascript",    "python",    "react"]


# Return:
# "python"


# Starter:
# def most_frequent_word(words):


# This extends frequency counting because now you must first build the dictionary and then determine which key has the largest count.

words = ["python","react","python","javascript","python","react","c++","rust","next","react","react","react"]


def most_frequent_word(words):
    dict={}
    for word in words:
        dict[word]=0

    for word in words:
        dict[word]=dict[word]+1 

    return max(dict,key=dict.get)

    # return dict.values(max)    


print(most_frequent_word(words))
