import datetime

def fibo(n):
    if n <= 0:
        return "Input should be a positive integer."
    elif n == 1:
        return 0
    elif n == 2:
        return 1
    else:
        return fibo(n-1) + fibo(n-2)



hash_map={0:0,1:1}

def fibo_dp(n):
    if n in hash_map:
        return hash_map[n]

    hash_map[n]=fibo_dp(n-1) + fibo_dp(n-2)

    return hash_map[n]

def fibo_dp_without_hashmap(n):

    if n==0:
        return 0

    if n==1:
        return 1

    a,b=0,1
    
    for i in range(n-1):

        c=a+b
        a=b
        b=c

    return c






start= datetime.datetime.now()

print(fibo_dp_without_hashmap(10000))  # Example usage

end= datetime.datetime.now()

print(end-start,"Seconds")