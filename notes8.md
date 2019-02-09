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

Revisit 1/15/19:
* actually similar to Prolog queries too, where you constrain a set of variables to a set of conditions
	* constraining a var to a set of conditions, and assigning it to a predicate,
		is the same as filtering a dataset based on conditions, and assigning a tag

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
	see section "Scope Passing, Dynamic Live Modification"




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




### Dynamic Scoping and Write Access Keys

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

### Direct vs Indirect Insertion - Diagram Syntax

Note that you can only do one-level insertion
You can't do like foo.bar.zed: 10
Because you don't have access to foo.bar#bar_insert
And also, foo.bar is dynamic but insertion is static
Maybe I should use the <: for inserting properties
That way this is clear
foo <: bar: 10

diagram syntax actually illustrates insertion well
and shows why inserting indirectly is weird

direct insertion: `collector <: someFn(input).val`

		                      val
		input ---> (someFn) ---------------> (collector)

indirect insertion: `obj.prop1.collector <: someFn(input).val`

		                      val
		input ---> (someFn) -----------,
		                               v
		   obj -------> -------------(   )
		        prop1    collector

notice how while direct insertion follow a general left-to-right flow
indirect insertion does some weird extraction then insertion, resulting in the blank `(   )` placeholder syntax

like the "flow" for direct insertion

		val1 -----> collector
		val2 -----> collector
		val3 -----> collector

seems to be in the same vein as regular object declaration

		val1 -----\
		val2 --------> collector
		val3 -----/

even if the direct insertion happens inside a for-loop or something, we can imagine the arrows flowing out of the for-loop and all converging into a single static variable
direct insertion is just syntactic sugar for object declaration,
	since the collector is static, it can easily be converted to object declaration

this is not the case for indirect insertion, where the target for the insertion has to be extracted first

for direct insertion, you can imagine a bunch of values going through a series of transformations and then finally converging at the collector
indirect insertion feels more like a "splicing" operation, where you pull out the collector, open it up, insert the values, then put the collector back




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




we can view the prolog example as being like


		(name: joe, test_score: 60, #testscores)
		(name: mary, test_score: 85, #testscores)
		(name: alice, test_score: 90, #testscores)
		(name: bob, test_score: 80, #testscores)

		for person with #testscores.:
			person.#good_student:  (person.test_score > 80)

use a tag in place of predicates
use properties in place of variables
use traversal in place of a query

using a tag in place of predicates actually allows you to attach multiple predicates to the same object



we talked before about tags and nondeterminism
	// TODO: FIND REFERENCED SECTION

we can do the same with the `with` keyword

maybe we can even use tags
	for powerset, attach the tag `in_set` and `not_in_set` to each


// TODO: FIGURE OUT HOW TO DO THIS


### Collector Passing III - Multiple Collectors

what about collector passing to add to multiple collectors
you can't really use the `...` method because you need to add to multiple collectors

for each function, we have multiple outputs, each output containing the properties to insert for the corresponding collector
for each of the functions, we need to provide a mapping between those outputs, and the collectors

the key to notice is that we have many-to-many relationship
we might have 5 state variables
and 8 functions
and each of those functions contribute to a subset of the 5 collectors
in the diagram syntax, this might look like a bipartite graph

in order to define such a complex graph, we need intermediate variables

	fn1output: fn1(args1)
	fn2output: fn2(args2)
	fn3output: fn3(args3)

	collector1: (...fn1output.collector1 ...fn2output.collector1 ...fn3output.collector1)
	collector2: (...fn1output.collector2 ...fn2output.collector2 ...fn3output.collector2)



what about adding to a list, appending to a state variable


### Convergent Feedback

// TODO: CLEAN THIS UP

* for a breadth first search
* we don't actually need to use state variables, which gets quite complex
* we can use a more "dataflow" approach
* basically, we have the "start" node, and at every node we keep track of the distance from the start node
	* `#distance` is just 1 plus the min of all the `#distance` values for each neighbor
* to find the first occurence of our search query, we return the node that matches the query, and is the closest to the start node

		BFS: graph, query >>
			#matches: graph.nodes.filter(query)
			#minmatchdistance: Math.min( matches.map(n => n.#distance)... )
			for node in graph.nodes:
				#distance: Math.min( node.neighbors.map(n => n.#distance)... ) + 1

			=> #matches.filter(#distance = #minmatchdistance)

* note that we don't have to worry about infinite loops because minimizing the neighbor's distances,
	will automatically ignore cycles (which will have longer distances)
* this is basically just Dijkstras algorithm
* no need for `#visited`

* note that this also leverages feedback
* the dataflow graph will contain cycles, because each node will be dependent on the `#distance` values of their neighbors

* however, the feedback is convergent, so will stabilize in finite time

* divergent feedback would be like longest path alg, max of distance for each neighbor
* and would be like an infinite loop in an imperative lang

### Private Keys not Private Vars

// TODO: FIND PREVIOUS SECTION

* private keys are shareable, allows for a more flexible authorization system
* imperative langs use private vars
* systems like facebook groups use private var system too: you have to be an "authorized user" to see the content
* but it's really just a farce
* Joe might not be in the group, but if Joe's friend is in the group, then Joe's friend can screenshot the content and send it to Joe
* this actually makes sense in the private key model
	* Joe's friend has the private key to the content, like a pointer to a hidden memory location
	* but Joe's friend can share the private key, and then others can follow the pointer to the content

* though this seems a little insecure and restricted
* lets say Joe wants to share the group content with Amy, so he shares the private key with her
* then would Amy be able to post and comment in the group as well
* does she have "write" access?
* doesn't seem like Joe would want that
* not to mention, because everything Joe posts and comments is tied to his user
* if Joe shares his private key to Amy, then all of Amy's posts would be tied to Joe
* Amy would be able to comment on Joe's behalf, which Joe probably doesn't want

* It's not just write access actually
* maybe Joe wants to share a photo album with Amy, but he doesn't want to share all the private notes and comments he attached to each photo
* Joe could use private tags for the notes and comments, so Amy wouldn't be able to see them
* but if he already made the notes and comments regular properties (which is easier to work with, coding-wise)
* then he would have to retroactively change them to private tags
* which is ugly

* so what Joe actually wants to do, is create a new private key with different permissions
* so for the facebook group, Joe would give Amy a private key with read permissions
	* maybe make a clone of the group content, so any modifications Amy makes gets applied to the clone, and not the original group
* for the photo album, Joe could create a clone of the content with just the photos, not the comments and notes
	* could do this by cloning each photo and overwriting `.comment` and `.note` to be undefined


### API Wrappers

* we talked about how Entangle/Convergence is for web applications
* and how it can be used for writing the full-stack of a web app
* we also want to be able to communicate with APIs in an intuitive way
	* call them like normal functions, instead of using GET and POST, which feels a bit ugly
* one way we can achieve this with existing RESTFUL apis, is to wrap them in a module

		// reference: spotify web api documentation (https://developer.spotify.com/documentation/web-api/reference-beta/)

		spotifyAPI: RestAPI
			url: 'https://api.spotify.com/v1/'

		// adds two tracks to the given playlist
		// so '.playlists[playlistID].tracks' will correspond to the url path /playlists/{playlistID}/tracks
		addTrackResponse: playlistID >> ...
			spotifyAPI.playlists[playlistID].tracks.post
				uri: 'spotify:track:4iV5W9uYEdYUVa79Axb7Rh', 'spotify:track:1301WleyT98MSxVHPZCA6M'
				position: 3

* remember that in Entangle and Cono, web urls correspond to object paths
* so notice that we don't even need to provide the endpoints to the `RestAPI` call
* the wrapper will dynamically convert object paths to a url, up until the `post` call
* so `.playlists[playlistID].tracks` will correspond to the url path `/playlists/{playlistID}/tracks`
* so `spotifyAPI.playlists[playlistID].tracks.post(...)` corresponds to `POST https://api.spotify.com/v1/playlists/{playlistID}/tracks`

* maybe we should make the methods `post` and `get` and `delete` tags instead
* that way they are distinct from the url path elements, easy for the `RestAPI` module to detect where to terminate the url path
	* and who knows maybe some endpoints use a url that contains `.../post/...` or something, which would be impossible to reference if `.post` terminated the url path
* so the api call will look like `spotifyAPI.playlists[playlistID].tracks.#post(...)`
* we would also want to declare these keys in `RestAPI`, and expose them to our client module

		#get, #post, #delete: RestAPI.HTTPMethodTags

* notice that this also allows us to name these tags whatever we want on the client side
* so in case we happen to be using tags with these names as well, we can use different names to avoid collisions, like `#httpget` or `#httppost`

* notice that we also only need to expose these keys to the client module once,
	* even if we create multiple API wrappers (for accessing multiple APIs)
* because any api that extends the `RestAPI` wrapper will be compatible with these tags




### API Calls and Internal Modification

( loosely continues from section "API Calls")
( note that this is different from the sections about "API Calls and Cloning Restrictions",
  because while those sections talked about restricting access to API calls,
  this section talks about fundamental issues with allowing API calls in the first place)

is it ok for API calls to modify internal object properties, like imperative class "methods" do?
eg,

	Deck:
		#cards
		addCard: card >>
			#cards <: card

	Deck.addCard("ten of spades")

note that the `Deck.addCard()` call is actually creating a clone
but is that clone still modifying the original `#cards`?

it feels like you should be able to do stuff like this
it is analogous to an API call
and we don't want to have a separate syntax for API calls
	see section "API Calls"

though it seems like violation of encapsulation
handing over control to other people

maybe we can use the original eventlist method, where you aggregate and iterate across all clones of the method
	see section "Event Lists vs Sequential Logic Blocks" for eventlist examples
	see section "API Calls" for usage of the `.calls` syntax to get a list of all calls/clones of a method


note that the eventlist method assumes that you can detect and compile a list of all clones/calls of a method
flag-watcher model
though this should be possible...
	just use a private var, and insert to collector var in body of fn
	though that assumes that external clones still can modify that internal var


it seems like there are cases where you want to be aware and not aware of clones
* aware, if you want to broadcast your clone
	similar to broadcasting changes (find referenced section)
	also, if you are cloning private vars, then the source should know who is cloning, so they can restrict access if necessary
		find referenced section (about cloning private vars)
* not aware, if you want to make a private clone
	shallow clone, doesn't copy private vars

requests not calls
	you can make a request to do something
	but you can't force an object to do something
	more in line with how the web works

though requests are ugly
you want to guarantee behavior if it's obvious
defining methods, and just calling them like normal, is simple and intuitive

Deck example
	add to deck, remove from deck

two ways:
	1. normal functions way
	2. eventlist method
		compile a list of requests, and do a for loop

APIs, state variables, list push
	state variables are a collector with an API where you can only push
	find referenced section

normally when you clone a module, you want to copy its static outputs, and tweak them based on your inputs
	you own the object
however, what if one of the "outputs" is an action, to modify the original object
	so the original object owns the outputs


actually notice that pushing to a collector in a normal statically defined function doesn't make sense
	it would happen one time, and you probably don't want it to happen

	voteCounter:
		#ballots
		upvote:
			#ballots <: "upvote"
		downvote:
			#ballots <: "downvote"

note that it seems like the initial declaration of `upvote()` and `downvote()` will insert a single upvote and downvote
unless we think of them as "templates", insertions that are only executed when the module is cloned
this is how imperative languages work: a function doesn't get executed when it is declared, only when called
though we are trying to encourage prototypes over templates...

note that even for traversals, like `map()` or `reduce()`
you have to pass in a function, that gets applied to each element in the list
for example:

	#collector
	list.forEach
		item >>
			#collector <: item*item

we have so far been assuming that the function passed in is a "template", inactive during declaration
in addition, the traversal function, eg `map()`, has to call the function passed in,
	which assumes that the clones are able to modify the original collector, even though though they are cloned externally

	foo:
		#collector
		#numCalls: sum(...inputs)
		insertSquare: x >>
			#collector <: x*x
			#numCalls <: 1

		("a", "b", "c").forEach(insertSquare)



what about cloning modules
we don't want to insert to collectors when we clone

diagram syntax, we only want to insert to collectors when moving from the source

maybe insertion should only happen when we are cloning a module a variable number of times
"dynamic" cloning
so like, a `map()` or a for-loop, both clone a module based on the number of iterations
so if there are zero iterations, then there are zero clones, so zero insertions
it seems like we only want insertion in cases with dynamic cloning


do we need recursion?
	technically no, assembly code uses loops, turing machine uses loops
what if we just had: 1 infinite set, and 1 set deconstructor
then every time the set deconstructor is used, that is when collectors are "enabled"

maybe we can make it so insertion only happens for calling functions, not cloning
after all, it seems to work fine for imperative langs

we need some way to distinguish defining a module vs "executing" it (having it actually modify the source object)
so maybe we can leverage functions? Aka only functions can modify the source object, and it only occurs when you call the function?
or maybe we can define a new type of module, a "modifier" module, that has a special designated property for all modifications
	just like how functions have the special `_return` property
and do we need a special associated operator as well?
	just like how functions have the call operator
	maybe we need a "execute" operator, that not only clones the modifier module, but also executes the modifications
this feels like it can get messy though
can we have modifiers that are also functions? then you would have to account for a "call and execute" operator


what about conditionals?
technically a "dynamic" cloning, because it can either happen zero times or once
but its not in a loop


it seems like we're introducing actions (specifically, the action of inserting), which is why this is getting messy and inconsistent
sometimes you want the module to define the action
sometimes you want the module to execute the action

1. in the beginning, every module represented a data set, just a bank of variables, and the relationships between those variables
	* those variables could depend on input variables or scope variables, but it could not modify these external variables
	* read, not write
	* every module was completely encapsulated, self contained
2. this changed when we introduced state variables, and event lists
	* we wanted to start modeling "changes" in variables
	* but it still seemed to follow the data model
	* every module just had a variable representing the "next state" of an input
	* it still never directly modified any external variables, it was up to the `reduce()` function to chain the modules together and connect the individual states of a variable
3. then we introduced aggregators/collectors, which were supposed to be unordered state variables
4. then recently we introduced APIs and API calls
5. but notice that we can model API calls using event lists model

		foo: sqInputs >>
			#collector
			insertSquareInput:
				x: 1 // default input
			for x in sqInputs:
				#collector <: x*x

		bar: foo(sqInputs: (2 3 5))

defines a change
a modifier fn
i guess you can think of modifier fns like monads
you can chain them

they are like the components of a reduction/fold
api calls are like distributed reductions
the variables inside the module are the map
and the modifications defined inside the module are the reduce

the only way you can apply a modification is if you send the clone back
kind of like an api call
the api provides the request format
you create a request, and send it back
and it sends back the response

you send it a module with inputs
it fills in the remainders
	mentioned in section "API Calls and Cloning Restrictions II"
maybe the "remainders" are any outputs dependent on private functions and vars

cloning the module but not sending it
is like cloning the request object
it doesn't affect the api, but it also doesn't return any outputs

maybe it has a flag that is set when it is a complete clone, aka showing that the request was completed and the response was sent

though when would you actually want an incomplete clone?
when you want to clone a modification fn, without actually executing the modifications?
but for that case, it seems weird to think of it as an incomplete clone
just because you don't want to execute the modifications, shouldn't mean that you shouldn't fill in the properties that are based on private vars
two separate things

it seems like our modules are trying to achieve two separate purposes...

however, I don't think that we can simply have separate modules for modifications
some API requests return a response, and modify the service
and what about API calls that call API calls?


do we need to be able to clone and "modify" API calls?
in imperative languages, you can't, you can only wrap an api call
something like `modifiedFn = (a, b) => {c = a*b, return fn(c, 0) }`
"modifying" a function is more flexible, allows you to modify intermediate variables and such
but perhaps it's too flexible?
does it pose a security risk?
eg allow somebody to take advantage of an API call to expose data, maybe by injecting functions or something?
however if an API calls is exposed correctly, it would be impossible to clone and leverage in such a way

note that you want nested modules to still have filled in private properties
but you don't want them to execute modifications
maybe when you declare a nested module as a `template`, it fills in private properties, but doesn't execute any modifications
that includes modifications caused by calls/clones inside the module as well




if you can expose API calls that modify an object
then you should be able to expose an object to arbitrary modification
after all, arbitrary modification is akin to exposing an API function `setProperty()`


flag-watcher
read write
the requester should be readable by the source
but what if some module in some hidden dark corner wants to make an API call
the interpreter can read it, so maybe that works
but the interpreter has to be thought of as part of the system too
so the interpreter can be thought of as some entity that has read access to every object in the language
however that isn't enough, every object has to be able to see the interpreter as well
so the interpreter is like a global communication medium
1. if somebody wants to call an API, they raise a flag
2. the interpreter sees the flag, and raises it's own flag
3. the API see's the interpreters flag, and makes the API call

still seems weird though, to have some global entity with specific properties
the rules and principles should make sense, independent of any objects defined in the system


a private key is like a portal to a secret place in the universe, hidden rooms
any secure or private behavior, can be implemented using private keys
anytime we want to "allow" or "restrict" specific behavior, this can be done through private keys

with the "hidden room" analogy, it makes sense to be able to add objects to the room
aka write/modify the properties of a private object
you can think of the initial declaration of an object,
	as having access to this hidden room, and adding the initial properties
and if you have the private key, you can go back into the room, and add more properties
this is a rephrasing of the "dynamic scoping" idea, talked about in the section "Dynamic Scoping and Write Access Keys"

so does that mean every private key is a write-access key?


maybe using a wrapper function to modify an API request makes sense
because you don't need to fill in anything, if you aren't actually making the request
it's like a deferred request

i think we need a specific example for an API call

	addTrack: user >>
		track: undefined // input
		playlistName: undefined // input

		trackName: track.name // intermediate var, immediately available, public

		#playlist: user.#playlists.find(playlist) // intermediate var, filled in, private
		playlistLength: #playlist.length // intermediate var, filled in, public

		playlist <: track
		print "added a track to playlist " + playlist.id

		insertedPosition: playlist.indexOf[track] // the resulting index of the inserted track

notice that `trackName` can be calculated without relying on the API, doesn't need to make the API call
	because it is public, and the source code is public, so the caller can just clone the source code and execute it themself
	so `trackname` is more like a part of the request than part of the API
however, `#playlist` and `playlistLength` rely on private functionality, so they do rely on the API
	filled in by the API after the API call goes through


now lets say the user makes a sub-function for adding tracks to a specific playlist

	addTrackToFavorites: addTrack(playlistName: "Favorites")

notice that we could possibly want `addTrackToFavorites` to see the intermediate variable `playlistLength`,
	because that is data that could be calculated already, before `track` is even passed in

maybe `#playlist` and `playlistLength` should be another api call
so the two relavant lines would become

	addTrack
		...
		#playlist: getPlaylist(playlist) // calls api fn "getPlaylist", private var
		playlistLength: #playlist.length // intermediate var, public
		...

notice that, when `addTrackToFavorites` clones `addTrack`, it will clone the api call `getPlaylist`, which will fill in the playlist info,
	even though `track` has not been provided yet

or maybe use if(track) and if(playlist)

	addTrack: user >>
		track: undefined // input
		playlistName: undefined // input

		if (playlistName):
			#playlist: user.#playlists.find(playlist) // intermediate var, filled in, private
			playlistLength: #playlist.length // intermediate var, filled in, public

		if (playlistName & track):

			trackName: track.name // intermediate var, immediately available, public

			playlist <: track
			print "added a track to playlist " + playlist.id

			insertedPosition: playlist.indexOf[track] // the resulting index of the inserted track

but this is getting ugly, with modules you can leave things incomplete and it will fill in as much as it can, leave the rest undefined
	and the module will try to use data relationships to fill in as many properties as it can with the provided data
	useful for modules with optional parameters
	eg:

		muxer: left, right, selector >> if (selector) left else right

		muxer(left: 10, selector: true) // no need to provide input "right" in this case

then later on, you can always fill in more properties, and the interpreter will automatically refresh the module to reflect the new data

in terms of insertion and property modification, this style is more in line with state variables
where you provide an index, and the data you want to insert
and you can provide some initial properties to insert to that index
and later on, provide more properties to insert to the same index

this can also be thought of as a "partial request"

however, often when you call functions you can leave some parameters blank (often the case for optional parameters)
so how would you distinguish between a "partial request" and a complete request with some optional parameters
you can't
what we are trying to do is slightly different though
we want to // TODO: FINISH THIS

note that if we use the wrapper method

	addTrackToFavorites: track >> addTrack(track: track, playlistName: "Favorites")

it's actually a little more secure
cloning the original api call, just sets the default value of `playlistName`
but if you were to pass the clone around, the receiver could still override `playlistName` when making the call
however, the wrapper method permanently fixes the value of `playlistName` to `"Favorites"`
so even if the caller tried to override `playlistName`, it wouldn't change the `playlistName` being sent to the api call



function calls are a way to bundle together the request parameters, and keep the response separate (in the `_return` property)
so maybe we should just use function calls for API calls




I was thinking back to the `#height` and `checkBalanced` example
`tree.nodes` means every node has `tree.nodes`, inefficient, lazy evaluation
if we have a basic `treeheight`


lazy evaluation
is it possible with collectors or recursive functions?
this is especially important in streams, aka infinite lists
which require lazy evaluation to work


note that there are actually two ways we can do tree height
we can either do it constructively, use a traversal and attach `#height` to each tree
or we can do it backwards, redefine tree to include `tree.height`

you can use a filter, or you can use an if statement



query/traversal = prolog query
can it achieve everything a function can?
infinite? non halting?


### Converting Collectors to MapReduce

* lazy evaluation should be possible with collectors
* you just keep track of every place modifications could be coming from
* and when needed, ask every location for their modifications
* you can even convert collectors to just regular mapreduce patterns

		// using collectors
		foo: list >>
			#collector1, #collector2
			for x in list:
				#collector1 <: x
				#collector2 <: x*x

		// using mapreduce
		foo: list >>
			// pack all results into an object, and keep track of where each result should go
			zipped: list.map(x => (collector1: x, collector2: x*x))

			// extract the corresponding result from the object
			#collector1: zipped.map(obj => obj.collector1)
			#collector2: zipped.map(obj => obj.collector2)

* you can see how this even works if the collector is at root level, and the insertion call is really deeply nested
	* just carry the mapreduce result all the way up to the collector, and then do the extraction there
* to generalize, as the mapreduce result is carried upwards, it checks each scope to see if there are any corresponding collectors, and gives the result to them
* in imperative, this is impossible because even though you might know all the places a variable can be modified/reassigned,
	* you don't know which one happened last
	* actions and modifications are instantaneous
* in Entangle, all bindings are static, modifications are "continuous"






here's an example where you might want to execute a declared module

		musicClub:
			members
			Joe:
				...
				members <: Joe
			Alice:
				...
				members <: Alice
			Bob:
				...
				members <: Bob


scoping and visibility

		Deck:
			addRandomCard:

		#User:
			button: Button()
			for button.clicks:
				Deck.addRandomCard() // how does Deck see this call?


* by default the language is prototypal
* everything is a prototype
* in imperative langs when you declare a function, it is more of a "template"
* it declares what to execute, but it isn't executed yet
* only when you call the function, is it executed
* in Entangle, when you declare a module, it is already "executed"
* but this can be unideal for some cases
* eg methods, modifier functions



note that when you start removing from the deck, you need order
you can `add Ace, remove Ace`, but you can't `remove Ace, add Ace`

state variables and versioning is an automated dynamic system
kinda like garbage collection

### API Calls and the Modifier Class

* maybe method/modifier calls are flags that "bubble upwards"
* like a tag, `#call_addCard`, attached to every method call
* and the tag bubbles up the scopes until it finds the nearest module called `addCard`
* the "bubble up" makes sense in diagram, nested modules just expose these special tags to the parent module
* so just like scoping takes parent inputs and carries them to child modules
* child modules take child outputs and carry them to parent modules
* this follows the flag-watcher model, doesn't violate encapsulation, and necessitates that method calls be visible to the method
* this is similar to the idea mentioned in the section "Converting Collectors to MapReduce"

* I guess this is how collectors could work too
* so in this sense, methods/modifiers can be thought of as an extension of collectors
* methods contain a collector that collects all calls to the method
* and then executes a for-loop or a reduce() to make the modifications

* so maybe to declare a method you have to do something like

		Deck:
			addRandomCard: Modifier(<modifier fn>)

* and the modifier takes care of setting up the system of collectors and for-loops
* converts it to something like:

		Deck:
			addRandomCard:
				#methodCalls: collector() // collector
				#modifierFn: <modifier fn>
				for call in #methodCalls:
					#modifierFn(call)

* this also might help explain why modifiers don't execute when declared
* just like if you declare a nested function in a function like map(), eg `map(arg1, arg2 => exampleFunctionDeclaration)`,
	* and it doesn't execute the function parameter
* declaring the modifier fn inside the `Modifier(...)` also doesn't execute the function parameter
* as opposed to, directly declaring it inside the module, like the `musicClub` example shown earlier
	* in which case it does execute it

* actually, there are two ways we can reduce methods to collectors
* we can either collect the method calls, and clone them locally
* or clone them externally, and collect the modifications

* though note that in the `addRandomCard` example, the method call in `#User` is not in the same scope as the method, `Deck.addRandomCard`
* so maybe we do have to use external modification, and can't just rely on scoping and bubbling-up
* maybe a method call is short for `Modifier.#methodCalls <: ...`
* recall the hidden room analogy: if you have access to `Modifier.#methodCalls`, then you can insert properties as you please

* I am still not sure if this can break lazy evaluation...

### Dynamic Collector Access and Indirect Insertion

* are we allowed to modify or insert into aliases?
* eg,

		foo: collector
		bar: foo
		bar <: 10

* or maybe something like

		root[textinput].#privateVar <: test

* we talked previously about modifying collectors indirectly, and how it leads to ugly diagrams
	* see section "Direct vs Indirect Insertion - Diagram Syntax"
* this is the same case, even with aliases
* so this should not be allowed

* though what about `for node in tree.nodes: (node.#visited <: true)`
* in fact, this is an issue any time there is a query/traversal,
	* any time you are extracting items from a dataset and adding tags to them

* notice that these cases cannot be converted to mapreduce, using the method mentioned in "Converting Collectors to MapReduce"
* that conversion required the collector reference to be static, eg `someCollector <: someValue`, not `obj[dynamicKey] <: someValue`
* static collector references can be modeled in diagram syntax with an arrow pointing towards the target
	* talked about in section "Direct vs Indirect Insertion - Diagram Syntax"
* not so with dynamic collector references


* though maybe `node.#visited <: true` works because while the collector is dynamic, the tag is static
* so you can re-structure it so that `#visited` is a hashmap, and you are doing `#visited <: [node]: true`

* these rules are getting kinda complicated though

* also note that this: `obj[dynamicKey] <: someValue`
* is different from this: `obj <: [dynamicKey]: someValue`

* the first is dynamically retrieving a collector, and then inserting a list item
* the second is statically retrieving a collector, and then inserting a property with a dynamic key
* though I think both prevent lazy evaluation
* in the first case, if you print out `obj.someCollector`, you are not sure if the insertion affected that collector
* in the second case, if you print out `obj.someProperty`, you are not sure if the insertion affected that property


* what about a whole list of collectors, eg

		turingTape: infiniteList.map(x => Collector()) // create an infinite list of collectors
		for k in keypresses:
			turingTape[k] <: "a"

* though this isn't a problem, we can convert this into a giant mapreduce
* note that this also uses indirect insertion, because we are inserting into `turingTape[k]`

### Modifiers and Lazy Evaluation

* with queries or traversals, as long as we are traversing/querying a finite dataset
* then we can lazy evaluate, by simply checking every item in the dataset
* for example, in the `turingTape` example in the preceding section
* when we want to evaluate a specific collector, eg `turingTape[20]`
* we can simply check all keypresses, and see if there are any modifications to `turingTape[20]`
* I guess this is pretty much the same as just evaluating them all


* practically, you would want APIs to be publically and indirectly callable
* if you had a spotify playlist, you should be able to share it publically, and allow anybody to add tracks to it
* so maybe we shouldn't restrict api calling

* maybe we just have to continuously evaluate any code that contains an API call
* essentially, consider all API calls as "observed", so no lazy evaluation


* another way
* maybe keep track of a list of "authorized users", users with write access
* this list is always evaluated
* so if anybody requests write-access, they are immediately added to the list (no lazy evaluation)
* note that anybody in scope is automatically authorized, and added to the list

* this allows us to know where changes could be coming from
* when we want to evaluate a collector, we simply check with anybody on the list of possible sources (people with write access)
* similar to the "finite dataset" idea, as long as we keep the search space finite, it should be possible to lazy-evaluate

* it gets tricky when we have dynamic collector access, like the `turingTape` example earlier


* maybe all modules have to implement a `numCalls(fn)` function
* that allows anybody to ask a module how many times it calls a given function
* it's up to the module to provide that information
* so if the module forward evaluates it, and keeps track of those calls, then it can provide that info
* if the module knows how to lazy evaluate and determine the number of calls, then it can do so
* if the module doesn't provide the correct number, then it's the module's fault if the collector doesn't behave as expected

* but what if the query takes infinite time?
* this is the problem with any lazy evaluation
* if you ask for the value of a certain variable, it might take infinite time to evaluate it
* this is just a state we have to account for, `outdated`,
	* meaning that we are not sure if the variable's value is up to date
* though isn't everything almost outdated all the time? you never know if an input was changed right as you updated your output


* querying a module for calls, is basically the lazy-evaluation equivalent for flag-watcher model
* instead of having the module set a flag when it calls a function (forward evaluation)
* you ask a module for any flags when lazy-evaluating a function
* because flag-watcher model allows anybody to set a flag
* the lazy-evaluation has to query every module
* which is kinda inefficient, so perhaps api calls should be forward evaluated

* maybe we should have a special syntax for calling a method/modifier
* maybe something like `spotifyPlaylist.@addTrack()`
* that way, it's more apparent where method calls can be coming from
* reduces our search space

* note that Java and C++ don't allow for arbitrary method calling, eg `myObj[methodName]()`
* you have to call them directly, `myObj.methodName()`
* adding this restriction could make it simpler to track where function calls are coming from
* every method call would be explicitly declared
* kinda, you could still use aliases, `myAlias: myObj, myAlias.methodName()`...


* is lazy evaluation even necessary?
* yes, because Entangle encourages declaring modules as giant banks of data
* so you shouldn't have to worry about all this data being evaluated
* though evaluation shouldn't really be that important anyways
* who cares if it needs to be forward evaluated?

* how does lazy evaluation work
* does it create the graph, but not create any clones
	* this is how I've been thinking about it thus far
	* you have to traverse the graph backwards to see what outputs/nodes are being "observed"
	* and to traverse the graph you have to build the graph first
* or could you defer some of compilation/interpretation as well?
	* but don't you need to compile/parse the code to detect possible method calls?


* flag-watcher model can be implemented using tag queries
* every method call/clone adds a tag
* the API just looks for any clones with that tag, using a tag query
	* something like `currentScope.find(#someTag: true)`
* this reinforces the idea that the caller has to be visible to the API
	* or else the flag/tag won't be visible, and won't be picked up by the query



* should we use a blacklist or whitelist model?
* that is, should write-access be explicitly given?
* or should everybody be given access by default, and then some users restricted
	* restriction can be implemented using a `authKey` input and checking if the key is valid
	* note that this is still a blacklist model, because the API has to explicitly implement the access restriction
* but maybe it's dependent on scope
* you declared the method in a scope for a reason
* so it should be restricted to that scope
* likewise, you declared the method as public/private for a reason
* so if a method is public, anybody can modify it
* note that you can declare private methods, eg `Deck: (#addCard: ...)`
* and this would prevent it from being called externally


* there is also an alternative to the flag-watcher model
* the "inbox" method, where all method calls send a request to the "inbox" of the collector/API
	* just a special property
* we actually talked about this method before, using the `_incoming` property
	// TODO: FIND REFERENCED SECTION


* should we allow indirect calls
* eg `Foo.Bar.Deck.addCard(card)`
* from the perspective of `addCard`, it doesn't know where it's coming from anyways
* `Deck.addCard()` is the same as `Foo.Bar.Deck.addCard()` from the perspective of `addCard`
* all it knows is that the call is coming from outside the function


* what if you have something like this

		#collector
		foo:
			bar:
				fn: Modifier
					#collector <: 10

* obviously `foo.bar.fn()` should trigger an insertion
* but what about `foo.bar()`? what about `foo()`?
* perhaps this is why we declare `Modifier`, it declares what "level" the method starts at
* so in this case, only `foo.bar.fn()` would trigger the modification
* but if we did something like:

		#collector
		foo:
			bar: Modifier
				fn:
					#collector <: 10

* then both `foo.bar()` and `foo.bar.fn()` would trigger the modification

* this is sorta similar to how functions use `=>` to declare what "level" the function starts at
	* mentioned in section "Program vs Data"
* not really the same though


* before, the collector itself controlled write-access
* you directly inserted properties into the collector
* and you could define apis inside the collector, if you didn't want to allow arbitrary insertion
	* eg `#stack.push(...)` for pushing to a stack

* but now we have indirect write access
* instead of inserting directly to the collector, you clone a function that inserts to the collector for you
* how do these modifiers broadcast requested changes to the collector?
* I guess the modifiers just use direct insertion, so no broadcasting is needed?

* but remember that insertion uses flag-watcher model as well
* so when you call a modifier, it actually uses two flag-watcher systems
* first, the method call raises a flag, that is picked up by the API, who clones the modifier
* and when the modifier is cloned, the insertion call raises a flag, which is picked up by the collector

* in fact, we can think of `<:` as an API call, "insert"
* so when you call `Deck.addCard`, it calls `cards.insert`
* so `Deck` itself is a collector!


* note that `<:` can even be implemented with flag-watcher model
* flag-watcher model can be implemented in pure functional style
* basically, every time you declare a `<:`, it just creates a new object with a "flag", a generated tag
	* so `mtarget <: mtag: mvak` becomes `#_insert_mtarget: (tag: mtag, value: mval)`
* and then the collector just has a tag query, searching for these tags
* pretty much the same way API calls are implemented using tag queries, mentioned earlier



we talked previous how static tags can work even for dynamic collectors
we also know static collectors work fine

so what about static collectors and dynamic tags?
that is still a problem

	for x in list:
		#mycollector <: [x]: "hello"

it kinda works, because when evaluating `#mycollector`, we know to check this for-loop
however, we don't know exactly which properties are being inserted, until we actually evaluate the for-loop

though this is a problem for any dynamic key
even in module declarations

	foo: x >>
		[x*x]: "hello"

actually, that's not necessarily true
if we have `bar: foo(x: 10)`, and then did `print bar.100`, then the lazy evaluator first evaluates `x*x`,
	and then binds `bar.100: "hello"` (without evaluating it),
	and then finally sees that we are requesting `bar.100`, and evaluates it
to generalize, the lazy evaluation knows to evaluate all dynamic keys first, before performing any property access


### Flag-Watcher and Lazy Evaluation

* note that if we implement collectors and tags using flag-watcher pattern
* and flag-watcher pattern is pure functional
* then we can actually support dynamic collectors, dynamic tags, and indirect insertions
* while maintaining lazy evaluation

* lazy evaluation in terms of flag-watcher pattern is simply:
	* check every object and ask if it has a certain flag
	* the object has to do whatever evaluations are necessary to give an answer
* so if there is an indirect insertion, eg something like `collectorList[k] <: 10`
* and we are searching for the flag `collectorList.4`
* then in order to give an answer, it has to evaluate the `collectorList[k]`
* essentially, the query will force all dynamic collectors to evaluate, in order to see if they match the query

* however, note that while this is technically lazy evaluation
* it is not quite lazy
* searching for a certain tag or flag basically forces every object to evaluate
* because you need have to inspect every object, and to inspect every object, you have to first create all objects
	* aka perform all cloning operations

* so maybe, anything that uses flag-watcher pattern is forward evaluated
* anything that raises a flag, eg an insertion, or an API call, is automatically evaluated
* and the flag is automatically sent to the source
* that way, we don't need to perform any searches or queries
	* which are slow, and "break" lazy evaluation

### Executing Tag Queries Outside of the Source Scope

* we can think of public API methods as just tag queries placed at the root
* because anybody can call the API method, then in order to "see" all calls, and capture all requests, you have to put the query at root
* even if the API method is deeply nested
* so the tag query is actually separated from the method declaration

* note that if the tag query is outside of the collector/API declaration
* then you are trusting that the one who owns the tag query is honest
* and will forward all the requests to the collector/API
* for example, in something like this

		foo:
			bar:
				Deck
					addCard: ...
			zed:
				User:
					foo.bar.Deck.addCard("Ace of Spades")

* the tag query would have to be placed at `foo` in order to capture the API call, and forward it to `Deck`
* however, `Deck` has no control over that
* if `foo` doesn't want to forward certain requests, they can choose not to
* and `Deck` will never know

### API Calls, Requests, and Cloning - The Missing Link

* note that cloning actually requires the source to be visible to the caller/cloner as well
	* not just modification
* cloning could be thought of as working through flag-watcher as well
* so if you can clone it, you can modify it

* the source has to see the caller, create the clone, and then give a reference to the caller
* if the source can't see the caller, the caller won't get a clone, it will be `undefined`

* the `Modifier` class can manage authorization and such,
	* so you can subclass it and define how requests are authorized
	* the function passed into the modifier is just what is returned to the caller if the request is authorized


* in fact, I was thinking about partial requests wrong
* I was thinking if you did something like

		foo: spotifyPlaylist.addTrack(track: "badblood")

* an incomplete, failed request would look like this (if you inspected the `foo` object)

		foo:
			track: "badblood"
			error: "unauthorized"

* or something like that
* this felt ugly to me, because you had to inspect the object to see if the request succeeded or failed
* and you would end up with these "incomplete" objects
* so now you have to account for incomplete objects in your code, which involves a lot of inspecting objects and checking properties
* and it's also hard to tell in the "incomplete" object where the request ends, and where the response begins
	* because the request and the response are just mixed together
* and it just felt very ugly

* howevery, it can actually be much simpler
* if the clone fails, you just end up with `undefined`
* so possibly, you just mistyped something, so the object you're trying to clone doesn't exist
* or, it's possible that they rejected the request
* either way, it's very clear that something went wrong
* in addition, everything that depends on the clone (`foo` in this case) will immediately break, no need to do extra error checking or inspection

* also, the request object is very clearly defined, it's the arguments object passed to the cloning request!
* so in this case, `track: "badblood"`
* and you can always retrieve the original arguments object using the `_arguments` property, eg `foo._arguments`

* the `undefined` object could even have extra tags, like `error: "unauthorized"` and such
* but what's important is that it's clear that the request failed



* I guess what felt weird to me
* was that you could clone an object, and you would get this incomplete clone back
* and depending on if the source could "see" the caller, then it could "complete" the clone
	* fill in the missing properties and apply the modification
* it just felt like a very complex and unintuitive system

* but if we recognize that the source has to see the caller to perform the clone in the first place
* then modification and cloning become linked
* if you can clone, you can modify, and vice versa
* not the mention, the return value of the cloning operation is also closely linked
* you don't have to inspect the returned object anymore
* the mere existence of a returned object implies that the request was successful, the clone is complete, and the modification was executed
* it is very simple and intuitive


* note that if you can't clone an object, you can still perform a "surface copy" or "shallow copy"
* which just copies the values and whatever properties are public


### Cloning Authorization

how do you clone and return undefined?
easy:

	foo: AuthClone
		#if_unauth: 
			error: "unauthorized"
		prop1: 10
		prop2: "this is for authorized users"
		prop3: blabla

	AuthClone: source, key >>
		if (authorized(key))
			...source
		else
			...source.#if_unauth

this pattern can be used for a lot of cases actually

	foo:
		#pre_reqs: some condition
		#if_fail:
			error state
		success state


now that the cloning is also a "request"
cloning has to be authorized too
but that means we don't have to do a search for clones
because the source is in charge of creating the clone, and giving out the reference
the source automatically knows how many clones were made
in addition, if some of those clones are "template" clones, not meant to do any modifications
the source will know that too
in fact, you can probably just set a flag inside the clone arguments, telling the clone not to make any modifications
this can be a flag already designated by the `Modifier` class

though now that clones have to be authorized, maybe everything is a `Modifier` now
no distinguishing between Modifiers and regular objects?

### Request Authorization Using Functions

* our method for cloning and returning `undefined` is a little weird actually
* what happens if we try to override params, like `foo(prop1: 20)`
* one usually expects the properties passed into the object, to end up in the output
* that is kinda how it has been working since the beginning
* inputs kind of "pass-through" to outputs
* in fact, inputs will override source properties

* we could add a rule that if you reference `_arguments`, then inputs will not by default "pass-through"
* and also it kinda makes sense for the source to be able to control that

* however, there is also another way

		foo: AuthCall
			#if_unauth: 
				error: "unauthorized"
			prop1: 10
			prop2: "this is for authorized users"
			prop3: blabla

		AuthCall: source, key >>
			if (authorized(key))
				=> source
			else
				=> source.#if_unauth

		caller: foo.(prop1: 20) // note that we use function call instead of cloning this time

* now we can still maintain source-override behavior
* even if the call is unauthorized, you can still see the request paramters in the object returned to the caller
* so instead of returning `undefined`, this actually follows the "fill-in" behavior mentioned earlier,
	where the source "fills in" missing parameters

### Calling instead of Cloning for Passing in Private Data

* so should we guarantee source-override behavior?
* it has some issues of it's own though
* what if the caller tries to override the auth function

* maybe we can prevent this by making the auth function private

* this actually highlights an issue with our code
* and this problem is in our original method too (the method outlined in "Cloning Authorization")

* in the code we had

		AuthCall: source, key >>
			if (authorized(key))
				=> source
			else
				=> source.#if_unauth

* but `AuthCall` can't see `#if_unauth`, it's private to `foo`
* so if we want to make the auth function private, maybe `AuthCall` can provide the private key to `foo`,
	* and `foo` uses it to store the auth function
* however, then the caller can just retrieve the same private key from `AuthCall` directly
* and then use it to override the auth function in `foo`

* so the dilemma is this
* assume `AuthCall`, the source, and the caller are all separate independent entities
* how does the source clone `AuthCall` and share a private authorization function
* without exposing it to the caller

* the problem is in order for `AuthCall` to get the auth function, it has to be a public parameter
* but if it's a public parameter, then it will end up back in the source
	* because we are cloning `AuthCall`, so any parameters sent will end up in the output, due to pass-through
* unless... we use a function call instead of a clone for `AuthCall`

		foo: AuthCall.call
			if_unauth: 
				error: "unauthorized"
			prop1: 10

* so it seems like anytime you want to prevent pass-through, just use a function call



* if function calls are so common
* maybe we should use the simpler `()` syntax for function calls
* and use the more complex syntax, eg `.clone()` or `.()` for cloning



cloning undefined

returning an error when cloning? how to notify that it failed
normally in imperative if something fails, all execution after will stop

maybe any failed clones propagate