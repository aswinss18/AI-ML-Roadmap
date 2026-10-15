# 1. Count Even and Odd Numbers
# nums = [1, 2, 3, 4, 5, 6, 8, 10]


# Return:
# {    "even": 5,    "odd": 3}


# Starter:

array=[1,2,3,4,5,6,77,88,8,2,2,2,2,2,2,2,2,2,2,2]

def count_odd_or_even(arr):
    dict={"even":0,"odd":0}
    for item in array:
        if item%2==0:
            dict["even"]=dict["even"]+1
        else:
            dict["odd"]=dict["odd"]+1    
    print(dict)


count_odd_or_even(array)