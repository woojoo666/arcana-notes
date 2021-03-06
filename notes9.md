### Entangle is now Axis!

* well this was decided a few weeks ago actually
* I wanted my name to convey two things:
	1. a network of bindings
	2. bindings converging to a single node
* so I made a list of possible names, and first narrowed it down to 6 (using [./name-choosing.html](./name-choosing.html))
* then I polled my friends, and Axis was the top choice
* note that a lot of my final names were already sort of taken
* Quark was a language by a small corp, and Axis and Nexus were small recent languages on github
* but there are tons of languages of tons of different names on github, so the only ones that aren't "taken" are esoteric
* and ideally you want a simple easy to remember name
* like Java, or Lisp, or Python
* so I decided, I'll take Axis for now, and I'll deal with conflicts if they arise later

* Axis is actually a great name because:
	1. it's simple
	2. it's mathematical, which points to the mathematical simplicitly & elegance that I am shooting for with this language
	3. it conveys the idea of a "central point", a central axis, to which bindings can converge or come out of
	4. you can have multiple axises, each having bindings going in and out, creating a sort of "forest" of vertical axises with connections to eachother
	5. I can create a unique design language out of the idea that is rather unique amongst current languages
	6. it kind of combines the words "Axiom" and "Nexus", two of my other top names

### Errors and Virtual Properties

we don't want errors tags to show up normally
only if you are in programming/debugging mode

think kinda makes sense too because
it's weird to attach tags directly to to `undefined`



this is starting to make me wonder
if its possible to formulate public properties in terms of virtual properties
the biggest difference is where it's stored
but I wonder if that is possible to resolve





is it really possible to always proxy?
say you want to append an argument to all outgoing argument objects
is that possible? with asymmetric encryption, we talked about how intermediate objects can't see data
but what if you used the same encryption method
you shadow the target with a proxy, that also uses asymmetric encryption (with it's own public/private key)
then, when the caller calls the proxy, it decrypts the arguments, adds the additional argument,
	and then encrypts it with the intended target's public key, and sends it over
so the caller never actually sees the real target, only the proxy

however, as long as the caller has access to at least one real target
then any property they access from the real target, can be checked that it is "signed" by the real target
so as long as you have access to one real target, you will have secure access to the entire network that
	is reachable from that target
and the intermediate nodes can't intercept or change anything

is it possible for the caller to ensure access to a real target?
maybe when the user downloads a program, it already has the public key of the target hardcoded in
so even if the user's admin network tries to "mock" the target and proxy it
the user's program can tell that it isn't the real target

have to make sure that the public key can't be modified though
maybe it's a private key?



the reason we can't make global properties like virtual properties
and another major difference between virtual properties and private properties (aside from where it's stored)
is that, with global or private properties, you can only modify them in an object's declaration scope
with virtual properties, you can modify them anywhere

which seems kinda ugly actually
like, when using virtual properties, no matter where you are using it, you have to worry about something in a completely different scope (but still in the virtual property scope) modifying that virtual property

with private properties, you can only modify objects in declaration scope
but what if we had something like this

	foo:
		bar: ...
		someScope:
			barAlias: bar

		someScope.barAlias <: test: "hello"

technically `someScope.barAlias` points to a variable in scope, namely `bar`
but `someSCope.barAlias` is itself an out-of-scope reference
so should this work?

the reference is out of scope, the value is in scope
I don't think this counts as "in scope"

also, it is confusing if you have something like

	foo:
		bar: (1 2 3)
		...
		...
		someScope:
			...
				...
					bar <: 4: "hi"

because it looks like `bar` is finished, but then we modify it later

maybe you have to explicitly specify that you are "accepting modifications" from your declaration scope
eg

	foo:
		bar: collector(1 2 3)




With public properties, we don't know how it acts on objects coming from outside of scope, because all objects are within scope
With private vars, we could say the same thing, we don't really have any examples showing what should happen

Difference between virtual and private is where you are allowed to modify the objects created inside
Private: declaration scope
Virtual: tag scope

If we compare write scope and read scope
Private: declaration scope write, tag scope read
Virtual: tag scope write, tag scope read

Seems weird
though I guess this makes sense if you consider that for a virtual scope, the tag scope is used as the "declaration scope"
	so it's still "declaration scope write, tag scope read" in a sense


Should we have separate scopes for viewing and cloning
Aka you can restrict a certain scope to only being able to view, and not clone
And a subset of the scope is allowed to clone?
But then we would have 3 levels of permissions: reading > cloning > writing

This kinda makes sense because if you have some long chain
foo.bar.x.y.some.path(10)
And you also have a chain of aliases
a: foo
b: a
c: b
...
Then you might be accessing the variable from a long indirect method
almost like viewing it from a series of cameras (camera a looks at foo, camera b looks at the image from camera a, etc)
So when you clone, it has to trace backwards along that chain until it reaches the source
Which means all these property access and aliasing has to go both ways, "bidirectional communication"

Flag watcher never ensured that
Flag watcher would only propagate up scopes
Not along references/pointers

Actually though that seems fine
When you "access" an object, you are seeing it "directly", you get a pointer to it's location
Note that also we don't want to put too much emphasis on scopes
If the parent object wants to prevent clones, they can create a proxy
It also keeps things simple: what you can view, you can clone




imagine if you wanted to have an object with some "private public properties"
that is, in the `keys` property, you have some private properties in there as well, but they would somehow be invisible
that way, when you are in public scope, you can only iterate through a subset of the properties
but in private scope you can iterate across the entire set of properties

this makes me think perhaps the `keys` property should be unordered...

actually, also the `<: someItem` so far has been described to add a list item
but shouldn't this be unordered too?
after all, how would we determine the order of these insertions anyways?

	x: collector()
	foo:
		x <: someItem
		bar:
			x <: someItem2

remember these are unordered statements
should we just assign some arbitrary order?




 #allkeys is a special property redeclared at every scope
 when should it be used?
  <:, static declared, [ ], [fn] ?


use `collector` ? or no
maybe `collector` has a special `_set` property
that can only be called within declaration scope?


what if you clone with private variables, will it get passed over? pass-through (override)

	foo:
		var #bar.
		baz(arg1: 10, arg2: 20, #bar: 30) // baz can't see #bar, so this is just shorthand for wanting #bar: 30 in final object


clones are unordered
so that means so are <: calls



the rules of cloning

`<:` calls are invisible as well

what if we don't want to notify
i dont think we should worry about that

revisit "Cloning and Source Code"

clone chains are ordered
because we have to know who is overriding who

what happens when we do

	inputObj >>
		calleeObj(inputObj)

and `inputObj` and `calleeObj` both have private vars (in their own respective scopes)




api calls too loose?
ugly?
we can modify a nested var from a completely different scope?
no
remember, you might have multiple paths to a variable
it's up to the api to control what is public and what isn't
but once something is available
doesn't matter how you access it
scope is an approximation



absolute vs relative action time

we use actions and cloning
but what if we want ordered
we can store the timestamp
but this is weird
in lists, we don't store the index in the item
the list determines the index dynamically
because we use relative
contextual
when you click the "addtrack" button, it is relative to the current track list you see
this is state vars



game mods
they modify the install directory
so that the program works differently
but you wouldn't be able to do this with our model
because you can't "modify" the input to the program
you'd have to re-clone the program with new inputs

uninstallers don't touch modified files
so its kinda like virtual properties
but not, because they modify the program

I guess for an offline game, the entire source would be offline
and you could clone that
it's up to the developers to decouple the "input files" from the program though
they could technically just encrypt the entire thing if they wanted


### Asymmetric Encryption and Secure Communication Between Caller and Callee

earlier we talked about how to "securely" and privately pass inputs
to a clone, because with pass-through
if you make inputs public so its visible to the source, then it will be public on the clone too
	see section "Calling instead of Cloning for Passing in Private Data"

however, we shouldn't worry about that
theoretically, if we use assymmetric encryption, we can ensure secure communication between caller and callee
so even if some input parameters are public, only the callee and the caller will see them
so you can do something like

	foo:
		#privateVar: someSource(input1: 10)

to keep the input private from outside the callee and caller

assume a secure direct channel between a caller and callee
note that, when accessing the callee, intermediate nodes can still intercept using proxies and such
but the caller will still have a secure direct channel with whatever object it ends up accessing

going back to

	inputObj >>
		calleeObj(inputObj)

and `inputObj` and `calleeObj` both have private vars (in their own respective scopes)

what if `inputObj` and `calleeObj` have different private vars?
what if they have the same private vars? override?
non-colliding private var should be passed through
colliding private vars, argument obj should have precedence
but how do we do both these mechanisms, while keeping private vars private?

callee checks it's private keys against the argument obj, property access, checking for collisions
if it finds a collision, it takes the value from the argument obj

note that properties from the argument obj could end up depending on properties of the callee!
eg:

	foo:
		a: 10
	bar: foo(b: this.a*2)

should we allow this?
can we prevent it?

even more complex, is if the argument obj has private vars dependent on the callee

	inputObj:
		var #privateVar: this.a*2
		publicVar: #privateVar / 7
	foo:
		a: 10
	bar: foo(inputObj)

note that this is creating new behavior for the input obj
it is creating a new value for `publicVar`, dependent on the private behavior of inputObj
almost as if we are cloning `inputObj`!!

### Arguments Object Cloned during Cloning

this sort of makes sense actually
the output object is a combination of the arguments object and the callee
it's not the same object as the arguments object
so naturally it has to copy over properties from the arguments object

so what does this mean if the arguments object has an API call, or a `<:` call
actually, this applies to stuff like
	
	someCollector: collector
	for node in nodes:
		someCollector <: node.value

because this is equivalent to

	someCollector: collector
	nodes.forEach(node => someCollector._set(node.value))

but the initial prototype is already sending `node.value` to the collector, with `node.value` being undefined
you have to use template

	someCollector: collector
	for node in nodes: template
		someCollector <: node.value

but this is quite ugly to have to remember to do every time...


### Cloning Libraries of Modifiers

cloning libraries?
what if you had a library of api calls, so they are all declared as templates
but then you want to clone the entire library, eg

	`foo: Math(a: 10), x: foo.add(20), y: foo.subtract(30)`

does cloning the library "run" the templates, or not?
well regardless, you could always just use a template when cloning the library, eg `foo: template Math(a: 10)`
that way we are sure it won't be run


### Functions As Templates

(continued from "Arguments Object Cloned during Cloning")

functions by default use templates
as in, any function, eg `foo: x => x*x`, is automatically a template, eg `foo: x >> template(_return: x*x)`
so major built-in functions like `forEach`, `map`, for/while loops, all work without explicitly using `template`
eg

	someCollector: collector
	for node in nodes:
		someCollector <: node.value

if you want an immediately invoked function, use `(... => ...)()`

### Running a Template

notice how this shows template are special
normally, cloning with zero arguments does nothing
however, for templates, cloning it "runs" the template, and strips away the template object
so if you want to clone a template to create another template, you have to do so explicitly
	`foo: template someTemplate(a: 10)`

or maybe calling, not cloning, strips away the template
so you can clone templates all you want
functions do double duty then: they are for whenever you want to create a template, or for creating functions
calling does double duty too then
so what if you want a function that isn't a template?
	aka a function that is "run" when created, and "run" every time it is cloned?
	just use a regular object, with your own designated return "property"
what if you want a template that isn't a function?
	just leave out the return value

note that this means it doesn't really make sense to access properties of functions anymore
	because they would all be undefined anyways, since no cloning or evaluation
this makes functions and objects very different, almost like imperative...

this basically means that functions can only be cloned or called
so a module can either have one output (from function call) or many (from property access)

### Templates and Modifiers

API calls and modification seems to add a lot of complications
	breaks lazy evaluation (// TODO: FIND REFERENCED SECTION)
	adds the need for templates
ultimately comes down to allowing a source to track who is cloning it
even if we model it using flag watcher
necessitates bidirectional communication, aka when you can view something then they can view you
	in order for the "flag" to be visible from the "watcher"


maybe we should have a special type of function that uses `<:`, "Modifiers"
	note that this doesn't include functions that call modifier
	because if you clone those functions, you will clone those modifier calls as well, so naturally it will work
we actually explored this idea earlier

in an earlier section where we talked about flag watcher, and how that means calls to modifiers should be broadcasted
	see section "Modifier Calls and Double Flag-Watcher System"
but then in a later section we talked about how that implies all cloning should be broadcasted
	see section "API Calls, Requests, and Cloning - The Missing Link"
but that isn't necessarily true
we only need to know about modules/functions that directly use modifiers, aka modules that have `<:`
those are the only calls that affect collectors
a module that doesn't call a modifier directly, can still be cloned
and it will keep calling nested calls, until it reaches a call made to a modifier
at which it will stop

well also for private behavior, as that also necessitates communication with the clone source

### Pure Modules

so maybe we should have a special annotation, "pure" that indicates that it makes no modifications and no private behavior
aka like a GET request (with no private behavior)
though pure modules can can still make calls to non-pure modules
all it means is that the module can be cloned without notifying the source module
	aka, manual copies behave the same as cloning

this way, templates and functions can still make calls to pure modules, and evaluate individual properties
and those can be accessed, even from templates/functions
so this includes calls to operators like `+` or `*`


actually, the main reason why we want to have these "pure" modules
is so we can be sure that we aren't making modifications when we don't want to
	eg declaring an API method

so it does matter if some nested call calls a modifier
because that determines whether or not we want to use a template or not


private isn't actually related to this issue
while it does require communication with the source,
it's fine if a module with private behavior (but no modifications) is cloned unnecessarily


maybe we can make it so templates only "run" when a property is accessed
so calling a function, immediately "runs" the template (because it's accessing the `_return` property)
but this is bad
we don't want behavior to change based on whether a property is accessed or not
property access should be a "free" operation, like reading from a file
you shouldn't have to worry about every property access

maybe we could have a separate template object, with a special "run" operator
just like how functions are a separate object, with a special "call" operator
but this only matters if we truly need functions that aren't templates, or templates that aren't functions
and this also doesn't really resolve how we should treat property access of templates

### Pure Complete and Pure Public

pure vs pure complete:
	pure: current module doesn't make any modifications
	pure complete: module and all created sub-modules don't make any modifications

when accessing template properties, evaluate if pure
eg:

	foo: template
		first: 1 + 2
		second:
			a: 3 + 4
			b: someModifier(a)
		third: somePureFn(5, 6)

	foo.first // returns 3
	foo.second.a // returns 7
	foo.second.b // returns undefined
	foo.third // returns result of somePureFn(5, 6)

note that it actually only calls modules that are "pure complete"
because it has to be sure that the called module, also doesn't make any modifications
	unless it can request that the callee also defers evaluation of its properties


notice that a malicious module can declare itself as "pure" without actually being pure
and then that would cause unintended modifications


or maybe we can have something called "pure public"
pure public:
	if a module declares as "pure public", then all calls to it will be manual copies
	if the module isn't actually pure public, then it's the module's fault for declaring as such
this way, you can't have a malicious module

### Templates and Property Access

(continued from "Running a Template" and "Pure Complete and Pure Public")

so three ways we can go about accessing properties of templates

1. always return `undefined`
2. evaluate if clone source is "pure complete"
3. evaluate if clone source is "pure public" (but not necessarily complete),
	do a manual copy, and defer evaluation of all nested properties
4. don't allow modification, which forces all modules to be pure



maybe the whole point of templates is that they are meant to be cloned and applied
so accessing properties of a template doesn't make sense


diagramatically, this whole "send request, get response" is actually kinda ugly
before, with our diagram syntax, we only had cloning, property access, and insertion


what if we only allow insertion, and modules that insert, no response
but what if you have a module that does have a response, but also calls a modifier?
same problem

though what if we restricted modules to either returning a value, or doing an insertion
	but can't do both



### Property Access vs Insertion

(in the next few sections, I refer to supplementary diagrams in the OneNote page "Property Access vs Insertion.one")

// TODO: CLEAN UP AND CLARIFY ONENOTE NOTES "Property Access vs Insertion.one"

[DIAGRAM: PART I](Property_Access_vs_Insertion.one)


two ways of thinking about creating a playlist
1. dynamically, using apis
	request to create a playlist, it returns the new playlist (response)
	then add tracks to the returned playlist
	do it from "outside" the scope
2. staticly, turning a list of tracks into playlists by genre
	mapreduce
	does it from "inside" the scope






map(x => x.#sometag)

dynamically inserts objects into a dynamic set of tags
akin to the { if (someSet == undefined) someSet = []; someSet.push(x); }
a super loose mapreduce that takes inputs and pushes results into dynamic sets
currently we have to declare sets beforehand, static
and we have to declare them as collectors
maybe you can declare a collector of collectors
the reason we can push into this, is because we aren't actually changing the collectors
	after pushing, it is still a collector
	type stays constant
in imperative, we can't just declare an infinite array of arrays, and then push into them


another way is the way we talked about earlier
	// TODO: FIND REFERENCED SECTION
using a different pass to declare the collectors


### Property Access vs Insertion II - Symmetry

(continued from previous section)

* in a mapreduce, the initial function exists, but results aren't bound to anything
* the mapreduce function is responsible for binding both inputs to each call to the function, and output from each
* instead of having the function specify where it's outputs should go,
	* (like in imperative where we would modify some external or global variables while inside the function)
* we let the surrounding system, aka the mapreduce, do all the wiring and binding, and determine how the function outputs affect the surrounding system
* we talked about this much earlier
	* sort of mentioned in section "Versioning is just Arrays/Maps", and also in audio notes "Recording 25", but I believe there was a section that goes more in depth about this
	* // TODO: FIND REFERENCED SECTION

* with API calls and modifiers, the output is already bound, which is what makes it weird
* though inputs can be already bound too...

* it is actually rather elegant, diagramically
* inputs can "fan out" to any module within scope that uses them
* and outputs can be inserted into any collectors in scope, from multiple modules they can "fan into" a single collector
* and when you clone a module, it clones these "fan out" and "fan into" bindings
* so there is this sort of inherent similarity, symmetry, between inputs and outputs


[DIAGRAM: PART II](Property_Access_vs_Insertion.one)


* so in fact, we shouldn't think about API calls in terms of "send request" and "get response"
* the request and the response are both encoded in the clone

* but how come it seems like the "request" is in the arguments object, and the "request" and "response" are in the clone
* and how come you can override inputs in the arguments, but not outputs?

* maybe you can override outputs...
* aka override collectors

* and if you don't want it to be overridable, make it private
* just like with inputs (if you don't want an input to be overriden, make it private)

* ANYTHING can be overriden

### Insertion - Prototypes vs Templates

(continued from previous section)

* playlists example revisited:

		playlists: collector()
		playlist1:
			name: "playlist1"
			tracks: (...)
			playlists <: this
		playlist2:
			name: "playlist2"
			tracks: (...)
			playlists <: this
		playlist3:
			name: "playlist3"
			tracks: (...)
			playlists <: this

* now you can clone one of them, and it would automatically be inserted into playlists

		playlist4: playlist3(name: "playlist4", tracks: source.tracks.+("Bad Blood") ) // appends "Bad Blood" to playlist 3
		print playlists.length // prints "4"

* see how you don't really need templates for `<:` to be useful
* not all Modifiers need to be templates, you can use prototypal style too

* templates are useful if you know what pattern/structure you want to enforce, without any usages
* eg you know that all playlists should have the `tracks` property, but you don't have any initial playlists to serve as a prototype
* so you create a template with the `tracks` property, so that other people can clone it and create playlists that follow that structure

* prototypal is best for initial design, prototyping
* hard-coding stuff to make it work for your specific use case
* after the project grows and patterns are noticed, and structures are standardized
* then templates become more useful

### Templates and Property Access 2

(continued from previous section)

* this also helps to explain why accessing properties in tempaltes doesn't make sense
* if templates don't make any insertions to outputs
* then it doesn't make any requests from inputs either

* technically, although defaults are set, the inputs and outputs aren't defined yet
* the cloner/caller has to provide both the inputs and the outputs (though usually just the inputs)
* accessing a property would be as if the input is defined already

### Overriding Collectors

(continued from section "Property Access vs Insertion II - Symmetry")

* being able to override collectors may actually lead to some interesting new design patterns
* I have not seen any language with a similar behavior

* though its a bit esoteric to override collectors
* because usually you override inputs to see how the module behavior changes with different inputs
* however, if you override outputs, the module behavior doesn't change
* so you don't need to really clone the module, you can just assign the output of a single module to multiple variables
	* aka have multiple variables reference one module


[DIAGRAM: PART III](Property_Access_vs_Insertion.one)


* could be useful if you have feedback

* maybe if you have multiple outputs, its an easier way to map them to variables in scope

eg:
	
	foo:
		out1: someFunction(1)
		out2: someFunction(2)
		out3: someFunction(3)

	bar:
		fooOut: foo()
		a: fooOut.out1
		b: fooOut.out2
		c: fooOut.out3

re-written to use overriding collectors

	foo:
		out1 <: someFunction(1)
		out2 <: someFunction(2)
		out3 <: someFunction(3)

	bar:
		a, b, c
		foo(out1: a, out2: b, out3: c)

* though notice the difference in how `foo` is defined in both examples
* for outputs, you have to remember to use collectors and `<:` instead of static definitions and `:`
	* so that you can override the collectors

### Asymmetry Between Property Access and Insertion - indirect reads vs scoped writes

* there still does seem to be a bit of assymmetry in terms of inputs vs outputs
* inputs use a single unified syntax
* outputs use both `<:` and `:`
* `<:` also is a "level deeper", and has weird restrictions like you can't do `foo.bar <: ...`

* the conclusion we made about inputs and outputs is because we'd like to preserve "symmetry"
	* if outputs aren't being used, then inputs shouldn't be either
* but another way of looking at this, is that in our language, inputs = outputs
* this idea is further supported by our concept of feedback, which actually does allow outputs to be inputs


* the reason why we can do `someInput.some.path` but we can't do `someOutput.some.path <: ...`,
* is because in `someInput.some.path`, `.` is actually an operator, you are operating on the input `someInput`
* **values you can access are different from variables that are in scope**
* so `someInput.some.path` is a value you can access, via these `.` operations
	* similar to doing something like `((1 + 2) + 3)`
* but `someInput` and `someOutput` are the only variables in scope
* so those are the only variables you can read from or write to

* but what if you did `foo: someInput.some.path`?
* now it's a variable in scope, but you still shouldn't be able to write to it

* perhaps there's a difference between variables created in scope, and variables simple used as aliases, like `foo` above

* but that begs the question, what if you did something like `bar: someOutput`, could you insert into `bar`?
* is this property of being "created in scope", something that is statically bound to the declared variable name,
	or is it a property that can be evaluated and determined dynamically

* maybe inserting into `foo` inserts into the variable `foo` but not the value `someInput.some.path`
* so it kinda feels like non-determinism, you are inserting another possible value into the variable
* you aren't modifying the value
* however, for objects created in scope, like `someOutput`
* anybody using it, can extract the entire set of possibilities stored there, so you would get a list of all values inserted
	* which is what we want

* being able to tag a variable without modifying the value it's pointing to,
* feels almost like virtual properties
* which brings up an ambiguity: if we now do `foo.someProp`, is it operating on the original value `foo` pointed to, or the new "set of possibilities" that we have created?

### Indirect Writes, and Pass-By-Reference Model

when you use `:` you can only have one writer, whereas with `<:` you can have many
with reads, you can always have multiple readers, because readers will never interfere with eachother
and, as we already discussed, slightly different scoping rules

it seems like there is an inherent asymmetry between inputs and outputs

true symmetric would be like, every node has a bunch of connected communication channels to other nodes
	kinda like websockets
and through any one of these channels, you can read or write


referencing another variable, is not actually reading from it
reading, is property access


reads are anonymous, unordered

but so should be writes, and clones for that matter
	contrary to what I said in the sections about "clone origin" and `_origin`
	see section "Binding Origin"


we talked earlier about how indirect modification is ugly, diagrammatically
but we don't need to think about it that way
we aren't extracting a value, and then writing to it
we are extracting a url, and then accessing the object at that url, and writing to it
it is sort of like memory addressing, like how imperative languages treat pointers and objects
this is pretty much just "pass-by-reference"


[DIAGRAM: PART IV](Property_Access_vs_Insertion.one)


like, imagine if you asked `reddit.com` for it's top link, and it returns it
and then you send a post request to that link
that's sort of how it's like

notice that this also implies a **secure direct communication channel between caller and callee**
which is what we are assuming anyways, and which is technically achievable using asymmetric keys
	see section "Asymmetric Encryption and Secure Communication Between Caller and Callee"


maybe you can actually insert anytime you want
however, most of the time, it's ignored
sort of like the `_incoming` idea talked about before
	// TODO: FIND REFERENCED SECTION

insertions are anonymous, and unordered, sort of like non-deterministic possible values
to read from these insertions, you have to explicitly use a for-loop
and "extract" them, sort of like the "fan-out" syntax used in the diagram syntax

if you are actually reading from these insertions, you probably want to prevent arbitrary people from inserting
so that is when you use scoping and private variables
it's up to you to make sure that access to that node is controlled and restricted

as for named insertions, there can only be one

but you want to prevent arbitrary people from doing these as well right?
often times you are reading from certain named properties
	and sometimes they aren't defined, intentionally
so if arbitrary people can just modify them, then they could define them, and mess with your behavior



when you override, you are just re-mapping variable names
so when you define a module, you are defining a structure with some default mappings to objects
and wen you clone+override, you are copying the structure, with different mappings
every variable name can be changed or overriden


### Unified Access - Read/Clone/Insert Privileges

* access is anonymous
* once you have access to an object, you can read from it, clone it, write to it
* completely anonymously, the object doesn't know who you are (unless you explicitly tell it)
* and thus, the object can't discriminate based on "where you're from" or what scope you're in

* also assume a secure direct communication channel between caller and callee
* this is implied by the pass-by-reference model (see section "Indirect Writes, and Pass-By-Reference Model")

* this might seem too insecure
* but actually, this just abstracts away security from functionality
* you can implement the security however you like
* you can make it really hard to access this object, or really easy
* but once somebody gains access, they can interact with it however they want

* note that if you give a module insertion access, that gives all it's clones insertion access too
* eg if `foo: someInput >> (bar <: someInput)`, and somebody has access to `foo`, then they can clone `foo`
	* which will cause another insertion to `bar`

### Insertion Restrictions

maybe you can't insert properties, only virtual properties or set items
when you have access to a module, you only have access to the outside
you can interact with it, but you can't modify it's internals

but it's internals, it's properties, are just mappings right?


recall that a Modifier is any module/function that uses `<:`
because when cloned, it modifies the behavior of other modules

it seems like the only way to allow external users to modify a module,
	is to expose Modifiers, or to use `<:` directly
however, Modifiers are a bit unintuitive
because you would never really use them in a prototypal way
if you were simply hard-coding some functionality, you would just use `:` and map/reduce functions directly
you wouldn't really use `<:`

instead of:
	
	playlists: collector()
	playlist1:
		name: "playlist1"
		tracks: (...)
		playlists <: this
	playlist2:
		name: "playlist2"
		tracks: (...)
		playlists <: this
	playlist3:
		name: "playlist3"
		tracks: (...)
		playlists <: this

you would just do

	playlists: list
		()
			name: "playlist1"
			tracks: (...)
		()
			name: "playlist2"
			tracks: (...)
		()
			name: "playlist3"
			tracks: (...)

so the natural way of doing it, isn't conducive to cloning, isn't useful as a prototype

perhaps tags would work better here


	var #playlist: ()
	playlist1:
		name: "playlist1"
		tracks: (...)
		#playlist.
	playlist2:
		name: "playlist2"
		tracks: (...)
		#playlist.
	playlist3:
		name: "playlist3"
		tracks: (...)
		#playlist.


This only works for virtual properties tho
Otherwise it can't track clones?
Or rather, it shouldn't
When you use normal properties, and you search with "objects with ___ property", you usually specify a set of objects to search

Inserting properties definitely isn't conducive to prototypal style
Would immediately result in a conflict, overdefinition

### Accessing Externals vs Defining Internals

If access is always from the "outside" of an object
How would we dynamically enter an object and modify internals
Distributed definition
Shared write key?
But also shared access to all private vars

Reason why writing properties from outside is weird
Is that you are writing it from the wrong scope
Recall that when you override properties, you also override name mappings
But if you are overriding name mappings, over shadowing scoped vars, you are in the wrong scope

When you define an object, you define two things
How the object looks from the outside
What the object behaves like on the inside

Ultimately, somebody has to create the initial object definition
That initial definition can determine if the object accepts modifications from the outside or not (as well as declaring all the other behavior of the object)


The anatomy of an object definition:
define the structure (you can do this entirely using private properties if you wish)
Or you can do it using dataflow diagram
While defining the structure, define some named parts of the structure, "parameters", such that they can be changed
Define some public properties, pointers that point to certain parts of the structure
Note that parameters can have the same name as variables or properties already in scope
These as "default bindings"
As parameters, they can still be overridden
But they have default values bound to them initially

We can generalize it even further, because public properties are just properties with keys defined in public scope



But wait, problem with letting anybody insert
Is then person A can take an arbitrary object and insert into it
And then person B can iterate through the inserted items of that object
And thus, person A and B can use any arbitrary object as some mode of storage or communication

perhaps the object has to be declared as a collector
in order for the objects inserted, to appear on the "outside"
Aka in order to iterate across inserted items

However, this works different from our previous scoping rules for collectors
It isn't figuring out at compile time that you aren't "in scope" for the collector
This is a runtime, dynamic "failure" to insert
It just won't do anything
kinda like trying to access a nonexisted property
You are allowed to do it, just won't be very useful

Still feels a little ugly that insertions are not scoped anymore
Though I guess it feels simpler, that write access is managed just like read access
If you want it scoped, just make it a private var
It abstracts scoping away from functionality
Orthogonal concepts
Insertion is not inherently bound to scope, they are decoupled
It also matches API calls, which are also open access

But can we come up with an example where we would want indirect modification, and it's still "clean" scalable design (and not spaghetti code)
Also, how would we create some sort of object with private insertion access, but public read access?
We can't use private var with public alias, because you would still be able to insert via the public alias



all this begs the question
if we have a single point of permission access for reading, cloning, and insertion
why not writing as well?
why not make it so, if you have access to an object, you can write/modify it however you like
and if you want to prevent people from modifying an object, just make it private
	or make it's properties, and the scoped variables the object depends on, private as well

right now, we sort of have a single static definition, a single writer that defines the object
and then everybody else has to view the object from the "outside"
but if we also allow write access, then it becomes a more distributed, communal model
anybody can modify!

but this is too flexible?
somebody could, for example, modify the definition of the number 2
it becomes impossible make an object with public properties that isn't modifiable?





another reason templates shouldn't have reads
imagine a "read" request with authentication
then you have to send data
so it isn't just a property access anymore, it's a function call
unless...you could do `foo["someProp"(password: "hunter2")]`




there are actually only two ways to introduce feedback:
1. self-reference, a variable whose definition contains a reference to itself (and not a clone of itself)
2. insertion

there are some major benefits to non-feedback code
* adirected graph, so easy to synchronize
	* though technically you can synchronize feedback code as well, wait for all updates to finish propagating
* much more optimized lazy evaluation
	* though technically you can  still "lazy-evaluate" code with feedback, it often ends up looking more like regular evaluation


----- vvvv ideas relating to cono vvv ----------------


often times you have to decide between
having a central node that handles communication with an external class B
having a layer, such that all nodes can communicate with external class B independently
	eg, tooltips can communicate with content script, that communicates with background script
	or, tooltips can communicate with background script directly



lets say you add a tag
or lets say, your friend adds a tag from your account
on your side, both actions would result in the same "update" data
but you want to display it different ways
in that case, you want to know where the update was initiated from
how would you do that?



you have a module A and module B
"synced" set of data
module A makes changes, sends changes back to B
makes incremental changes to dataset on A
assume expensive to communicate, so instead of sending the entire updated dataset, just sends a "success" or "fail", and then A and B modify their dataset in the same way
	code duplication, but that's fine
every once and a while, refreshes entire dataset




notice:

		me.elem =
			tag_template
				.clone(true) // clone template with event handlers
				.click(me.toggle) // notice the feedback here, this part actually doesn't work unless you add feedback (or use "() => me.toggle()"")
				.prependTo( element.find('.cono-tooltip') );
 
		me.toggle = function () {
			console.log("toggle tag");
			var promise = this.user_tagged ? removeTag(link, tag) : addTag(link, tag);
			promise.then(() => {
				// if the promise succeeds, the tag was toggled
				this.user_tagged = !this.user_tagged;
				if (this.user_tagged) {
					this.count++;
				} else {
					this.count--;
				}
				this.refresh();
			}).catch(error => console.log(error));
		}

		me.refresh = function () {
			this.elem
				.text(tag + ' | ' + this.count) // update text
				.toggleClass('cono-user-tagged', this.user_tagged);
		}


### Parametized References and Query Parameters

* something interesting about HTML GET Requests
* is even though they are not supposed to create any state changes on the server side
* they can send data, via query parameters in the url

* so this is different from regular property access, because it is parametized
* but it is also different from cloning, because cloning is more complex behavior, and can do stuff like

		foo: bar(arg1: 10, arg2: 20, arg3: foo.someProp) // notice the feedback


* should we introduce the concept of "parametized references"
* where these parameters have to be simple, static, and cannot contain feedback?

* I'm not sure if this is possible though
* it might seem like something like `foo: bar(a: 10)` is simple, and static, and doesn't contain any feedback
* likewise, something like `foo: bar(a: 10[20])`
* but what if the number `10` had a reference to root
* and then you could do `foo: bar(a: 10.root.some.path.back.to.foo)`, and now it contains feedback...

### Formalizing Insertions

* what changed
* before, insertions were scoped
* now insertions are "public", if you have access to the variable you can insert into it
* however, due to the concept that all objects have full control over internals, and how they look from the outside
* it means that nobody should be able to modify an object if the object doesn't want to be modified
* aka, by default, the object should




### Sets, not Lists

* back in the section "Values are Lists", we changed anonymous values to be treated as list items, not set items
* but I'm going to change that back

* insertions are unordered, and for elegance, we should make anonymous values the same as insertions
* we should encourage unordered lists
* passing in un-named values as arguments, means they don't look like public properties anymore, so it feels more secure
	* before, if you passed in `(a b c)`, it would look like `(1: a, 2: b, 3: c)`, but then it seems like those properties would exist in the clone result, and thus be public

* to define ordered lists, you now have to use square bracket notation, `[a b c]`, just like most programming langs
* also, for ordered statements, you have to use the `do` keyword
	* unlike how we previously handled it, in the section "Lists and Statements"

* to address the benefits of lists over sets, brought up in the section "Values are Lists":
	* referencing values by index: we can't do this anymore, unfortunately. Use square bracket notation if you want ordered values
	* ordered array access eg `multidimensionalArray[10, 20, 30]`: this can still work, the arguments are simply interally mapped to properties `1, 2, 3...`

### Sets vs Hashsets

hashsets are different from properties
insertions are by default ignored
but they can have duplicates


for example, say we had

		average: nums >>
			#sum: collector(+)
			for num in nums:
				#sum <: num
			=> #sum/#sum.length

### Syntax ---------------

`someObj <: someProp: someVal` is used for virtual properties only
you can't define virtual properties like normal properties, even if they are in tag scope, eg you can't do `foo: (#someVirtualProp: 10)`

likewise, you can't define regular properties like normal properties, even if you are in source scope, eg you can't do `foo: (this <: someRegularProp: 10)`



`foo: (a b c)` is a set, and is equivalent to `foo <: a, foo <: b, foo <: c`
to declare arrays, use square bracket notation, `[a b c]`, which is equivalent to `(0: a, 1: b, 2: c)`


* in addition, we can access them by `items`
* `items` is a special reserved keyword
`items.keys` is for non-duplicates, `values` is to see how many are in each


* previously, we explored how to handle the case where both named and anonymous arguments are provided
	// TODO: FIND REFERENCED SECTION
* but I think the best way would actually be to just treat each mechanism separately, and if they collide, they collide
* for example:

		foo: // implicit inputs: a, b, c
			x: a + b + c

		bar: foo(1, 2, 3, b: 10)

		print bar.a   // prints 1
		print bar.b   // prints "undefined (overdefined)"
		print bar.c   // prints 3

* it's simple and intuitive, and if you want to prevent overdefinition, you have to apply them separately, which will naturally specify a precedence order

		bar1: foo(1 2 3)(b: 10)    // named arguments override unnamed arguments

		bar2: foo(b: 10)(1 2 3)    // unnamed arguments override named arguments

		print bar1.b    // prints 10
		print bar2.b    // prints 2



### Errors and Special Properties

* continued from "Errors and Virtual Properties"

* actually, using virtual properties for errors doesn't really make sense
* because the value is `undefined`, so if you try to attach a virtual property to that, eg `undefined <: #errormsg: "overdefined"`,
	* then you are actually just doing `#errormsg.put()`


instead, errors properties are special
we clone undefined
and we attach the special error property, `#error`

* you can clone `undefined` yourself to create custom errors

* note that you are only allowed to attach this property to `undefined`
* and you are not allowed to attach any other property to `undefined`

* this way we prevent unintented behavior
	* eg if you did `foo: bar.x`, and `bar: undefined(x: 10)`, then even though `bar` is undefined `foo` would be `10`
	* which is weird




### Pure Modules vs "Stateful" Modules

* a pure module is a module where:
	* the module itself and any sub-modules do not perform any insertions to external variables
	* all sub-modules are pure
* this was previously called "pure complete"
	// TODO: FIND REFERENCED SECTION

*

by definition, side effects



### Syntax Pairs

each mechanism seems to come with a pair of syntax operators
* templates/functions, call operator
* define property, property access
* insertion, items retrieval
* state variable, do keyword

i wonder if there is any reason for this

one internal, one external?
one departs from object, one to turn it back into an object?

### Asymmetry Between Property Access and Insertion II - named reads vs anonymous writes

lack of symmetry
with reads, you define named properties and retrieve them
with inserts, not named
diagram, isn't symmetric
cuz all reads are named, all writes and unnamed

also properties you can only define from inside
but set items you can insert from outside or define inside


what if we had a pure property-insertion object

so, imagine a node with rays shooting out of it
that is a canonical object, and each ray is a property that can be accessed/read
the object has a statically defined internal behavior, and properties that are externally viewable

now, take that node, and flip it inside out
now you have an object with rays going into it
this is an object that accepts property definitions from anybody
but you can't access any property outputs

in order to access these property outputs, you have to convert the node back into a regular object
flip it inside out again
this can be done syntactically using an operator

this is a more symmetric way to handle reading vs writing
but this still isn't perfectly symmetric
because while you can turn a write-object into a read-object
you can't turn a regular, read object, into a write object
	or else anybody could take any object, and convert it to a write object, and start writing properties

But isn't that what cloning is

You can use scoping to do something like insertion
But it doesn't work with cloning
The scoping method is just using a reference
But with insertion, the internal functionality of the object is linked to the insertion


imagine a graph
inputs are lines going in
properties are lines going to the surface
writes are lines going out



this shows that reads aren't equal to writes
raads don't modify the source object, they modify me
writes don't modify me, they modify the target
however this still doesn't discount the idea of named writes


named insertions would cause an immediate collision when cloning
and as just shown, cloning is the major distinction here, the major feature provided by insertion

reading is many to many, so has to be named
writing has to be many to many too
writing is named I guess, the collectors are named
a module can insert into collectors in its scope, or also on its "surface" (aka the module's properties)

but there is a difference
with both scope inputs (inputs pull from scope) and direct inputs (inputs that are part of the object, set from arguments during cloning/calling),
	they both act the same
but for "writes", when you "write" to a direct output, aka a property, you are defining that property (the value is exactly what you give it, one-to-one)
	but when you "write" to a scoped variable, you are inserting to that variable (the value is a set of all insertions, many to one)

(note: later on, in the section "Scope and Insertion", I figure out that writing/inserting to a property is different from defining a property)

one to many - reads
many to one - writes

so i guess many values to one collector, has to be somesort of set, or non-determinism
whereas one to many can be just copying / reading, no need for anything special



be careful using set items as inputs
if you knew `foo` was going to do `bar(baz)`, couldn't you insert items into `baz` to mess it up
but at the same time, what if we wanted to do `numset: (1 2 3)`, and then `bar: sum(...numset)`
you have to declare `numset` as an explicit set in this case


maybe it is symmetric
we talked about how you can declare set items internal, but you can't declare reads external
reads can have implicit inputs, inputs "pulling from" the current scope
writes can ahve implicit outputs, outputs "pushing to" the current scope
but those are just named collectors not in current scope,
not explicitly declared set items

### The Definition of Scope

in order to figure out what we should do set items
we should come up conceptually what it means to define a module
what are the parts we are defining

all reads come from scope
i guess you could consider insertions part of that too, all insertions to a certain module, is part of that module's scope
kinda makes sense, because if a parent module decides to "provide more variables", it won't change the behavior of the child module
its up to the child module to reference and use variables in scope

what is scope
scope is values that people have provided to you

3 types of scope vars
vars with names and values, aka regular vars
vars with names but no values, aka inputs
vars with values but no names, aka insertions

this isn't as symmetric and homogenous as it seems though
regular scope variables and input vars, are all provided through the scoping mechanism
whereas insertions aren't...


scope is a fancy way of giving inputs to a module you are constructing
currently, when you clone a module or call a function, you have to explicitly pass inputs
we could make it so you have to explitly pass inputs to modules you are defining as well
but scope is a way of automatically mapping and binding some inputs
we could also make it so you automatically pass scope in as input when cloning a module or calling a function
but that is messy

insertion is like a default input, an unnamed anonymous input parameter
kinda like how function return is a default output
just like it's useless to extract the default output if it isn't defined or used
it's equally useless to insert into the default input, if it isn't being used (aka if the module isn't a collector and doesn't reference the special `items` property)
there seem to be some major differences between how default outputs and inputs work though...


parent gets to choose the inputs aka scope
definer gets to choose the behavior, how it uses the scope/inputs
in the case of creating an object from scratch, the parent and definer are pretty much the same thing

but in the case of insertion, anybody can input, parent has no control...

but parent, is part of scoping, which is an approximation
more precisely, it is the caller/cloner that controls the inputs to a module

but the caller/cloner/definer does control the input
they can make the object private if they don't want anybody to insert to it
though that also prevents anybody from accessing it

### Scope and Insertion

(continued from "The Definition of Scope")

when a module references the `items` special property, it is like opening a port to the world
it allows anybody to insert an input into the module
and insertion inserts an item into the scope of that module


notice that now, it doesn't make sense to treat anonymous values as inserts
because inserts are sent in from the outside, and are inserted into the scope (which is also outside in a sense, it's an input, and not visible as part of the module itself)
but anonymous values are defined on the inside, so they are part of the object, and should also somehow be visible from the outside, and seen as part of the module itself

note that we can always have some "default inserts", by simply doing `this <: 10, 20, 30` in the declaration scope


for most named outputs aka properties, you can have as many people reading from one property as you want
but usually you can only read once from an anonymous output, because once you call a module, it automatically returns the anonymous output
	so nobody else can access that intermediate module, and ask for the anonymous output (as well as any other property/output)
likewise, for named inputs aka scope variables, each input can only come from one variable
but for anonymous inputs, you can have multiple people inserting into it
I don't know if there is any meaning to this symmetry though, it is rather arbitrary
we could design syntax so that you could retrieve from the default output multiple times
actually, **named outputs are not properties**, I keep mixing this up
defining properties is not the same as insertion
defining a property is it's own mechanism actually, separate from property access, cloning, and insertion

anytime something is exposed to the public, there is an implicit one-to-many relationship
eg for reading, one object can be read by multiple readers
for writing, one object can be inserted to by multiple writers
if you expose a value/object to the public via a public property, it has to be ready to handle this one-to-many relationship

### Anatomy of a Module

* there are two main parts of the module: the environment, and the body

The Environment:

* the environment is the "scope" or the "input space" to a module
* it is the space of objects with which the object can access
* it is defined by the declaration scope, insertions from the public, and any arguments passed during cloning/calling
* note that the environment isn't just whatever is "outside" the module that is accessible
* it also includes the properties defined by the module, and the private variables defined inside the module
* because those can also be used when defining the behavior of the module

The Body:

* the body is the "meat" of the module, whatever is defined and constructed by the module
* everything in the body is carried over during cloning
* the body has two parts:
	1. the behavior, defined by the expressions of the module (reads, clones, writes)
	2. the properties, named pointers/references to objects in the environment (property definitions)

### Insertion and Cloning

* notice that this also implies that insertions are not carried over during cloning
* because they are part of the scope, not the behavior, of an object
* but is that right though
* declared inputs are carried over during cloning
* what if you declare an explicit hashmap, one that is "user-created" via insertions, now you can't clone it

* actually it is carried
* because when the original object creates behavior based on `items`, it refers to the items inserted into the original object
* and that behavior is cloned
* if you don't want it to carry over, the original object can do something like

		source:
			inputs: this.#items
			output: sum(inputs)
		clone: source(inputs: this.#items) // now clone.output it is based on clone.#items, not source.#items


* but what about Modifiers
* if foo contains a modifier that is called a couple times, and bar clones foo, does bar inherit the changes made to foo from those modifier calls?


* playlists example, would we want inserts/modifiers to be cloned for `addTrack`?

* what if somebody inserts into the default `collector`, would that affect everybody?
* well maybe the default collector is a template, so it doesn't receive inserts

* maybe we can refer to `this.items` instead of `items`, so when it gets cloned, the reference automatically changes
* though we don't use this pattern this for any other scoped variables...
* in fact, doing so, would mean a blank clone, eg `someCollector()`, would result in different behavior
* which is counter-intuitive


* though wait, if you want to be able to clone a collector and insert items into your newly created collector
* the behavior of the clone has to be dependent on the items inserted into the clone, not the original collector

* lets look at similar example, hashmap

		Hashmap: template
			keys: collector(this)
			put: key, val >>
				Hashmap[key]: val
				keys <: key
				=> Hashmap[key]    // will return undefined if collision

		foo: Hashmap.()
		foo.put("key1", 10)
		foo.put("key2", 20)

		bar: foo()
		print bar.key1    // what should this print??

* notice the many "empty" calls
* eg `foo: Hashmap.()`, and `bar: foo()`
* and I was also going to do `keys: collector()`, but I decided that perhaps `collector(this)` might work better?
* it's clear that we haven't completely figured out how cloning works with collectors and insertions
* because technically blank clones shouldn't do anything, but here it feels intuitive to use them


* how would we do this without insertions
* aka create some sort of hashmap where external actors can affect the properties of the hashmap
* pretty difficult
* we could use flag watcher model
* which is like a fancy query that searches for flags, and then a mapreduce that turns the query result into an object
* notice that the resulting object could be cloned, and it would carry over all the user-inserted properties

* one of the major shifts in mindset we had when creating the concept of insertions
* is a shift from a graph dataflow "pass-by-value" model, to an address-based "pass-by-reference" model
	* see section "Indirect Writes, and Pass-By-Reference Model"
* that is, if you do `foo.bar`, it isn't retrieving the value of `bar` from `foo`
* it is retrieving the address of `bar`, and then talking to `bar` directly via it's address
	* (actually, the object stored at `foo["bar"]` isn't necessarily called `bar` but you get the point)

* this sort of direct communication is what makes insertion make sense
* it acts like a post request to a server

* however, the complication is that now, anybody can insert and "modify" an object
* sometimes, people may insert into an object to "help define" the object,
	* in which case you do want it to carry over during cloning
* other times, the insertions are characterized as ways to "use" and "interact" with the object,
	* in which case you don't want it to carry over during cloning
* so the question is, are insertions considered part of the internal behavior of the object, or not?

* or maybe it's up to you to define that
* maybe you have to pass in `this`, or `items`, and it will use your insertions instead of the source's
* is this similar to how javascript uses `this`, or how python has `self` as a parameter for every object method


* behavior is by default always inherited from the source
* nothing is passed in from the caller/cloner automatically
* if you want an object to be based on some part of your scope, or your behavior, or your inputs
* you have to manually pass it in

* also, this means that we shouldn't really reference `this` or `this.items`
* because that implies that the behavior is dependent on what the current object is, and would change during a blank clone
* though `this` is used fine, without issue, in many other contexts
* for example, when we want to access an object key, eg `this[someKey]`
* this doesn't cause any problems after cloning, because the properties are inherited, so the behavior is carried over and behaves the same
* however, with insertion, the `items` special property should be different for every object, so `this.items` will never be inherited
* or maybe it should...?

* maybe a special `items` property isn't how we should reference inserted items
* what we need, is a way to access inserted items that is:
	* accessible from the inside, but not the outside, aka only accessible in declaration scope
	* different for every created object

* maybe we can use a private key `#items`
* that way, it's only accessible from the inside
* and also, it is inherited, but the clone cannot see it
* cloning always creates a new `#items` private key, separate from the old one, but the old one still exists
* something like

		source:
			var #items: <internal implementation>  // automatically provided by system
			for item in this.#items:
				...   // do stuff with inserted items

		clone: source(
			var #items: <internal implementation>  // automatically provided by system
			...
		)

* notice how `clone` automatically creates its own `#items` key, so that it can create behavior based on its own insertions
* however, even though the clone has cloned the reference to `this.#items`, this is still using the source's `#items` key
* so it still references the sources `#items`
* if you want to override the source's `#items`, the source has to provide it as an overrideable property
* something like

		source:
			insertedItems: this.#items
			for item in insertedItems:
				...   // do stuff with inserted items

		clone: source(insertedItems(1 2 3)) // create a clone that behaves as if only the numbers 1, 2, and 3 were inserted


### Insertion Items Syntax

(continued from previous section "Insertion and Cloning")

you have to pass in
but by default, it should be public
by default, when you reference items, it should be overridable, and if you want to make it not overridable, you have to explicitly specify that it is private

actually, notice that we can rewrite collectors such that, there is no reference to inserted items, just an implicit input
and when you clone collectors, you have to pass it in
notice how collectors doesn't have to be a template anymore
which is nice, it purely defines behavior
the "items" can come from anywhere, eg from insertions, or from a list, etc
the caller defines where the "items" comes from

though with modifiers, you can specify a "default output"
so why not be able to specify a default input, aka from insertions?

well because the default output is in the declaration scope
and insertion items would come from the callee scope, which the behavior of the module shouldn't depend on

though actually, insertion items would be from the clone itself, not necessarily from the callee

### changing behavior for every clone?

technically it is possible to make behavior of the module dependent on each clone
something like

	someMap.
	foo:
		someBehavior(someMap[this])

notice that `someMap[this]` will be different for every clone

though this is only achieved by referencing an external variable
which seems obvious, of course you can use external variables to make behavior change based on each clone
you could also do something like this:

	someVar: foo.bar
	foo:
		bar.
		print someVar = bar // will print true only for foo, prints false for all clones




### Lists, not Sets

flip flop
now that anonymous values aren't inserts anymore
	see section "Scope and Insertion"
should we treat them as set items, or list items?

well, set items would imply that they are keys, `someItem: true`
whereas list items would imply that they are values, `1: someValue`
and we are implicitly filling in the other side

also note that we don't need to worry about arguments being public
	as mentioned in section "Sets, not Lists"
because even for explicit arguments, like `foo(a: 10)`, we shouldn't worry about revealing these arguments to intermediate nodes
in fact, there is no such thing as an intermediate node, we should assume direct communication




### getting around scoping restrictions

how do you override vars without making them public
is anonymous inputs the only way?

how would you "omit" certain variables from the scope, given to the child var?
we can currently only override

ntoice that we are already doing something special with arguments
if we treat `(a b c)` as list items, then these list items aren't carried over to properties in the output, they are mapped to implicit inputs
so if you inspect the output, you wouldn't see `1: a, 2: b, 3: c`, even though you see it in the arguments

### Chatroom Example - Full Stack Web Applications

* imagine we want to create a web server that hosts chatrooms
* the user can input a chatroom, and a username, and start chatting
* it would look something like this

chatroom example:

	ChatroomServer: Server

		url: 'www.chatrooms.com:5000'
		chatrooms: collector

		chatpage: Client
			route: '/'
			layout: pugLayout // using [pugjs](https://pugjs.org)			
				input.username
				input.chatroom

				div.conversations
					for msg in currentRoom.conversation:
						p msg

				textarea.message-draft
				button(onclick=send)

			username: html.find('input.username').value
			chatroom: html.find('input.chatroom').value
			messageDraft: html.find('textarea.message-draft').value

			currentRoom: chatrooms[chatroom]

			currentRoom.activeUsers <: username

			// note: send() won't work properly because we need to capture the message on mouse click,
			//       instead of persistently binding it like we are doing here, otherwise the message
			//       stored on the server will keep changing
			
			send: =>
				currentRoom.conversation <: messageDraft

* notice something interesting
* most of the code is in the client
* the server just contains whatever data is shared across clients
* this just shows how much unnecessary boilerplate is in server code nowadays

* how would we add a database
* aka have persistent data across multiple server instances?
* could it somehow automatic know what needs to be saved?
* maybe declare server as "persistent", so it doesn't treat every server instance as a new object
* if you close server and re-open, it will be treated as the same instance
* or maybe the database is a singleton?

### Eventlist vs Modifiers

there are two ways we can handle modifier calls

	// eventlist pattern
	for callArgs in modifier.calls:
		someCollector <: callArgs

	// modifier pattern
	modifier: args =>
		someCollector <: args

* benefit of modifiers: can accept multiple arguments, can return data (just like an API call)
	* eg you could define `playlist.addTrack(track, user)` that returns the track position in the playlist
* benefit of eventlists: can do "holistic" data ops, like filtering
	* eg `for x in modifier.calls.with(index % 2 = 0)` will only run on even-numbered calls

* you could use insertion instead of calling for modifiers
* eg `modifierCalls <: callArgs`, and then use eventlist pattern on `modifierCalls`
* but modifiers is nice because you clone this template
* insertion is nice because it creates an eventlist style, which is extremely encapsulated

if you wanted to only run the modifier for certain arguments, you would have to do:

	// eventlist pattern
	for callArgs in modifier.calls.filter(condition):
		someCollector <: callArgs

	// modifier pattern
	modifier: args =>
		if (condition)
			someCollector <: args

* notice that eventlist pattern uses `filter`, while modifier pattern uses an if-statement
* filter seems much cleaner, as if-statements make the entire modifier body one level deeper

* eventlists make it easy to see all the data going in, and forces you to explicitly specify all data going out
* modifiers abstract it away, making it difficult to see how many times a module is cloned, and how much data is sent out in total

* cloning/calling is traditionally thought of as a way to retrieve info
* but here we use it as a way to insert and retrieve info

* maybe what can help is if you can retrieve all clones/calls to a certain module
* after all you can do it explicitly with a simple insertion done from inside the module to an external variable, `someFnCalls`
* but maybe it should automatically be done by default?

### Combiners - Generalizing Cloning

* reading is arrows going out
* insertion is arrows going in
* what is cloning? it feels like an arrow going out, but there are also arguments passed in
* it's a combination of the arguments object, and the source object
* it creates new behavior based on a combination of the source obj and arguments obj
* kinda like fusion, or ancestry

* in fact, what if this combine operation was unordered, symmetric

* veggero talked about something similar, with his reduced `self` syntax
* but his was one-way, asymmetric, pretty much the same way I treat cloning
* where the arguments "overrides" the source

* but there are some implications of unordered
* first, notice how you can have the arguments dependent on the source

		source:
			a: b + 10
		clone: source
			c: this.a * 2

* notice that we have to do `this.a`, because if we just had `a`, it would refer to a variable in the scope of `clone`, and not a property of the result object

* also, another implication of unordered combining
* is that, while the clone operation obviously gives the cloner/caller a reference to the result object
* the source should also receive a reference to the result object
* and maybe this is actually what makes insertion possible

* instead of thinking that modifiers is a result of insertion being possible
* we should think that insertion is a result of the way cloning works
* we can implement insertion in terms of cloning, kinda like a `insert` function

* reading (aka property access) can also be implemented using cloning
* after all, functional languages don't have property access
* you could simply create a `accessProperty(propertyName)` function

* reading and writing both derive from cloning
* everything comes back to "cloning"

* it's almost like reproduction, where DNA from the two parents combine and fuse into a zygote
* and you get a whole chain of these combinations, mixing and matching and fusing in every which way, and end up with a diverse world of flora and fauna

* it does seem like somebody needs to "initiate" the clone, the reproduction process...

* I think the key thing to realize is that, the mechanism by which cloning works, could change
* we could change whether or not it is symmetric, or how property collisions between source and argument are handled, or how to handle undefined inputs, etc
* but the invariants are:
	* the result is dependent on both sides
	* the result is given to both sides

* well actually, it doesn't necessarily have to be given to both sides, in functional it is only given to the caller side
* functional flows "one-way", all functions have an input and an output, and data flows from input to output only

* my language is bidirectional, every object is independent, and can send and receive data from other objects, and can have feedback

* to generalize all functional-like languages, you simply need:
	1. a program format (a way to specify behavior)
	2. combiner (a process by which behaviors combine)

* functional langs have functions and calling
* my language has objects and cloning
* veggero's theoretical language (mentioned in the chat) has objects and merging

* it seems like the behavior part of the program also has to define an output of some sort
* in functional, functions have an output
* my language has property access
* and veggero's theoretical language has a `self` output


* note that one way we could have "symmetric combining"
* is if we combined the properties from both sides (source & arguments) such that:
	* if the property is only defined on one side, then take that side
	* otherwise, the combined property is `overdefined`
* notice that this definition is symmetric, so you can invert the order, and call `argumentsObject(sourceObject)` and it would have the same result

### Implementing Insertion using Cloning and the `.clones` property

* notice that we can implement insertion using cloning
* just define a simple `insert()` function and retrieve its calls/clones, `insert.clones`
* notice that we can also implement this `.clones` property using insertion
* anytime you want to reference `.clones`, just modify the module/function to insert to a `someFnClones` property
* so should we have both?
* note that both `items` and `.clones` have to be special, only accessible internally
* maybe we can use `_items` and `._clones` to specify that they are special and "internal"


* you can use `this` to specify behavior that changes with each clone
* you can do this with any property actually?
* so three ways to use a variable: `#var` for private, `var` for public, `this.var` for protected?

### Argument Objects and Templates - Complications

* the difference between functional calling, and Axis cloning, is that in functional, you can only pass in data
* but in my cloning/combining, you can pass in behavior
* which makes it more symmetric
* this also shows that it's important that the argument object is cloned as well
* or rather, that the clone result is a combination of the source and argument object, and does not modify either of them

* does this mean argument objects are by default, templates?
* for example, if we did something like:

		someCollector: collector
		foo: bar(10, 20, someCollector <: this.val)

* then it might seem like `someCollector` gets two insertions,
* one from the declaration of the argument object, and one from the result object
* not to mention, if you had something like this, `foo: bar(baz(zed(someModifier)))`, then the modifier would be cloned 3 times!

* the way something like this is usually handled in an imperative lang
* is the function passed in might be modified by a chain of other functions, like in the example above
* but the function is only "called" at the end

* and we can kinda do the same thing here
* something like `foo: bar.(baz(zed(=> (... modifier functions ...))))`
* but what if the argument passed in isn't a function, but an object
* a modifier object


* so maybe we should make the user explicitly specify that it is a template
* that way, they are forced to think about when to "call" or execute the template
* using the call operator


actually, we already covered a lot of this, in the sections "Arguments Object Cloned during Cloning" and "Functions As Templates"


* however, notice that if you did something like `foo: bar(baz(zed(=> (... modifier functions ...))))`
* note how we are using `=>` to create a template
* assume `bar` `baz` and `zed` are transformation functions that just add properties to the input
* eg `zed: (someProp: this.someOtherProp + 1)`
* this won't work here, because for example, `zed(=> (someOtherProp: 4))` would turn into

		someProp: this.someOtherProp + 1
		=>
			someOtherProp: 4

* the transformations are acting on the empty template body
* when the main behavior of the template is in the output, the return property

* so in order for this to work correctly you'd have to do `foo: bar(baz(zed((... modifier functions ...) => this)))`
* but the programmer would have to remember to do this every time
* and it does not feel natural or intuitive

* actually the you don't need to do anything special, using `=> (... modifier functions ...)` works fine
* as long as you make use of implicit inputs
* or you can specify them explicitly, eg `a b => (someCollector <: a+b)` 

* though, there are cases where `<template body> => this` works better than `=> <template body>`,
	* eg when the body has references to `this`

* so we should make the `template` keyword stand for `(... => this)`, not `(=> ...)`
* note that the `template` keyword is for when you want the call operator to simply return a "executed" version of the object
* whereas you would use functions if you want to specify a `_return` value to extract after execution


* notice that something like `foo: bar(baz(zed(=> (... modifier functions ...))))`
* and then called `foo` at the end, `result: foo.()`
* where a function is passed in, modified multiple times, and then called at the end
* is basically builder pattern...


* it does seem like insertion adds quite a bit of complexity and ugliness
* because we introduce side effects
* which are always more mental overhead to worry about

### why do combiners need an initiator?

* it doesn't seem like it should be asymmetric
* or that there should be an initiator
* why can't both "parents" (the source obj and arguments obj) be treated equally?
* after all, imagine two balls colliding
* there is no "initiator" ball, both balls initiate the collision
* or rather, neither ball initiates, it is the forces of the universe that caused their collision

* however, there is an initiator, because "combining" is a behavior, that has to be part of a module/program
* the initiator is neither the argument object nor the source object
* it is the module that wanted to combine the two
* eg:

		initiator: arg1, arg2, someSource, someArgObj, arg5 >>
			...
			result: combiner(someSource, someArgObj)
			...

* notice that I used `combiner` instead of cloning/calling syntax to emphasize the symmetry between the source and arguments
* and how they are interchangeable

### Insertion and Side Effects

* whats the alternative to modifiers
* external "query"

		myFlag: "raise this flag to specify an input"
		someQuery: queryScope.find(flag = myFlag)

		output: someQuery.map(item >> foo: item.input * 2) // notice that we don't need to use functions or templates here

		queryScope:
			...
			(flag: myFlag, input: 10)
			...


* once you specify a default output (aka insertions), you have to worry about undefined input
* with mapreduce you define an input and output at the same time

* templates are the same but you basically specify that inputs come from calls, not clones
* that way you can modify the behavior using cloning, without actually sending in any inputs
* it is just another way of specifying where inputs come from and where outputs go

* perhaps we can specify a better way for defining APIs and modifiers


* pass-by-value: dataflow, functional, stateless
* pass-by-reference: imperative, stateful


* in a pass-by-value model, when you retrieve a property, and you clone it, it doesn't modify any other module, even it's parent module
* it is completely isolated, and "combining" it with an arguments object results in a new object, no side-effects

* in a pass-by-reference model, cloning a module can alter the behavior of other modules
* in fact, modules use this mechanism as a way to expose "modifiers", structured ways to modify another modules
* it allows other modules to be "aware" of when another module is cloned
* also note that insertion implies modifiers, because once you have some program A that uses insertion, then you can clone program A
* program A becomes a modifier

* side-effects breaks encapsulation


* feedback implies stateful?
* what about queries? why are those "pass-by-value"? even though
* whats the difference between insertion and queries?
* insertion is duplicated through cloning, query is duplicated through pointers

### Cloning Does Not Imply Insertion

(continued from section "Combiners - Generalizing Cloning")

* earlier when we said cloning should be symmetric and "bidirectional"
* is that the result of the clone/combiner has to be "given to both sides"
	* see section "Combiners - Generalizing Cloning"
* and thus, we should provide a `._clones` property for every function
* however, that is incorrect
* we were thinking about it wrong
* we were thinking in terms of, there is a person who provides a function, and the person that calls the function
* eg:

		Deck:
			addCard: ...
		foo:
			bar: Deck.addCard(10)

* in this case, `Deck` would be the one providing the function, and `foo` would be the one calling it
* but that is wrong
* remember that scoping is an approximation
* so `Deck` and `addCard` are actually completely separate objects
* there is no reason why the usage of `addCard` should affect `Deck`
* `Deck` just happens to have a pointer to `addCard`, that's all

* in addition, `foo` is a separate from `bar`, `foo` just happens to have a pointer to `bar`,
	* and a pointer to the result of the clone operation
* `Deck.addCard(10)` can be thought of as simply `combiner(addCard, 10) => result`
* `Deck` doesn't need to be notified
* and `foo` doesn't need to be notified either
* if we did something like `bar: ignoreEverything(Deck.addCard(10))` then the result of the combiner is ignored,
	* so `foo` is unaffected and unaware that the cloning even took place

* another way to think about it is
* let's say `Bob` has a friend `Alice`, `Bob.friend = Alice`
* now `Alice` wants to exchange info with `Carol`, aka `combiner(Alice, Carol)`
* there is no reason why `Bob` should be notified

* so **cloning does not imply insertion...**

### Insertion and Side Effects II

(continued from "Cloning Does Not Imply Insertion")

* in the previous section "Cloning Does Not Imply Insertion", we talked about an example where,
* if `Alice` and `Carol` want to exchange info, there is no reason why `Bob` should be notified
* however, insertion would allow for this behavior, for `Bob` to be notified
* to use another example,
* it would be like, if `Alice` created a device `droney`
* and anytime `droney` exchanged information with another person, `Alice` was notified
* even if `droney` tried to meet up with the other person in some secret dark alley, `Alice` would still be notified


* this sort of makes sense because what if `droney` depends on some private behavior of `Alice`?
* well with functional, pass-by-value style, that private behavior is independent, and won't affect `Alice` no matter how many times it is used
* of course `Alice` can define the private behavior to not do anything useful when cloned with different inputs
* but `Alice` won't be aware of how many times it is cloned

* in functional style, if you want to make changes to another object, you have to raise flags, make requests "explicitly available" to that object
* aka have public properties exposing the requests you are making
* and ensure that the other object has access to you
* in a hierarchal model, that would be like ensuring that all your ancestors propagate your flag

* this can be complicated to keep track of though
* as shown in the `ignoreEverything` example earlier, it's possible for a caller to not even "see" the result of the call
* with imperative style, you can be guaranteed that the request was received

### Central Server Model

* a way to think of imperative style in terms of functional style is,
* there is a central server that can see every object that is created
* and every object that is created, can see that central server
* its a "central axis", one can say :P
* in a sense, the "combiner" is designed to fulfill these requirements
* an object can create a request to a "callee" (an encrypted property, encrypted with the public key of the callee)
* and the callee would be able to see it, decrypt it, and receive the request

* perhaps this central server is the one that resolves urls too
* like if you do `foo.bar`, it retrieves the address from it, and then gives it to the central server,
	* which gives back the object at that address

* though this feels very centralized

### Problems with Scoped Insertion

* maybe we should go back to the scoped insertion model
* that would be functional, but still allow for constructs like

		sum: collector(+)
		for num in nums:
			sum <: num

* or actually, would it?
* recall that for-loops are just shorthand for `list.forEach(item => ...)`
* so what about something like

		sum: collector(+)
		someFunction( =>
			sum <: num
		)

* how do we know what `someFunction` does? how do we get information back from it?
* how do we know how many times it clones the body?


* note that we have a similar problem with state variables and versioning
* originally we thought that versioning could be simply converted to mapreduces
	* // TODO: FIND REFERENCED SECTION
* however, what if we had `foo: someFunction(=> stateVar := stateVar + 1)`
* again, we aren't guaranteed that `someFunction` will make all its usages of the input function visible to `foo`

### Side Effects vs Firewalls

* on one hand, imperative style makes it easy to send data to other objects
* on the other hand, it prevents objects from controlling data being sent out (hard to maintain privacy)
* if we compare it to the real world
* on one hand, if you have the url of any server, you can send information to it
	* because the DNS network is sort of like the central server mentioned earlier, able to receive requests from anybody and send requests to anybody
* on the other hand, your firewall can prevent data from leaving


* note that even in imperative style we can sort of create a "firewall"
* by manually copying all inputs and objects referenced by the internal body, and discarding any behavior that sends data out

* stuff like for-loops and such wouldn't be affected, because they are "pure public", so manual copies result in identical behavior

* likewise, in functional style, we can sort of have insertion
* by manually copying functions and manually converting insertions into propagated flags
* again, this would work for stuff like for-loops because they are "pure public"

* pure public functions are easy to work with, because they can be manually copied and modified
* in fact, if everything were public, then flag-watcher would always work, because every object is reachable from every other object
* it gets messy once we start involving private behavior
* because that is when you could have an insertion that isn't visible to the caller
* so in that case, should it work (imperative style)? or should it fail (functional style)?

* the real life analog being, say, `droney` and `Bob` interacting in Bob's private, secret house
* should `droney` be able to privately send data back to `Alice`
* or should `Bob` be able to privately interact with `droney`, and block any outgoing data?

### Firewalls and Offline Programs

* a common use case to think about is
* if you buy and download a game
* it might have tons of private behavior that you can't decrypt
* but it should still be able to run locally, offline, without sending any data to the internet
* obviously it's up to the company to write the code for the game such that it doesn't depend on external requests
* but if they didn't make the game playable "offline", users would complain
* so our language should allow the company to create programs with private behavior,
* while still allowing the user to firewall such a program and block all outgoing requests

* how does a firewall block requests from programs without necessarily knowing their behavior?
* it's not like the computer can decompile the program and figure out exactly what it's doing
* so how come it can block requests?

* because there is a standard protocol that all requests have to follow
	* DNS, HTTP, etc
* and the computer can block the protocol

* we can perhaps do a similar thing
* insertion is a protocol that can be blocked?

### Collectors And Callback Style

* when creating collectors, instead of referencing the special property `#items`
* just use functional style: `foo: collector(items => ...)`
* and the `collector` function will input the inserted items into the function you pass it
* follows the same functional pattern as `foreach()` and `map`, etc

* why does this work so well?
* insertion is special behavior, and doesn't follow functional principles
* perhaps this is a clue to how we can implement insertion in functional style?
	* or maybe the central server model is functional style?

### Collectors and Insertion Diagram Syntax Revisited

* in diagram syntax, when I first introduced the notion of collectors
* I did it kind of implicitly
* I would have the for-each module
* and inside the module i would "send" values to an outside variable
* but how do we know that those values can even reach that variable?
* it's really up to how the for-each function is implemented
* this was mentioned earlier in section "Cloning Does Not Imply Insertion"

### Firewalls and Minimal Scope

* you should be able to take an arbitrary bit of code and say "work independently and locally"
* so eg, the test scores example has a minimal scope
	* test scores example from section "Imperative vs Entangle - Multi-Pass Algorithms and the Test Scores Example"
* by minimal scope, I mean that there exists a scope from which no insertions leave that scope
* in the test scores example, the scope would need to contain the example, the `for ... in ...` function, and the `+` operator
* the `Deck.addcard()` example also has a minimal scope, the scope being `Deck`

* so perhaps how a firewall could work
* you have to fence out a boundary, scope
* and if any insertions or clones ever try to leave
* they fail, and the boundary indicates that it is in error state

* can this be done with proxies?
* instead of manually copying all inputs, we proxy all inputs
* so if there is a reference to an external var `foo`, we create a proxy `fooProxy`
* and if you reference `foo.bar`, then the property access request goes through `fooProxy`,
	* which proxies `bar` as well, creating a `barProxy` and returning it
* and if you ever try to clone or insert into any of these external variables, it has to go through the proxy,
	* who will simply block the request


* what we basically need to do is ensure that we can get a "local copy" of a module, that does not send any requests out when we input our private data into it
* obviously to create the copy of the module it needs to send a bunch of requests everywhere
* but after the copy is provided to us, when we give it our private data, it shouldn't send any more requests

* note that core language functions, like `map()` and `foreach()` and for loops, can be included in this "firewalled scope"
* after all, they are pure public functions, so they won't be sending any requests out anyways

### Firewalled Scopes and Custom Combiners

* maybe what a firewalled scope does, is override the combiner/clone function
* and sets a custom "central server" or "central axis"
* so clone operations can send requests to other objects inside this firewalled scope
* but the requests can never leave the firewall
* almost as if all objects in this firewalled scope are in a local address space

* this seems to work for the `Deck.addCard` example
* as in, you could define the `Deck` module with a modifier `addCard` with private behavior that inserts into `Deck.cards`
* but since all behavior is localize to the `Deck` module, you could create a firewalled module,
* and use your local copy of `Deck` freely without worrying about outgoing requests

* note that if the custom clone function clones any behavior that creates some clones of its own
* then it recursively calls the custom clone function again
* this ensures that all cloning is restricted to the local scope, and no requests can leave the scope

* from the outside, the firewalled module looks just like a regular module
* it just looks like a functional style module, one that doesn't make any insertions to external vars

* i wonder if this has any relation to virtual properties
* virtual properties create a sort of central server, a "tag scope" that collects all references to it
* in fact, it seems like virtual properties uses insertion anyways
* `foo <: #virtualTag: 10` turns into `#virtualTag.put(foo, 10)`

* note that this custom cloner has to be able to see private behavior in order to copy it
* so how do we ensure that the cloner itself doesn't violate privacy?
* maybe it's up to the module to use the cloner to clone itself
* indepedent compilation
* and if the module decides to ignore the custom cloner, and use the global central server
* then it won't be in the same local address space as the other objects, and it won't be able to see the other objects

* how does "indepedent compilation" work in terms of combiners, not cloners?


* while this seems to work, this still feels a little too low-level
* you shouldn't have to override or customize the clone function


* are people allowed to access/read nested objects of a firewalled scope?
* eg, if we firewall `foo: (bar: (zed: (...)))`, would we be able to access `foo.bar.zed`?
* conventionally it seems like no
* but technically this doesn't involve any insertions, it's not like `zed` is actually inserting any data to external vars
* but it still is sending data out
* so it seems like firewalls isn't just about localizing insertions?

* well since the firewall is like a proxy, and controls all access to `foo`
* if you access `foo.bar.zed`, you have to go through `foo.bar` first, and to do that you have to go through `foo` first
* so it's really up to `foo` whether or not to allow that access in the first place


* interestingly, it seems like reads/property-access can be implemented using functional style
* but doesn't seem to be the case for insertion/writes
* so it seems like insertion is a more fundamental language mechanic than property access?!

### Insertion as a Virtual Property

* insertion is like a default virtual property
* it is like if you declared a virtual property `#insert` at global scope
* and then in order to insert you did `foo <: #insert: 10`
* this sort of explains the "central server" model, because it's just like how for virtual tags you have to declare a tag scope

* I guess it makes sense then why I should use the `<:` syntax for both insertion and virtual properties
* although originally it was just out of convenience

* perhaps you can leverage this to create a firewalled scope
* just override `var #insert: virtual ()`, in your scope
* and it will override all insertions to use your new tag scope

* note that there is one minor difference between `#insert` and other virtual properties
* is that you can insert multiple times into `#insert`, but you can only define virtual properties once
	* eg you can't do `foo <: #tag: 10, foo <: #tag: 20`

* also note that virtual properties are implemented using insertion
* after all the syntax `obj <: #tag: val` are just shorthand for `#tag.put(obj, val)`
* and `put()` and other modifier functions are implemented using insertion
* so the connection between virtual props and insertion doesn't tell us anything about the connections between insertion and functional

note: this actually doesn't work, as mentioned in the later section "Insertion Blocking"

### Imperative Style and Global State

* at its core it seems like insertion is dependent on a global awareness of some central entity
* overriding the combiner works because everybody uses the same combiner

* whereas in functional, everything is independent and local, `combiner(a, b) => res`
* mothing it modified, it just creates a new object and returns it to the caller
* which is what makes it so perfect for distributed systems


* note that imperative code can be thought of as functional code applied to a global state variable,

		execute(instruction, state) => next state, next instruction

* so this is perhaps the main difference between imperative and functional
* imperative code has a global state, functional code doesn't

* note that insertions can be executed in a "distributed" manner
* as in, if you have the address of the recipient, you can just send data to them directly, no need for a central mediator
* it's only with cloning that you need the central mediator

### Send and Receive Model?

* it isn't completely illogical for a module to want to track clones of itself
* after all, if the module has private behavior, then it should know when other people are using that private behavior with different inputs
* but why does it need to be aware?

* every combiner call notifies both sides to make copies of themselves, and then creates and returns the result
	* see section "Combiners - Generalizing Cloning"
* instead of a functional model, or imperative model, or turing machine model, perhaps we have a "send and receive" model
* eh but how does cloning work with "send and recieve"
* a module still has to be able to duplicate behavior

* interestingly, in functional, the combiner has to be able to read private behavior
* which can be cause for privacy concerns
* in send and receive model, the module creates a clone itself

* in functional, when you call a function, it does two things:
	1. executes all nested calls
	2. wires together the results and inputs of all these calls in the structure that the function dictates

* if you want to personally approve all usages of your function
* how would you do that?
* you need to be aware of all clones


* eg, take the chatroom example from earlier (section "Chatroom Example - Full Stack Web Applications")
* it uses insertion to keep count of which users are connected to each chatroom
* every clone of the `client`, with a given username, sends the info to the server

* we can think of a similar example where the server just keeps track of how many users are connected
* a counter that is incremented for every clone of the client
* in that case, even if the user doesn't provide a username, we would want to increment the counter
* and we wouldn't want the user to be able to "block" the insertion too

### Chatroom Example - Databases and Automatic Caching

* back when we introduced versioning,
* we talked about automatic caching in the section "Optimizers"
* where it would automatically reconfigure eventlist code to use state variables and caching, to save memory

* we can use a similar concept for databases and servers
* your server should reference another module `myhistoryfile` that stores chat history
* when you run the server, you would be like `server(myhistoryfile.axis)`
* when you declare a file, it automatically stores things statically in memory, instead of as a dynamic object (as most program objects are)
* and when you declare "myhistoryfile.axis" you would be like `myhistoryfile: database()`
* and that would automatically add checks to make sure the data you're inserting is serializable

* difference between database server and client is alot of implementation
* database is basically, "i want my clients to be persistent"
* note that in the put-get cycle, you can save any of the nodes in between, and it will work
* if data B depends on data A, then you only need to save data A
* and in a cycle/feedback loop, that means you only need to save one

* the internet should not be thought of as segregated into databases, and servers, and clients
* it's just a giant distributed dynamic dataset

### Can Downloaded Code Contain Private Behavior?

* can templates have private behavior?
* should templates have private behavior?
* i guess that would be like having compiled code, or scrambled code, obfuscated code
* but is it possible to write completely self-contained code that cannot be decompiled?
* yes, because figuring out if two programs do the same thing is Undecidable

### in Imperative, the Call Itself is an Argument

* note that my modules can be called with zero arguments
* unlike functional, that uses a "binary" two argument combiner that functional uses
	* like `combiner(function, argument) => result`
* my combiner combines anywhere from 0 to many objects
* well but you still have to pass args in...
* the reason you can pass in zero arguments is because the call itself is an argument
* every call comes from a unique caller location

* in imperative, it's the current state (instruction+memory) that is the argument
* however in Axis there is no "state", it is timeless
* it is just the caller location, the caller existence, that initiates the call, and serves as the argument

### Using Insertion Instead of Caller Result

* one major difference to note is that
* with functional, if you pass a function as argument `fn1(fn2)`, then it will simply pass a reference to that function
* but in Axis, `callee(arguments)`, it will clone the arguments object (as well as the callee)
* so if there are any insertions specified in the arguments object, they will automatically be called
* though I guess, that is simply because we allow such complex behavior to be specified in the arguments
* as in, if we wanted to defer execution of the arguments object, we could simply wrap it in an object, and now it looks (and acts) like functional
* `arg1: (...some behavior...), callee(arg1, arg2, ...)`
* now `arg1` is just passed as a reference, no automatic cloning
* but in Axis you are allowed to also use the arguments as an object itself
* eg: `callee(a: 10, b: a+2)`
* because Axis is prototypal, it allows dynamic behavior like this even in the arguments
* however, as explained above, you have to be careful, as the arguments object is cloned

* notice that you can do something like

		caller:
			result: collect_one() // output the first insertion
			callee(arg1, arg2, arg3, result <: this)

* and this is effectively the same as `result: callee(arg1, arg2, arg3)`
* thus, we don't need to return the result of the combiner to the caller anymore
* we can use insertion to achieve the same behavior!
* so while in functional it is required for the combiner to return a result
* in Axis, it is only required to notify and copy the callee and the arguments object


### Implementing Hashmaps and Property Insertion

hashmaps
* I just realized that there is no way to create hashmaps using insertions
* because we don't allow inserting properties anymore
* even with a `put` modifier, it won't work:

		hashmap:
			put: key, val >>
				// how would you define properties inside "hashmap", now that you are in the scope of "put"?

* even if you tried to use insertion

		hashmap:
			keyvals: collector()
			put: k, v >>
				keyvals <: (key: k, val: v)

			for (key, val) in keyvals:
				// how would you define properties inside "hashmap", now that you are in the scope of "for"?

* in addition, note that we originally didn't want to allow property insertions
* because it would make it way too easy to cause collisions
* because if you cloned any module that did a property insertion, it would automatically cause a collision
	* mentioned in section "Insertion Restrictions"
* but note that we would have the same problem with calls to `put(key,val)` or insertions of `(key: k, val: v)`
* if you cloned any module that did a `put(key,val)` call, it would automatically cause a collision

* even virtual properties/tags have this problem
	* naturally, because virtual properties are implemented using hashmaps, and object-key inversion
* if you had a module like `tagit: (for x in nums (x <: #tag: x*x))`, and then you cloned `tagit`, you would overdefine `#tag` for all `x` in `nums`

* maybe one could use timestampes to prevent collisions
* you would define the hashmap such that it takes the properties with the most recent timestamp
* this is something that the insertion method could account for, but direct property insertion like `obj <: prop: val` would not have this flexibility

* though we still need to figure out how to implement property insertion using insertion
* maybe you can do property insertion if you are in declaration scope?

### Implementing Hashmaps and Property Insertion - Dynamic Properties

* I guess you can implement it using

		hashmap:
			keyvals: collector()
			put: k, v >>
				keyvals <: (key: k, val: v)

			[key]: keyvals.find(=> item.key = key)[['val']]

* this makes sense, because you have a dynamic number of properties, so you have to use dynamic properties



### Dynamic Arguments Object - Functional vs Axis

* actually, functional doesn't have merging
* unlike my language
* because in functional, you don't define behavior inside the arguments object
	* you can send functions as args, but they are templates, they aren't run until the caller explicitly calls them
* but in Axis, the arguments object is "live", and can contain live behavior
* all functional does is copy the function, and assign inputs

### Formal Model for Combiners

* you can't model Axis in functional, because insertion requires some sort of "global awareness"
* you can think of it as

		combiner(caller, arguments, allObjects) => result

* basically, the combiner needs to look for insertions from all objects, and give them to the spawned object
* it is kinda like a global flag-watcher model
* any insertions raise an (encrypted) flag, that the combiner will see, and give to the result


* this might look like imperative, `execute(state) => next state`
* however, imperative is ordered and time based
* doesn't really capture the distributed timeless feedback behaviors in Axis

* notice that in imperative, it is synchronous, only one `execute` command happens at a time
* whereas in my language, all `combiner` calls work continuously and in parallel

* Axis is different from functional in that it has a sense of global, centralized data (insertions)
* but it is different from imperative in that the system can be distributed, combiners work independently


* though I guess you could consider the imperative model, `execute(state) => next state`, to be "distributed" as well
* if instead you did it like `execute(fn, args, state) => next state`, and you tracked all variable assignments done by the function
* then `state` contains all variables, and `next state` contains all variable assignments
* then you could distribute it in a dataflow graph, where each function listens for updates from its input vars, and makes assignments to its output vars
* though it has to be synchronous and time-ordered, which Axis does not need

### Combining Multiple Objects and Builder Pattern

* recall that the combiner usually only has two objects, `combiner(source, arguments)`
* if you want to combine multiple objects, eg `combiner(source1, source2, source3 ...)`
* you can't just do `source1(source2(source3(...)))` because notice how that will cause multiple insertions for deeply nested objects that will get cloned many times
* instead, you have to make the innermost object a template, and the outmost clone a "call"
* eg `source1.(source2(source3(...template(sourceK)...)))`
* this is basically builder pattern
* this is similar to what we were talking about in "Argument Objects and Templates - Complications"

### Symchronization and Insertion?

* synchronization and insertion
* how do you know when it is "finished"
* you don't know if somebody out there will end up inserting
* though I guess, if you think of "collectors" as web servers
* they always have to be forward evaluated and constantly listening for inputs

### Combiners, Insertion and Privacy

* in the section "Formal Model for Combiners", we use the model

		combiner(caller, arguments, allObjects) => result

* however, notice that means that the combiner has to see all objects,
	* regardless of whether those objects are private or not

* though it really only needs to see insertions, so maybe it is more like

		combiner(caller, arguments, allInsertions) => result + insertions

* we can think of it like a communal chest
* anybody can go in and drop something off
* if they have access to it at least (eg like a private var)
* now imagine the chest has a security camera
* we can think of the chest as "able to see everybody"
* and if you put it that way, it might sound like a privacy concern
* but that is the wrong way to think about it
* the chest can see anybody that wants to be seen, aka that wants to drop something off

* insertion means that we don't know where an input might be coming from

* but what if we do know? what if we only allow club members to drop things off at the chest
* so we basically can statically bind the chest input to each club member,
	* so the chest is constantly "watching" the club members, and the club members alone

* well then, using a for-loop or a foreach() to insert to the chest object
* is like a club member, sending a helper elf to drop things off for them
* problem is the chest is only watching club members, so it wouldn't see the stuff dropped off by the helper
* which is why the chest needs to be able to see everybody
* so that the chest will accept drop offs from anybody

* in functional, we would use a map-reduce instead of a for-loop
* the map function returns the data back to the caller, instead of inserting directly to the collector
* this would be like the helper elf collecting the items to drop off and putting them in a bag
* but the club member still has to drop off the bag himself


* another way of thinking about insertion is automatic propagation

* every function call create a tree of nested sub-calls
* each of those sub-calls may contain an insertion
* that insertion has to be carried up this tree of function calls, up to the root
* and also from the root to the collector


* all it really needs to do is send that a clone occured

### Callee-Handled Insertion vs Caller-Handled Insertion

take the example

	collector
	...
	modifier:
		collector <: someval
	...
	caller:
		result: modifier()

there is actually 2 main ways we can implement the insertion mechanism

**Callee-Handled Insertion**

* in this method, we think of the insertion as an action performed by the modifier, the callee
* it is not a behavior carried in the clones
* rather, it is just a duty performed by the modifier every time it is notified of a clone

* the mechanism has two parts
	1. the modifier has to be notified of any clones/calls
	2. modifier (and all intermediates) has to propagate the insertion to the collector

* in functional, neither of these happen
* the modifier (or any function) does not need to be aware of any calls
* and there is no propagation of information from the modifier

* this is what we talked about "bi-directional communication"
* notifies the callee of any calls, and the callee registers the insertion

* if there were multiple "jumps", eg a function that calls a function that calls a modifier that performs an insertion
* the signal would need to propagate backwards along each of these jumps
* we talked about this in the section "Modifier Calls and Double Flag-Watcher System"

**Caller-Handled Insertion**

* other method is to think of the insertion as data propagated from the insertion clone to the collector

* this is basically the same as just a single propagation from the call result to collector

* because the caller always receives the result of the call, so it's up to the caller to propagate insertions in the result
	* and any intermediates between caller and collector have to propagate as well

* this is probably how I originally thought about it when I first came up with flag watcher
	* see section "Flag-Watcher Model"

* its also worth noting that the "central server" model, and the `combiner(caller, arguments, allInsertions) => result + insertions` model,
* are both based on caller-handled insertion




* 2nd method might seem cleaner and more elegant
	* views insertion as a cloned behavior, just like everything else defined in a module
* but the 1st method is actually more realistic
* in the real world, if you want to clone an object, you have to notify it
* which makes it impossible to prevent it from performing the insertions itself

* but if we're talking about realism
* somebody could also mimic cloning, by simply using a time-varying input
* so instead of doing `foo(1), foo(2), foo(3)`, they simply do `foo(x)` and have `x` change from `1` to `2` to `3`
	* and record the outputs while doing so
* this is only possible because the language is "persistent"
* in imperative, where function calls are instantaneous, you can't do this



* note that these "propagations" aren't related to scope
* because the tree of function calls is not the same as the hierarchal tree of scopes

* for example:

		foo:
			#bar:
				modifier:
					=> insertion_value: 10
			baz:
				=> ( #bar.modifier.() , #bar.modifier.() ) // does two insertions
		
		collector: (1 2 3).map(foo.baz).flatten()[['insertion_value']] // calls foo.baz for each item, and extracts insertion_value's

* note that we are using manual insertion, a functional-analog of insertion
* where the functions have to manually pass back values to the collector
* however notice that the collector isn't in the same scope as `modifier`
* but each function call still is able to pass back the insertion values

### Insertion Blocking

(continued from previous section "Callee-Handled Insertion vs Caller-Handled Insertion")


* in first method, calling a function and performing the insertion are bound together
* if you want private behavior from the function, you must perform the insertion
* or rather, if you are the source/callee module, you are guaranteed that every time you give out private behavior, you are notified, and can perform an insertion
* in second method, it is possible to clone the object, and then block the insertion


* one reason why 1st method is more realistic
* lets represent a web server as a module, with tons of private behavior
* lets say this web server computes a single function `fn`
* every time a user calls the function `fn`, the web server creates a clone of the function with the user-given inputs
* however, instead of giving the clone to the user, the web server keeps the clone locally, and only gives the user the output
* our language doesn't make any reservations about where data is stored
* so it makes sense that the server would want to keep the clone, and all its private behavior, locally
* if the user makes any changes to inputs, the update request would have to go to the server, update the clone, and then the server would give the updated output
* if somebody wants to clone the user's clone, then it also has to go through the root server
* so if the server module contains any insertions to external modules
* it is practically impossible to prevent them from happening without preventing the cloning as well

* if we take this to the extreme

* functional only allows you to create functions that don't change no matter how much they are called
* but that is not how the real world works
* you can have functions that throttle when too many calls are coming in at once

* my language should accurately represent what is achievable, because if it doesn't
* then people will just use other languages to achieve their purpose

* if insertion is realistically impossible to block, then we should not allow blocking insertion
* if it is possible to block, then we should make allow blocking insertion as part of the language


* right now you can interact with client-side web pages without sending any info back to the server
* which is nice
* you can do this because the page is loaded to your browser
* and then you can unplug the internet
* and still play around with functionality on the web page (as long as it is cached, and doesn't require external resources)

* however, what you're basically doing, is leveraging a separate interpreter
* the interpreter in your browser is not the same one as the one used by the server
* but in Axis, the entire web (servers + clients) is supposed to work as a unified system, with a single interpreter
* so while using a separate interpreter would allow you to block insertions
	* also mentioned earlier when talking about overriding the combiner
* it feels more like a hack, then a legitimate functionality we should have in our language
* but if it's possible, achievable, then perhaps we should have it in our language?


* overriding `#insert` doesn't work
	* a method we were experimenting with in the section "Insertion as a Virtual Property"
* first off, modeling insertion using the virtual tag #insert ignores the cases where we want private insertions
	* aka a module that performs an insertion that isn't visible publically
* this also explains why overriding `#insert` wouldn't work
* because if the insertion is private, then it wouldn't (and shouldn't) be overriden

* it seems like the only way to prevent insertion is to change the combiner
* aka change the interpreter itself

* but changing the interpreter doesn't always work
* remember that downloaded programs can still have private behavior
* and insertions can be hidden in private behavior
* so the interpreter can't always decompile the program and "extract" these insertions out

* even if you try to disconnect the internet
* what if that private behavior starts by calling a private server to ensure it has internet connection
* otherwise, if not, the private behavior breaks the entire program


* while it is possible to model everything in functional
* even insertion
* after all, functional is turing complete
* however, the key thing is that it isn't easy to represent insertion in functional
* just like it isn't easy to represent type systems in assembly, so nobody uses assembly for type systems
* insertion and modifiers are an intuitive way of thinking about the world
* and so it's something that should be intuitive in the language as well

* however, as shown, insertion cannot be prevented without preventing cloning as well
* because insertion can be hidden inside private behavior

### Firewalling ???

private behavior can contain insertions
so it's impossible to prevent insertions without preventing cloning as well
however, it should theoretically be possible to "firewall" a program and block all insertions and cloning

but syntactically, how would we do this?



what if I have a program, like youtube-dl that interacts with Youtube
retrieves my private playlists, so I have to give it my private password
but I don't want it to leak the password
it should be firewalled
the system `(Axis standard library + youtube-dl + youtube)` should be firewalled


### Setting the Arguments Object As A Template

what if you passed a template as the arg object
note that this is not the same as inputting as an argument, eg `foo(someTemplate)`
	* which we already commonly use, eg in the `addTrackToFavorites` example (// TODO: FIND REFERENCED SECTION)
the only way to explicitly set the arguments object is to either do something like

	foo(...someTemplate) // using spread operator

	foo.apply(someTemplate) // using apply()

so what should happen?
doesn't work, because you can't access properties of a template
so you can't read and copy over the behavior of a arguments object if it's a template

note: in the later section "Arguments as a Template", we conclude that the arguments object is by default a template
so this actually should work...right?

### Extending Templates

* what if you extend the template object, like `Client` in the chatroom example
* eg `Client: template(...)`
* so that when you define a `Client`, eg `foo: Client(...)`, it doesn't actually run any of the code passed in
* and waits for the browser to actually "call" the client object to create a "live" instance of the client

* this can be confusing, because how can you tell if the object your using is a template or not
* that would determine whether you want to make your input a template or not

* maybe you can only do combiner(object,object), and combiner(template,template)
* but not combiner(object,template) or combiner(template,object)
* but...this is getting too ugly and weird

* templates are starting to feel too "special", too distinct from objects
* almost like imperative objects vs functions
* in Axis, can we even model templates as an object?

### Templates and Deferring Evaluation

* maybe the way templates work is
* it first sets all scope variables to `undefined`, so all insertions and clones and references are inert
* however it also saves the scope
* when you "call" the template, it runs the template using the scope

* so in code, templates would be implemented like

		template:
			#scope: // somehow capture declaration scope
			_call: this(#scope)

* and likewise, calling a function would just extract the return value after: `_call: this(#scope)._return`
* or perhaps, calling is always `_call: this(#scope)._return`, because recall that templates use `=> this` (aka `_return: this`)
	* talked about in section "Argument Objects and Templates - Complications"

* I guess it doesn't even really need to capture the declaration scope
* the interpreter would just process all references made during the declaration of a new template
* and instead of actually resolving the references, it defers it until you actually "call" the template

* this means that templates are still objects
* and you can still override their properties and such
* just like normal objects

* I guess to generalize the "scope capturing" we can say that,
* templates are for deferring evaluation
* **but deferring evaluation is also a behavior itself**
* so this is why when you clone a template, it doesn't creates another template
* and in order to actually "run" the template you have to call it
* because cloning should replicate behavior
* and in the case of cloning templates, it should replicate the behavior of deferring evaluation

### why are templates so common with insertion?

* hmmm even in the chatroom `Client` example
* we need to declare the body as a template
* because otherwise we would have premature insertion

* it seems like the vast majority of cases where you have insertion
* you would want to declare a template...

* maybe we should force all insertions to be in the body of the `_return` or `=>` statement
* that way you are forced to declare a template every time you want to do insertions

* but why is insertion so closely intertwined with templates?
* perhaps it's because insertions are like default outputs
* but we don't have this problem with default inputs...

* why are templates so incompatible with prototypal style?

* well virtual properties use insertion, and they work well with prototypal style

* prototypal style:
* usually when somebody is defining some objects, they'll use variables and scopes and hierarchies to organize things
* to break the object into parts for better organization and legibility
* you can leverage that, and clone the object with different parameters, to suit your own needs


* if you are making something for yourself, use prototype
* if you are making something for others, use template


* well usually insertions are for other people...

### Arguments as a Template

* actually, the arguments object is a template
* note that there is a difference between `foo(x <: 10)` and `foo((x <: 10))`
* the latter is no different from `bar: (x <: 10), foo(bar)`
* whereas the former could not be reduced like such

* objects referenced in the arguments object may be live, eg `bar: (x <: 10), foo(bar)`
* but the arguments object itself, is not "live"
* remember that properties of the arguments object override properties of the source
* and those insertions are kinda like properties of the arguments object as well
* those insertions don't override anything, but they are put inside the result object

* when we declare insertions directly as an argument
* we are saying that we want those insertions to be part of the result
* and not that they should be active in the arguments object
* we are not "running" the insertion, we are using it to define the result

* I guess another way to think about it is, normally when you define an object, it goes

		definition => interpreter => result

* the same is true for cloning and overriding
* everything inside the arguments object is part of the definition
* the interpreter combines it with the source/callee, and then creates a result
* and the result is "live"

* but the result doesn't have to be live
* if the source is a template, then we would have something like

		someTemplate(someCollector <: someValue)

* notice that here, the result is a template, so this would result in zero insertions
* this is also what happens with the `Client` cloning in the Chatroom example

* perhaps another way of thinking about it is, the arguments are an embedded part of the result
* the combiner doesn't "clone the arguments object", as we thought in the section "Arguments Object Cloned during Cloning"
* it takes the definition of the arguments object, merges it with the source definition, and then runs the result

**the combiner merges definitions, not behaviors**

* and I guess you could consider the arguments object as a template
* means the same thing

* note that functional doesn't have to worry about whether or not to clone the arguments object
* because in functional, cloning extraneously doesn't have any side effects
* whereas in Axis, we have to be careful how many times we clone

### Clones and Calls Declared Inside the Arguments

* wait but if the arguments object isn't considered "live"
* and is considered a template
* then what about clones performed inside the arguments object?
* eg

		foo(x: bar(10))

* normally, even in imperative languages, we think of the arguments as "executed" first before being passed in
* I guess in Axis, these would not be executed until they are part of the result object
* so if the source is a template, these would not be run at all
* basically, **the arguments object does not execute cloning**

* so in imperative, where you might do something like

		console.log("user name: " + user.get("name"))

* and you would assume that `user.get("name")` is called first, then the value is passed to the string concatenator,
	then the string is passed to `console.log`
* but in Axis, this isn't the case
* if `console.log` were a template, then `user.get` would not be called at all
* it would actually act more like

		console.log(=> "user name: " + user.get("name"))

* I guess this is because in Axis, the stuff inside parenthesis `(...)` is for definitions
* whereas in imperative, the stuff inside is for values and expressions

* Axis parenthesis `(...)` actually acts more like imperative curly braces `{...}`

### Defining Behavior That Should be Duplicated

(continued from "Clones and Calls Declared Inside the Arguments")

* ultimately it comes down to
* when we declare or extend objects, we **define behavior that should be duplicated**

* so notice the difference between this:

		foo: bar(apiResult: playlist.addTrack('badBlood'))

* and this:

		temp: playlist.addTrack('badBlood')
		foo: bar(apiResult: temp)

* in the first example, calling `addTrack` is part of foo's behavior
* so cloning `foo` will call `addTrack` again
* in the second example, `addTrack` is called outside `foo`, and then the value is given to `foo`
* so cloning `foo` would not call `addTrack` again

* note that these two examples would be equivalent in imperative langs like javascript
* doesn't matter if you call inside or outside a function, it will always just pass the result value into the function
* but in Axis, it matters where you declare the behavior
* this is explored more in the later section, "Pass-By-Behavior"

### exploring a template-based language

* functional only has functions and calling
* originally we only had objects and cloning

* when we introduced insertion, we had to introduce templates
* so now we have objects and cloning, and templates and calling
* we can use calling to turn templates into objects,
* and extend templates (eg `template(...someObject)`) to turn objects into templates

* feels more complicated and ugly, but is it necessary?

* note that we could make Axis a template based language
* just make all declared objects default to templates
* and if you want to "execute" them you have to call them
* eg

		foo: (a: 10, b: 20)   // foo is a template
		bar: foo.()           // bar is a prototype

* so it seems like whether or not to make templates default, or prototypes default, is rather arbitrary

### Empty Parenthesis `()` As Call Operator

call operator syntax

* maybe we should use `()` as call operator
* so if you want to call a template with args, do `someTemplate(args)()`
* this works because cloning a template with no arguments is useless
* `()` with no arguments is like saying "use the call itself as an argument", which is kinda what calling is
	* see section "in Imperative, the Call Itself is an Argument"
* this is also nice because it shows that the arguments are passed in before the call
* the clone happens before the call

* how does it compare to the original syntax, `someTemplate.(args)`?
* what if we had a list of calls: `( fn.(1), fn.(2), fn.(3) )` vs `( fn(1)(), fn(2)(), fn(3)() )`


* note that cloning can sometimes use `()`, so it might get a lil confusing
* eg if you clone `someModifierPrototype()` it might look like you're calling it
* though there is still technically no ambiguity, because you would never do these empty clones for templates

* the syntax can get a little ugly in cases like this

		joe: Student("Joe", "Harvard", do console.log(this.greeting)())

* what if we used an arrow?

		joe: Student("Joe", "Harvard", do console.log(this.greeting)→)

* once you type `->` it will automatically shrink to `→`
* kinda like how `...foo` shrinks to `…foo`

### state vars and insertion

we can implement state variables using insertion:

	stateVar: state_var
	ordered modifier:
		stateVar := fn(someArgs, stateVar)

is equivalent to

	stateVar: collector(=> last)
	modifier: _timestamp >>
		stateVar[_timestamp]: fns(someArgs, stateVar.before(_timestamp))

maybe we can also use `orderBy` to specify what variable to determine order (in this case its `_timestamp`, which should be default)
or maybe `index` should be default, and events should by default set `index: _timestamp`

### neural nets, circuits, and scoped insertion  ??

neural nets don't need insertion
	each neuron is dependent on a static, specific set of other neurons
insertion is also hard to model using circuits
which is something we originally wanted
// TODO: FIND REFERENCED SECTION


perhaps scoped insertion, or firewalls, can help restrict the language enough
to allow for extreme optimizations like neural nets or circuits


### using bounds to restrict divergent feedback

normally in imperative code, if we have a loop that is running infinitely for some reason
we can easily add bounds, eg

	iterations = 0
	bounds = 1000
	while(someCondition && iterations < bounds) {
		...
		iterations++
	}

this makes it easy for us to inspect and debug the program
and to figure out why it's overflowing

how would we do this in Axis, for cases of divergent feedback?
for example, the test scores example
what if we designed it to be divergent
how would we "pause" it after a certain number runs, or updates?
"pausing" it, using behavior defined in Axis, would require the feedback to have an execution order
otherwise the state of the program after being "paused" would be non-deterministic

as in, if the program (with feedback) doesn't define an execution order
	which is often the case, it's up to the interpreter to determine how to propagate updates
then if we pause the program, we don't know what state it will be in
it's up to the way the interpreter is defined

so it seems like in order to "pause" the program, we have to work at the interpreter level
which is ugly and very low level


### Chatroom example revisited

// TODO FINISH THIS

	ChatroomServer: Server
		chatpage: Client
			html: HTML
				input(username)
				input(chatroom)
				button(fn: enterRoom) "Enter"
				div(class: 'conversation')
					for message in conversation:
						p message
				input(messageDraft)
				button(fn: enter) "Send Message"

			username: HTMLInput()
			chatroom: HTMLInput()
			messageDraft: HTMLInput()

			enterRoom:
				capture1: capture(username)
				capture2: capture(chatroom)
				=>

	ChatroomServer: Server

		url: 'www.chatrooms.com:5000'
		chatrooms: collector

		chatpage: Client
			route: '/'
			layout: pugLayout // using [pugjs](https://pugjs.org)			
				input.username
				input.chatroom

				div.conversations
					for msg in currentRoom.conversation.orderBy('_timestamp')->:
						p msg

				textarea.message-draft
				button(onclick = send)

			username: html.find('input.username')->.value
			chatroom: html.find('input.chatroom')->.value
			messageDraft: html.find('textarea.message-draft')->.value

			currentRoom: chatrooms[chatroom]

			currentRoom.activeUsers <: username

			send: _timestamp =>
				currentRoom.conversation <: messageDraft.capture(_timestamp)->



			username: var
			chatroom: var
			messageDraft: html.find('textarea.message-draft')->.value

			enterRoom: _timestamp =>
				username := html.find('input.username')->.value
				chatroom := html.find('input.chatroom')->.value

			currentRoom: chatrooms[chatroom]

			if (running)
				currentRoom.activeUsers <: username

			send: _timestamp =>
				currentRoom.conversation <: messageDraft.capture(_timestamp)->



### Data Persistence - Chatroom Example Revisited

(continued from the section "Chatroom Example - Databases and Automatic Caching")

* why do we even need separate concept of database?
* why not just store the whole server to a file
* from a data standpoint, the server is just shared data amongst clients
* so the database and server should be thought of as the same thing

* actually, there is a problem with the database example
* once you disconnect client, then the insertions disappear

* problem is, most of the time we have data dependent on data
* persistent as long as the source is still there
* but in this case, we want the source to be able to disappear, but the data to persist

* simple example: a program that records the number of times you click the mouse
* first, start with transient memory
	* new memory every program run
* this would just look like a normal axis program, we can write it in a single module
* then, what if we want persistent data?
	* persistent across multiple runs
* note that we could store all mouse clicks, or just store the output number, or store any of the data in between
* any of these methods could be used to create the illusion of a "persistent" program

### Data Persistence - Unpredictable Inputs

* we need to be dependent on persistent data, data outside the lifetime of the program
* that way if say, a client shuts down, the changes made by that client will still persist
* perhaps we need a persistent timeline of all events, history
* immutable as well
* mentioned in the sections "Timeless" and "Block chain timestamps" and "State Variables - Mechanics and Persistence"

* but that's not exactly it
* events can be predictable
* if we had initial conditions of universe, and all laws of physics
* we wouldn't need this "persistent timeline of events", we could predict them all

* simpler way to think about it
* right now we are dependent on human actions, we need to store them
* but if we were dependent on a robot's actions
* and we could predict those robots actions from existing data
* then we wouldn't need to store anything

* so I guess what it is is
* data that is independent and unpredictable from the program


* another way to think about it is perhaps
* bind the file data to human inputs/actions
* program is just intermediate


* input is events and data
* output is data and actions
* the order goes "user actions => program => file writes"

* but that's ugly
* low level
* we need to treat the filesystem and OS as if they were modules in Axis
* I guess this is what we were already doing when we did stuff like

		chatrooms: File(allchathistory.axis)
		Client:
			chatrooms[chatroomindex].conversation <: message

* the problem was that the messages disappear if the client disappears
* not that the `chatrooms` data is disappearing
* more that, the chatrooms data is dependent on the messages, so if the messages disappear, then so does the chatrooms data

* so I guess we need to "capture" the events,
* and decouple them from the client
* so the client can disappear but the events won't

### Data Persistence - Dependencies and Duplication

* imagine if we modeled the entire universe, including the OS and filesystem, in Axis
* now imagine we had a program, `foo`, that takes the contents of `fileA`,
	* transforms it, puts the result in `fileB`, and then displays `fileB`
* (note that this is similar to our chatroom example, which takes messages from client, stores it, then displays all messages)
* we want the displayed output of the program to persist across multiple runs of the program
* so we would want to "save" and store the contents of `fileB`, right?
* wrong, because if the program runs multiple times, every time it can generate the contents of `fileB` again from `fileA`
* we don't need to store anything from `fileB`, we can generate it every time
* it's unnecessary to store both the contents of `fileA` and `fileB`, we only need `fileA`
* and if we did store `fileB`, then when we run the program again, it transforms `fileA` again and adds it to `fileB`,
* and we end up with duplicated data

* though in the chatroom example, it is sort of like `fileA` is disappearing (the client and all its user inputs disappear)
* but we need to make sure not to store too much data
* or we may end up with duplicated data
* for example, imagine if on the server side we stored all the messages from the client
	* perhaps in a database file
* and on the client side, we stored all the inputs and events (mouseclicks, keypresses, etc)
	* perhaps in some sort of "persistent timeline", mentioned earlier
* then if we ran the client again, it would re-process all the previous user inputs from the timeline,
* and duplicate the data on the server

* a module should never store data if any of it's dependencies are storing data
* or if any of it's dependencies are "alive"
* so `fileB` should not store data if `fileA` is still alive
* if `fileA` gets deleted, then `fileB` should store data to act as if `fileA` was still alive
* I guess this is only if `fileB` wanted to treat `fileA` as still alive
* so I guess the condition is,
* `fileB` should store data if all it's dependencies (aka `fileA`) are guaranteed to be gone forever,
	* but it still wants to act as if they exist


* message is dependent on keypresses, `message: createMessage(keypresses)`
* all capture does is capture the message at a certain point,

		capture: timestamp, message => createMessage(keypresses.filter(keypress.timestamp < timestamp))

* so the "capture" function is just a function, that's it
* not relevant to the discussion about when to store and what to store

### Data Persistence - Garbage Collection

(continued from previous section, "Data Persistence - Dependencies and Duplication")

* closing a program and making data "disappear", is different from "switching away" from data
* lost data is different from data that isn't currently being observed
* for example, if we had something like

		foo: if (condition) ? fileA else fileB

* then if `condition` switches from `true` to `false`, `fileA` won't be observed anymore,
* but that doesn't mean we should start storing its data to make it seem "persistent"
* we will see `fileA` again if we simply switch `condition` back to `true`
* so it seems like closing a program is some sort of special behavior
* that guarantees we aren't going to see that data again
* and I guess in this case the data is user inputs

* user inputs that are registered by a client are lost forever once the client closes
* how do we model this "client closing" behavior in Axis?

* I guess what's more important is that when you "switch away" from an input,
* you are saying that you don't want to use that input anymore
* but when you close a program, you are saying that you still want to use the data
	from that program, even though its closed

* I guess you can think of it as super advanced garbage collection
* when the user closes the chat client, it means they don't want to see the chat conversation anymore
* but other users still have pointers/references to the messages that the user sent
* so that data can't be deleted or garbage collected, while the rest of the program can be
* you are closing the interface, the GUI, but you aren't trying to delete the data

* at the same time though, when you close a program, you are also saying "I don't want to be responsible for storing this data"
* so the low-level mechanism will switch to storing the data on the server, or some other user offering to store it
* however, note that where the data is being stored shouldn't matter
* in fact, often data should be stored in multiple places, just in case
* but the point is that we now know why that data should be kept alive in the first place

* programs are just transformations applied to user inputs
* so in the chatroom example, the user inputs are keypresses
* when you first open a chat client, only the chat client is listening and depending on your keypresses
* but when you send the message to the server, now the server (and other users signed into the same chat room)
	can see the result of those keypresses, and are dependent on them
* so when the user closes their chat client, those keypresses are still "kept alive" by the server and by other users

* this only works if the server is kept alive, when the client closes
* but what if we close the server?
* now nobody is listening to those past keypresses, those past user inputs
* so they would get garbage collected
* but we want them to persist across multiple server runs
* so we basically have to do the same thing between database+server that we did with server+client
* we store the `chatrooms` data on a file, which is persistent across multiple server runs
* we declare this file as a module, outside our server module, and have our server module insert chat data to it
* that way, if the server closes, the file module can see that future servers may still depend on the data
* so the file module won't delete the data

### Data Persistence - Triggered Events vs Latched States

* note that all this implies that closing a program, won't remove its insertions
* but that's not always true
* recall in the chatrooms example, we want each chatroom to store `activeUsers`
* that should depend on whether the client is open or not

* so I guess it depends on the type of user input
* keypresses are instantaneous events, so those don't depend on whether the client is open or closed
* `active` is a state, and _is_ dependent on whether the client is open or closed

* note that in this case, `active` is not just any state, is the client's state
* so obviously it would depend on whether the client is open or closed
* but what if we had a state input that was from outside the client
* or maybe `ClientBrowserStatus`, can be "active" or "idle"
* or maybe `ClientMicInput`, can be "built-in" or "external"
* should this be dependent on if the client is open or closed? seems like it

* what if you did want the client's insertions to disappear when the client closed
* how would that look different?

* latched inputs vs triggered inputs
	* latch vs D flip-flop

* perhaps it matters where the clone is initiated from
* if the client creates the clone, then it seems to make more sense that when the client closes,
	the clones get destroyed with it, and then the insertions would disappear
* but if the server creates the clone (triggered by some signal from the client),
	then even if the client sends a "close connection" signal, the server can choose to hold onto the insertions

* same can be said for api calls
* what if we had a program that added 3 tracks to our spotify playlist
* we run the program, and after the program finishes, we still want those tracks to stay in the playlist
* on the other hand, what if we had a toggle that "enables" the program
* when we toggle it off, we want the tracks to to disappear

### Program Runs as Triggered Events, Actions

* if you add the tracks based on you running the program,
	* then closing the program doesn't change the fact that you ran it
	* the fact that it did run at some point in time
* kinda like a D flip-flop, instead of a latch
* if you add the tracks based on the existence of the program, then closing the program would matter

* so it doesn't matter who initiates it
* it matters how it was initiated

* instead of thinking in terms of events
* remember that events are just data
* so theoretically, it should be the same as just having an input list of numbers

		numClicks: collector
		foo: clicks >>
			for click in clicks:
				numClicks <: 1

		operatingSystem:
			foo(clicks: (1 2 3))


* maybe think in terms mapreduce instead of insertion
* use a mapreduce to turn the input mouseclick actions, into a `numClicks` var
* if the client creating the clicks disappears, then the mapreduce would adjust, and `numClicks` would reduce right?

### Is a Program an Action or a State?

* so it seems like the question is
* are we treating the module as triggered runs (persistent even after the program closes)?
* or are we treating the module as an enabled states (undefined after the program closes)

* also note that garbage collection idea was wrong
* because if program disappears, the values should disappear too

* is the `Client` program considered more of an "action" or a "state"?

* maybe every program has two parts to it
* actions it can perform, which are persistent even after the program closes
* and state, which exists only when the program is open

* so when you create a new `Client` program, the `activeUser` insertion is state based
* whereas the `sendMessage` is an action

* what about state based actions
* or action based states
* remember that clicks is just a number


* doesn't make sense to think of `Client` as purely just a state
* because that means once it's gone, all of its impacts and changes on other objects, go away
* if we thought of programs as just transient states, then any changes it makes disappears with it
* we need programs to be like actions, to represent a permanent impact
* when you run a program, you run a modification on a data set

* on the other hand though, if we think of `Client` as an action, then the only way to model state-based behavior would be like

		myClient: Client
			if (this.isCurrentlyRunning)
				myServer.activeUsers <: this.user

* which seems pretty weird and ugly
* to have to constantly reference `isCurrentlyRunning`

### Programs as Timeless Actions

* how would we tell the difference between a program that inserts an item permanently
* and a program that only inserts an item while it's running
	* aka when it stops running, the insertion would be removed
* both of them would just look like

		myProgram:
			someCollector <: item

* actually, it doesn't make sense to think about closing a program as deleting a module
* if you think about how a program will be created in the first place

		for click in openProgramButton.clicks:
			program(click.arguments)

* closing the program won't change the number of `clicks`

* in event-based modeling in Axis, modules are often created, but rarely destroyed
* this matches the "Timeless" idea of axis


* but this is a weird pattern
* you would expect for modules to match the UI
* if windows and programs appear and disappear in the UI
* you would expect the corresponding modules to match

* but we need to think in terms of timelessness
* when we declare/clone a new module, we aren't saying something like "this module was created at 12 oclock"
* we are saying "at some point in time, this module existed"
* and then we can specify for it "this module was `active` at 12 oclock, and then `closed` at 6 pm"


* however, it's extremely intuitive to want to do something like this:
		
		onClick: click =>
			if (this.currentlyRunning)
				mycollector <: click

* but this won't work
* the insertions will disappear once the program stops running
* so why does our intuition not match correct program structure?

* we would actually need to do

		onClick: click =>
			if (click._timestamp within this.runtime)
				mycollector <: click

* which would actually look better if we just used state variables

		runStateVar: state var    // state variable declaring the run state of the program
		onClick: click, _timestamp =>
			if (runStateVar.at(_timestamp))
				mycollector <: click


### syntax stuffs


use `var` to declare state variables?
use `tag` to declare tags or virtual properties?

insertions and clones called in a `do` block, will automatically carry the `timestamp` (or the specified index) along with the clone/insertion
so use insertion `<:` instead of `:=`?


### private vars overriding hack

	someScope:
		#priv
			a: 10
			b: 20
			foo:
				#sum: a+b
				=> #sum

		publi: #priv.foo

	...
	...

	bar: someScope.publi(a: 10)->

even though `bar` can't see `a`, `b`, or `#sum`, he can still modify foo's behavior by guessing public variable names and overriding them
this would not have been possible if `a` and `b` were private vars



does it still make sense to use `#` for declaring private variables?


### Creating State Vars From Other State Vars

* take this snippet from the chatroom example

		messageDraft: html.find('textarea.message-draft')->.value

		send: _timestamp =>
			currentRoom.conversation <: messageDraft.capture(_timestamp)->

* is `<html element>.value` a value or a state variable?
* maybe its a value, based on a state var
* how does `capture` work?
* if you had `foo: someFn(someStateVar)`, and you did `capture(foo, timestamp)`, would it recursively find all state var dependencies, and capture them?
* would it work if you use a pseudo state variable implemented using collectors, eg `foo: someFn(pseudoStateVar.currentValue)`

* you probably have to declare it as a state var as well
* so `foo: var someFn(someStateVar)`
* after all, not everything is going to be capturable
* it's not like spotify will allow you to see the state of a playlist before a certain time
* the module has to expose that functionality

* basically all state variables have to have a public index or implement the api `before(index)`
* maybe we should used `indexed` as the keyword then
* `foo: indexed someFn(someStateVar)`
* `indexed` is a bit technical though
* but `var` is a bit vague

### State Vars and Implicit Indices

* maybe instead of `capture`, we simply use empty brackets `[]` to imply that it is pulling out the appropriate index
* so instead of `messageDraft.capture(_timestamp)->`, we simply say `messageDraft[]`, and it's implied that it's finding the latest index based on `_timestamp`
* it knows to use `_timestamp` by default, but if you specify a different `_index`, then it will use that when figuring out the implicit index

* I believe we actually talked about this concept before, but perhaps with different syntax
// TODO: FIND REFERENCED SECTION

### Client Disconnects

what happens if the client gets disconnected
what happens to the insertions?

* on one hand, normally the only way to remove insertions is for the thing generating the client, to stop generating it
* eg if the client was produced from a `map()` function, and the number of input items changed, resulting in less generated clients
* and so, if there is a disconnection, the server wouldn't receive any signal that the client was removed or un-generated
* in essence, the client needs to destroy itself to remove the insertions
* and since the server won't receive any signals, it won't proactively remove those insertions

* on the other hand, insertions are like "persistent" bindings right
* so if the client gets disconnected, won't server start receiving "undefined" on those bindings, those insertions?

* what do we want?
* for insertions like `sendMessage`, we want to keep them
* for insertions like `activeUser`, we want to lose them


* maybe we can specify a `if disconnected` block, where we set values/behavior for when a module (eg a web client) is disconnected
* but this feels like ugly overhead
* we should have default behavior that behaves as we expect
* and at least for `sendMessage` and `activeUsers`, we do have some reasonable expectations
* but how to we formally define these expecatations?

### Client Disconnects - Immutability

(continued from previous section, "Client Disconnects")

* well maybe it's because
* for `sendMessage`, once we send the message, we are sure that the sent message is not going to change
* but for `activeUsers`, the `active` state we are sending to the server might change

* so how can we tell whether something is going to change or not?
* we start with events, and we assume that those are `immutable` and guaranteed not to change
* eg, if a mouse click is registered, then we do not expect it to ever disappear
* if a variable is based on an event, then after it is fully computed, it is also guaranteed not to change, `immutable`
* eg, `sendMessage: capture(message, timestamp)`, which is basically a combination of all keypress events up to a certain timestamp
* however, for something like `active`, it is a state, and so we don't know if it will change or not
* it can be thought of as "not finished computing"
* so if the server is dependent on that variable, then if it gets disconnected,
	* the server can assume it as `undefined` because it was never fully evaluated
* in fact, because the `active` state is based on user input,

* but what about something like `numclicks`
* `numclicks` is based on live streaming data, so if the client gets disconnected we won't know the correct number
* eg, imagine if the client keeps clicking even after being disconnected, now the last `numclicks` data that the server saw is out of date
* though at the same time, we would naturally expect for `numclicks` on the server side to reflect the last seen data
* and when the client reconnects, it updates `numclicks` (if there were any clicks while disconnected)

* also note that `sendMessage` is not just a simply combination of all keypress events, for which we can assume it is `immutable`
* even though each keypress event may be assumed as immutable, we are assuming that we have aggregated all keypress events up to a certain timestamp
* but what if some were "lost in transit", and then later on they arrived, in effect "rewriting history"
* do we account for these keypresses?

### Client Disconnects - Update Propagation

(continued from previous section, "Client Disconnects - Immutability")

* perhaps it would be better to just by default, use the last seen value
* and if you want special behavior based on disconnect, you have to specify it

		Client:
			if (connected)
				activeUsers <: this     // based on connection, so will default to undefined on disconnect

			sendMessage: timestamp >>
				chatroom <: capture(message, timestamp)   // not based on connection, so will retain value on disconnect

* in fact, perhaps we can just **treat disconnects as really slow updates**
* so just because we haven't received an update yet, doesn't mean we should set the value to `undefined`
* each module receives updates, recomputes its behavior, and then sends out updates to other modules
* there is no notion of "connected"
* its just modules sending out updates, and they will continue retrying until the update is received
* every module is an independent actor, sending "mail" to other modules

### Client Disconnects - the `connected` property

(continued from previous section, "Client Disconnects - Update Propagation")

* note that `connected` has to be a special variable that will actually notify the server of updates, even when disconnected
* while other variables in the Client are considered "part of the client", stored and running on the client machine,
	* so on disconnect, they would not be able to send updates to the server

* actually, we can think of the server and client as having a copy of the client module definition
* on disconnect, the server recieves a single update, `connected = false`, and then updates any behavior accordingly
* client does the same


* notice that the `connected` var actually only makes sense for clients with a single "parent server"
* traditional server-client model
* but what if a client has multiple parent servers, that it sends info to
	* eg, maybe it sends clicks to one server, and keypresses to another server
* or what if we had an independent module, that doesn't have a "parent", just has a bunch of other modules that it sends data to

* so `connected` is really just a property defined in the `Web.Client` module
* as it only makes sense in the context of a web server and client
* and it doesn't really have any special behavior, it's just a property that stores the current state of the client
* the only special behavior is that it is the only variable that gets updated on the server side if the client disconnects

* this is really interesting because traditionally we think of "connection" as some inherent behavior of distributed systems

### Connection, Update Propagation, and Transient Behavior

(continued from previous section, "Client Disconnects - the `connected` property")

* once we are concerning ourselves with "connection" and update propagation
* then we have effectively left the usual realm of "steady state behavior"
* and are entering the realm of "transient behavior"
* we are starting to think about how the program should behave if not all updates have propagated yet

### defaults

	tag itemCounts: (default: collector(+))
	itemCounts: Hashmap(default: collector(+))

	for item in listWithDuplicates:
		itemCounts[item] <: 1

vs 
	
	itemCounts: collector(items => items.keys)

	for item in listWithDuplicates:
		itemCounts <: item
		itemCounts[item] <: 1


note that it will clone the default, not just refer to the same one every time
but what happens if the default is a modifier?
does it pre-emptively call the modifier infinite times, or


we also talked about this earlier
how we can't just do `itemCount <: item: ()`, because it would create collisions
	// TODO: FIND REFERENCED SECTION
well we can't do that anymore anyways since you can't insert properties
however, we can do what is shown above, which prevents collisions



### web browser server and IDE


combine web browser, server, and IDE

browse the web
modify programs and web pages
serve data


### State Variable Syntax and @-Blocks

we can use `@someIndex` inside a block (or at the top of a block) to specify a default index to use when extracting states

when `@` is used, it will automatically start extracting states from state variables
but won't touch regular variables
this might seem like mental overhead because you have to keep track of which variables are state vars and which aren't
but you should be keeping track of the "types" of variables anyways

when you use a `@` to "slice" all state variables at a certain index
we call them @-blocks


all state vars implement
`set(index, value)` function, and `at(index)` function
`:=` is shorthand for `set` function, `@` is shorthand for `at` function

so something like 

	incrementBy, someCollector >>

	numClicks: var 0     // initialize state var to 0

	onClick: @timestamp
		numClicks := numClicks + incrementBy
		someCollector <: numClicks

is just shorthand for

	incrementBy, someCollector >>

	numClicks: stateVar(start: 0)    // initialize with 0

	onClick:
		numClicks.set(timestamp, numClicks.at(timestamp) + incrementBy)
		someCollector <: numClicks


actually note that the @-block syntax looks realllly similar to verilog sequential blocks
	verilog even uses `@ (posedge clock)` syntax, which is basically "slicing" all data at the clock edge
funny, because I was originally against verilog sequential blocks
because they felt too distinct and separate from combinational logic
and I wanted to "unify" sequential and combinational logic
// TODO: FIND REFERENCED SECTION

however, we were able to unify it in a sense
you can reference normal, persistent variables in a @-block
you can do both combinational or "sequential" logic in an @-block

do we need `:=`?
could use just use the insertion operator `<:`, but have it use `set` when applied to a state var inside a @-block?
mmm might be confusing
perhaps best to just use `:=`


would it be better to just use `at index` instead of `@index` for declaring @-blocks?
looks a little more readable

also note that `.at(index)` will actually retrieve the closest state **before** the specified index
not exactly at the specified index
otherwise `stateVar := fn(stateVar)` would result in a feedback loop, retrieving the exact state that is being set

### is Axis actor vs dataflow model

Actor model is about treating a program as made up of independent actors sending messages to eachother
which seems in line with how Axis treats modules
actor model languages are for distributed concurrent systems, which is also what Axis is for

but dataflow seems to also have these goals and concepts in mind
so is there a difference between actor model and dataflow model?

according to [this](https://stackoverflow.com/questions/18790385/dataflow-programming-vs-actor-model)
it seems like the main difference is that actor model is for non-deterministic concurrency, while dataflow guarantees deterministic concurrency
see [this](https://stackoverflow.com/questions/8582580/why-is-concurrent-haskell-non-deterministic-while-parallel-haskell-primitives-p)
in dataflow languages, it doesn't matter how you parallelize or evaluate the program, it will always result in the same answer
whereas in actor model, if you had two actors that printed to console, then it depends on which actor runs first


in Axis, it seems to follow the actor model because it has side-effects from insertion
however, it is deterministic
the resulting answer will always be the same no matter how you evaluate it
though perhaps we are abusing the definition a bit
because Axis is "timeless", and will re-order actions if necessary
for example, if you had two Axis that printed to console
the print operations would have a timestamp attached
so if the print operation with the earlier timestamp happened to come later
the console should "insert" it before the other print statement, to make it look like it happened first
so no matter which print statement actually executed first, the resulting console would look the same

could feedback cause different answers?
well for divergent feedback, no matter how it runs, it will just not halt, so that counts as the same answer
not sure for convergent feedback, because maybe you could implement something like a J-K flip flop
	and end up with different answers for different execution orders...


the [wiki for dataflow](https://en.wikipedia.org/wiki/Dataflow_programming) says that:

>An operation runs as soon as all of its inputs become valid

this seems to imply an acyclic graph
because if there was feedback, then how could "all inputs become valid", if each input is still waiting on its dependencies
	in a sort of deadlocked loop

but Axis has feedback, how does Axis know when to evaluate?
we can just assume forward evaluation
modules will evaluate whenever they receive updated inputs


### J-K flipflops and determinism




### do we need state vars?

recall that state variables are just shorthand for `set` and `at`
	see section "State Variable Syntax and @-Blocks"

but we really only use it for event handling
and even in event handling, we often don't need it
for example, in the `numClicks` example in the section "State Variable Syntax and @-Blocks"
we could have just done

	numClicks: collector(+)
	onClick:
		numClicks <: 1

and it is much simpler, and doesn't need all the new syntax that state variables introduce
so I wonder if we can model other event-handler behavior using regular syntax

for example, the chatroom example

	username: var
	roomName: var

	enterRoom: => @timestamp
		username := $('.username').value
		roomName := $('.chatroom').value

this seems like a good place to use state variables

but really all we want is the `$('.username')` and `$('.chatroom')` values captured at the latest `enterRoom` call

in addition, why specify @timestamp in every event block
shouldn't all event blocks share the same index
perhaps just use it on the uppermost block, Client
does that cause any problems?

maybe its like a virtual tag
we should be able to fence out a scope where everything uses the same index
indexes have scope, can be private

optimization and abstraction
why are there some cases where we have to go into interpreter to implrment optimizations
if theysre abstracted well enough, cant u just change the function implementation

for example, a realllly long list, eg all a user's photos
you want to keep it simple, just generate a `img` object for every photo
	`for photo in photos: html('img.user-photo(src="{{photo}}")`
but you also want to optimize, so it only pre-loads the photos currently on the page (and some extras on top and bottom, in case user starts scrolling fast)




how to capture non-state var
for example, capturing/archiving a webpage


username is a state variable, capturing username input on button press
but we don't have to implement like that
we could impelemnt username as a normal variable, and explicitly do all the capturing ourself
that way anybody that sees username can't see all its states

anyone outside of index scope
should see the var as normal var


however often it isn't intuitive where you should confine the scope
for example, it might seem intuitive to confine the `$('.username')` and `$('.chatroom')` states to the `enterRoom` module
so that anybody outside the `enterRoom` only sees the currently captured `username` and `chatroom`, and can't see previous states
however, note that `sendMessage` actually does need to see the states of `username`
because it should capture the username at the time the message was sent, not the current value of username

the username inserted into `activeUsers` however, should just be the current value
the server, and the `activeUsers` object, should not be able to see previous states

also, the states of `$('.username')` and `$('.chatroom')` don't need to be visible outside `enterRoom`, only `username` needs to be visible


### private sharing ?

how would you declare a module `foo` such that `bar` can see some private vars, and `zed` can see others
using encryption, one would encrypt some info using `bar`'s public key, and the other info using `zed`'s public key
so we could just have `encrypt` and `decrypt` functions
however, this isn't really adhering to the idea of private keys

instead maybe we can do:

	bar:
		#privkey
		getKey: #privkey
	foo:
		[bar.getKey]: "private info for bar"

`bar.getKey` retrieves the public key for `bar`
but when you do `[bar.getKey]: ...`, it encrypts it using the public key
so that `bar` can just do `foo.#privkey` to retrieve it

this is weird special behavior that we would have to add to the language though
and it also implies that anybody could retrieve the data using `foo[bar.getKey]`


### private key revisited ?

private keys syntax vs tags
if you want to tag external objects, use tags
if you want to add private info to internal objects, use private keys

but when would you ever want/need private keys?

`_key` syntax

private keys are bad?
they allow people to define public modules with private behavior
allowing people to create services that others can use, but they won't know how it works
which is a bit anti-collaborative
prevents people from improving on the product or competing against it

the only time private data seems acceptable is
if it is still under development, eg if a committee is trying to make a decision
but in that case, there's no reason to make any behavior public, you can keep everything private
its not the same thing as creating a public module with private behavior

a public module with private behavior means:
	* public properties dependent on private scope variables or private properties
	* a module meant to be cloned and used, aka public inputs

but why would a user want to clone/use your function, if you aren't telling them what it does exactly

the only example I can think of are modifiers, public API functions meant for modifying your object
for example, my public social profile might have a "sendMessage" api function that allows people to send messages to me
but inside the function, it probably references a private collector where the message is inserted

modifiers are a very specific example though, shouldn't we be able to find other use cases for private variables?

maybe a club committee that approves club requests to become a "formal club"
and then those clubs can see private info
like the voting box

	committee: approvedClubs >>      // note: approvedClubs is a list of club objects, manually provided by a committee member

		#votingBox: collector

		for club in approvedClubs:
			club.onApproval(#votingBox)   // give all approved clubs a reference to the voting box

	music_club:
		#committeeVotingBox: collector(any)    // hopefully committee won't call this.onApproval multiple times, or we won't know which voting box to choose
		onApproval: #votingBox >>
			#committeeVotingBox <: #votingBox

hmm this is really weird though
we'll need to revisit this

and what about private keys?

perhaps private vars and keys are for flexible scoping
scoping is an approximation after all















	ChatroomServer: Web.Server

		'/chat': Web.Client
			layout: pugLayout    // using [pugjs](https://pugjs.org)			
				input.username
				input.chatroom
				button(onclick=enterRoom)

				p Room: #{roomName | "please enter a room name above."}

				p users online:
					for username in currentRoom.activeUsers
						span username

				div.conversations
					for (user, message) in currentRoom.conversation.orderBy('_timestamp')->
						p #{user}: #{message}

				textarea.message-draft
				button(onclick=send)

			username: var
			roomName: var

			enterRoom: @timestamp =>
				username := layout.findOne('.username').value
				roomName := layout.findOne('.chatroom').value

			currentRoom: chatrooms[roomName]

			if (connected)
				currentRoom.activeUsers <: username

			send: @timestamp =>
				currentRoom.conversation <: (time: timestamp, user: username, message: layout.findOne('.message-draft').value)






	chatrooms: hashmap(default: (activeUsers: collector, conversation: collector), file: 'chatrooms.axis')   // a collection of chatrooms, saved to a file

	ChatroomServer: Web.Server

		'/chat': Web.Client

			// assume we have some html page with input boxes for username and chatroom name,
			// a box displaying all messages and users in the current room,
			// and a text-area to send new messages to the current room
			layout: html(file: 'mylayout.html')

			username: var
			roomName: var

			enterRoom: => @timestamp
				username := layout.find('input.username').value
				roomName := layout.find('input.chatroom').value

			currentRoom: chatrooms[roomName]

			if (connected)
				currentRoom.activeUsers <: username

			send: => @timestamp
				currentRoom.conversation <: (time: timestamp, user: username, message: layout.find('text-area.message-draft').value)




html as a module
also has inputs and outputs
	inputs are the values that Axis gives to it
	outputs are the values from input boxes or text areas, that it gives back to Axis




note that files and databases pretty much always have to be collectors
because they might have multiple server or programs writing to them at the same time




actually when we make a single chatroom

	messages: collector(file: 'messages.axis')   // all messages, saved to a file
	activeUsers: collector

	ChatServer: Web.Server
		index: Web.Client
			layout: JSX    // using jsx syntax
				<input class="username"/>
				for user in activeUsers
					<span>{user}</span>
				for message in messages.orderBy('time')->
					<p>{message.text}</p>
				<text-area class="message-draft"/>
				<button onclick={send}>Send</button

			username: layout.find('input.username').value
			draft: layout.find('text-area.message-draft').value
			
			activeUsers <: username

			send: => @timestamp
				messages <: (time: timestamp, user: username, text: draft)

it gives me an idea
what if we just extend this to create a multi-chatroom?

multiple ways to do this
multi-route, each chatroom is a url

	chatrooms: hashmap(default: collector, file: 'chatroomes.axis')
	roomMembers: hashmap(default: collector)

	ChatRoomServer: Web.Server
		index: Web.Client
			layout: JSX    // using jsx syntax
				<input class="username"/>
				<input class="chatroom"/>
				<button onclick={enterRoom}>Enter Room</button

			enterRoom: @timestamp =>
				redirect to ChatroomServer[layout.find('input.chatroom').value, layout.find('input.username').value]

			username: layout.find('input.username').value
			draft: layout.find('text-area.message-draft').value
		[room, username]: ChatServer.index
			messages: chatrooms[room]
			activeUsers: roomMembers[room]
			username: username
			layout:
				remove username input
				<p>room: {room}</p>

or alternatively, single page

	chatrooms: hashmap(default: collector, file: 'chatroomes.axis')
	roomMembers: hashmap(default: collector)

	ChatRoomServer: Web.Server
		index: Web.Client
			layout: JSX    // using jsx syntax
				<input class="username"/>
				<input class="chatroom"/>
				<button onclick={enterRoom}>Enter Room</button

			enterRoom: @timestamp =>

				ChatServer(room: layout.find('input.chatroom').value, username: layout.find('input.username').value)

			username: layout.find('input.username').value
			draft: layout.find('text-area.message-draft').

			messages: chatrooms[room]
			activeUsers: roomMembers[room]
			username: username
			layout:
				remove username input
				<p>room: {room}</p>

or alternatively

	ChatRoomServer: Web.Server
		[room]: entireChatServerModule()







maybe I should make anonymous values anonymous keys instead
that way it's easy to create objects whose properties are the same name as the key
kinda like in javascript when you do `{foo, bar}`
except it's especially hard in Axis because you can't do `(foo: foo, bar: bar)` because then its feedback
also makes it easier to declare implicit inputs, because when you do `(foo bar)` and `foo` and `bar` don't exist in outer scope
it's basically like declaring `(foo: undefined, bar: undefined)`


or maybe use syntax `foo^, bar^` or `(foo::, bar::)` if we want to do `(foo: foo, bar: bar)`

### One-Off vs Permanent Templates

templates unintuitive
because we naturally want to treat templates like normal objects
but we have to remember to call them, not clone them
before we said that the inert-ness of a template, is part of its behavior
so it should get cloned as well
but that isn't how we naturally think about templates
when we think about the behavior of a template, we think of the object behavior, not the inertness
we think of templates as this object that is currently inactive, just for that one instance

if we want templates to be thought of as completely different from normal objects
and to help us remember that they are meant to be called not cloned (the vast majority of the time)
then we should use a special naming convention
just like functions are named using verbs, `add` or `rotate`
templates should also be named so that they capture the inert-ness, eg instead of `car` it would be `carTemplate`
that way, when interacting with the object, we would remember that it's a template

however, if we don't want to do this
maybe we should just have templates become active when cloned
	which is what we mainly use templates for anyways
and if you want to keep it inert, then use another template, `foo: template someTemplate(10, 20)`
	which is a rare and special use case, so using special syntax is natural

functions however, should still stay inert until called
which is a little weird

`createPlaylist` vs `playlist`
isnt `createPlaylist` already naturally a template
so we know to call it, not clone it
it's actually more of a function

however, it's more natural to use an object
follows prototypal mindset better

but then what about `Web.Server` and `Web.Client`
now you have to remember to use`template`


before insertion, it was pretty simple
you clone objects, that's it
everything is "live" and "active"
you assemble objects from other objects
life was simple and all was gucci in the hucci

however, everything changed when insertion attacked
now, we can't just assemble objects from other objects
objects can do "actions" now, modify other objects


the reason why it's intuitive to have templates execute when cloned
is because they should look the same as regular objects to an outside viewer
aside from the fact that all properties return undefined
but the behavior is still there

it looks like any other object/module that contains behavior
and thats how people should think of it
so it shouldn't require a special operator

from the inside (aka for the person that created it) it may look different, because it isn't actually doing anything
but from the outside, it should look just like any other object



from the outside, it isn't immediately obvious if `Web.Client` is an object or a template
even if it's a template, we still think of it as a collection of properties and behavior
	not as a function that generates those properties and behavior
what is clear, is that we don't want to run the insertions that we are declaring when extending `Web.Client`
so while it isn't obvious whether or not `Web.Client` is a template, it is clear that we do want a template

if the behavior we think of, and the behavior we give it, is the behavior that is also in the result, then it should be clone
if the behavior we give it is not the same as the result, then it's more a function

one massive consequence is that we can have a function that treats a template and an object the same
eg, if somebody creates a function that modifies `Web.Client`
it can work on both the template, and an instantiated version
does this make sense?

yeah it does
I guess the way we usually think of the difference between cloning and calling
is that cloning acts on objects, and copies behavior
calling is when we specify some behavior, and then extract a separate value
so with templates, it doesn't _feel_ like we are extracting a separate value (even though we are)
it feels like we are just copying an object, and we intuitively just ignore the fact that the old object was inert

it sort of matches how in imperative, every time we want to defer behavior, define behavior without executing
we have to remember to declare it as a function
even if we are modifying a function, we still have to explicitly declare a `function`
eg `modifiedFn = function () { doSomething(); originalFn() }`

in fact, it makes it very clear when behavior isn't being executed
an issue discussed in section "Clones and Calls Declared Inside the Arguments"
before, with permanent templates, if we had something like this:

	foo( console.log("test")-> )

it might not be clear if anything is being printed, because we'd have to know if `foo` was a template
however, with one-off templates, you'd have to do

	foo(template console.log("test")-> )

which is much more clear


but can't we think of calling as like, another argument to be passed into the cloning?
when cloning an object, you usually have to be aware of it's inputs and arguments anyways
that's the bare minimum you need to know in order to interact with it
so shouldn't you know that it's a template, and remember to call it?

with templates, you can focus on two different things
you can focus on what it's _supposed_ to do, aka the behavior defined in it
or you can focus on what it's actually doing, that it's doing nothing, aka the fact that it's a template
I think in most cases we focus on the former
so it's more natural to expect it to be "alive" when we clone it

it's just weird that what's intuitive is not what's mathematically elegant
because these one-off templates go against some core principles of Axis
which is, that behavior should be copied exactly when cloning
permanent templates are more like syntactic sugar, they could be implemented using regular syntax
you just capture the scope, and then define the return property as `=> this.apply(scope)` or something like that
	see section "Templates and Deferring Evaluation"
the object could be considered "alive", but all scope references would be pointing to `undefined`, until you call it and it overrides the scope with the real one
	though this does require some special mechanisms, like capturing scope
however, one-off templates would have to be implemented at a very core level
because they are the only objects that change behavior simply by being cloned

* note that we could still use `=> this` to define a permamanent template
* mentioned in section "Templates and Deferring Evaluation"
* it's just that now the `template` keyword stands for one-off templates, not permanent templates

### verbs vs nouns

we have to be careful about naming things
if it's a function, we should use a verb
eg if it's an object, we should use a noun
that way we know when to call and when to clone

maybe that's the difference between one-off templates and permanent templates
one-off templates should still be named like objects, and treated like objects (aka cloned)
permanent templates are the same as functions, they have to be called to return the actual result




it does still feel a little unintuitive to have to use `Web.Client template` instead of just `Web.Client` when creating web clients
you have to remember to add `template` because you don't want to perform any insertions
I mean, you are extending the definition of `Web.Client`, so if `Web.Client` is a template, doesn't it make sense for the child object to be a template as well?

I guess one nice thing about one-off templates though, is that it's obvious if an insertion is going to be performed or not
it's right there in the object's definition, you can see in the definition if it declares `template` or not
with the permament template model we used before
you would have to know if the object's parent is a template, or if that parent's parent is a template, etc
because if one of the ancestors happens to be a template, 


can you convert an object into a function by extending it?
what happens if you do:

	someFn: someObject
		=> this.someValue

hmmm perhaps this shouldn't be allowed

on one hand it makes sense to be able to override `_return` just like any other property
on the other hand, functions are permanent templates and objects are not
so would it change to a template or not?


templates actually fundamentally change how things work
because the scope becomes detached
in a sense, it's saying "all the stuff I'm defining now, don't apply any of it until I explicitly call"
even functional doesn't handle this well, because if we think of mapreduce instead of insertion
if you declared a sort of `insert: ...` property that declared what you wanted to insert
and maybe a `modifierCalls: ...` property declaring modifiers that you wanted to call
templates would be like, saving those properties in a hidden object, and then when you call the object, it unwraps these saved properties into the "live behavior" of the object








functional doesn't deal well once it comes to privacy
can't guarantee secure and direct channels
a "global" (or local) environment to interact with
but what about monads? 


if we prevent function to be an argument object
then it prevents an object from turning into a function
note that this doesn't make static typing though

	foo: if (cond) someObject : someFunc

it does however mean that if we want to determine if something is object or function, we only need to look at it's root ancestor



another way to think about one-off templates
in Axis, we define behaviors
it is sort of a mix between functional (defining functions) and imperative (defining execution)
when we declare a template, we are basically telling our own scope to ignore all insertions/clones coming from this specific object
we can do this because it is our scope
but anybody that clones the object, creates a new object, whose insertions/clones will not be ignored
maybe we could use something like `foo: (if this != foo (someCollector <: 10) )` to implement this


### commutativity

normally the way we define templates is

	template
		definition
		goes
		here

which is short for `template(definition goes here)`
if we had some object, we could also "spread" it's definition and turn it into a template,
eg `template(...someObject)`

but then what about extending objects and creating a template?
our current syntax is

	someParent template
		definition
		goes
		here

i initially chose this because it felt cleaner than `template someParent(...)`
but in fact they pretty much mean the same thing

formally you would have to do

	template
		...someParent
			foo: 10
			bar: 20

(note that we use the spread operator so that we are passing the definition of `someParent`, not just a reference to `someParent`)
but this is actually equivalent to

	someParent
		...template
			foo: 10
			bar: 20

in fact, this works for any two objects

	A(...B(args)) = B(...A(args))

as long as `A` and `B` have no colliding properties
this is because we are basically just doing `combiner(A,B)`
		with the args, it is `combiner( combiner(A,B), (args) )`
notice that because the `combiner` is symmetric and commutative (if there are no colliding arguments)
`combiner(A,B)` is the same as `combiner(B,A)`


what does this mean for functions?

maybe same for function as argument object
`function(someObject => someObject.value)` is valid
so maybe also `someObject(function => this.value)` also valid

`=>` turns the containing object into a function, a permanent template
and also declares the return value
so while you can turn objects into functions by using `=>` in the arguments
eg `someParent(foo: 10, => someParent.value)`
it is ugly and not very clear
and it is better to just do `(someParent(foo: 10) => someParent.value)`
both are equivalent
first one is `combiner(someParent, combiner(function(foo: 10, _return: someParent.value)))`
second one is wait a minute second one isn't right

 `combiner(function(_return: someParent.value), combiner(someParent, (foo: 10)))`



flexible scoping and mixins

move away from hierarchies
this is why we use type as a property
perhaps `template` should be a property too
properties, not hierarchies





stratified complexity



### Latches and Feedback

hmm it does seem more and more like Axis is just actor model, not dataflow
important to note that actor model is nondeterministic
apparently a large issue with the actor model, as discussed [here](https://en.wikipedia.org/wiki/Indeterminacy_in_concurrent_computation)

so starting to make me think, perhaps Axis does have issues with feedback
maybe it is possible for it feedback converge to different values depending on execution
I originally thought it wouldn't be a problem because everything starts as `undefined`, so there is a set initial value
but I haven't fully explored this yet

can we come up with an example?

	latch: input >>
		output: input | output

let's say `input` starts undefined
then `output` will be undefined
then let's say `input` switches to `1`
output will switch to `1`
then let's say `input` switches back to `undefined`
output is now "latched" onto `1` still
so the transient behavior has impacted the output!!

similar to an S-R latch

if we combine this with the fire nukes synchronization issue example from long ago
	see OneNote page "Flo Syntax Brainstorm.one"

	fireNukes: !input == input     // will always end up false, but may be true during transient behavior
	latch: fireNukes >>
		output: fireNukes | output

we can see how this can cause problems
`fireNukes` should always be false
however, if `!input` takes more time to calculate than `input`
then `fireNukes` will be true for an instant
and if the latch registers it during that instant, then it will latch onto `true`
even though at first glance, it seems like `latch` should never be `true`


if something as simple as this created problems
why is the graph `#distance` example fine?

notice that if any of the `node.#distance` happens to jump to a negative number for an instant
it's impact will ripple through the entire graph
though when it goes back to `undefined` it will naturally correct itself...I think


* reason we thought it was determinant was because we thought outputs depend solely on current inputs
* no "arbitration" or arbitrary selection mechanisms, like mentioned in [the wiki](https://en.wikipedia.org/wiki/Indeterminacy_in_concurrent_computation)
* however, there is arbitary picking, the order in which updates happen is random

* maybe you have to localize feedback, declare a module as having `feedback` or interpreter will complain
* that's assuming we can detect it in the first place

* notice that, ignoring the initial `undefined` state, the final `#distance` value for all nodes won't actually have feedback
* the dependency graph will be a DAG, acyclic graph

### Distributed Feedback

* maybe every time we update a module, it invalidates all properties of a module
* so for `latch` example earlier, when you change `input`, it also sets `output` back to undefined
* before re-computing everything

* but feedback isn't necessarily contained to a module
* consider something like this

		latch1: input >>
			output: input | latch2.output
		latch2:
			output: latch1.output

* or alternatively, a "triangle maximum", where each node in the triangle is equal to the maximum of the other two nodes

		trifecta: input >>
			node1: Math.max(node2, node3, input)
			node2: Math.max(node1, node3)
			node3: Math.max(node1, node2)

* this get's even more hard to detect once you add insertion

		trifecta:
			node1: collector(Math.max)
			node2: collector(Math.max)
			node3: collector(Math.max)

		someModule: input >>
			trifecta.node1 <: trifecta.node2, trifecta.node3, input
			trifecta.node2 <: trifecta.node1, trifecta.node3
			trifecta.node3 <: trifecta.node1, trifecta.node2


* we could try to have some global mechanism looking for feedback
* but that doesn't seem to fit well with distributed systems




notice that even though `#distance` example uses feedback, the result is never dependent on execution order
this is because the result ultimately forms a DAG, regardless of transient behavior or initial values
	mentioned earlier in the section
in transient behavior, if one node's #distance is extremely negative, then it's neighbors will be that #distance + 1
because all neighbors of the original node have #distance+1, then the minimum of those is also #distance+1, so now the original node gets updated to (#distane+1)+1
in a sense, each node becomes a feedback loop `mynode.#distance: mynode.#distance + 2`
this feedback will continue, and all the #distance of nodes will slowly rise
the only node that is anchored is the start node, anchored at `#distance: 0`, so eventually it's neighbors will be anchored to `#distance: 1`,
	which will then anchor their neighbors, etc
until all nodes have stabilized, and there will be no more feedback
so as you can see, in the transient behavior, we have this `mynode.#distance: mynode.#distance + 2` feedback
however, something like this either goes away or diverges to infinity
feedback like `output: input | output` can stabilize while maintaining feedback, creating a latch

so maybe we need to detect when a memory address is directly dependent on itself
and has to be directly dependent, something like `bar: (foo, bar, zed)` doesn't count
only something like `bar: bar`
and it probably has to be runtime, because detecting if `bar: if (cond) foo else bar` could potentially result in feedback, seems way too hard
if it's detected in runtime, we just set the memory address to `undefined` with the error message `feedback`
and whenever the feedback is broken it will start working again

however, what about `bar: bar + 1 - 1`, we would have to detect that too
what about fixed point functions, like `list: list.filter(evens)`
or something like `sqrtGuess: sqrtGuess - ((sqrtGuess**2 - input) / (2*sqrtGuess))` (newton's method for guessing square root)


how is feedback different from recursion
`foo: sum(foo, 1)` vs `fn: n >> if (n = 0) 1 else n * apply(fn, n-1)`

in recursion, if an input (to the root call) changes, then all recursive calls are discarded
it allows for a "true reset", in a sense
it doesn't preserve state like feedback does



for now I think it is impossible to distinguish "good" feedback (eg `#distance` example) from "bad" feedback (aka latch example)
I guess the only good part is that, bad feedback is exceedingly rare
in regards to the latch example, if you really wanted an output that went back to `undefined` if input went back to `undefined`
then just mirror the input, `output: input`
by doing this weird `output: input | output`, you are basically explicitly declaring that you want some weird latching behavior
in regards to the triangle maximum, "trifecta" example
if you were to try to apply it to a practical scenario,
eg lets say that given a graph of nodes, you want each node to report the maximum of it's neighbors using the tag `#maxNeighbor`
notice that each `#maxNeighbor` tag would be based on neighboring node values, not neighboring `#maxNeighbor` values, so there is no feedback
if a node value spikes up and then falls back down, the corresponding `#maxNeighbor` values would do the same
they wouldn't latch onto the peak value, like the triangle maximum feedback example did
so it seems like in most practical examples, feedback is not an issue


### Axis vs Other Actor Based Languages

most concurrent actor-model languages based on message passing. Axis is based on bindings.




### Caching Functions and Clone Counting

even though we have side effects
we can actually cache functions
because side effects are unordered
all we really need to know, is how many times the function was called
though this does need to happen recursively
all function calls made inside the function, also have to have their clone-counter/call-counter incremented
so this is almost like just running the function again
although if the function makes no insertions, the clone-counter doesn't need to be updated
	same can be said for imperative though, if the function makes no assignments out of scope, then it can be cached

let's take a look at the fibonacci function

	fibo: n >> if (n <= 1) 1 else fibo(n-1) + fibo(n-2)

let's say sombody makes a _second_ call to `fibo(10)`
`fibo(10).numClones` updates, which then updates `fibo(9).numClones` and `fibo(8).numClones`
this in turn updates `fibo(8).numClones`, `fibo(7).numClones`, and `fibo(7).numClones`, `fibo(6).numClones`
ultimately we end up with 2^n updates





IO Monads

one benefit of functional is that you can prevent calls
which we talked about before
// todo: find referenced sections
i guess it makes sense actually
you can physically prevent all communication between a module and the outside world
if you want
however, the module can choose not to give any information if it has no access to internet
this is like, a functional function, that takes in IO, and if it doesn't get it, it will terminate all internal behavior



### Shortest Distance Example - Default Value of Infinity

actually note that we have to correct #distance a bit

	shortestDistance: graph start end >>
		tag #distance: (default: infinity)
		for node in graph.nodes:
			if (node = start)
				node.#distance: 0
			else
				node.#distance: node.neighbors[[#distance]].get(Math.min)-> + 1    // distance from the closest neighbor plus one

		=> end.#distance

we can't have all distances start as `undefined`, because then `Math.min` will return undefined (even for neighbors of the start node)
we have to start them at `infinity`
so it does seem like initial value matters


### Timeless - Feedback and Determinacy

* note that feedback can be determinant relative to time
* that is, if all events and inputs are state variables, indexed by time
* then something like `fireNukes: !input == input` becomes determinant
* because all updates will have a timestamp, based on the event that initiated the update
* so if `input` changes, then even if `!input` takes more time to compute than `input`
* then `fireNukes` will be true for an instant, but then the update will **override** the value of `fireNukes` at that timestamp
* it will rewrite history
* thus, when everything stabilizes, if you check the history of `fireNukes`, it will always be false
* this is all pretty much a consequence of the concepts talked about in the section "Timeless"

* so if we had a latch like `output: fireNukes | output`, then even though it will detect the instant where `fireNukes` is true
* when `fireNukes` rewrites history and sends an update with the timestamp,
* the latch will also rewrite history

* note that there can still be feedback in a single instance of time
* for example, take `n: n + input`
* lets say `input` is initialized to `1` at `time = 0`
* what should `n` be at `time = 0`?
* well, intuitively, it seems like `n` should be at `infinity` due to the feedback loop
* imagine an electrical circuit with similar feedback
* it will only take a few nanoseconds for the feedback to send the output to infinity
* and as expected, when we try to compute `n` at `time = 0`, it will keep updating itself, constantly climbing to infinity

* this timeless model where all events and inputs are state variables
* won't prevent divergent feedback from diverging (nor should it)
* but it establishes concrete rules behind the execution of feedback
* and makes it clear exactly _how_ it diverged
* makes it clear how any feedback reached its current value

* it seems like this new "timeless" model is all we need to prove determinacy
* the value of the output at any instant of time is determined by:
	1. the current value of inputs
	2. the previous value of outputs (only important for establishing the initial conditions of feedback loops)
	3. the definition of the program
	4. the definition of the language
		(includes how updates should be executed, discussed in the following sections // TODO: FIND REFERENCED SECTION)

* so this does mean that transient behavior matters
* but it isn't really "transient behavior" actually
* every change in input, is also an input


* makes it easier to debug
* we can track all the intermediate states of the inputs
* and see how a feedback loop reached its current value
* for example, for a latch, `output: input | output`, if the current values are `input = undefined` and `output = 10`
* we can look through the history of `input` and see that the previous value of `input` was `10`, which explains the current value of `output`


* I think this is pretty much all we need to prove determinacy in our language


### Timeless - Rewriting History and Synchronization

if timeless allows for rewriting history
then how do we ever know if a timestamp is "finished"?
how can we trust that the information we are getting is correct, and won't just be rewritten later?



maybe everything is a state var
after all, it is possible for any module to keep track of the timestamps it is getting with every update
	even though we said it's up to the source to give out that info
	the listener can just keep track of it themself
and even if the module doesn't get timestamps with updates, it can always register the time at which it received the update

right now the only way for a module to independently keep track of the transient behavior of inputs
is to use feedback, which is ugly
but since it's possible for a module to do anyways
maybe we should just expose a more user-friendly way of doing so

this basically turns everything into a state var
so another way of thinking about it is
by default, in Axis, all variables are state variables, but we are only looking at the "tip", the last value

in Axis, our functions don't just represent relationships between input
they represent relationships between input streams
kinda like erlang?

you can use `capture` on any input, to capture it at a certain point of time

and when we start using state variable syntax, it doesn't convert objects and scopes into a special state variable domain
everything is already in the time-domain
it takes us **out** of the time domain, so that we see these time-varying input streams as just lists


monads
recently re-learning the concept, from [here](https://medium.com/javascript-scene/javascript-monads-made-simple-7856be57bfe8)
in a way, it seems like our state variables are similar
we are taking functions that operate on values
and making them work with time streams


how does this fit into the idea that actor model is indeterminant
actor model languages like Pony use naive message passing
but they might have behavior that depends on message arrival order
eg receiving asynchronous print commands
thus, the behavior of the program, is dependent on behavior not defined in the program
	aka how the messages are being delivered, and in what order
and thus is indeterminant

Axis had a similar problem
while we didn't have message passing, we had data binding
and we assumed that the behavior of the program only depended on the current values of inputs
which made it seem determinant
however, feedback made the program behavior change based on how input changes were being propagated
thus, we made all inputs into state variables, time streams
and now, the program behavior is determinant, solely based on the definition of the program, interpreter, and inputs



### Feedback and Update Order, Evaluation Order

multiple ways we can define how our interpreter should handle feedback

reset, invalidate previous values
ignore previous values, assume initial value is `undefined` and go from there
in this case the latch would go back to `undefined` if the input went back to `undefined`
note that earlier we mentioned that this method was impossible
	see section "Distributed Feedback"
because if the feedback spans multiple modules, then how could we be sure the other modules are also invalidating their values?
	this is also where we introduced the triangle maximum `trifecta` example
however, now that transient behavior is well defined in the language behavior, everything is determinant
we can assume that the other modules are also getting the input change + timestamp that we are getting
and that they are following the language spec, and invalidating their previous value
if they don't then they aren't following the language, and that's their problem

another method is to not invalidate previous values and simply use them as the initial value
this probably makes more sense because latches will work as expected

but remember that even at a single instant of time, there can still be feedback between modules
so in what order should we evaluate each module?
for example, if we had a fixed point function for guessing square roots, `sqrtGuess: sqrtGuess - ((sqrtGuess**2 - input) / (2*sqrtGuess))`
	mentioned earlier in the section // TODO: FIND REFERENCED SECTION
then once the input changes, there will be a flurry of updates as feedback loop adjusts towards a new square root guess
but does the order matter? it might for certain examples
perhaps it should be like breadth-first-search, step by step?
every module gets one update, and then after that, any modules that need to update again, get one more update, etc etc

or perhaps, we should just set it to `undefined(error: feedback)` if any value needs to get updated more than once
did we just figure out feedback detection??
actually no, this doesn't work
consider the example:

	two_iteration_example:
		foo: input + 1
		bar: foo * input

during update propagation, on the first iteration, `foo` will update, and `bar` will update from the old value of `foo`
on the next iteration, `bar` will receive an update that `foo` just updated, and so it will need to do another update
in total it will look like

	start       |  input: 21
	iteration 1 |  foo: 21 + 1 -> 22,   bar: undefined * 21 -> undefined
	iteration 2 |  bar: 22 * 21 -> 462
	
if we had `zed: foo + bar + 1`, it would require yet another iteration to fully stabilize
we have no idea if these updates are coming from feedback, or just other variables updating
thus, we can't detect feedback using this method


this step by step iteration breadth first traversal method
might seem extremely inefficient, because we have to wait for all first-iteration updates to finish before moving on
and requires a global awareness in order to enforce this step-by-step computation
however, there is a distributed way of doing this
simply add an index tag to each update!!
so let's say `input` changes, then it would broadcast that update with index `0`
variable `foo` would receive the update, and then recompute its value, then broadcast its own update with index `1`
and variables updated from that, will in turn recompute and broadcast an update with index `2`
etc

so for the `two_iteration_example` shown earlier, the broadcasted updates would look like:

	(var: input, value: 21,        update_index: 0)
	(var: foo,   value: 22,        update_index: 1)
	(var: bar,   value: undefined, update_index: 1)    // this actually might be unecessarily, because bar isn't changing value
	(var: bar,   value: 462,       update_index: 2)


note that, it's possible for a variable to get updates out of order
	eg if they get an update with index `4`, and then later receive an update with index `2`
that's fine, they'll just have to revise their value, and broadcast update "overrides"
	eg, if `foo` gets an input update with index `4`, it will broadcast the update with index `5`,
	but then if it later recieves an update with index `2`, it will have to correct it's value, broadcast the update with index `3`, and 
		re-broadcast the update with index `5` (to override the previous broadcast sent out with index `5`)
wait, but then if a variable gets two updates with the same index, how does it know which one to use...? which one came first?


maybe we have a override index
when a variable receives an out-of-order update, it corrects its update values, and then sends out corrections with override indices
and when a variable receives multiple updates with the same index, it uses the one with the higher override index, and corrects all its update values
so for example, let's say `foo` gets an input update with index `4`. It updates its value, and then broadcasts the update with index `5`
later, `foo` receives an update with index `2`, then it corrects its values for index `2` and index `4`, and then sends out update corrections with index `3` and `5`, with override index `1`

so in total every update message has: an update timestamp, an update index, and an override index
the reason why we have to worry about out of order update indexes, but not for override indexes
is that every update index matters
eg, take the code

	inc: inc+1

the update propagation might look like

	(var: inc, value: 10, update_index: 1) ==(sent to)=> inc
	(var: inc, value: 11, update_index: 2) ==(sent to)=> inc
	(var: inc, value: 12, update_index: 3) ==(sent to)=> inc
	...

notice that the value of `inc` will keep climbing with every update
so every update matters
however, with overrides, we only need to care about the latest override
we can discard all the rest
because we know that, when a variable has to correct it's updates, it will increement the override counter
so only the highest override matters

this is still really inefficient because we have to keep track of all updates with indexes
so that if one arrives out of order, we can correct all intermediate updates

this is not necessary with the synchronous breadth-first update system
because once one iteration is done, we can move on to the next iteration, and discard the previous one
we never have to worry about stuff happening out of order



I think it's examples like this that show how important synchronization and centralization can be for optimization
so for example, if a program runs on a single computer, it is far more optimal to interpret it using a single thread
instead of using a bunch of asynchronous processes



note that using a breadth-first traversal when computing updates is still rather arbitrary
without feedback, we only need to ensure that if a variable is updated multiple times during re-evaluation,
	it should let its listeners know which update happened last, so they know to use that final update and discard all intermediate updates
the absolute ordering of updates doesn't matter, just the relative ordering
however, when we have feedback, then it seems to matter
for example, if we have two intersecting feedback loops

	x: fn(x, y)
	y: gn(x, y)

one way to execute it would be breadth-first: update `x` and `y` at the same time, then update both of them again, and again, etc until convergence
another could be to alternate, update `x` then update `y` then update `x`, etc
another method could be to update `x` five times, then update `y` once, then update `x` five times again, then `y` once, etc until convergence

it seems like all of these methods could result in different values
but can we find a concrete example of this?

and if they do, then choosing an arbitrary method like breadt-first traversal, might help make the language deterministic
but it also means that the programmer has to learn, and keep in mind, these rules when dealing with feedback



### Are Functions Necessary? Are Permanent Templates Necessary?

* before, when we just used list items as outputs, it made it easy to declare functions with multiple outputs
* and it integrated nicely with `map` and `for`
* now, if we want to have our original `for` functionality where you can define multiple items to be inserted into the map
* we have to have two `map` functions, one that takes in a function like `add: a b => a+b` (because many behaviors will be defined as functions),
	* and one that takes in a list like `returnTwoItems: a b >> (a+b, a*b)`

* are permanent templates really necessary?
* doing builder pattern like `addSong2: template addSong(10)(x: 20)(y: 30)` is more clear anyways

* maybe `->` is used for getting the first list item
* we won't need it if we are just executing an action, eg `console.log("hello world")`

* note that now that functions are templates, it's impossible to access list items anyways, so why not leverage them for function output

* how would something like `Square.rotate` work?
* and would `addCard` simply look like `card` now? wouldn't it be confusing just saying `Deck.card(10)` and expecting insertion to the deck? isn't `Deck.addCard(10)` more intuitive?


### State Variables and Defining Time-Varying Values

* when we want to say "send a message if the client is connected", it is intuitive to do as follows

		if (connected)
			send: @timestamp
				messages <: message

* however, this is incorrect (the correct method is shown in the `ChatServer` example)
* but why is the incorrect answer so natural and intuitive?

* it feels like you want to enable the message handler only when connected
* but when you use `if (connected)`, it is a timeless state, it only depends on the current value of `connected`
* so everything inside will either be all on, or all off
* when the client disconnects, all messages will disappear
* what you really want, is for `send` to work sometimes, while not at other times
* aka time-specific
* that means you have to have time as a parameter

* eg

		send: @timestamp
			if (connected[timestamp])
				messages <: message

* one of the cool things about doing something like

		send: @timestamp
			messages <: message

* is that, because you aren't dependent on the client being connected
* you can still "send" messages while disconnected
* they will be queued
* but once you reconnect, all those messages will be sent


### Functions and Transformations - Compatibility between Objects and Permanent Templates

* if you wanted to apply a bunch of modifications/transformations to a function
* that are usually meant for objects
* something like `tweak(reconfigure(invert(fn)))`
* how would you do that
* well actually you can just do `newFn: template tweak(reconfigure(invert(fn)))`
* in fact, if an object is supposed to take in an object
* it will specify so by accessing properties
* and in that case, passing in a function won't work anyways

* but it does feel like functions are treated differently from objects
* like if you make functions templates
* it doesn't seem to make sense that they would activate when cloned
* they should either be permament templates, or not a template at all


### Compatibility - One-Off Templates and Permanent Templates

* can you replicate permanent templates with one-off templates?
* not really...with permanent templates you can do `myTemplate->` and run the template
* but if we made functions just objects with a special property, `->` would just be property access
* and property access is a read-only operation, doesn't make any changes


* notice that if you had a some transformations that treated the input as an object, not a template
* then you can't pass in a permanent template
* because the transformation would be cloning the object and then accessing properties
* likewise, if you had a transformation that treated the input as a function/permanent template
* you can't pass in an object
* because it might be calling the input, and you can't call objects
* one-off templates and permament templates are incompatible
* and they increase ambiguity
	* you would constantly wonder: should I use a one-off template here? or a permanent template here?
* and every transformation you make, you would have to choose whether to tailor it for one-off or permanent templates


### Detecting Feedback

* we talked previously about how we shouldn't prevent feedback
* because its a mechanism that can arise naturally from independent actors
* and we don't want to restrict the behavior/freedom of our actors
* however, note that we can detect feedback in local systems
* if we use the breadth-first-search traversal of stepping through updates
* if one update pass has the same number of updates as the previous update pass
* there must be feedback
* because in acyclic graph, there will be nodes that have no dependencies
* and those will be fully resolved by the next update
* actually the number of nodes isn't enough,
	* because an update pass might resolve 10 nodes, but also introduce 10 new nodes that need updating
* we need to keep track of the exact nodes that need updating at each pass

_if the nodes that need updating ever stays constant between passes, we know there is feedback_

* while we can't prevent feedback across programs
* we can use feedback detection to warn the programmer of feedback within a single program
* and it can be used to catch bugs


### One-Off Templates vs Permanent Templates - Transform and Run

* one-off templates and permanent templates are two sides of the same coin
* for any template, you can do two things: modify/transform the template, or run the template
* one-off templates:
	* transform by creating a new template, `oldTemplate(template ...transformations)`
	* run using cloning
* permament template:
	* transform via cloning
	* run via calling
* whenever you "use" a template, you can choose to do either thing
* and it is a conscious choice
* only difference is, whether the default behavior for cloning should be to transform or run the template

* but this also means that we should only use one
* either one-off templates or default templates
* because if we had a function that takes in one-off templates `fn`, and another that takes in permanent templates `gn`
* then we can't pass in permanent templates into `fn` or one-off templates into `gn`
* unnecessary incompatibility

### Cloning Objects or Calling Functions inside @-Blocks

* when in a @-blocks, all clones/calls should also add the index as an argument
* eg

		onClick: @timestamp
			Deck.addCard()
			numClicks := numClicks + 1

* is the same as

		onClick: timestamp >>
			Deck.addCard(timestamp:^)
			numClicks.set(timestamp:^, value: numClicks.at(timestamp) + 1)

* this way, you can easily call handlers from inside a handler


### Multi-Variable / Composite-Index State Variables

* multivariable state variables
* what if you wanted to order it by `(timestamp, index)`

* maybe just create a new index that combines the two

		composite_index: timestamp + "," + index

* this composite is a string, so if we sort by lexicographical order,
* timestamp will have precedence, but if two indexes have the same timestamp, it will be ordered by `index` instead

### State Variables - Indexes and Comparators

* index doesn't have to be a number
* as long as it extends the comparison function
* because all a state variable needs to do for `set` and `at` to work properly
* is to order the entries
* so that you can insert and retrieve entries by index
* so the `set` and `at` functions just use `>` and `<` and `=` when figuring out where to insert/retrieve an entry
* so as long as your index supports those comparators, it should work

* numbers obviously support those comparators
* strings also do, using lexicographic ordering
* but you could create a custom comparable object

		my_comparable_object:
			_self: this
			_bigger_than: other >>
				if (someFn(_self, other)) => true
				else => false

* and then use this comparable object as an index for state variables

		someStateVar.set(my_comparable_object, "some value")

* note that the "less than" `<` operator will just flip the inputs and leverage the `_bigger_than` comparator

### Scoped Variables, Flexible Overriding, and Escaping

* when you reference a var, you are implicitly doing `_scope.<variable name>`
* eg `x: y+1` is short for `x: scope.y + 1`
* if you want to explicitly bind to a specific variable
* add some preceding parents, eg instead of `x` do `some.path.to.x`
* though note that this is still just short for `_scope.some.path.to.x`

* this makes it flexible
* ensures that you can "override at any leveL"
* discussed in a previous section (see section "Implicit Inputs/Functions and Bounding Scope II")

		foo:
			bar:
				x: y+1

		foo(y: 10)        // this will change the value of `x`
		foo.bar(y: 10)    // this also changes the value of `x`

* but then, how do we do `foo: foo` but make it so it references the outer scope's `foo` (no feedback)
* without specifying an explicit path, like `foo: some.path.to.foo`


* this is why the "escape" operator `^` is useful
* mentioned in a previous section
	// TODO: FIND REFERENCED SECTION


* this flexible overriding could be a cause for security concern
* if you can guess what variables a module is using
* you can override it
* even if they try to specify a path like `some.path.to.foo`
* if you can guess the path root (in this case `some`), you can override that instead

* the only way to guard against these hacks
* is to use a private var as the path root, `_some.path.to.foo`
* but that would require using private variables everywhere in your parent scopes
* just to guard against these attacks


### Functions as One-Off Templates

(continued from "One-Off Templates vs Permanent Templates - Transform and Run")

* in previous section, we talked about how we shouldn't have both one-off and permanent templates
	* see section "One-Off Templates vs Permanent Templates - Transform and Run"
* because they are two sides of the same coin
* and having both would create unnecessary incompatibility

* one-off templates seem like the most intuitive
* and the most in-line with our prototypal mindset

* so how should functions work?
* maybe functions should just be one-off templates
* when you use `=>` you automatically make it a one-off template as well
* so if you clone a function, eg `fn()`, it will "activate" the template

* and if you want to transform a function, you have to either use the `template` keyword

		newFn: someFn template
			x: 10

* or override `=>`

		newFn: someFn
			=> x*x     // override return value, which also makes this a template

* however, we should still use the `->` syntax if you want to extract the return value
* because otherwise, if we made `fn(...args)` automatically return the return value, it could look confusing
	* see section "Call Operator and Catching Mistakes"
* note that this means, even if you call with no arguments, you have to use `->`, eg `fn()->`

* actually we can make a special case
* if you have `someFn->` with no parenthesis, it automatically clones `someFn` before extracting return output
* because otherwise `someFn->` would always just be `undefined` anyways


* or maybe we _can_ make it so functions automatically return the output when called?
	* that way you could just do `fn(args)` instead of `fn(args)->`
* after all, we should be using verbs for functions and nouns for objects
	* see section "verbs vs nouns"
* so it should be clear if it's a function or an object

* though it still feels really ugly to have cloning syntax, eg `someObj(args)`, do different things based on if it's an object or a function

* we want to make syntax explicit and consistent

* however note that templates seems to be the only exception
* with templates, you don't know from the object name, whether it's a template or not
* so you won't know if you can "use" the object (aka access it's properties)
* but for some reason, one-off templates still ended up being the most intuitive mechanism for templates


### Compatibility - Objects and One-Off Templates

* recall that earlier we discussed how functions that handled one-off templates wouldn't work with permanent templates
	* see section "Compatibility - One-Off Templates and Permanent Templates"
* and vice versa
* which is a problem because, due to dynamic typing, it's always unclear what "type" an object is
* so we want to make our functions as universally compatible as possible
* so that we don't have to worry about "oh if I make this function take in one-off templates, then it won't work with permanent templates"

* so this was one of the reason why we got rid of permanent templates in favor of one-off templates
* prevents re-usabilitiy
* but this same sort of issue happens between one-off templates and regular objects

* templates are the only case where, we have to know if the object is a template or not
* if we want to use the object (aka access it's properties)
* does this create cases where you might have a function that works with objects, but not templates?
* and that was one of the reasons why we chose not to 


example:

	transform1: input >>
		a: input.x
		b: input.y

	transform2: input >>
		input.a
		input.b

	foo: template transform2(transform1(bar))


* seems like you should defer usage of `template` as late as possible
* so when defining transformations, don't use `template`

* this seems like functional
* where, if you want to "apply" the modifications and side-effects of a function
* you have to manually pull them out and apply them
* our language is like the opposite, if you _don't_ want to apply the modifications, use `template`

* the main difference is that, in functional, you can get function results without applying the side-effects
* in our language, the side-effects are bound to the result
* if you want the result, you have to apply the side-effects


* actually, there might be problems
* what if you wanted to do

		megatransform: input >>
			temp: transform2(transform1(bar))

			first: transform3(temp)
			second: transform4(temp)
			=> (first, second)

* technically, if you pass in a modifier, eg `console.log`, then the transformation should only result in 2 modifiers
* but will `temp` also result in a third modifier?

* what we want is to be able to pass in something like `console.log` and get two result templates, eg `log1` and `log2`
* and then we can do `log1("hello")` or `log2("hello")` to actually execute the behavior
* but is that possible with this code?
* this would be possible with permanent templates, but what about one-off templates?

another example

	fiveflavors: input >>
		flavor1: input(console.log("flavor1"))
		flavor2: input(console.log("flavor2"))
		flavor3: input(console.log("flavor3"))
		flavor4: input(console.log("flavor4"))
		flavor5: input(console.log("flavor5"))

	obj:
		name: "obj"
		console.log("obj run")

	temp: fiveflavors(obj)  // somehow we want to prevent it from running here
	temp.flavor3()          // but we want it to run here

* notice that we can't just make `temp` a template, because then we can't access `temp.flavor3`
* this would work if we made `obj` a permanent template, and then just called it with `temp.flavor3()->`
* but we want to get rid of permanent templates

* we could write another version of `fiveflavors` to use templates, but that would ruin the point of reusability
* we want `fiveflavors` to work for both objects and templates

* if we truly want to get rid of permanent templates, we have to show that everything that can be done permanent templates,
* can also be done with one-off templates

* it does seem like we can do this with one-off templates, in a weird way
* instead of passing in `obj`, pass in an empty object to "gather" and aggregate all the definitions and transformations
* and then apply the aggregated transformations once on `obj`
* like so:

		temp: fiveflavors( () )
		obj(temp.flavor3)

* notice that we do `obj(temp.flavor3)`, not `temp.flavor3(obj)`, because we want the transformations to take precedence over existing properties in `obj`

* there is still one major difference between this method and using permanent templates
* in this method, the call `fiveflavors( () )` will log "flavor1", "flavor2", etc, to the console
* whereas with permanent templates, `fiveflavors( permanentTemplate )` will not log any of these to console
* note that if `fiveflavors` had some other logging hidden in private behavior, eg

		fiveflavors: input >>
			flavor1: input(console.log("flavor1"))
			...

			_hidden:
				console.log("hidden")

* there is no way to prevent this from being logged
* we need to clone and run `fiveflavors` in order to extract `flavor3` in the next step
* however, the log statements for "flavor1", "flavor2", etc, are different
* the statements aren't really part of the running behavior of `fiveflavors`
* it's more like definitions that are being passed into the `input`

* it seems like a lot of this weirdness stems from the fact that templates change how cloning works
* and cloning is such a fundamental operation that isn't affected by pretty much anything else


* it seems like the difference is
* permanent templates, the caller controls what happens (if the output is a template or not)
* with one-off templates, the callee controls if the output is a template or not


* this sort of makes sense
* if you wanted `fiveflavors` to be like, a template-making factory
* then you would explicitly say so
* eg

		fiveflavors: input >>
			flavor1: template input(console.log("flavor1"))
			...

* and then the user can select which template they want

		fiveflavors(obj).flavor3()


### Cloning and Reference Transfer

* since functions are objects, we end up with some complications using the `this` keyword

		foo: bar
			console.log(this.name)   // this will actually print `console.log.name`, not `foo.name`

* notice that if we used `this`, then since we are cloning `console.log`, the `this` will actually refer to `console.log`, not `foo`

* maybe we should just reference by variable name

		foo: bar
			console.log(foo.name)

* note that if `foo` is cloned, then the clone's `foo.name` reference will be bound to the clone, not `foo`
* if you wanted it to always bind to `foo`, you would have to use the parent of `foo`
* eg

		parent:
			foo: bar
				name: "original"
				console.log(parent.foo.name)

		parent.foo(name: "clone") // the clone will still reference foo's original name, so this will print "original"

* this is important, and I'm not sure if we have mentioned it before
* basically, when cloning an object, any references to variables inside the object,
	_including references to the the object itself_, will point to the clone instead of the object
* the references are "transferred" to the clone


* note that this also means we have to be careful about anonymous objects,

		fn(10, 20, someObject(...))
			console.log( ???.name )

* there is no way to refer to the clone we are making of `someObject`
* instead, we would either have to give it a name:

		temp: someObject
			console.log( temp.name )
		fn(10, 20, temp)

* or create a `_self` variable:

		fn(10, 20, someObject(...))
			_self: this
			console.log( _self.name )

* this is similar to how [`that` is used in javascript](https://stackoverflow.com/questions/14871757/use-of-that-keyword-in-javascript)


### Virtual Properties and Plugins II

(this was actually sort of explored in the section "Virtual Properties and Plugins")

* notice that often for functions
* eg `shortestDistance` or `treeHeight`
* it makes more sense for them to be properties
* for example, instead of

		binaryTreeHeight: tree >>
			tag #height.

			// calculate height of all nodes
			for node in tree.nodes:
				node.#height: Math.max(node.left.#height | 0, node.right.#height | 0) + 1    // define our height as the height of our left or right subtree + 1

			=> tree.#height   // return height of root node

* instead we can define `height` as a property of some library

		someLibrary: tree >>
			height:
				...

* and then use it like so:

		extendedTree: someLibrary(tree)
		extendedTree.height

* another way we can use it

		tree.apply(someLibrary).height

(recall that `x.apply(fn)` is the same as `fn(x)`)

* another way to do this could be using tags

		tag #someLib:
			[someTree]: someLibrary(someTree)

		tree.#someLib.height

* this should work, because of object-key inversion, `tree.#someLib.height` is the same as `#someLib[tree].height`

* perhaps another method

		tag #someLib: (default: someTree => someLibrary(someTree))

		tree.#someLib.height


### Tag Syntax - Indirect Modification Syntax instead of Insertion

* I've been considering using indirect modification syntax, eg `someObj.#tag: value`, for tag syntax / virtual property syntax
* I was already doing this in the updated Readme, but I've decided to stick with it

* when using tags, instead of doing

		foo <: #tag: value

* we do

		foo.#tag: value

* it's simpler and cleaner

* also note that referencing around the tag directly, will pass around the hashmap
* eg

		for obj in #color:  // get all objects tagged with #color
			...

* or

		// create a clone of the spotify recomendation engine, passing in my personal likes
		myRecommendations: spotifyRecommendationEngine(#mylikes)

(note that this spotify recommendation engine example was previously mentioned in section "Separating Virtual Properties From Private Properties")


### Firewalls - Tools vs Services

* one of the imporant ideas mentioned in Cono
* is that we want to push for tools, not services
* instead of giving our information and data to companies, so that they can give us useful data like recommendations
* the companies should instead provide tools that we can run on our data ourselves, so we don't have to give our data away
	* and note that we aren't actually running the tool on the data ourselves, that would take forever for stuff like recommendation engines
	* instead, it is run on a distributed network of servers, but using garbled circuits and other encryption methods to ensure privacy

* we want to promote this mindset in our language as well
* notice the spotify recommendation engine example in the previous section, "Tag Syntax - Indirect Modification Syntax instead of Insertion"
* we don't want to give away our personal likes, `#mylikes` to spotify
* one solution is to force spotify to open source their engine so we can do a surface copy, a pseudo-clone (ensures no side effects)
* but spotify also shouldn't have to expose how the engine works

* this is where firewalls become useful
* just firewall the engine clone, so that it can't send any outgoing data
* this will encourage companies to make "self-contained" tools
* tools that can work without making any requests to outside servers

### Virtual Properties and Cloning II

(continued from "Virtual Properties and Cloning" and "Separating Virtual Properties From Private Properties")

* currently I'm thinking about tags and virtual properties, as just syntax shorthand for hashmaps
* but in the section "Virtual Properties and Cloning" we mentioned that tags should be carried for clones that happen within tag scope
* do we still want that?

* what if we have something like

		#tag.
		coll: collector

		for x in nums:
			x.#tag: x*x
			coll <: x()   // clone x, does this carry over tags?

* notice that since `for` is short for `forEach`, the `forEach` function is the one performing all the clones
* so is that "outside" the tag scope? would the `#tag` tags be carried over?

* actually, even though the cloning is happening outside the tag scope
* the cloning operation was defined inside tag scope
* so when we did:

		coll <: x()   // clone x, does this carry over tags?

* it could actually be short for

		temp: x()
		temp.#tag: temp*temp
		coll <: temp

* so we can make it so that tags are carried over, even if they are performed outside the tag scope
* as long as the operation is defined within the tag scope


### Tags - Default Values vs Manual Assignment

* let's look back at the tree height example

		binaryTreeHeight: tree >>
			tag #height.

			// calculate height of all nodes
			for node in tree.nodes:
				node.#height: Math.max(node.left.#height | 0, node.right.#height | 0) + 1    // define our height as the height of our left or right subtree + 1

			=> tree.#height   // return height of root node

* notice that we have this function for calculating a node's height based on the height of its subtrees
* but that means that we have to apply the function (aka attach the tag) to every subtree as well

* there is another way to do tree height

		binaryTreeHeight: tree >>
			tag #height:
				[node]: Math.max(node.left.#height | 0, node.right.#height | 0) + 1      // define our height as the height of our left or right subtree + 1

			=> tree.#height   // return height of root node

* using dynamic tags inside the tag definition, is one way to set a "default" value for a tag
* this way we don't manually apply the tag to every node

* this is pretty much like functional now
* `height` is just a function we are applying to the root node, that recursively will apply itself to child nodes

* though we can also use this default-value method for `shortestDistance` example
	* (from section "Shortest Distance Example - Default Value of Infinity")
* and it will be different from recursion:

		shortestDistance: graph start end >>
			tag #distance:
				[node]: ...
					if (node = start)
						node.#distance: 0
					else
						node.neighbors.map(n => n.#distance | infinity).get(Math.min)-> + 1    // find neighbor closest to start (aka shortest #distance), and add one to its distance

			=> end.#distance

* notice that we don't have a `visited` variable
* with recursion, we would need to maintain a `visited` set to make sure the recursion doesn't go on infinitely
* but because we use feedback instead of recursion, we don't need `visited`

* notice that the default value block looks very similar to the manual value block in our original `shortestDistance` example
* this is because default values are basically like doing

		for object in allObjects:
			object.#tag: <default value>

* this is why sometimes we would want to manually tag
* if we want to build things in a "constructional" way

		for object in someSet:
			if (condition)
				object.#tag: someValue

		for object in anotherSet
			...etc etc


### Tag Mechanics Summarized

"Virtual Properties and Cloning"
"Separating Virtual Properties From Private Properties"
"Virtual Properties is just Property Access Syntax for Hashmaps"

"Tag / Virtual Property Syntax - Indirect Modification Syntax instead of Insertion"


object-key inversion mentioned in sections:
	first mention in "Private IDEs and Browsing Contexts II", but also mentioned in "Implementing Hashmaps and Property Insertion"




