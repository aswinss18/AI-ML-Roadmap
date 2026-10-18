# Check Prime Number
# A prime number is a number greater than 1 that is divisible by exactly two positive integers: 1 and itself.
# Examples:
# - 2 → Prime
# - 7 → Prime
# - 9 → Not prime (divisible by 3)
# - 13 → Prime
# - 1 → Not prime
# Your task
# Write a Python function that receives an integer and returns True if it is prime; otherwise, return False.



def check_prime():
    number=int(input("Enter the number : "))


    if number<2:
        return False

    for i in range(2,number):
        if number%i==0:
            return False
    
    return True


def check_prime_square_root():
    number=int(input("Enter the number : "))

    if number<2:
        return False

    for i in range(2,int((number**0.5))+1):
        if number%i==0:
            return False

    return True    

# print(check_prime())

print(check_prime_square_root())


# Approach	Time complexity	Space complexity
# Your original approach, corrected	O(n)	O(1)
# Square root method	O(√n)	O(1)
        