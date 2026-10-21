# Understanding Assessment

# Function arguments — *args and **kwargs

def add(*args):
    return sum(args)


# arg can be any name....* is important thats it
# *args collects extra positional arguments into a tuple.

# print("sum",add(5,8,9,9,2,3))

def create_user(**kwargs):
    print(kwargs)

# create_user(
#     name="Arun",
#     age=25,
#     role="developer"
# )

# kwargs can be any name....** is important thats it
# **kwargs collects keyword arguments into a dictionary.


def process_request(request_id, *args, **kwargs):
    print(request_id)
    print(args)
    print(kwargs)

# process_request(
#     "REQ101",
#     "validate",
#     "save",
#     retry=3,
#     timeout=30
# )

# REQ101
# ('validate', 'save')
# {'retry': 3, 'timeout': 30}



# Argument unpacking

# The same * and ** symbols also unpack collections when calling functions.



def add(a, b):
    return a + b

numbers = (10, 20)
# print(add(*numbers))  # 30

values = {"a": 10, "b": 20}
# print(add(**values))  # 30

# * take all keys
# ** take all values



# Common interview pitfall: Mutable default arguments
# Consider:

def add_item(item, items=[]):
    items.append(item)
    return items

# print(add_item("python"))
# print(add_item("react"))

# fix

def add_item(item, items=None):
    if items is None:
        items = []

    items.append(item)
    return items

# print(add_item("python"))
# print(add_item("react"))

# The default list is created once when the function is defined and reused across calls where items isn't supplied.

# This is a frequent interview question and a common source of bugs.

# A safer design uses None as the default and creates a new list inside the function. You'll implement that independently in your understanding exercise.




















# Mutable defaults

def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags

# print(add_tag("python"))
# print(add_tag("fastapi"))

# ['python']
# ['python', 'fastapi']

# Scope and closures



# Python LEGB Rule and nonlocal
# LEGB is the order Python follows when searching for a variable.
# Scope	Meaning	Where Python looks
# L — Local	Inside current function	Function's own variables
# E — Enclosing	Outer function	Variables in surrounding functions
# G — Global	Module level	Variables outside functions
# B — Built-in	Python built-ins	print(), len(), sum()
# Python searches in this order:

# Local → Enclosing → Global → Built-in


def outer():
    count = 0  # Variable belonging to outer()

    def increment():
        count = 10  # NEW local variable , use nonlocal
        return count

    increment()
    return count

# print(outer())  # 0


# It prints 0 instead of 10 because of Python's variable scope rules.

# When you write count = 10 inside increment(), Python creates a new local variable rather than modifying count in outer().


# Function arguments

def demo(a, *args, **kwargs):
    print(a)
    print(args)
    print(kwargs)

demo(10, 20, 30, name="Python", active=True)


# Python treats *args and **kwargs as two separate collections of arguments.

# - a receives the first positional argument: 10.
# - *args collects the remaining positional arguments into a tuple.
# - **kwargs collects keyword arguments into a dictionary.


# Recursion and complexity

# What is the time complexity and auxiliary space complexity for a nonnegative integer n?

def countdown(n):
    if n == 0:
        print(0)
        return
    print(0)
    countdown(n - 1)

    # return n


# print("count",countdown(-5))    

# Python Recursion — Quick Notes

# ```python
# def countdown(n):
#     if n == 0:
#         return
#     countdown(n - 1)

# print(countdown(5))
# ```

# ### Why does it print `None`?
# - `return` without a value returns `None`.
# - The function doesn't return any other value.

# ### Why does a negative number cause an error?
# - For `n = -1`, recursion continues: `-1 → -2 → -3 → ...`
# - It never reaches the base case `n == 0`.
# - Python eventually raises `RecursionError: maximum recursion depth exceeded`.

# ### Time and Space Complexity (n ≥ 0)

# | Complexity      | Value | Reason |
# | Time            | O(n)  | Makes n recursive calls |
# | Auxiliary Space | O(n)  | Each call occupies stack memory |

# ### Fix for Negative Numbers

# ```python
# def countdown(n):
#     if n <= 0:
#         return
#     countdown(n - 1)
# ```

# **Key Point:** Every recursive function needs a reachable base case to stop execution.