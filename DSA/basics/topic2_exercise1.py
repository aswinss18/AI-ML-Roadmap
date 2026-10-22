# Problem: Build a Configurable API Rate Limiter
# Imagine you're building a FastAPI service that receives requests from multiple users.

# You need a reusable function that tracks how many requests each user has made.
# Requirements
# Implement:
# def create_rate_limiter(limit):



# The function must return another function that accepts a user_id.

# Each user can make at most limit accepted requests.

# The returned function must:
# - Return True if the request is accepted.
# - Return False if the user has already reached the limit.
# - Track each user's accepted-request count independently.
# - Maintain its state using a closure.
# - Avoid global variables.
# - Create independent state for each limiter instance.
# - Reject a negative limit by raising ValueError.
# - Support limit = 0, which should reject every request.
# This is a count-based limiter, not a time-window rate limiter.
# Example
# limiter = create_rate_limiter(2)print(limiter("user1"))  # Trueprint(limiter("user1"))  # Trueprint(limiter("user1"))  # Falseprint(limiter("user2"))  # Trueprint(limiter("user2"))  # Trueprint(limiter("user2"))  # False



# Additional test cases
# first = create_rate_limiter(1)second = create_rate_limiter(1)print(first("user1"))   # Trueprint(second("user1"))  # Trueprint(first("user1"))   # False



# Your solution must ensure that the two limiters have independent counters.
# Constraints
# - 0 <= limit <= 100000
# - User IDs are nonempty strings.
# - Assume calls are sequential, not concurrent.
# - Do not use global state.
# - Do not use classes for this particular challenge.
# - Aim for average O(1) time per request.
# Starter code
# def create_rate_limiter(limit):



# Hints
# Hint 1 — Storing stateHint 2 — Closure behavior




def create_rate_limit(limit):
    if limit < 0:
        raise ValueError("Limit cannot be negative")

    count = {}

    def counter(user_id):
        if user_id not in count:
            count[user_id] = 0

        if count[user_id] < limit:
            count[user_id] = count[user_id] + 1
            return True
        else:
            return False

    return counter


limiter=create_rate_limit(2)

print(limiter("user1"))  # True
print(limiter("user1"))  # True
print(limiter("user1"))  # False

print(limiter("user2"))  # True
print(limiter("user2"))  # True
print(limiter("user2"))  # False
 





print(limiter("user1"))  # True
print(limiter("user1"))  # True
print(limiter("user1"))  # False

print(limiter("user2"))  # True
print(limiter("user2"))  # True
print(limiter("user2"))  # False
