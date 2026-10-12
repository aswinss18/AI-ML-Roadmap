# Write a function that receives a list of words and returns a dictionary containing the number of times each word appears.
# Example:

# Input:
# ["python", "js", "python", "react", "js", "python"]

# Output:
# {
#     "python": 3,
#     "js": 2,
#     "react": 1
# }


sample = [
    "python",
    "javascript",
    "react",
    "python",
    "nextjs",
    "javascript",
    "python",
    "nodejs",
    "react",
    "typescript",
    "python",
    "fastapi",
    "javascript",
    "react",
    "mongodb",
    "python",
    "nextjs",
    "postgresql",
    "nodejs",
    "javascript",
    "python",
    "react",
    "docker",
    "fastapi",
    "typescript",
    "python",
    "mongodb",
    "nextjs",
    "react",
    "javascript"
]

def returnDict(array):

    dict={}
    for item in array:
        if item in dict:
            dict[item]=dict[item]+1
        else:
            dict[item]=1    

    return dict


print(returnDict(sample))


# Time Complexity: O(n)
# Space Complexity: O(k)

# where:
# n = total number of words
# k = number of unique words