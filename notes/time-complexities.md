# Algorithm Complexities

| Algorithm      | Best Time Complexity | Average Time Complexity | Worst Time Complexity | Worst Space Complexity |
| -------------- | -------------------: | ----------------------: | --------------------: | ---------------------: |
| Linear Search  |               $O(1)$ |                  $O(n)$ |                $O(n)$ |                 $O(1)$ |
| Binary Search  |               $O(1)$ |             $O(\log n)$ |           $O(\log n)$ |                 $O(1)$ |
| Bubble Sort    |               $O(n)$ |                $O(n^2)$ |              $O(n^2)$ |                 $O(1)$ |
| Selection Sort |             $O(n^2)$ |                $O(n^2)$ |              $O(n^2)$ |                 $O(1)$ |
| Insertion Sort |               $O(n)$ |                $O(n^2)$ |              $O(n^2)$ |                 $O(1)$ |
| Merge Sort     |         $O(n\log n)$ |            $O(n\log n)$ |          $O(n\log n)$ |                 $O(n)$ |
| Quick Sort     |         $O(n\log n)$ |            $O(n\log n)$ |              $O(n^2)$ |            $O(\log n)$ |
| Heap Sort      |         $O(n\log n)$ |            $O(n\log n)$ |          $O(n\log n)$ |                 $O(n)$ |
| Bucket Sort    |             $O(n+k)$ |                $O(n+k)$ |              $O(n^2)$ |                 $O(n)$ |
| Radix Sort     |              $O(nk)$ |                 $O(nk)$ |               $O(nk)$ |               $O(n+k)$ |
| Tim Sort       |               $O(n)$ |            $O(n\log n)$ |          $O(n\log n)$ |                 $O(n)$ |
| Shell Sort     |               $O(n)$ |        $O((n\log n)^2)$ |      $O((n\log n)^2)$ |                 $O(1)$ |

## Array vs Linked List Complexities

| Operation                      |            Array | Linked List |
| ------------------------------ | ---------------: | ----------: |
| Indexing                       |           $O(1)$ |      $O(n)$ |
| Insert/Delete Element at Start |           $O(n)$ |      $O(1)$ |
| Insert/Delete Element at End   | $O(1)$ amortized |      $O(n)$ |
| Insert Element in Middle       |           $O(n)$ |      $O(n)$ |

### Notes

- **Array indexing is $O(1)$** because an element can be accessed directly using its index.
- **Linked-list indexing is $O(n)$** because nodes must be traversed sequentially.
- **Array insertion/deletion at the start is $O(n)$** because existing elements generally need to be shifted.
- **Linked-list insertion/deletion at the start is $O(1)$** when the head pointer is available.
- **Dynamic-array insertion at the end is amortized $O(1)$** because resizing only happens occasionally.
- **Array deletion at the end is normally $O(1)$**.
- **Linked-list operations at the end are $O(n)$** when traversal from the head is required.
- If a linked list maintains a **tail pointer**, insertion at the end can be **$O(1)$**.
- **Middle insertion is $O(n)$** for arrays because elements may need shifting.
- **Middle insertion is $O(n)$** for linked lists because locating the target node usually requires traversal.
