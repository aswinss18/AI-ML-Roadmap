# Understanding Assessment


# Mutable defaults

def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags

print(add_tag("python"))
print(add_tag("fastapi"))

# ['python']
# ['python', 'fastapi']

# Scope and closures

def outer():
    count = 0  # Variable belonging to outer()

    def increment():
        count = 10  # NEW local variable , use nonlocal
        return count

    increment()
    return count

print(outer())  # 0


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


print("count",countdown(-5))    

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