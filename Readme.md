Untitled Language
-----------------

by @veggero and @woojoo666

Arcana is a dataflow language.
Persistent
graph-like
distributed
immutable and preserves concurrency

### Objects

Everything in ___ is an object.
Objects are sets of properties, symbol-value pairs that represent references to other objects

Objects can look like classes, objects, functions, or lists.

```js
foo: (10, 20, 30) // use parenthesis to declare objects. This is a list

Point: // indented blocks "imply" parenthesis. This is an object
	x: 0
	y: 0
```

Objects can reference any values inside their scope.
Known as properties
Even primitives can have properties

An object can also have values without symbols, "hanging values".
They can be viewed as list items or function outputs.
They can be referenced by index, just like arrays.

```js
foo:
	x: 10 // has a symbol
	20 // no symbol, a hanging value
	30

foo[0] = 20
foo[1] = 30
```

If an object uses a symbol that doesn't have a value yet, it's considered an _unbound_ symbol.
These can be viewed as function inputs.

```js
x: 10
z: x+y // x is a bound symbol. y is unbound
_
```

You can also explicitly declare unbound symbols, by adding a `=>` after.

```js
sum: a, b => // unbound symbols, aka inputs
	a+b // a hanging value, aka output
_
```

### Binding

The `:` operator is for binding
It simple binds a symbol to a value

```python
foo: ( 1 2 3 ) # binds foo to a list of (1 2 3)
```

but if given multiple symbols and multiple values, it will match them up

```js
a, b, c: 1 2 3 // this is equivalent to a: 1, b: 2, c: 3

a: 1 2 3 // be careful! because 1 2 3 is treated as an expression not an object, "a" will only bind to the first value

(a, b): (1 2) // we can also use object deconstruction

```

### Cloning

Objects can be cloned, using the `()` operator

```js
p: Point(x: 10, y: 20)
_
```

* like calling functions
* like prototypal inheritance

When you clone a object, it creates a copy, and overrides specified variables

it also follows binding rules, so if you give it values, it will bind them to unbound variables

```js
Point:
	x, y => // unbound symbols

p: Point(10 20) // binding results in x:10, y: 20

p2: Point // implied parenthesis allows us to do this
	x: 10
	y: 20
_
```

### Spread Operator

The `...` operator is used to extract values from an object.
You can use it to combine lists or use lists as function inputs

```js
x: ( 1 2 3 )
y: ( ...x, 4 ) // y is ( 1 2 3 4 )

myFn(...y) // same as calling myFn(1 2 3 4)
_
```

### Functions and Calling

* functions are like "incomplete" expressions

```js
a: 10
b: 20

foo: a+b // an expression. foo = 30
bar: x+y // unbound symbols x and y, so bar is a function

magnitude: ...
	x: a*a
	y: b*b
	Math.sqrt(x+y)
;
```

* an expression will run once it is "complete"
* so in the previous example, if you did `zed: bar(5, 7)`, then both of `bar`'s variables get bound, the expression is completed, so zed = 12

* access specific outputs: `bar(10)[0]` gives undefined, `bar(10,20)[0]` gives 30

* overriding outputs...

### Conditionals

```js
foo:
	if (cond)
		10
	else
		20

foo(true) // returns 10
;

bar:
	x:
		y < 0 ? "a"
		else y < 10 ? "b"
		else y < 20 ? "c"
		else "d"
```

### `For` Keyword

* so Nylo has the `for` keyword for map operations, which is pretty nice
* I've been using the keywords `reduce`, `map`, and `filter`, but those are kinda ugly terms
	* I'm actually not sure how Nylo handles reductions actually
* recall that in my diagram language, I had the "fan-out" syntax for reduction and map
* I think I can work that into the `for` syntax

```js
list: ( 1 2 3 4 5 )
result:
	for item in list:
		item*item // any values are appended to the final list, like a map operation
		if (item % 2) 'x'+item // we can use conditionals for filter operations
		sum: item+prev.sum // use properties to do reductions. `prev` refers to previous states
		product: item*prev.product // this syntax makes it easy to define reductions that pass multiple variables

result = ( sum: 15, product: 120,  1 4 'x2' 9 16 'x4' 25 )
```

### Dynamic Keys

```js
fn:
	for str in ("fda" "kekw" "jkdfie"):
		[str]: true

// local vars

foo:
	localvar. // this is short for localvar: ()
	[localvar]: "hidden"
	bar:
		print([localvar]) // prints "hidden"

print(foo[localvar]) // prints `undefined`
;

// streams and matchers

evens:
	[% 2 = 0].

evens = (0. 2. 4. 6. 8. 10. ...)
```

### Feedback

* properties can have feedback

```js
root:
	left:
		left:
			"hi"
		right: 3
		parent: ^parent
	right: 20
	parent: root
```

* inverse example

```js
unit:
    km: m*1000
    m: km/1000 | cm*100 | mm*1000
    cm: m/100
    mm: m/1000

unit(m: 5).km // gives 0.005
unit(mm: 150000).m // gives 150
;
```

### Undefined

* everything is data
* errors are data, represented using `undefined`
* represents undefined behavior
* can have properties that store more info

* use `undefined` as a default, and build from there
* it allows you to create "incomplete" programs
* which is fast
* so you don't have to _define_ every case, which can be impractical for large programs
	* especially in an un-typed system, where you have to handle all kinds of input, like corrupt data or invalid types or wrong number of inputs, etc
* it's much more practical to have cases where you just throw `undefined` to indicate that those cases aren't accounted for
	* declaring the program behavior is literally `undefined`

### Random Cool Syntax

```js
// immediately invoked function expressions

foo: ...
	a: 10
	b: 20+a
	c: a/b
	c*c

// capture blocks

foo: fn1(a).fn2(b).fn3(c, d)
	a: 10
	b: 20
	c: 30
	d: 40

// function declarations

sum: ...
	a+b

sum: a, b => // declares a function with no output
	a+b // gives the function an output, without binding any variables, so function is still incomplete

sum: a, b => a+b
	a: 10
;
```

### State Variables

* flag watcher model

```js
foo:
	mylist.
	double:
		mylist: (...^mylist, ...^mylist)

onkeypress: event =>
	foo.mylist: (event.key, ...foo.mylist) // push to front

onclick: event =>
	foo.double()

;
```

### Metaprogramming Systems and Type System Example

* recall the idea of systems
* that using metaprogramming and local variables, we can define hidden properties and rules for programs
* any program defined with the "system" inherits those hidden properties and rules
* these systems often act like contracts, where every program that joins the system agrees to the contract, and must abide by the rules

* for example, one thing a type system enforces is that functions must pass the right datatypes to other functions
* normally, in an un-typed dynamic system, it's free for all, and if a function wants to pass in invalid data or wrong types, that's just something the programmer has to account for
* however, with a type system, a compiler can go through all the types and make sure there are no conflicts
* this compiler is part of the "type system", and is just a metaprogram
* in addition, any variables in this type system have the hidden "type" property that statically binds them to their types, making property access faster
* alos ensures that, any program that passes the compiler, is guaranteed to run without errors or `undefined` values

### State Variables as a System

* state variables is actually an example of a system as well
* state variables are a datatype with special rules in the background
* any function called by an event or reduction has an associated `index` property
	* for reductions, this is the index of the items
	* for events, this is the event time
* in addition, the system searches these functions for modifications to declared state variables
* the system appends the modifications to the state variables with the associated index
* and the index is used to order these modifications

* in addition, these indices have an associated `index_type`
* for events, the index type is just `time`
* for reductions, the index type points to the source list
* the system checks to make sure all modifications have the same `index_type`
* so you can't just mix reductions and event listeners together, doesn't make sense
* these checks can be performed statically, before the program is even run!

* `index` and `index_type` are hidden variables
* so you can't mess the system up

### Functions As a System

* functions can be viewed as a system too!
* recall that function calls is just accessor pattern
* we can replicate functions with an `fn_result` property
* this is basically like Nylos `->` property
* any object with this property is considered a "function"
* the system overrides the cloning operator to add this behavior:
	* if the object has the `fn_result` property,
	* and the object has no unbound symbols
	* extract the values after the cloning operation
* now instead of using `fn_result`, just use list values instead
* and that's basically the function calling system we have right now

### Making a Type System

* our cloning system already has the markings of a prototypal type system
* in fact, if we wanted a type checker, we can simply use type inference to check for conflicts
* some discussion on type inference systems [here](https://en.wikipedia.org/wiki/Type_inference)
* but a super simple version would be to just
	1. start at created objects and input nodes (eg `stdin`), all of which have predetermined types
	2. traverse forward, looking at all places these objects are used
	3. statically bind types as they are being inferred
	4. make sure there are no conflicting property accesses or types
	5. make sure `undefined` is never explicitly used in the program
* if the type inference passes without issue, then we are guaranteed that the program will run without errors
	* no `undefined` either
* the static type binding allows for faster property access as well

* for example

```js
Vector:
	x, y // note: unbound, so treated as symbols

input: stdin() // a string
inputNum: intFromString(x) // so y must be a Number
p: Vector(x*x, 5) // so Vector.x and Vector.y must be Numbers
mag: magnitude(z) // magnitude.v must be a Vector, so bind v.x and v.y inside magnitude to Vector.x and Vector.y
mag2: magnitude("hi") // ERROR. first problem is, magnitude.v was inferred to be a Vector but a String was given.
                      //        second problem is, String.x and String.y don't exist, so property access error as well.

magnitude: v => Math.sqrt(v.x*v.x + v.y*v.y) 
;
```

* lets say you wanted to go a step further, and add explicit type declarations
	* so the IDE can provide suggestions and autocompletions and such, before types can be inferred
* then you can add a rule to ensure that all unbound symbols are:
	1. declared at the top of the function
	2. accompanied with a type
* eg `sum: Int a, Int b => a+b`


### State Machines

* TODO: import this from notes
