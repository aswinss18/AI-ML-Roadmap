# Your next practice question
# Palindrome Number
# A palindrome number reads the same forward and backward.
# Input: 121
# Output: True

# Input: 123
# Output: False

# Input: 1221
# Output: True

# Input: 120
# Output: False


# Starter code:
# def is_palindrome(number):



def is_palindrome():
    number=int(input("Enter number check palindrome:"))
    stored_number=number
    reverse=0 

    while number>0:
        digit=number%10
        reverse=reverse*10+digit
        number=number//10

    # print(number,reverse)
    
    if stored_number==reverse:
        return True
    else:
        return False




print(is_palindrome())     



    