/*
 * Motivation:
 * This was an investigation into cyclical data structures using pure functional.
 * I was trying to find functional paradigms that were analagous to feedback in Arcana.
 * Just to see why funtional languages didn't need feedback, and whether or not it was beneficial to include it.
 * 
 * Much of this is a direct copy from:
 * https://www.linkedin.com/pulse/function-data-structures-javascript-basics-kevin-greene/
 * backup: https://github.com/kevinbgreene/functional-data-js/blob/master/PART_ONE.md
 * 
 * The graph traversal example is from:
 * https://softwareengineering.stackexchange.com/questions/140660/data-structures-in-functional-programming
 *
 * Notice that in the graph traversal, the graph itself has no feedback or circular references, but
 * the traversal is where the feedback is taken care of. It is almost as if the feedback has been
 * "deferred" to the traversal/execution, so that it takes the form of recursion instead of feedback.
 */

function Zero(fn, x) { return x; }
function One(fn, x) { return fn(x); }
function Two(fn, x) { return fn(fn(x)); }

function successor(num) {
  return (fn, x) => fn(num(fn, x));
}

function sum(a, b) {
  return (fn, x) => a(fn, b(fn, x));
}

//---------------------------------------------------------------//

function List(head, tail) {
  return (listFn, nilVal) => listFn(head, tail);
}

// represents the end of a list
var Nil = (listFn, nilVal) => nilVal;

var myList = List(1, List(2, List(3, Nil)));

function listSum(list) {
    return list((head, tail) => head+listSum(tail), 0);
}

console.log(listSum(myList));

//---------------------------------------------------------------//

function Pair(key, value) {
  return retriever => retriever(key, value)
}

function getKey(pair) {
  return pair((key, val) => key);
}

function getVal(pair) {
  return pair((key, val) => val);
}

var testPair = Pair(1, 'hi');
console.log(getKey(testPair) + ": " + getVal(testPair));

function Map(key, val, tail) {
  return List(Pair(key, val), tail);
}

function mapGet(map, key) {
  return map((head, tail) => key == getKey(head)? getVal(head) : mapGet(tail, key),
     'not found');
}

var testMap = Map(1, 'hello', Map(2, 'world', Map(3, '!!!', Nil)));
console.log(mapGet(testMap,2));

//-----------------------Helper Functions-------------------------//
function reduce(list, accumulator, fn) {
  return list((head, tail) => reduce(tail, fn(accumulator, head), fn),
      accumulator)
}

function filter(list, condition) {
  return list((head, tail) => condition(head) ? List(head, filter(tail, condition)) : filter(tail, condition),
             Nil);
}

var toPureList = ar => ar.reverse().reduce((acc, x) => List(x, acc), Nil);
console.log(listSum(toPureList([1,2,3,4,5])));

var toPureMap = obj => Object.entries(obj).reduce((acc, [key, value]) => Map(key,value,acc), Nil);
console.log(mapGet(toPureMap({1: 'a', 2: 'b'}), 2));

var toArray = list => reduce(list, [], (acc, x) => acc.concat([x]))

var contains = (list, el) => filter(list, x => x == el) != Nil

console.log(reduce(myList, '', (acc, x) => acc + ' ' + x));
console.log(toArray(filter(myList, x => x % 2 == 1)));
console.log(contains(myList, 3));
console.log(contains(Nil, 1));

//----------------------- Graph Traversal -------------------------//

// based on the structure and method described in 
//

var a = 'a', b = 'b', c = 'c', d = 'd';

// a graph is just a map of <node, neighbors>
var myGraph = toPureMap({
  a: toPureList([b,c]),
  b: toPureList([a,c]),
  c: toPureList([a,b,d]),
  d: toPureList([c])
})

// pushes to end of list
function pushBack(list, item) {
  return list((head, tail) => List(head, pushBack(tail, item)), List(item, Nil));
}

// depth-first traversal, returns all nodes in the graph, in visit order
function graphTraverse(graph, start, visited) {
  return contains(visited, start) ? visited :
    reduce(mapGet(myGraph, start), pushBack(visited, start), (visitedMod, neighbor) => graphTraverse(graph, neighbor, visitedMod));
}

console.log(toArray(graphTraverse(myGraph, a, Nil)));
