Block chain timestamps
* fourth method for resticting API calls
* we have permanent events, with immutable timestamps
* like mouseclicks and stuff
* they are given a timestamp that can't change
* however does this really solve our problem?

* in an earlier section we mentioned that synchronization can be done with state variables and for-loops
* why can't we use that for APIs?

### Queries and Traversing Datasets

One pass for each module, queries and Eve
* the multi-pass algorithm example really showed something important
* in Entangle, and any dataflow language really
* everything is done in a "single pass"
* as in, a single "pass" represents a pattern of data
* every module represents a dataset, and all definitions that use that dataset
* in the Test Scores example, the `for` loop traversed through individual students
	* (see "Imperative vs Entangle - Multi-Pass Algorithms and the Test Scores Example")
* so any tag or operation that pertained to individual students, would go inside the for loop
* as compared to the imperative Test Scores example, which had to split the operations on students into three separate passes

* in entangle, every module corresponds to a single "type" of data
* eg "prime numbers", or "red cars", or "images bigger than 100x100", or "subsets of the input set that sum to 47"
* and the module contains every behavior that uses that data set
* so it's very organized, no fragmentation

* this kinda explains why Eve has the query model
* every query corresponds to a single "pass", a single dataset
* eg a query could extract all prime numbers, and then defines any bindings that use prime numbers

### Matchers and Aggregators

* matchers seem to work well with aggregators
* you start with some data sets, and then open them up
	* use matchers to select specific items
	* use trees of nested matchers and for-loops to traverse deeper and deeper into datasets
	* until you find the items you want, and push them to the aggregator

* remember that we have the `[ ]` syntax for matchers
	* see section "Matchers" and "Dynamic Keys Syntax"


### Reporting Dynamic Keys

* should object keys be saved to `keys` when declared using `[ ]` notation?
* eg `foo[someObject]: 10`, should `someObject` appear under `keys`?
* in javascript, it would (as long as the object is a string or a number, since javascript doesn't support object keys)
* so maybe we should as well?
* but then what happens if it's an expression inside the `[ ]`, not just a single object?

### Dynamically Defining Lists

* previously in the section "State Variables and Indirect Modification II"
* we talked about how we have to use private tags like `#1` and `#2`
* to insert states into the state variable
* because we can't modify public properties (like `stateVar.3` or `stateVar[3]`) directly

* however, note that this means we also can't dynamically define lists or arrays
* for the same reason

* maybe we should allow modification of public properties, but only in the object's declaration scope...

### Insertion vs Modification

* tags do not modify an object
* the url is preserved, object equality is preserved
* it merely "tags" on a property, doesn't interfere with existing data
* but all tags to a single variable, will all go to the same place
* so there can only be one version of an object (see copying tags II)

* perhaps you can only define string/number properties directly, and tag properties indirectly?
* so string/number properties are like statically defined
* tag properties are dynamically defined, and are all aggregators

* Also related to the one pass for each module idea
	* mentioned in "Queries and Traversing Datasets"

* <: used for tag insertion, := for modification
* remember that tag insertion doesn't modify the object, the url is preserved
* := does modify the object, changes the "state"
* perhaps we should also give state variables a special `[]` marker, like `myStateVar[]`,
	* so it's clear that every state var is actually a wrapper around multiple nodes/states
* just like how private variables have the `#` marker, like `#privateVar`

* I actually sort of see the motivation behind Eve now
* if we think of our concept of tagging
* first you have to find and select the items you want to tag,
* and then you can tag them
* and the tags themselves can be used to organize and group data, to make it easier to apply more tags
* matchers or filters are used to select a subset of items
* for-loops are used to attach the tag
* there is the selection step, and the tagging step
* just like how Eve has the query step, and then the binding step

* another way you can think of it is, there the tagging step, and the tag usage step
* so the tagging step is kinda like grouping all the items
* and then the query pulls from all items in the set, and then traverses through the items and performs actions
	* this is the tag usage step

### Aggregator Style vs Functional Style

* aggregator style and functional style work more differently than I thought
* for functional style, you just set up a tree of function calls, and get the output of the last function call
	* working backwards
* aggregator pattern, you start with existing aggregators and data sets, and traverse through them, pushing relevant items to the next aggregator
	* working forwards
* so the "traversal" step isn't really a function call, it's requires special constructs, like for-loops and queries
	* this is maybe why Eve separating queries from binding

(continued in the section "Functional vs Construction Style - Sources and Targets")

### Duplicate Traversals

* we talked about how multi-pass algorithms get reduced to a single pass in dataflow langs
* and this is nice because multiple passes of the same traversal is code duplication

* but there seems to be cases in Entangle where you might have to define the same traversal twice, which seems wasteful
* like what if you had

		for object in foo:
			some:
				complicated:
					traversal:
						if (object is even) object#isEven.

* and then in a separate module
		
		for object in foo:
			same:
				complicated:
					traversal:
						if (object is > 100) object#big.

* however because the first one was private, we have to redo the same traversal in the second
* it would be nice if we could just enter the first one, and insert our code
* but now there is duplicate code, unncessary, causes fragmentation

* however, I think this is unavoidable
* if the first module is private, how are we supposed to know it uses the same traversal?

### Aggregator Style, Eve, and MapReduce

* Eve makes sense
* functional moves backwards
* Eve moves forwards
* you start with some data, and you select items, look for items, and define bindings
* Every query corresponds to an actor, a binder
* identify patterns, tag them

* Actually corresponsds well with filter map reduce too
	* filter and map is the query step
	* tagging is the reduce step

* though feels like it can get messy (talked about in audio notes)
	* any binding can be defined from anywhere, you don't know where bindings are coming from, very tangled

* so if aggregators work so similar to eve tagging
* why don't we have something analogous to a query?
* we do: "modifier" modules, modules with no output
* eg

		tagAllEvens: input, #isEven >>
			for i in input:
				if (i % 2 = 0) i#isEven.

		foo:
			bar: 1 2 3 4 5 6
			#isEven
			tagAllEvens(bar, #isEven)


* My language has both forwards and backwards
* originally, the diagram syntax actually worked mostly forwards
* had the filter step, then the map, then the reduce
* then it started becoming more like functional
* you define objects backwards, in terms of their properties
* but still had a for-loop
* as I dived deeper into the text syntax, it became more and more functional
* state variables re-introduced the forwards idea
* aggregators generalized state variables

* modules started out intuitively as backwards
* very encapsulated, isolated, loose coupling
* simple: output properties defined from inputs
* Very simple and intuitive

* 
* The idea of adding "actors", taggers, came later
* But my language confines the actor to a scope, a module
* You can use plugins too

* actually why do imperative langs not use filter() as a default function
	* even though they have for-loops, which are like map(), and variable modification, which is like reduce()
* maybe ecause there are all types of ways to find, traverse
* and you can define your own types of queries, or traversals
* ultimately, as they get so complex, you just have your query correspond to a variable
* and at that point, all your left with is map and reduce
* So really it's just map reduce
* that is what makes up the forward approach

### Functional vs Construction Style - Compatibility

* so are my backward and forward approaches compatible with eachother
* backward uses all string/public properties
* forward uses all tag/private properties
* so doesn't really seem compatible
* like what if you want to define some string properties in the forward manner
* eg, parse some complex string and get URL and params
* or parse a math expression


* imperative seems to be able to combine forward and backwards
* has for-loops and variable re-assignment for constructional style
* but also has functions for functional style

### Aggregators = Collectors (rename)

* maybe we should call aggregators "collectors" instead
* feels simpler and less technical

### Functional vs Construction Style - Sources and Targets

(continued from "Aggregator Style vs Functional Style")

* functional method: define backwards
* Start with a target, and define it from its sources
* uses recursion and functions

		target:
			fn(
				source1,
				source2,
				fn2(
					source3
				)
			)

* construction (aggregator/collector style) starts with a for-loop, or a spreader, or a query, selector
* uses matchers to filter for specific items
* a single source, define multiple targets

* actually construction style can use multiple sources as well

		for x in source:
			target1 <: x
			if x = fn(source2):
				target2 <: x + source3
				for i in range(1,10):
					target3 <: x * i

* maybe that's why it feels confusing, multiple sources and targets feels like it can get messy and tangled

* the difference between forward and backwards is best described with a diagram
* both start from a single node, and branches out
* for backwards, the branches point back towards the root
	* and at the leaves, are primitives and values
	* the primitives and values combine, and go towards the root
* for forwards, the branches point out away from the root
	* and at the leaves, are collectors
	* values start from the source, and combine and filter until they reach the leaves

* It's more intuitive to view an object backwards, functional method
* More intuitive to construct an object forwards, imperative method

* it seems like conditionals and for-loops are the core components of the constructional method
	* kinda like how queries are a core part of Eve
* both don't really return an "output", so can't be thought of as functions
	* and really be used in the backward method
* they are just declared, and are used to enable branches (using conditionals) or deconstruct sets (using for-loops and while-loops)
	* they do actions, instead of returning outputs

### Collector Passing

* right now we explicitly declare all targets, all collectors
* but could we pass in a collector, to collect all the values aggregated inside the module?

		getEvens: nums, collector >>
			for x in nums:
				if (x % 2 = 0):
					collector <: x

		foo: collector()
		getEvens(1 2 3 4 5, foo)

* or maybe we could just declare a collector inside the module, and extract it afterwards

		getEvens: nums >>
			collect: collector()
			for x in nums:
				if (x % 2 = 0):
					collect <: x

		foo: getEvens(1 2 3 4 5).collect

* though perhaps passing in the collector works better if you have multiple collectors

### Multiple Property Access

* `[a,b,c]` to extract multiple thingd
* Don't confuse with `[mylist]` or `[(a,b,c)]` which uses the list as a single key
* use `[...mylist]` or `[...(a,b,c)]` to extract a list of properties


* I think I talked about this syntax earlier
// TODO: FIND REFERENCED SECTION

### Rename Entangle to Convergence?

* Convergence sounds more like a name for a programming language
* and it also captures the idea of collectors


### Traversals and Set Deconstruction using Functional Style

(continued from "Functional vs Construction Style - Sources and Targets")

* whats so special about the for-loop
* why does it seem so essential to the constructional method
* along with matchers and queries
* it seems like it's purpose is to achieve set deconstruction
* declaring objects like `foo: (a: 10, b: 20)` or using collectors is a great way to group items into sets
* but we need a way to deconstruct those sets and act on individual items

* in functional, we pass in functions in order to deconstruct sets
	* eg the `forEach()` or the `map()` functions

what about while-loops

define arbitrary deconstructors
* in fact, functional style allows us to define arbitrary deconstructors
* eg

		foo: someDeconstructor(
			a: 10
			b: items
			mapFn: item >> item*item
		)


* functional equivalent of queries or traversals
* is to use a deconstructor
* pass in a module, that acts on the deconstructed data
* a for-loop is just a type of deconstructor
* syntax sugar
* matchers are also just a type of deconstructor
* nondeterminism is also one (prolog)
	* this is talked about more in depth in the later section "Nondeterminism and Set Deconstruction"

### Collector Passing II

* seeing how functional style can be used for traversals
* maybe you should be able to pass in collectors
* note that passing in collectors is different from inserting to a collector out-of-scope
* because you are still declaring the collector in scope?


### State Machines II ??

state machines
you can create a "sticky" switch

	checkBalanced: tree >>
		#isBalanced
		#height
		default #height: 0
		default #isBalanced: true
		for node in tree.nodes:
			node.#height: Math.max(node.left.#height, node.right.#height)
			if Math.abs(node.left.#height - node.right.#height) > 1:
				checkBalanced.#isBalanced: false

notice that anywhere in the tree, #isBalanced could be set to true
however, because it can only be set to true, there is nobody trying to set it to false, there is no collision, no `overdefined` error
and everything is completely asychronous and unordered, no need for state variables

though I think for state machines, often state variables will be necessary, to keep track of the current state of the machine
I think we should have a special mechanism for state machines though

note that special `default` keyword that we are just now introducing
basically, it means that if a node doesn't have a value for that tag yet, return the default value
this handles the base case (empty/null nodes in the tree) of the algorithm




right now we declare a variable as public or private based on whether or not it has a `#`
but that seems a little weird
what if we want public `#` properties?

also, you should know whether or not a variable is private or public based on it's variable name
you should know whether or not a variable is private or public based on it's variable name
not based on whether or not it has a `#`
you can have public tags

you have to manually declare `private`
`#foo` is just for declaring a new key
prevents collisions
the `private` keyword ensures that the key doesn't appear in the public `keys` list
so you can use `private` on string variables too
they are still accessible by string, but not through iteration



not to mention
even if it's private string key, you can access it directly
and even if it's a public # key, you can't access it normally
	you can't just do `foo.#publicKey`, because it will try to pull `#publicKey` from the current scope
string keys are by default public, but you can decalre them private if you want
`#` keys are by default private, but you can declare them public if you want


if we allow insertion of string keys
notice that we can insert private keys without requiring an aggregator
	checkBalanced #height example
so if we are to treat string and private keys the same
then that means we should allow insertion of string keys without declaring an aggregator
something like

	foo:
		bar:
			a: 10
			b: 20
		for ()


we should only allow insertion of string keys in the definition scope
that was in a way it's still localized, like static definitions
what about calling a function

	foo:
		bar:
			a: 10
		insertProp(bar)

is this allowed?
no, because if we start allowing this
`insertProp(bar)` could call another function that inserts a property
we have to start keeping track of these call chains
so better to just keep it localized to the definition scope

maybe the definition scope has a special "write" key that is propagated to the nested scopes?

notice that you can create a private scope, and it will still be able to insert a property
implications?

maybe because, when you statically declare it in the definition scope

	insertProp: coll >>
		coll.test: "hello"
	foo:
		bar:
			a: 10
		#privateScope:
			bar.test2: "hello"
		insertProp(bar)

notice that when `insertProp` was declared, it was not made aware of `bar` explicitely
whereas in `#privateScope`, it does reference `bar` explicitly
so maybe this explicit binding is what allows `#priavteScope` to insert
passes the special write key to `#privateScope`, not `insertProp`

so if you want to insert a property
you either have to be in the same scope as the collector
or you have to "enter" the scope
	talked about dynamically entering a context in an earlier section
	// TODO: FIND REFERENCED SECTION




if you do something like

`foo.bar.zed.x : 10`

does it auto create nodes?
maybe nodes are by default `()`, not `undefined`?
same question though, should it create the points `foo.bar`, `bar.zed`, and `zed.x` automatically?
even if the nodes were by default `()`, adding these would make it non-empty




notice that #height is actually modifying the original object
from outside the context

maybe we can make it based on the variable
so it's actually modifying the alias, but not the 

however, that doesn't work for case of #height
because we want the for loop to work

	checkBalanced: tree >>
		#isBalanced
		#height
		default #height: 0
		default #isBalanced: true
		for node in tree.nodes:
			node.#height: Math.max(node.left.#height, node.right.#height)
			if Math.abs(node.left.#height - node.right.#height) > 1:
				checkBalanced.#isBalanced: false

notice that we are modifying `node.#height`, and `node` is an alias, but we want it to attach the property to the original object

if #height is modifying the original object from outside the context
and we mentioned how modifying an object out of context is dangerous
how come we don't run into problems with private keys like #height?
well they are private, so no collisions...
but they could still collide...

what if we used a public key for the checkBalanced example

	checkBalanced: tree >>
		for node in tree.nodes:
			node.height: Math.max(node.left.height || 0, node.right.height || 0)
			if Math.abs(node.left.height - node.right.height) > 1:
				checkBalanced.isBalanced: false

notice that we are modifying `node.height`, `node` is an alias
though this is dangerous, because now we are modifying the input `tree`, and might cause collisions
so maybe string modification should be restricted to definition scope, and tag modification is restricted to tag scope

the way we can think of string modification being restricted to definition scope
is that when you declare a new object
you declare a secret "write access" key with it, a tag, eg `#insert`
this tag is inherited by everything in the definition scope (just like any other private tag)
and every time you modify the object, eg `bar.test2: "hello"`, you are actually doing `bar.#barInsert[test2]: "hello"`
notice how you wouldn't be able to do this outside the definition scope
because you don't have access to `#barInsert`

does every scope declare a write-access tag, or every variable?

collector
notice that we are collecting array values using `<:`
	eg `myList <: 10`
and collecting properties using `:`
	eg 	`foo.#mytag: 10`

what about collecting multiple properties?
maybe something like

	foo.bar <:
		a: 10
		b: 20




You can think of the write access tag as
A tag visible to the compiletime
But it isn't visible at runtime
It's only used for compilation
Everything relating to scoping is only for compilation anyways

You can dynamically enter a scope
And create new nested module
That inserts a string property to an object in scope
And the interpreter can check that u have write access
Because the write access key will be provided to you when you enter the scope
If u don't have the key, interpreter throws an error, warns u
This is the power of dynamic scoping, and independent compilation
Everything related to compilation and scoping is encoded in data and variables
So you can manipulate and access it, change how the interpreter works using the language itself

Something to keep in mind
We allow public property insertion for objects in scope
To make it easy to construct objects in a more flexible way
But if we allow dynamic entering of scopes
These scopes could get huge, with tons of different nested modules create by different people
It can get difficult to figure out where each public property is coming from
(though the same is true for private tags)
We should consider how big these scopes can get when figuring out the rules for tagging and insertion




notice
when you are modify `bar.test2: "hello"`, you are actually doing `bar.#barInsert[test2]: "hello"`
you aren't modifying `bar.test2`, you are modifying `bar`, inserting a new property
just like with collectors, except instead of inserting a list item, you insert a property

this is a special write access key created by the interpreter, and used by the interpreter
every time it sees a new variable declaration `xxx:` it expands it to `xxx: #xxx_insert`
every time it sees `xxx.yyy:` it expands it to `xxx#xxx_insert.yyy: `
wait...but thats still a variable insertion...circular

### Modifying Properties vs Plugins

what if you want a function that modifies/sets some properties
like, a function that takes in a string object, checks if it's a url, and if it is, sets the appropriate properties
eg
	
	initUrl: string >>
		if (invalidUrl(string))
			error: "not a url"
		else
			#regex: /(\w+:\/\/)?([^:/?]*)(:\d+)?(\/[^?]*)?(\?.*)?/
			#matches: string.match(#regex)
			for (groupVal, index) in #matches:
				mapping:
					0: 'protocol'
					1: 'domain'
					2: 'port'
					3: 'path'
					4: 'paramString'
				groupName: mapping[index]
				initUrl[groupName]: groupVal

			isSecure: protocol.contains('https')
			params: paramString.split('&')

	url: "https://www.google.com:5000/main/page?query=hello&query2=world"
	initUrl(url) // imperative way, doesn't work, can't modify url

you can't just do `initUrl(url)`, because remember, we don't want to allow external functions to modify internal properties

but there is actually two ways to do this without needing external functions to modify internal properties

two ways to do this
both involve "plugins"/addons

first method: make all intermediate vars inside the external function private, and only expose the properties you want added to the target object

	modFn: obj >>
		#var1
		#var2
		outputProp1
		outputProp2

	obj:
		a: 10
		b: 20
		modFn(this)...

second method: you can have public intermediate vars, but use a designated property in the external function to store the output properties
	note that we can leverage the return property of functions for this

	modFn: obj >>
		var1
		var2
		~>
			outputProp1
			outputProp2

	obj:
		a: 10
		b: 20
		modFn(this)~>...

second method is probably better
I am trying out some new syntax for calling functions too, `fn(args)~>`

pseudo-properties
any way to "add" plugins or properties to an object
say, add a set of library functions to the String object
like "search" or "find"
without needing to call the library functions normally, like `UserLibrary.search(mystring, params)`
it's much cleaner to do `mystring.search(params)`
maybe `mystring[UserLibrary.search](params)`?
maybe pass in a function to the accessor, and the accessor will call the function on the object?
but needs to maintain privacy and secure
so maybe metaprogramming
override the string object?





url example
tagging vs accessing/modifying parent/scope variable

	#mytag
	#privateVar
	foo:
		for node in tree:
			node.#mytag: 10 // tagging
			#privateVar[node.value]: "hi" // modifying scope variable



maybe if we want to modify parent/scope variable
we can use `(var): value`?
just `var: value` will set `this["var"]: value`
but `(var): value` will access `var` from the scope and set that?

or maybe we do need private variables with regular names, and `#` is only for tags?

what if we use `...`? does it overshadow parent properties?
does `...` change what variables are in scope?

no, I think scope is static

the problem with making it dynamic
is first off, very hard to keep track of and debug
but also

you can also just use `someScope.someProp` to access a dynamic key

the scoping system is already dynamic in a sense, in that variables will overshadow other variables declared with the same name
	so accessing `someVar` can return different things depending on how the scope is set up
for property access, `someScope.someProp`, if the property exists, it will return the property, otherwise it will return `undefined`
	so accessing `someScope.someProp` also returns different things, depends on how the object is set up
trying to mix these two concepts together makes it too messy

static variable referencing and scoping is based on property _declarations_
dynamic property access is based on property _existence_




when you clone `undefined` you get `undefined`, no matter how many properties you override
eg, if you do `foo.bar(x: 10)`, but `foo.bar` doesn't exist, then you don't want `foo.bar(x: 10)` to return `(x: 10)`
so I guess properties are not by default `()` or empty objects, as mentioned previously
	// TODO: FIND REFERENCED SECTION



Actually you can just modify public vars just fine
No need for (var): value notation
If you do var.foo: value
It knows that the `var.` is a property access, so it pulls it from scope
var["hi"] works the same way, it can detect that `var` is a property access, not a property declaration
Strings should be syntax colored yellow
So when you do `foo.bar.hi: 10`
To indicate that foo and bar are variable accesses
While `hi` is just declaring a string key

Note that you can only do one-level insertion
You can't do like foo.bar.zed: 10
Because you don't have access to foo.bar#bar_insert
And also, foo.bar is dynamic but insertion is static
Maybe I should use the <: for inserting properties
That way this is clear
foo <: bar: 10

Diagram syntax
actually illustrates insertion well
and shows why inserting into indirect is weird

Can only modify private vars
makes sense with write keys
Allows you to pass in write keys
Though should we allow this ... ?
X.y.var[write_key] <: foo : 10
What happens if wrong write key
how do we detect that write_key is a write key, so we can explicitly allow this indirect insertion

Freeze the state and inputs of a module, and extract it, debug it isolated
Though if one of the inputs is a object, you can really freeze that, have to do a deep freeze and analysis
Though still easier to isolate modules and test them than imperative
Because of loose coupling and pure functions
Live testing and debugging
No need to "freeze" anything, or iterate step by step

We should be able to write an entangle  interpreter inside entangle
That way we can change scoping rules and stuff, allow dynamic entering of contexts, maybe shared scopes, etc
Metaprogramming, writing custom IDEs
Actually, I think all we"re trying to achieve
Is flexible scoping
Define scoping in terms of core language constructs
So you can design systems with custom scoping
Scoping is just an approximation anyways
Write access keys may allow out of scope modification
Which can make things complicated and messy
But that's the risk you take when you start defining custom scoping
Current scoping rules are restrictive, but intuitive and encapsulated
If you want to define your own scoping, then it's up to you to make it clean and intuitive

State vars also scoped
Dynamic index numbers show up on left 
Should for loops be ordered or unordered
"do for" loops?
Maybe dynamically ordered, based on if you use any commutative 




### Ruby Language

* I looked into Ruby because I heard it was a "full-stack" language
* just like what we are trying to achieve with Entangle/Convergence
	* see the section "Entangle is for Web Applications"

* Ruby's instance variables actually seem pretty similar to my private variables
* implicit declaration, no need to declare variables at the top of the scope
	* though instance variables are bound to the "instance", whereas my implicit declaration is unbounded
* uses the syntax `@<var name>`, just like how I use `#<var name>`

* ruby seems to have heavy emphasis on metaprogramming and reflection
* just like my language

### Nondeterminism and Set Deconstruction

* nondeterminism is like a way to group items, while actions on the group still act on individual items
* in imperative, when you group items, actions on the group act on the group
* for example, in imperative you might have something like this

		testscores =
			joe: 60
			mary: 85
			alice: 90
			bob: 80

		goodstudents = []

		for (student, score) in testscores:
			if (score > 80)
				goodstudents.push(student)

* whereas in prolog

		testscore(joe, 60).
		testscore(mary, 85).
		testscore(alice, 90).
		testscore(bob, 80).

		goodstudent(X) :-
			testscore(X, Y),
			Y > 80.

* notice how the reference to `testscore` in `goodstudent` references a single student, a single score
* whereas in the imperative example, when we referenced `testscores`, we referenced the entire group of scores

### Prolog Language

* Prolog also doesn't have variable declarations
* in the prolog Test Scores example in the previous section,
	the reference to `Y` in the predicate `goodstudent` is an implicit declaration

* in the sections "Undirected vs Directed Graphs" and "Modeling Sets Using Tags"
* we talked about you declare like `myobj.#myset: true` (with shorthand syntax `myobj.#myset.`)
	* basically the trailing `.` expands to `: true`
* but we also discussed how this was sort of weird, and how we are trying to model an undirected nature (sets) with a directed model (properties)
* it seems hacky, using `true` as the label for undirected edges, and using a label for directed edges
* like, what if we want to have multiple labels? how do we convert that to a single label?
	* we explored this idea before
	// TODO: FIND REFERENCED SECTION

* however, notice how Prolog also uses the trailing `.` to indicate set membership
	* eg `student(joe).`
* however, prolog allows multiple variables in a predicate
* eg `testscore(joe, 60).` (from the earlier example)
* so how does this translate to our model, aka directed graphs with one label per edge
	* or in other words, properties with a single key
