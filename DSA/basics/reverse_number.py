# Reverse a Number — Python Solution
# This uses almost exactly the same pattern.
# Problem: Reverse the digits of an integer without converting it to a string.
# Input: 1234
# Output: 4321



def reverse_number():
    number=int(input("Enter the number : "))
    reverse=0

    while number>0:
        digit=number%10
        reverse=(reverse*10) + digit
        number=number//10

    return reverse    



print(reverse_number())



# Iteration	Extracted digit	Calculation	Reversed number
# 1	4	0 * 10 + 4	4
# 2	3	4 * 10 + 3	43
# 3	2	43 * 10 + 2	432
# 4	1	432 * 10 + 1	4321