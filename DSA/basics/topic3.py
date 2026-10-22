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
    print("Balance : ",balance," Rs")

    return balance


bank(100,"credit")



