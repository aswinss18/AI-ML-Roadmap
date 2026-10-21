# Interview problem
# Write a Python function that receives two integers, start and end, and returns all prime numbers between them, including both endpoints.
# Example 1
# Input:start = 10end = 30Output:[11, 13, 17, 19, 23, 29]

def is_prime(number):
    if number < 2:
        return False

    for i in range(2, int(number ** 0.5) + 1):
        if number % i == 0:
            return False

    return True


def prime_numbers_in_a_range():
    first_number=int(input("Enter the first number : "))
    last_number=int(input("Enter the last number : "))
    numbers=[]


    for i in range(first_number,last_number+1):

        if is_prime(i):
            numbers.append(i)


    return numbers





print(prime_numbers_in_a_range())
