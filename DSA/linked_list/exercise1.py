# Create linked list

class Node:
    def __init__(self, data=None, next=None):
        self.data = data
        self.next = next


class LinkedList:
    def __init__(self):
        self.head = None

    def print_list(self):
        itr = self.head

        while itr:
            print(itr.data, end=" -> ")
            itr = itr.next

        print("None")


dummy = Node("hello")
dummy1 = Node("welcome")
dummy2 = Node("hai")
dummy3 = Node("good")


# Link the nodes
dummy.next = dummy1
dummy1.next = dummy2
dummy2.next = dummy3


# Create LinkedList and set head
ll = LinkedList()
ll.head = dummy


# Print linked list
ll.print_list()