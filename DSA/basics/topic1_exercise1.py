# Interview challenge — 25 minutes
# Intermediate · Data copying and mutability
# Problem: Safely Update User Skills
# You are building a backend service that receives a list of user records.

# Each record contains a user ID, name, and list of skills.

# Write a function that adds a new skill to a specific user's record without modifying the original data.
# Input
# users = [    {        "id": 1,        "name": "Arun",        "skills": ["Python", "React"]    },    {        "id": 2,        "name": "Meera",        "skills": ["JavaScript"]    }]



# Function signature:
# def add_user_skill(users, user_id, skill):



# Call:
# updated = add_user_skill(users, 1, "FastAPI")



# Expected result
# [    {        "id": 1,        "name": "Arun",        "skills": ["Python", "React", "FastAPI"]    },    {        "id": 2,        "name": "Meera",        "skills": ["JavaScript"]    }]



# Critical requirement: The original users list and all its nested records must remain unchanged.
# Additional requirements
# - Do not add a skill if it already exists.
# - If the user ID is not found, return an unchanged independent copy.
# - Preserve user order.
# - Do not use external libraries.
# - You may use Python's standard-library copy module.
# - Return the new list, not just the modified user.
# - Aim for clean, readable, reusable code.
# Test cases
# # Test 1: Add new skilladd_user_skill(users, 1, "FastAPI")# Test 2: Existing skilladd_user_skill(users, 1, "Python")# Test 3: Unknown useradd_user_skill(users, 99, "Go")# Test 4: Empty inputadd_user_skill([], 1, "Python")



# Two progressively useful hints
# Hints

# Reveal when needed

# Hint 1Hint 2

# Complexity requirement
# After coding, explain:
# - Time complexity in terms of the number of users n.
# - How the total number of nested skills affects copying and searching.
# - Space complexity of creating an independent copy.
# Do not simply say O(n) without considering the nested data.


import copy


users = [
    {
        "id": 1,
        "name": "Arun",
        "skills": ["Python", "React"]
    },
    {
        "id": 2,
        "name": "Meera",
        "skills": ["JavaScript"]
    }
]

def add_user_skill(users, user_id, skill):
    users_copy=copy.deepcopy(users)


    for user in users_copy:
        if user["id"]==user_id and skill not in user["skills"]:
            user["skills"].append(skill)

    return users_copy        


print(add_user_skill(users,1,"react"))         

# O(n + S)

# - n = number of users
# - S = total number of skills across all users
# - k = number of skills belonging to the matched user