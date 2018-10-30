
now the concept of functions is pretty much finalized and decided on (see notes5.md), we can go back to brainstorming the other parts of the language

### Local Variables vs Private Variables

note that local variables are different from private variables
because if u had
foo: (localKey. [localKey]: localVal)
localKey is still accessible, and thus, so is localVal

to create a private value, you'd have to do something like
foo: (inputKey => getVal: if inputKey = 1948275 ? return mysecretValue)

in order to figure out what value to pass in, you'd have to inspect the code
but you can't just do something like foo.privateKey to get 1938275, it's not stored in any of the properties

### Assignment Syntax

≔ character used for assignment?
a single character, instead of := separate?
kinda like how we use the … char instead of three dots ...
looks kinda ugly though
even sublime-text doesn't render it properly, renders it as slightly longer than a normal character

[this stackoverflow answer](https://stackoverflow.com/a/7749570/1852456) talks about why Scala uses `=` for assignment instead of `:=`
they said that Java users were used to `=`
and that they didn't find a strong reason to go against convention
however, for the case of Arcana, I think my target audience is beginner programmers
as in, people who have never programmed before
so convention isn't a huge issue
if this language is to be integrated with Cono, it will often be used just to quickly tie together data
so it's better to be intuitive for first-time users, rather than familiar to experienced Java/C++ programmers

### Referencing State Variables

when defining a variable, we use the := char to differentiate between assignment and definition
but when _using_ a variable, how do we differentiate between using the latest value or the "previous" state of the variable?
in a reduce operation, we can think of each stage as a module that modifies a variable
aka, instead of having inputs and ouputs, there is a variable that is both an input and an output
previous state and next state of that variable
this means that, if our module defines the next state of a certain variable
then it only makes sense that inside the module, we are referencing the previous state of that variable

thus, any time you "assign" to a variable, it changes all references to that variable to referencing the previous state of that variable

### Call Operator and Catching Mistakes

* the call operator can help catch bugs
* for `HTTPRequest`, with the `#` operator:

		HTTPRequest#(url:"google.com")

* if `HTTPRequest` is meant to be used as an object, this code will throw an error
* so this helps catch mistakes

* whereas if we didn't have the `#` operator, and we used the code `HTTPRequest(url:"google.com")`
	* it will behave differently if it's an object or a function, and will cause errors farther down the line
	* harder to catch the mistake

* for objects, you use cloning
* for functions, you use calling the vast majority of the time
* so if you accidentally treat an object as a function or vice versa, it will throw an error the vast majority of the time

### Indentation and Line Endings

* remember that line endings are also a delimiter
* however, then how would you break up a long line into multiple lines
* you can use indentation

		foo.bar.baz + ...
			zed.henlo.world

* note that we use `...` as well, otherwise the indented block will be treated as an object and it will be equivalent to 

		foo.bar.baz + (zed.henlo.world)

* though in this case this still works because the operator consumes the parenthesis

* maybe we can also make it so operators consume line endings as well, so we can do stuff like

		if (giantConditional1 ||
		giantConditional2 ||
		giantConditional3):

			true

* maybe we can also make it so, if there is an unclosed parenthesis, it will continue to the next line (without a line ending)
* thouh these two rules allow for a multi-line expression without indentation, which looks kinda ugly (as shown by the example above)

* what about `.` operator? how do we break up a giant path/url?

		foo.bar.baz
			.zed.henlo.world

* should this work?

### Implicit Inputs/Functions and Bounding Scope II

* previously, we were wondering what scope implicit inputs applied to
	* see section "Implicit Inputs/Functions and Bounding Scope"
* we talked about how the `=>` operator is used to "capture implicit inputs"
	* see section "Arrow Operator and Capturing Implicit Inputs"
* but perhaps wrong way to think about it
* implicit inputs don't need to be assigned to a "level"
* take this example:

		foo:
			bar:
				zed: a+b

* notice that `a` and `b` are implicit inputs
* however, we can give values to them at any level
* `foo(a: 10, b: 20)`, `foo.bar(a: 10, b: 20)`, and `foo.bar.zed(a: 10, b: 20)`, will all result in `foo.bar.zed = 30`
* we can think of unbound symbols as equivalent to declaring it as undefined in the outermost scope

		a: undefined, b: undefined
		foo:
			bar:
				zed: a+b

* so what is the purpose of the `=>`?
* it's to declare an expression, a function
* to capture an expression/behavior for later evaluation
* it also points to the output of that expression/behavior
* recall our discussions about program vs data, behavior vs output
	* from sketchbook notes, where we explored functional,
		and tried to reduce everything to pure data (using a similar mechanism as Church Numerals)
		but realized we couldn't, because there has to be a concept of "programs",
		where the output is different from the program itself
	* in fact, this distinction between program and data, or behavior vs output, came up a lot throughout the development of this language
	* eg metaprogramming
	* its also why the concept of mixed modules ultimately didn't work out

* note that Nylo uses `=>` a little differently
	* before (when I talked to Veggero May/June), it acted like a special object property, like how mine works now
* recently when I talked to him (Sept 16), it seems like he's changed it a bit
* seemed similar to my idea of mixed modules
* he was trying to combine program and data
* something like `(a: 10, b: 20, => a+b)` acted like both a dictionary and a value (in this case, the value being `a+b`, aka `30`)

### Program vs Data

* we are now using `=>` to differentiate between a "function" (aka unevaluated expression) and a "value" (evaluated expressions)
* but isn't that like declaring a type?
* if we want true dynamic typing, perhaps we should try to capture both states in one object?

* seems to be going back to that duality concept
* use different operators to treat an object as either an expression, or the output of that expression

* but didn't we already kinda have this "duality" when we were using `{}` for clone and `()` for calling?
	* see section "Different Syntax for Calling vs Cloning"
* also, right now, when we have functions, we use `()` for cloning and `#()` for calling, isn't that also kinda like duality?

* for now, let's say every value in our language/system contains a superposition of evaluated and unevaluated
* if we had some function `foo: bar(1,2)`, it might look like `foo` contains the superposition of the expression `bar(1,2)` and the output value of `bar(1,2)`
* however, remember that everything is a superposition, so that means even the output value of `bar(1,2)` is a superposition of an expression returned by `bar(1,2)`, and the output value of that expression
* this can go on and on
* so using pseudocode representation, it's starting to look like `foo` contains a superposition of `foo`, `foo()`, `foo()()`, `foo()()()`, `foo()()()()`, and so on

* another example:
	* in `map(fn: n+1)`, we want to treat `n+1` as unevaluated
	* but in `square2: square1.translate(10, 20)`, we want to treat the expression as evaluated

* however, note that in real programs, when we evaluate an expression multiple times, we get different results depending on how many times we evaluate it
* if we have a deeply nested chain of functions, every time we "evaluate" it, it returns a "deeper" level function
* for example, take `function foo() { return function bar() { return function zed() {} } }`
	* `foo()` returns `bar`, and `foo()()` returns `zed`

* this is different from types like Numbers and Strings, because it doesn't matter how many times you cast a value as `String`, it won't change

* thus, it seems like "evaluated" vs "unevaluated" are mutually exclusive
	* you can't have both at the same time
* you need some way to declare an expression as "evaluated" or "unevaluated"
* however, there are multiple ways to achieve this

* one way is to treat everything unevaluated by default
* and then use an operator to force evaluation, like `.`
* so `map(fn: n+1)` works nicely, but we will have to use `.` many times in cases like:
	* `a: 1+2, b: a.*3, c: b.+a.*a.`

* another way is to differentiate between the two based on if there are unbound symbols in the expression
* this goes back to the idea of implicit inputs
* also starts to look like currying, because the behavior of the expression is based on which symbols have values and which don't
* however, recall that we chose default values over currying because we didn't want behavior to change based on whether symbols were defined or not
	* see section "Choosing Default Values Over Currying"

* lastly, we can treat everything as evaluated by default, and use `=>` to treat expressions as unevaluated
* note that wrapping expressions in objects using `()` can be thought of as another way of keeping things unevaluated
* makes sense, because `=>` is treated just like any other object property


* note that the behavior of `=> ...` actually seems a lot simpler if you just think of it as short for `_return: ...`
* doesn't do anything special like "capture inputs" or anything like that
* just declares a property

### Delimiter Precedence

a long time ago, we talked about how there are three delimiters
spaces, line endings, and commas

notice that we also were doing stuff like `foo: 1 2 3, bar: "hello"`
or

	foo: 1 2 3
	bar: "hello"

notice how this wouldn't work if all delimiters were treated the same, because if we were to convert all delimiters to commas, we would get
`(foo: 1, 2, 3, bar: "hello")`, which can be interpreted the same as `(foo: 1, bar: "hello", 2, 3)`

thus, it seems like if you mix multiple delimiters, things get grouped based on the delimiters being used
and there is a precedence order: spaces < commas < line endings

so something like `foo: 1 2 3, bar: "hello"` is equivalent to `foo: (1, 2, 3), bar: "hello"`

### Function Syntax - Return vs Arrow, Input Order

Also notice that, if we treat line-endings as a delimiter, then something like this

fn:
	a: 10
	b: 20
	=> a+b

can be represented as `fn: (a: 10, b: 20, => a+b)`
however, that clearly isn't what we want, because that makes it look like `=> a+b` is a separate function

* so perhaps we should use a separate operator that actually acts like `return`, and is the same as declaring the property `_return`
* we can use `==>`

		fn:
			a: 10
			b: 20
			==> a+b

note that this differentiates it from declaring a list of functions

		listOfFns
			=> a+b
			=> a*b


for input order, using `$` for inline functions is kinda ugly
		
		listofFns($ a b => a+b, $ a b => a*b)

maybe we can use the operator `==`
and it should be after the input list
that way you can do stuff like

		map(a b c => a+b+c)
		map(a b c == a: 10 => a+b+c)

however, we might want to use `==` for stuff like reference equality
so maybe we can use `>=`?

		map(a b c >= a: 10 => a+b+c)

note that delimiter precedence helps here too
because we can group the inputs

		listofFns(a b => a+b, a b => a*b)

maybe `=>` should work like javascript where it captures the object before it as input list
this way



I think for declaring functions as list items, you shouldn't be able to do it like this

		foo:
			=> x+y
			=> x*y
			=> x/y

because if you only have one list item, it looks too similar to a return statement `==>`

maybe we should force it to be explicit

		foo:
			0: => x+y
			1: => x*y
			2: => x/y




there are 3 parts to every object:
	1. input list
	2. properties
	3. output

note that each one of these is optional
you could have an input list and an output: `(a b => a+b)`
you could have just a list of properties: `(a: 10, b: 20)`
you could have just an output: `(=> a+b)`

in fact, you could have just an input list: `Point: (x y >=)`
and that way, you could just be like `a: Point(1,2), b: Point(3,4)`
	note that for objects, the input list kinda acts like a constructor

thus, there are 3 parts, and each part is optional, so that's a total of 8 possibilities
and we need a syntax that accounts for all 8 of them

let's see how the current syntax works out

the base for each of these is `foo(10, 20, ____, 30)`

none:
	`foo(10, 20, (), 30)`
input list:
	`foo(10, 20, x y >=, 30)`
	or maybe to be a bit more explicit, `foo(10, 20, x y >= (), 30)`
properties:
	`foo(10, 20, (x: 2, y: 4), 30)`
output:
	`foo(10, 20, => x+y, 30)`
input list & properties:
	`foo(10, 20, x y >= (x: 2), 30)`
input list & output:
	`foo(10, 20, x y >> x+y, 30)`
	or maybe `foo(10, 20, x y >=> x+y, 30)`
properties & output:
	`foo(10, 20, (x: 2, y: 4 => x+y), 30)`
all:
	`foo(10, 20, (x y >= x: 2, y: 4 => x+y), 30)`

so it seems like any time there's properties included, you have to add the outer parenthesis
and on the flipside, if there aren't properties, you don't need parenthesis

delimiters matter too:

`(a, => a+b)` contains a list item and a function
`(a => a+b)` contains a function with an input list

though perhaps this looks too similar?
though actually, for input lists, you need the `>=` operator, so the second example should look like

`(a >=> a+b)`


### Input Order and Inheritance

what happens when we clone object, what happens to input order?
if we clone an object and add more properties with implicit inputs, do those inputs get added to the input list? are they added to the beginning or end?
well if you think of input order as a property, and how it gets cloned along with the rest of the properties...

	foo:
		_input_order: a b c
		result: a + b + c

	bar: foo
		x: d + e
		result: ^result + x

new properties get added to the end of the existing property list
so by default new inputs should get added to the end of the input list
	because the input list follows the order in which implicit inputs appear in the object
so `bar` now looks like this:

	bar:
		_input_order: a b c d e
		x: d + e
		result: foo.result + x

manually overriding the input list overrides all inputs, including parent inputs

	zed: bar(_input_order: a b c x)

so if you want to "add" to the input list, you have to say so:


	zed: bar(_input_order: ...^_input_order x)

kind of like how, in imperative langs when you override the  constructor,
	you often have to manually copy over all the constructor parameters of the parent's constructor, into the child constructor

what about overriding properties? what if we add an unbound symbol while overriding a property? is it added to the end, or the middle, of the input list?

### Delimiter Precedence II

* commas and line endings actually have the same delimiter precedence
* that way you can do things like

		foo:
			a, b
			c: 10

* in addition, code like this seems ambiguous

		foo:
			1 2 3
			4 5 6
			7 8 9

* because while delimiter precedence implies that it's equivalent to three lists:
	
		foo:
			(1 2 3)
			(4 5 6)
			(7 8 9)

* it looks like the programmer is trying to just break up a long list onto three lines

* hmm, can we break up a list into multiple lines using something like this?


		foo:
			1 2 3 …
			4 5 6 …
			7 8 9

* if we replace line endings with commas, we can see why this doesn't work


		foo:
			1 2 3 …, 4 5 6 …, 7 8 9

* even if we treat `…` as an operator (remember that operators at the end of a line nullify the line ending), then you end up with


		foo:
			1 2 3 …4 5 6 …7 8 9

* which also doesn't work

* also, it's not quite a capture block, because the next line isn't a block, its at the same indentation level

* maybe we can make it behave as a "continue list" operator for this specific case?
* after all, if you wanted to use it as a spread operator, you could just do it like

		foo:
			1 2 3
			…4 5 6
			…7 8 9

* actually, that we can just use


		foo: (
			1 2 3
			4 5 6
			7 8 9 )

* man that's ugly though
* what about

		foo: (…)
			1 2 3
			4 5 6
			7 8 9

* hmm still might be ambiguous
* not sure how to solve this
* regardless, we should not allow this:

		foo:
			1 2 3
			4 5 6
			7 8 9

* because of the aforementioned ambiguity
* if you want to represent multiple lists, be explicit

		foo:
			(1 2 3)
			(4 5 6)
			(7 8 9)

* or maybe even

		foo:
			1 2 3,
			4 5 6,
			7 8 9,

* if you want to represent a single list broken up onto separate lines, use

		foo: (
			1 2 3
			4 5 6
			7 8 9 )

* or maybe some other method I haven't thought of yet

### Spread Operator Brainstorm II

should spread operator `…` be before or after items?

if it's after, it looks meh with commas, eg `foo: mylist1…, mylist2…`
looks especially bad when you don't use … char, eg `foo: mylist1..., mylist2...`

on the other hand, if you put it before, it looks like `foo: …mylist1, …mylist2`
	or `foo: ...mylist1, ...mylist2`
I think this is why javascript puts it before

however, maybe we can make it so you can omit the comma if you use the spread operator
	eg `foo: mylist1… mylist2…`
	or `foo: mylist1... mylist2...`

but this looks like you are using the space delimiter, so something like `foo: 1, 2, mylist1… mylist2…` looks ambiguous
	is it `foo: 1, 2, (mylist1… mylist2…)` or `foo: 1, 2, mylist1…, mylist2…`?

I think before works best
in addition, it allows for IIFE to work

foo: …
	a: 10
	b: 20
	a+b

### Spread Operator and Merging Properties

* earlier, we talked about the "fixed" syntax for IIFEs (Immediately Invoked Function Expressions)

		foo: (=> a.bar(b))#
		    a: SomeObject
		    b: 10

* however, this is ugly af
* note that, using the spread operator, we could do a similar thing

		foo: ...
		    a: SomeObject
		    b: 10

		    a.bar(b)

* which behaves the same, but puts the output at the end of the block instead of the beginning

* without revising our syntax at all, we can actually move it back to the beginning, without resorting to the super ugly syntax

		foo: a.bar(b) ...
		    a: SomeObject
		    b: 10

* this works basically the same way, declaring the first item of the list, and then adding subsequent items through the spread operator and indented block
* however, note that this only works if the scope of the indented block is "spread" out into the upper block as well...
	* in other words, the properties are spread out, as well as the list items

* this can have some very dangerous implications...
* it means that any time we use a spread operator, we have to be aware of the properties inside the item we are spreading
* eg in `foo: (a b >= 1, 2, a+b, ...someList)`, it might look like `a` and `b` are implicit inputs, but if `someList` defined the properties `a` and `b`, then they would affect the output
* I guess it would behave like defining default values for `a` and `b`, but unintentionally

* on one hand, it actually does seem like all properties are spread out
* if you have something like `args: (x: 10, y: 20)` and you do `Vector(...args)`, you probably want to treat those properties as inputs
* after all, `Vector(10, 20)` and `Vector(x: 10, y: 20)` are just two ways of saying the same thing, so you should be able to use the spread operator for both cases
* in other words, you should be able to use the spread operator for named arguments

* on the other hand, if we view list items as properties, the spread operator is clearly not just "merging" properties
* say we had `list1: "a" "b"` and `list2: "c" "d"`
* note that these are equivalent to `list1: (0: "a", 1: "b")` and `list2: (0: "c", 1: "d")`
* however, `(...list1 ...list2)` is equivalent to `(0: "a", 1: "b", 2: "c", 3: "d")`
* its not the same as just merging properties, because then the properties `0` and `1` of both lists would collide

* so perhaps, for index properties, the spread operator is "contextual", assigning new indexes in order
* but for all other properties, it just merges them in

### Capture Blocks III

// TODO: CLEAN/REVISE THIS SECTION

* capture blocks are whenever the `…` operator is used without a variable after it
	 * that means that `...` at the end also counts as a capture block?????
* they should be scoped to the current line, for simplicity
* takes the next indented block


* that way you can do 

		foo: a.bar(b) ...
		    a: SomeObject
		    b: 10

* and it looks like a capture block? but it already worked as a spread operator, see previous section


should I use the `with` operator with capture blocks?
that way we can use the same method for IIFE

		foo: bar(...) with
		    arg1: SomeObject
		    arg2: 10

		foo: a.bar(b) with
		    a: SomeObject
		    b: 10

that way we can have multi-line capture block expressions, the `with` determines where the expression ends

### Property Declaration and Binding

notice that, for 

		foo: a.bar(b) ...
		    a: SomeObject
		    b: 10

to work with the spread operator, we are making `foo` bind to the "first element", `a.bar(b)`
whereas, when you say something like

		foo: 1 2 3

it is treating everything after as a list, and foo binds to the entire list
so what happens if we have

		foo: 1 ...
		    2
		    3

does foo bind to the first element or the list?

I kinda want to make the IIFE syntax work


		foo: a.bar(b) ...
		    a: SomeObject
		    b: 10

so maybe we can make foo always bind to the first element, and if you want a list, you have to be explicit

		foo: (1 2 3)

however, this means that stuff like this won't work: `fn(a, b, x y >=> x+y)` because

alternatively, we can make foo bind to the entire list only if there are multiple elements on the first line
if there is only one element on the first line, it only binds to the first element
which makes the IIFE work


note the difference between

		foo: 1

and

		foo: 1 2 3

### Using List Items to Declare Inputs

note that for functions, where we don't really use list items, we can leverage them to declare input order

`fn: x y z => x+y+z`

notice that we aren't using the `>=` symbol, so these are regular list items
however, the `_parem_order` property will be automatically generated to follow the same order as these list items, so it's basically the same thing
maybe this is the idea I had [back in May](https://www.reddit.com/r/ProgrammingLanguages/comments/8g8mru/monthly_what_are_you_working_on_how_is_it_coming/dyceran/) when I was using syntax like

sum:
	a, b
	return a+b

so in the section "Unbound Keys vs Values", I confused myself and didn't realize I was using the concept of implicit inputs, so for stuff like `foo: {a, b}`, `a` and `b` are both inputs and set values


though using list item to declare inputs, in something like this:

		fn: x y z, x: 10 => x+y+z

looks ambiguous, because while the `x y z` part looks like list elements, delimiter precedence implies that it will actually be grouped into a single list, that is treated as the first list element of `fn`
so it is actually equivalent to

		fn: ((x y z), x: 10 => x+y+z)

however, the `_input_order` still generates it in the same order, so it doesn't actually matter
as long as you aren't using the list items, you won't notice a difference

### Implicit Inputs and Default Values

note that implicit inputs makes it hard to declare default parameter values
if you want default parameters, you have to do something like

	fn: x y z, x: 10, y: 20, z: 30 => x+y+z

this is the consequence of trying to mix inputs (which you want arguments to map to) with local variables (which you don't want arguments to map to)

in fact, the above example won't even work
because `x` and `y` have values defined, so using list items to declare `x` and `y` as implicit inputs won't work
this is more clear if we rearrange the properties and add in implied parenthesis

	fn: (x: 10, y: 20, z: 30, (x y z), => x+y+z)

the `(x y z)` just becomes a list of `(10 20 30)`

so to declare implicit inputs with default values, we have to explicitly declare inputs

	fn: (_input_order: x y z, x: 10, y: 20, z: 30 => x+y+z)

### Revisiting Core Concepts - Tagging and Labeling

was thinking about Cono
let's say we had a bunch of user-submitted images
and they were labeled with their correct dimensions

if we wanted to get all images bigger than 1000x1000, we can do it in two ways

first method: just use a regular ol filter, "hard-coded" method

	large_images: images with (width >= 1000, height >= 1000)
	display(large_images)

(wow I just realized the `>=` operator is used for "bigger than or equal to", so we can't use it for input order declaration. Just shows how long it's been since I've written real code)

second method: add a dynamic tag to the images, a more dynamic and "loosely coupled" method
	(note that this is super pseudocode, don't look too deep into it lol)

	image :=
		large: width >= 1000, height >= 1000
	display(image with large)

even though the tagging method is a bit more verbose, I like it better
it follows the "tagging" mindset of Cono
now the `large` tag can be used for other purposes as well

I mean practically, it seems virtually the same
if you wanted to get all large images that contain yellow...
	following the first method, you would find the intersection between `large_images` and `yellow_images`
	following the second method, you would look for images that have both the tag `large` and `yellow`
the second method still just feels better for some reason

note that the second method is really just adding an intermediate variable
it's kind of like, instead of doing `x: (a+b)*c`, you do `w: a+b, x: w*c`



`large` is a property that applies to each item, and not the entire list

the way we naturally categorize and assign labels to things



the process is:
	1. we first create and attach tags to individual items
	2. and then we can use those tags to construct sets

instead of constructng those sets first, and then trying to combine and manipulate the sets

it's more efficient to construct the set at the end


thus, even though both methods of filtering `large` images are valid
we can fine tune the syntax of Arcana to encourage the second method
to encourage this mindset of adding tags and properties to the smallest applicable piece


another way of thinking about it, is:
we are decoupling the labeling process from the label usage
instead of sifting through items, and putting the `large` ones in the output bucket,
we instead have one person sifting through items and marking the `large` ones, and another person puts marked ones in the bucket
that way, if you want to add a third person that wants `large` and `yellow` ones, they can just join in and look for items marked `large` and `yellow`
the first method would be like:
	one person person `large` ones in a bucket, another person puts `yellow` ones in a bucket
	third person has to go dump out the `large` and `yellow` bucket and look for objects that are in both buckets, putting those objects into a final bucket
the labeling method is more conducive to collaboration and parallization

another example of this is BFS of a cyclic graph
the natural way we think about it, is we "mark" the visited nodes so that we don't visit nodes twice
however, traditionally the implementation involves using a "list" or "set" of visited nodes, and we add to that set
so we can see how "sets" and "tags" are related concepts
however, tags are just a more natural way of thinking about it

### Tagging vs State Variables

it's also important to note that the second method requires us to modify each `item` object, to add the `large` label
however, it feels a bit ugly to use state variables
because then we'd have to change every `item` to a state variable, and make sure they are in scope
by "in scope", I mean for cases like these

		scope1:
			foo. // state variable
		scope2:
			// how do I modify foo here?

however, we actually talked about dynamically adding properties/bindings much earlier in the section "Creating Bindings"
this is why we have the concept of `overdefined` as well

we can think of objects as memory locations
when passing around the object, we aren't just restricted to "reading" from it (aka using it, referencing it)
we can also "write" to it, define new properties, as long as it doesn't collide with anybody else's "write" operation
	which is why you have to give it a label, aka property name, when writing to it
"reading" from it is like defining outgoing edges
"writing" to it is like defining input edges

treating objects as memory locations, it's almost like how imperative languages work
yet the internal structure of the language is still more similar to functional
so Arcana can be thought of as a middle ground between imperative and functional


actually, dynamically adding properties is exactly how state variables work
after all, state variables and versioning is about pushing modifications, which is like adding a new property `foo[index]: modification`


### Tagging using Hashmaps

another way of thinking about tagging is using hashmaps
going back to the BFS example
who is the one adding the `visited` label, and who is using it?
the person performing the BFS search is the one labeling and using it
if we think of the person as a program/module, then the label is "local" to that module
in imperative languages, this would be implemented using hashmaps, associating labels to nodes in the BFS search

### Tagging Syntax

syntactically, we want to encourage this labeling process
we should be able to easily add/use tags, something like

	image#large: width >= 1000, height >= 1000
	display(image with #large)

however, we are already using `#` for the call operator
maybe we can use `.` instead for calling, something like `fn.(x: 10)`
this kinda makes sense because the syntax combines cloning and property access, which is what's happening behaviorally as well

also, maybe we can use `#` to be for local properties, while `.` is for public properties
so `#foo = [foo]` while `.foo = ["foo"]`
though is `#foo` really easier than `[foo]`?

I think maybe `#foo` should stand for `[foo]: true`
that way you can use it for filters, like `image with #large`

this is pretty much accomplishing what we already had with syntax like `foo.` though
so which should we use, `#foo` or `foo.`?

note that we use the same syntax to declare state variables, eg `foo: (x. y. onClick: (x++, y--) )`
and in this case, `#x #y` would look kinda weird

I'm also pretty sure we were debating this exact syntax before
see the section "State Variables and Set Items"

### Using Tags to Create Sets, Combining Tags

tags are "global"
doesn't matter how deep you are in the computation tree
you can tag an object, and then access all objects with that tag from anywhere

you can treat tags like lists

	for image in images: image(#large: width >= 1000 & height >= 1000) // add the tags to individual objects
	display(#large) // treat the tag as a list

kinda like nondeterminism

you can easiliy combine tags

		#red: .r = 255 and .g = 0 and .b = 0 // use the public r g and b properties to create local tag #red
		display(#red) // display it as a list


however, if we allow public properties, like ["foo"], to also be used as lists, then that means we have to keep track of every item that gets that property

also, is it possible to dynamically retrieve hashtag properties? should it be the same as [foo]? or maybe we should do `[#+foo]`?

