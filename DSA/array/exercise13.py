# Problem: Find Duplicate Numbers
# Write a Python function that receives a list of integers and returns a list containing every number that appears more than once.
# Each duplicate must appear only once in the output.
# Return duplicates in the order of their first appearance in the input.
# Example 1
# Input:[10, 20, 30, 20, 40, 10, 50]Output:[10, 20]


# Example 2
# Input:[1, 2, 2, 3, 3, 3, 4, 4, 4, 4]Output:[2, 3, 4]


# Notice that 4 appears four times, but you should return it only once.
# Example 3 — No duplicates
# Input:[10, 20, 30, 40]Output:[]


# Example 4 — Empty input
# Input:[]Output:[]


# Example 5 — Negative numbers
# Input:[-1, 2, -1, 3, 2, -5]Output:[-1, 2]


# Constraints
# - 0 <= len(numbers) <= 1000
# - -10000 <= numbers[i] <= 10000
# - Do not use collections.Counter.
# - Do not use set() for this exercise.
# - Use a dictionary and loops.
# - Return the result rather than printing it inside the function.
# - Do not modify the input list.



input_array=[10, 20, 30, 20, 40, 10, 50]


# O(n'2) solution

def find_duplicates(arr):
    dict={}
    output_array=[]
    for number in arr:
        if number in dict:
            dict[number]=+dict[number]+1
        else:
            dict[number]=1  


    for item in dict:
        
        if dict[item]>1:
            output_array.append(item)        



    print(dict)
    print(output_array)          

     


find_duplicates(input_array)

