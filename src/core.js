const TERMINAL = Symbol('terminal');

class Node {
  constructor() {
    this.children = new Map();
    this[TERMINAL] = false;
  }
}

/**
 * A Patricia trie (radix tree) for compact storage of sparse string sets.
 *
 * The trie collapses single-child paths into a single node whose key is the
 * concatenation of the collapsed edges. This reduces memory for sparse sets
 * where long unique prefixes are common, at the cost of slightly more complex
 * traversal logic.
 */
export class PatriciaTrie {
  constructor() {
    this.root = new Node();
    this.size = 0;
  }

  /**
   * Insert a string into the trie.
   * @param {string} word
   * @returns {boolean} true if the word was added, false if it already existed
   */
  insert(word) {
    if (typeof word !== 'string') {
      throw new TypeError('word must be a string');
    }
    if (word === '') {
      if (this.root[TERMINAL]) {
        return false;
      }
      this.root[TERMINAL] = true;
      this.size += 1;
      return true;
    }

    let node = this.root;
    let i = 0;

    while (i < word.length) {
      const ch = word[i];
      const child = node.children.get(ch);

      if (!child) {
        // No edge for this character: create a new leaf for the remainder.
        const newNode = new Node();
        newNode[TERMINAL] = true;
        node.children.set(ch, { node: newNode, label: word.slice(i) });
        this.size += 1;
        return true;
      }

      const label = child.label;
      let j = 0;
      // Find the common prefix between the remaining word and the edge label.
      while (j < label.length && i + j < word.length && label[j] === word[i + j]) {
        j += 1;
      }

      if (j === label.length) {
        // The edge label is fully consumed; descend into the child.
        i += j;
        node = child.node;
      } else {
        // Split the edge at the mismatch point.
        const splitNode = new Node();
        const suffixLabel = label.slice(j);
        const suffixNode = child.node;

        // Reattach the original child under the split node with the suffix label.
        splitNode.children.set(suffixLabel[0], { node: suffixNode, label: suffixLabel });

        // Replace the original edge with the split node and a shorter label.
        node.children.set(ch, { node: splitNode, label: label.slice(0, j) });

        if (i + j === word.length) {
          // The word ends exactly at the split point.
          if (splitNode[TERMINAL]) {
            return false;
          }
          splitNode[TERMINAL] = true;
          this.size += 1;
          return true;
        }

        // The word continues past the split point; add a new leaf for the rest.
        const newNode = new Node();
        newNode[TERMINAL] = true;
        const rest = word.slice(i + j);
        splitNode.children.set(rest[0], { node: newNode, label: rest });
        this.size += 1;
        return true;
      }
    }

    if (node[TERMINAL]) {
      return false;
    }
    node[TERMINAL] = true;
    this.size += 1;
    return true;
  }

  /**
   * Check whether a word is present.
   * @param {string} word
   * @returns {boolean}
   */
  has(word) {
    if (typeof word !== 'string') {
      throw new TypeError('word must be a string');
    }
    if (word === '') {
      return this.root[TERMINAL];
    }

    let node = this.root;
    let i = 0;

    while (i < word.length) {
      const child = node.children.get(word[i]);
      if (!child) {
        return false;
      }
      const label = child.label;
      if (word.startsWith(label, i)) {
        i += label.length;
        node = child.node;
      } else {
        return false;
      }
    }

    return node[TERMINAL];
  }

  /**
   * Remove a word from the trie.
   * @param {string} word
   * @returns {boolean} true if the word was removed, false if it was not present
   */
  delete(word) {
    if (typeof word !== 'string') {
      throw new TypeError('word must be a string');
    }
    if (word === '') {
      if (!this.root[TERMINAL]) {
        return false;
      }
      this.root[TERMINAL] = false;
      this.size -= 1;
      return true;
    }

    const path = [];
    let node = this.root;
    let i = 0;

    while (i < word.length) {
      const ch = word[i];
      const child = node.children.get(ch);
      if (!child) {
        return false;
      }
      const label = child.label;
      if (!word.startsWith(label, i)) {
        return false;
      }
      path.push({ parent: node, ch, child });
      i += label.length;
      node = child.node;
    }

    if (!node[TERMINAL]) {
      return false;
    }

    node[TERMINAL] = false;
    this.size -= 1;

    // Prune empty nodes and merge single-child paths bottom-up.
    for (let k = path.length - 1; k >= 0; k -= 1) {
      const { parent, ch, child } = path[k];
      const n = child.node;

      if (n[TERMINAL]) {
        break;
      }

      if (n.children.size === 0) {
        parent.children.delete(ch);
      } else if (n.children.size === 1) {
        const [onlyCh, onlyChild] = n.children.entries().next().value;
        const mergedLabel = child.label + onlyChild.label;
        parent.children.set(ch, { node: onlyChild.node, label: mergedLabel });
      } else {
        break;
      }
    }

    return true;
  }

  /**
   * Return all words in lexicographic order.
   * @returns {string[]}
   */
  words() {
    const result = [];
    const stack = [];

    if (this.root[TERMINAL]) {
      result.push('');
    }

    const entries = Array.from(this.root.children.entries());
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    for (let idx = entries.length - 1; idx >= 0; idx -= 1) {
      const [ch, child] = entries[idx];
      stack.push({ node: child.node, prefix: child.label });
    }

    while (stack.length > 0) {
      const { node, prefix } = stack.pop();
      if (node[TERMINAL]) {
        result.push(prefix);
      }
      const childEntries = Array.from(node.children.entries());
      childEntries.sort((a, b) => a[0].localeCompare(b[0]));
      for (let idx = childEntries.length - 1; idx >= 0; idx -= 1) {
        const [, child] = childEntries[idx];
        stack.push({ node: child.node, prefix: prefix + child.label });
      }
    }

    return result;
  }

  /**
   * Return all words that start with the given prefix.
   * @param {string} prefix
   * @returns {string[]}
   */
  wordsWithPrefix(prefix) {
    if (typeof prefix !== 'string') {
      throw new TypeError('prefix must be a string');
    }

    if (prefix === '') {
      return this.words();
    }

    let node = this.root;
    let i = 0;

    while (i < prefix.length) {
      const child = node.children.get(prefix[i]);
      if (!child) {
        return [];
      }
      const label = child.label;
      if (prefix.startsWith(label, i)) {
        i += label.length;
        node = child.node;
      } else if (label.startsWith(prefix.slice(i))) {
        // The prefix ends in the middle of an edge; all words under the
        // child share the remaining part of the label, so collect them.
        const result = [];
        const stack = [{ node: child.node, suffix: label.slice(prefix.length - i) }];
        while (stack.length > 0) {
          const { node: n, suffix } = stack.pop();
          if (n[TERMINAL]) {
            result.push(prefix + suffix);
          }
          for (const [, c] of n.children) {
            stack.push({ node: c.node, suffix: suffix + c.label });
          }
        }
        result.sort((a, b) => a.localeCompare(b));
        return result;
      } else {
        return [];
      }
    }

    const result = [];
    const stack = [{ node, suffix: '' }];
    while (stack.length > 0) {
      const { node: n, suffix } = stack.pop();
      if (n[TERMINAL]) {
        result.push(prefix + suffix);
      }
      for (const [, c] of n.children) {
        stack.push({ node: c.node, suffix: suffix + c.label });
      }
    }
    result.sort((a, b) => a.localeCompare(b));
    return result;
  }
}
