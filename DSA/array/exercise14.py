# 1. Duplicate Payment Detection
# You receive payment transaction IDs from a payment service:
# transaction_ids = [    "TXN101",    "TXN102",    "TXN103",    "TXN102",    "TXN104",    "TXN101"]


# Write a function that returns transaction IDs that were received more than once.
# Expected:
# ["TXN101", "TXN102"]


# Follow-up: How would you change the solution if millions of transactions were coming continuously?




transaction_ids = [    "TXN101",    "TXN102",    "TXN103",    "TXN102",    "TXN104",  ]

def duplicate_transaction_id(transactions):
    count={}
    ids=[]
    for id in transaction_ids:

        if id in count:
            count[id]=count[id]+1
            if count[id]==2:
                ids.append(id)

        else:
            count[id]=1    

    print(ids)




duplicate_transaction_id(transaction_ids)



# Interview-ready explanation
# "I would use a sliding window with a deque and a frequency dictionary. The deque maintains the last 1,000 transactions, while the dictionary tracks how many times each ID occurs. Whenever the window reaches 1,000 entries, I remove the oldest transaction and update its frequency. This gives average O(1) processing time per transaction and constant memory usage."