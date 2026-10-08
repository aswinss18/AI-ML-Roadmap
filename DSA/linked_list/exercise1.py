# Create linked list

class Node:
    def __init__(self, data=None, next=None):
        self.data = data
        self.next = next


class LinkedList:
    def __init__(self):
        self.head = None


    def insert_at_beginning(self, data):
        node = Node(data, self.head)
        self.head = node


    def insert_at_end(self, data):
        node = Node(data, None)

        # Case 1: list is empty
        if self.head is None:
            self.head = node
            return

        # Case 2: list already has nodes
        itr = self.head

        print("itr", itr)

        while itr.next:
            itr = itr.next

        itr.next = node


    def print_list(self):
        if self.head is None:
            print("List is empty")
            return

        itr = self.head

        while itr:
            print(itr.data, end=" -> ")
            itr = itr.next

        print("None")


# Create linked list object
ll = LinkedList()

# ll.insert_at_beginning("hello")
ll.insert_at_end("welcome")
ll.insert_at_end("hai")
ll.insert_at_end("good")

ll.print_list()