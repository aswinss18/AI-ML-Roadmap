# Problem: Count API Response Status Codes
# You're developing a backend API for an AI application.
# Your server receives HTTP response status codes:
# status_codes = [    200, 404, 200, 500, 200,    404, 201, 200, 500, 404,    200, 201, 500, 200, 404]


# Write a Python function that returns how many times each status code appears.
# Expected output:
# {    200: 6,    404: 4,    500: 3,    201: 2}


# Example 2
# Input:
# [200, 200, 404]


# Output:
# {200: 2, 404: 1}


# Example 3
# Input:
# []


# Output:
# {}


# Constraints
# - The input contains between 0 and 1,000 integers.
# - Each integer represents an HTTP status code between 100 and 599.
# - Do not use external libraries.
# - Do not use collections.Counter yet.
# - Solve the problem using a loop and a dictionary.
# Starter code

status_codes = [
    200, 201, 200, 404, 500, 200, 401, 403, 200, 404,
    201, 200, 500, 502, 200, 404, 401, 200, 201, 204,
    200, 500, 404, 429, 200, 201, 403, 200, 500, 404,
    200, 502, 201, 200, 401, 404, 500, 200, 429, 200,
    201, 204, 200, 404, 403, 500, 200, 401, 200, 201
]


def count_status_codes(status_codes):
    dict={}

    for status in status_codes:

        if status in dict:
            dict[status]=dict[status]+1
        else:
            dict[status]=1    
    print(dict)
    # print({"client_side_error":dict.get(400,0)+dict.get(401,0)+dict.get(402,0)+dict.get(403,0),"server_side_error":dict.get(500,0)+dict.get(501,0)+dict.get(502,0)+dict.get(503,0)})


count_status_codes(status_codes)