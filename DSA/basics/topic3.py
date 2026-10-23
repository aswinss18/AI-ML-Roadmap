# What is an exception?

# An exception is an event that interrupts normal program execution when an operation cannot be completed.

# number = int("hello")
# print(number)




# try:
#     # Attempt an operation
# except ValueError:
#     # Handle a specific failure
# else:
#     # Runs when no exception occurs
# finally:
    # Runs during cleanup


# try:
#     name="aswin"
#     # age=int("Hellloo")
#     sum=name+2
#     age=1/0

# except ValueError:
#     print("Error : Its a string")    

# except TypeError:
#     print("Error : Operation receives an inappropriate type")  

# except ZeroDivisionError:
#     print("Error : Zero division error")    

# else:
#     print("Else case")

# finally:
#     print("Finally...")    




# Exception                                 Typical situation

# ValueError	                     Value has an invalid format or meaning
# TypeError	                        Operation receives an inappropriate type
# KeyError	                            Dictionary key doesn't exist
# IndexError	                         List index is out of range
# ZeroDivisionError	                       Division by zero
# FileNotFoundError	                  Requested file doesn't exist
# PermissionError	                Insufficient filesystem permissions
# TimeoutError	                          Operation times out
# AttributeError	                 Object lacks the requested attribute  
# 


# try, except, else, and finally
# Python provides four important blocks.


# Raising exceptions using raise

# Sometimes Python doesn't automatically detect a problem. Your business logic must reject invalid input.



def bank(amount,method):
    balance=0

    if method != "debit" and method !="credit":
        raise TypeError("Invalid payment type")

    if type(amount) is str or type(method) is int:
        raise TypeError("Invalid type")

    if method=="credit" and amount<0:
        raise ValueError("Credit amount is always positive")

    if method=="debit" and amount>0:
        raise ValueError("Debit amount is always negative")
    
    balance=balance+amount
    print("Balance 1 : ",balance," Rs")

    return balance



bank(100,"credit")


# Custom exceptions

# In production systems, built-in exceptions aren't always descriptive enough.


class MinimumBalanceError(Exception):
    pass




def banker(amount,method):
    balance=0

    if balance+amount<1000:
        raise MinimumBalanceError("Mimimum balance should be 1000")

    if method != "debit" and method !="credit":
        raise TypeError("Invalid payment type")

    if type(amount) is str or type(method) is int:
        raise TypeError("Invalid type")

    if method=="credit" and amount<0:
        raise ValueError("Credit amount is always positive")

    if method=="debit" and amount>0:
        raise ValueError("Debit amount is always negative")
    
    balance=balance+amount
    print("Balance 2 : ",balance," Rs")

    return balance


banker(2000,"credit")

# Why not just catch Exception everywhere?

# Consider:

# try:    process_payment()except Exception:    pass
# This is dangerous because it silently hides failures.
# You might accidentally hide database problems, incorrect calculations, or programming bugs.
# Production principle: Catch exceptions at a boundary where you can meaningfully handle them, and avoid swallowing unexpected failures.



# Exception chaining
# Sometimes a low-level exception should be converted into a more meaningful application exception.

# Python supports this with raise ... from ....
\
def parse_user_age(value):   
    try:       
        return int(value)   
    except ValueError as error:        
        raise ValueError( "User age must be a valid integer" ) from error


# parse_user_age("ll")


# The original conversion error is retained as the cause of the higher-level exception.
# This is especially useful in service layers, file parsers, database adapters, and API integration code.

# Defensive programming

# Defensive programming means anticipating invalid input, external failures, and edge cases without making code unnecessarily complicated.

# Consider an API payload:

payload = {
    "user_id": 101,
    "amount": "500"
}

# Before processing, consider:
# - Does amount exist?
# - Is it numeric?
# - Is it greater than zero?
# - Are unexpected extra fields allowed?
# - What should happen if validation fails?
# Using a dictionary's .get() method can avoid KeyError, but it does not replace validation.

amount = payload.get("amount")

# If the field is absent, amount is None by default. Your application must decide whether that is acceptable.


# Logging errors


import logging

logger = logging.getLogger(__name__)

def process_number(value):
    try:
        return int(value)

    except ValueError:
        logger.warning("Invalid numeric value received")
        raise

process_number("jjj")


# This logs a specific problem and re-raises the same exception.

# In real applications, avoid logging passwords, tokens, payment credentials, or sensitive customer information.