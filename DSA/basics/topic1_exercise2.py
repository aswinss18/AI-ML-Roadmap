# Build a Transaction Data Sanitizer
# Imagine your FastAPI application receives a batch of transaction records.
# transactions = [    {        "id": "TXN101",        "amount": 500,        "tags": ["food", "upi"]    },    {        "id": "TXN102",        "amount": 1200,        "tags": ["shopping"]    },    {        "id": "TXN103",        "amount": -100,        "tags": ["refund"]    }]



# Implement:
# def sanitize_transactions(transactions):



# Requirements:
# 1. Return a new list without mutating the original data or nested records.
# 2. Exclude transactions with a negative amount.
# 3. Add "verified" to the tags of each retained transaction, unless it already exists.
# 4. Preserve transaction order.
# 5. Return an empty list for empty input.
# Expected output:
# [    {        "id": "TXN101",        "amount": 500,        "tags": ["food", "upi", "verified"]    },    {        "id": "TXN102",        "amount": 1200,        "tags": ["shopping", "verified"]    }]



# This assignment combines list traversal, dictionary access, conditional filtering, nested mutability, and copying. In a production system, actual transaction validation would also require a clearer schema and business rules.

import copy

transactions = [
    {
        "id": "TXN101",
        "amount": 500,
        "tags": ["food", "upi"]
    },
    {
        "id": "TXN102",
        "amount": 1200,
        "tags": ["shopping"]
    },
    {
        "id": "TXN103",
        "amount": -100,
        "tags": ["refund"]
    },
    {
        "id": "TXN104",
        "amount": -600,
        "tags": ["refund"]
    }  ,{
        "id": "TXN105",
        "amount": -10,
        "tags": ["refund"]
    }
]


def sanitize_transactions(transactions):

    transactions_copy=copy.deepcopy(transactions)

    return [{
            **transaction,
            "tags": (
                transaction["tags"].copy()
                if "verified" in transaction["tags"]
                else [*transaction["tags"], "verified"]
            )
        } for transaction in transactions_copy if transaction["amount"]>=0]


print(sanitize_transactions(transactions))
