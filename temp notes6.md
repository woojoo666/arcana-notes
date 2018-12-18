### ------------

in the sections "Global Symbols II" and "Secret Keys" we talk about the complications of mixing local and public properties
namely, it gets ugly when you make `foo.bar` the same as `foo[bar]`
	because usually you just want the public property, `foo["bar"]`, but now you have to worry about if a local property `bar` is overriding it

however, instead of using `#` for declaring and accessing local properties
maybe we can use `#` just for accessing local properties, and declare local properties the same way we do global properties




state variables
creates a reverse binding
though if you think about it
that is what it always did
foo[index] := 10 // creates a reverse binding
though usually the [index] is implied


you can only set a state variable once per module (at least, if you are omitting the index)
	otherwise, `overdefined`
so instead of specifying an index every time you set a state variable
you can have modules associated with an index
(this is already pretty much how state variables work)
note that we also absolutely need an index every time we create a reverse binding (unlike in imperative)
so that the reverse binding has a key

it's (almost) syntactically ambiguous to allow `stateVar` to mean both the current value and the previous value, depending on the context
maybe we can be explicit
`stateVar.next := stateVar.prev + 1`
note that `.next` and `.prev` need to be special, context specific, depends on the index
or maybe we can do
`stateVar[]: stateVar[].prev+1`, and the `[]` will implicitly pull the index from the surrounding module?


bindings have 3 parts: object, name, value
the syntax looks like

	object
		name: value

for every binding, `name` and `value` are explicitly given, while the target `object` is pulled from the scope

reverse bindings have the same three parts
a three part syntax is ugly:

	target[name] := value

so if we want a two-part syntax, something needs to be implied
until now, we implied the index (aka name) of the binding from the scope

	object
		index
		aggregator := value

alternatively, we could imply the value to be the current scope

	value
		index --> aggregator



when we create a binding, the `value` of the binding can be an expression
in the expression, can contain many cloning operations and such
who is responsible for carrying out these cloning operations, evaluating the expression and holding onto these cloned modules?
the module? or the language?
maybe the module should contain a reference to all these "anonymous" clones
after all, these anonymous modules should "belong" to the containing module, and maybe have a `_parent` property that points to the containing module?
however, `_parent` is used for scope, but technically the anonymous modules aren't part of the scope
	the arguments module of the cloning operation is part of the scope, but not the result of the cloning operation
	in fact, only objects created from scratch are part of the scope, and inherit all the scope's variables
so maybe we should have a different internal property for "belonging", like `_owner` or `_creator`
// TODO: clarify this ^^^, add code examples



implying either object, index, or value gives it a _reason_ to be declared there in the first place
if we just had
	
	someObject:
		aggregator[10] := 3*5

then there's no reason it had to be declared in `someObject`
that doesn't mean that all three-part declarations are necessarily bad

	someObject:
		a: someFn()
		b: someOtherFn()
		i: someNewFn

		aggregator[i] := a+b





pass-by-reference reassignment modification pattern isn't as common or normal as I thought
(maybe I'm the only one that really uses it, and maybe I stop using it lol)

one of the main examples I can think of is for continuations

```js
// gathers all values in a tree into a list, using depth-first in-order traversal
// passes the list as an argument instead of returning it
function flatten (tree, list) {
	if (!tree) return
	flatten(tree.left, list)
	list.push(tree.value)
	flatten(tree.right, list)
}

// same as above, but returns the list instead of passing it as an argument
// notice that it is much slower, due to having to copy the elements during the concat operation
function flatten2 (tree) {
	if (!tree) return []
	var left = flatten(tree.left, list)
	var right = flatten(tree.right, list)
	return [].concat(left, [value], right)
}

// in the above examples, we can use list methods to modify the list that is passed in
// but if the object passed in is a primitive, or an unknown type, we can't do that.
// so we have to use reassignment. But to change the value of the argument, without just reassigning it,
// we have to use a wrapper, as shown here.
function treeReduce (tree, fn, wrapper) {
	if (!tree) return
	treeReduce(tree.left, fn, wrapper)
	wrapper.result = fn(wrapper.result, tree.value)
	treeReduce(tree.right, fn, wrapper)
}

treeReduce(myTree, add, {result: 0}); // example usage

// but notice how I can use a wrapper scope, which makes it look cleaner
// because now we don't need to pass in a wrapper
function treeReduce2 (tree, fn, result) {
	function helper (t) {
		if (!t) return
		helper(t.left)
		result = fn(result, t.value)
		helper(t.right)
	}
	return result
}

result = treeReduce2(myTree, add, 0);
```

I asked this question on SO [here](https://stackoverflow.com/questions/53312859/mimicking-pass-by-reference-in-python-javascript-using-wrappers-good-practice)
and somebody came back with a much simpler version that uses return-style, and doesn't need a helper function

```js
function treeReduce (tree, fn, start) {
	if (!tree) return
	result1 = treeReduce(tree.left, fn, wrapper)
	result2 = fn(result1, tree.value)
	result3 = treeReduce(tree.right, fn, result2)
	return result3
}

result = treeReduce2(myTree, add, 0);
```

honestly I'm not sure why I didn't think of this myself, it's a rather common style.
I still believe there's examples where it isn't so easy to convert to return-style though

also, imperative style (using in-place modifications) seems nice because you don't have to be so aware of order,
	like you do for functional style (using returns), as indicated by the `result1` `result2` and `result3`
however, it is still ordered in a way, because the execution statements are ordered
does this mean that we can easily convert imperative style to functional style?
aka determining implicit order for state variables?



### -------- Indexing System

what if you have two for-loops, like so

	x := 3
	y := 5
	for i in range(10):
		x := 2-x

	for j in range(4):
		x += 3
		y := y*y

indexing doesn't quite work, because the index of both for-loops will start from 0, but that means `x` will have overlapping indexes

though we could possibly solve it like so:

	x1 := 3
	y := 5
	for i in range(10):
		x1 := 2-x1

	x2 := x1

	for j in range(4):
		x2 += 3
		y := y*y

this might look confusing, because `x2` seems identical to `x1` so what's the point of using both of them
but actually, what is happening is this:

	x1 := 3
	y := 5
	for i in range(10):
		x1 := 2-x1

	x2[0] := x1.last

	for j in range(4):
		x2 += 3
		y := y*y

in the line `x2 := x1`, two things happen
	1. because `x2` is outside of any for-loop, it is implicitly an initialization, so it's the same as saying `x2[0]`
	2. because `x1` is outside of any for-loop, it implicitly refers to the result of the aggregator, so it gets the last state/revision, `x1.last`
while this works, and it should work for any number of variables and for-loops,
it also seems kinda ugly, and can be confusing
it can be hard to keep track of whether `x1` refers to a single state (when it's inside a for-loop), or the last state (when it's outside of a for-loop)
	even with syntax highlighting to help out
`x2 := x1` can just be confusing



initialization is also confusing
once again, you have to keep track of if it's inside or outside of a for-loop
maybe we should force it to be explicit
eg `foo[0] := initialValue`
or maybe `foo.0 := initialValue`
or maybe `foo :: initialValue`

nested for-loops
we still want implicit indexing
so we can do something like

	x :: 0
	for i in range(10)
		for j in range(20)
			x += i*j

what about recursion? how do we handle that?


what about sequences of statements? does that count as multiple
we earlier said that we should only set a state variable once per module
	// TODO: FIND THIS SECTION
but not true, if we want to do something like

	recipe:
		pot += onion
		pot += carrot
		pot *= 10min



javascript: regular procedural code vs callback-style







with the concept of private IDEs, browsing contexts, and secret 
we don't need distinction between local and global keys/properties
instead, we use "perspectives"

perspective
user has their own private "perspective", filled with their private keys
when they log in, they actually log into their perspective
their public node on the graph is something else
when they browse the web, they aren't actually moving node to node
their perspective stays the same, but what they are looking at (the target) moves around
that way, they can see everything that their keys unlock


so what happens when we tag something

	path
		to
			someObjectOnTheWeb
				#myTag "comment: cool video about cats"

we don't need to clone `someObjectOnTheWeb` anymore, we just create a property with our private key
and when we use our "perspective" to view `someObjectOnTheWeb`, the private property automatically shows up
however, we also want to store all of our private properties in our user-space
after all, who else is in charge of storing it? do we want anybody else to be in charge of storing our private properties?

in addition, notice how tagging an object is like modifying it, because we need to add the tag
like how a breadth-first-search needs to dynamically add the `#visited` tag
not to mention, we should be able to tag objects that aren't state variables or aggregators...
we don't necessarily need it to be an aggregator either, because it doesn't need to be (and shouldn't be) aware of our private property
	also, if you wanted the aggregator to be aware of it, then you would have used a key/index that the aggregator could see (like a number or string)

maybe you can tag indiscriminately if its a private tag?
no, what about #rating

maybe it's about the tagging, not about identifying the var as an aggregator
maybe variable chooses how to accept the cinnections
doesn't have to accept them

what about if collision
up to the people giving info to make sure no collision

but then bad actor can just cause collisions to break the aggregator
or try to override a variable that's not supposed to be an aggreagtor, and cause collisions
also, you don't always want to broadcast your tags
something like #rating
seems more like a hashset
Joe[Web.Media.Movies.Animated.KungFuPanda]: (#rating: 5)

maybe keep incoming connections separate
so they can't collide with defined bindings
use a special internal property, like `_indirect` or `_incoming`
that way, we also don't have the issue with how weird it is to reference an aggregator and get the result of the aggregator, and not the keys and states and stuff


the #rating is a very interesting example
internal implementation wise, this makes more sense:
	Joe[Web.Media.Movies.Animated.KungFuPanda]: (#rating: 5)
but from the user's perspective, this makes more sense

Web.Media.Movies.Animated.KungFuPanda: (#rating(user: Joe): 5)


summary:

rules about aggregators
	need to be declared
		reason: want it to be clear that it's modifiable
		alternative: maybe you have to explicitly reference `myAggregator.result` so it's clear your getting an aggregation result
	don't need to be declared
		reason: so you can tag anything
	implicit indexing
	implicit syntax for when treating it as a state or the aggregation
	aggregator function




Key difference between perception and regular tag
It has to be indirect
Because it needs to originate from the user
Can't really be modeled well using direct

when a user tags something
instead of cloning/modifying the entire object
just clone/modify the property
if you're adding a property, then that property will initially be undefined
but that's fine, we are overriding the `undefined`, and giving it a value
this way, for the new updated property, the `_source` points back to the user

instead of `User: foo(#rating 5)`
do something like:

	User:
	    foo#rating(_this: 5) // override the value of foo#rating

cloning is an important part of this I think
because the user is creating the clone
that's the connection between the new tag and the user
though it's subjective what "user" is, we talked about how ownership is like an explicit thing


maybe perception is just a giant hashmap of a user's personal tags on objects
a giant hashmap of the format `<Object, tag>`

this idea of perception seems very similar to our concept private/local
like, a club member should see their private club tags associated with whatever object they're looking at
maybe we can implement perception using our privacy system?
use special tags? a user basically "brands" their tag, so when they dynamically tag something, it's private to the user
	we talked about this earlier
	a user would have to make a copy of the tag, like `#mytag(user: me)`
	so every time they use `#mytag` it uses their private copy
note that everything regarding perception is often added dynamically and indirectly, unlike the original tags
	eg in the BFS example, the `#visited` tag is added indirectly
though when defining a private club, the initial properties/information can still be private even though they aren't indirect...
	and isn't that pretty much a private "perception" defined directly, not indirectly


in fact, maybe we _can_ make it like private
private indirect bindings
so the original node can't see these new bindings
but the user can
"aggregator" reverse bindings are just a way to make indirect bindings
creating a reverse binding doesn't necessarily make it viewable to the original node, even though it is attached to the original node
indirect bindings and private bindings are orthogonal concepts
perception is just the combination of the two
allows us to treat a node as an abstract object, just some object floating in space
"static" bindings can be viewed as the initial indirect bindings, defined by the programmer itself
in the context of Cono, we can think of it as the initial value of a node
	but every user can attach their own private perception on top of the node
there shouldn't be too much difference between adding bindings statically vs dynamically
though we do separate them out...
should we separate them out? or maybe we can combine them, without having them interfere?


how does "perception" affect cloning and overriding?
if we have `foo` and Joe makes `fooJoe`, and `bar` is based on `foo`,
when Joe looks at `bar` is it based off original `foo` or `fooJoe`? does it automatically create a `bar` also based on `fooJoe`? what if there are cycles?


we want to somehow make static initial bindings and dynamic added on (user perception) bindings the same
maybe, initial bindings are based on initial definitions
	eg, `foo: 10, bar: foo+1`, `bar` is based on the initial `foo`
interpreter creates these static bindings
	`public.foo: 10, public.bar: public.foo+1`
so even if you indirectly add bindings later, the initial definitions won't change
indirect bindings are also attached directly to the node, but they have a different signature
	`foo.(Joe: rating): 5`, something like this?
if Joe looks at `foo`, he sees his own version of `foo`
in addition, anything based off `foo`, Joe sees the updated version
but `public` still sees the old version
the interpreter updates `Joe.bar: Joe.foo+1`
or maybe anytime Joe makes a reference to `bar`, it actually references `Joe.bar`?
how do we determine what scope it goes under, `Joe.bar`, but if `Joe` is a child of `public`, does it go under `public.bar` instead? what if circular references?

note that we still have the `_indirect` or `_incoming` property that keeps track of all indirectly added bindings
and aggregators can make use of this internal property
otherwise aggregators wuld have to do something like `result: (any).last` or something, to somehow tell the interpreter to take from all perceptions, instead of just it's own perception
but actually, we can't take from all perception...I guess we still need some mechanism to make it public or private? maybe just take properties from it's own perception
	so if you want to broadcast your indirect tag to the aggregator, you have to make sure not to use a private key, and use a key that th aggregator has access to (like public keys, aka Strings or numbers)
but then how do we account for bad actors creating collisions with public keys?

interpreter does a lot of work
so it's creating a layer of abstraction between the actual internal representation of the program, and the code itself
almost like AI coding
interpreter is looking at the user's specifications like `foo` and `bar` and figuring out if it should correpsonding to `public.foo` or `Joe.foo`, and solidifying these bindings/connections internally
though, the interpreter already does something similar for scopes
if we have `foo: bar*2` but `bar` isn't defined inside `foo`, the interpreter will look for it in the higher scopes, and statically bind the reference to a higher `bar` if it finds one


maybe it isn't such a bad thing to make it based on private tags
the original node can see it if it has access to the tag, otherwise it can't
so something like `#rating` is a public tag, but the user make their own private version of it, so when they add their ratings, they are private
the user is responsible for making sure their tags are private
and the user is responsible for making sure their tags correspond to themselves
	even if you use a 3rd party app, the user makes sure the tags made by the 3rd party app are owned by the user, not the 3rd party app
i was thinking ideally, I would want to make it a sort of "whitelist" system, where everything is by default private, and the user has to explicitly make things public
so it felt kinda dangerous to allow tags like `#rating` that are by default public, and the user is responsible for making it private
cuz a bad actor can just trick a user into using the wrong tag, eg trick a user into using the public `#rating` instead of their private one
and then the user can be tricked into leaking data
very similar to phishing
but perhaps that's a responsibility that inevitably falls on the user
after all, even for facebook and stuff, if facebook gets hacked, there are plenty of ways of tricking users into posting their info publicly
of course, the Entangle language and Facets browser and Cono network should have safeguards against accidental public posting


what about cloning
when you clone the module `BreadthFirstSearch`, it will create a local copy of the `#visited` tag
but what if `BreadthFirstSearch` has a submodule, and you clone that?
you aren't creating a copy of the `#visited` tag, so are you using the original `#visited` tag?
seems like an easy way for a bad actor to (1) get access to private tags and (2) pollute private tags
actually, because `#visited` is a secret key, and only the top `BreadthFirstSearch` module has access to it,
	any properties using that secrey key will appear invisible from the outside, even if you try to clone it
	you can't modify it, read it, or try to override it
is it inefficient? do we have to create a "public" copy of the object, and all it's properties? does the behavior of the object change because the hidden property "disappears"?
	no, it just means there's certain properties that you can't see
	they are still there, but you can't view or use them
	but you can still see all the public properties, and they will still have the same value as before
	you can even see the code and see how it uses `#visited`
	but when you try to print out `#visited`, it will give undefined
or perhaps we should hide secret keys, so you can't even view it in the code?
maybe make it look like `foo: bar + <secret key 1> + zed * <secret key 2>` or something
or maybe just redact the whole thing, `foo: <internal implementation>` (the user literally sees the text "<internal implementation>", I'm not using it as a placeholder)

### Binding Origin

statically bound based on origin
every binding has an origin
	stored in a corresponding internal property, `_origin`
to differentiate between colliding indirect bindings
for static bindings, aka bindings made in the initial definition, the origin is itself (the original definition)
this also implies that maybe we can have nodes without an initial definition
implicitly defined by other people's indirect bindings to it
no static bindings, only indirect bindings
so if Joe was like `foo.bar.zed(height: 10)` and Bob was like `foo.bar.zed(weight: 20)`, but `foo.bar.zed` wasn't defined anywhere,
somebody could still be like `bmi(foo.bar.zed)` and get the result
though...maybe by default it should use the "public" (static) definition, which in this case is `undefined`
you have to explicitly declare that you want to include indirect bindings, so maybe something like `bmi(foo.bar.zed.all)` or something

also note that, before when we talked about having a `_dynamic` or `_incoming` property that keeps track of all indirectly added bindings
if we think of that in terms of `_origin`, that's really just filtering for bindings where `_origin != self`, aka the origin is not itself, aka non-static bindings


### Cloning vs Indirect Bindings

remember earlier we implemented tags (and tag queries) using cloning
you would clone a local property to add a tag

	foo:
		bar(#myTag: 10)

and it would implicitly add it as a property of `foo`, so when you run a tag query under `foo` for everything with `#myTag`, `bar` would show up
however, now we have kinda shifted towards indirect bindings
which seem to work very similar to tags
can we implement tags using indirect bindings?
in fact, can we connect cloning to indirect bindings?
after all, cloning is like adding a property indirectly, except instead of adding a property, we override a property
cloning/modifying is also kinda like "perceptions", where we override a property, and our perception of that object has changed
the tricky part is dependent properties
like if we have `foo: 10, bar: foo*2`
	and we override `foo` in the module `zed` using an indirect property: ...
then when we look at `foo` from the perception of `zed`, should we see the public, original `foo`? or our modified version? 
what about `bar`?
the nice thing about cloning is it assigns a new name to this modified clone
so it's clear when we're referencing the original vs the modified version
indirect binding just tries to tack on the property/tag onto the original object
so it becomes difficult to specify which "version" of the object you want, the updated version, or the 


note that, even if we're just adding (not overriding) tags, we have to worry about dependents
if we have `foo: (bar: zed*2)`
notice how `zed` isn't defined yet
however

a difference between cloning and indirect tags
is that if you can clone the same object multiple times in a single module

	foo:
		bar1: bar(#mytag: 10)
		bar2: bar(#mytag: 20)

you can't really do that with indirect bindings

	foo:
		bar#mytag: 10
		bar#mytag: 20 // collision!

every indirect binding has it's `_origin` connected to the containing object, the "tagger"
	in this case, `foo`
but couldn't we model the clone example like this:

	foo:
		bar1: 
			bar#mytag: 10
		bar2:
			bar#mytag: 20

cloning is kinda like creating a group of indirect tags





cloning does more than just create indirect bindings
it clones all the dependents too
it creates a copy of the module, and all it's components, based on the new parameters you set
creating indirect bindings manually is just like setting new parameters, but it doesn't create the dependents
if you had a large module

	foo:
		a: 10
		b: 20
		c: 5
		result: a+b*c

if you do

	bar: foo(a: 3)

it will copy `foo.b`, `foo.c`, and re-evaluate `foo.result` to factor in the updated `a` value
but if you just did

	bar:
		foo.a: 3

then it just updates the property, but not the dependents




makes sense to pass in private keys to inner modules
makes it easy to do things like BFS, where all the inner modules have access to the private #visited tag
you can pass private keys to other modules if you want to do something that isn't approximated well by scoping


concept of order (and time)



BFS (breadth first search) actually needs both tagging and state variables
you are tagging nodes with #visited
but you also need to keep track of when each node was tagged, the order in which they were visited
eventually all of them will be "visited"
but at every "state", we need to know which nodes were visited up until that point
this is sort of like having two keys, "visited" and "time"
the tag itself needs to have a time associated with it
like `#visited(time: currentTime)`
chaining together multiple tags/keys like this feels a little ugly
why does it have to be in this order? why not `time(#visited): currentTime`

in a way, it is arbitrary
in fact, everything in Entangle is arbitrary
defining the world in terms of discrete relationships is an approximation
	in the real world, everything is associated to everything else with different weights
	in Entangle, we don't have weights, a binding either exists or not
if you ask somebody the color of a watermelon, they will answer "green" even though it's only the outside that is green
	
	watermelon:
		rind: (color: green)
		meat: (color: red)
		color: green

for something like "Earth", it is less clear
	
	Earth:
		land: (color: green)
		ocean: (color: blue)
		color: blue? green?

the way we approximate and view these relationships is arbitrary





tags are like a contract
both sides have to agree to it
the tagger can choose to keep their tag private
the taggee (the object that is getting tagged) can choose not to look at the tag
state variables are like when both sides agree
	the tagger makes it visible to the taggee, and the taggee chooses to accept the tag


flag-watcher model preserves encapsulation
actors can't just arbitrarily modify other modules
the module has to accept the changes


who are you tagging it for?
in BFS, you are tagging it for yourself, your own records
	keep it private
for state variables, you are tagging it for them to see
	make it public


if we have a bunch of objects,
and we pass it into a module that tags them
should the original objects be tagged?
or should the output be a clone of the objects but with tags?
should it be more like this (imperative style)

	myObjects
	tagThem(myObjects)
	for (myObjects):
		bla bla

or should it be like (functional style)


	myObjects
	tagged: tagThem(myObjects)
	for (tagged):
		bla bla




normal variables act like a "donor" or "source"
	anybody that can view it can read from it
aggregators act like a "sink", where anybody can write to it
but right now scope works the same way for both of them
	anybody in the scope can both read and write to aggregators
maybe it should work differently?
	we have one scope for reading
	and one scope for writing
from a graph network perspective, it makes sense to treat it differently
	"source" is at the left side (beginning) of the graph
	"sink" is at the right side of the graph




aggregators allow for communication
you can do something like

	foo:
		a:
			b:
				foo#bar: 10
		c:
			d:
				x: foo#bar[origin: any] // we have to specify [origin:any] otherwise we won't see it

but this feels ugly
what if we did something like this


	foo:
		a:
			b:
				foo.c.bar: 10
		c:
			d:
				x: c.bar[origin: any] // we have to specify [origin:any] otherwise we won't see it

does this work?
if it does, it feels even uglier




pass by reference modification
what are modules for
modules have input data
and generate output data based on a set of rules/patterns defined in the module
that output data can include inforamtion about a "change"
which is applied to a state variable




you could imagine
a rough draft of a screenplay being passed around the world
until it reaches some hermit in some dark corner of the world
he can read it, but whatever modifications he makes to the screenplay, is not going to get back to the original sender
the original sender designates a group of editors that he receives revisions from
not everybody that sees the screenplay gets to submit revisions to it

this is kinda true in imperative languages (and our langauge)
when you pass around a variable using aliases
when you modify the alias, it does't modify the original
however, we discussed whether or not we should allow something like
	// TODO: FIND REFERENCED SECTION

	root.foo.bar.zed += 1

if we look at how scopes work
inner modules can read everything in the outer module
so maybe we should make it so outer modules can write anything to inner modules?

however outer modules can read everything in inner modules too
unless...
we allow the creation of "hidden" inner modules, that inherit all the outer module's variables, but aren't attached to the outer module by a reference
we kinda talked about something similar in the section about separating scope from reference
	// TODO: FIND REFERENCED SECTION

this feels weird
but it would allow creation of modules that can read from the outer modules, but the outer modules can't read it
kinda like our idea of private perspectives

with our current model
is it possible to even create private modules?
if we use private keys...

	foo:
		#user1
		publicData:
			msg: "hello world"

`#user1` can read `publicData`, but `publicData` can't read `#user1`
however, `foo` can read both...

this seems to have dangerous implications for the way Cono users work
we talked previously about how each user has it's own secret key, that unlocks all of their private info
	in the section "Private IDEs and Browsing Contexts"
but that secret key has to be attached to something
a global "root" or something, where all these user profiles are created

	root:
		#user1 // all private keys
		#user2
		#user3
		...

however, this is a possible security vulnerability
what if somebody somehow gains access to `root`?
now they can see every user's private data
after all, in our current module of secret keys, the parent of a secret key can see the secret key

unless we somehow make them indirectly, through external perspectives?

	root: ...
	user1:
		root#user1: ...
	user2:
		root#user2: ...

however, this goes back to square one
how are we creating `user1` and `user2`, what are they attached to?


somehow we have to create a user in the "public universe", but we don't want the public universe to be able to see the user
the user should be able to see everything in the "public universe"
aka have access to all the public keys (aka public properties, aka properties whose keys are strings)
philosophically, this is akin to a person being born in the universe with vision and hearing, able to sense the universe in the same way as every other human

this concept of creating private scopes that are private even to the root they are attached to
is it useful anywhere besides this example (the creation of private user profiles)?
after all, for this specific example, we can solve it by ensuring that the root is (somehow) inaccessible
not to mention, philsophically, it sorta makes sense for the "universe" to be able to view all of the users residing in it



what makes indirect modification feel a little ugly
is that it becomes uncertain where these modifications are coming from
at least, in imperative code, there is an execution order,
	so you know that, at any given execution statement, all previous modifications have to come from previous lines of code
with Entangle, everything is unordered, so you don't know where to look if you're trying to find out where a variable was modified
this is especially true if we allow aggregators to be passed around and modified by whoever accesses it
so maybe the aggregator should explicitly declare who is allowed to modify it (and inner scopes are implicitly authorized)
however, there are certain times where we do want to be able to pass things around and accept modifications, without having to explicitly declare
eg pass-by-reference modification




BFS is a good example


feedback is not the same as scope, no inheritance

	foo:
		bar: // bar inherits from foo
			zed: foo // zed inherits from foo and bar
			// but even though "foo" is now "inside" zed, it's just a reference, so no inheritance


aggregator
to preserve encapsulation
module can only propose changes, revisions
module asks the aggregator for "previous"
aggregator chooses what to give back
and then module proposes a value for "next"
which the aggregator can choose to accept
this feels kinda like how functional handles object mutation
all objects are immutable, so every function has to return a modified copy of the object

however, while the concept of "accepting" modifications might seem powerful and flexible
it adds more overhead, both mental overhead and code overhead
the programmer has to keep in mind, every time they make a modification, that that modification might not be accepted






want to be able to tag stuff like
"related post" or "parent post" or something
and then the poster can choose to accept the tag



note that, you often want to be able to do something like this

	foo:
		#mytag
		bla:
			bla:
				someObject
					#mytag: true // dynamic tagging
		bla:
			bla:
				if (someObject#mytag):
					...

so it seems like the tag modification should be scoped to the scope that the tag was declared in
almost as if the tag is an aggregator, like a hashmap






## Case Studies

### Case Study Terminology:


	target // static object declaration
	#tag // tag declaration
	source/origin:
		target #= // dynamic object modification
			#tag/key: value

note that we are using `#=` to distinguish from cloning

cloning (creates a new object):

	mObject
		x: 10
	mObject(foo: 10) // inline cloning

tagging (modifies the original object):

	mObject #=
		x: 10
	mObject#foo: 10 // inline tagging

this syntax is subject to change
we are just studying mechanics right now

### Case Study - State Variables

example:



* aware of origin context?
	* version index, used for "previous" and "next"

### Case Study - BFS, Breadth First Traversal (tagging, hashmap model)

	breadthFirstTraversal: startNode, fn >>
		#visited
		stack: (startNode)
		while (!stack.empty):
			node: stack.first
			if (node && !node#visited):
				node#visited: true
				fn(node)
				stack += node.children

recursive version

	breadthFirstTraversal: startNode >>
		#visited
		stack: ()
		recurseFn(startNode)
		recurseFn: node >>
			if (node && !node#visited):
				node#visited: true
				fn(node)
				stack += node.children
				recurseFn(stack.pop.())

* ordered
	whenever checking `node#visited`, has to be in order
* #visited acts like a hashmap
* dynamic tag `node#visited: true` is scoped to the tag declaration
	* if a node is tagged `#visited` on one iteration of the while loop, the next iteration should be able to see the tag
	* so if these tags are visible across all iterations, then they must be scoped to the outer scope

### Case Study - Perspectives, Private User Tagging

	Movies:
		KungFuPanda:
			...
	Joe:
		#rating // declare a private version of the public #rating tag
		Movies.KungFuPanda #=
			#rating: 10
		...
		for movie in Movies:
			if (movie#rating > 9)
				movie#favorites: true


### Case Study - School Club

### Case Study - MetaProgramming

### Case Study - Aggregators and APIs

### Case Study - Satellites

### Case Study - Pass-by-Reference Modification


## Diagram Representation?




difference between imperative and dataflow
dataflow doesn't differentiate between properties and "getters" (aka dynamic properties that need to be updated)
for example, in imperative, you might have

	class Foo:
		var x
		var y
		function getMagnitude() {
			return Math.sqrt(x*x+y*y)
		}

whereas in dataflow:
	
	foo:
		x, y
		magnitude: Math.sqrt(x*x+y*y)

though it seems like we've explored many ways that imperative can act like dataflow
technically you can just change everything in imperative to a getter
the reason we can do this is because in imper

so the difference is actually, that imperative makes a distinction between functions and data
whereas in dataflow, everything is a value


dependency graph


aggregators can act like implicit outputs

	foo:
		agg // aggregator
		addOne(agg) // is short for agg.next: addOne(agg.prev)
		Math.square(agg)
		Math.floor(agg)

however, the way it looks, they look like list items
which means that they are ordered
in this case, it makes sense for it to be ordered
but in many cases, you might have a set of modifier functions, that don't need to be ordered
eg breadth first traversal

	breadthFirstTraversal: startNode, fn >>
		#visited
		stack: (startNode)
		while (!stack.empty):
			node: stack.first
			if (node && !node#visited):
				node#visited: true
				fn(node)
				stack += node.children

notice that the three statements `node#visited: true`, `fn(node)`, `stack += node.children`, don't actually need to ordered
however, by making them list items, we are introducing unnecessary ordered
which we want to avoid
because it prevents optimizations

this problem arises because we are treating these modifier functions, as list items
maybe we should treat them as a special thing entirely



vvvvvvv figure out how to put into case studies? vvvvvvv

when you declare a private key in a module
how is it "part" of the module
it can't be attached like a normal property, otherwise it would be accessible
but it somehow has to be "part" of the module so that the module can use it, right? the module has to be able to reference it by name somehow
should it be possible to declare data that is part of a module but not attached to it? like floating?

maybe it's not attached to the module, it's actually attached to the programmer
this kinda follows the whole "Private IDEs and Browsing Contexts" idea
so instead of thinking of a module definition as some sort of static, global declaration
whenever you define a module, you are defining it from the perspective of you, the programmer
every definition is subjective

this makes sense because, with Cono
no matter how much static public stuff we define in the beginning
eventually, with enough users, the public knowledge created by users will far outweigh the initial
so it's better to think of all knowledge as subjective, created by somebody


collaborative
network language

starts getting confusing when people start overriding tags though
because we are not cloning, the dependents will not be affected

	#foo
	Car:
		#foo: 10
		bar: #foo*2 // value is 20
	Bob:
		Car #=
			#foo: 7
			#zed: bar+10 // this will use the old bar, because we haven't specified creating a new bar

maybe we shouldn't allow tags to override existing tags? is that even possible?
maybe we shouldn't allow public tagging, you can only create your own private tags and use them?
though in BFS what if you did

	BFS:
		#visited
		myObject#visited: true
		foo:
			myObject#visited: false // overriding private tag






what if we just tag with public tags
lets say BFS doesn't override the public `#visited` tag (assuming there is one)

	#someTag // some public tag
	...
	myObject#someTag: 10
	...
	User:
		BFS:
			myObject#someTag: true // leverage the #someTag tag for my own use
			foo:
				print(myObject#someTag) // should this print 

not to mention, with #visited we have to keep track of order too, so if it were a public tag...



actually this was already kinda explored in the case study "Case Study - Perspectives, Private User Tagging"
if you changed it to just override the public `#rating` tag instead of declaring a private one:

	Joe:
		Movies.KungFuPanda #=
			#rating: 10
		...
		for movie in Movies:
			if (movie#rating > 9)
				movie#favorites: true

does the statement 	`(movie#rating > 9)` refer to the public `movie#rating` or Joe's personal `movie#rating`?

like, if we had something like

	Joe:
		height: 10, weight: 20
		BMI: weight/(height*height) // should equal 0.2

but Bob disagrees with Joe, and thinks Joe's height is actually `11`, so he adds a personal (private) tag declaring Joe's height as `11`
when Bob asks for `Joe.BMI`, does he get Joe's version or his own version?

	Bob:
		Joe.height: 11
		print Joe.BMI // does this use height: 10 or height: 11?

naturally one would expect `Joe.BMI` to still refer to the old `Joe.BMI`, so it should print `0.2`
a personal tag is attached on top,it shouldn't affect the other variables
	you should clone Joe to make a modified copy of all of his variables, eg `JoeClone: Joe(height: 11)`
but then, should we introduce a way to get the modified `Joe.BMI`, the `Joe.BMI` from Bob's perspective?




if we tag a primitive, eg `3#visited: true`, then should it affect all primitives?
in javascript, when you use primitives, every primitive is copy, they are all distinct objects
this sort of makes sense, after all if you had a list of numbers `[2,2,6,1,4,3,6]`, if you tagged the first `6` you wouldn't want to affect the last `6`
	not to mention, you wouldn't want it to affect every `6` in the universe
if you did want to affect the last `6`, you could just use a hashmap, instead of tagging, like `visited: (), visited[6]: true`
there's a difference between wanting to tag a list item, or tagging the object
if you tag a list item, then you don't want it to affect other items in the list, even if there are duplicates
if you are tagging an object, you do want it to affect duplicates
	kinda like in BFS, if you have a node multiple times in the stack, if you tag it as visited, you want all instances of that node in the stack to be tagged as visited
so I guess what javascript is saying, is that with primitives, you usually want to treat them as 





in the BFS, the #visited tag is a state variable, but it also needs to somehow go "across" all nodes
for example, if we slightly modify the BFS to look like this:

	breadthFirstTraversal: startNode, fn >>
		#visited
		stack: (startNode)
		while (!stack.empty):
			node: stack.first
			if (node && !node#visited):
				node#visited: true
				fn(node)
				for child in node.children:
					if !child#visited:
						stack += child

that is, usually when we though about state variables, we talked about how, if we do a modification to a state variable, then
	all other references to the state variable are treated as references to the previous state of the variable
	eg `foo := foo+1` becomes `foo.next := foo.prev + 1`
however, in this case, we are assigning to one node, but we are checking different nodes, but we still want it to reference the previous state of those other nodes

			if (node && !node#visited):
				node#visited: true
				fn(node)
				for child in node.children:
					if !child#visited: // this actually references (child.prev)#visited
						stack += child

so even though we are modifying `node`, we want it to affect our reference to `child`

this kinda plays into our idea of "perspectives"
we want to view the `#visited` property from the perspective of each iteration
every iteration has a different perspective on what is tagged, and what isn't

however, there are some cases where we don't want this
for example, if we had this

	for (person in group):
		if (person.age < 18 && person.happy)
			person#happyChild.
		for (child in person.children)
			if (child#happyChild) // if at least one happy child
				person#goodParent. // then this person is a good parent

notice how, in this example, time/order doesn't matter
if the for-loop iterates to `Joe`, and then Joe's child afterwards,
	and tags Joe's child as `#happyChild`
then Joe should be labeled as a `#goodParent`, even though his iteration already "passed"

in javascript, which is ordered, this would need to be done in two passes
	1. the first pass marks the happy children
	2. the second pass marks the good parents

### Iteration vs Aggregation

what if we modified the example in the previous section to require all children to be happy to be a good parent?
it would look something like this

	for (person in group):
		if (person.age < 18 && person.happy)
			person#happyChild.
		for (child in person.children)
			if (child#happyChild && person#goodParent) // all children need to be happy
				person#goodParent. // for this person to be a good parent

however, notice the feedback, which implies that the iteration is ordered
but we want it to be un-ordered, so it can be done in one pass

instead of using iteration, use aggregation
this makes a lot more sense in the diagram syntax
but basically, you want to have an `AND` operator that aggregates all `child#happyChild`
so for every `child`, you send `child#happyChild` (a boolean) to the `AND` aggregator
and the output of the aggregator goes to `person#goodParent`

	           /                              \
	children -<----> #happyChild? --> AND      >       AND ----> #goodParent
	           \                              /

in code this could maybe look like

	#goodParent: ALLTRUE()
	for (child in children)
		#goodParent[]: child#happyChild

or maybe

	#goodParent: aggregator.allTrue()
	aggregator: ()
	for (child in children)
		aggregator[]: child#happyChild

though the second example seems to be un-necessarily flexible
	while we can pull all sorts of information from the aggregator, like `allTrue` or `allFalse` or `xor`
	most of the time we only use the aggregator for one purpose
	every aggregator usually has an associated aggregation function
	so there is no need to split it up into two steps












maybe we should have a difference between tagging like this

	foo#visited: true

and this

	foo#visited := true

and you should use the latter for BFS because you want it to be ordered




there are many examples where i want to add little notes or extraneous info to an item
	personal notes on games I've tried on the app store
	timing scores on problems on leetcode
	notes on which locations to camp out in FPS maps
	personal commentary/critique of youtube videos



can we do something like this:

	foo:
		a: 10, b: 20
		bar: a+b
	zed:
		mbar: foo.bar(a: 10)

on one hand, it seems to make sense, and can have some useful cases
on the other hand, we would need to treat the expression of `bar` as part of `bar`
	sort of like our concept of "mixed modules"
though we moved away from that concept, and treated the expression as separate, so we could do things like

	Square:
		x: 0, y: 0
		translate:
			x: 0, y: 0
			=> 
				x: Square.x + translate.x
				y: Square.y + translate.y

	Square.translate(x: 10)

actually, we can't do individual property overriding, because what if we had something like

	foo:
		x: 10
		bar: Square(x: x, y: 10)
	zed:
		mbar: foo.bar(x: 3)

there are two `x`s we could be overriding in the line `mbar: foo.bar(x: 3)`
	1. `bar.x` (that was inherited from `Square.x`)
	2. `foo.x`
and clearly, overriding `bar.x` makes more sense






two types of tagging
first is just reverse binding, aggregator
	makes sense in diagram syntax
	basically

		foo:
			bar:
				value: expression
				obj[key]: value

		// corresponds to

		obj:
			key: foo.bar.value

it's really just useful way to workaround the limitations of scoping
because sometimes when you get to deeply nested scopes
you might not be structuring the scopes based on the structure of the output
maybe some different structure, like procedure or something
note that these "reverse" bindings would be practically useless in a flattened syntax (no nested scopes)

this is more natural in diagram language
where you have left input and right output
so you have this flow
that is mimicked by this "reverse" binding syntax



the other way we think about tagging is with state variables
where we have the "action" of tagging
associated with a timestamp
we want to be able to "key" by timestamp as well

maybe we can do so with the modification operator, as mentioned earlier

	foo#visited := true

this will encode the timestamp into the tag

	foo#visited[currentTime] := true

note that this is dynamically and indirectly creating two tags
	first, the `#visited` tag
	and then, nested below the `#visited` tag, the `[currentTime]` tag

	foo:
		#visited:
			[currentTIme]:
				true

however, we mentioned earlier that we might want to pull the entire surround scope into the indirect tag
when we were talking about using the current scope as the value for the indirect binding
	// TODO: FIND REFERENCED SECTION

	value
		index --> aggregator

	// corresponds to

	aggregator:
		index: value

this also helps for `origin` and stuff
	// TODO: FIND REFERENCED SECTION
it seems nice to be able to access the scope from which the indirect binding was created

however, from the diagram-based syntax, we can see that this doesn't make sense
expression is different from value
you can specify it, by saying like `foo#mytag: this`, and it will give the scope
but the binding will point to the value, not the expression or evaluation leading to that value
	the scope hieararchy is just the evaluation leading to the value
makes sense if we look back at

		foo:
			bar:
				value: expression
				obj[key]: value

		// corresponds to

		obj:
			key: foo.bar.value

`key` might still contain an `_origin` which points back to it's originating scope
hmm not sure what I was trying to say with all this
//TODO: CLARIFY AND FINISH THIS


we could solve some issues by having modules/blocks dedicated to ordered execution statements
kinda like sequential blocks, in verilog
but I thought we were trying to avoid that
	// TODO: FIND REFERENCED SECTION









the point of Entangle is to define structures
imperative languages define structure by defining a construction order
it is impossible to define structure without defining some sort of execution order
Entangle tries to separate structure from execution
adds an abstraction layer between structure and execution




when you define execution order in Entangle, you do so using structures
so you have modules whose purpose is to represent a step of execution
so "sequential blocks" aren't so far-fetched after all
we already kinda had this, with the concept of implicit indexes and state variables
	// TODO: FIND REFERENCED SECTION

however, unlike verilog sequential blocks, the internals of these modules are still un-ordered
but when you have multiple of these modules, relative to eachother, they are ordered

	step1:
		foo: 10
		bar: 20
	step2:
		foo := foo+bar
		bar := foo-bar

inside the modules `step1` and `step2`, the statements are unordered
but `step2` is "executed" after `step1`



nextpermutation example
// TODO: FINISH THIS
	
	nextPermutation: do
		findFront:
		findNewFront:
		swap:
		reverseTail:

notice how there are 4 distinct steps
	and we use `do` to tell the interpreter that these modules represent ordered steps
and the internals of each step can be unordered
shows that imperative code defines too much order




in the diagram syntax, regular bindings and aggregator bindings go in opposite directions
kinda like

	regularBinding <---(key)----value

	value ----(key)-----> aggregatorBinding

but in text syntax, we naturally follow imperative style, so it looks almost identical (same direction)

	regularBinding[key]: value
	aggregatorBinding[key] := value

so do they really have to go in opposite "directions"?
does it even matter?

it seems to be more clear when we think about deeply nested scopes

	agg.
	foo:
		bar:
			zed:
				agg[key] := value

the way scoping and inheritance works, the variables from `foo` go into `bar`, which go into `zed`
and then the aggregator `agg` is a way to carry out those values back outside
to "escape" nested scopes, kinda like how `return` works in imperative languages
we talked about this waaayyy earlier in our notes
	// TODO: FIND SECTION REFERENCE

so it seems like aggregators are the counterpart to scoping/inheritance
inheritance brings variables inwards
aggregators carries variables outwards

in that sense, it seems natural to have aggregators implicitly accept all bindings creating inside it's scope
just like how inheritance makes a module implicitly accept all variables created outside of it's scope

though you just like you can explicitly accept incoming bindings in an aggregator
you can also explicitly bind to variables outside of the inheritance chain



map reduce
split branches and accumulate/combine branches
great for making directed acyclic graphs (DAGs)
and remember that, because we use time-as-data to unwrap feedback loops into combinational logic
everything is a DAG
we can model everything in the universe as a DAG using this method
even the brain, which is a ton of feedback loops, can be unwrapped into a DAG by unrolling time into a timeline



hmm it seems like it isn't one-to-one correspondance

note that it is possible to have an inner nested scope that isn't attached to the outer scope
via the programmers personal perspective, as mentioned earlier
// TODO: FIND REFERENCED SECTION




certain cases where you don't want to allow cloning
you shouldn't always be able to clone somebody and give different inputs and see what it outputs
they chose to accept inputs from certain sources
not accept inputs from you




### Private Variables Revisited

previously we talked about how the initial, "static" definition of a module is actually just the current programmer's perspective
so the module's private variables are actually just the programmer's personal tags attached to the object
	see section "Private IDEs and Browsing Contexts"


but how come imperative languages can have this concept of "private" without this idea of "perspectives"
just cuz `Joe` has access to some variables, doesn't mean Bob can access them indirectly through `Bob.friend["Joe"]`

imperative langs "deploy" the code, so the code exists separately from the runtime
the code defines private variables, but in runtime, you can't just open up an object and see it's internals
you can only view whatever the object wants you to see, you can only ask the object for information

if we treat these nodes as users themselves, "conscious"
eg if every node was stored on a separate machine
these machines can have private information
other machines can query for info, but the machine doesn't have to give it out

so is it possible for a node to have it's own private data, that isn't "owned" by the original programmer?



after all if it were just based on the programmer's private IDE context
then what about

	Joe:
		#privateVar
	Bob:
		Joe#privateVar // why is this inaccessible? we are in the programmer's IDE scope



I think I was confusing code and runtime
if something is visible in code (aka from the programmer's perspective), doesn't automatically make it visible in runtime
and we don't need some special mechanism to prevent that

what is public is whatever keys are exposed to the public, in the `keys` 

private variable _names_ are just for binding purposes



dynamic coding and tagging?




before we talked about how public vars are string keys, private vars are object keys
because if you tried to make a private string key, somebody could just guess it and access it through `foo["myguess"]`
but what if we wanted to be able to dynamically access private keys, something like `foo[#"myprivatekey"]`
the fact is, we are mixing up two different ideas
one, is the idea of private and public
and one, is the idea of dynamic property access, and being able to "construct" a key
strings and string operations, eg `"my"+"key" => "mykey"`, is a system for constructing objects
strings are objects too
strings and the string system just happens to be public
but there is no reason we shouldn't be able to dynamically construct private keys
	eg if we defined a new data type and defined a system for constructing this datatype
	and used this datatype as a property key
a simple example, is an enum:

	privateContext:
		foo, bar // private vars
		myEnum: n >>
			n = 0? => foo
			n = 1? => bar
		someObject:
			[foo]: "this is a private property"

		print somObject[myEnum(0)] // dynamic key construction, for private key

private string keys are "semi-private" because they can still be constructed, but they are not explicitly given out by the object


in addition, there are examples where we want public object keys
eg, if we make a hashmap with format `<object, Number>`,
	and we want to be able to iterate through all entries
	we would not be able to, if all entries were private because they had object keys

in a way we already do this though, separate private/public from strings/objects
through our concept of the `_local_keys` property, and 





the `keys` and `_local_keys` properties might seem related
but they aren't
`keys` is the important property, which declares public keys
`_local_keys` is just the internal system that the interpreter uses to keep track of named private keys
	eg `#mytag` or `#visited`
	these named private keys are purely for binding purposes, and aren't relevant during runtime
see the following example:

	foo:
		#privateKey: 20
		"publicKey": #privateKey * 10
		["someString"]: "this a semi-private property"

notice how the `publicKey` property uses the `#privateKey` variable to define its value
but after the binding is created, the `#privateKey` variable serves no purpose anymore
also notice that `"publicKey"` will show up in `.keys`
`privateKey` will show up in `_local_keys`
but `"someString"` won't show up in `keys` or `_local_keys`



another way of looking at it, is public variables is anything that is accessible through keys
this is pretty much any information that the module can "give out"
private variables is information that is not given out by the module
so in this example:
	
	foo:
		["someString"]: Math.sqrt(someFn(2,4))

`["someString"]` still counts as "public data", because it is accessible (as long as you have the key)
but the intermediate expression `someFn(2,4)` is private

private variables are merely for binding, for the interpreter to see
during runtime, after all bindings are made, these private variable names aren't actually needed anymore
because the variable name has already served it's purpose
there is no need for the module to refer to it's own private variables, all the references are hardwired in
all the behaviors are bound and complete
names are just a convenience for other people to use, so they are only relevant for public info
and private variable names are only useful during coding


i think maybe this is where I got confused
how can Bob refer to his own variables, but Joe can't navigate to Bob's perspective, and access those same variables?




### Timeless

earlier we talked about how to handle cases where Bob disconnects his mouse
	// TODO: FIND REFERENCED SECTION
we talked about maybe having some sort of "global timeline" or something

it might be tempting to have some sort of "snapshot" capability
eg if Bob clicks "publish" on his document, it publishes the current state to the public (via the "global timeline"?),
	so even if Bob disconnects his mouse, it won't affect the snapshot
but this implies that we have to snapshot the current execution state
which can get very ugly
this is also how verilog's sequential blocks work, and we were trying to move away from that

however, this is wholey unnecessary if we properly follow the eventlists model
we have to understand that Entangle is "timeless", it exists in a different domain than the real world
so every input that enters the Entangle ecosystem has to encode all the information necessary, including time
every time Bob presses a key, or clicks the mouse, has to have a timestamp associated with it
even the mouse object itself, if it becomes undefined, that is encoded as an event too
this way, when you want to create a "snapshot", that has a timestamp as well, and it compares the timestamp with
	the timestamps of all these other events, and figures out what the state of the program should be at that timestamp
allowing our system to be execution independent, "timeless"

**every peripheral, anything entering the Entangle domain, has to be a state variable, an event list**

we can choose to ignore these events and always rely on the current state of a variable if we wish
but later in the program, if something does rely on time, it can trace back all the way to the peripherals
thus, we need every peripheral to provide this information, even if we aren't using it at the moment
eg
	
	mood, button >>
		color.
		mood = "happy" ?  color := "yellow"
		mood = "sad" ? color := "blue"
		mood = "angry" ? color := "red"

		browser.topbar.color: color // change your browser's top bar color based on your mood

		for click in button.clicks:
			profile.publish(color) // publish your color to your profile

notice that `color` does not depend on the time data of `mood`
however, once you `publish(color)`, it will rely on the the time data of `color`







interpreter aware of private variables?
just because programmer has access to private variable names, doesn't mean he has access to private data
though when he makes test cases, he is, so they the IDE can dynamically update
self awareness? for the module to access or change itself, it has to be aware of it's own private variables
	but in a way that nobody else can access it
what about inner moduels? technically those are separate modules, but they have access to these private variables, even during runtime
these private variables have to be accessed in a different way from normal public properties
maybe the interpreter binds them directly, or encodes a special signature to all accesses coming from "internal"






perspective
should be visible to whoever can see the tag
so if you want it to be private, you have to make a private copy

	#mytag
	foo:
		target.
	bar:
		foo.target#mytag := 10

this matches the hashmap model
because if you add `<foo.target, 10>` into the hashmap `mytag`,
	then anybody who can see `mytag` can just query `mytag[foo.target]` to see if it has value

in addition, this makes sense because if you can see the tag,
	you can just query `foo.target[#mytag]` to see if anybody has assigned a value

though...if it is "public", how to we access this part of bar's perspective from outside of `bar`?
we can't just do `foo.target[#mytag]`, because `foo.target` is not accepting tags from `bar`,
	so the public version of `foo.target` should not include bar's tag
	and `foo.target[#mytag]` would return `undefined` outside of `bar`
so it seems like even if we wanted bar's `foo.target#mytag` to be public outside of `bar`,
	there is currently no way to access it outside of `bar`

I also feel like there are ways to make private personal taggings even if they use public tags

note that just because it's public (or visible to whoever can see the tag), that doesn't mean the target has to accept your revision
this feels like it can get confusing because, if the target won't accept your revision, maybe we shouldn't allow you to tag it in the first place?
though I guess it should be pretty clear whether or not the target will accept your tag
	it will accept it if (and only if) you are in the target's scope
	or if you have explicitly received special authorization (eg if the aggregator explicitly recognizes your tag)

it seems logical to want to be able to hide personal taggings even if they use public tags
for example, in the earlier example, when `foo` overrides `Joe`'s height, `foo` might not want to let `Joe` know that they are doing that
	// TODO: FIND REFERENCED SECTION

in addition, we also want to be able to view other people's perspectives, even if they aren't accepted by the aggregator
for example, if a bunch of movie critics have different ratings of a movie, and they all want their `#rating` to be public






also, you can't just access dependents using your perspective and your tags
because that would imply cloning it and changing the inputs
for example, in the bmi example mentioned in the earlier section
	// TODO: FIND REFERENCED SECTION

in this example, let's `foo` can't see Joe's source code, but `foo` can see Joe's public values
(recall that the formula for `bmi` is `weight/(height*height)`, thought assume `foo` doesn't know this)

	foo:
		print(Joe.height) // outputs 10
		print(Joe.weight) // outputs 20
		print(Joe.bmi) // outputs 0.2

		Joe.height := 20 // foo believes Joe's height is actually 
		print <Joe's bmi from foo's perspective> // should print 0.05

notice how, if `foo` were able to get `Joe.bmi` using it's own modified values,
	then that would be like changing the inputs to `bmi` without knowing the source code or having authorization
`Joe` might not want `foo` to be able to arbitrarily test out different inputs to `bmi` like that

in order to be able to view it from your perspective, you have to also have the right to clone it
aka view the source code
and then you could do something like
	
	foo:
		Joe.height := 20
		Joe.bmi(...this)

or something like that

so now we have to worry about how to handle access to source code
who is allowed to clone a certain piece of code, and who is not



syntactically we need to figure out 2 things
be able to view person A's perspective of object B
	eg being able to see `Joe.height` from the perspective of `bar`
and be able to view object B's dependent from the perspective of person A
	eg being able to see `Joe.bmi` from the perpsective of `bar`




making copies of tags also solves the 3rd party delegation problem
	// TODO: FIND REFERENCED SECTION
to designate who "owns" the tag, just create the tag under the user
so even though it's a 3rd party app, it's using tags that are declared under the user
so the user can see them


every time a user makes a comment
tags it with a user's copy of the "comment" tag

	target:
		comment(user: Joe): "my comment"

if a user comments multiple times, then it automatically appends the timestamps?

	target:
		comment(user: Joe, timestamp: 432): "my comment"
		comment(user: Joe, timestamp: 819): "second comment"




note that, if you clone `foo: bar(2,3).zed`,
	you are not actually cloning the expression `bar(2,3).zed`
	you are cloning the output object of that expression, whatever `bar.zed` returns
so even if you had cloning access to `foo`, you actually need cloning access to `bar.zed`


on one hand, we want to make cloning simple, so you should be able to clone anything you can see
on the other hand, that makes it impossible for somebody to make a viewable, but not clonable property


use aggregators to mimic the behavior of an "API"?
so the user doesn't actually clone the service
they clone the API function that the service provides
and then the service sees the cloned module, the "flag" raised by the user
and can choose whether or not to accept the call
and spits out an answer
something like

	myService:
		mAggregator.
		getCandy:
			if _request.user == 'Bob':
				mAggregator[_request.user] := candy
	Joe:
		myService.getCandy()
		print myService[me] // prints `undefined`

this seems really complicated
and do we really want to encourage multiple ways of calling a function?
this is like how in javascript, async and sync functions look so different
	(sync functions look normal, async uses callback syntax)
but in Entangle I kinda want all functions to look the same, regardless of how it's implemented internally



interpreter can be modeled as a function too
so maybe, you can only clone a module if you can see the source code
because in something like `foo: interpreter(foo_source_code)`,
	if you clone `foo`, you are not cloning the source code, so it wouldn't work

this is the wrong way to think about it though
we should assume that everything is in the Entangle system
view our universe in the lens of the Entangle language
the interpreter is merely a tool used to make the code work in reality
but inside the code, everything should be modeled as if it is reality, as if the interpreter doesn't exist

in imperative languages, you can always call a function if you can see it
if you want to restrict the function call to "authorized" people, you can just modify the behavior
	of the function to take in a "authorization key" as a parameter

so maybe we can just do the same thing with modules

	myService:
		getCandy:
			=> _request.user == 'Bob' ? candy
	Joe:
		print myService.getCandy.() // prints `undefined`



in webdev if you send a request to a server, it sends back a response that only you can see
same with websockets
in Entangle terms, this is kinda like, cloning an object, and the server is somehow able to create data that is private to the client, even though the server shouldn't know anything about the client
maybe the client is providing a shared private key to the server, so the server can provide data back to the client?




something to be careful about:
you should not be able to gain more information out of a module by cloning it
that would be a security issue
that means that a module might not "own" everything that is declared under it
	like we thought previously ( // TODO: FIND REFERENCED SECTION )
because if `foo` clones `bar`, it still does not "own" the clone, because it shouldn't be able to see the internals
instead, a module only owns all the bindings it explicitly defines
so in something like `bar: (a: 2, b: "hello")`, `bar` owns everything inside
but in someting like `foo: bar(a: 20, b: "world")`, `foo` does not own `bar`,
	however `foo` _does_ own the argument object passed in: `(a: 20, b: "world")`


this makes the idea of "ownership" a bit more complex



if we allow the module to control how the cloning works
it is similar to how imperative functions work
only the module itself can control the behavior of its clones
however, while this feels natural for functions
it doesn't feel natural for "cloning" or objects
for functions, it is like, the caller is sending a query to the function, and the function sends an answer back
for clones, it feels like the cloner actually has a copy of the original object,
	so it's weird for the clone to somehow hide info from the cloner
	like, could the cloner somehow pry open the clone and extract the private info?
it feels more natural for the parent of the module to control who can clone the module


remember: you should not be able to gain more information out of a module by cloning it
thus, if we think of cloning as manually copying bindings
it would not copy over private bindings
you would end up with an incomplete copy





if a module is public
that means you can see its bindings, its "code", its implementation
and clone/copy its implementation
when you "view" a module, you can see how it's public properties are implemented
but when you view a property directly, you see it's value
for example:

	foo:
		a: 10, b: 20
		bar: a+b

if you have read access to `foo`, you can see that `bar: a+b`
so if you clone `foo`, and override `a`, it will work properly
however, if you only have read access to `bar`, you will only see `bar: 30`
you will not be able to override `a` by cloning bar, eg `bar(a: 10)`

a module is defined by its implementation, not its values
so if you have access to a module, you have access to its implementation
note that this only includes bindings defined by the module
	does not include implementation/bindings of its internal variables

should should resolve all the stuff we were wondering about earlier
about accessing source code vs values
and the implications for cloning




I'm not sure if I talked about this earlier but,
why do we want to allow indirect tagging of a public tag
	which can either cause a collision (if the aggregator accepts),
	or cause confusing behavior (if the aggregator rejects)
what is the point of making it the same tag?
why not always just create a new tag?
	as in, every time you want to indirectly tag something, you have to use a new local tag
because it makes it easier to use behaviors/functionalities that have already been defined based on the original tag
for example

	Joe:
		weight: 20
		bmi: weight/(height*height)
		subModule:
			height := 10 // indirect binding

if you just did

	Joe:
		weight: 20
		bmi: weight/(height*height)
		subModule:
			mHeight // declare a new tag
			Joe.mHeight := 10 // indirect binding

then you can see that `bmi` won't see the value `mHeight` and update accordingly

the problems only happen when you start defining indirect tags outside the aggregator scope

	Joe:
		weight: 20
		bmi: weight/(height*height)
	foo:
		Joe.height := 10 // indirect binding

if we allow it, but the aggregator doesn't "accept" the binding, then it can be confusing
	if `foo` asks for `Joe.bmi`, it will return the original `Joe.bmi`, without the updated height

so perhaps we should only allow indirect binding within the scope of the tag
and if you want to indirectly bind outside that scope, you implicitly (or explicitly?) create a local copy of that tag
and if you want to view dependents with your perspective, you have to explicitly declare it

	Joe:
		weight: 20
		bmi: weight/(height*height)
	foo:
		Joe#height := 10 // indirect binding, implicitly creates a copy, `foo.Joe.height` or something
		mBMI: Joe(this).bmi // somehow, clone Joe using foo's "perspective" and retrieve the new bmi property

