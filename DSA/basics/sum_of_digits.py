# Problem: Sum of Digits of an Integer
# Interview scenario: You're implementing a numeric validation utility. Given a non-negative integer, calculate the sum of all its digits.
# Example 1
# Input: 1234
# Output: 10

# Explanation: 1 + 2 + 3 + 4 = 10

# Example 2
# Input: 9087
# Output: 24

# Explanation: 9 + 0 + 8 + 7 = 24

# Example 3
# Input: 5
# Output: 5

# Example 4
# Input: 0
# Output: 0

# Constraints
# - 0 <= number <= 10^15
# - Input is always an integer.
# - Do not convert the integer into a string.
# - Do not use sum().
# - Use a while loop.
# - Return the result rather than printing inside the function.
# Starter code
# def sum_of_digits(number):

def sum_of_digits():
    number=int(input("Enter the digit : "))
    total=0

    while number>0:
        digit=number%10
        total=total+digit
        number=number//10

    return total


print("Total of the digits : ",sum_of_digits())