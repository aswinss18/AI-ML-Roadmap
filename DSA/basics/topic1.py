# 1. Python objects, identity and references

a = [10, 20, 30]
b = a

b.append(40)

print("a:", a)
print("b:", b)

# Both print same Because a and b refer to the same list object in memory.

# a----> [10,20,30,40] <-------b


c = [1, 2, 3]
d = [1, 2, 3]

print(c == d)  # True
print(c is d)  # False

# == checks whether values are equal.

# is checks whether both names reference the exact same object.


# ======================================================================================


# 2. Mutable vs immutable objects


# Data type	  Mutable 	Example

# int	       No	     100
# float	      No	     3.14
# str	      No	    "python"
# bool	      No	     True
# tuple	      No	    (1, 2)
# list	     Yes	    [1, 2]
# dict	     Yes	   {"a": 1}
# set	      Yes	    {1, 2}


x = 10
y = x

y += 5

print(x is y)
print(x)  # 10
print(y)  # 15

# Integers are immutable. b += 5 binds b to a different integer value rather than modifying the integer object referenced by a.

q = [10, 20]
w = q

w.append(30)

print(q is w) # True
print("q")  # [10, 20, 30]


# list is mutable

t=([10, 20], "python")
s=t
s[0].append(30)
print(s is t)  # True
print("t",t)


# The tuple's references cannot be reassigned, but the list inside can still change.
# This difference matters when working with shared application state and data-processing pipelines.

# =============================================================================


# 3. Shallow copy vs deep copy


user = {
    "name": "Arun",
    "skills": ["Python", "React"]
}

# Shallow copy

user_copy = user.copy()

user_copy["skills"].append("FastAPI")

print(user["skills"]) # ['Python', 'React', 'FastAPI']
print(user is user_copy) # False


# Why did the original change?

# Because .copy() creates a new outer dictionary but shares references to nested mutable objects.
# Two independent dictionaries can still share the same nested list


# user -----> reference of skills list ['Python', 'React', 'FastAPI'] <---- user.copy()

# Deep copy

import copy

user_copy = copy.deepcopy(user)
user_copy["skills"].append("FastAPI")

print(user is user_copy) #False
print(user["skills"]) # ['Python', 'React']


# 4. Python collection internals


# Collection	    Best use	                   Important performance characteristic

# list	      Ordered sequences	                      Index access O(1), search O(n)
# tuple	     fixed collections of references	                   Index access O(1)
# dict	        Key-value lookup	                          Average lookup O(1)
# set	    Unique values and membership	             Average membership O(1)

# Python lists are dynamic arrays. Dictionaries and sets are hash-table-based structures.



numbers=[1,2,3,4,5,6,7,8,9]

# Slicing

print(numbers[1:5])  # [2, 3, 4, 5]

# Enumerate: index and value

for index,value in enumerate(numbers):
    print("Index",index,"value",value)


# Unpacking
a, b, *rest = numbers

print("a",a,"b",b,"rest",rest)

# comprehension

squares=[n*n for n in numbers]

print(squares)

# A comprehension is similar in purpose to JavaScript's map():
# const squares = numbers.map(n => n * n);

# Python's comprehension syntax can also combine transformation and filtering:


even_squares=[n*n for n in numbers if n%2==0]
print(even_squares)