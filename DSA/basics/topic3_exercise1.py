# Build a Safe Batch Payment Processor
# You're developing a Python service that receives payment requests.

# Your task is to validate each payment and generate a summary of successful and rejected payments.
# Input
# payments = [    {"id": "TXN101", "amount": 500},    {"id": "TXN102", "amount": -100},    {"id": "TXN103", "amount": "invalid"},    {"id": "TXN104", "amount": 1200},    {"id": "TXN105"},    {"id": "TXN106", "amount": 0}]



# Requirements
# Implement:
# def process_payments(payments):



# For each payment:
# 1. The id must be a nonempty string.
# 2. The amount field must exist.
# 3. The amount must be a positive integer (bool is not accepted).
# 4. Valid payments must be recorded as successful.
# 5. Invalid payments must be rejected with a clear error reason.
# 6. One invalid payment must not stop processing the remaining payments.
# 7. Do not modify the original payment records.
# 8. Return a structured dictionary rather than printing inside the function.

# Expected output
# {    "successful": [   "TXN101",        "TXN104"    ],    "failed": [{"id": "TXN102", "reason": "Amount must be greater than zero"  },        {            "id": "TXN103",            "reason": "Amount must be an integer"        },        {            "id": "TXN105",            "reason": "Missing amount"        },        {            "id": "TXN106",            "reason": "Amount must be greater than zero"        }    ],    "total_processed": 6}



# For records with missing or invalid IDs, use None in the failed entry's id field.
# Constraints
# - 0 <= len(payments) <= 10000
# - Each entry is a dictionary.
# - amount may be missing or have an unexpected type.
# - No external libraries.
# - Use try/except and specific exception types appropriately.
# - Do not silently swallow errors.
# - Do not stop the batch because one record fails.
# Hints
# Hint 1 — Validation strategyHint 2 — Error handling
# Interview follow-up
# Explain the time and space complexity in terms of n, the number of payments.

# Then answer:

# Why is one try/except block around the entire batch a poor design when the requirement is to continue after individual payment validation failures?






payments = [
    {"id": "TXN101", "amount": 500},
    {"id": "TXN102", "amount": -100},
    {"id": "TXN103", "amount": "invalid"},
    {"id": "TXN104", "amount": 1200},
    {"id": "TXN105"},
    {"id": "TXN106", "amount": 0}
]


# {
#     "successful": [
#         "TXN101",
#         "TXN104"
#     ],
#     "failed": [
#         {
#             "id": "TXN102",
#             "reason": "Amount must be greater than zero"
#         },
#         {
#             "id": "TXN103",
#             "reason": "Amount must be an integer"
#         },
#         {
#             "id": "TXN105",
#             "reason": "Missing amount"
#         },
#         {
#             "id": "TXN106",
#             "reason": "Amount must be greater than zero"
#         }
#     ],
#     "total_processed": 6
# }


def process_payments(payments):

    result={"successful":[],"failed":[],"total_processed":0}
    successfull_payments=[]     

    try:

    
        for payment in payments:
           print(payment)
           if payment.get("amount")>0:
               print("testing")
               successfull_payments.append(payment)


    except TypeError as error:

        raise TypeError("Invalid type")






    return successfull_payments



print(process_payments(payments))