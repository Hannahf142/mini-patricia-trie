# mini-patricia-trie

A compact Patricia trie (radix tree) for storing sparse sets of strings.

```js
import { PatriciaTrie } from './src/index.js';

const trie = new PatriciaTrie();
trie.insert('car');
trie.insert('cat');
trie.insert('cart');

trie.has('car');              // true
trie.has('ca');               // false
trie.words();                 // ['car', 'cart', 'cat']
trie.wordsWithPrefix('car');  // ['car', 'cart']
trie.delete('car');           // true
trie.size;                    // 2
```

## Why this exists

A plain trie stores one node per character, which wastes memory when most paths are long and unique. A Patricia trie collapses every chain of single-child nodes into one edge whose label holds the whole chain, so the node count tracks the number of branch points rather than the total number of characters. The trade-off is that lookups and inserts must compare whole edge labels instead of single characters, and edge splitting makes the insertion code less obvious.

## Edge cases

The empty string is a valid key. It is stored as a terminal flag on the root, so `insert('')` works and `has('')` returns `true` after it. Deleting a word can leave a node with one child; the delete routine merges that node back into its parent so the trie stays compressed. `words()` and `wordsWithPrefix()` return results in lexicographic order.
