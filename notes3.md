### Sets vs Lists

* should we have separate ways to define sets and lists?
* or can we make everything a list, and use sets if the list order is never referenced?
* but when we display things to the screen, we don't know if it should be displayed in order or not
* maybe only then do we have to specify that order is needed, otherwise it will default to set

### Commas are Optional

* note that anywhere there are commas, we can omit them
* except for defining multiple properties in the same line

```python
myset: "cat" "dog" # unordered set
mylist: [1 2 3 4 5] # ordered list

myobj: (a: 10, b: 20) # commas required (should be obvious why)

copy: myobj(15 25)
```

### State Machine Syntax Brainstorm

```js
for timestep
	moveState.next() // duplicates and chains on another piece

for keypress
	turn()

walk:
	north | (y : 1):
		coords.y++

	south | (y : -1):
		coords.y--

	east | (x : 1):
		coords.x++

	west | (x : -1):
		coords.x--

turn:
	left:
		walk(north -> east -> south -> west)
		moveState.current.change(x -> )

	right:
		walk(north -> west -> south -> east)


for timestep
	moveState.next() // duplicates and chains on another piece

for keypresses.with("a")
	moveState.use(turn.left).next()
for keypresses.with("d")
	moveState.use(turn.right).next()

north: (y : 1), south: (y : -1), east: (x : 1), west: (x : -1)

walk:
	north: coords.y++
	south: coords.y--
	east: coords.x++
	west: coords.x--

turn:
	left:
		walk(north -> east -> south -> west -> north) // creates a state machine

	right:
		walk(north -> west -> south -> east -> north)
''
```

### Chaining and Linear Paths

* state machines can be built up using linear paths
* for example, if we had a vending machine state machine
	* waits for selection, then waits for cash, then dispenses drink and change, then returns to waiting for cash
	* when waiting for cash, if waits for too long, timeout, dispense change and goes back to waiting for selection
* standard way would be to use a graph construction:

```js
// for each state, define possible next states
awaitSelection: { awaitCash }
awaitCash: { dispenseDrink, timeOut }
dispenseDrink: { awaitSelection }
timeOut: { awaitSelection }
_
```

* alternative method using linear paths:

```js
mainPath: awaitSelection -> awaitCash -> dispenseDrink -> awaitSelection
timeOutPath: awaitCash -> timeOut -> awaitSelection
```

* note that linear "chaining" syntax is also used in:
	1. ordered arrays: `[a, b, c, d]`
	2. conditionals: `if -> elseIf -> elseIf -> else`

* objects in Arcana are unordered
* there should be some sort of common chaining syntax for ordered structures and flows

```js
// exploring different chaining syntaxes
myModule:
	prop1: 10
	prop2: "hi"

	// one way of defining a conditional using an array
	myConditional: [
		firstCond: ...
		secondCond: ...
		else: ...
	]

	// being forced to write conditionals in a separate block is ugly though
	// (especially because each condition creates a new block as well)
	// conditionals should be inline, defined at base level
	if (x): ...
	else if (y): ...
	else (z): ...

	// inline state machine?
	startState: ...
	then nextState (condition): ...
	then finalState (condition): ...

	// inline array? is this necessary?
	arrayItem1
	, arrayItem2
	, arrayItem3
```

### Advanced Useless Machine

* based on [this youtube video](https://www.youtube.com/watch?v=eLtUB8ncEnA)
* noticed that the machine is basically a complicated state machine, with events and actions
* would be a good test for Arcana's event-list and state machine syntax

```
switch.on [
	switched
	(20 seconds later): ???
	???
]

for switch.on:
	switch.turnoff()
```

* event/action based version

```
switch.turnedon:
	if (box.closed):
		box.open()

	switch.turnoff()

(now - switch.turnoff.lastCall.timestamp > 20):
	box.close()
```

* imperative version (complete functionality, using javascript)

```js
lastReset = now() // time of last reset switch

function resetTimer() {
	lastReset = now()
	setTimeout(_ -> 
		if (now() - lastReset >= 20) // if it wasn't reset during the timeout, then close the box
			closebox()
	, 20)
}

// called when switch is turned on
function onswitch(index) {
	if (box.closed)
		openbox()

	closeSwitch(index)
	resetTimer()
}
```

state machine for opening/closing the box:

	box.closed --(switch.on)--> box.open
	box.open --(20 seconds since last switch reset)--> box.closed

perhaps we can use metaprogramming?

```python
# this is the rough overview
@metaprogramming
for switch in switches:
	when switch.opened:
		switch.close()

# this is the detailed version (unfinished...)
switch = simpleUselessMachine.switch (
	close:
)
```

### State Variables and Flag-Watcher Model

doesn't make sense to be able to modify state variables outside current object, eg:

container:
	stateVarA.
	bla:
		when event:
			stateVarA++

because if we transform it to functional style

```js
container:
	bla:
		stateVarA = events.reduce(
			(varA, event) => varA+1
			, 0)
_
```

stateVarA is completely out of scope in the reduction
because then we are modifying a variable out of scope
mm or maybe it can, if `container` passes in `stateVarA` into `bla`
but then what if we had multiple event listeners, just like in the `click` and `keypress` examples earlier
needs to transform both individual `fold`s into a global fold

flag-watcher model, any time we "call" methods of a different object, we are actually using flag-watcher model

state variables have different scoping rules?
	declare state variables in a module
	all submodules can "modify" that state variable
	how it actually works is: all references to that variable are aggregated as transformations, `value` is result of all those transformations
	this would look exactly like javascript lol

but can't we make all variables state variables?
every variables starts with a value
can append "modifiers"
this makes everything even more like javascript

I guess major differences would be
	infinite lists?
	functions and datatypes are same?
	more emphasis on symbol properties
	all local variables are visible
	dynamically calculated inputs

### Syntax and Mechanics Brainstorm

note that I'm using Nylo syntax for now
	* more specifically, no more braces `{}` around every object, implied by indentation (like python)
	* `->` for return statements

```js
test:
	0: "hello"
	1: "world"

sum:
	-> a+b


a b: test...

c: sum(5, 6).value // sum() returns an object, extract the value

```
actually no need to do this

```js
sum:
	-> a+b

c: sum(5, 6) // sum() returns an object, but that's fine
d: sum(c, 10) // the `+ operator inside `sum will pull value out from `sum

// because everything is an object, we don't have to worry about pulling values out manually
// we can also do stuff like this
x: 3(myprop: "hello") // adds a property to the number object

```

hmm thats not exactly right
now if we inspect `c`, we'll see a `sum` object
for example

```js
divide:
	temp: a/b
	-> (quotient: Math.floor(temp), remainder: a%b)

x: divide(100,7); // x will have property temp
```

* though perhaps the right way to do this is

```js
divide:
	temp: a/b
	quotient: Math.floor(temp)
	remainder: a%b

x: divide(100,7);
```

### Numbers and Hidden Properties

* normally we've been saying numbers are stored in the value property
* then, operators like `+` and `/` operate on the value property
* but then what if we do something like this

```js
x:
	tag: "my number"
	value: 3

print(x+10) // should print 13

y: x.value // y is now "3"

print(y+10); // throws error?
```

* now `y` has no `value` property for the `+` operator to act on, so the `+` operator will throw an error
* but that's counterintuitive. After all, `y` stores the "true" value of `3`, shouldn't we be able to do arithmetic with it
* this will always be an issue
* there must be some property that stores the value that the `+` operator uses
* and if we extract that property, now we can't use that value for arithmetic, even though it's the value used in arithmetic

* we need a variable that contains the "concept" of the number 3
* should contain no properties inside, like a symbol
	* could contain properties, as long as they are "meaningless", so programmers don't accidentally try to use them in place of the number itself
	* for example, it could contain the set-theoretic definition 3
* however, we should be able to attach tags to the number
	* note: normally in imperative language you could create a container for the number, and then attach tags to that
	* however, in this language I wanted to make it easy to add tags
	* it should'nt through an error 
	* see the section "Node datatype"

* one way we can achieve this is through hidden properties, aka symbol properties
* that means if we wanted to add tags to a number, we would have to do to this

```js
x:
	tag: "my number"
	(hidden prop): 3 // can't do this because it's hidden

// instead we have to do this
x: 3(tag: "my number")

// we can do this as well, little cleaner
x: 3
x.tag: "my number"
```

* the hidden value used by arithmetic is only visible inside the arithmetic module
* so if you want to do something involving this hidden value, you have to create it inside the arithmetic module scope

```js
arithmeticEdit: arithmetic(
		myedit: 3.__internalValue__ // __internalValue__ is only accessible from inside the arithmetic module
	)

arithmetic.myedit: 3.__internalValue__ // should this be possible?
// doesn't seem like it, because __internalValue__ is not in scope
// however, it's just a different method for extending an object.
// so why should it have different rules?

x: 3.(arithmetic.__internalValue__) // should this be possible?

```

when you want to "return" an object

```js
divide:
	quotient: Math.floor(a/b)
	remainder: a%b
	
//javascript style
function fn() {
	var x = ...;
	var y = ...;

	...

	return divide(x,y);
}


//arcana style
fn: divide(
	x: ...
	y: ...
	...
	a: x // this is actually incorrect, see later example
	b: y
	);
```

looks kinda backwards, because the return type `divide` is at the beginning instead of the end
but this actually might make more sense
you know exactly what type of object `fn` is from the beginning

### Cloning and Argument Scope

when extending, creates a new scope
this way we don't have to worry about overriding original variables
that means we actually have to do something like

```js
fn: divide(
	x: ...
	y: ...
	super.a: x
	super.b: y
	)

// alternative
fn: (
	x: ...
	y: ...
	super(x,y))
```

### Dynamic Return Types and Accessor Pattern

due to this backwards style, how do we do something like:

```js
function (request, age) {
	if (request == "cat")
		return cat(age)
	else
		return dog(age)
}
```

* we don't know the type of the object from the beginning
* this is kinda counter to Arcana principles because the `()` operator should return a clone of the object
* but in this case, the object returned could be a `cat` or a `dog`, there is not one single return type
* we can still emulate this behavior using an accessor

```js
requestedAnimal:
	( // create an anonymous object
		if (request == "cat")
			result: cat(age)
		else
			result: dog(age)
	).result
```

* in order to create a "function" that extracts properties from an object, we have to use an accessor as well

```js
function foo() {
	var x = ...
	var y = ...
	return divide(x,y).remainder
}
var result = foo()

//arcana
foo: divide(
		x: ...
		y: ...
		super(x,y)
	).remainder // accessor at the end...kinda ugles

result: foo();
```

we can use `return` as shorthand for this accessor pattern

```js
requestedAnimal:
	if (request == "cat")
		return cat(age)
	else
		return dog(age)

foo: divide(
		x: ...
		y: ...
		super(x,y)
		return super.remainder
	);
```

* these act like the anonymous un-named outputs mentioned in my OneNote notes and the section "Implicit Outputs"
* Note that Nylo uses the `->` operator instead of `return`, which actually looks a little cleaner imo

* later on, I noticed that return statements actually affect the way scopes work too
	* see section "Calling and the Return/Arrow Operator"
* in a way, the return statement is the first example of metaprogramming syntax

* even later on, I realized that my earlier examples of accessor pattern are wrong
	* see section "The Map Function and the Evolution of Nodes"
* accessor pattern doesn't even work for the `requestedAnimal` example shown above
* you can't do stuff like `map( (item => result: a+b).result )`, because then the `map` function actually clones `result`, not the inner module
* though perhaps what I meant, is that the `map` function pulls out `result`

* even later later on, I realized that it actually does work
	* see section "Functions and Objects - A Unified Theory"
* if you do `map(item => (result: x+10).result)`, it doesn't evaluate the inner expression because it is "incomplete"
* the `.` operator is part of the function
* I was just thinking about it wrong, wasn't accounting for incompleteness

### Clone Scoping - Overriding vs Shadowing

there are two ways of handling scope
we can make it so extending objects allows you to override certain parameters (like calling a function)
	* this is how we've been doing it till now
	* "variable overriding"
we can make it so that extending objects creates a separate scope
	* new properties don't interfere with parent behavior
	* don't have to worry about parent implementation
	* "variable shadowing"

maybe we can use super to override defined variables?
this way we don't have to worry about changing behavior
a lot like inheritance in java/C++
	overriding in subclass doesn't affect parent class
undefined variables are like abstract functions
they automatically override

```js
//javascript style
x = (function() {
	var localVar = 10;

	return function(x) {
		return divide(localVar,x);
	}
})()

//arcana style??
```

### Syntax and Mechanics Brainstorm II

* below is an exploration of different syntaxes and shorthands

```python
a: 10
b: 20

add:
	-> a + b

c: a + b

d: add(a b)

e: add(this) # using current scope as inputs

f: add() # implicitly uses current scope as inputs

g: a.add(b) # uses a as first input, "caller-argument-inversion"
```

* `f` and `g` can't both work
* cuz then `x.foo()` can either mean
	1. calling `x.foo` with current scope as input
	2. calling `foo` with `x` as first argument

### Add-ons and Clone Scope

* in the section "Add-ons" we mentioned how you can import library functions
* and use them to transform objects using the object's scope
* normally, you would have to manually pass in all arguments

```js
fn: ...

myobj:
	a, b, c...
	foo: fn(a b c ...);
```

clone scopes allows you to just do

```js
myobj:
	foo: fn();
```

it is sort of like the javascript apply function

```js
myobj.foo = fn.apply(myobj);
```

* makes sense that, when you clone an object within a scope, it should try to inherit that scope
* it's the same thing as defining it within that scope
* when you define an environment, you should be giving appropriate property names so that sub-modules can easily attach to the environment
* if you didn't want the object to inherit the environment, then clone it outside the environment, and pass it in
* or, if the module has no unbound inputs, then you can clone it inside the environment
* this would be like inserting a premade part into a car assembly
* a module with unbound inputs would be like a car part with dependencies, eg a battery
* when you insert a battery, it should automatically attach to the + and - leads of the car assembly
* wouldn't make sense to leave the battery unattached to anything

* I guess you might want unbound sub-modules if you were creating a library
* but then that library wouldn't have defined properties to begin with, so the sub-modules would have nothing to bind to
* likewise, if you wanted to define a template to use multiple times...
	* for example, within `Car`, defining a `Wheel` template that you can create 4 copies of
	* the `Wheel` template has an unbound `angle` property (used to "turn" the wheel every second)
* just make sure nothing gets unintentionally bound
* IDE can help with this, dynamically showing what is bound and what isn't
* though an IDE can't do this for dynamic properties

* but can the environment change?
* imagine if the car was in a city
* and suddenly, somebody adds a `angle` property to the city
* now the Wheel template inherits it, and so do all the Wheels
* however, because the `Car` is a deeper scope than the `City`, then the `angle` specified from `Car` will override the one in `City`

* all comes down to the idea that cloning an object is the same as redefining it



* what about unnamed inputs
* those will also be affected by dynamic inputs
* except in more inconspicuous way
* 

### Clone Scopes and Dynamic Inputs

* should we can handle dynamic inputs differently?
	* have dynamic inputs declared differently, in a different group
	* that way we can make it so unnamed inputs aren't affected by dynamic inputs
* but cuz of metaprogramming, dynamic inputs should be the same as normal inputs
* a program written by a program should be the same as a program written by a human
* not quite though, programs written by programs don't need unnamed inputs

```js
randomStrings: "cds" "ei" "2idkz" "a" "38sk10" "cat"

mymath:
	for x in randomStrings
		(x): 10 // this would ruin the unbound input a
	divide:
		quotient: Math.floor(a/b)
		remainder: a % b

(q r): divide(100 7); // 100 gets bound to b, 7 is unbound
```

alternatively...

```js
mymath:
	for x in randomStrings
		(x): 10 // this would ruin the unbound input a
	divide: a, b // ensures that they are left unbound
		quotient: Math.floor(a/b)
		remainder: a % b
	power: x, p: 2 // I guess now you could create "unbound" inputs with default values now?
		-> result: 1
		for p
			result *= x
```

### Sum vs Add

* in the section "Syntax and Mechanics Brainstorm II", we noticed that
	`a.add(b)` (caller-argument-inversion) and `add()` (clone scoping) can't both work
* however, I realized that, subconsciously, we call them different things anyways

```js
// notice the difference between sum and add

sum: a + b
Number:
	add: internal_value + b
	...

sum(3 4)
3.add(4)
''
```

* `sum` is an object that has two arguments
* `add` is a function applied to a number, that takes in another number as an argument

### Nylo's Inverse function and classes

* in the readme, Nylo talks about defining backward definitions, like so

```js
double:
	int n: result / 2
	int result: n * 2
	-> result

double(10) = 20
double(result: 18 -> n) = 9
```

* I realized that this is actually more of a use case than part of the language design
* I can achieve pretty much the same thing using my current language rules
* it's basically a base module that has feedback
	* but then you override it, giving one of the properties a set value, and breaking the feedback
	* all the other properties and values resolve appropriately
* though I had never considered using my language like that
* while I knew feedback was useful, I never thought of this specific use case
* very cool

### Dynamic Properties Brainstorm

should tags use `[mytag]`?

```js
StarWars: [fiction], [sci_fi]
```

or maybe symbol properties should use `[mySymbol]: myValue...` syntax?

is a variable number of properties considered a modification?
dynamic properties?
cuz these can change a scope
can cause very difficult to debug errors
can also cause exploitable code


### State Variables and Actions

one rule of state variables that is different from imperative
can't be modified twice in the same scope
also can't be modified where it is defined

```js
foo:
	counter. = 10
	counter++ // not allowed, can't be modified where it is defined
	onKeyPress:
		counter++
		counter+=20 // not allowed, can't be modified twice in the same scope

```

syntax brainstorm:

```js
keycounter: // event listener method
	(all): 0 // all properties start at 0
	onkey:
		(key)++

keycounter2: // event list method
	(all): 0
	keypress: // event template
		key // a single property
	for keypress in keypress.calls
		(keypress.key)++

keyboard1:
	for key in keypresses
		keycounter.onkey(key)
		keycounter2.keypresses.push(keycounter2.keypress(key))

listSum: // recursive
	(mlist.size > 0): mlist.head + listSum(mlist.tail).true
	(else): 0


listSum: // using arrow returns
	(mlist.size > 0): mlist.head + listSum(mlist.tail) ->
	(else): 0 ->
// note that there has to be some special rule here because technically both properties exist,
// but the arrow notation should only choose the one that is "true"

// using reduction
sum: 0
for x in mlist:
	sum++

// using imperative style reduction
reduceFn: total, x
	-> total+x // note that we have to use arrow returns for this style
sum: mlist.reduce(reduceFn, 0, [5 2 7 8 1])

// imperative style reduction without arrow returns?
reduceFn: total, x
	result: total+x // not necessarily, if we know what property reduce() is expecting
sum: mlist.reduce(reduceFn, 0, [5 2 7 8 1]);
```

revisit 1/12/2019:
* notice the `for keypress in keypress.calls` in the syntax brainstorm
* the idea behind this was that it keeps track of all calls/clones of the `keypress` function
* implementation of flag-watcher model
* this is the earliest example I can find of this `.calls` syntax
* this is explored further in the later section "Random Syntax Stuff"
* it becomes relevant in the later section `API Calls`

### Arrow Returns and Intermediate Scopes

* when using an arrow return, the output of the module does not include the body of the module
* the body of the module is like a disembodied intermediate scope

```js
myObj:
	c: a + b
	d: c*10

myObj2:
	c: a + b
	-> c*10

x: myObj(1 2) // actually creates an object of type myObj
x2: myObj2(1 2) // creates a number

myObj3: Number( // a different way of declaring myObj2, without arrow returns
			c*10
			c: a + b);
```

* as seen from `myObj3`, arrow returns are like a way to create a sort of intermediate scope for the actual return type
* in `myObj` and `myObj3`, this scope is accessible from the result, but in `myObj2` this intermediate scope is invisible

* note that this is just one way of thinking about arrow returns
* another way is just shorthand for the accessor pattern, discussed earlier

.........

* actually, there is another big difference between using arrow returns, and declaring the output object at the top (like in `myObj3`)
* see the sections "Scopes and Variable Shadowing" and "Cloning and Overriding"

### String Properties

* normally when we access properties using the dot accessor, like `myObj.myProp`, we are accessing the property outside of the scope it was declared in
* that means that it can't be a local property, otherwise we wouldn't be able to access it
* the dot accessor is used for properties that can be accessed globally
* thus, the property name has to be part of the global scope
* thus, it makes sense for the dot property to be shorthand for string-keyed properties, eg `myObj["myProp"]`
	* javascript already does this
* because strings can be thought of as global scope symbols
* if you want to use local properties, you have to use the bracket accessor: `myObj[mysymbol]`
* another example:

```js
math:
	internal_value // should I distinguish this from an unbound variable?
	+ : // defining the `+` operator
		Number(a[internal_value] + b[internal_value]);
```

* symbols have to be non-valued, doesn't make sense for them to have a value
* symbols act as a global unique value, so they shouldn't have a value themself
* though you might want to give them tags? subproperties?

### Objects as Property Keys

any object can be a property key
just like in java
? does this make sense intuitively? what would the graph look like? what does this mean in real life?
because any object can be a key, empty objects, aka symbols, also can be a key

doesn't interfere with normal keys, because when you do `foo = "hello", bar = "hello"`, `foo` and `bar` point to the same thing
they don't create duplicate objects like in other languages
even if you did `foo = "hello"()`, because you aren't overriding any properties, it knows to point to the original
	hmm could this create issues
if you did `foo = "hello"(x: 10)`, now it is a different key


what if I do `foo: [1 2], bar: [1 2]`, are `foo` and `bar` the same key?
I think they should be, because they are the same value
but what if foo and bar just happen to be the same value
this is why it's weird to use objects as keys

variables represent concepts
properties are concepts
for the "color" property of a "car", "color" is a concept
however, sometimes variables are a switch that points to a concept
`myAnimal: input > 0 ? cat : dog`
`myAnimal` is either `cat` or `dog`


maybe the concept of values
default value is object reference itself
just like java 

### Objects as Property Keys II

not a question of whether or not objects _can_ be property keys
we can restrict property keys to numbers if we want, force all keys to be represented by a unique number
but it makes sense to have strings as property keys because we often give properties a name


java has objects as keys when it wants to create mappings between objects and values

for a car, you might have a property "number of wheels"
but this property has parts to it, "wheels" and "number of ___"
you could have other properties like "number of doors", "number of windows", all with the same structure
you could also have "color of wheels" and "size of wheels"
so it kind of makes sense to make the key something like ["number of __", "wheels"]
it's like a structured query
though maybe it should be more like
	car:
		wheels:
			quantity
			color
			size

objects represent structure
so if you have want a key with structure, like a structured query, then you should use an object as a key
structures are also commonly the result of generating information
so if you want to generate a bunch of keys, instead of hardcoding them like "color" and "model" and "size", then you would want to use objects as keys
but could you use the alternative structure shown earlier?



use {} to create objects
that way you can create symbols like `x: {}` and they won't be unbound
also allows inline object creation: `x: {a: 3, b: 2}`


### Feedback in Functional Paradigms

* is it possible to represent cyclical data structures in pure functional paradigms?

is this:

	foo:
		bar: 10
		-> foo.bar

the same as:

	foo:
		bar: 10
		result: foo.bar

	foo.result => ??


pseudo-feedback?
we can turn this:

	sumParity:
		start: even
		even:
			0: even
			1: odd
		odd:
			0: odd
			1: even

	sumParity.start[0][1][1][0][1] = odd // sums all inputs, and returns the parity

into this:

	sumParity:
		"start": "even"
		"even":
			0: "even"
			1: "odd"
		"odd":
			0: "odd"
			1: "even"

	sumParity[ sumParity[ sumParity["start"] ][0] ][1] = even

now there is no feedback
still kinda pseudo feedback because technically the strings point to the next string
but because strings are values, not references, there is no referential feedback

is this always possible?
is this practical?
here's an example with doubly-linked-lists, using symbols in the second example instead of strings

	doubly:
		a, start:
			next: b
			prev: last
		b:
			next: c
			prev: a
		c, last:
			next: start
			prev: b

	doubly.start.next.next.prev

	a, b, c, start, last // symbols
	doubly2:
		(a, start):
			next: b
			prev: last
		(b):
			next: c
			prev: a
		(c, last):
			next: start
			prev: b

	doubly2[doubly2[doubly2[doubly2["start"].next].next].prev]

* notice that the second method forces properties to be public
* in the first method, you can only access each node through `next` and `prev`
* but in second method, you can access them directly, through their property names like `double2["b"]`

* instead of making a later node refer to a previous node, we create a public node and have both the later and previous node point to it

### Pure Functional Data Structures

see the file `PureFunctionalDataStructures.js`

notice that in functional, the dot accessor `.` basically turns into global functions, eg `mapGet`
that explains the difference between imperative-style syntax and pure functional
so it is possible to create cyclical data structures in pure functional, it just looks very different

the data structure itself is a map, storing the edges of the graph
the "cyclical" part, is deferred to the traversal, which makes the `mapGet` calls
but it actually isn't cyclical, because the traversal uses recursion instead of feedback


```js
x: x+1

add: {a, b}
	value: aVal + bVal
multiply: {a, b}
	value: aVal * bVal

scope:
	'x': add('x', 1)
	'y': multiply('x', 'y')

evaluate:
	for prop in scope
		for args in scope
			(arg is String):
				...

hmm... this is incomplete
```





```js
foo:
	x: 10
	bar:
		x: x+10 // new value should be 20? or is that too confusing

```

### Conditionals Syntax Brainstorm

	(first cond) name:
	else (second cond) name:
	else (third cond) name:
	else name:

	(first cond)
	, (second cond)
	, (third cond)
	, else:

	(first cond):
	or (second cond):
	or (third cond):
	or:

	[ (first cond):
		a
	, (second cond):
		b
	, (third cond):
		c
	]

	(first state):
	then (second state):
	then (third state):


### Symbol Properties - Syntax Brainstorm

```js
coffee:
	size
	small, medium, large // sizes
	capacityOptions:
		(small): 10
		(medium): 40
		(large): 90
	capacity: capacityOptions[size]

coffee(size: small); // here, small is a symbol
```

```js
coffee:
	size
	small, medium, large // sizes
	capacity:
		(size = small): -> 10
		(size = medium): -> 40
		(size = large): -> 90

coffee(size: small); // here, small is a symbol
```

```js
coffee:
	capacity:
		(small): -> 10
		(medium): -> 40
		(large): -> 90

coffee(small: true); // here, small is a boolean
// we also don't have the size property anymore
// though the size property is rather useless because symbols don't mean much outside the scope
```

note that in the earlier example, maybe we don't even need to declare the symbols
they are unbound variables, so they are implicitly symbols
declaring them just ensures that they won't be bound to outer scopes

```js
coffee:
	capacity:
		(size = small): -> 10
		(size = medium): -> 40
		(size = large): -> 90

coffee(size: small); // here, small is unbound, so it is implicitly a symbol
```

so how does scoping work for these unbound variables?
how will an interpreter know to "connect" two unbound variables of the same name?
note that if you're not careful, two unbound variables will be in different scopes

```js
foo:
	small, medium, large
```

### Global Symbols?

* this is a revisit of the ideas in the section "String Properties"

what if we made the default property name symbols instead of strings
and we made it so all symbols "exist" in the global namespace
that is why you can define a property and then access it from outside

```js
foo:
	bar: 10 // foo and bar are global symbols

```

you can overshadow these global symbols with local symbols

```js
coffee:
	small, medium, large // sizes
	capacityOptions:
		small: 10
		medium: 40
		large: 90

```

this way you don't need parenthesis around symbols
when you print symbols (or objects), by default they print the variable name
so functionally, it works the same as before, when global properties were strings
only difference is now we don't need parenthesis for symbol properties

hmm, but notice in the previous example, `capacityOptions` is a local symbol, just like `small`, `medium`, and `large`
so now you can't reference `coffee.capacityOptions`
or maybe we can make it so `capacityOptions` is both referencing a global symbol, and defining a new one?

```js
coffee:
	// we substitute symbols with unique id's. functionally the same
	small: 124321543, medium: 4321582, large: 3891415994 // sizes 
	capacityOptions:
		small: 10
		medium: 40
		large: 90
		foo:
			small: 'bar' // which `small` does this refer too?

```

if I want to be able to refer to `coffee.capacityOptions.foo.small`, all of those must be global properties
symbol properties work more like `coffee.capacityOptions[coffee.small]`

the default way we define properties cannot be the same way we define local properties, because the default should be global properties
thus, we have to use parenthesis for local properties
or we can make it so explicitely defined symbols become the default for the namespace

```js
coffee:
	(small, medium, large): Symbol()
	capacityOptions:
		small: 10, medium: 40, large: 90 // symbol properties

```

### Dynamic Properties and Merging Brainstorm

```js
(a, b): 10

// could either be

a: 10
b: 10

// or

(a or b): 10 // resolves to `true: 10` or `false: 10` depending on what `a or b` is

```


```js
(a or b):
	x: 10
else:
	x: 20

(c and d):
	y: 'hello'
else:
	y: 'world'
```

problem with this is now there are two `true` and `false` properties at the same time
this will give an `overdefined` error

we can maybe treat `true` and `false` as special properties, merging all instances
perhaps I should do the same for dynamic properties?
but then how far deep should it merge?

```js
foo:
	bar:
		zed: 10
foo:
	bar:
		zed:
			test: 10
```

why did we even want the `overdefined` property in the first place?
prevents feedback?

makes sense for arrays:

```js
list:
	0: 'a'
list:
	1: 'b'
```

should we make it so conflicting values cause `overdefined`, but defining new properties just merges them in?


what about

```js
myObject: 10 // myObject is a number with a tag
	myTag: 'test'
```

```js
foo:
	point1, point2
	x: point1.x - point2.x
	y: point1.y - point2.y
	-> Math.sqrt(x*x + y*y)

// how does this compare to

foo: Math.sqrt(x*x + y*y)
	point1, point2
	x: point1.x - point2.x
	y: point1.y - point2.y
```

```js
foo: sum() // a different way of overriding properties 
	a: 10
	b: 20

// note that this is different from
foo: -> sum()
	a: 10
	b: 20
// because in this case, sum() will only inherit a and b if they are unbound
// also, a and b are not part of sum() anymore
```

```js
foo:
	a: 10
	y: sum(
		// inherits a: 10
		b: 20)

foo.y.a = 10 // should this be possible?

// on one hand, if we treat them like javascript prototypal inheritance
Person:
	age, name

Student: Person(
	occupation: student
	age: young
	)

Student.properties = {age, name, occupation}

//on the other hand, this could get messy
//there are many cases where we don't want to give all parent scopes when listing object properties
// maybe we should have different accessors

Student.allProperties = {age, name, occupation}
Student.properties = {age, occupation}



// should inheritance be equivalent to
Person:
	age, name
	Student:
		occupation: student
		age: young // not the same though, this overshadows `age`, doesn't override it

```

### Implied Parenthesis

```js
Student: Person(
	occupation: student
	age: young
	)

// you can take out the parenthesis.
// parenthesis are implied by subsequent properties

Student: Person
	occupation: student
	age: young

// also works for things like

myObject: 10 // myObject is a number with a tag
	myTag: 'test'

// use parenthesis for single-line extension

myObject: 10(myTag: 'test')

// also if you want to inherit from the scope

a: 10
b: 20
foo: sum();
```

* one of the reasons this works in the first place is because,
* normally we would be worried about ambiguity in cases like this:

```js
foo: bar // is foo a clone of bar, or a reference to bar?

```

* however, this is only a problem in imperative languages
* in dataflow languages, if no modifications or additions are made to an object, then there is no reason to clone it
* this style makes inheritance look a lot better, without the extraneous parenthesis

* it also kinda makes sense for new objects, like

```js
foo:
	bar: 10
```

* because there is no parent object, it is like we are extending a blank object, and adding properties to it

### Implied Parenthesis II

by this logic, it naturally follows that inline objects should be defined through parenthesis, instead of `{}` braces like previously thought
* `Person(a: 10)` extends `Person`, so `(a: 10)` extends the blank slate

```js
foo: (a: 10, b: 20) // object
bar: 10+20 // number
zed: (a, b, 10); // commas imply multiple properties, which means it is an object
```

however, what if we have this:

```js
foo: (bar); // is this a set with a single object, or is it a expression evaluating to bar?
```

perhaps we only need to use `{}` notation for sets, but objects can be inferred based on the presence of `:` inside parenthesis?

or maybe we can treat singleton sets, like `(1 + 2) = (3)` the same as objects, `(3) = 3`

note that it seems like the only conflict we really have is between objects and expressions
perhaps we should use `{}` for objects, and `()` for expressions

```js
(1 + 2) = 3
{1 + 2} = {3}
Student: Person{ age: young }
mySet: {a b c};
```

### Clone Scopes - Scope Wrapping Issues

clone scoping doesn't quite make sense
because you have your original context
and now when you clone it, you are wrapping original context with new context

```js
context1:
	fn1: ...
;
context2:
	fn2: context1.fn1()
;
// fn2 scope looks like
context2 {
	context1 {
		fn1{ fn2 }
	}
}
''
```

the inheritance chain for the scope of fn2 is like:

	context2 ---> context1 ---> fn1 ---> fn2

however, what if you clone it in a third context

```js
context3:
	fn3: context1.fn1()
;
```

now the chain becomes

	context2 --.                          ,--> fn2
	            >--> context1 ---> fn1 --<
	context3 --'                          '--> fn3

now the original context is being wrapped by two conflicting contexts

another problem with scope wrapping is that context1 should not be affected by context2
but if we simply wrap context2 around context1, it's possible that context1 variables will get bound to context2

### Spread Operator Brainstorm

```js
division:
	quotient: Math.floor(numerator/denominator)
	remainder: numerator % denominator

divisionByClosestPrime: 
	prime: closestPrime(input)
	...: division(input, prime)

divisionByClosestPrime: // note: in this version, `prime` is not in the returned object
	prime: closestPrime(input)
	-> division(input, prime)

divisionByClosestPrime: division(
	prime: closestPrime(input)
	input, prime // are these unnamed inputs or bare declarations
	)

// spread operator is more useful in mixins

SymmetricDivision:
	...: division(a, b)
	...+'reversed': division(b, a)
;
```

### Syntax and Mechanics Brainstorm III

* implicit inputs allow us to use really short syntax

```js
// javascript style
list.map(a => a + 1) // we have to create a function with one argument

// arcana style
list.map(a+1) // because a is unbound, it is implicitely the first argument

list.map(a -> a+1) // this actually still works, and is equivalent to:
list.map( // this is the standard transformation syntax
	a
	-> a + 1
	)
;
```


```js
// how do we convert property names
sparseArray:
	x -> nextNumber: _
```



does `return` or `->` break encapsulation?
I already mentioned earlier that they are syntactic sugar for a post-applied accessor

```js
x: { foo: 10, -> foo*2 }

// is equivalent to

temp { foo: 10, result: foo*2 }
x: temp.result

```

even `map` and `reduce` can be expanded to this pattern, by designating a property for extraction

```js
squares: list.map(x -> x*x)
map: fn -> for item in list, fn(item)

// is equivalent to

squares: list.map(x, result: x*x)
map: for n in list
	n: obj(n).result

// or better yet
squares: list.map({x, result: x*x}.result);
```

so basically `->` creates a temporary anonymous object, and accesses a designated property



if we have some default object base properties, like

	clone
	addProperty
	removeProperty
	setProperty

and such, how do we prevent these from showing up in `allProperties`?
if we're creating subclasses and object instances and such, we don't want these showing up during property enumeration

### Cloning Objects with a Different Scope, Applying Scopes

* should we be able to clone an object using a different scope for binding?
* kind of like the javascript `apply` function

* recall that the way encapsulation works, modules only have control over their internals
* no control over externals
* however, viewing the internals of other modules does not violate encapsulation, and is easy because all information (aside from symbol properties) is public

* cloning an object in a different scope can be thought of in two ways:
	1. creating an object in the other scope, which is modifying an external scope, which violates encapsulation
	2. viewing and binding variables from the other scope, which doesn't modify the external scope, and doesn't violate encapsulation
* ultimately, the object doesn't exist in the external scope, so (2) is more correct

* so now the question is, does it overcomplicate things?
* is it useful?

### Clone Scopes - Diabetic Example

* so in 6/9/2018, in my conversation with veggero, I was discussing my idea about how cloning inherits the scope around it
* this was previously discussed in the section "Scope and Implicit Arguments"
* I thought it was a great example of the benefits of 
* here is the relevant snippet of the message:

-------------------- BEGIN SNIPPET --------------------

Basically, the idea is that whenever you "call" a module, like `sum(a: 3, b: 4)`, you are actually creating a clone of the module, with certain variables overridden. I was thinking that, because you are making a clone of the module, it is almost like you are redefining it. So it should have the same scoping rules as when you normally define a module. For example, if you had something like this:

```js
coffee:
	sugar: (diabetic? 0 : 10) //`diabetic` is unbound

candy:
	sweetener: (diabetic? "artificial" : "sugar") // `diabetic` is unbound

Joe: // a person
	diabetic: true
	drink: coffee() // automatically binds `diabetic`
	snack: candy() // likewise
;
```

notice that `coffee()` and `candy()` automatically bind `diabetic`, almost as if they were defined inside `Joe`, like this:

```js
Joe:
	diabetic: true
	drink:
		sugar: (diabetic? 0 : 10)
	snack:
		sweetener: (diabetic? "artificial" : "sugar")
;
```

So I hope you can see how this can simplify coding a bit, with some added "implicit binding". However, I can think of cases where it can get a little messy. It makes variables names very important. For example, if you just started using random letters as property names, like `myClass: { a: 10, b: 4, c: "hello world" }`, then it can be easy for modules to latch onto those variables. My reasoning is this: (1) variables should be named appropriately (2) if you want to prevent any binding, just create the clone outside the scope, and then bring it in, like so

```js
JoeDrink: coffee() //`diabetic` remains unbound

Joe:
    diabetic: true
    drink: JoeDrink
```

If you instead create a clone inside the scope, like we did before, then it makes sense for that module to be affected by the scope.

-------------------- END SNIPPET --------------------

* what's also interesting is veggero talked about how his cloning worked similarly (though there were some slight differences)
* even though I can't find any example of any other language using "call scope" or "caller scope" (aside from possibly [L Language?](http://home.cc.gatech.edu/tony/uploads/61/Lpaper.htm#Semantics))
* both veggero and I came up with such similar ideas independently

### Default Values

* often times in imperative we have a pattern like this

```js
// returns true if the list contains any prime numbers
for (item in list):
	if ( isPrime(item) ):
		return true
return false
```

* but if we try to do something similar in arcana

```js
// returns true if the list contains any prime numbers
for list: {item}
	if ( isPrime(item) ):
		-> true
-> false
```

* we will get `overdefined` whenever there are any primes, because both `true` and `false` will be returned
* because arcana doesn't have execution order

* we can have a special operator `-->` which is like a catch-all

* perhaps we can define it as a condition that also gets triggered if the condition is overdefined
* something like `<condition> --> <value>` is equal to `if <condition> or overdefined, return <value`
* but then what if we have multiple `-->` operators, creates a contradiction
* also if the `-->` operator is forcing the return value to be a certain value, then there isn't really overdefinition anymore...
	* unless we think about `-->` as a post-process step
* also, how does this work for conditional blocks?

```js
(x is prime):
	a: 10
	foo: 30
(x is odd):
	a: 5
	bar: 10
-->:
	a: -1

// for odd prime numbers, it looks like
a: -1
```

notice that for odd prime numbers, `a` is overdefined, but `foo` and `bar` aren't
so the only way `-->` makes sense is if conditional modules are like regular properties

```js
if (x is prime):
	a: 10
	foo: 30
if (x is odd):
	a: 5
	bar: 10
-->:
	a: -1

// for even prime numbers, it looks like:
a: 10
foo: 30

// for odd non-prime numbers, it looks like:
a: 5
bar: 10

// for odd prime numbesr, it looks like:
a: overdefined
foo: 30
bar: 10

// because `
```

### Using vs Cloning

* veggero mentioned on 6/12 that he rebinds every single time so `x: foo` and `x: foo()` are the same thing
* basically, every time you use a module, you clone it
* note that we already (kinda) agreed upon clone scoping at this point
* would you ever just use an unbound function? without cloning it?
* what if you had something like

```js
people: Bob, John

Bob: Person
	money: 1000
	hasCar: true // an exclusive tag for people with cars
	friends: people.filter(hasCar) // Bob will only be friends with people with cars

John: Person
	money: 1
```

* but now when `people.with(hasCar)` reads John, it will bind `hasCar` to true
* however, notice that if we had it based on money it would work fine
* implies that we could fix the `hasCar` issue by just giving a default value:
	
```js
Person:
	hasCar: false // now John will inherit this, and it won't be accidentally bound in Bob.friends

```

notice that if we create every time, then we would be binding inside the `filter` function as well

```js
list:
	filter: 
		outputList: 
			for item in list:
				if (condition(item)): -> item // this creates a new item
		outputList: [item in list && condition(item)]
```

now we have to worry about the implementation of `list`
any meta-function used purely for rearranging and 

however, this is only a problem if we factor in clone scopes
if `item()` doesn't inherit the scope around it, then we don't have to worry about unintentional bindings
though if that were the case, then there would also be no point in cloning it in the first place, because the clone would be identical
so it still wouldn't make sense for `clone` to be the same as `clone()`


### Singleton Sets

* this was first mentioned in the section "Implied Parenthesis"

* should singleton sets, like `{3}`, be treated the same as the object itself, `3`?
* that would mean every object is a singleton set as well

* benefits:
	* if we treat singleton sets, like `(1 + 2) = (3)` the same as objects, `(3) = 3`, then we can use parenthesis for sets
	* we can use the `with` function on single objects, outputs `undefined` if conditions don't match, adds tags if all conditions match
* issues:
	* now we can't use sets to represent structure, because we can't represent arbitrary structures, like `{x}` vs `{{{{x}}}}`

* more discussion in the section "Singleton Sets II"

### Imperative vs Functional II 

* in functional, everything is backwards, so there is actually no need for bindings, because the order of execution is static
* this is why Nylo seems to have no concept of bindings (at least, from what I've seen of the interpreter)
* but once you have stuff like forward evaluation or persistent changing inputs, then you need bindings
* this makes dataflow different from functional

* also, maybe state variables make more sense to have now, because it allows each nodes to have persistant, dynamic outputs
* allows each node to maintain state

--------------------

1. Forward execution
2. State variables
3. Execution order
4. Impure functions

* all these things are related
* once I introduce one, I introduce all of them

### Type Checking and Assertions

* this is based on an old idea of mine but I can't really find it, so I'll just re-iterate everything here
* essentially, while types are dynamic, we can still have type checking to ensure the right parameters are being passed into a function
* they sort of work more like assertions

```js
// java style
function add(int a, int b) {
	return a+b;
}

//arcana style
add: 
	a: of Number
	b: of Number
	-> a+b

x: add(10, 3)

// this is equivalent to:

add:
	a: a_arg.with(is Number)
	b: b_arg.with(is Number)
	-> a+b

x: add(a_arg: 10, b_arg: 3)

//alt style
add.with(a is Number, b is Number):
	
```

### Cloning and Overriding

* "calling" a module clones it, and overrides specified properties
* we already mentioned this much earlier, called it "extending"

```js
add: 
	a, b
	return a+b

x: add(a: 10, b: 20); // overrides `a` and `b`
```

* we can also add properties when cloning

```js
foo: (a, b)
bar: foo(a: 10)
zed: bar(x: 'hi')

zed = (a: 10, b, x: 'hi');
```

### Cloning Unbound Variables

* what if we has something like this:

```js
foo:
	-> bar(10, 20)

zed: foo(bar: a+b);
```

* technically this should work, `bar` is an input (that happens to be a module), we are just leaving out the input declaration
* `bar` is an unbound variable, like a symbol, with unbound values
* is `a` and `b` considered unbound variables of `bar`, or unbound variables of `zed`?

* shows that unbound variables and symbols are kind of like shorthand for declaring empty objects
	* this was touched upon in the section "Objects as Property Keys?"


### Scopes and Variable Shadowing

* when reusing a property name in an inner scope, it shadows the outer property

```js
foo:
	x: 10
	y: x*x
	bar:
		x: 20

foo.y = 100 // the outer `x` is unaffected by the inner one
``
```

* cloning overrides variables, and does not shadow them

```js
foo:
	x: 10
	y: x*x

bar: foo(x: 20)

bar.y = 400 // `x` was overriden

zed: foo
	x: 20 // as mentioned earlier, this is implied parenthesis, so it should override
	// but perhaps we can make it shadow instead?

```

hmmmmmmm..................

```js
foo1: a+b
	a: 10
	b: 20

foo2: => a+b // does this imply parenthesis too? then that would make it virtually the same as foo1
	a: 10
	b: 20

// these^^^ will probably be very easily confused...

foo3:
	a: 10
	b: 20
	=> a+b
	
foo4:
	a+b: // is this a singleton set?
		a: 10
		b: 20


sets:
	a: 10 // key is a string
	b, // then this key must be a string too...not a symbol
;
```
### Scopes, Shadowing, and Overriding

* note: these are trascribed from the notes I wrote on the chalkboard on 6/16/18
* I should probably make a OneNote doc of these...

Exploring currying:

```js
foo: a+b
bar: foo(a, 10)
zed: bar(20);

// scope visualization:
zed {
	a: 20
	bar {
		b: 10
		foo { a + b }
	}
};
```

Exploring shadowing vs overriding:

```js
outer:
	z: 7
	zz: z*z
	middle:
		x: 10
		y: x*x
		inner:
			x: 3

foo: outer.middle(x: 3)
bar: foo(y: z*x) // overrides middle's y
zed: bar(z: -1) // shadows outer's z

//results:
outer.middle.inner.y = 100 ; foo.y = 9 ; bar.y = 21 ; zed.y = -3
bar.zz = 49 ; zed.zz = 49
```

* notice that `bar.z` and `zed.z` are different, but `bar.zz` and `zed.zz` are the same
* `zed.zz` uses `z`, but not `zed.z`
* `zed.zz` uses `outer.z`, which has been shadowed (but not overriden) by `zed.z`

* scope visualization below (note: arrows indicate cloning)

```
outer {
	zz: z*z
	z: 7
	middle {
		x: 10
		y: x*x
		inner { x: 3 }
	} --.
}       |
        v
 foo { x: 3 } --> bar { y: z*x } --> zed { z: -1 }
```

* notice that overriding follows the arrows, because the arrows represent cloning

Exploring overriding vs arrow returns:

```js
// overriding:
foo: a+b // note: implicit parenthesis
	a: 3
	b: 5

// which is equivalent to:
foo: sum(a,b)( a: 3, b: 5 )

// scope visualization:
sum { } ---> { a b } ---> { a: 3, b: 5 }
```

```js
// arrow returns
foo:
	a: 3
	b: 5
	=> a+b

// which is equivalent to
foo: (a: 3, b: 5, result: sum(a,b)).result // note: accessor pattern

// scope visualization:
        {  // note: anonymous scope
            a: 3
            b: 5
sum{ } ---> result { a, b }
        }
;
```

Exploring dynamic binds and cloning

```js
foo: cond ? a : b

// which is kinda equivalent to

foo: (true: a, false: b)[cond] // demux pattern

foo(a: 10) = ___
```

* notice that `foo` is an object, either `a` or `b`
* so technically, if we clone `foo`, it should either clone `a` or `b`
* but doesn't it make more sense to modify the "function body" of `foo`, in this case the conditional?
* or maybe not...

### Anonymous Outputs and Cloning

* after seeing some of Nylo's examples, I started thinking about how calling works with anonymous outputs and return statements

* the return/arrow property, as noticed previously, is basically like creating and accessing a specified property
* `add: (a: 10, b: 20 -> a+b)` is equivalent to `add: (a: 10, b: 20, result: a+b).result)`
* thus, it makes sense that it can be overriden as well

```js
add: a+b
multiply: add(-> a*b)

// basically the same as doing:

multiply2: add(result: a*b).result
```

wait but is

```js
add: a+b
multiply: add(-> a*b)
// is this different from
add2: -> a+b
multiply2: add(-> a*b);
// in the first case, `add` is a number, and you are overriding the output of that number,
// which doesn't even have the variables `a` and `b`.
// The second case, add2 is an object, and you are 
// so it really comes down to how you are treating the arrow operator
// is the outer object an object with -> as a property, or is it the object returned by ->
```

* maybe calling should work a little different for return statements

```js
foo:
	a: 10, b: 20
	-> sum(a, b)

bar: foo(a: 7)

foo = 30
bar = 27
```

* notice that even though the return value of `foo` is a number (30, in this case), extending foo overrides the intermediate module

* we can also override the return value, overriding the `->` operator like any other object property
* this allows us to access variables in the intermediate scope, something I thought we couldn't do before

```js
foo:
	a: 10, b: 20
	-> sum(a, b)

fooA: foo(-> a); // extract the `a` value from foo's intermediate scope
```

### Transformations vs Objects

when we look back at my diagramatical syntax, we didn't need "arrows" or "return" statements
we did have default outputs
modules that use arrow arguments are more like processes or transformations
	they contain an intermediate process
	they define an output object
	the process itself is not included in the output

two ways of viewing transformations (modules with return statements)
	transformations are a special kind of module, shorthand for accessor pattern, that specifies a default output property
	regular modules are a special kind of transformation, whose output is the module itself

a third way is talked about in the later section "Duality of Unbound Symbols and Anonymous Properties"
	* default outputs are just anonymous outputs, kinda like hanging values
	* what's special is that modules with anonymous outputs, the output is the returned value, not the module itself

how should transformations be affected by the property accessor?
	* if we view transformations as just accessor pattern, then it should just access properties of the returned output
	* but if calling transformations overrides the intermediate scope, should property access go to the intermediate scope as well?
	* though actually, we can access the intermediate scope by overriding the return statement

### Default Values II

now we can't have default values for modules, because they get in the way of unbound variables

```js
foo:
	a, b
	=> a+b

foo(10,7) = 17

foo2:
	a: 30, b // if I give `a` a default value of 30, now `b` will be the first (and only) unbound variable
	=> a+b

foo2(10,7) = 30 // first argument gets bound to `b`, and second argument gets ignored
// note that I could have also made the second argument wrap around and bind to the first bound variable, `a`
// but that doesn't change the fact that the order of arguments has changed

```

### Singleton Sets II

* single sets could also be useful by allowing us to get rid of the arrow operator
* just use set/tuple values as default outputs

```js
myset:
	a, b, c // all treated as set/tuple values

foo:
	a: 10
	b: 20
	a+b // this has no key, so it's treated as a set/tuple value

foo = 30 // foo is a singleton set with properties (a+b, a: 10, b: 20)

// this can be extended elegantly to multiple outputs

bar:
	a: 10
	b: 20
	a+b
	a*b

(p, q): bar // bar is a tuple with 2 values and 2 properties

// though treating set values as outputs is not always intuitive

zed:
	a, b
	x: a*a
	y: b*b
	x+y

zed != 30 // zed is a tuple with 3 values {a, b, x+y} and 2 properties {x, y}

```

* note that this could easily be done by using arrow notation and tuples

```js
(p, q): bar(=> a+b, a*b);
```

* using set values as outputs also sort of makes sense, because we already use them as such for implicit input binding

```js
zed2: zed(3, 4); // binds 
```

### Unbound Keys vs Values

* I have been switching between lvalues and rvalues (aka property keys and values)
* sometimes it was ambiguous whether or not I was treating a symbol as a key or a value
* so I had a lot of ambiguous situations:

```js
a: 10
foo:
	a,b // is `a` a symbol or a set value?

bar: (a,b) // same thing here

baz: foo(a, b, => a+b) // are `a` and `b` input values for foo()? or defining new symbols? 
// is the arrow overriding foo's anonymous output? or is (a, b, => a+b) an object itself, calling foo with the result of => a+b

set1: {a, b} // even these two sets are ambiguous. In this set, makes the most sense that `a` and `b` are symbols
set2: {10, 20} // but in this set, makes the most sense that 10 and 20 are values
;
```

* this ambiguity was easily cleared up in my diagram-based syntax
	* property keys were written next to arrows, like labels
	* property values were written at the beginning/ends of arrows
* (though going through my notes, I noticed that I still mixed them up sometimes)
* with text-based syntax, it's a little harder though
* I could use the return/arrow syntax to specify values, and assume symbols otherwise

```js
sum:
	a, b // input symbols/keys
	foo: "hello world" // properties
	=> a+b // output values
;
```

* but so far I haven't been too careful with differentiating the two
* these mix-ups occured because I was using scopes and "bound" vs "unbound" to determine when to treat things as symbols vs values
* and I was also treating them differently based on whether the object was a set or a module

```js
a: 10
foo:
	result: a+b // `a` is bound, so it's treated as a value. `b` is unbound, so it's a symbol

// I also had this special rule, where single symbols are automatically treated as unbound symbols

bar:
	a, b // forces `a` to be an unbound symbol
	result: a+b

// however, I forgot that sets/tuples were defined in the same way

x: 10, y: 20
zed:
	a, x, y // zed is a set with three values: a, x, and y. How would I specify if I wanted `a` to be an unbound symbol?

// so should single symbols be treated as keys or values?
```

* also, this dynamic evaluation of symbol vs value, can lead to unintuitive results

```js
(key_input): 10
foo: a, b // imagine if the `a` key is pressed. Now `a` is bound. Should foo become (10, b) or (a: 10, b)?

```

so how should I distinguish between unbound keys and hanging values?

**REVISIT (9/26/2018)**

* actually, I think my old examples work fine, if you account for implicit inputs

bar:
	a, b
	result: a+b

* here, `a` an `b` are set values, but because they are unbound, they are implicit inputs as well
* I am leveraging set values to declare inputs
* I think that was my intention in the first place, and in this section, I was just confusing myself
* in fact, that's exactly how I was treating it in an earlier section, "Default Values II"
* I believe that was what I was doing even all the way back in May in one of my first conversations with veggero [here](https://www.reddit.com/r/ProgrammingLanguages/comments/8g8mru/monthly_what_are_you_working_on_how_is_it_coming/dyceran/)

### Duality of Unbound Symbols and Anonymous Properties

* aka the connection between function calls and return statements

* recall the concept behind unbound symbols, and using anonymous arguments in function calls:

```js
foo: a, b // unbound symbols a,b
bar: foo(10, 20); // 10 and 20 bind to the unbound symbols
```

* also recall anonymous output values using return/arrow statements

```js
foo:
	a: 10
	b: 20
	=> a+b
_
```

* these are connected
* hanging/anonymous values automatically seek out and bind to unbound symbols

```js
(a, b): // symbols
	x: 10
	y: 20
	=> x+y, x*y // values

magnitude:
	a, b // symbols
	x: a*a
	y: b*b
	=> Math.sqrt(x+y)

mag1: magnitude(10,20); // 10,20 are hanging values
```

### Sets as Arguments Brainstorm

* here, I was experimenting with different ways of passing sets/objects as arguments

```js
args: (10, 20)
mag2: magnitude(args) // this treats args as a set, and using it as the first argument

mag3: magnitude(...args) // Javascript spread operator syntax allows us to map the set items to individual arguments

mag3: magnitude(center: 10, offset: 3 => center+offset, center-offset) // does this return a set/tuple or the two arguments separately
// in javascript this returns it it as two arguments separately
// actually it treats the whole arrow function as an argument
// are `center` and `offset` in the scope of `magnitude`? I think so, but we are redefining them

mag4: magnitude
	(
		center: 10, offset: 3
		=> center+offset, center-offset
	)...

mag5: magnitude
	... // `...` works like `if (true)...`, where the properties returned are expanded into the larger scope
		center: 10, offset: 3
		=> center+offset, center-offset

tempargs: (center: 10, offset: 3 => center+offset, center-offset)
mag6: magnitude(...tempargs, extraArg1, extraArg2)
mag7: magnitude.apply(tempargs)(extraArg1, extraArg2) // alternative way of doing it
mag8: magnitude.apply(center: 10, offset: 3 => center+offset, center-offset)(extraArg1, extraArg2) // alternative way of doing it
;```

* hmmm...do those last examples (using `apply`) really work?
* a tentative implementation of `apply`:

```js
object:
	apply:
		argSet,
		=> object(...argSet)
;```

* since calling transformations overrides the intermediate scope, this means:

```js
myObject.apply(argSet)(arg1, arg2); // argSet overrides apply's scope
```

* the first cloning, with `argSet`, works fine
* but does the second cloning, with `arg1, arg2`, also override apply's scope?
* or does it override the scope of the object returned by the first `apply`?

* in order for this example to work, it should override the scope of the object returned
* so it seems like, for transformations, the first call overrides the scope, and returns an object
* the second call overrides the returned object

### Cloning and The Associative Property

* according to the previous section, "Sets as Arguments Brainstorm", transformation cloning works differently
* first cloning overrides the transformation scope, second cloning overrides the returned object's scope

* however, this seems to break some fundamental rules about cloning

```js
x = x() = x()() // this should always be true
x(a, b) = x(a)(b) // this too, currying

rotate: // rotates a matrix
	inputMatrix, angle,
	...
	=> matrix(rotatedValues)

rotatedMatrix: rotate(myMatrix, 30) // this clones the rotation transformation
matrixClone: rotatedMatrix() // this clones the matrix, not the rotation transformation

rotatedMatrix2: rotate(myMatrix)(30) // this returns a matrix, and then clones the matrix with an argument of 30, which does nothing

rotatedMatrix != rotatedMatrix2

// another example of this

x:
	firstProp: 10
	=>
		secondProp:20
		=> 
			thirdProp: 30

x != x() != x()() // x contains firstProp, x() contains secondProp, x()() contains thirdProp

// treating transformation cloning differently, means that we won't know whether it's cloning the transformation or the output

// instead, transformation cloning should work like normal cloning
// so the `rotate` transformation should return the rotate module, not just the anonymous output

```

### Mixed Modules

A New Model for Nodes and Modules

* huge epiphany, brings together ideas from:
	1. Singleton Sets
	2. Anonymous Outputs and Cloning
	3. Transformations vs Objects
	4. Unbound Keys vs Values

* I have decided to change the way we treat anonymous outputs (which formally used the `=>` operator)
* they are not shorthand for "accessor pattern", or transformations
* they are just set/tuple values
* instead of `foo: a: 10, b: 20, => sum(a,b)`, we just say `foo: a: 10, b: 20, sum(a,b)`
	* note that this is not the same as `foo: sum(a: 10, b:20)`

* in fact we don't even need the arrow operator anymore, now that transformations are treated as regular objects, with no "intermediate scope"
* all properties in a transformation are included in the output object
* might as well get used to temporary properties included in the output (even for transformations)
	* they are part of the "history"
	* normal objects never excluded temp variables, so transformations shouldn't either

* before, we used `=>` to specify values, and lone symbols as keys (see section "Unbound Keys vs Values")
* now, lone symbols are by default treated as values, and I haven't yet decided how to specify keys
* (maybe the first line should be for keys, kind of like function parameters. Note that these are always optional)
* anonymous outputs are literally anonymous outputs, values without keys
* IDE can help show where outputs are, kinda like what `=>` helped do before

* instead of hiding temp variables in intermediate scopes, now everything is visible
* as a part of the object's "history"

```js
sum: a, b, a+b
product: a, b, a*b

a: 1, b: 2, c: 3

x: (a*b)+c
y: x*x

x:
	a:
		a: 1
		b: 2
		a*b // 2
	b: 10
	a+b
y:
	a: x
	b: x
	a*b

y.a.a.a = 1
y.a.a.b = 2
y.a.a = 2
```

* note that `x` and `y` are singleton sets
* they are sets of a single item, but they also represent numbers
* they can also have properties
* singleton sets make sense because we are representing "history"
* every node contains both it's value, and all steps leading up to that value
* kind of like a state variable!

* `(3)` is a not a set or a number, its a node
* its a node containing the numerical value 3
* structurally, `(3) != 3`
* but value wise, when you evaluate it, and get the numerical value, its the same
* this is the difference between structure and value
* structure shows us the history of the value
* every computation step "wraps" the object
* `((((x))))` is a chain of historical states, (four in this case), so the output is both a single value and a set of states

* `,` is an operator, turning nodes into sets of nodes

* modules are called "mixed modules" because they contain both properties and hanging values
* and they can be evaluated as either a module or a value
