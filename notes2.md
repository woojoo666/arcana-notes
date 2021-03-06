### Arcane is now Arcana!

* sounds nicer lol

### Functional vs Dataflow II

difference between functional and dataflow
* in dataflow, we don't wait for all inputs to finish before computing the output
* in functional, all inputs have to finish evaluating before current function can finish
	* eg, in `fn(a(), b(), c())`, the functions `a()`, `b()`, and `c()` all have to finish before `fn()` can start
	* on the other hand, in dataflow, `fn()` can start once any of them finishes
* both dataflow and functional are "defined" in a backwards fashion, but during execution, dataflow flows forward while functional flows backward
* not sure if this is a good thing for dataflow though
* this just means that dataflow wastes computation on incorrect, transient results
* infinite loops will halt a functional program, which can be seen as an advantage for dataflow
* however, one might argue that the dataflow program isn't giving accurate results if an input hasn't finished yet
* we could use a "timeout" system for the dataflow program to be more accurate, but a "timeout" system could be implemented in functional as well

* dataflow works in a sort of "incremental evaluation" fashion, where every input update triggers updates throughout the network
* doesn't wait for all inputs
* in some cases, modules might have one input change, or might have four inputs change
	* functional doesn't really keep track of state, doesn't cache variables
	* 
? in dataflow every node has state? 

* we could argue that in some cases, we can never know if an input is "finished", eg user input
* however, in many cases we _can_ know, we can track if there are still changes propagating before
	* of course feedback causes issues, but functional doesn't have feedback
* 

* lazy evaluation doesn't always work
	* eg in recursive functions, lazy evaluation can lead to infinite loops
	? can we reduce to halting problem?
* so even functional must use forward evaluation sometimes
* when waiting for inputs to "finish", we don't know if the input will change or not
* thus, incremental evaluation can be seen as a sort of "speculative execution"
* it makes sense in circuits and HDL, because in hardware everything is asynchronous anyways, so evaluating things ahead of time doesn't cost anything
	* in fact, waiting for inputs to finish is wasteful, hardware lying around not doing anything is wasteful
* 


* functional doesn't really account for persistent and dynamically changing data
* functional really only does first iteration
* doesn't hold onto data
* how would a functional program respond to changing data?
* would be really inefficient to completely recompute
* if functional were to use a selective recomputation pattern, it would basically be dataflow
* the only way to do efficient updates for dynamic inputs is through incremental updates


currently in my dataflow model:

* changes in input move forward
* changes in muxes and conditionals move backwards
	* recall the observation-based evaluation (basically lazy-evaluation) that we discussed much earlier
	* there are infinite potential paths, so we must use backward propagation from the outputs to determine which paths are relevant
* property writing moves forwards
* property access moves backwards
* write forwards, read backwards


* another big difference is that dataflow can have feedback, whereas functional cannot
* in other words, in dataflow the dependency graph can have cycles
* this became an issue when I was brainstorming synchronization
	* originally I was going to have synchronized blocks wait for their inputs to finish, but this would cause deadlocks in any cycle
* notice how functional always waits for inputs to finish, but doesn't have the same issue, because there is no feedback
* dataflow has the same cycle deadlock problem when doing lazy evaluation
* note that the _behavior_ of feedback can be replicated in functional using recursion
* feedback is essentially just recursion that, at some depth, calls itself with the same arguments, creating an infinite loop
* notice that recursion can prevent lazy evaluation, just like for feedback in dataflow
? can feedback result in different answers depending on execution order/speed?
? is feedback useful in any case? doesn't seem like it

* functional is basically dataflow with lazy evaluation

### Feedback

* feedback is the dataflow way of maintaining state
* but if we have such a concept as state variables, we don't need feedback anymore
* but in dataflow can we really prevent users from adding feedback?
	* cycle detection is very slow, O(N)
	* needs to trace entire network every time user adds an edge
* trying to prevent feedback seems anti-dataflow
* every module is independent, can't control what happens outside
* we can think of a module as a computer in a network
* if the network wants to send the computer's outputs back into the computer's inputs, we have no control over that

* how does functional and imperative prevent feedback?
* actually, we can prevent feedback, using two rules:
	* no edges going backwards
	* dependencies must be defined first
* this ensures a directed acylic graph

* however, we still might want pointers going backwards, eg a tree structure with "parent" pointers
* they add to convenience

tree structure (good feedback): `myTree { x: { x: 3, y: 4, root: myTree}, y: 5, root: myTree }`

selfadder (bad feedback): `ans: ans + 1` aka `ans { value: ans.value + 1 }`

### Feedback - Structure vs Value

* this is the difference between treating modules as structure, and treating them as values
* when treating them as structure (or memory locations), feedback isn't a problem, it's just pointers
* but when treating them as values, then we get into infinite update loops

* but technically aren't values and structure the same thing?
* we can define addition using set theory
	* `successor { x... , x }`
	* example: 0 = {}, 1 = { {} }, 2 = { {}, {{}} }, 3 = { {}, {{}}, {{},{{}}} }
	* feedback: `ans: successor{ans}`

* perhaps it is more about how far we are willing to evaluate the value of the result
* in the tree structure example, if we were to truly evaluate the structure to get the "complete" value, it would run infinitely

* perhaps what we could do is enforce that all back pointers are simply pointers, shortcuts
* `ans: ans + 1` is not a pointer, it's pointing to an evaluated value
* `x { y: { back: x }}` is a backpointer, because we can keep it as a pointer, not evaluate it, and it still can function as a shortcut

* so ultimately, it comes down to evaluation
* arithmetic operations are a way of converting a structure of operations and numbers, and consolidating it into a single value
* due to the nature of how the operations work, it doesn't make sense to consolidate a graph with cycles/feedback
	* how should it interpret cycles? An infinite set of results? find what limit it approaches?
	* note that if you want to create an infinite set of results, there are better ways, eg using recursion, which will actually create an indexed set of values instead of a single, constantly changing value
* string operations can be thought of in the same way
* there's a difference between the structure, versus the propagation of values through that structure
* the structure may allow cycles, but that doesn't mean the evaluation allows feedback

### Feedback - Evaluation Models/Systems

* feedback only becomes a "problem" when the evaluation model doesn't account for it
* no restrictions on how the data is structured, any directed graph is possible
* evaluation systems, eg for numbers and strings, have to account for feedback
* for example, the arithmetic system can be defined as such
	1. numbers have `type: Number`, and value stored in the `value` property
	2. operations: `+`, `-`, `/`, `*`, `**`, and modules built on top of those
	3. if any input to any operation is undefined, the output is undefined
* rule 3 is what prevents runaway feedback
	* if there is a cycle, or some sort of feedback, then one of the results is being used before it is evaluated, which will evaluate to `undefined`, which will cause `undefined` to be propagated through the network
* example, `ans: ans + 1`, `ans` starts out as `undefined`, so this is a stable feedback loop
* on the other hand, this is runaway feedback: `ans: (ans == undefined) ? 0 : ans + 1`

### Feedback and Undefined

* it seems like, after rule 3, `undefined` is now the key issue for feedback
* for example, this creates feedback, without any arithmetic: `ans: (ans == undefined) ? 0 : undefined`
	* this is because the `==` operator allows undefined inputs to result in defined outputs
* we could possibly prevent this using a fourth rule
	4. if any variable was already used in the evaluation, then it won't be used again (won't trigger a double-update)
* this would not only prevent feedback, but also cause data to be "outdated"
* not sure if this is preferred

* note that we could also prevent this by forcing the `==` operator to also output `undefined` if any inputs are `undefined`
* this would basically turn `undefined` into a special value that automatically fails everything after it, like a virus spreading through the system and turning everything `undefined`
* we could still get behavior similar to `ans: (ans == undefined) ? 0 : ans + 1` using recursion:
	`ans[0] = 0, ans[n+1] = ans[n]+1`
* we still want to be able to account for undefined values though, instead of letting them break the entire system every time
* we can have an `if undefined { ... }` module, we just need to make sure that the output of that module doesn't affects the variable being checked

* versioning prevents feedback
	* this is why imperative doesn't really have feedback
	* every variable modification creates a new "version" of the program, a new program state
* but could we use this to prevent feedback in Arcana?
* maybe we could create an initial "undefined" version, which contains bindings that lead to the "defined" version

* in fact, we can prevent feedback altogether as long as we don't allow the user to set variables to `undefined` as a value
* for example, this wouldn't be allowed: `ans: (ans == undefined) ? 0 : undefined`, because we are setting `ans` to `undefined`
* this way, the state of the program can only become more and more defined, cannot become less defined
* this is a little undesirable as well though, setting values to `undefined` can 

### Functional vs Dataflow - data vs signals

* another main difference is that inputs/outputs of functional are data, whereas for dataflow all inputs/outputs are signals
* most of the time we think of the output of a dataflow module as the steady-state limit of the signal
* this is why with feedback, it's possible to get an output signal that oscillates and thus has no steady-state
	* this would be undefined in functional terms
* also, feedback can allow input signals with the same steady-state to result in different output signal steady-states
	* input signals can start out differently and still end up with identical steady-states
	* the transient differences can cause feedback loops to diverge into different output steady-states
	* in functional terms, this would mean identical inputs can result in differing outputs

### Metaprogramming Thoughts II

* in almost all art forms, the process goes like:
	1. imagine complex art piece
	2. block out basic forms
	3. add layers of complexity/detail/ornamentation
	4. attain complex art piece
* at first it didn't seem like Arcane metaprogramming fit this
* Arcane metaprogramming strives to reach a simple, easy to read program for the user
* all programming languages strive for simplicity/elegance at the end
* however, I realized that the complexity isn't the end program, but the end result
* in step 1, the complex art piece is not the program, but the behavior of the program
* we are trying to achieve complex behavior
* steps 2 and 3 are where Arcane metaprogramming come in
	* start simple, then add layers of complexity
* by the end, the layers of complexity contribute to the complexity of behavior
* but we can still see the simplicity of the program from the high-level diagrams
* this is kind of like saving all your layers in photoshop so you can see how you constructed the painting/drawing

### Imperative vs Functional

imperative is superset of functional?
we can have imperative elements in Arcane as well

### Filtering Names vs Values

* filter names vs values
* how do we specify whether we are filtering for property names or values?
* eg. `array.filter(item.index % 2 == 0)` vs `array.filter(item.value % 2 = 0)`
* special syntax for a filter? takes in a list/item, outputs all items that pass the filter
* what if we want to filter values, but retain the names in the result list?
* what if we use a pattern matcher on the names, but we want to retain the names in the result list
* some way of preserving bindings when extracting nodes
* maybe syntax like `Node{<prop>: <rule>}`
	* eg: `Node{(/po+py?/,val): val % 5 == 0}` will extract all properties whose name matches regex `/po+py?/` and whose value is a multiple of 5
		* this enforces a name AND value condition, but what about a name OR value condition? eg "extract all properties whose name is 2 letters OR whose value is a string"
* `if (longnameobject[longnameproperty] == bla) { longnameobject[longnameproperty].dostuff() }`
* take items, go through long process, figure out which ones are necessary, tag them, then do something based on tags
* we can filter more than just values, we can filter properties, subgraphs
* just give a condition and it'll pull out all subgraphs that match, kind of like advanced regex

### Metaprogramming Example - Subset Sum and Generators

* another example of metaprogramming
* `list.subsets().filter(sub => (sum(sub) == 100))`
	* obviously not the most efficient way to do this
	* but definitely the easiest to understand
	* I mean I guess you could do something like `subsetsum(list, 100)` and implement the function elsewhere
	* but the earlier method
		* actually works
		* self-explanatory, easy to understand
		* gives a general structure of the procedure

generators:
* are a good example of metaprogramming
* obviously very slow, but intuitive to understand
* `stream(ints).filter(> 1, < 100).forEach(fn(...))`
* subsets()

### Parallelizing Versioning

if we can do if statements and do versioning, then can we convert imperative to arcana?
that means that imperative is parallelizable

every time theres a reassignment, we need to keep track of where it is 

```js
var x = 2;
var y = 4;

for (var i = 0; i < 1000; i++) {
	if (prime(i)) {
		x = x*x;
	} else {
		x = x+1;
	}
}
```

doesn't seem that beneficial to parallelize versioning
but imagine if we had a mllion people calling the same function
maybe we can use a look-up table?
	* different versioning flows may converge to the same version at some point
	* kinda like dynamic programming
	* this is where a look-up table could be useful

"write once read anywhere"
tons of optimizations for single threaded process
but now we can optimize for all sorts of systems
we need to know which layers/modules we can touch, and which we can't
powerset module, maybe some people want the recursive method, some people just want tne nondeterministic definition

### Implicit Arguments II

* recall how autofilling worked (see "Implicit Arguments")

```js
module caller {
	a = 0;
	b = 'hello';
	x = callee(); // autofills `a` and `b` if they are parameters of `callee`
};
```

* when autofilling arguments of a callee, we don't want to pull from all caller properties
* only the properties that are defined directly within the caller module
	* or perhaps within the current "view" of the IDE
* so any properties that are inherited or passed into the module, or dynamically generated, should not be used to autofill arguments

### Implicit Outputs

* all local variables are properties, and can be accessed from the outside
* this makes return statements unnecessary
* simply declare any output you might need as a local variable

```js
function sum (a, b) {
	output: a + b
}

myoutput = sum(3,5).output
_
```

* anonymous un-named outputs are also allowed, just use the `return` keyword
* just like how function inputs don't need names

```js
function sum (a, b) {
	return a + b
}

myoutput = sum(3,5) // yes, it does look exactly like javascript now lol
_
```

### Multiple Anonymous Outputs?

* note that in imperative languages you can have multiple unnamed inputs
	* named inputs: `x = sum(a: 5, b: 10)`
	* unnamed inputs: `x = sum(5, 10)`
* perhaps with outputs we can have the same thing?
* multiple anonymous outputs, with a specified order

* eg `x, y, z = fn(a, b, c);`

? but if you have multiple return statements, how do we determine if it's multiple outputs, or multiple states of an output?
* eg

```js
// one output, which is "invalid" if x < 0, and square root of x if otherwise
if (x < 0)
	return "invalid"
return Math.sqrt(x)
_
```

```js
// two outputs, but the first output is only defined if x < 0
if (x < 0)
	return output1
return output2
```

* we could technically change the first one to only have a single return statement like so

```js
if (x < 0)
	out = "invalid"
else
	out = Math.sqrt(x)
return out
```

### Implicit Inputs and Unbound Variables

* note that we don't need to specify inputs either
* we can just refer to them in the code
* any variable that doesn't have a value is considered an input

```js
sum: {
	output = a + b // because a + b are "unbound", they are implicit inputs
}

mysum = sum(a: 10, b: 20);
```

* in the IDE, you can hover over a module to scan it and find unbound variables, aka implicit inputs
* all implicit variables will also show up at the top of the module

* another way of thinking about it is, unbound variables are symbols
* if variables aren't given a value, they stay as symbols

* note that, conversly, you can give a symbol property a value
* however it could cause unexpected behavior

```js
foo: {
	this[symbol1] = "cat"
	this[symbol2] = "dog"
	return this[symbol2]
}

foo(symbol1: 5, symbol2: 5); // what should this output?? maybe `overdefined`??
```

* I guess this is the same as

```js
foo

foo[symbol1] = "cat"
foo[symbol2] = "dog"
return foo[5]
```

```js
a.b.c.d = 10
a.b = 12 // doesn't override b, just sets the "value" property
a.b = { foo: 20 }; // does override b
```

### Anonymous Arguments

(note: this section was added 6/24/18, but I added it here because I already had the idea,
 as evident by the message I sent to Nylo over reddit on 5/11/2018, I just never wrote it down)

* unbound variables are implicit inputs
	* shown by the IDE at the top of the module
	* no need to manually declare parameters anymore
* we can also leverage this to work with "anonymous arguments", or arguments without a specified property name

```js
sum: {
	output = a + b // because a + b are "unbound", they are implicit inputs
}

mysum = sum(10, 20); // 10 and 20 automatically bind to the implicit inputs, `a` and `b`
```

* they are bound in the order that the unbound variables appear in the module

? what happens if there are more anonymous arguments than unbound variables?
	* extra arguments are ignored?
	* starts overriding bound variables?
? what happens if we mix anonymous arguments with regular arguments?

```js
foo: { a, b:'hi', c: 10, d }

bar: foo(1, 2, a: 'world');
```

* should anonymous variables be bound first? or last? or everything happens in order?
* but function arguments is supposed to be like defining a module, and overriding the called module with the new module
	* in this case the new module is `{1, 2, a: 'world'}`, which is overriding `foo`
* and when we define modules, order shouldn't matter...


### Branching

* I was writing a quick script to run in the browser console
* I was using a very long "flow" to pull a list of items from the page:

```js
var tablist = document.getElementById("history-app").shadowRoot.getElementById("synced-devices").shadowRoot.getElementById("synced-device-list").children[0].shadowRoot.querySelectorAll(".website-title");
```

* then I wanted to add a textarea, `mytextarea` (assume it is already defined)
* wanted to add it in the middle of the flow
* kind of a like a fork in the road
* another way of thinking about it is: adding a branch

```js
var tablistcontainer = document.getElementById("history-app").shadowRoot.getElementById("synced-devices").shadowRoot.getElementById("synced-device-list").children[0].shadowRoot.getElementById("history-item-container")
tablistcontainer.appendChild(mytextarea)
var tablist = tablistcontainer.querySelectorAll(".website-title");
```

* notice that we had to move everything to tablistcontainer
* big restructuring just to add a branch
* now if we want to change where to put the textarea, we have to restructure everything again

* in Arcana, at least in the diagram-based language, it's easy to add a branch
* just draw the branch, and connect it to the main flow wherever you want
* we don't even need to restructure the original flow, or define a new variable `tablistcontainer`
* diagram-based languages make it easy to make/break connections like this

### Scope and Implicit Arguments

( a lot of this was discussed previously in the section "Implicit Arguments" )
( this is more about giving the idea a more concrete basis using scopes and cloning )

* defining is the same as calling

* but then how do we decide what is inherited, and what is passed in
* too much implicit inheritance make it hard to prevent things from being inherited
	* how to we prevent inheritance from overriding everything?

* recall that objects can be extended as a way to create partial transformations
* when a module is defined, it binds its scope (just like in js)
* unlike js, when you "call" a function, you are actually defining a new one, cloning it
	* pulls arguments from the entire scope, and not just the ones passed in
* using parenthesis in Arcana, eg `fn(2)`, is like javascript prototypal extension, eg `Object.create(fn, 2)`)

```python
def container:
	a = 5
	def bla:
		c = a + b

def test:
	b = 10
	out = bla() # inherits b from scope, basically the same as bla(b: 10)
```

we are basically making copies/clones of objects
when you first define the object, it grabs values from the scope around it, binding them to the variables
this is called "clone scope" or "clone scoping"

```js
var a = 5
var b = 10
function obj () {
	sum = a + b + c
}
```

* afterwards, the object is "complete", with variables bound
	* if some variables are left unbound, they act like symbols, like symbolic expressions in math
	* the object is still considered "complete" even if variables are left unbound, and it can be passed around like any other object

* when you create a copy, it tries to bind unbound variables?
	* how to tell undefined vs unbound?
		* aren't unbound "symbols" like undefined variables? but sometimes we want to explicitly bind a variable value to `undefined`
	* maybe we should only bind when explicitly declaring
		* calling, eg `fn(a: 5, b: x)` will bind properties `a` and `b`
		* extending, eg `fn() {a = 5, b = x}` will bind properties `a` and `b`
	* overriding variables/properties

* you can extend the object, defining new properties and rules
* what about redefining outputs?

* perhaps it can be confusing to automatically pull arguments from the scope
* maybe we can use a keyword to explicitly pull arguments from scope

```python
def container:
	a = 5
	def bla:
		c = a + b

def test:
	b = 10
	out = bla.from(this) # inherits b from scope, basically the same as bla(b: 10)
	newbla {
		newc = (bla.a || a) + (bla.b || b) # this kinda works similar...
	}
```

### Conditional Syntax Brainstorm

* two ways of defining conditionals

```python
# this method is for defining multiple properties in a single conditional
def conditional:
	(x > 0):
		out: 3
	else:
		out: 7

# this method is for defining multiple conditions for a single property
def conditional:
	out:
		(x > 0): 3
		else: 7

print(conditional.out)
```

### Null is Evil?

* there is a lot of discussion about null being evil, called the "billion dollar mistake"
* the main arguments is that it is a global special case
	* subverts the type system
	* sloppy, "oh I don't want to create a new type so I'll just use null"
	* more code paths to debug, always have to check for null cases
* see more details [here](https://www.lucidchart.com/techblog/2015/08/31/the-worst-mistake-of-computer-science/)

* so why does Arcana have `undefined`?
* because Arcana is all about data, and all data starts as undefined
* it's the default output
* in imperative languages, everything runs on functions and execution
* if there's a problem, then the function throws an error
* `undefined` is the dataflow equivalent of throwing an error

* in pure functional languages, there is no `undefined` or `errors`
	* you can explicitly specify a "nullable" type using `Option` or `Maybe`
	* but by default, there is no default special case
* this means that in functional, you have to define every case
	* can get tedious
* and what about "illegal" behavior, like calling a function with the wrong number of arguments?
* this would cause a compiler error
* it's behavior that hasn't been defined yet by the compiler
* from a metaprogramming stance, the compiler is a program too
	* the behavior of the compiler is also a behavior of the language
* thus, functional languages **do** throw errors, as the default for illegal/undefined behavior

* in Arcana, everything is a program/module, including the interpreter itself
* so in a sense, outputting `undefined` is kind of like throwing a compiler error
* it's "illegal" or "undefined" behavior 

### Feedback - Referencing an Object Before It's Made?

does modifying variables introduce feedback?
	* possibly, variables aren't technically allowed to be modified, but you can introduce new bindings when cloning them
	* `foo: { x: y+1 }` and then `bar: foo(y: x+1)`, now `bar` has feedback
	* notice that we did not need to do any "self-referencing", eg `foo: { k: k+1 }`, where we referenced `k` in its own definition
	* though techically if bar doesn't reference itself, and references foo, then maybe `bar` is actually more like:
		`bar.y: foo.x+1, bar.x: bar.y+1`
what about using "this"
	* possibly introduces feedback, because it is referencing itself in it's own definition
can be useful
references something before it's made?

## Scope as a Variable?

what about "scope" as a variable
technically possible using a stream, an infinite object of all variables in scope?
	`{ x | name in allNames(), this[name] != undefined, x = this[name] }`?
	allNames() is the stream in this case
	note that since this is an infinite function, we would be unable to output the size of the output array, even though it must be finite

### Scope Passing and Nested Modules

* core tenet of Arcana: a module only knows it's internals, and knows nothing about it's externals
* thus, doesn't make sense for a module to be able to "pull" and "bind" variables from it's surroundings, the way scoping usually works
* instead, modules pass in all variables they declare to nested modules
this explains why we can pass it to our copy objects now

* maybe this explains why certain tag properties are not iterated using forAllProperties
	* the function forAllProperties is only passed text properties?

* a module knows everything about it's internals
* that means it can pass any local variable it wants to a nested module
* what if it wants to pass in all internal variables?
* then it just needs to create a set of all internal variables, and pass it in
* but we already have a set of all internal variables, the module itself!
* so maybe modules can pass themselves into nested modules?
* and don't they already pass in all their declared internal variables anyways?

recall that local variables are just another way of defining outputs
nested modules are just another way of defining inputs
a nested module is not actually "nested", it's shorthand for


```js
	nestedNode.parent = containerNode
	containerNode._temp = nestedNode
```
there's also a few systems tied to the nested module system, like synchronization and autofill and scoping
how do we ensure that people don't abuse it, and manually assign `parent`, possibly creating cycles and breaking synchronization?


* in order to ensure metaprogramming, we have to create properties for anonymous modules
* for example, if we have `x = a( b( c() ) )`, we have to create variables for `b()` and `c()`
* we can have some sort of system for this
* need to make sure it doesn't use up variable names that people might want to use themselves

### Encapsulation - Scopes and Feedback

core tenets:
a module knows everything about it's internals, has all power over the inside world
a module knows nothing about it's externals, and has no power over the outside
a module is just a set of variables and rules
	has no distinction over what's an "output" and what's an "input", can't make variables public/private
no feedback, a variable can only be defined once, and all it's dependencies must be defined first
`undefined` is the default value of all variables

### Synchronization and Turing Completeness

* earlier I said that synchronization is needed to make the language turing complete
* that is actually false
* instead of creating a state-machine using synchronization, we can use state variables and versioning

```python
for i in range(0, infinity):
	state[i+1] = state[i].getNextState( tapeVersion[i].read( headPos[i] ))
	headPos[i+1] = headPos[i] + ( state[i].moveleft ? -1 : 1 )
	tapeVersion[i+1] = tapeVersion[i].write( headPos[i], state[i].writeChar )
```





use `next` and `prev` as keywords to reference/create versions and states?

```js
for click in clicks
	counter.next = counter + 1
```

### Return to Zork

here I am trying to implement the game "Return to Zork" (see `ReturnToZork.md`)

```js
neighbors = getRoom(room.coordinates+([-1,0,1]*[-1,0,1]).filter(sum == 1)).tagWith(direction from coordinates)


NSEW = [-1,0,1]*[-1,0,1].filter(sum == 1) = [(-1, 0), (1, 0), (0, 1), (0, -1)]
neighbors = NSEW.map(dir => {
	neighbor = rooms.with(coordinates: coordinates+dir)
	neighbor[symbolproperty "direction"] = switch(dir) {
		case (-1, 0): "left",
		case (1, 0): "right",
		case (0, -1): "down",
		case (0, 1): "up",
	}
	return neighbor
})


room.neighbors {
	rooms.filter(room => distance(this, room) == 1) // hmm is this feedback
	[symbolproperty "origin"] = this
	[symbolproperty "direction"] = switch(coordinates - origin.coordinates) {
		case (-1, 0): "left",
		case (1, 0): "right",
		case (0, -1): "down",
		case (0, 1): "up",
	}
}

// filter and add new properties using this syntax
neighbors = rooms.with{
	distance(this, neighbor) == 1
	origin: this
	direction: switch(...) {...}
};
```

### The `with` keyword

* notice the `with` keyword in the "Return to Zork" code
* this keyword is used both filter properties and add new ones

```js
// looks for all triplets that can form valid triangles
triangles = nums.triples.with {
	a > b + c
	b > a + c
	c > a + b
}

students = people.with {
	occupation: "student" // filter for people that have the occupation "student"
	type: "Student" // add the type tag "Student"
};
```

however, how can it tell whether or not we're trying to add a property or check them?
can't just check if the property is undefined, because we might be trying to filter for defined/undefined
can't check if the property name is local, because we might be filtering for that as well
	or maybe the property we're trying to add is local, but in a broader scope than the current one
we could add a special keyword? use `:` when specifying new properties, use `==` for checking equality?
	so in the above examples, it should have been `students = people.with { occupation == "student" }`
or maybe we only allow one condition at the front (use parenthesis and `and` or `or` if you want more conditions)

### The `value` keyword?

* `value` is a special property that is used by strings, numbers, etc
* eg `evens = nums.with{ value % 2 == 0 }`
* it's an internal property, local variable, only accessible through certain scopes
* allows us to add properties and tags to numbers
	* without changing the numeric value associated with the number

### Using `with` on Single Objects?

`with` is basically filter so it should only be used on lists/sets
but could you use it to add tags to single objects? 
if we add tags to an object, are we extending it? it's like creating a copy, but it's a bound copy, so its more liek a wrapper
mmm not really, because if the object leaves the scope, it shouldn't have the tags attached anymore
	but then comes back, the tags should reappear
	or should it?
	should symbol tags be attached to the object, or the name?
	probably the object
	if we create a bunch of objects, then we have a pointer "current object", 
yeah I think we are extending it, creating a new object
any time you change or add tags, you are modifying the object, so you are essentially extending/copying it

### Return to Zork II

```js
//input: a bunch of rooms
// attach properties to them
// islocked can be used as a function or as a method
// functions can be as methods if there is one unbound input variable left

door: set{
	islocked: lockedDoors.contains(this)
}

current {
	room. // state variable
	neighbors: room.neighbors
	lockedDoors: lockedDoors.with{ contains(room) } // overrides external lockedDoors variable
	unlocked: lockedDoors.with{ value == [room, otherRoom] } == EMPTY // otherRoom is "unbound", input variable
	unlockedNeighbors: current.neighbors.with{ unlocked(otherRoom: this ) } // `this` refers to the current neighbor

	lockedNeighbors: lockedDoors.with { value = [ room, _ ] } // somehow extract the otherRooms from lockedDoors
	unlockedNeighbors: neighbors - lockedNeighbors

	doorto(neighbor): door( room, neighbor )
	islocked: lockedDoors.contains(door) // door is unbound, input variable
	lockedNeighbors: neighbors.with { doorto(this).islocked } // 
	// neighbors whose door is locked
	unlocked 
}

rooms: [1,2,3,4,5].forEach {

	neighbors: rooms.with{ // is this feedback?
		distance(this, neighbor) == 1
		origin: this
		direction: switch(...) {...}
	}
}

player: {
	look: {

		exitsMsg: "There are open doors to your " + current.unlockedNeighbors.getEach(direction).join(", ") + ". "
		itemsMsg: 
	}
};
```

notice that we define a lot of variables
we create a sort of "bank" of knowledge
instead of stringing together functions inline, we add to our bank of knowledge, in case we want to reuse some info later

we started with `unlocked` inside `player.look`:

```js
unlocked: lockedDoors.with{ value == [room, otherRoom] } == EMPTY // otherRoom is "unbound", input variable
exitsMsg: "There are open doors to your " + current.neighbors.with{unlocked(current.room, this)}.getEach(direction).join(", ") + ". "
```

but then I realized I might want to use unlocked rooms in another place, so I simply moved the definition into `current`

I don't have to worry about whether or not the variable is initialized, or updated, I can just move it wherever

how would this look in imperative?

### Text-Based Syntax Brainstorm

`:` is for defining variables?
`=` is for state variables and versioning?
`==` is for value equality?
`===` is for reference equality?

`module(a,b)` for anonymous arguments?
`module {x: a, y: b}` for extending modules?
`module.with{conditions}` for filter

* `list.matches{ prop1: 10, prop2: { a: __match1__, b: 35 }}` vs `list.with{ prop1 == 10, prop2.b == 35, __match1__: prop2.a }`
* `matches` is probably better for deeply nested structures, `with` is better for conditionals
* we can combine the two
	* `list.with{ prop1 == 10, prop2.with{ __match1__: a, b == 35 }} ??????????`

### Overdefined

* with our current unrestrictive definition of conditionals, it's possible for things to get defined twice

```python
def foo:
	(x > 10): "medium"
	(x > 20): "big"
	else: "small"

foo(x: 50) = ??? # superposition of "medium" and "big"
```

* we could prevent this by restricting conditionals
* but it's possible for it to occur through other means as well

```python
foo

def test: x, y
	foo.x: "dog"
	foo.y: "cat"

test(3, 3)
```

### Creating Bindings

* currently we have this idea that we can create bindings/properties, even after the object is defined

```js
x = { a: 3 }
x.b = 5
```

* this allows for more flexibility when defining objects
* otherwise, definitions might get too big
* however, what happens if we do this

```js
foo

bindingCreator:
	foo.x = 3

bindingCreator()
bindingCreator()
;
```

* this is creating side effects
* we are modifying variables
* goes against the main tenets of Arcana
* but should we allow modifications?

### Modifications

should we allow modifications?
state variables?
adding tags?
declarative languages define variables, and don't mesh well with modifying variables
but modifying variables is natural and intuitive

```js
for event in events
	x++

// get all nodes in a graph (recursive)
graph.nodes:
	visited // symbol/tag
	set
	traverse: node
		for child in node.children.with(visited = false)
			child.visited = true
			set += child // add child to set?
			traverse(child) //hmmm this seems more like a function call than a transformation
	return traverse(graph.root)

// fold version
graph.nodes:
	for iteration in infinity
		visited = prev.visited // set of visited nodes
		lastvisited // set of last visited nodes (queued for next iteration)
		for child in lastvisited.getall(children).with(visited = false)
			visited += child // add child to set
			next.lastvisited += child
	return visited
```

### Nylo

* as I was browsing [reddit r/programminglanguages](www.reddit.com/r/programminglanguages), I found somebody working on a similar language
* called "Nylo"
* [here is the original comment thread](https://www.reddit.com/r/ProgrammingLanguages/comments/8g8mru/monthly_what_are_you_working_on_how_is_it_coming/dya5uw2/)
* also was based on the concept that everything is data
* also seemed to be very dynamic
* syntax is also very similar (except he doesn't wrap his modules with `{}` brackets, and uses `->` instead of return)
* I started messaging him over reddit, and we started collaborating
* from here on forward, while the ideas in these notes are still mostly my own (unless noted otherwise), there is probably some influence from Nylo as well
