mylist = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

mylist2 = [x for x in range(1, 11)]


class Node:
    def __init__(self, data):
        self.data = data
        self.left = None
        self.right = None

class Tree:
    def __init__(self, rootData):
        """
        Constructor for Tree class.
        rootData can be a scalar (e.g., int).
        """
        self.root = Node(rootData)

    def __len__(self):
        """Returns the height of the tree."""
        return self._get_tree_length(self.root)

    def _get_tree_length(self, node):
        if node is None:
            return 0
        left_length = self._get_tree_length(node.left)
        right_length = self._get_tree_length(node.right)
        return max(left_length, right_length) + 1

    def get_longest_sequence(self):
        """
        Returns the longest path from the root.
        """
        return self._get_longest_sequence(self.root)

    def _get_longest_sequence(self, node):
        if node is None:
            return []
        left_sequence = self._get_longest_sequence(node.left)
        right_sequence = self._get_longest_sequence(node.right)
        if len(left_sequence) > len(right_sequence):
            return [node.data] + left_sequence
        else:
            return [node.data] + right_sequence

# Example usage:
if __name__ == "__main__":
    # Build a sample tree
    tree = Tree(1)
    tree.root.left = Node(12)
    tree.root.right = Node(13)
    tree.root.left.left = Node(4)
    tree.root.left.right = Node(15)
    tree.root.right.left = Node(6)
    tree.root.right.right = Node(17)
    tree.root.left.left.left = Node(18)
    tree.root.left.left.right = Node(9)
    tree.root.left.right.left = Node(10)
    tree.root.left.right.right = Node(11)
    tree.root.right.left.left = Node(12)

    # Print the height of the tree
    print("Tree height:", len(tree))

    # Print the longest sequence
    longest_seq = tree.get_longest_sequence()
    print("Longest sequence:", longest_seq)
