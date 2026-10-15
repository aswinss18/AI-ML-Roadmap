# 7. Count User Roles
# roles = [    "admin",    "user",    "user",    "moderator",    "user",    "admin"]


# Return frequency counts for every role.
# def count_roles(roles):


# Then answer:
# What happens if a completely new role "manager" appears?

# Your algorithm should handle it automatically.



roles = ["admin", "user","user","moderator","user","admin","manager","superadmin","manager","manager"]


def count_roles(roles):
    dict={"admin":0,"user":0,"moderator":0}
    for item in roles:
        if item not in dict:
            dict[item]=1

        else:
            dict[item]=dict[item]+1

    print(dict)

    

count_roles(roles)