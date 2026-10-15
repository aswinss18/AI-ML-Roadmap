# 8. Classify HTTP Status Codes
# Slightly harder version of your current problem.
# status_codes = [    200, 201, 301, 404, 401,    500, 502, 204, 429, 302]


# Return:
# {    "1xx": 0,    "2xx": 3,    "3xx": 2,    "4xx": 3,    "5xx": 2}


# def classify_status_codes(status_codes):


# Try solving it without writing separate conditions for every individual status code.


status_codes = [200, 201, 301, 404, 401,500, 502, 204, 429, 302,401,200, 201, 301, 404, 401,500, 502, 204, 429, 302,200, 201, 301, 404, 401,]

def classify_status_codes(status_codes):
    dict={}
    for status_code in status_codes:
        dict[status_code]=0

    for status_code in status_codes:
        dict[status_code]=dict[status_code]+1

    print(dict)

classify_status_codes(status_codes)    
