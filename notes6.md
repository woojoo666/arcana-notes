
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


for input order, we mentioned earlier that we can use `$` to declare input order
	in the section "Declaring Input Order Using a Property"
however, it gets kinda ugly
		
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
however, the `_input_order` property will be automatically generated to follow the same order as these list items, so it's basically the same thing
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




Audio Notes from 9/27 to 9/28 (Transcribed)
---------------------------------------

// TODO: clean this up, convert to bullet-point style notes

note: in these audio notes, I talk alot about "dynamic property modification"
What I am referring to, is creating a property of an object, outside of the object's declaration
I later call this "indirect binding"

### Recording 10

Oh yeah so and I'm also going to put down some thoughts about Arcana and tagging. I was thinking, I can use the dot notation (the standard JavaScript property access notation) for public properties, which are properties that have strings as keys/names. And I can use the hashtag notation for tags. And what I'm wondering is, maybe I should make the property notation something you have to define locally. Whereas the tags, the hashtags, you can add them to any object anywhere. You can add them dynamically.

And another thing is maybe I can make it so that the property notation is dynamic. The dot notation is dynamic. Like you can use the square brackets to construct a property name/key, and then use the property access. Whereas for tags, maybe it should be static. You can still pass them around, but you can’t construct them like you would strings and numbers, and because of that, you can’t have infinite tags. Whereas for properties you can. At least the “sample space” is infinite. Like you can have a program that runs indefinitely, and say, adding to a list constantly, and that’s an indeterminate amount of properties, because it’s adding it based on index, and you never know when it’s going to stop, so it could theoretically add 100 list items or 1000 list items. Whereas for tags, not so much, because it’s more static.

And lastly, one more difference between them, is that dot properties are global, whereas hashtag properties are local. I mean this kinda just follows from the fact that dot properties use strings, whereas hashtag properties use hidden unique ids. Which implies that, hashtag properties are static and local.

So i’ve been juggling these ideas, wondering like, should I create this much of a distinction between tags and local properties? Because on one hand, if I make local properties and tags the same, that means that, the idea where you can just read from a tag and get every item that uses that tag, well if you do that for dot properties, then there’s way too much to keep track of. That means that, for example, “numerical_value”, the property that I’m using to store the numeric value of a number, that’s going to be on every single number in the program. So if you were to try to select all objects that contain the “numeric_value “ property, then you would get billions of values and objects. And it’s just really slow to keep track of all that.

And I think this also gets complicated when  you think about dynamic properties. Whereas with hashtags, because it's local, there's going to be a lot less objects that have that tag.

So on one hand it seems like there's some optimization benefits from keeping them separate and thinking about them separately. But on the other hand I feel like they're really similar in certain ways, and trying to make such a big distinction between them, will lead to these situations where you're like, “oh in this case should I use a tag or should I use a property”. So yeah I'm still trying to figure that out


### Recording 14

So uhh… a couple things...um, first off I hope this is recording I’m trying to use the audio recorder right now, but anyways, couple things about Arcana, is that, first off I realized that allowing you to define other objects properties inside a scope is kinda ugly. Like if you’re in foo’s scope, normally you would define all of foo’s properties, but if on top of that you can define one of bar’s properties it just looks kinda weird visually and I guess it kinda feels kinda weird. And second off, I realized that, this hashtag method where you can define a tag, add a tag, and then you can use a tag as a list of everything that had the tag added to it, it’s kinda like creating two-way bindings, whereas normal bindings are one-way. And then lastly, well no this is not the last thing, another thing is that I realized that cuz this hashtag method is so similar to state variables, you can basically implement it by using flag-watcher pattern on literally every object. But, I feel like, state variables was a mechanism we were adding on top of the object core of the language, but now, if we make it so you can tag anything you can modify stuff outside of its scope, etc, that feels more like a very comprehensive change, so I feel like just because we can implement it using flag-watcher pattern, we’re thinking about it differently, so I feel like that’s changing the core.

So I was tryna think about what differences it was actually making, and on one hand, at first I was like oh, one of the main differences is that if we restrict ourselves to the object core model, and you aren’t allowed to modify properties outside of its scope, you have to define all properties within the scope, it’s kinda like functional, and one of the things within functional is that you can’t really modify objects. If you want to like modify an object multiple times, like in a procedure like manner, you have to do it using continuation, aka pass the object from function to function to function, and each function modifies it, returns the new object, and then gives it to the next function. The thing about that, is that it has to be ordered, whereas if all of these functions could just modify the object without passing it from function to function, and each function can modify it independently, then it can be unordered.

So that was the first difference that I thought of, but now that I think about it, if we add the restriction that each of these modifier “functions” can only modify an independent property of this object (otherwise you would end up with that “overdefined” error), then the order doesn’t really matter. You could, instead of using this weird tagging method, you could just do it using the object core language, by, instead of passing bar to function A, then having A modify bar, and then passing it to function B, and then having B modify bar, and then also passing bar to C and having C modify bar, and etc passing bar to all these functions and having them modify bar, you can just invert it, so you can pass old bar to A B C D E and all these functions, and they return new properties of bar that you add to bar. Kinda hard to explain but basically like, instead of passing bar to the function, and having the function modify bar directly, you pass parameters to the function and have it return the output and then use the output to define bar. So it seems like you can get this unordered behavior using the object core anyways (without using tagging).

So I guess the main difference is that, with the tagging method, you don’t have to be aware of what modifications this other module is doing. You don’t have to be aware of what modifications any of these modules are doing. And on one hand, it’s kinda liberating, because the other module is free to do whatever it wants, you can modify the module and change the modules and scale the modules however you want, and you don’t have to worry about exactly, like, if you’re trying to construct bar, you can split it into parts, and you don’t have to be aware of what each part is doing. On the other hand, it makes it really lose, and almost feels like it’s spaghetti code. So I feel like this tagging method, is more like a procedural method of building bar. It’s like if you want to break up the definition of bar into multiple parts, and you don’t want to be completely aware of what each part does, and what properties each part defines, then you would use the tagging method.

Now that I think about it though, if you didn’t want to be aware of what properties each one defines, you could just have like, function A returns barA, function B returns barB, functions C returns barC, and then you just define bar to be the combination of barA barB and barC, like you just merge them, and that way you don’t have to be aware, but you aren’t using the tagging method. But I guess the tagging method doesn’t require you to do that merge operation, it looks a little cleaner maybe syntactically, but at the same time, it’s less explicit, because you’re not aware. Like, because you’re trying to be less aware of what each part of the procedure is doing to bar, it basically means that you aren’t aware of which parts of the program are modifying this object.

Like, if you only go with the object core method, then you pretty much know where exactly each part of bar is coming from, where each property is being defined from. But if you just allow any module to modify bar willy-nilly, then...like...bar can be passed around, you don’t where bar is being passed around, you don’t know which modules are modifying it, while it’s being passed around, you dont’ know what those modules are doing … it makes it really loose. And because of that, it lose a bit of encapsulation. In the object core method, you can pull out bar, and use it somewhere else, and it’s very easy to see like, if you pull out bar, you have to pull out functions A C and F, because those are the functions bar is using, and if you pull out functions A C and F, you can look into those functions and see what other functions you need to pull out. But if you use the tagging method, you pull out bar, but you aren’t sure what modules modify bar so you’re not sure what other modules you have to pull out. And you can make it so that the program _is_ aware, but, I feel like it starts getting really complicated.

Like, just allowing the tagging method, will give programmers so much freedom that they will just like, you know, modify bar in all these different places willy nilly, and internally, the compiler will have to keep track of all these places bar is getting modifies. It just gets really hair and tangled up. Whereas forcing people to use the object core method, will force people to be more structural. So in summary it feels like the tagging method is more imperative, and more procedure like, its like you can pass things around and throughout the procedure every piece of the procedure does something but you don't’ need to be aware of what that thing is. Whereas the object core method is structural, every object is aware of where it’s structure is coming from, and it’s very explicitly defined, what the structure looks like. 

Video Summary:

First thing I talked about was how it’s kinda ugly, defining other objects within a different object

Second thing I talked about was that, tagging is like two way bindings

Third thing I talked about was was how I thought it was like unordered vs ordered, but that’s not true because you can still kinda do unordered using the object core method

Finally I talked about how it’s more like imperative. Tagging is more loose, you don’t have to be aware of where each piece of the object is coming from, you don’t have to be aware of what each module is modifying. It’s very loose and procedural, whereas the object core is much more structural. You have to be explicit about the structure and where each piece is coming from. ANd because of that, I think that the object core has a bit more encapsulation, and the other method is a bit more like spaghetti code.


### Recording 16

First thing is that, I was saying how tagging is similar to state variables, but it’s actually different, because state variables are scoped. You can only modify a state variable within the scope that it was declared in, whereas if you allow tagging, especially tagging with normal global properties, where you can modify properties anywhere, then you aren’t restricted to any scope.

I was also thinking about how, I can make it so that, maybe you can only modify local properties. Like, if you want to do this dynamic modification, you can only do it for local properties. You have to declare a tag, and inside the scope it is being declared in, you can add that tag to anything. Why this is important, is that, it means that you have less to keep track of, because it’s very explicit of which tags are in each scope. Remember that idea of encapsulation and local properties where, if you move outside of a scope, then the properties that are defined in that scope, disappear. Like, if I’m doing a breadth first search, and I use the tag “visited”, once I finish the breadth first search and that module has finished and I’m outside of the module, then that “visited” tag is removed from all the objects it was added to. Because that tag and binding only exists within that module.

So the reason why this is important, why I should allow this dynamic property modification only to explicit local properties, is that, if I allow it for any property, including local properties, there are an infinite amount of global properties. Like that was one of the things I talked about in one of my earlier sections. You can think of global properties as a sort of “default”. If you’re using a local property, but it isn’t declared in the scope, then it’s almost as if you’re using this default, global property. And the subspace for global properties is infinite. Ok I needa explain that better.

So during the time I was trying to combine global and local properties, and I was basically saying that global properties were like default local properties. So usually for local properties you declare it, and then inside the scope it’s declared in, you use it, but if you use a property without declaring it first, then it basically goes into the global scope, and you are implicitly declaring it in the global scope. So because it’s like an implicit declaration, another way you can think of it is that this global scope contains every property that could ever exist, and so by default you are using these global properties. But if you declare it locally, then it will use that instead.

So if you think of this infinite global subspace that contains an infinite amount of properties, then it’s immediately understandable that you have an infinite amount of things to keep track of. I mean there are ways to make it so you don’t have to keep track of an infinite amount of things, but, it’s almost as if you are keeping track of infinite things, because you basically have to keep track of every single property in the program, and it’s just super inefficient. Whereas, for local properties, if we restrict dynamic modifications and dynamic bindings to local properties, then you have to explicitly declare each local property ,and so you only have to keep track of those. So if you’re inside a scope where there’s the tags “foo” and “bar” are declared, then in this scope you only have to keep track of where “foo” and “bar” are used. So like, whenever, each of these tags is used, you keep track of where it was used, what object it’s being used in, and that way, when you want to use the tags “foo” and “bar” you can  get all the objects that are tagged with them.

And regarding that encapsulation issue I was talking about earlier, if we allowed global properties to be modified anywhere, then if you try to pull out a module, then you have to figure out every module that modified that module that you are pulling out. Like, every property that the module contains, you have to figure out where those properties came from ,and you have to keep track of all of that.

Hmm I wonder if that’s that bad. I mean, say you display or print out an object. Well then you have to know all the properties of that object, to print it out, and if you know all the properties of an object, then is it that much more work to know where those properties come from? Hm…

Well anyways, regarding the encapsulation thing, I was trying to say that, if you only have to keep track of explicit tags, it’s ….let’s say you’re inside a scope, a giant scope, let’s call it “foo”. And you’re pulling out a module “bar” from inside the scope “foo”, and you’re still keeping it inside the scope “foo”, you’re just moving it around inside “foo”, then the only tags you have to worry about are the explicit tags declared inside “foo”. You don’t have to keep track of every tag, which is what you’d have to do if you allowed global property modification.

Another thing I noticed is that, if we do do this kinda explicit global property modification, it’s very very similar to just declaring a hashset and then just adding things to the hashset. I mean the breadth first search “visited” example is a very good example of this. Instead of tagging it with “visited”, we just declare a hashset “visited” and then we add each object to the hashset. And it behaves pretty much identical, which is interesting how that works out.

The only thing is, and I just realized this, is that, in a normal functional language, you wouldn’t be able to do that. You wouldn’t be able to just declare a hashset, and then inside the breadth first search, just add to the hashset, because you’re modifying the hashset So in a pure functional language, you would have to pass that hashset throughout the procedure throughout the breadth first search, whereas the method I’m doing using tags, you just declare it, and inside the scope you declare it in, you can just use it however you like. You can just use the tag however you like, and it’s like being able to add to the hashset wherever you like, without having to explicitly pass it in.

And if you extend this to global properties, if we were to allow global property modification, then it would be like creating a hashset for every single global property. So, earlier when we were talking about how like, “if you want to print out an object you have to know all of its properties and if you know all of its properties is it that much more work to know where each property came from”, and that’s basically what you would be doing is creating a hashset for every single property that’s being defined in your program. For every property and every object in your program, you have to create a hashset for it. But I wonder if we will have to do that anyways, for the dataflow to work out..but I dunno.

Video Summary:

First I talked about how state variables are scoped and this tagging method is not scoped (if I allow global properties to be tagged and kept track of as well). However, for this tagging, this dynamic modification, if I only allow it for local properties, aka explicitly declared tags, then there’s a lot less to keep track of, because you know exactly which tags you needa keep track of in each scope. Whereas if you allow this kinda dynamic modification for any properties including global properties, there’s technically an infinite amount of global properties being declared at once. It’s just a lot more to keep track of.

Though I was wondering, if I want to print out an object, then I have to know exactly what properties are in that object, and if I know what properties are in the object then I have to know where those properties came from, so I wonder if it’s that much more work to keep track of them anyways. Like maybe, for my dataflow interpreter to work, I have to keep track of them anyways, so I dunno…

Lastly, I was talking about the duality between hashsets and tags and how tags pretty much work like hashsets. The only difference is that, you can’t really use hashsets in functional, because you would be modifying the hashset every time you add an item to it, so you have to pass the hashset in explicitly, whereas the tagging method, the idea is that you don't have to pass it in explicitly, you can just add a tag. And as long as you only allow local properties to be tagged, then you know exactly what hashsets you need to keep track of. You’re basically explicitly declaring those hahsets, whereas if you allow global properties, you have to declare a hashset for every single property that’s being defined in the program.


### Recording 18

I realize that, I mentioned earlier (in my notes) how the hashset model for local variables, how similar it is to state variables. Because you can think if state variable as just like, an ordered versioning, whereas for like state variables, as long as you are in the scope that the state variable is declared in, you can add a modification to that state variable, within that scope. Whereas for tagging, as long as you’re within the scope that the tag is declared in, then you can add a new tag, and you’re basically adding a new object to that hashset. And the difference being that when you add an object to a hashset it’s unordered, when you add an object to a list (like state variables do), then it is ordered, and you have that index associated with it, for the state variables.

Another thing I’ve been tryna think about is, if I try to allow global properties to be dynamically modified, that means that it implies that for every single property for every single object I’m gonna need a hashset associated with it. And I was wondering, how does dynamic bindings and modules fit into that. Like say I have an IF statement, eg I only add a property to some object if some condition is true, and if the condition isn’t true then I don’t add the property. Then, how does that look, in the hashset model/ implementation.  How does it compare to if I didn’t allow for dynamic modification of global properties. Would I save any memory at all?

Video Summary:

First off, state variables are kinda like tags, except, the modifications are ordered, whereas for tags the modifications are not ordered. As in if we think about tags as hashsets, then if you add an object to a hashset it’s unordered.

Second, if we were to implement dynamic modification of global properties, by basically adding a hashset to every single property defined in the program, how much more space would that take up? How would dynamic bindings, like IF statements, fit into that? How would that be implemented? Would it affect the implementation at all, is hashsets all we need or do we need something extra to account for dynamic bindings I dunno…


### Recording 20

One thing I was thinking about was that, in Cono, when you create a tag, say you find a song and you tag it “Taylor Swift”, you have the option of making the tag private or public. And if you make the tag private, it kinda works like Arcana, in that it will declare a tag “Taylor Swift” that is in the scope of your “identity”, your private scope, in essence. So any private playlists you make, you can filter by this new “Taylor Swift” tag that you’ve declared within your own private scope. If you make it public it declares this “Taylor Swift” tag inside this global scope. And so by the same token, in Arcana, you can make dynamically modifiable global properties, by doing the same thing. So any time in Arcana you declare a property, it will just implicitly create this tag in the global scope. And we kinda talked about this before

What I’ve been thinking about recently, is that I guess that kinda works for Cono, because every tag that people make in Cono is meant to be used in some fashion...lemme explain that better. In Arcana, I feel like there’s a lot of properties that are used for temporary purposes, like temporary intermediate variables, and those shouldn’t be slowing down the interpreter, creating these giant hashsets in the global scope. Like I feel like those should just be tied to the local definition. In addition, I feel like there's a lot of properties that are meant to be local scope, like tied to the object. Take RGB for example, if you have a “color” object, and it has the properties “r, g, b”, you don’t want to create the hashset “r” “g” and “b” in the global scope because “r” could mean something completely different in a different context. So it doesn’t make sense to create this global hashset “r”. This “r” property only makes sense when it’s tied to this “color” object. 

Though I  just realized that, one thing is that you can make it so that it’s lazy evaluation, so that it only declares a global hashset if you’re actually using the variable modifying it outside of it’s declaration scope...actually you don’t need that global hashset unless you’re actually using it as a hashset. Like if you’re just modifying it outside of it’s scope, that doesn’t mean that you’re going to...For example, for the color “r” property, if you're passing this color object around and modifying the color “r” “g” and “b”, that doesn’t mean that somewhere in the program, you’re going to try to look for all objects that contain this “r” property. So...gonna have to think about that more...


### Recording 21

I was thinking about how I realized that the #visited tag for the breadth first search is a little special, because it has to be ordered. It’s more like a state variable, like an assignment, than it is like a normal tag. Like if you kinda just work through it, if you treat it like a normal tag, then all of them will be visited and then none of them will be visited….uhh it’s kinda hard to explain, but umm...like there has to be an order, when you do your breadth first search. So you can think of it as a sequence of states. Like, regardless of whether or not you think of #visited as a hashset or #visited as a tag, there is a sequence of states.

So in the beginning (I’ll just treat it like hashset), so in the beginning, the hashset is empty, and then you visit your first element, and then the hashset contains one element, and then you check against the hashset, then you go to your second element, you check against the hashset...and you also have the queue too...so you have your queue, and your hashset, and you add your first element to the queue, and then you pull an element from the queue and check for its neighbors, and then add all its neighbors to the hashset and the queue, and then you pull another element from the queue, first check if it’s in the hashset, and if it’s not, then you find it’s neighbors...but basically, this adding to the hashset and checking against the hashset, it’s state based. There is a sequence of states for this hashset, and so you can’t just use normal tagging. So you have to combine state variables and tags. And even if you think about it not in terms of hashsets but in terms of tags, like, for any given element there’s a certain state in which it got tagged. So say, for the first five steps, you checked it, and it wasn’t tagged, and then on the 6th state it did get tagged, then every subsequent check after that, it will see it as tagged.

So I was thinking about state variables, and I was thinking like, I’m not sure if I mentioned this before, but I think the way state variables works right now, feels very low level. Kinda like how pointers work in C++. It’s very powerful, yeah, but at the same time, it feels like the programmer has to deal with stuff that he shouldn’t have to worry about. So I feel like I have to do what Java references did to pointers, which is, I have to create a system, and it has to be intuitive, so that once the programmer learns the system, they don’t have to worry about it anymore.

First I was thinking, maybe I should make regular variables distinct from state variables. And I can do that by having like a dollar sign “$” in front of state variables. And also I was thinking about how like, if you’re assigning to a variable in a certain scope, then any references to that same variable, must be a reference to the previous state of the variable. It’s not just a normal reference, its a reference to the previous state. Because if you think about it, if you’re assigning to a variable, but then you’re referencing its current state, it’s very easy to end up with feedback. I guess the idea is that, if you're assigning to a variable, then you’re basically treating the current scope as a “state” or “execution”, instead of as a persistent binding. SO in that case, you should be treating any reads to that variable as a “read previous state”

And then I was starting to think, that’s too simple, because let’s say you have a reference to “foo” in the current scope, and you want to treat it as a reference to the previous “foo”, because you are assigning to “foo” in the scope. However, you’re doing it indirectly, you’re calling a module that does the modification to “foo” for you. Like, there’s an inner module, that modifies “foo”, and because of that, your reference to “foo” should be a reference to the previous “foo” and not a normal reference. And so, I was thinking the way you can indicate that, is that, if you ever have a module that treats one of its inputs as a state variable and modifies it, then, when you call that module, and you pass in an input to be treated as a state variable, then you’re basically assigning to it. It’s the same thing as assigning to it. 

And I was thinking there should be a distinct color for when you’re treating it as a state variable, and that color basically indicates that you have an index associated. I’ve talked about indexing and versioning before. And basically you have a special color, a syntax highlight, for whenever you’re using that index. So that would be whenever you’re assigning to it, or whenever you’re reading a previous state of that variable. I’m not explaining this well, but it’s all in my head...so when I write it down...it should be better...I’ll give some examples to explain it better.

And then I was thinking, maybe I should create distinct modules...like you’re either in a persistent-binding module or you’re in an execution module. And this is basically like the sequential logic vs combinational logic blocks of Verilog. And I’m starting to realize why they had that, because if you try to combine them, it gets really confusing. It’s better to keep them separate. Or is it…

One last thing. I realized that, if I want to create a system, such that you don’t ever need to manually reference the index of a versioning/state variable, then I’m going to have to account for recursion as well. Because often instead of a for-loop, you’ll use recursion. So I’ll have to add some system that implicitly keeps track of the index of a recursive call. And that’s going to be complicated. I guess maybe it will use a call-stack or some notion of a call-stack, because I’m basically gonna have to figure out how I’m going to order recursive calls. Does it execute the current scope first and then it executes the inner scope…? That’s probably what it’s going to be...but that’s all I have for now.

Video Summary:

I was basically talking about, first I was talking about tagging and state variables and how breadth first search uses both.

Then I was talking about how state variables is too low-level right now and it’s kinda like C++ pointers, so I should create a system for it.

Then i was talking about how, maybe I should use a distinct syntax for state variables, like I should precede all state variable names with a dollar sign, keep them separate from regular variables.

Then I was talking about how, the way I determine whether a reference to a variable references it’s current state or it’s previous state, is based on whether or not there is an assignment to that variable in the current scope.

But that’s not good enough because maybe, you are calling a module that does the assignment, and in that case, you still want to treat that variable as a state variable, so I think there should be like a syntax color, highlight color, to indicate whether a variable is being treated as a state variable or as a normal variable.

And how do I deal with recursion and state variables.

Like basically, how am I gonna build this system? Should I separate sequential logic from combination logic, like Verilog?


### Recording 22

Oh yeah, I totally forgot to mention one thing. A good example of a property that you do not want to treat like a tag, is “results”, eg “search.results”. If you were to treat that as a tag, it just doesn’t really make sense, and the reason why is that certain properties rely on the context, like they don’t make sense without the parent context.

Whereas if you were to do something like “car.color”, color is like a tag that could be like a global tag. Like you can see how color has a very distinct meaning, no matter where you are in this program, whereas “results” is very context specific. So I think by default, variables should be context specific, and then if you ever declare a tag, then that’s where it starts becoming context agnostic.

And something to notice is that I think it’s not too hard for like, if you start with a context-specific property, for example if you have “car.color” but you just made it a regular property not a tag, I think it shouldn’t be hard to convert it to a tag. All you need to do is attach the #color  tag to the property, and you can now treat it as a tag...I think


### Recording 23

First off, I think the way that state variables work, I guess one core way you can think about it, is that, whenever you want to assign to the same variable multiple times, you’re going to have to define an order, in which these assignments occur. And I guess that’s the core concept of a state variable. Usually when you assign to the same name, like you have multiple modules/scopes that use the same name for a property, it just shadows the previous scope’s property. But with a state variable, you declare a variable, and every time you define a property with that name, instead of just shadowing the previous property, it actually reassigns a value to the variable. And there has to be an order to that.

And I guess one key difference between the way OCaml does these state variables and the way I’m doing it is that, functional languages like Ocaml have this natural order. When you do recursion and stuff you have this call stack. Whereas my language, I don’t have that, so I have to define it. Like, because it’s object based. I don’t have return statements. In a functional language, you call a function, and then that function calls another function, and then returns a value, and stuff like that, and there’s like a natural order to it...I don’t really have that, so I have to define it.

And I was thinking maybe I could have a keyword “then”, so inside a scope, I could have a bunch of properties, and then I could just say ‘then” and then give it another scope, and it will execute that scope after the current scope. Or maybe I could have a property “do” and you give it a list of things to “do” in order...yeah I’m still thinking about it


### Recording 24

I just wanted to quickly record that, one example that I think I should really think about when it comes to state variables and recursion, is permutations. How would I code that out, how should it look in my language?


### Recording 25

So I’ve been thinking, going back to global property modification, but not necessarily thinking about it that way, just thinking about like, within a certain scope, defining a different scope’s properties. And I guess the mindset behind that would be, creating bindings, which is the title of the section where I first talked about this. Which is basically the idea that, instead of defining a structure directly, like what we do right now, instead you use a structure to define a different structure. 

You can think of the first structure as like a procedure, and you run the procedure, and when this procedure is done, you end up with a second structure. Like the job of this procedure is to define these nodes and to create these edges between the nodes so that at the end you’re left with a nice structure. And you can module the first procedure as a structure too. So you’re basically using one structure to define a different structure, and it’s a very indirect way of creating structure. But in a way it’s also more flexible.

So the question is whether or not this is intuitive, or useful. Because, you can still use the current method to define any structure.

So I was trying to think of examples. So one example would be like, if you wanted to have a module that takes in a list of numbers, and then creates edges between those numbers such that you end up with a heap. So you could call this module “createHeap”. Now you could do this using the current model: instead of creating bindings between the original numbers, it just outputs a heap using copies of the original numbers. I guess you could model the creation of bindings, by simply outputting a copy. Kinda like how in functional languages, you can’t modify objects but you can just output an object with those modifications.

But I guess one case I was thinking about where it could be useful, to modify instead of output, is if you’re in this complex structure of all these different behaviors, and there’s one module inside this giant spaghetti of structures, and this module calculates this important number that’s used by a bunch of different modules inside this giant structure. So basically what it would look like is, maybe this module is called “foo”, and “foo” calculates this number “bar”, and inside this module “foo” you basically say “Bob’s color is bar”, “Alice’s car is bar”, “Joe’s food is bar”, and you basically take a bunch of these objects throughout the structure, and bind them to bar.

But there's another way you can do this, using the current model. In the topmost scope, you set bar equal to foo’s output, and then inside the scope of Bob and Joe and Alice, you can just use “bar”, because “bar” is now inside the outermost scope. So it feels like it could be resolved with just like, a scope inversion, but...I dunno.


--------------------------------- End of Audio Notes (Transcribed) ------------------------------


### Examples of Indirect Binding?

In the audio we talked a lot about dynamic property modification aka indirect bindings
where we would want to use one structure to construct/modify the bindings of another module
but any examples where we would actually want this?

maybe something like

first part {
	a[bla] = b
	...
}
second part {
	b[bla] = d
	...
}


### State Variables vs Imperative Variables

hmm state variables are very similar to normal imperative

state variables:

	scope:
		foo.
		x: // can modify stateVar anywhere in "scope"
			foo := 10
		modifyVar(foo) // can also call function and modify state var inside

javascript:
	
	function scope () {
		var foo
		function () { // can modify stateVar anywhere in this scope
			foo = 10
		}
		modifyVar(foo) // can also call function and modify state var inside
	}



earlier, we talked about how tags are like state variables
	// TODO: this^^^ is referring to our audio notes (transcribed), after I re-organize those notes, update this with a proper section reference
and also why tagging (and dynamic modification) should be restricted to local scope, like state variables
we also started exploring the differences between state variables and javascript variables
after all, with javascript variables, you also declare them in a scope, and use them in the scope
maybe the difference is that in javascript variables, you can still modify that variable anywhere, if you pass it around

actually, it seems like you can do something similar for state variables as well

	foo:
		bar:
			stateVar.
		zed:
			x: foo.bar.stateVar
			x := 10

but recall that hierarchal scope is just an approximation

for local variables, it seems like you can "extend" them out the scope by passing the private key to a different scope

but what does this mean for encapsulation?


also, maybe tags and state variables and hashsets are all the same thing, all based on the versioning/implicit index concept, and you just need to declare the type at the beginning to determine how it behaves
if its state variable, then it treats each entry as an ordered version
if its tags, then it treats each entry as a different set item

### Imperative Variable Modification - by reference vs by value

anytime you have a variable, modifying the variable can mean two things
	1. modifying the reference/pointer
	2. modifying the value
note that the second option will modify the value seen by all variables referencing that value, whereas the first option will only modify the variable in question

C++ makes it so that for any pointer, you can modify both the pointer value, or the value at the pointer
but it gets complicated because you have to constantly keep in mind whether or not you want to modify the pointer or value

java/javascript makes it simple
by default, everything is a reference
if you want to modify a "value", you wrap it in an object, or use the object's internal methods

### Datastores

we can liken state variables to the Solid/Inrupt datastores model
in fact, **we're going to call state variables "datastores" now, for conciseness**
you "set" a new value to the datastore (like adding a new state to a state variable), and all the dependencies are updated
in addition, scope doesn't matter
	remember, scope is just an approximation, a system for modeling tree-like structures
	but you should be able to modify a datastore from anywhere, not just restricted to tree-like structures
note the difference between modifying a regular variable, and modifying a state variable (aka pushing a new state)

	x: 10, y. := 10 // a regular variable and a state variable
	moduleA:
		myX: x
		myY: y
	moduleB:
		myX: x
		myY: y
		for cick in mouseClicks:
			myX := 20 // modifies the reference, won't affect moduleA
			myY := 20 // modifies the value, will affect moduleA

I guess you can think of the `y. := 10` declaration as `y: (0: 10)`
so instead of creating a direct reference, you wrap the value in an object
so that anytime you modify the value, all references to the wrapper object see the change

it's a little weird for `x` though
should we allow references to change like that?
to "change a reference", we are actually modifying the outer object
so in this case, we are actually modifying `moduleB`
it's equivalent to something like `moduleB := moduleB(myX: 20)`

it doesn't really feel right though
means that `:=` will modify different things depending on if its a datastore or not
	1. if it's a datastore, reaches inside the variable and adds a revision
	2. if it's not a datastore, modifies the containing module, adding a state

I think we should restrict data modifications to datastores
so if you want to be able to modify a variable, you have to declare it as a datastore
otherwise, it's a static reference

regular variables are defined by relationships, eg `x: a+b`
datastores are defined by a sequence of modifications, like datastores

i guess the reason why it seems like we can merge regular variables and datastores
is because regular variables can be viewed as just datastores with just one state
as long as you don't modify it, it acts like a regular variable


notice that the way datastores work, is when you modify them, everything using that datastore sees the change
it's the opposite of Java/javascript, where when you reassign a variable, it just moves the reference
so it seems like datastores are like a "value modification" system
opposite of Java/JS, which uses a "reference reassignment" system

so if you wanted to do reference reassignment, you have to modify the value of the containing object
in Java, to do modification you reach inside an object, whereas in Arcana to do reassignment you reach outside an object

so let's try some typical javascript/java examples and see what happens:

	keytracker.
	lastPressed.
	onKeyPress: key >> // this is how I'm declaring inputs for now
		keytracker[key]++
		lastPressed := key

that seems to work as expected...like how Java/Javscript would work as well
what about adding/modifying properties?

	foo.bar := 10

hmm this would probably work the same as well...
how are these JS/Java examples working if Arcana uses modification instead of reassignment?

I think the difference comes about in an example like this:

	lastPressed.
	lastPressed2: lastPressed
	player1Input: key >>
		lastPressed := key
	player2Input: key >>
		lastPressed2 := key

there are a few things we can observe from this
first, let's assume that, in the beginning only player1 presses a few keys, after which player2 presses a key
in the beginning, when player1 is pressing keys, `lastPressed` will change
	and `lastPressed2` will mirror that change
		this is value modification behavior, and behaves differently from the Javascript equivalent, where `lastPressed2` would not change
however, once player2 presses a key, `lastPressed2` will stop mirroring `lastPressed`, and will now be assigned to `key`
	this is more like reference reassignment, and behaves the same as the Javascript equivalent

to be clear, this is what I'm referring to as the javascript equivalent

	lastPressed = null
	lastPressed2 = lastPressed
	player1Input = key =>
		lastPressed = key
	player2Input = key =>
		lastPressed2 = key

these observations reminded me of an important rule: data binding should act the same as continuous re-evaluation
if we add a revision to `lastPressed`, that doesn't change the binding of `lastPressed2`
remember that revisions are persistent too, so if we add a revision, and re-evaluate the whole thing, `lastPressed2` will reflect the revised value of `lastPressed`
however, when we add a revision to `lastPressed2`, it doesn't point to `lastPressed` anymore

this shows that, state variables don't really work via "modification" or "reassignment"
it depends on what your variable is bound to
`lastPressed2` is bound to `lastPressed`, so changing `lastPressed` will change `lastPressed2`
but changing `lastPressed2` won't change `lastPressed`

compare this to javascript, where reassigning either `lastPressed` or `lastPressed2` won't affect the other variable

### Defining How State Variable Work

* every variable is a state variable, a datastore, a node in a graph
* variables are declared using `:`, and given an initial value
* when you use the modify operator, `:=`, you add a revision to the variable
* any variable that references that variable, will see the updated binding

* remember that `:` and `:=` define bindings, continuous evaluations
* the LHS (left-hand side) contains a variable, the RHS (right-hand side) contains an expression
* the binding will continuously evaluate the expression, getting the current value of each variable in that expression
* the result of the evaluation is given to the LHS variable

* notice the distinction between updating a value and updating a binding
* bindings are continuously evaluated, updating the value of the LHS variable
* the modify operator, `:=`, is for modifying a binding with a new binding

### Comparison with Imperative Re-Assignment

in imperative languages, assignment works a little differently
instead of creating a binding, with continuous evaluation, an assignment is a single evaluation
it retrieves the current value of the RHS expression, but does not check for updates

if we look at the Arcana example below:

	lastPressed: undefined
	lastPressed2: lastPressed
	player1Input: key >>       // event listener
		lastPressed := key
	player2Input: key >>       // event listener
		lastPressed2 := key

if `player1Input` is triggered, then both `lastPressed` and `lastPRessed2` are updated
`lastPressed2` is "bound" to `lastPressed`, almost like it has a reference to it (in imperative terms)
`lastPressed2: lastPressed` binds `lastPressed2` to a reference of `lastPressed`
changing `lastPressed` will change `lastPressed2`
but changing `lastPressed2` won't change `lastPressed`

on the other hand, take a look at the Javascript equivalent:

	lastPressed = null
	lastPressed2 = lastPressed
	player1Input = key =>       // event listener
		lastPressed = key
	player2Input = key =>       // event listener
		lastPressed2 = key

the `lastPressed2 = lastPressed` is an assignment, and extracts the value of `lastPressed` and gives it to `lastPressed2`
unlike the Arcana version, in the Javascript version, the reference to `lastPressed` is not preserved
if `player1Input` is triggered, only `lastPressed` is updated
and changing either `lastPressed` or `lastPressed2` won't affect the other variable


actually, I think the main reason for these differences is because, in javascript, when you do something like `foo = 10, bar = f00`,
you are making `bar` point to the value of `foo`, not `foo` itself
this makes it so the example is equivalent to `foo = 10, bar = 10`
`foo` and `bar` point to the same thing

for state variables, on the other hand, if you had `foo: 10, bar: foo`, `bar` actually points to `foo`
goes back to the "alias" pointers idea
it doesn't "evaluate" the value of `foo` and make `bar` point to the same value
it just makes `bar` point to `foo`

this is why, in javascript, if you change `foo`, it doesn't affect `bar`, whereas with state variables it does
this is also why, with state variables, the order in which you bind variables matters
eg `foo: 10, bar: foo` is different from `bar: 10, foo: bar`
whereas in javascript, `foo = 10, bar = foo` is the same as `bar = 10, foo = bar`

### State Variables - Manual Ordering

we talked about earlier how, in regards to updating a state variable, working with the `index` property feels a bit too low-level
	// TODO: this^^^ is referring to our audio notes (transcribed), after I re-organize those notes, update this with a proper section reference
the `index` property is part of the internal mechanics of state variables
shouldn't be exposed to the user

instead, we can define the "revision order" of a state variable in a different way
just create a list of your revisions, with the order you want
	using `push` and `shift` and other list operations
then do a for-loop on that list, applying each revision to the state variable
internally, the for-loop will transfer the indices of the list ordering to the state variable

this is sort of like how Java/Javascript avoids the complications of pointers
	where, instead of making the programmer deal with pointers and other "internals", they define some high-level rules about references, and if you want to work around it, you have to use high-level structures, wrappers
	eg if you want to allow multiple functions to modify a shared value, you pass around a wrapper, `foo = { bar: null }`
	and each object goes into the wrapper to modify the value, eg `foo.bar = 10`
instead of hacking internals, we leverage an existing structure
instead of modifying the internal index property, the programmer creates a high level list structure that explicitly defines the order

### Local vs Private

note that with our current model, even though we have local properties, we still don't have private properties

	foo:
		bar.
		[bar]: 10

even though `[bar]` doesn't show up when you do `foo.allProperties`, you can still do `foo[foo.bar]`
and `foo.bar` shows up under all properties

but if we think about modules like private modules in Cono, then there is definitely information that you want to keep private

the way local properties worked was that, because objects are given a unique id (kinda like a memory address), we use that unique id as a key
and the interpreter knows to hide it from the `allProperties` property

but if the unique id is just some random number, how would the interpreter know that it's supposed to hide it?
as opposed to like, a normal property like `foo(10: "hello")`?

perhaps the way it works is that, properties that have strings/numbers as indices are visible in `allProperties`
but object keys are treated in a special fashion
it's not the same as a numerical key

thus, to create a private property, we can just use an anonymous object as a key, something like `[()]: 10`
this wouldn't be visible from the outside
however, this isn't accessible from the inside either, making it useless

maybe we should use some notation for private variables, like `$foo: 10`, which basically creates an object with an anonymous object as a key
within the same scope of `$foo`, we can use `foo` to reference the local/private variable
note that this requires changing the way references work a bit, because before, `foo` is the same as `["foo"]`, but clearly that won't work for private variables


what about modifying state variables? where can you modify them? where can't you?
if we think about datastores, if Bob owns a datastore, it's weird for anybody to be able to modify it
instead, you should either access it by API (and Bob has to accept your modifications), like state variables
or maybe if you have a special key, then your allowed to modify it, like local variables


can we use local properties instead of `_return` for functions?


how do state variable work with private/local properties?

### Arcana is now Entangle

* Arcana is now called Entangle!
* "Entangle" both captures the mystical vibe of "Arcana", and also the data binding features of the language
* last name change I promise


### Function Scopes Mechanics Brainstorm

state variables and functions that modify state?

whats the scope inside a function? what takes precedence? is it the source scope? or the target scope?
for reference:

	// source scope
	myFn: x y >>
		z: 10
		=>
			foo: x+y+z // target scope

scopes is approximation
that means
anything achievable through scopes has to be achievable through other means
so what does that imply in this case...?

### Modifying State Variables Outside of Declaration Scope

note that our rules for state variables
actually make it impossible to modify state variables outside it's declaration scope
even if it's "passed around"
because when you're passing in the state variable into other modules, you're just defining an alias for the state variable
and you will just be modifying an alias of the state variable

	foo:
		stateVar.
	bar:
		increment(input: stateVar) // notice that you are creating an alias to stateVar, so the alias will be incremented, not stateVar

this gives it a sort of read-only behavior outside of it's scope

### Shared Variables and Scopes

so how do we make "shared" datastores?
Bob has his scope, Joe has his scope
Bob and Joe are both part of the dance club
we want a variable that Bob or Joe can modify

tagging?

we talked about how tags are like hashsets
	// TODO: this^^^ is referring to our audio notes (transcribed), after I re-organize those notes, update this with a proper section reference
in fact, we can model "shared" scopes using hashsets as well
just create a "Group" with Joe and Bob inside
and then create the datastore in the group
and this is just like tagging Joe and Bob with some "#danceClub" tag

however, it's not quite the same as what we were trying to achieve
see the example code below:

	People: // a set of people
		Joe: (name: "Joe")
		Bob: (name: "Bob")
		Alice: (name: "Alice")
	DanceClub:
		songRequests.
		members: People.Joe, People.Bob

how do we give Joe and Bob the ability to modify songRequests?
maybe a module that we attach to Joe and Bob, that is within the DanceClub scope?


we want the behavior and properties of things to be context dependent
eg, if we are in the DanceClub context, and we ask for Joe's ID, we are probably asking for his member ID
whereas, if we are in the context of, say, a nightclub, and we ask for Joe's ID, then we are probably asking for his state-issued ID
this is beginning to look like tags

groups and permissions are a hierarchal structure, DAG (because doesn't make sense to have cycles)
whereas the core of our language is based on relationships, so it can have cycles

this implies that permissions/groups are a system we have to build on top of the base language
kinda like functions, or a type system

however, it will affect tagging and our concept of scopes

### Shared Scopes and Indirect Bindings / Submodules

maybe we can make an indirect binding, create a property/submodule of Joe inside DanceClub's scope
that way, the submodule has access to DanceClub's scope, and the internals are dictated by DanceClub
but Joe can still access the external api of the submodule, and clone/use/access it however he wishes
something like:

	DanceClub:
		songRequests.
		People.Joe
			#requestSong: song >>
				songRequests += song

the `#requestSong` action is defined inside `DanceClub`, so `DanceClub` has the power to allow certain users to request songs
hmm, but what if we wanted to request `songRequests` from the scope of `Joe`?
	notice how currently, it's still private to `DanceClub`
after all, `Joe` is a member, so he should be able to see it from his own scope
but we don't want non-members to be able to see it

another example, is if `Joe` is part of a bunch of clubs, each with a different member id assigned to him,
and we want a private `Joe.allMemberIds`, so that Joe can get a list of all his member ids
if we did something like

	DanceClub
		People.Joe (#memberId: 145131)
	MusicClub
		People.Joe (#memberId: 194)
	SoccerClub
		People.Joe (#memberId: 49110)

the benefit to declaring them in the scope of each club, is that the `memberId` properties don't collide
the downside is that `Joe` can't see them, so `Joe` would not be able to create the property `Joe.allMemberIds`

also, we mentioned earlier that groups and permissions are DAG structures, so they don't really fit in with the general object model
however, if we think about it in terms of context, it kind of makes sense
for example, if we just did `Bob.memberId` from some random context, it doesn't make sense
it only makes sense if you ask for `Bob.memberId` from the context of a club, like the dance club or the music club (which will each give a different member ID)
your context determines what information is available to you

another example:

	President.secretLaunchCode = 134829
	randomCitizen.secretLaunchCode = undefined

however, you could still do something like

	randomCitizen.myPresident.secretLaunchCode

### Secret Keys

maybe just use secret keys to hide properties, eg `President[secretLaunchCode]`
you can pass the secret key around
we can extend the `#` local variable notation, eg `Bob.DanceClub#memberId`

in fact, maybe you can even use yourself as the key, eg `DanceClub[Bob]`, and it returns everything in the Dance Club pertaining to `Bob`
though what if Joe has access to `Bob`, and does `DanceClub[Joe.Bob]`...

we have two options
make data private, or make properties/references private
to make data private, we would keep a list of authorized users with every piece of data, and anytime you try to access the data, it cross-checks against that list
to make references private, we can either
	keep a list of authorized users with every reference/property, and when you try to access the property, it cross-checks against the list
	use objects as private keys

I think it's better to make references private
that way, we can have cases where, Bob might not be able to access "secretValue" through one route, but could access it through a different route
	like if Bob didn't have `secretKey` so he can't do `Bob[secretKey]`, however, he has access to Joe, who has direct access, so he can do `Bob.friendJoe.secretValue`

maybe the `#` local variable notation is shorthand for a system for checking if the current scope has access to the secret key
	eg if Bob does `DanceClub#memberId`, it checks if `Bob` has access to Dance Club

maybe we can actually just use `.` for everything
don't differentiate between local and public variables
all based on access permissions
when somebody tries to access `DanceClub.memberId`, it checks if they have access to that key

though recall the reason why we made the distinction between local and public properties in the first place
	talked about in the previous section "Global Symbols II"
it starts getting messy if we treat `foo.bar` as `foo[bar]`
because `foo.bar` is commonly thought of as a way of accessing the property `foo["bar"]`, but if we happen to declare a local property `bar`, it uses that as the key, which is counter-intuitive
example:

    foo
        bar: 10
    zed
        bar: 20
        x: foo.bar + bar

the `x: foo.bar + bar` will actualy turn into `x: foo[bar] + bar` => `x: foo[20] + 20` => `x: undefined + 20`, which is really counter-intuitive

though it seems like this is more a matter of local properties
but in terms of private vs public, we can still use `.` for both, and check access
for example, you declare `memberId` as a secret key inside DanceClub
and pass that secret key to club members, like Joe
and if Joe asks for `DanceClub.memberId`, then because he has access to `memberId`, then he can access `DanceClub.memberId`

though this is still to vague and general
how do we "pass around" the secret key?
is "access" the same as just being able to traverse the graph to get to it?
	eg, for `foo: (bar: ()), zed: (secretKey: 10)`, do we say `zed` has access to `secretKey` but not `bar`?

### Separating Referencing and Scoping

references and scope are actually distinct things, even in javascript

	foo: 10
	bar: foo // this creates a reference/property
	zed:
		inner: // this creates reference, and also leverages scoping
			x: foo+1

we can already easily make references without scope
just declare everything at root level
once we start nesting object definitions inside other object definitions, we start introducing the idea of scope

now what we want is scoping without creating (public) references
have `DanceClub.members` visible to `Joe` and `Bob` (aka in their scope), but not accessible publicly
this is useful even when we don't want a "shared" private variable, and just want a local private variable

what we basically want, is a way to "redefine" an object within another scope
this is easy to see in diagram syntax:

	 _________
	|         |
	| A    ___|_____
	|_____|_x_|     |
	      |       B |
	      |_________|

object `x` can see an interact with both scopes `A` and `B`
typed syntax is harder
we might have to do some sorta double definition, something like

	A:
		#x:
			// can access scope A and scope B
			foo: A.length + B.length
	B:
		#x:
			// can access scope A and scope B
			foo: A.length + B.length

when "redefining" an object, maybe we should keep each definition separate
because different scopes might use the same variable names
you can run into stuff like:

	DanceClub:
		members: ...
		Joe:
			clubMates1: members // this should reference DanceCLub.members
	FilmClub:
		members: ...
		Joe: // separate definition
			clubMates2: members // this should reference FilmClub.membmers

in addition, if we have separate scopes for each definition, should we allow name collisions
for example:

	DanceClub:
		Joe:
			memberId: 13543
	FilmClub:
		Joe: // separate definition
			memberId: 8591

but then, if we use `Joe.memberId` in some outside scope, which definition should it pull from?


maybe a single definition, but you have to be explicit when using variables from multiple scopes

	DanceClub:
		members: ...
		Joe:
			clubMates1: DanceClub.members
			clubMates2: FilmClub.members
	FilmClub:
		members: ...
		Joe: // cloned definition
			clubMates1: DanceClub.members
			clubMates2: FilmClub.members

note that the IDE will automatically duplicate the definition when you "expand" the definition of `Joe` in `FilmClub`
in addition, the IDE will truncate references depending on the scope

	DanceClub:
		members: ...
		Joe:
			clubMates1: members // truncated by IDE
			clubMates2: FilmClub.members
	FilmClub:
		members: ...
		Joe: // cloned definition
			clubMates1: DanceClub.members
			clubMates2: members // truncated by IDE



note that, now that we are allowing scopes to intersect and such, it's no longer a hierarchal tree model
scopes can now represent a DAG, and maybe even a cyclic graph (though cycles wouldn't be very useful)
scopes would not be just an approximation anymore!
but rather, a way of defining private scopes


one problem is that, code can get too long
maybe we can use satellites

	Joe:
		favoriteSong: poopityScoop
		danceClubMembers: #DanceClub.clubMates
	DanceClub:
		members: ...
		songRequests.
		#Joe
			clubMates: members
			songRequests += parent.favoriteSong // "parent" refers to Joe
	FilmClub:
		members: ...
		#Joe
			clubMates: members

this takes care of quite a few of our problems
we define a main controller, in this case `Joe`
and then in the auxilliary contexts, we define new objects, and use `parent` to interact with the main controller
note that we are leveraging feedback, because we can access the satellites from the main controller, and also the main controller from the satellites
we also don't have name collision to worry about
we also don't have to worry about scope precedence, because the satellites only use the surrounding scope, and have to use `parent` to interact with the main controller
this also doesn't require much extra features in our language????


maybe we can use something like imports

	Joe:
		import DanceClub as danceClub
		import FilmClub as filmClub
		clubMates1: danceClub.members
		clubMates2: filmClub.members

though in DanceClub and FilmClub they'd have to specify that "Joe" is authorized to access their data...

### Input Order and Default Inputs

in earlier sections, we talk about input order and default inputs
	see section "Implicit Inputs and Default Values"
sometimes we want to have "inputs with default values"
	aka a variable with a value, but also declared as an input, so it is included when mapping anonymous arguments
we can do it like so:

	callFunction(a b c >> c: 10 => a+b+c)

however, it's a little uglier than the javascript method, `callFunction((a, b, c = 10) => a+b+c)`

so maybe we can copy javascript and allow default values in the input order declaration

	a, b, c: a+b >> d: a*b*c => d*d

we also noted that it's still a little ugly, because now we can have properties on both sides of the input order operator

maybe we can make implicit inputs include defined properties
aka, implicit argument mapping applies to bound variables, and not just unbound variables
aka, the implicit input order is just the order in which new symbols appear in the scope (both bound and unbound)
so if you had

	foo:
		a, b, c: 10, d
	bar: foo(10, 20, 30, 40)

then the mapping makes `bar` equivalent to `foo(a: 10, b: 20, c: 30, d: 40)`
notice how `c` got included in the mapping, even though it's a bound variable

if you want `d` to be mapped after `b` (like it would be if we only mapped unbound variables), we can simply do

	foo:
		a, b, d, c: 10
	bar: foo(10, 20, 30, 40)

if you want to change the order that variables are declared, without changing the mapping order, then you have to implicitly declare mapping order

	foo: a b c d >>
		a, b, c: 10, d
	bar: foo(10, 20, 30, 40)

it might seem like we have the same problem, because there's still those possibly-redundant `c` and `c: 10` declarations that could possibly be grouped into one declaration
however, the ugliness is really only a problem when declaring inline functions
but now, we can just mix inputs and inputs-with-default-values when declaring inline functions, to declare input order without redundancy
eg: `foo( (a, b, c:10, d => a+b+c+d) )`
helps for simple functions with default values
	where we can leverage list values without worry
anytime you need more complexity, explicitly declare input order
	eg when you want a function-list combo (so you can't leverage list values for input order anymore)
also when you want to modify/extend an object, and explicitly declare the new input order

note that this method tacks on a bunch of arguments at the end, that weren't being included earlier
eg `myFn: (a, b, sum: a+b, diff: a-b => sum*diff)`, the inputs are actually `a, b, sum, diff` instead of just `a, b` (like it was before)
i don't think this is a problem
we don't have currying, and the input order is still static
we can just call `myFn(2, 3)` and ignore the last two inputs
we don't have currying, so we don't have to worry about cases like `x: myFn(2,3)` resulting in an unintended function because not all arguments were passed in
input order is static, so we don't have to worry about `myFn` changing and inputs appearing/disappearing, changing the input mapping of `myFn(2,3)`

in addition, note that there's actually pretty much no issue with using list items as a way to implicitly declare input order
because there's not really any reason to use a function as a list, or vice versa

### Input Order and Default Inputs II

(continued from section "Input Order and Default Inputs")

we seem to always run into problems when things have default values
so now that we've decided that default values are a crucial part of a prototypal language, we should design our language as if everything has a default value

we can think of input order declaration as just an internal property `_input_order` at the beginning of the object, and implicit inputs takes care of the rest
	we talked about this in the previous section "Declaring Input Order Using a Property"
so let's look at an example like this:

    bar:
        _input_order: a, b, c: 10, d
        x: a+b+c+d

if implicit inputs doesn't factor in bound variables, then it will not factor in properties declared under `_input_order`, in this case `c: 10`
likewise, if implicit inputs does factor in bound variables, then `c: 10` will be factored in
thus, it follows that:

1. if input declaration (`>>`) allows default values, then we must factor in the order of bound variables
2. if input declaration doesn't allow default values, then we must only allow unbound variables

however, don't forget that this is only if we want our input declaration rules to be derived from the `_input_order` property and implicit input rules
we can define special rules for input declaration if we want


allowing default inputs makes it ambiguous
makes input order declaration achieve two purposes
	declaring inputs and assiging values to those inputs
also, it's uglier because if you want to declare properties in input declaration, you have to wrap it in parenthesis

but if we don't allow bound variables in input declaration, then it makes inline functions uglier


maybe we can do both
we don't allow default values in the input declaration, but we factor in bound variables in implicit input order
this means that we can't think of input declaration as just an internal property `_input_order` with implicit inputs applied
	we have to make a special rule banning properties from being declared in `_input_order`
but it will prevent input declaration from achiving two purposes, while at the same time making inline functions cleaner
	because we can now declare inline functions like `myFn: (a, b, c: 10 => a+b+c)`, leveraging list items and implicit inputs so we don't need to explicitly declare inputs


if we include bound variables
then if we have something like

	foo:
		c: a+b

then c will appear before a and b!
which is weird

so maybe we shouldn't allow bound variables
or instead, maybe we append bound variables to the end
remember, it's ok that we tack on a bunch of extra arguments on the end
	talked about in the previous section "Input Order and Default Inputs"


### Input Order Syntax and Mechanics Brainstorm

* continued from earlier section "Function Syntax - Return vs Arrow, Input Order"

do we need `>> =>` ever? (aka a function with input order, but no function body)
	it looks very ugly
	if we never combine functions and lists, then we can always leverage lists to declare input order in functions...

so whats the point of `>>` and input declaration? can we get rid of it

what happens if you do inline `fn(a b >> a+b)`
what does that even mean
a list of one item that you can clone?
the difference between
	1. `a b >> x: a+b`
	2. `a b => (x: a+b)`
is you can clone the first one multiple times, and modify `a` and `b` multiple times

when cloning, if we provide arguments, should they be removed from the input list, for future clones?
that way you can do builder pattern


### State Variables and Indirect Modification

(continued from "Modifying State Variables Outside of Declaration Scope")

in the previous section "Modifying State Variables Outside of Declaration Scope",
	we mentioned how it is impossible to modify a state variable outside declaration scope
this is because if we try to pass around the state variable, we will need to create an alias, and modifying the alias won't affect the original state variable
but what if we do something like

	foo:
		stateVar.
	bar:
		increment(input: foo) // pass in the *parent* of stateVar
	increment: input >>
		input.stateVar += 1 // extract stateVar, and modify it

I call this "indirect modification", because we are modifying the state variable outside of its declaration scope
this is kinda how javascript/java does pass-by-reference style reassignment:

	function increment(wrapper) {
		wrapper.val += 1
	}
	main() {
		var x
		increment({val: x})
		print(x)
	}

however, should we allow this sort of indirect modification?
if we only allow it to be modified directly
and not through something like

	foo.bar := 10

then state variables become something that you can read, but not write, if you are outside the scope
because even if you try to do something like this:

	x: foo.bar
	x := 10

note that that doesn't actually modify `foo.bar`, it modifies `x` (the alias)
whereas, if we do allow indirect modification
then every variable you can read, you can also write to

### State Variables - Mechanics and Persistence

recall that, state variables use flag-watcher module
if you create a pubic state variable
every time a new module is added to the public system
the state variable has to look through the module to see if it references it at all
so it can monitor for flags
this seems really slow and inefficient

state variables and permanent data
what if we have a word document (represented internally using a state variable)
Bob and Alice and making modifications
then Bob goes offline
wouldn't all his edits disappear?

let's say, every time Bob and Alice click their mouse, it increments a mouseclick

	counter: Bob.mouseclicks.length + Alice.mouseclicks.length

notice that, when Bob "disconnects", the input data representing `Bob` becomes `undefined`
so `counter` will change

seems like eventlists can't help us here
maybe we do need some concept of persistent state/data

or maybe we can somehow integrate the concept of "offline" or "disconnection" into our code
something like

	if (Bob)
		counter: Bob.mouseclicks.length + Alice.mouseclicks.length
	else
		counter: counter

this is pretty much just feedback, sequential logic, verilog style code though
uglyyy

maybe we should make events persistent and independent
once an event is registered, you can't take it back
it is already part of the timeline of the universe
if Bob's mouse gets disconnected, his computer still keeps track of the history of mouseclicks
likewise, if Bob or Alice go offline, the document still keeps a record of the modifications

most of the time we can save storage space by converting these persistent event lists into state-based logic
for example, for `counter: Bob.mouseclicks`, instead of keeping a persistent event store of Bob's mouseclicks,
	we can just increment the counter on each mouseclick, and forget about the event
however, if the programmer adds in a mechanism for modifying this history list, eg

	for keypress
		mouseclicks :=
			remove.(first) // remove first mouseclick event

then we have to use a persistent event list, and can't optimize it away

maybe the idea of persistent event lists is, when you create a modification or add an event, you add an event to the "global timeline"
this global timeline is separate from any object
so when you "click" a mouse, the "mouseclicks" events are saved into the global timeline, not the mouse object
that way, if the mouse is disconnected, the mouseclick events aren't effected

however, this shouldn't happen for all state variables
if you do something like, `for item in list: counter++`, then if the list changes, the counter should reflect the new list
the `counter` shouldn't be permament

notice that, for stuff like:

	for mouseclicks:
		counter := counter+1

the new revision is dependent on the old revision
this is like how sequential logic, and D-flip-flops, use feedback to preserve state
so perhaps this is how we determine whether or not to save to the "global timeline", and make data persistent and independent

but we still have the `mouseclicks` variable in the example above
so if `mouseclicks` was bound to `mouse`, then if `mouse` gets disconnected, the `for` loops dissappears and `counter` will be `0`
thus, the `mouseclicks` variable still has to be independent somehow, perhaps tied to the global timeline


### Shared Scopes and Combinatorics

the idea of private variables is an important one
it's basically the idea that, depending on their perspective and context, an object will have different properties
so, a car might look different from a user's perspective vs a car mechanic's perspective
likewise, a club member will see more information about a club, then a non-club member

this is sort of like tagging and local variables
in a BFS search, the BFS scope can see the `#visited` tag on each object, but nobody else can see it


earlier we talked about creating shared (kinda) scopes using indirect submodules
	in the section "Shared Scopes and Indirect Bindings / Submodules"
and in the example we used, we created a shared scope between `DanceClub` and `Joe` by creating a submodule of `Joe` inside the scope of `DanceClub`, an indirect submodule

but imagine if we had 3 people, Alice, Bob, and Cathy
and they all want to share variables between eachother
we would need 6 scopes total: Alice, Bob, Cathy, Alice+Bob, Alice+Cathy, Bob+Cathy, Alice+Bob+Cathy
grows exponentially
feels ugly

though you can't get around the fact that there are 6 different combinations of people
and for every piece of data, you have to specify somehow which of these 6 groups it is visible too
but indirect submodules forces you to access the data through each of these subgroups
instead of `Car.color`, you would have to do `Car.AliceCathy.color` (if `color` was a property only visible to `Alice` and `Cathy`)

if I was a developer and a club member, I'd want to be able to see both the normal club properties, the developer club properties, and the member club properties
all in the same scope, without going through indirect submodules
or maybe not...?
maybe it would be cleaner to access developer properties through `club.developer.properties`, and member properties through `club.member.properties`
it's a bit more explicit, which might be better from a programmer standpoint
and it also prevents name collisions between different scopes
but it might be uglier from a user standpoint
who shouldn't have to access these properties indirectly

### The Intuition Behind Shared Scopes

what would it ideally look like from a user interface perspective
for example, if we had a webpage displaying all the club information

	clubInfo:
		clubName: "Dance Club"
		clubRoom: "103G"

		if (member):
			clubMembers: Bob, Joe, Mary, ...
			emailList: ...

the webpage should change depending on who is looking at it
and it doesn't really need "submodules" does it? could just be a single list of all the information
aka the list of properties that the user is meant to see
but do we have to worry about collisions?


if we go back to thinking in terms of a programming perspective
I think it actually makes sense to segregate shared variables to a separate, shared scope/submodule
even though you have to access them indirectly, eg `Car.AliceCathy.color`
note that because these submodules are all attached at the base level, and not like some tree structure,
	it's actually less of a hierarchal model and more of a graph model
as in, this would be a hierarchal model
	
	Alice
		AliceBob
			AliceBobCathy
		AliceCathy
	Bob
		BobCathy
	Cathy

and the graph model (which is created by our indirect submodules) looks more like

	Alice
		AliceBob, AliceCathy, AliceBobCathy
	Bob
		AliceBob, BobCathy, AliceBobCathy
	Cathy
		AliceCathy, BobCathy, AliceBobCathy

you can see how the indirect submodules forms like a graph
which is good because hierarchal structures are approximations, and thus can get ugly, so they should be avoided

in addition, we can make it feel more dynamic and intuitive
by making it so the IDE will dynamically display what indirect submodules are available from a given scope
so if you are inside `Alice`
it will show the indirect submodules `AliceBob`, `AliceCathy`, and `AliceBobCathy` are available
even though these submodules are declared outside of `Alice`

### Public vs Private - Graph Representation

so since we don't want to restrict the idea of "private" to hierarchal scoping
it kinda makese sense to make these special "private" references
because we can now imagine a graph, where some edges are solid, and some edges are dashed
and you can imagine entire sections that are only accessible through dashed lines
that would represent a private scope
and if somebody creates a solid edge to the section, then that entire section is now accessible, public
that's like somebody being in a private group and then letting people access his account publicly, posting his account credentials publicly

### How do we Make Secrey Keys?

(continued from "Public vs Private - Graph Representation")

something still feels off though
these "dashed" lines are basically references where the keys are objects
so they are "hidden" from public view
but we still need to "hide" these keys
the user has to have access to the keys, but the public shouldn't
so it's not enough to simple make object-key properties "invisible", because the public can still access it indirectly
by going to the user's scope, getting the key, and then getting the property
(we talked about this before, in the sections "Local Variables vs Private Variables" and "Secret Keys")

so the key has to somehow be invisible too, only accessible from the user's scope
and that requires a special mechanism

so it comes back to this common idea of "private" variables
that they are variables that you can only access if you're "inside" their scope
imperative langs have this too, with private variables that are local to classes, objects, functions
but what does that even mean?

remember that in Entangle, everything is data, including programs
so what does it mean when we say "in scope", or when we are "using and IDE to view a program"
the IDE is just a window into the data, but you can access the data through many means
if a variable is "only visible in scope", what prevents us from accessing it indirectly?
if Bob is a club member but Joe isn't, what stops Joe from doing `Joe.friend["Alice"].friend["Bob"].DanceClub`
how is that different from accessing it "from within Bob's scope"
if we use the earlier analogy and imagine a graph with solid and dashed edges, what is the difference between being in Bob's scope, versus navigating to Bob's scope?

### Private IDEs and Browsing Contexts

(continued from "How do we Make Secrey Keys?")

the answer is, we have to treat IDE's and "viewing programs" (eg a browser) as part of this private/public ecosystem
reframe the development and coding process to be part of this public/private system
when you open up a program or object, and view it's internals, you (the IDE) have a user profile, with it's associated secret keys and permissions
I was trying to think about private variables from the context of a context-less IDE (an IDE with no user attached)
obvious, if a context-less IDE can see a variable, it must be public

so now that we have to be in a special "authorized" IDE context to view private variables
so some sort of secret key used to access the private IDE context
but what's to stop people from accessing that private key indirectly, by navigating to the private context?
another secret key?
if you keep tracing backwards like this, eventually you have to get to a secret key that you can't navigate to, but the user knows about
this is essentially the user's master password
it is the "root" of all the user's private data, and isn't stored anywhere
the user has to enter it to log into their data, and it unlocks/decrypts everything

### Private IDEs and Browsing Contexts II

so the idea is that, once the user is logged in, they can access their private IDE context
and that private IDE context will show private variables based on the secret keys that the user has in their account
sort of like how in the BFS search, within the context of the BFS, the "visited" tag shows up on objects

however, doesn't this mean that the global system somehow still has to be aware of these private properties?
could a hacker look into the system and extract the private properties, even though they aren't displayed by the IDE?

in addition, what if I wanted to make a public variable based on private variables, eg

	publicVar: #privateVar + 10

the system has to be aware of `privateVar` to calculate `publicVar`, right?
in fact, in the graph, you might be able to trace backwards to find `privateVar`
how do we prevent this

even just for the user to access their own private variable
they have to pass the secret key to the dictionary, and the dictionary spits out the value
but could bad actor inspect the bytecode of the dictionary and figure out the secret keys and values?

well, instead of storing the secret value in the hashmap, we can store it in an external hashmap
like how tags can be modeled using external hashmaps, as discussed earlier with the BFS example
just create a hashmap that associates public objects with their private tags
`foo[privateKey]: bar` becomes `privateKey[foo]: bar`
this way, all private keys and values are stored separately, secure in the user's storage
this is simple "object-key inversion"
note that we can also model it using something like `privateMap[foo]: (privateKey: bar)`
there are probably many ways to model it using a separate hashmap to maintain security/privacy

as for evaluating public variables from private variables, we could just run all calculations on the user's local machine
and broadcast the result to the public domain
alternatively, we can maybe leverage [garbled circuits](https://en.wikipedia.org/wiki/Garbled_circuit) to encrypt the evaluation,
so it can be run on other machines without revealing any information


### Modifying State Variables Indirectly

(continued from "State Variables and Indirect Modification")

note that to modify public state variables, we noted previously that this is ugly:

	foo.path.to.a.variable := 10

but this doesn't work

	alias: foo.path.to.a.variable
	alias := 10

so we actually have to do this

	alias: foo.path.to.a
	alias.variable := 10

this is a little better, not as ugly but still works
this is sorta like how you modify values in Java/Javascript
	talked about in the section "State Variables and Indirect Modification"
however, still not sure if we should even allow modifying state variable indirectly like this
perhaps we should only allow state variable to be modified in their scope
as in, only allow local/private variables to be state variables
otherwise, people can just modify global information willy-nilly, stuff like the global plus operator, etc

### Call Operator - A Summary of the Rational

The call operator is a bit of an unconventional quirk of this language
I think my rational behind it, and how I even came up with it, was an interesting journey
and a good insight into the work that went into this language in general
so without further ado, here's a summary

// TODO: give references to previous sections

* First, more than a year ago, I decided that everything should an object
	* section: "Node datatype"
* no primitives
* this is so you can tag anything
* also kinda like Java
* makes things simpler as well, more reductionist

* the actual "value" of primitives like numbers and strings is stored inside special internal properties
* eg the number three would look like `three: (_numeric_value: 3)`
* operators like the `+` sign and `=` operator use these internal properties
* everything else just sees the entire primitive object
* this stuff will become important later

* fast forward a year
* start thinking about the concept of functions
* I realize that functions can be represented using objects
* and "accessor pattern"
* which basically models every function call as an object clone and extraction of a designated property
a function call `myFn.call(10)` is the same as `myFn.clone(10).result` (assuming `result` is the property designated for this)
note that any property can be designated, it's arbitrary
the important thing is that there _is_ a designated property

* fast forward a few months
* I spend some time debating whether or not to allow currying
* and how it seems to clash with default values
* important to note because, if we include currying, then accessor pattern isn't enough to represent functions using objects & property access
* however, eventually I decide to get rid of currying and stick with default values

* go through a reduction phase
* trying to figure out if we need both objects and functions (this was also motivated by my exploration of parametized references, but that can be ignored for now)
* figure out how functional languages reduce everything to functions
* subsequently, due to accessor pattern, all functions can be represented using objects, so everything in my language can be reduced to objects
* decide to stick to objects as the base, and implement functions on top using accessor pattern
* because objects feel like a more intuitive way to represent data
* I start using `_result` as the designated property for function calls

* now start wondering what syntax I should use for function calls
* if I do `fn(10)`, how do I know whether or not I'm calling it as function or cloning it as an object
* one way is to have it default to "calling" for functions, and if you want to clone a function, you have to explicitly say `myFn.clone(10)`
* also play around with the idea of duality
* every object can be treated as a function and vice versa, so everything can be called or cloned, `()` for calling, `{}` for cloning
* that way, you can clone a function if you want to tweak it, or call a function if you want to get the result

* however, realized that there's no point to "calling" objects, because they don't have the `_result` property, so they'll always return `undefined`
* actually, veggero pointed this out a few months back, when I first came up with the concept of duality and `()` vs `{}`
* so there's this mysterious assymmetry
* functions and objects are "the same thing", but functions can be treated as objects but objects can't be treated as functions

* notice a connection with a similar assymmetry with primitives, like Numbers
* Numbers have a special designated property as well
* you can treat a Number as an object, but you can't treat every object as a Number
* eg, you can clone both Numbers and objects, but you can only use the `+` operator on Numbers
* because the `+` operator relies on that designated property

* thus, Numbers have a special designated property, and special operators that act on that property
* likewise, functions have a special designated property, so special operations that use that property, should follow a similar syntax
* thus, function calls should use an operator

* this has a few benefits
* first, it's consistent with how other primitives work
* also, it's doesn't collide with the clonings operation, or require defining a special property like `fn.clone()`
* it also makes it very explicit when treating an object as a function, instead of having to guess whether or not `foo(10)` is a call or a clone

### Tags and CSS Selectors

tags are like html/css class and selectors


sort(list, key=len)
len(li) vs li.length
li.lenth is better
but why cant we use .length in the sort function
maybe get...length is shortcut for (item=> item.length)

### Plugins and addons using spread operator

`...myPlugin`
will inherit the surrounding scope
and add properties into the surrounding scope
for example:

	foo:
		c: a+b
	bar:
		a: 10
		b: 20
		...foo
	zed:
		print(bar.c) // will print "30"

note that this means that the spread operator `...` has to spread out properties, not just list items
we talked about this earlier
	in the section "Spread Operator and Merging Properties"

does this have any dangerous implications?
eg if you have a dynamic list `li: (a b >> a+b, a-b, a*b)`
and you spread it out, `fn(...li)`
does this cause any problems?
now `a` and `b` will pull from the outer scope
I guess `...` is meant to be equivalent to redefining it

what does that mean in terms of `_source` and `_parent`?
multiple inheritance?
how do `_source`, `_parent` and `_arguments` usually work
how does it maintain it's references to it's original source scope

### Read-Only Private Variables, Public Mirrors

* we talked about previously about how scoped state variables result in read-only behavior outside the scope
	* in section "Modifying State Variables Outside of Declaration Scope"
	* and section "State Variables and Indirect Modification"

* we can easily achieve read-only behavior just using normal private variables though
* works for any variable, not just state variables
* say we have the internal variable `arguments_internal` that the interpreter uses to keep track of a cloned object's arguments
* we want this arguments variable to be accessible by the user, just like Javascript's `arguments` variable
* however, we don't want the user to be able to override this property and screw with the interpreter's behavior
* eg, we don't want them to be able to do this

		badObject:
			arguments_internal: undefined

* so to achieve this, we first make `arguments_internal` a private variable, so that the user can't override it
* then, we create a "mirror" (or proxy) variable that's a copy of `arguments_internal`

		internal:
			#arguments_internal // private variable
			_arguments: #arguments_internal // public mirror variable

* this way, even if the user overrides the public mirror, `_arguments`, it won't change the behavior of the interpreter
* the user is just screwing themself over because now they don't have access to the `#arguments_internal` variable

### Private Keys and Tags - Mechanism Brainstorm

we have this idea of secret keys and tags
when you have access to the key, you get access to the data it unlocks (aka the properties that use that key)
but how do we define "access" to a key?
if we have `foo.key`, and `bar.friend.friend = foo`, does `bar` have "access" to `foo.key`?
	I dub this "indirect access"
how are these "keys" even stored? like normal properties, or hidden in metadata?
how do we pass these private keys around, if we want to share access?
and what keys/tags appear in IDE, only "direct keys", aka keys that are directly under the current user?

i think to keep things simple
we should only show direct access info
aka, we only reveal information that is accessible from the keys _directly_ under the current scope/user
otherwise the interpreter has to search across the entire graph to see what keys are available

so if we only allow tags pointed to directly from the module
then it's basically like you have to declare keys/tags in the module
in fact, maybe we can have a special property for it, kinda like how we declare input order

maybe something like:

	foo:
		#x #y

is short for:

	foo:
		_keys: x, y

from the perspective of the network graph, each module has it's own set of keys that it's pointing to
and any data using those keys is visible to the module

### Key Classes

(continued from section "Private Keys and Tags - Mechanism Brainstorm")

remember that each module declares it's set of local keys, and can "see" any local properties that use those keys
if we extend this to global properties
it's like, there's a "global" node/module that points to all strings
so any data that uses a string as a key, is visible to the global scope

this is interesting, because instead of declaring a finite set of keys, the global module defines an infinite "class" of keys
any key that is declared as a "string" is automatically a global key

I wonder if we can allow for similar behavior for local keys/properties?
allow for defining an infinite "class" of local keys

or maybe it can be like global keys, where a module can declare a new "type", and any object with that "type" becomes a local key to that module

this seems like a common pattern
instead of declaring an object and defining all the properties inside it
you use tags, to create properties/list items indirectly and dynamically
internally uses the "flag-watcher" model to work

state variables uses this
tagging uses this
local/private variables uses this

maybe eventlists can leverage this
any time you declare a property as a "time", it gets added to the universal timeline
so it becomes persistent
which solves the problem we had earlier
	in the section "State Variables - Mechanics and Persistence"

### Cono, Indirect Bindings, and Tracking Trends

defining bindings indirectly
we talked earlier about how it was ugly
	// TODO: this^^^ is referring to our audio notes (transcribed), after I re-organize those notes, update this with a proper section reference
but in the context of Cono, it sort of makes sense
because if Joe likes Pop songs, and he also likes Taylor Swift, then Cono should see this correlation and bind "Taylor Swift" to "Pop"


### Marking vs Tagging with a Value

if we do this

	foo #visited

vs this:

	foo #color: green

one is just tagging/marking it, and one is tagging it with a value
so simplest idea would be to make the first correspond to a list, and the second correspond to a dictionary
but what if sometimes you mark, and sometimes you tag it with a value?
maybe we can make the first correspond to a set (dictionary giving each key a default value of `true`)
this also makes sense considering the un-ordered nature of tagging and the un-ordered nature of sets (vs the ordered nature of lists)
this also makes tag access more uniform and consistent
if we made the first correspond to a list and the second correspond to a dictionary, then we would have to iterate across them differently
	for the first we use list traversal, for the second we would either extract the keys and iterate across them, or extract properties as a list of key-value tuples
treating the first as a set means that to get the tagged objects, you have to extract them as object keys
	just like you would in the second example

### Tagging Mechanics - Problems with a Giant Tag Hashmap

earlier we talked about how tags are like giant hashsets, and should maybe be modeled using them
	// TODO: this^^^ is referring to our audio notes (transcribed), after I re-organize those notes, update this with a proper section reference
one issue with "tagging" and having all tagged objects stored in the tag dictionary
is that we established earlier that object keys are private
so how do we iterate across this giant dictionary of tagged objects?

lets say we tag a bunch of objects
	
	foo #color: green
	bar #color: blue
	for item in items
		item #color: red

then it should store it in a dictionary with objects as keys and their tag value as the values
and we would want to be able to access them using something like this:

	for item in #color // get all objects tagged with #color
		print.(item.name + " " + item#color)

however, if we make all object keys private/secret/hidden
then how are we even accessing and iterating across all of them?
if `#color` stores a hashmap of `<tagged Object, tag value>`, then every item in the hashmap has an object key, and is thus inaccessible
	and we wouldn't be able to iterate across them like we want to in the example above

in fact, there are many examples where we would want to create a hashmap with object keys
and iterate across it later
so perhaps we can't just make all object keys private?


another issue the idea of a giant tag dictionary
is if you tag a "private" object, you might want to maintain the privacy of that object
for example, say there is a public `#color` tag
and you have a list of private objects, eg, photos that you took
and you want to use the `#color` tag to tag the main color of each photo
basically use somebody else's tag as a key for one of your values
that shouldn't automatically make your object available to the tag owner, right?
using `#color` shouldn't expose your photos to the public, right?
or maybe it should?

if we think about it in terms of flag watcher model
if they can't watch you, how can they get notified of the tag?
though maybe the system takes care of that
"send a message" to the tag dictionary notifying it
maybe even an anonymous message?

### Changelists are Ugly, Use Eventlists Instead

remember our concept of changelists?
a special module that compiles a list of changes a variable undergoes (during computation/evaluation)
	// TODO: find section reference
changelists involve tracking computation and execution state
recall that in order to implement this, we had to leverage feedback
and the implementation is quite ugly
we should never really use changelists
instead, everything should be "timeless"
all events are converted into timeline events (aka eventlists), and can be parsed like normal data
I believe if eventlists are used properly, changelists are unnecessary

### Private Keys and Scoping

remember that we can use keys defined in higher scopes

	foo:
		#mytag
		bar: someObject >>
			someObject#mytag: 10

remember that the `_keys` property declares all private/local keys
	aka all properties that are accessible through `#`
so the example above implies that the `_keys` property inherits keys from higher scopes
local keys inherits from scope, just like normal properties
so we have to make sure to design the `_keys` property to reflect that

### How To Distinguish Tags from Multiple Users?

how do we distinguish tags from multiple users?

using a hashset kinda model (`Joe` uses an internal hashset to keep his taggings private, even though `#rating` is a public tag)

	Joe
		#rating
			KungFuPanda
				5_stars

or maybe, parametized reference (this would make Joe's tagging public)

	KungFuPanda
		#rating(user: Joe)
			5_stars


examples of tags
image #height: 5px
image #format: jpeg
image #large: (#height * #width) > 10000
image #nsfw

### Tag Queries

before we were musing about how to implement tagging
	// TODO: this^^^ is referring to our audio notes (transcribed), after I re-organize those notes, update this with a proper section reference
I mentioned how it's like a reverse hashset, indirect properties
where instead of "adding a property" to the object, it links the object to an external hashset
however, this complicates things
	which we touched on in the section "Tagging Mechanics - Problems with a Giant Tag Hashmap"
first, it introduces an entirely new mechanism, namely indirect bindings
	which is what we would have to use to push these <Object, tag value> bindings to the external hashset
and second, it has dangerous privacy implications, namely that private objects can be unintentionally made public just by tagging them
because it exposes the object to the tag, so if the tag (and the hashset) is public, the object becomes public too

don't think about tags like hashsets
tags are just regular properties
pretty much like `image.height: 5px`, `image.nsfw: true`, but with objects/symbols as keys instead of strings

instead of making tagging some special mechanism,
we make a special mechanism for tag _queries_
don't think in terms of implementation
think in terms of declarative programming
when a user wants to see all the #nsfw images, they want to see all images with the property #nsfw
so its like saying `for obj in AllObjects, filter obj.nsfw == true`
so theoretically, the interpreter will have to traverse all of public knowledge to find all images with that property
that is the simplest interpretation
using a hashset is just an optimization, implementation
DON'T MIX UP DESIGN AND IMPLEMENTATION

building on top of that
that means that, if a user uses a public tag on the private object
and the user queries for all objects with that tag
he sees his private object in the results
but if a public user queries for objects with that tag
they won't see that private object
so this means, that these "tag queries", will appear differently based on who is querying it
this fits better with the private vs public idea, and local properties model
also kinda like facets
it also seems like it could be insanely slow and inefficient, but that's always a tradeoff when using declarative programming
however, I think optimizations can make it practical


this means that everything based on those tag queries have to be dynamic and multi-faceted too
like `#nsfw.length`, which should give the number of objects tagged with `#nsfw`
if a user tags one of their private objects with `#nsfw`:
	then that private object will still show up in the user's private  `#nsfw` query
	and likewise, `#nsfw.length` should also include those private objects
again, this is really slow, but I'm sure there are ways to optimize it
like a public hashset for `#nsfw` and a public value for `#nsfw.length`
and each user has a personal hashset for their personal `#nsfw` objects, and their corresponding personal `#nsfw.length`
and when the user queries for `#nsfw` and `#nsfw.length`, it just combines the public and personal values, and returns it to the user

### Private Tags and Personal Perceptions

what about something like #likes
this isn't a single property we can add to the object
some users may tag it with `#like`, others may not
each user should be able to see their own tag, not other people's tags
so the taggings should be private, and somehow linked to each user
at the same time, we do want to keep a total of the number of tags
so we can, for example, display the total number of #likes a song has

what we can do, is give each user their own personal version of public data
that includes their taggings
so if Joe tags a song with #like, it clones the song (and all it's properties), and adds the property
this way, we don't have to use parametized references to uniquely identify each tagging, like we were discussing before
	in the section "How To Distinguish Tags from Multiple Users?"
eg we don't have to do `KungFuPanda #rating(user: Joe): 5_stars`
it will instead look something like `Joe.tags += KungFuPanda(#rating: 5_stars)`
in addition, this ensures that Joe can keep his tag private if he wants to

to get the total number of tags/likes/votes an object has,
the system will go through each user, and check their "version" of public data, to see if it includes the tag
to keep things secure, it can probably use some sort of cryptographic voting protocol, so that it can't know each user's individual vote

in more abstract terms,
each user has their own, personal perception of reality
they can label and categorize things how they like
Cono will also keep track of the "aggregate" reality, combining all the user's perceptions in some way to create a single reality

in fact, to stay true to this theoretical abstract idea,
every time a user creates a tag, they are modifying (their perception of) reality
and that is the ENTIRE reality
so lets say the "url" for kungfupanda was `Reality.media.movies.animated.kungfupanda`
then when Joe "rates" Kung Fu Panda, he is doing `Joe: Reality( media.movies.animated.kungfupanda#rating: 5_stars )`
notice that it creates a copy of the entire reality, just to tweak that one tiny variable
very inefficient, but stays true to the abstract concept
optimizations come later


### Queries and Perception

if we thing of tag queries as just a giant search for all objects using that tag (as a key)
then we can think of our perception/context
as just everything that is accessible through our private and public keys
so like, instead of querying the universe for a single tag
our context has a list of keys/tags, and it queries the universe for all of them

in less abstract terms, that means that, every user has a special set of keys that lets them see their hidden properties/tags of objects
so like, a programmer might see the debugging logs attached to a certain website
these are things that the IDE should dynamically present
so the IDE/browser changes how things looked based on who is looking at them
based on the list of keys the user has

if we generalize, does that mean each user is basically just a query?
so like, if the user has the key `age > 12`, it will query the web for all content that fits that tag?
so if a certain scope has a list of keys, `_local_keys: ...`
then the local properties available to that scope is `for key in _local_keys: someObject[key]`
basically, for every object you are inspecting, you give it all your local keys, and it gives you back all corresponding properties
and that is your "perception" of the object
apply that to every object in the world, and that is your "perception" of the world

but no, a user is not the same as a query
every "user" is just a node in the graph
a set of properties, like any other piece of data in Entangle
data just sits there, it doesn't navigate around the web, it doesn't "view" other objects
so it doesn't make sense for it to "see" things differently based on it's local keys
the IDE is the query
the IDE takes the object's local keys and performs the query
every query consists of two objects, the context (aka the user) and the target (aka the webpage the user is looking at)
the IDE queries the target based on the context's local keys

### Eve Lang - tags and queries

I remember that Eve Lang is a language built on the idea of database "put" and "query"
I wonder if this is similar

so I looked at Eve lang [www.witheve.com](witheve.com) and it actually uses the same tagging methodology
even uses `#mytag` syntax for tags, just like my language
it seems like Eve also uses something like `[#mytag]` to get the value of that tag
and it also has this core concept of querying
though that's where it seems like the similarities end (though I only skimmed the docs)
Eve has this weird separation of query and binding
also uses dedicated event listeners (like verilog), instead of for loops and eventlists like Entangle uses


### Global vs Local Queries

(continued from "Queries and Perception")

do you need always need to specify a target for every query?
why not just always do a global query
I think Eve just does global query
for Cono, a "search" for some tag is just a global query as well
CSS selectors are local queries, but it's easier because HTML is tree-like, not graph-like

for graph-like structures, it's really easy to end up searching the entire graph unintentionally
for example, if we did `myList.filter(has #mytag)`
	if `myList` has the property `myRoot` that points to the global root, then it will end up searching the entire graph anyways
even if we don't give lists a property that points to the global root, somebody might subclass lists and add functionality and add-ons
and one of those add-ons might have a pointer to the global root
we don't want people worrying about using list libraries and add-ons for fear of breaking querying
so perhaps local queries aren't practical

however, there is one important case where you might want to do local queries
in Cono, if you want to get, say, the `#music` objects that the user themself tagged
then you would search the user for `#music`, not the global space
maybe we can them separate tags? have a user specific `#music`, and then a global `#music` that pulls from everybody's user `#music` tags


what happens if we pass around a tag
`#tagAlias: bob#tag`
should using a tag alias, still make them show up in the query?
instinctively I would say yes, otherwise what's the point of the tag alias
but not sure how the internal mechanics of this works out

maybe we can just have a custom `find` function for lists
that only searches the elements of the list
	that way we don't run into problems like properties that point to the global root, talked about earlier in this section
or maybe it can be like an operator, that is overloaded for lists

from a querying/searching standpoint, it makes sense to have a node to search from
even global search can be seen as a search from the global root

for BFS, anybody that "clones" the BFS module will be internally using the `#visited` tag
but if we only allow global queries, then every BFS module will see eachother's `#visited` objects
so either, we allow for local queries
or, we make it so cloned tags have a separate "global" search

allowing for local queries, it gives more flexibility, because you can mix and match tags and targets to get exactly the query you want
but that flexibility also leads to complications, can get confusing when you have to account for messy graph structures when designing your query
creating a new tag whenever you want a "local" query, it's more explicit, and less tangled up
but more fragmented, because now you have to create a new tag for every local scope

kind of like the difference between twitter hashtags and reddit communities

### Tag Ownership - 3rd Party Tagging Apps

(continued from "Global vs Local Queries")

in Cono, we often want to get all tags created by a specific user
	mentioned in the section "Queries and Perception - global and local queries"
based on this idea of tags "belonging" to the user that created them
but this idea of "belonging" is actually kinda ambiguous
what if the user tags objects through a 3rd party app?
what about tags created by a group of people, like a club? who do those belong to?

maybe cloning a 3rd party app ties it to your "perception"
what if you're using a 3rd party app to clone a different 3rd party app
how does it know to transfer the "user" node, and not some other property/node

3rd party app has to add the tag manually to user
user has to "accept" the 3rd party app's tags
so when the user "attaches" the 3rd party app, they implicitely start pulling tags from the 3rd party app into the user-space
instead of making tags in the 3rd party app, the 3rd party app communicates to the user to create certain tags
and then a user-local query can just look for tags directly attached to user

but then, it seems like we should only allow tag queries for direct connections
	only searchings things directly attached to the user
not graph traversal
however, the whole point of tagging was that
you can tag from anywhere, and the tag query will find it

a global tag query has to have a graph traversal
so global tag queries do traversal, but local tag queries don't?
seems weird

what if, instead of creating tags in the user-space
the 3rd party app tags the object with both the tag, and the user
that way, you do a double query, `#user = me, #liked = true`

even if the 3rd party app creates tags in the user space
you can still do something like "#liked, parent = user.tags" and this will find all objects that are tagged "#liked" and children of the user.tags node

so we don't even need the concept of local queries
we can implement it using tags

we would have to tag the tag though

maybe we can use "perception" instead
every third party app you use, is cloned in your perception
so those tags are part of the user

how is perception implemented anyways
cloning?
recall that cloning has a "source"
	aka which scope created the clone
	"source" is stored in a property
so maybe that's all we need?
use the "source" of the clone for the querying
but what if we have a 3rd party doing the cloning...
well note that the 3rd party app has to be cloned too
so maybe the "root" of all clones is the user perception?

so it seems like there's two main methods for tag queries
delegation
	requires explicit binding to the user
cloning/perception
	everything under the user perception is bound to the user
	any 3rd party app has to be cloned under the user
	no delegation, only cloning

this seems like we're getting too preoccupied with implementation
maybe we need to distance ourselves from implementation
the invariant of all this is the query itself
the query is "get all of ____ tags from the user"
how do we further define this, without getting too deep into implementation?

###  Tag Ownership - Delegation and Aliases

(continued from "Tag Ownership - 3rd Party Tagging Apps")

maybe not everything in the user's graph should show up in the user's local query
what if the interpreter/language used some internal mechanism
that keeps track of how much each tag is used, so that it can do optimizations or something
probably would use a dictionary

	numTimesUsed:
		#liked: 10
		#upvoted: 35
		#downvoted: 12

and this info would probably be stored in each user
however, this should not show up when the user does a tag query
even if it might be in the user's "user space"



perhaps tag ownership depends on who "initiated" the tag
a user can manually add tags, or clons a program and delegate tagging to it
both count as "initiation"
does this always work?
initiating a tag is different from having a reference to the clone
a user can clone a program, and not even store a reference to it if they don't want to
the program should still be able to tag things on the user's behalf


so initiator is different from "root node"
as in, just because a tag is in the user's graph space
doesn't mean the user initiated it
and likewise, there could be tags that the user initiated
that are not in the user's graph space



we might want tags for delegates too
like, I might want to see all the tags I tagged through "Facebook"
delegates can have their own add-ons, plugins, and sub-delegates
so delegates are like users too

works like scope
a tag made through Facebook would be linked to the user and to #Facebook

maybe you can tag a tag, like so

FacebookApp
	#like: ^#like(#Facebook)

so now all #like tags made by FacebookApp are linked to the facebook app
and this will propagate to all plugins and add-ons of the FacebookApp as well

but this would not be necessary if there were some way to automatically determine that a tag originated from the Facebook App



in Cono, maybe a user would want to create a secret alias identity
from the outside, it looks like a separate user
but it is really just an alias, used for posting all posts of a certain type, eg politics
externally, your political posts look separate from your other posts
	(useful if you don't want your personal reputation influenced by your political posts)
interally, however, you would want to have the posts linked to both your identity and the alias
so you can search across both of them at the same time
shows how the concept of "tag ownership" is rather arbitrary


by default we want everything created/cloned inside the user to attach the user tag
(note that this is different from being in the user-space / user-graph, as mentioned earlier)
we can do this by having a special "owner" tag
we can do this by overloading the "clone" operator to propagate this "owner" tag
it's like a virus sorta
this implies that we can overload the clone operator in the first place (even though it's an atomic bheavior of the language)
also implies that each module/scope "owns" the cloning that goes on inside it
should every cloned object contain a reference to the module that cloned it?
is there a case where we would not want that, like a case where a module wants to discretely clone things, without disclosing identity, so that the objects created aren't aware of it's existence


if you clone a BFS, does it create it's own tag? or still use the existing one?
when you clone something, you shouldn't have to worry about affecting the original
(though you do have to worry about the original affecting your clone, as that's how dataflow works: if the original changes, the clone reflects that change)
in fact, the original shouldn't have to worry about clones affecting it
so I think by default the tag should be separate
creates a new tag with the same name, like variable shadowing

### State Variables and Contracts

in the previous section, "Tag Ownership - Delegation and Aliases",
	we talked about how we should be able to clone without worrying about affecting the original
there are cases where we want the clones to affect the original though
for example: state variables
if you have a modifier function, you want every instance of that modifier function to affect the state variable

it seems dangerous to make every variable a state variable
that means, you always have to worry about other people modifying your variables willy nilly
only way to prevent modification is to make your variable private, or to create a private+public pair, a read-only public variable (as discussed earlier)
however, most of the time, people want to just be able to create a public property without worrying about attackers modifying it
so while the read-only public property option is viable, it will need to be used so often that it's annoying

if you think about how state variables work
using the flag-watcher model
it's essentially a contract
the state variable declares that it's "watching for flags"
in fact, the state variable should be able to fine-tune the flags it is watching
for example, a state variable that only listens for flags that match a certain regex pattern
this reinforces the idea that state variables are a contract

### Explicit State Variable Declaration

(continued from "State Variables and Contracts")

thus, state variables should be declared explicitly
so people know that it is subject to change
and that people are allowed to modify it
and the conditions that are required to modify it


### State Variables and Scoping - Orthogonality

so what should the contract be by default?
anybody can modify it, as long as they can see it?
so even something like this:

	foo:
		alias: a.b.c.parent
		alias.stateVariable += 10

or maybe we should only allow modification if it's in the same scope as the state variable??

but if we wanted to restrict modification to the same scope, we could use a private variable for the state variable,
	and expose it to the outside using a public mirror

orthogonality
we should strive to keep each facet of our language separate and independent
remember that scope is just a convenient tree-style inheritance pattern
state variables and versioning are a separate mechanism, that can be used alongside scope, or independently

who is in charge of ensuring that the "flag-watcher" system is upheld
that means, that no matter where the "flag" is raised, the system has to ensure that it reaches the state variable
the interpreter/compiler has to uphold the system
it's just like a type system
the interpreter/compiler is responsible for upholding the language's rules
so we have to ensure that the "flag-watcher" system is not too unreasonable to embed inside our interpreter
can't be too slow or complicated

### State Variables with APIs?

can we create special state variables
that expose an API
specific methods for modification
eg, a list `foo` that can only be added to, not replaced or overwritten

we can do so using this pattern

	foo:
		#privateVar := ()
		push: x >>
			#privateVar += x
		unshift: x >>
			#privateVar := privateVar + x
		value: #privateVar
	bar:
		foo.push(10)
		foo.unshift(20)
		print(foo.value)

### Cloning and Ownership

* note that `foo.push(10)` creates a clone of `foo.push` inside `bar`
* one might think that `bar` might be able to inspect or "hack open" the clone and figure out the value of `#privateVar`
* however, we clearly should not allow that
* thus, this implies that `bar` does not fully own the clone of `foo.push`
* in fact, `bar` only owns the arguments passed into the cloning operation

### State Variable Syntax - Declaring vs Modifying

right now we use `:=` for declaring and for modifying state variables
but this can get ambiguous:

	foo:
		#privateVar := ()
		foo:
			#privateVar := () // are we declaring a new state variable (shadowing the one above), or modifying the above state variable?


need special syntax for declaring state variables, in case we want to shadow an existing state variable

### Tag Ownership - Explicit or Implicit?

maybe "ownership" has to be explicit
for example, if we had some 3rd party tagging app like Facebook
you have to connect your "user" to the 3rd party app
sign in or something
and that will tell the Facebook app to tag everything under your user

so does it really have to be explicit?
to a certain extent, feels like you would want implicit in certain cases
	explicit forces every 3rd party app to implement this "sign-in" procedure, in order to explicitly connect the user
	but I feel like it should be automated
	like, whenever you add a 3rd party app to the user, it's automatically signed in
so can we find a proof why it has to always be explicit?

we can clearly see that, we can't base "ownership" off of references
references are just associatiations, unrestricted graph edges
but "ownership" feels more like a hierarchal strcutre
	cycles don't make sense. We can't have `foo` owning `bar` and `bar` owning `foo` at the same time
so maybe ownership should be tied to scope
a system build on top of our scoping system

can we make ownership a system on top of scope?
maybe just do a query

	find objects where (#liked., this in ancestors)

### Nondeterminism (check if this name is taken)

in the previous section "Tag Ownership - Explicit or Implicit?", we talked about leverage the scoping system for ownership
for example, finding all children (and descendants) with the `#liked` tag using a query like 

	find objects where (#liked., this in ancestors)

actually would be nice if we could use `this = ancestor` instead of `this in ancestors`
	feels more natural, linguistically
but that starts getting into non-determinism

can we do non-determinism?
eg, an object can have multiple properties with the key `ancestor`
and when checking equality, only one of them has to return true
not very different from just using a list and checking for existence inside the list
but syntactically, feels nicer
probably many other possible uses too

currently, if you try to define multiple properties with the same key, it will give `overdefined` error
but one of the main reasons we wanted to indicate `overdefined` was if you delegated property definitions to multiple "satellites"
as in, you have multiple modules build a structure, you need to ensure they don't collide
but we don't allow this sort of "dynamic property modification" anymore, this kinda indirect binding
so maybe we don't need `overdefined` and can do non-determinism instead?


nondeterminism and tagging similarities?
like, if multiple users tag the same object with the same tag
that's kinda like nondeterminism? maybe?
maybe we should have a special variable for nondeterministic variables? or maybe a special key/property?

### State Variables vs Tags

state variables seem to use a mechanism like indirect binding
maybe we can generalize state variables to queries as well
maybe state variables are a specific type of query
a query looking for every "tagging" that uses the modification operator `:=`

though there are some differences between state variables and tags...
tags work like normal properties, and tag queries are just a search operations,
	 so tag queries have to obey scopes, public vs private
	 a tag made privately in a user space, will not show up in a public query
but for state variables, when you modify the state variable you automatically broadcast, make public, your modification


### Aggregators

(continued from "State Variables vs Tags")

state variables as a query
just query for "last" in the list of states
state variables generalized: a bunch of modules define an indirect binding, and then the query accumulates it
though we can implement queries using state variables
use the state variable as the accumulator, and then query on the state variable
implementing query on top of state variable, or state variable on top of query, same thing
maybe a better term would be "accumulator"
or maybe "aggregator"

by default, an aggregator acts like a state variable, and returns the "last" thing
but you can override the "aggregator function"
you can notify an aggregator with information from anywhere
like, giving it a new state/version
or a new tag
hmmmm...but with state variables, you always want to broadcast it to the aggregator, make it "public"
but with tagging, you want to respect privacy, and have the aggregator search/traverse for the tags

### Aggregators - Voting

voting
eg, "Joe" tags "Obama" with a "#upvote" tag
a tag that you want to make public, aka broadcasted to the aggregator

with tagging, you often clone the object, and then add a tag
with state variables, you clone the API method, but not the object


lets say we have members of a club, that vote on a new president every week
when a member joins
how does the member get added to the roster
so that they can vote, and their votes are registered?


if two graphs are disjoint, there is no way for them to connect
for them to connect, there needs to be a "universal" arbiter that they communicate with
and by communicate, that means, edges going into and from the arbiter
and they can both send signals to the arbiter, to tell the arbiter to connect certain parts of each graph
this is essentially the same thing as the graphs being connected (not disjoint)

note that, it's possible for two graphs to get connected without needing communication
if an 3rd-party arbiter has edges going towards both graphs, the arbiter can connect them 

### Explicit State Variable Declaration - Club Member Roster Example

let's say we have a club, initially made with 3 people
the club has a voting system
let's say the `members` list wasn't made as a state variable (maybe an oversight or something)
	so it's a static list, eg `members: Joe, Mary, Bob`
now, the club wants to add more people
realize they can't
so maybe we should allow all variables to be treated as state variables after all?

no the better way to handle this is
remember that the club itself is a program/graph
and the programmer who created it
can modify it, change `members` to a state variable, and push the change
just like a git revision
and now `members` can accept new members

so the general pattern is thus:
when you define a graph/program, you decide which variables are meant to take in changes (state variables) and which are fixed (regular variables)
this process of defining a graph or making a program, can be thought of as a state variable as well (because a program may have multiple revisions)
if you want to change a fixed variable to a state variable, then the initial creator has to redefine the graph
and this can be thought of as going "up" the hierarchy and finding the nearest state variable (in this case, the program), and changing that

kinda like, if your club initially submitted a list of "club rules" to the administration
and later realized that the club rules were too restrictive and didn't even allow you to change your own rules
so you go to the administrator and ask if you can change the club rules, to something less restrictive
and of course, the administrator will see that the new rules will allow the club to define/modify their own rules, and the administrator can block it if necessary
so if the hierarchy was like this:

	school
		admin (state variable)
			clubs
				musicClub
					members

the music club goes up to the nearest state variable, in this case `admin`
and then asks the `admin` to change `musicClub.members` to a state variable

### Declaring Aggregators

aggregators are a way to declare that you want to create a binding towards it
it's a "receiver"
creates two way bindings

aggregators can be used alongside "tags" and "queries"


this shows that we don't need special mechanisms for tags or tag queries
tags are just local properties
tag queries are just regular queries

by default, the "find" query should search based on hierarchal scope
that way, we can do lots of optimizations, like query hashsets
but you can always do a "deep search" which searches the entire graph, but is quite slow
