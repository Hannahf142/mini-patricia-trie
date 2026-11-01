import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PatriciaTrie } from '../src/index.js';

test('empty trie', () => {
  const t = new PatriciaTrie();
  assert.equal(t.size, 0);
  assert.deepEqual(t.words(), []);
  assert.equal(t.has(''), false);
  assert.equal(t.has('a'), false);
  assert.equal(t.delete('a'), false);
});

test('insert and has single word', () => {
  const t = new PatriciaTrie();
  assert.equal(t.insert('hello'), true);
  assert.equal(t.insert('hello'), false);
  assert.equal(t.size, 1);
  assert.equal(t.has('hello'), true);
  assert.equal(t.has('hell'), false);
  assert.equal(t.has('helloo'), false);
  assert.deepEqual(t.words(), ['hello']);
});

test('insert empty string', () => {
  const t = new PatriciaTrie();
  assert.equal(t.insert(''), true);
  assert.equal(t.insert(''), false);
  assert.equal(t.size, 1);
  assert.equal(t.has(''), true);
  assert.deepEqual(t.words(), ['']);
  assert.equal(t.delete(''), true);
  assert.equal(t.delete(''), false);
  assert.equal(t.size, 0);
});

test('shared prefixes are compressed', () => {
  const t = new PatriciaTrie();
  t.insert('car');
  t.insert('cat');
  t.insert('cart');
  assert.equal(t.size, 3);
  assert.deepEqual(t.words(), ['car', 'cart', 'cat']);
  assert.equal(t.has('car'), true);
  assert.equal(t.has('cat'), true);
  assert.equal(t.has('cart'), true);
  assert.equal(t.has('ca'), false);
  assert.equal(t.has('cards'), false);
});

test('prefix is a word', () => {
  const t = new PatriciaTrie();
  t.insert('a');
  t.insert('ab');
  t.insert('abc');
  assert.deepEqual(t.words(), ['a', 'ab', 'abc']);
  assert.equal(t.has('a'), true);
  assert.equal(t.has('ab'), true);
  assert.equal(t.has('abc'), true);
});

test('delete leaf', () => {
  const t = new PatriciaTrie();
  t.insert('car');
  t.insert('cat');
  assert.equal(t.delete('car'), true);
  assert.equal(t.delete('car'), false);
  assert.equal(t.size, 1);
  assert.deepEqual(t.words(), ['cat']);
  assert.equal(t.has('car'), false);
  assert.equal(t.has('cat'), true);
});

test('delete internal word', () => {
  const t = new PatriciaTrie();
  t.insert('car');
  t.insert('cart');
  assert.equal(t.delete('car'), true);
  assert.equal(t.size, 1);
  assert.deepEqual(t.words(), ['cart']);
  assert.equal(t.has('car'), false);
  assert.equal(t.has('cart'), true);
});

test('delete causes merge', () => {
  const t = new PatriciaTrie();
  t.insert('car');
  t.insert('cat');
  t.insert('dog');
  assert.equal(t.delete('car'), true);
  assert.equal(t.delete('cat'), true);
  assert.deepEqual(t.words(), ['dog']);
  assert.equal(t.has('dog'), true);
});

test('delete all', () => {
  const t = new PatriciaTrie();
  t.insert('a');
  t.insert('b');
  t.insert('c');
  assert.equal(t.delete('a'), true);
  assert.equal(t.delete('b'), true);
  assert.equal(t.delete('c'), true);
  assert.equal(t.size, 0);
  assert.deepEqual(t.words(), []);
});

test('wordsWithPrefix', () => {
  const t = new PatriciaTrie();
  t.insert('apple');
  t.insert('app');
  t.insert('apricot');
  t.insert('banana');
  assert.deepEqual(t.wordsWithPrefix('app'), ['app', 'apple']);
  assert.deepEqual(t.wordsWithPrefix('ap'), ['app', 'apple', 'apricot']);
  assert.deepEqual(t.wordsWithPrefix('a'), ['app', 'apple', 'apricot']);
  assert.deepEqual(t.wordsWithPrefix('b'), ['banana']);
  assert.deepEqual(t.wordsWithPrefix('c'), []);
  assert.deepEqual(t.wordsWithPrefix(''), ['app', 'apple', 'apricot', 'banana']);
});

test('wordsWithPrefix in middle of edge', () => {
  const t = new PatriciaTrie();
  t.insert('hello');
  t.insert('help');
  assert.deepEqual(t.wordsWithPrefix('hel'), ['hello', 'help']);
  assert.deepEqual(t.wordsWithPrefix('hell'), ['hello']);
  assert.deepEqual(t.wordsWithPrefix('help'), ['help']);
});

test('type errors', () => {
  const t = new PatriciaTrie();
  assert.throws(() => t.insert(123), TypeError);
  assert.throws(() => t.has(null), TypeError);
  assert.throws(() => t.delete(undefined), TypeError);
  assert.throws(() => t.wordsWithPrefix(42), TypeError);
});

test('size tracks inserts and deletes', () => {
  const t = new PatriciaTrie();
  t.insert('a');
  t.insert('b');
  t.insert('a');
  assert.equal(t.size, 2);
  t.delete('a');
  assert.equal(t.size, 1);
  t.delete('b');
  assert.equal(t.size, 0);
});
