a = [10, 20, 30]
b = a

b.append(40)

print("a:", a)
print("b:", b)

# Both print same Because a and b refer to the same list object in memory.

# a----> [10,20,30,40] <-------b


c = [1, 2, 3]
d = [1, 2, 3]

print(c == d)  # True
print(c is d)  # False

# == checks whether values are equal.

# is checks whether both names reference the exact same object.