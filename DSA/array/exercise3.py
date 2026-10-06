# Create a list of all odd numbers between 1 and a max number. Max number is something you need to take from a user using input() function




# my answer

def listOfOddNumbers(n):

    list=[]

    for i in range(n+1):

        if i%2!=0:
            list.append(i)



    return list        



print(listOfOddNumbers(100))


# solution

# max = int(input("Enter max number: "))

# odd_numbers = []

# for i in range(1, max):
#     if i % 2 == 1:
#         odd_numbers.append(i)

# print("Odd numbers: ", odd_numbers)