
### Axis is now Firefly, and a new direction for the language

* back in the section "Name Brainstorm April 2019" I mentioned that I chose Axis over Firefly
   * because Axis felt more fitting for a language and Firefly felt better for a product (eg an IDE)
* however, I'm going back on that now for a few reasons:

1. Firefly has more personality
   * many programming languages have quirky names, eg Java or Python or Go
2. Axis is too pretentious
   * when I was researching SmallTalk, they mentioned that it was named that because many other langs at the time had big names but didn't do much
   * I want to pay homage to that, and give a more unassuming name
3. ta new direction for the language
   * or rather, I have honed the goals to be a bit more specific
   * I want the language to be for artists, prototypers, hackers, and live coders
   * it's meant to make small quick apps and microservices that run in swarms and decentralized networks
   * so Firefly is much more fitting to that
4. I already have ideas on how "Firefly" can make for a cool website





an actor can spawn finite actors but infinite updates (feedback)


### Contracts - generalizing insertions and state variables

insertions are just an added global input and output to all vars
state variables are just an added default input to all scoped vars
maybe we can generalize this
contracts: you can create scopes where all variables inside have to conform to certain rules/interfaces
so for insertion, the contract is that all variables have to have a "insertion" input and "outsertion" output
for state variables, the contract is that all variable have an "state input" input



### Restructuring the interpreter - primary and secondary constructs

right now the interpreter is a bit ugly
a lot of the Node types don't feel like they are "core" operations
references and property access feel like they should be the same
the `Node.clone()` function (not to be confused with `CloneNode`) is rather hacky for many nodes

I want to rebuild the interpreter in a simpler, more elegant way
starting from core concepts

references == mappings
every reference is a mapping
for example, `foo+3`, the `foo` might look like a reference, but it's actually a mapping `sum(a: foo, b: 3)`

Primary Constructs

* creation / mapping / combining
* de-reference / property access
* insertion

then we also have secondary constructs, which can be reduced to combinations of primary constructs

* binop -> cloning + property access
* ternary -> cloning + property access



* one of the difficulties I faced with the interpreter is handling feedback
* if we have something like this:

	km: m/1000
	m: km*1000

* in what order should we create the nodes?
* if we create `km` first, then while we are creating `km`, how do we resolve `m`? `m` hasn't been created yet
* same issue arises if we try to create `m` first

* one way to think about this is
* imagine if we were making an interpreter for the old version of Nylo, aka a functional non-reactive language
* evaluation could be done via recursion, backtracking from the output (lazy-evaluation) and making calls as needed
* so let's say we want to evaluate the following

	distance:
		km: m/1000
		m: km*1000
	=> distance(km: 7).m

(in the following, primary constructs are in _italics_)
* in the beginning, nothing is evaluated, not even the `/` or `*` calls inside `distance`
* so no issues with feedback yet
* we start by evaluating `distance(km: 7)`
* in `distance(km: 7)`, all we do is override the `km` property inside `distance`, still no evaluation yet
  * this is just a _mapping_ operation
* when we get to the _property access_ `.m`, now we finally need to do some evaluation
* first, let's represent `/` and `*` with their equivalent functional forms

	distance:
		km: div(m,1000)->
		m: mult(km,1000)->
	=> distance(km: 7).m

* now we can see that when we access the `.m` property, we have to first evaluate `mult(km,1000)`
* the `km` in this case is a reference to the `km: 7` override we made previously, so we resolve that first
  * recall that references are just _property access_ performed on the scope
* then we _map_ `km` and `1000` into the `mult` object
* after that, we _access_ the output `->` property of the `mult` operation (which itself may execute a bunch of internal evaluations)

* thus, everything is reduced to 2 primary constructs: mapping & property access
* for Firefly, we only need to add one more core operation, insertion

* but what if we want a reactive persistent program?
* we can actually reactivity as continuous evaluation
* 

* now how do we go from the AST to the evaluation step?
* we need to somehow link things together to prepare for evaluation
* but we don't want to confuse this with the "mapping" core operation

* maybe all we need to do is create the scopes for each object
* well...no...scope is not a primary construct

* we need to do everything that _isn't_ part of the core operations, anything that isn't part of evaluation
* so basically a bunch of conversions
* convert binops and ternaries into their equivalent forms
* convert scoping into equivalent forms
  * create a `_scope` property in each object
  * nested scopes should inherit parent scopes
  * references to scope should be converted to property access on the `_scope` property
* nested structures should be flattened, nested object definitions should be moved to a template at root level, and a clone operation in the parent object
  * // TODO: FIND REFERENCED SECTION

* is all this necessary?
* can we do it in a simpler way using recursion?

### Restructuring the interpreter - intermediate transformations

* actually i guess what i have already isn't too bad after all
* it just feels so much uglier than interpreters for functional or imperative langs
* for a functional lang, you can just recurse backwards from the output
  * but we can't do that because my lang has to be eagerly evaluated
* in an imperative lang, you just maintain a current execution context and function stack, and go line by line
  * but I can't do that because everything is running at the same time

* though I guess the fact that my interpreter has to work so differently from traditional interpreters
* shows how radically different my lang is :O


* actually I've decided to change one major thing about my interpreter
* I'm going to add an intermediate transformation step between the AST and the interpreter
* this is for transforming any syntax sugar into core operations
* and it will make things easier when I add more syntax sugar later along the road

* for now, these transformations are:
* turning binop and ternary nodes into function calls (aka cloning + prop access)
* flattening nested scopes, implementing scope using cloning



* how do we transform scope into primary forms?
* Normally in imperative languages, it can be transformed during parsing, because the arguments are static
  * as in, if we did `fn(10, 20)`, then we know there are exactly two arguments, and their ordering is set during compile time
* if Firefly had static arguments, we could manually iterate over each argument and override callee properties one by one

### Combining/Merging and Security Issues

* however, what if we had something like javascript's `Function.apply()` method, where the arguments are provided as an object
* I'll call this **merging**, or **combining**
  * we've actually been using `combine{...}` before, see section "Implementing Scope - Flattening Nested Structures"
* in this case, the arguments would be "dynamic"
* the parser doesn't know which properties are being overriden and how many
* in fact, the caller doesn't know either

* usually when you clone, you have to manually provide each argument
* so you can only override private vars if you know them

```
foo(a: 10, b: 20, [sharedKey]: 30)
```

* but if we allow dynamic arguments, then could there be security issues?
* for example, if we had `merge{foo, bar}` or `foo.apply(bar)`
* if `foo` and `bar` had private vars with the same keys, then `foo`'s would be overriden
* even though the caller might not be able to even see those private vars
* the caller is combining private vars without knowing about them

* if two objects have a shared private variable, and an outsider merges them, could cause unknown effects

* one example is, if club members had a private "nickname", visible only to other club members
* an outsider could combine two club members, and override the nickname

* notice how this doesn't happen with static arguments
* if we only allowed static arguments, then you would have to manually pass in each argument

```
foo(x: bar.x, y: bar.y, .....)
```

* and the caller would only be able to pass in arguments that they had keys for
* they can't merge properties that they can't see

* maybe don't allow merging, only allow stuff like `foo(...bar)`
* in this case, `foo(...bar)` expands the properties of `bar` that the caller can see, and gives them to `foo`


* hmm, going back to the club member example from earlier
* what if instead of a shared private property, why not a use a private tag

```
private #nickname
Robert:
	#nickname: Bob
```

* I guess the difference is that during cloning, the tag won't be preserved (if you clone club members)
* we mentioned this in a previous section when talking about the difference between tags and properties
* but, maybe we shouldn't preserve the nickname when cloning club members
* what if we always used tags instead of private vars?

* well what about a private mutator
* eg `someCommunity.postAnnouncement()` should only be available to moderators
* but at the same time, it can't be a tag because you should be able to clone `someCommunity` and carry over the mutator

* simplest safest solution would be to make `foo(...bar)` a shallow copy of bar's properties as arguments, as mentioned earlier
* this is what the syntax of such an expression would suggest anyways

* however, then what about insertions? 
* how do we carry those over?
* are mixins even possible in this method?

* kind of. You can do something like

```
foo(...bar())
```

* what this does is:
  1. creates a clone of `bar` (cloning all insertions and children)
  2. manually copies the properties into the arguments of `foo(  )` before cloning `foo`
* note that in this method, properties of bar can effect foo, but properties of foo won't effect bar
* whereas if we allowed `merge{foo,bar}`, then the behaviors would merge and affect eachother
  * recall the sections "Clones and Calls Declared Inside the Arguments" and "Implementing Scope - Child Scope vs Arguments Scope II"

* I still don't want to fully abandon the concept of merging though
* I'll have to come up with a more concrete example with shared private properties and merging, to further investigate the security implications


### Dynamic Scope

* previously we decided to choose "child scoping" rules (see section "Implementing Scope - Child Scope vs Arguments Scope")
* basically, this means that the behavior of a module is scoped by the module itself first, and afterwards the original caller/callee scope
* to be more precise, in something like

```
foo:
	a: 10
	b: 20
	bar: a+b  // will be 30
	zed: a*b
foo_clone: foo
	b: 5
	bar: a-b  // will be 5
```
* first, note that `foo_clone` inherits `zed`, which references `b`, which resolves to the new value of `b` that `foo_clone` provided
* this normal behavior compared to other languages
* however, also notice how `foo_clone` inherits `a` from `foo`, so `foo_clone.bar`'s reference to `a` resolves to that inherited variable
* normally, in most languages, the `a` in `foo_clone.bar` would be undefined
* this also makes the scoping behavior a bit more symmetric
* inherited behavior can reference new values, and new behavior can reference inherited values

* we called this "child scope" before, to distinguish it from "arguments scope" (which is what I called the mechanism that most other languages used. Perhaps a more apt name would be "caller scope")
* I called it "child scope" because the behavior of a child is scoped to its own properties, instead of being scoped to the parent or the caller

* but perhaps a better name is "dynamic scoping"
* because we can think of an object's scope as "dynamic", because when it is cloned, the new behavior re-binds to the new values/properties it has in its scope


### Denote private behavior using _

* we can use the `_` special keyword anytime we want to denote private behavior

```
foo:
	someFn()   // this is a public list item
	_ someFn() // this is private behavior
```

### Implementing Scope - the static property list

* we have previously talked about implementing scope using primary constructs
  * eg in section "Interpreter Implementation - Reference Resolution and Initial Pass Revisited"

* I guess one of the confusing aspects about implementing scope, is that it is so similar to merging/cloning
  * (note that it's ok to have combining/merging inside the interpreter implemetation, as it is a core operation. The previous section is discussing whether we should expose merging as part of the language as well)
* if we had

```
parent:
	...
	child:
		...
```

* `child`'s scope overshadows `parent`'s scope
* so the properties of `child_scope` override `parent_scope`
* in a way, we can say `child_scope: combine{parent_scope, child}`
* but this seems almost too similar to cloning
* almost seems circular, how we are using `child` to create `child_scope`
* even though `child_scope` should be a part of `child`...

* but actually, it's important to note one distinction between merging scope, and cloning objects
* when merging scope, we don't perform any insertions or side effects
* merging scope just combines a list of properties
* so it's actually more like `child_scope: combine{parent_scope, child_properties}`
* `child_properties` is just a list of properties created alongside the definition of `child`
* this list of properties is just references to the source object's actual properties, sort of like a shallow copy of the object
* eg

```
parent:
	...
	foo:
		a: 10+input
		b: someFn(20, 30)->
		c: b.someProp
	foo_properties:
		a: foo.a
		b: foo.b
		c: foo.c
	foo_scope: combine{parent_scope, foo_properties}
```

* this way, when we merge scopes, we are just overriding references
* we aren't creating any behavior

* in terms of implementation, this is actually rather simple as well
* for cloning, a `CloneNode` can create nested `CloneNode`s, which leads to recursion
* however, while scopes leverages cloning, since each scope is just a list of references, with no nested behavior, then there is no recursion

* however, there's one problem
* inside `foo_properties`, we are referencing `foo`
* but how can we reference `foo` without the concept of scopes??
* references are supposed to be implemented via scope & property access
* but here, we are implementing scope via references
* circular!

* maybe the "references" inside `foo_properties` are not actually references
* they are direct bindings to `foo`, statically created during interpretation
* just like how, in the expression, `a.b.c`, the member access `.c` is directly bound to the result of `a.b`
* so when the parser/interpreter sees the definition for `foo`, it creates this `foo_properties` object, with each property being a direct binding to a corresponding property in `foo`
* then `foo_scope` is also created using a combine operation on `foo_properties` and the parent scope
* thus, these `xxx_properties` and `xxx_scope` objects are static structures created at "compile" time
* aka during the AST transformation



* what's nice is that, this implementation of scope is rather robust
* for example, recall the previous section, "Merging, Dynamic Arguments, and Security Issues"
* we can start safe and not allow merging
* but if we do end up adding it to the language, our implementation of scopes won't have to change
* in fact, implementing scope is what brought up the discussion of merging and security in the first place
* but in the end, that discussion proved irrelevant to our implementation for scopes

### Dynamic Property Lists?

* in the previous section we talked about creating a static `xxx_properties` list alongside any created object
* but what if the object definition was dynamic
* eg if we had something akin to javascript's `Object.fromEntries(entries)`
* if `entries` changes, then the resulting object changes, as well as the property list
* and we can't just dynamically generate the property list, because everything dynamic should happen in the evaluation phase, and everything in the evaluation phase should be implemented using primary constructs

* well let's see how a "polyfill" for this might be written

```
fromEntries: entries >>
	res: Map()
	for ((key, value) in entries):
		res.set(key, value)
	=> res
```

```
fromEntries: entries >>
	res: entries.reduce(...)->
		reducer: acc, entry => template acc([key]: value)
		initial: ()
	=> res()
```

* hmm but reducer method introduces order
* and Map() method uses a secondary form `Map()`, which begs the question, how is `Map` implemented?
* maybe we should provide a primary form for dynamically creating properties
* something like

```
fromEntries: entries >>
	for ((key, value) in entries):
		[key]: value
```

* note that this kind of syntax was previously explored in Readme_old.md section "Dynamic Keys"
* "Implementing Hashmaps and Property Insertion - Dynamic Properties"

using the `combine{...}` primary construct

```
fromEntries: entries >>
	=> combine{...entries.map(fn: ((key, val) => (...)))}
		[key]: value
```

* this is good because it is unordered, unlike the reducer method
* note that this is technically still a static property list
* so this does not violate the scoping transformation mentioned in the previous section, "Implementing Scope - the static property list"
* this is important, I can implement the scoping transformation without worrying about dynamic properties
* and I know it is powerful enough to capture behavior like `fromEntries()`


* the syntax is rather ugly tho
* gah so many parenthesis
* could i extend the for-loop to do something similar?

```
fromEntries: entries >>
	=> ...for ((key, value) in entries):
		[key]: value
```

* i'll have to explore this later

### Dynamic Properties - Matchers vs Computed Properties

* note that we have been mixing up two types of dynamic properties
	1. matchers, eg `[key]: key*key`
	2. dynamically computed keys, eg `[someValFromScope]: 10`

* matchers are pretty much the same as functions, and could technically allow for infinite streams/lists
  * also creates dynamic property lists
* dynamically computed keys would still ensure finite and static property lists (as mentioned in the previous section, "Dynamic Property Lists?"

* computed properties seems like something we should definitely in the language
* matchers...I will have to think more about, since you could always just use a function instead of a matcher

### Arrow Functions vs Pass-By-Behavior

* we discussed a lot earlier about how arrow functions have to be wrapped in parens
* eg `someFn((a,b => a+b))`
* because `someFn(a,b => a+b)` implies that we are overriding the properties `a`, `b`, and `=>` inside `someFn`
* note that passing in functions is a bit cleaner if you specify property name, eg
* `someFn(callback: (a,b => a+b))`
* however, note that due to pass-by-behavior and dynamic scoping
* often, we don't even need to pass in a function
* for example, if we wanted to call a function that makes an async data fetch, and then does something with the data:

javascript:
```javascript
fetchData(data => {
	doSomething(data);
});
```

firefly:
```
fetchData(data >>
	_ doSomething(data)
)
```

* since `data` is a variable that is provided by the `fetchData` module, we can just reference it in the behavior we pass in



* before, we relied on traversing the tree structure to figure out what to clone, and then stopping at references
* but that becomes less useful once we get rid of references and add in private behavior/properties
* instead, I will switch to the model outlined in section "Anatomy of a Module"
* essentially, every object will consist of a bunch of behavior nodes, and a property list
* three types of behavior nodes: member access, insertion, combine
* the property list is just a list of {key, behavior node} mappings
  * but not just individual nodes, partitions of nodes
* during a combine operation, the partitions of each parent are combined together



external vs internal bindings

whether or not something should be cloned is node-based (either the node is inside or outside the object)
but references are edges
in addition, references are a syntactic construct, but scope is a language construct

some problems: ref


important note: scope is outside the object itself
this should be obvious because the a child doesn't simply clone the scope, it's constructed
thus, any references to scope are external references, so that is where the "clone propagation" stops
whenever you create/clone an object, you override the `_parent_scope` and `_property_list` properties, and those are what create `_scope`
important to note that when I say `_scope: combine{_parent_scope, _property_list}`, these references to `_parent_scope` and `_property_list` are not actually references, they are actually direct bindings
it's just easier to write it out as if they are references



dynamic scope: now scope is more like classes and `this`, rather than block scoping


### Scope Combination is Static

* note: parent scope is different from parent caller
* don't mix up scoping and cloning, scoping is a syntax construct, cloning is a language construct
	* scope combination is not something that happens during cloning, it is combined statically during parsing
	* while defining nested objects has both a clone operation and scope combination, they are different things
  	* its is possible to define clone operations without scoping
	* though it's also important to note that cloning/combining does _override_ scopes, which is a little confusing
* in fact I was sort of mixing this up
  * nested scopes is a syntax construct, and transforms into the `_scope` property in all objects
  * the "parent" scope is only a construct that exists in the syntax
    * hmm i guess this means in the transformation phase, i don't need to use combine/clone to combine scopes, since the scopes should already be statically combined before the evaluation phase
  * but when things reference/access scope, it is more akin to like how classes access their own member properties
  * and when you override properties, that is a dynamic operation, and happens during evaluation

I guess another way to think about it is
`_parent_scope` is a private variable passed in from the surrounding scope, and then combined with the private property `_propery_list` to form `_scope`
and whenever you clone the object, you override variables in `_scope`
though actually, this makes it sound like scope combination is dynamic, and happens during evaluation...

another indication that scope combination is static, is that, if there are any private variables in the enclosing scope that are not syntactically referenced by the nested scope, then it is impossible for that nested object to ever access that variable
example:

```
parent:
	_someVar: 'hi'
	child:
		x: 10
```

no matter how you try to clone or override `child`, you will never be able to access `_someVar`
it also shows that we should not be passing `_parent_scope` as a private variable to the nested scope
because the variables that are not referenced in the nested scope, should not be passed in




### re-thinking scope: cloning over a network

notice how we are combining dynamic and static scope
maybe we could separate it into scope and `this`
are there security problems with combining dynamic and static
originally we allowed overriding anything
firewalling
containerization
why should you have control over behavior that is private
originally we conceived of firewalling to mimic what is possible on your PC
but what if the source (callee) program isn't running locally
how can you just clone it, bring it to your PC, and start firewalling it
what's to stop the program from reporting back to the callee program first, before going to your PC
and why would the callee send you the program to run, instead of running it on their servers and just sending you the output

imagine if somebody overrode the String concatenation method, to report what strings were being concatenated
every program that was publically released, would have to safeguard against these things

at the same time though, containerization is a powerful tool
that should be available, perhaps only to whoever has the source code of the program
I guess another way of thinking about it is, if you have the source code, you can do a "shallow copy" of the program
and just re-interpret the program inside your custom container
so it's not really cloning anymore
cloning is an option that services can expose to users, to copy a behavior with some configurable parameters
whereas shallow-copy allows the programmer to configure anything

I guess whatever is visible to the user, is configurable
so if we had something like

```
foo: 10
bar:
	a: foo*2
	[b]: foo*3
	_c: foo*4
```

`a` is public, so anybody can override the `foo` in that expression (`foo*2`)
`[b]` is shared private, so anybody with that key can override the `foo` in the expression `foo*3`
`_c` is private, so nobody would be able to override the `foo` in the expression `foo*4`

note that, to override the value, the programmer would simply override the entire expression
eg `bar(a: someNewFoo*2)`


it seems simple enough to just make scope and `this` distinct, just like most other languages
if you want to reference scoped variables, you just reference them directly, eg `foo*bar` (this would be static)
if you want to reference properties in the current object, use `this`, eg `this.foo*this.bar` (this would be dynamic)
however, because we are using properties instead of function arguments, you will end up using `this` a ton, eg

```
divide:
	num, denom,
	quotient: Math.floor(this.num, this.denom)
	remainder: this.num % this.denom
```

ugly
perhaps we can allow overiding scoped variables only in expressions visible to the user
as demonstrated in the earlier example with `a`, `[b]`, and `_c`

however, this can be confusing, because when you inspect an object, you might see variables with the same name from different sources
eg if a single object gets cloned many times by people with differing levels of visibility

### Combining/Merging and Security Issues II

There would be almost no point to private behavior if people could modify it
Every interface would just turn to
```
foo: ( ...input, ...somePrivateInternalFn(input))
```
Basically pulling out all private behavior to an internal fn so it can't be scope-modded

Should pulling behavior out into functions be used like this?
Single responsibility principle

When somebody is exposing an api, they shouldn't be worrying about cloning
Cloning is a feature, not a liability
The programmer defines the API to be cloned
They put behavior into the API because they want it to be cloned
But then, how does exposed private behavior work?

Declaring nested vars is supposed to be the same as defining an external template + cloning
// TODO: FIND REFERENCED SECTION
Often you use private vars as a simple intermediate to create a forked structure

    foo: a,b,c >>
      _x: a+b*c
      output: _x*_x

What should happen in this case?

What about

    _somePrivateScope: 
      a,b,c
      export foo:
        _x: a+b*c
        output: _x*_x

A lot of this would be solved by simply separating referencing scope and referencing self
Declare properties that you want modifiable
Reference self using `self.prop` or `this.prop` (or maybe `.prop` shorthand?)

But wait, remember that scope is just a syntax construct
How different is referencing scope and referencing self, if we didn't have scope?

Obfuscated scope:
If you try to containerize something from a difference scope
Any references to that different scope, are obfuscated
So you can't override them
Hmm but still, what about global functions like string concatenation
If you were, say, importing a react component that uses some operations like `fs.readFile`
And you wanted to mock them (eg use a fake in-memory file system)
What if the `fs.readFile` was inside private behavior?
well then the reference to `fs` would be obfuscated

Containerization is great for mocking
Normally, if you want to mock things
You have to modify the class to use dependency injection
Ugly
With containerization, you can simply override references
So in a sense, every dependency is already using injection

reference scrambling:
the only ugly part is, if say, you had private visibility for `foo`
and you were looking at somebody else's code, who had public visibility for `foo` 
and they created a clone of `foo`
you might be confused why certain scope references weren't overridden
but you have to keep in mind that maybe you have access to those scope references, but they don't
I guess this could be made more clear if you can view `foo` from their perspective

in a way, the person with public visibility for `foo`, when they reference it (in order to clone it), they are retrieving a scrambled version
it is almost like, the read operation is different depending on your permissions
however, that's not actually the case, the read operation always returns the same object
it's just, the user (in this case, the person doing the clone operation) isn't able to read some parts

hmm perspectives remind me of tags
// TODO: FIND REFERENCED SECTION
I wonder if they are related

there is actually one special case

    foo:
    	a, b
    	_x: a+b
    	result: _x*_x

in this case, even though `_x` is private behavior, when you override `a` and `b`, it overrides the references inside `_x` as well
this is because you are overriding the exact variables that the private behavior is referencing
it seems like our scoping/overriding rules depend on two things
public vs private
external vs internal (explained below)

    outer:
    	a
    	inner:
    		b
    		_x: a+b
    		result: _x*_x+a

in the above example, if you cloned `inner`, then the var `a` is an external reference, so references to `a` in private behavior are not overridden, while references inside public behavior (eg inside `result`) are overridden. The var `b` is an internal variable, so all references are overridden, regardless of if they are in public or private behavior
this seems very complicated and messy

another way we could handle scoping, is that you have to override the external scope if you want to override external variables
eg if you had a reference to `fs.readFile`, if you wanted to override `fs`, you would have to override whichever scope it was declared in
so if `fs` was declared in the OS-level scope, you'd have to override the entire OS
which sort of makes sense, because any other variables that are referencing `fs`, would also change behavior
if you have a bunch of external references in many different external scopes, you have to override the outermost one
perhaps you shouldn't be able to override a variable, without overriding all references to that variable as well

but variable shadowing allows for this exact behavior
you can declare a variable with the same name as an external variable, and all internal behavior will references the new internal variable (since it is shadowing the external variable), without affecting any external behavior that references the external variable
and since scope is supposed to just be a syntax construct, shadowing should be achievable without nested scopes
I guess difference is that with shadowing, you are defining the reference with the new variable in mind
With overriding , you are taking a variable that used to reference an external variable and shadowing the external one

There might be certain behaviors that won't work unless you override the var at the root level
Eg for `fs.readFile`, if there is some private behavior that initializes the file system, you won't be overriding it, so your new filesystem won't be initialized and the old one will
Though when mocking variables, this is normal, if you have input A and B that are actually transformations of the same root dependency, you still have to mock both of them

How does scoping in functional work
My method of flattening nested scope, and representing scope using cloning,
Seems similar to how functional represents multi-arg  functions into single arg functions
Using currying
In fact, in functional, every reference can be considered an argument
And then every argument is curried
How does currying work?
After each argument is provided, the function returns a new function with the argument value STATICALLY BOUND
(all references within the returned function are directly bound to the value)
I guess what I'm trying to achieve with scope overriding, is that all references are always dynamic, can always change
Always configurable
But the question is, are these references to external variables, meant to be configurable?
Arguably no, bc the object was written with those specific external variables in mind
Allowing those external variables to be changed, is kind of like hacking the object

but then again, you aren't hacking the original object
you are creating a new object
we have to recreate all these bindings and references anyways
so why not redirect some references while we're at it?
first, remember how cloning over a network works
objects can be distributed, run on multiple machines
so if Google released some service, FooService, and you cloned it
the clones of the private behavior in FooService might be kept on Google's servers
but the public parts could be created on your local machine
and since that public behavior is being created locally, you can tinker and hack all you want
after all, it could be thought of as simply overriding behavior so you can rewire certain parts
i guess one weird part is you are still maining references to some external variables of the original scope, while overriding the rest...

recall how perspective works
like how theres a "programmers" perspective and the object perspective
find referenced section
is this true? is there a difference?
this makes things much more complicated
when cloning, do we use programmer's perspective, or object perspective

maybe they are the same
scope, is the "perspective" of the object
if you want to, say, add a shared private key to your "perspective", you add it to your scope

    foo:
    	[sharedKey]: somevalue
    	bar:
    		// this scope now contains [sharedKey]

no need for the "key lists" mentioned previously (find referenced section)
hmm though not sure what key lists were even used for in the first place, so not sure what problem this solves

going back to whether or not to allow programmers to do merging/cloning
and the security implications
the problem is that, it seems to happen away from the caller
let's say Bob merges the spotify and soundcloud api
there is so much private behavior being merged, that he doesn't even know about
and if there are shared private keys between the two, then the merging could cause behavior unanticipated by spotify and soundcloud

what if we forced merging to happen from the scope of the caller
so instead of thinking of merging like `combine{spotify, soundcloud}`
we thought of it like
`(...spotify, ...soundcloud)`
like a mixin
basically, each object is cloned, and then behavior that is public (to the caller) is combined and exposed as new properties
but this way, any behavior that is not public to the caller, (1) does not do any overriding and (2) is not exposed as a property in the final object
It also makes sense, because the caller has to manually carry over properties, the caller has the responsibility of creating the new object
but wait does that mean private properties aren't carried over (even though the behavior is)?
What if you exposed an object with an watermark, so that anybody that cloned it, you could tell that it came from you
Mm I guess one way you could do this, is to do the cloning privately in your scope, and then give it to the caller

    someAPI: arg1, arg2
      _clone: someObject(arg1, arg2)
      => _clone

Notice how the combining is happening in the API itself, so it can carry over the watermark
And it also prevents the caller from merging stuff with `someObject` directly
Though does every API have to do this with every function, just to prevent hackers?

if we think about cloning over a network
recall how private behavior can be cloned and kept on the private server, away from the caller's local computer
maybe we can do the same thing with private properties as well
and private shared keys
so what exactly happens if a caller tries to merge two object with a shared private key (not visible to the caller)
let's say, for example, the spotify and soundcloud apis
should spotify and soundcloud each have their own separate values stored for that private shared key, even though they belong to the same object?
or maybe they privately negotiate and do the overriding on their private servers (still bad though, overriding shared private keys could cause unexpected behavior)

Private records:
Maybe each source API will keep private record of the private key values on their servers
Kinda like tags I guess
But they are carried over during cloning

but what if you had a private property based on the shared private property
whos value would it take from
remember that combining objects is like knowledge sharing, some variables in the first object may now depend on values in the second object, and vice versa
though perhaps...the caller has to mediate this knowledge sharing
if we think of the two source objects as external servers
the caller communicates with each server, telling them the values of each property
each server responds with the values of their properties
until convergence is reached
but the servers don't share private properties with the caller
likewise, shared private properties, would be kept separate on each server
variables in source A that depend on the shared private property, would see A's value for that shared private property
variables in source B, would see B's value for that shared private property
but what if some third party asks the caller for the value at the shared private property, does it take it from A or B?
or maybe the caller responds with undefined, since they don't know about the existance of that private property
but A and B know of it's existence...

Delegated cloning:
Maybe cloning syntax is short for delegated cloning
But then...how to pass in shared private key without exposing it to callee

Key list:
every object has to have it
a finite list of keys
Infinite public list doesn't make sense, because it's technically possible to hide keys in an infinite space
the whole point in providing a key list is to enumerate across the keys, would have no point if some keys were hidden
keylist is generated, alongside the scope object

Example iv been thinking about
What if a rogue club member decides to display his nickname
Then you could take the rogue club member and override their behavior with any other club member, and their nickname would be displayed

How does this cloning over a network work?
Private behavior is kept on private server, and values are sent directly to wherever they are referenced in the public behavior
But what if there are multiple private behaviors from different sources

Recall why we don't carry tags during cloning
Since tags are for when party A wants to add info to objects from party B
Party A has no idea which objects are derived from which
If they knew, aka if they were the ones creating the objects, they could use a private shared prop instead, defined inside the object itself
And the private shared prop would be carried over
Perhaps private shared props are carried over to clones if the caller has access to the key in their key list

A concrete example to consider
Imagine if a client asks to use Spotify API
The Spotify API exposes an endpoint with a watermark containing metadata info about the client
So that every time that API is used/cloned, the Spotify API can see which client it belongs to, and how they are using it (what arguments they are passing into the cloning)
Now imagine if SoundCloud did the same thing
And two users want to merge their endpoints together, eg create a function that posts to SoundCloud and Spotify at the same time
Doesn't make sense to have one watermark override the other
Makes sense to keep both
However, now it will have to be hidden, so that they don't collide
Which also sort of makes sense
Essentially, the merge just clones the two objects, puts them in a container, and manually copies public properties to the container
The user doesn't have to expose their clone to the public anyways
They could make the clone private
So Spotify can't just go around to every user asking to see their objects, to inspect their watermarks
But if the watermark (along with the call arguments) are exported back to Spotify via an insertion
Then it doesn't matter if it's hidden or not
But at that point, why use a watermark at all
Why not just export the metadata and the call arguments directly

overriding
in order for overriding to happen, the person doing the combining/merging has to know that both properties exist

no matter if the overriding is happening on the caller or the callee side

if it happens 
imagine `caller([private key]: fdsafdsa)`
if it happened on the private caller side
then callee would be passing the private key, and value
just in case the caller also has the private key, so it can do the overriding
is it possible to pass the key-value without exposing any privacy risk

essentially, every object is a function of (key) ⇒ value
in order to create a new object, you have to create a new function

completely private, both objects are cloned
then the caller copies public properties over

Completely public, both objects communicate all keys to eachother
Note that this doesn't expose the properties to outside
The combination/merging happens securely and privately inside the newly created object
However, still has the security issues mentioned earlier, merging can be taken advantage of to expose properties

Maybe when you clone objects, you have to explicitly specify args (but private ones are cloned)
And if you want to merge, you do (...a() ...b()) but you are manually transferring args so private ones won't be overridden
Feels ugly though, not symmetric
Also, what if you clone with a private key

In order for overriding to happen, somebody has to be aware of all private keys being put into the clone/merge
Unless we don't transfer private keys (that the caller doesn't know)
I guess another way to put it is, we can only transfer keys that we know about
If we want to transfer all keys, the somebody has to know all keys

so there are two options
either, we somehow secretly combine keys inside the child, without anybody else knowing (not even the parents)
or we only transfer and override keys that the caller knows about

what if we scrambled private keys?
that is, we expose private keys to the public, but as scrambled text
so when you define it, it may look like `_foo: 10`
but when it's viewed publicly, it looks like `fdio2nvi: ie2nv9szkl`
if you want to access it, you need to know two things: the scrambled key, and the encryption
(before, you only needed to know the key, because the key itself was the encryption. But since now the key is scrambled and exposed to the public, knowing the key isn't enough)
note that even if two objects have a shared private key, the encryption might be different, since the encryption could be based on the object id (this adds security, because shared private keys on two objects will appear like different keys to the public)
maybe you can even split it into pieces, `_foo: 10` turns into `fjdskaf: 91c0z0 , 18x0x: j31v`
and then you access the value by retrieving the pieces and reconstructing it
however, the problem is that bad actors can override these keys and see how it changes behavior
the keys are still exposed, and can be exploited
however, is this really a problem, trying to brute force values in a key to see how it changes the behavior, seems really impractical

wait but, if shared private keys were encrypted differently across different objects
then how would overriding work
somebody (the caller, callee, or child) would have to know that they correspond to the same key
so it all goes back to the same problem

Another example:
Web app template with password
You need to know enter a hard coded password in order to access the web app
Imagine if Joe made a webapp, and set his password
Somebody could easily expose the password, by cloning their own webapp that displays the password, and then merging it with Joe's webapp
Though I guess theres a bigger issue: if people are allowed to set their own passwords, then they have to know the private key for the password field, and then everybody would be able to access everybody else's password

### Caller-Responsible Merging By Sending in Props to Override

Actually, the caller can check which shared private keys are actually defined in the callee
And only send in the ones that are defined
So that the callee gets the shared properties to override
But the caller doesn't give away unnecessary private info
Also, this way both the caller and callee are aware of the keys that are being overridden
But all other private keys are hidden

In fact this shows how the child can be merged without exposing callee props to the caller and callee props to the callee
The callee clones their private behavior on their server
Caller clones their private behavior on their server
Shared (aka overridden) properties can be cloned on either, as long as they are aware of the override

If a caller is merging two third party objects together, they can only merge the props they are aware of
So it's basically like creating a new object and manually transferring props
What if when cloning, the callee has behavior dependent on a shared private property that has undefined value
Eg, `foo: this[someKey]+bar`
But this[someKey] is undefined
Then let's say the caller defines [someKey]
But they look at the callee and see that the callee doesn't have [someKey] defined, so they don't pass it in
And now the callee behavior won't bind to the new [someKey] value
(the webapp template example would actually have this exact problem)

How does cloning/merging work with public keys?
Much simpler, if everything was public

I think we need to analyze how cloning works and how privacy works, separately
And then see why we run into problems when we try to combine them
We need to carefully define a unified model of cloning and privacy

### Private Arguments and Closures

How do we pass private arguments?
Merging isn't enough
Eg, for the webapp template, how to you pass in a new password
If you use a shared key, everybody else who is using that template also knows the shared key
we explored private arguments before
    // TODO: FIND REFERENCED SECTION

Can be achieved by having a key that gets hashed and encrypted inside the child object, after creation
So if, say, every new object gets a unique and secret ID
And then we define a "private argument", which will get encrypted by the object ID after being bound to all references

Example

    foo: template _password, input >>
        => input==_password ? "success" : "wrong password"
    bar: foo("hunter2")
    bar("bla")-> // wrong password
    bar("hunter2")-> // success

In fact, we don't need to encrypt the key, we can just get rid of it
A private argument just creates bindings, but makes it impossible to reference that argument from the outside
Note that private arguments are also unnecessary if everything was public
So this is another thing to be considered in our unified model of cloning and privacy




Private arguments feel more like function arguments than object properties
Eg, they can only be set once
Which seems counter to how we designed properties in the first place
In fact, we chose default values over currying so that it didn't matter if a value was set or not, the object would behave the same way

(see section //TODO: FIND REFERENCED SECTION)

If they are so much like function arguments, why not just make them function arguments

    fooFactory: mypassword >>
       => input >>
          => input==mypassword? "success" : "wrong password"

Now we don't have to worry about private arguments
This is essentially a **closure**

(we actually explored this in the previous section "Calling instead of Cloning for Passing in Private Data")

What if we want to turn an existing API with public args, and hide them
This is a little more annoying
We have to transfer the properties manually, and we can choose not to transfer some properties
//TODO: EXAMPLE
One downside is that private properties are not transferred

It seems like we are seeing the case of shared private properties not being transferred a lot
In fact, at any point, the caller can always be hiding the child or transforming the child, and in those cases, the shared private property becomes useless
(talk about the watermark example)
Transferring shared private properties is just hoping that the caller doesn't do anything to the object afterwards, and exposes it for the callee to be able to access and extract those shared private properties
Which is rather futile to hope for

Perhaps this is not what shared private properties are supposed to be used for
Perhaps they are for, if the owners of the shared private key want to create a bunch of public objects with private properties that have the same key, so that they can run operations across them or something
We could enforce that during cloning, only the keys in the caller's scope get transferred, and it would still allow for the use case explained above
Though, that use case could also simply be achieved using tags

Maybe we don't need shared private properties
Public properties work like normal json/JavaScript properties, just references to values
Private properties are syntactic constructs for defining bindings, without exposing any references
We can restrict access to public properties using closures
Though recall that scope can be overriden
So to prevent against scope override attacks, we have to use private containers
Eg to fix the earlier example:

    fooFactory: mypassword >>
       => input >>
          _result: input==mypassword? "success" : "wrong password"
          => _result

Recall from our previous discussion that you can only override references if you have access to the behavior
So in this case, the reference to `mypassword` is hidden away, and can't be modified

I think we should simply think of privacy as a natural generalization of how properties work
Why are strings and number properties public?
Why are they enumerable?
Because we define them as such
Just because a reference to some internal value exists, doesn't mean we have to enumerate it
And so we need some sort of keylist that specifies which keys are in scope, which are enumerable
By default all string keys are added to scope
You can manually add more keys to scope, and these become shared private properties
But notice that if you don't use shared private properties, everything is simple and works as expected

I guess the whole idea is "what if some properties weren't enumerated", and that's where private variables came from

Actually, there's a difference between enumerable and in-scope
Enumerable means outsiders can see that that property exists
In-scope means that the caller can view, override, and merge that property
Declaring a shared private key makes the key in-scope but not necessarily enumerable
If you want to make the shared private key enumerable (aka not private anymore), you have to manually add it to the objects enumerable-keys list

Why not make all declared keys enumerable?
Why would you want to make a key in-scope but not enumerable?
If you want to pass the object around outside, but keep a property private, couldn't you just use tags?
(recall that if it is cloned by outsiders, it will lose its shared-private properties, just like it loses its tags)
I guess it could be useful if internally, you want to treat the property as just another property, carried over during clones and such
But then once you export that object out of scope, that property becomes hidden

If properties are carried over based on caller scope
Then what if you did

    callee([fn(10)]: "hello")

Notice that the key `fn(10)` isn't in the caller scope, it's declared in the arguments
This all still feels kinda complicated and unintuitive
If you are doing `foo(args)`, it seems intuitive that foo's shared private properties would be cloned as well (even if they are out of caller scope)
Why not transfer these properties for cloning, and just don't do it for merging
After all, there are no security problems:
1. if it is out of caller scope, then the caller can't modify it
2. if it's in caller scope, then the caller can modify
3. if the caller passes in a shared key that isn't in callee scope, then the callee wouldn't have any references to it, so the caller isn't leaking their private keys to the callee either

Though recall the argument that it's futile to assume the caller won't do any transformations
Eg proxies, or mixins
Perhaps it's best to just assume that the caller is responsible for creating the properties
So they can only create properties using the keys that are in scope

When you declare a clone argument, it implictly adds it to the caller scope, even if it's a private key

### Callee Responsible vs Caller Responsible Cloning

I guess what sort of trips me up is that it's technically possible to transfer a callee's private keys
For the sake of the example, we'll call the caller Joe and the callee Spotify, and the child Child
The cloning of the callee's private property can happen completely on the callee server, keeping the clone of that private property securely stored
And then when somebody tried to access that private property on Child, the request goes to the behavior stored on the Spotify server, and then the server can send the value directly back to the requester, without telling Joe that a value was even retrieved

However note that this means the callee is responsible for creating the child
This becomes an issue if there are multiple callees
(aka mixins)
Because only one person can be responsible, as that person has to know which properties to merge/override


How do public string/numerical properties work, where technically there's an infinite number of keys in scope
Well perhaps every object can only have a finite property list, but can have infinite keys in scope (keys that have *potential* to be properties)
Private scopes can define their own key classes
We mentioned key classes in an earlier section



One way we can characterize the difference is
Transferring callee's private properties is callee responsible cloning
Not doing so is caller-responsible cloning

At least for merging, caller scope makes sense
But maybe for cloning, callee scope is a nice feature?
You can always define cloning as merging, eg
`(...callee arg1 arg2)`
But doing `callee(arg1, arg2` could be a way of choosing callee-responsible cloning
Though having two types could be confusing

A callee could manually expose a cloning function

    cloneFoo: ...args >>
      _clone: (...foo ...args)
      => _clone

Now it happens in callee scope
However, notice how any private keys passed in `args` are now lost, since the callee can't see them
Whereas with `foo(arg1, arg2, ...)` we would expect caller and callee private args to be preserved
Also notice how this only works with finite objects though (objects with finite number of keys)
Because the callee is programmatically iterating through the provided arguments and merging them in
Though I guess this is the case for any clone/merge

### Caller-Provided Keylist

Why is it so natural to expect private properties to carry over during cloning
And yet problematic during merging
It's because during cloning, the callee knows that every argument that was passed in, is from the caller's scope
in fact, it seems like a good restriction to make
arguments modify the callee
why should a caller be able to send in arguments that they don't even know about
if they want to merge, they can use mixins, in which they have to manually define every property themselves
i feel tempted to make cloning work like merging because merging feels more symmetric and elegant
but that's not a good reason if it makes it extremely unintuitive
so maybe cloning and merging are completely different
cloning happens on the callee side, so the caller has to provide every argument manually, and private properties are carried over
merging is done on the caller side, so private properties are lost, if the caller doesn't have access to them

What if caller provided a keylist, basically a list of the keys they are passing in (proving that they have access to those keys, and indicating that they are overriding the values for those keys)
Then it would be the same for cloning and merging
The callee would know which properties to extract from the args
The caller should also filter for only keys that are in the object, lest they expose private keys unnecessarily
Wait but shouldn't the callee have to provide a key list too? What if the args contains a private key that the callee doesn't have, now the callee knows about it's existence
Or maybe there's a secure third party function that combines auth lists and returns the intersection
That way neither side exposes keys that the other side doesn't know about

Does this make merging and cloning the same?
In cloning, the caller provides a keylist, so whichever keys aren't in the keylist, the callee knows the caller isn't trying to override those values, and its safe to carry those values over to the child
Could we do the same for merging and mixins? The caller provides it's keylist to all objects being merged, so they know which properties are getting overridden, and which properties are carried over?
But then what if two objects try to carry over private properties with the same private key?

### Replicating Full Private Merging using Routing

I guess something key to understand is that there has to be a central entry point for each property, that for every read request, knows if the value should come from the arguments object or the callee
Basically the one responsible for the merging and overriding (the callee-responsible vs caller-responsible ideas discussed earlier)
Has to be aware of both values, so they can override the callee if necessary

Earlier we said that the child forwards private keys that they don't recognize to the callee server, in case their side recognizes it
What if the child captured the key, and asked the callee and args object independently, to figure out what to return
The caller can replicate full private merging, by simply:
1. store a reference to both parents (aka the callee and args object)
2. every time a read request comes in, forward the read request to both parents, and get the result
3. return the value from the args object, or if it doesn't exist, the callee
(note: the values returned could be encrypted too. As in, maybe for private keys, the first half is the address, and the second half is the encryption key. When somebody accesses a private property, they only pass in the first half, and hold onto the second half to decrypt the returned value, so even if the caller intercepted the request, they would only have the address, but they can't decrypt the value. Still, they don't need to decrypt the value to simulate merging, they just need to return the value from one of the parents)

So maybe we should just merge private properties, since the child can replicate that behavior anyways?
Or maybe we should never carry over private properties, and the caller can only create properties on the child that are in caller-scope (caller-responsible)?

### Private Keys and Anonymous Reads, Property Bundles

But reads should ideally be private
    mentioned previously in sections "Indirect Writes, and Pass-By-Reference Model" and "Unified Access - Read/Clone/Insert Privileges")
So maybe, every time somebody makes a request, they actually retrieve a full copy of the object, and then privately try accessing the property on their own server
    (I later call this a **property bundle**, since we are bundling all properties into a static object)
this way, the caller wouldn't be able to replicate full private merging using routing, as mentioned in the prev section
Or maybe it bundles the object into a single pure function, that when given a key, responds with the value, and has no side effects
And anybody can retrieve this function and read from it privately on their own machine
(actually pure functional prop accessors allow the caller to replicate merging, see later section "Property Muxers")


Actually, I was wrong earlier
The caller can't replicate full private merging
Because if the callee has behavior that references a private property that should have been overriden in the merge
The caller wouldn't be able to rebind those references
At least, not until somebody made a read request for that private property
Which would then notify the caller of the existence of that private key
and then the caller can create a new child with the newfound knowledge of that private key
But until then, they are acting more as a proxy, and less as a merge

Still, reads should be private
An actor should be able to read from another actor, without worrying about exposing their private keys
Think of it as a person spying on another person by binoculars
The person being spied on, has no idea of it

actually, even if the caller is able to proxy two parents together, there is still a key difference between that and merging
the caller is unable to modify any properties that they don't have access to

there are a few cases we haven't considered yet
- caller references a private property, but doesn't override it
- callee references a private property that the caller provides
- the person who made the callee doesn't have access to everything inside the callee

The first point is important, because that means that the keylist that the caller provides doesn't just include the properties it's overriding
It also includes the properties that it references
The second point is also important: what if the caller doesn't send in a private property that the callee references?
I guess we are going by the assumption that the caller is sending in all of its properties, otherwise if it leaves out a private property that happens to collide with a callee property, there would be problems
Eg behavior in caller and callee pointing to the same property but referencing different values
There also happens to be no issue with the caller sends in too many properties, because the callee is already defined,
the callee is not going to change it's behavior to start using the private properties that the caller sends in


actually note that, if we only ever allow caller-responsible merging/cloning,
(aka any private properties that the caller doesn't have access to, are lost),
then we will never run into a case where the caller doesn't have access to parts of their child
in other words, every child is fully visible to their caller (since any parts that were not visible to the caller, were discarded during the clone)
this seems a little restrictive...
there can still be behavior in the child that is private and inaccessible by the caller
just no properties?


Actually there is a problem with the caller over-exposing private keys in the keylist they send to the callee
The callee can iterate through the keylist and find keys they don't even know about
Why do we need the keylist in the first place?

Cloning an object with arguments, is ultimately about cloning a graph and rebinding certain references in that graph
So even with callee-responsible cloning, it's impossible for the caller to rebind references that they don't have access to

### Cloning, Merging, and Security: Defining the Problem Space

There are two main things we are trying to uphold:
1. consistency: in a given object, every reference to the same key, should reference the same value
2. security: a caller should not be able to access or change references if they don't have access to the key

Ideally we want a third feature and fourth as well:
3. transfer over private properties, even if the caller doesn't have access to them
4. merging and cloning should be the same, merging is a generalization of cloning
But this is what we are debating, whether or not these are possible while maintaining the first two rules

Note that the caller is the one passing in the arguments, or choosing what objects to merge
Which is why, in rule 2, it all depends on what keys the caller has access to

Here we can see the problem

If multiple args with private properties
We can either:
- Keep both (violates rule 1, consistency)
- Override the first (violates rule 2, security)

So why does it work for cloning?
We are guaranteed that every modified property, is one that the caller has access to
Ergo, every non-modified private property on callee side, does not exist in the args, so it is safe to transfer
[// TODO: insert diagram of callee, caller, and caller access list]
With multiple args objects, there are bound to be cases where properties that the caller can't see, collide, and that's where we run into issues
[//TODO: insert diagram of multiple arguments objects, and caller access list]

Note that the reason why it feels so naturally to make cloning and merging the same operation
Is because cloning is inherently weird, it combines two object, and exactly two
There is a "rule" in computer science, that basically says that programs should be defined for zero, one, or many/infinite inputs
[https://wiki.c2.com/?ZeroOneInfinityRule](https://wiki.c2.com/?ZeroOneInfinityRule)
"Allow none of foo, one of foo, or any number of foo"
So cloning feels weird, it is strictly defined for two objects
Merging, on the other hand, can combine any number of objects
Both operations feel similar
So it feels natural to try to generalize cloning to merging


Maybe we can handle merging/mixins a different way
Let `[p]` be a private property that the caller doesn't have access to
If multiple arguments objects have `[p]`, then all internal connections/bindings are preserved, but the property access to that variable is lost
As in, we can think of private properties as just a single value node that multiple other internal nodes are referencing / statically bound to
So we can imagine properties as a special arrow coming out of that value node, to allow external actors to dynamically access / modify that value
We call that special arrow a "property declaration"
Now if there are multiple objects being merged, there could be multiple value nodes for `[p]`, let's call them `p1` and `p2`
All static internal bindings to `p1` and `p2` are preserved, but the property declarations for p1 and p2 are removed, so there is no way to access those value nodes from the outside anymore
Instead, we set the value of `[p]` on the mixin to be `overdefined`
So that anybody who tries to access `[p]` will see "oh, this mixin had multiple values at `[p]`"
But note that even though the value of `[p]` has changed, the behavior of all previous references to `[p]` have not changed!!

Or maybe instead of simply getting rid of those property declarations, we move them
Maybe the value of `[p]` is `overdefined`, but also has a subproperty that contains all colliding values
And you can overriding `[p]` and it (somehow) fixes and rebinds all those references

### Moving and Re-mapping Properties

Is it possible to "move" a reference
As in, take an existing object like

    foo:
       a: 10
       b: a+10

And then modify `foo` to rename `a` to `a2`, so `b`'s reference to `a` should be rebound and `a` should return `undefined`
Well we can achieve this if we manually set `a2` to point to `foo.a`, have `a` point to `undefined`, and redefine `b` to be `a2+10`
But what if we defined `foo` like

    foo:
       _priv: 10
       a: 10
       b: a+_priv

Now we can't redefine `b` because we can't recreate that reference to `_priv`
But should we be able to?
Should we be able to rebind references, even if they are in semi-private behavior? (By semi-private I mean that the behavior is in a public property, but the behavior contains references to private properties)
Let's consider an object model without partitions, where every internal node is either a public or private property


maybe we can treat merging private properties, as like a merge conflict (as seen in revision control systems)
Allow a user (with access) to resolve the conflict
aka clone the object and re-map properties so that they don't collide anymore
we would have to implement merging such that, when private properties collide, it maintains a reference to all colliding properties (maybe in a private array or something)
so that a user with access can iterate through the array and re-map each property

when we discussed partitions, we explored the idea of modifying the graph/behavior of an object when cloning it
but we only explored the idea of replacing partitions or nodes
How flexible should we make it?
Re-mapping: re-map a reference from one node to another
Splitting: if two nodes reference the same value, make them reference different values
    eg if we had `foo: _a+1, bar: _a*2`, we could change it to `foo: _a+1, bar: _d*2`
    notice how `foo` and `bar` used to both reference `_a`, but now `bar` references `_d` while `foo` remains unchanged
    this is not possible with re-mapping, which would re-map the reference to `_a` for both `foo` and `bar`

compare this with functional languages
functional languages are very restrictive
the structure of a function is pre-defined, and rigid
all you can do is pass in arguments, pieces of data that are explicitly exposed by the function beforehand

I thought the whole point of using objects and properties, instead of functions and arguments,
was to make programs more configurable
after all, one can always restrict modification by making behavior private
so should public behavior be the opposite: as flexible as possible?

note that it's possible to do remapping with a proxy, which uses dynamic properties

### Dynamic Properties - Finite Objects with Infinite Properties?

Right now we have been defining cloning, merging, scope, assuming that objects are finite graphs
That there are a finite list of properties, that the interpreter can iterate through and do things like combine two objects
However, many of our previously discussed constructs, use dynamic properties, or matchers
Hashmaps, proxies, re-mapping, etc
(actually hashmaps use computed properties, I clarify this later in the section)
Originally the idea for dynamic properties, was defined as sort of a "default" case: if an external actor tries to access a property that doesn't exist yet, it goes to the dynamic property
We also only allow one dynamic property per object, as it is supposed to act as a catch-all
We can sorta get an idea of how to support dynamic properties

We can make properties static and finite
And if you want "dynamic properties", you use a function, eg `foo.getValue(key)->`
However thats ugly
Also prevents reuse, eg being able to use a hashmap like you would an object, and directly retrieve values

What's finite is the graph, the graph must be finite
But property access is almost a separate concept entirely
They are the "special arrows" coming out of certain value nodes
But maybe we can make property access work however we want
So if we want to make it dynamic, why not
We can define how property access works, it can be a complex mechanism, separate from how the object's structure/behavior is defined


But how do we handle side effects
What if somebody defines a side effect inside the dynamic property function
We discussed this in an earlier section
// TODO: FIND REFERENCED SECTION

I think we should simply not allow side effects in dynamic property functions
They should be pure functional
We already discussed the idea of marking objects as pure functional
Any function used within a dynamic property has to be marked as pure functional
What about semi-private (aka some behavior inside is hidden) functions?
Can you mark a semi-private function as pure functional? How would you enforce it?
I think you can't enforce it
What if a bad actor marked their private function as "pure functional" but it actually had side effects (and the function ran completely on their machine so nobody could inspect it, and they could keep track of every access)
Though recall that, to make reads private, we want to capture and encrypt the entire object into one function, `key => OBJECT => value`
    see section "Private Keys and Anonymous Reads, Property Bundles"
That the reader can call privately and securely, anonymously
In order to bundle the object into a fully portable function, the property-access behavior has to be completely captured in the bundle
And we can't do that if the dynamic property function contains cloning of 3rd-party semi-private behavior

Do we really need dynamic properties to implement hashmaps?
JavaScript is able to do so, without dynamic properties...
Actually I was wrong, hashmaps uses computed properties
I actually mentioned this distinction a few sections back
// TODO: FIND REFERENCED SECTION

Proxies and re-mapping still use dynamic property access though
But allowing dynamic property access, just turns property access into a function
Blurs the distinction between using a function, and using dynamic property access
Now 90% of the language is pure functional

Since object and keylist is finite, You can implement things like remapping and proxies without dynamic properties using computed properties
However, doesn't work with private properties

Recall our analogy for properties
combining spaces, and gene splicing analogy
(see section "Combiners and Symmetry")
or we can think of every property, as a locker in a locker room
the locker room is infinite, we don't know which lockers contain values
but each locker has a unique address


Doesn't feel like the concept of dynamic property access fits in very well to those analogies
In those analogies, properties are just pointers, direct access
With dynamic property access, you are thinking of property access as a function
When you combine/merge two objects, it makes perfect sense using the cubby analogy
Doesn't make sense with functional property access
You have to override one matcher with the other, it feels hacky

 

In fact, what if dynamic property access was cyclic/recursive

    [x]: this[x+1]

Property access can become infinite, unbounded operation



However, it also seems wrong to ban dynamic property access in the language, when it's so easily achievable in real life
Somebody could make their computer mimic dynamic property access
they could program the internals of their object such that, every time a read request comes in, it dynamically generates a value
Or could they?

recall that we explored the idea that the object being read/accessed, has to bundle and return themselves as a single function
so that the reader can read it and access properties anonymously
what if instead of bundling it as a function, the object had to bundle it as a list of keys and values
in more general terms, what if the object had to bundle it using a standardized format that separated each property
then people wouldn't be able to "hack" an object to create dynamic property access
because their keys and values have to be provided in an already delimited fashion, to the reader
i think it's still possible to achieve private properties with this method as well
just because the properties are given in a standardized/common format, doesn't mean that every key is enumerated
imagine if every object in the world were represented using giant locker rooms (you can think of each locker as a memory address)
you know that any given object will be formatted as a locker room, but that doesn't tell you which lockers have data in it, and searching every single locker is infeasible
though at the same time, it does feel like a standardized format does compromise some security...objects are finite after all, so maybe an attacker could just brute-force traverse the object to find private keys


what if want custom private-key system
don't trust the default method of private addresses

generated api keys
infinite space of keys

maybe we shouldn't allow the value of dynamic property, to reference the key
(note that this is different from recursion. It means the returned value cannot be dependent on the key, so basically every dynamic property can only return one value, even though multiple keys could lead to that value)

note that for the api example
we aren't generating a new api based on the api key
we are simply having multiple api keys, point to the same api endpoint
after the user gets to the endpoint, they can actually start cloning/using it

    someAPIPortal:
    	_api:
    		getPosts: ...
    		makePost: ...
    	[key]: if authorized(key) ? _api
    someDude:
    	myKey: ... // some api key
    	someAPIPortal[myKey].makePost("hello world")

so really, it's just multiple properties referencing the same value
they are just dynamic references/pointers
accessing them doesn't create new behavior (at least, if you exclude the process of getting to that reference)

This sort of dynamic reference is very similar the idea of "key classes", where you can have an infinite class of keys mapping to the same property

Note that proxies, re-mapping, and key classes, can all be implemented using dynamic pointer idea
But dynamic pointer model, still doesn't tell us how to handle merging
What if both objects have dynamic pointers?

Actually API keys and API access can be achieved through computed properties
Just go through a list of authorized keys, and create properties from them
As long as you don't need infinite keys

Recall that re-mapping can also be achieved using computed properties, as long as you don't need to transfer private keys
Proxies can transfer private keys
I have a suspicion proxies may lead to security concerns

Recall how, a while ago we explored parametized references
And showed how they are basically the same as functions
So they are unnecessary (because you could do the same thing with functions)
Does this argument also apply here?

Well there is a rather large difference between a dynamic property and a function
Properties access is done anonymously
The object being read, should gain no useful information from the read
Eg, they shouldnt be able to learn secret keys, or track how many times a property is read, etc
Functions, on the contrary, can do these things
Every function call can do things like keep track of what arguments were passed in, etc

### Property Muxers

It actually isn't that hard to mimic merging/cloning/overriding with dynamic properties
If you had `x = foo(...bar)`
Then for every key, you simply try to access it from `bar`, first, and then if it returns undefined, return the value from `foo`
Implemented using a dynamic property:

    x:
       [key]: bar[key] | foo[key]

I call this the **property muxer** (property multiplexor)
(note: this idea was previously touched on in section "Replicating Full Private Merging using Routing")

This can be achieved even if `foo` and `bar` have private properties or dynamic properties
`foo` and `bar` can even have infinite properties
In addition, because the process is pure functional, it can be bundled into a function that can be called anonymously by any readers

You can also implement mixins/merging
Instead of returning one or the other, simply access both, and if both have a value, return `overdefined`

    x:
       [key]: if (foo[key] & bar[key]) overdefined
              else bar[key] | foo[key] 

I call this a **property mixin muxer**

One downside of using a dynamic property muxer, instead of statically rebinding properties at object creation,
Is that as you clone more and more, every clone wraps the previous one with a property muxer
So you end up with layers and layers of property muxers
Which can get ugly and bloated and slow
Though maybe it can all be optimized in the background
If 90% of objects use static properties, those can be statically merged
The remaining 10% can use dynamic property muxing

In addition, it's important to notice that property muxing can only override properties, not behavior
As in, overriding isnt just for changing which value a property points to
It is also used to remove and replace behavior
We decided this in an earlier section
// TODO: FIND REFERENCED SECTION (somewhere around the "Partitions" section)
This reinforces the idea that dynamic property access, is really just about dynamic references
It does not create more behavior (and cannot create infinite behavior)

This sort of separates the ideas of properties, and partitions
Caller is responsible for removing behavior
And responsible for re-routing property access
But sometimes they may be controlled separately
If we ignore syntax completely,
The caller has full control over the public behavior nodes of the callee
And has full control over how property access gets resolved, aka which keys point to which values
A caller can't modify or remove behavior that they don't have access to
But they can modify property access to those values
Imagine if an object returned undefined for every key (even private ones)
This would be akin to a PC that blocked all network requests

### Property Muxing and Merging Private Properties

This has interesting new implications for how merging private shared properties should work
so let's say that cloning/merging/overriding works the same as property muxing
in addition, the caller is responsible for both property re-routing, and cloning and merging and removing behavior
let's say `foo` and `bar` are both objects with private behavior stored at the key `[key]`, which is not accessible by the caller
what happens if we do `child: foo(...bar)`?
the caller is responsible for removing the behavior in `foo` that is overridden by `bar`, so they can only remove overridden public behavior
the caller also routes all property access using a property muxer, which will route private property access as well
so if a reader tries to access `child[key]`, it will be routed to `bar[key]`, which may make it seem like `bar[key]` overrode `foo[key]`
however, the behavior at `foo[key]` was not removed, it is simply not accessible anymore

what about for merging and mixins?
what if the caller did `mixin: (...foo ...bar)`?
the caller is responsible for finding colliding properties and removing them, replacing them with `overdefined`
also responsible for routing all property access using the "property mixin muxer" shown earlier
so if a reader tries to access `child[key]` it will return `overdefined`

### Anatomy of an Object - A More Abstract Module

this elegantly combines the concepts of cloning and merging
by separating the concepts of property access and behavior modification
there are now three (?) distinct parts of an object

1. property access: anonymous, can have dynamic references, can have potentially infinite keys or references
2. behavior: a finite graph of combination nodes
3. insertion: also anonymous, must be finite

what are the "combination nodes" I refer to?
they can be clone operations, or merge/mixin operations
in fact the caller is free to define how the source objects are being combined
(which nodes in the source object are being removed, which are being carried over, how property access is routed, etc)
as long as it conforms to the three rules

so the concept of property access and combining, is now a lot more abstract
the implementation details are left to the programmer

### Property Muxing and Security

if the caller can re-route private key access, does that potentially expose those private values?
how can we ensure that those reads are anonymous, and don't reveal anything to the caller?
well recall from a previous section, where we devised a security scheme that protected the privacy of the value, even if the read wasn't anonymous
// TODO: FIND REFERENCED SECTION
basically the private key is split into two halves: the first half representing the address and the second half containing the encryption key
so only the first half is revealed to the object being read
I'm sure there are plenty of other protocols and schemes that we can create to protect the privacy of reads
private keys are just a concept, an idea, representing a value that can only be accessed via a secret method
it can be implemented in a number of ways
and I believe that it is possible to implement and achieve all the conditions I have laid out for private keys (eg anonymous reads, etc)



### Deleting Properties

Normally the way cloning and overriding works is
Whatever properties are defined in the arguments, override corresponding properties on the source (aka callee)
But what if you want to remove a value?
Override with null?
But having undefined and null is ugly
Means you often have to do checks like `x == undefined || x == null`
Better to have a single type for "no value"
Instead, we can design it so ifyou specify `undefined` in clone arguments, it overrides the source value with `undefined`
deletes the source value for that property
Notice how this is special behavior
Because technically, for properties not specified as clone arguments, those are undefined as well
But those should not override anything
Only when you explicitly specify a property as `undefined`, does it delete the property


### Pure Functional Annotations

something i noticed while working with React
React has an effects hook, used for specifying side effects
react also has a library called react-virtualize
these two things are fundamentally incompatible
either you think of react as functional, or as imperative
Not both
for example, imagine you had a list using react-virtualize
now imagine if each list item, used an effects hook
now those effects hooks aren't getting triggered for components not in view, because react-virtualized isn't rendering them
so you can see how you can't really use both effects hooks and react-virtualize at the same time, doesn't make sense


In my lang, you can declare/annotate a module as "pure functional"
And that allows you to use a lot of optimizations like lazy evaluation
but since you are explicitly declaring the module as "pure functional",
you won't ever get mixed up and stick side effects in it
once you declare the annotation, then the optimizations automatically get applied
in contrast to the react-virtualized library, where you apply the optimization yourself, hoping that the component doesn't have side effects

however, note that if a object is declared as "pure functional" but contains private behavior
then we just have to trust the annotation
(perhaps this is related to the discussion about "pure public"? look back at the section "Pure Complete and Pure Public")

### Collectors = Collections

renaming "collectors" to "collections"
simpler and more familiar to programmers
so you would be like

```
	foo: collection()
	foo <: 10
```

### random ideas // TODO: name these sections

// TODO: ELABORATE ON THESE BULLET POINTS

- compose multiple end-to-end apps, by breaking off a client-side app (with services/databases as arguments) into a template, and then cloning the template inside your server, providing your services/database
- you can even combine multiple apps on the same page
- watch out where you break your partitions, eg if you did something like

        foo1:
             _priv: someVal
             output: someComplexFn(_priv)
          foo2:
             _priv: someComplexFn(someVal)
             output: _priv

    notice that `foo1` is a lot less secure than `foo2`. Recall that ideally, anything in a public partition is modifiable. That means in `foo1` you could take the reference to `_priv`, and even though you don't know what address it is reading from, you can simply write that value to a public property and read from it. Now `someVal` is exposed. Whereas in `foo2`, all you have is the output of `someComplexFn`, so you don't know how the output was created

so then why do we need scope?
why not just have direct references to other nodes
and let the user move references around (if they are public)
why do we need this intermediate `scope` object, a kind of hub that all references have to go through

scope is ultimately just a system for grouping and declaring idea
for example, you can create a function `divide` that acts on a `numerator` and `denominator`
even though you haven't even defined a `numerator` or `denominator` yet
you can declare in the scope, that these ideas exist
and that functions or objects can reference them

another potential name: chatter
kinda like smalltalk

### Using Core Functions instead of Javascript Transformations

instead of defining transformations in javascript
do it in the language itself
and compile it to functions, that are used in the AST
this was inspired by when I was browsing Nylo's source code and came across their std/base.ny (see commit d81d3eb368366c93eaae3973883c766d4b51829e)
though for Nylo it's just a standard library of functions
whereas I am using it for syntax transformations
for example, in Nylo to do a conditional you literally call the `if()` function
in my language, you would use the `if (...) ... else ...` syntax, but it gets transformed into an `ifElse()` function call
I might not even expose the `ifElse()` function to the public, and just use it during interpretation

but then, how do we transform scope and references?
use `this`
what about private vars?
use regular keys and then don't enumerate them? scramble them in the interpreter?

Concrete example w scope
Rebinds references
Note: does not rebind pointee, rebinds pointer
Imagine a bunch of arrows pointing to A
It doesnt rebind A itself (otherwise private references would get rebound as well)
It rebinds anything referencing A that is public, as it has to clone the node anyways, it can clone the node while changing the reference
Actually, isn't it the opposite?
If private behavior references A, but A is public, then if you rebind A, the private behavior references the new A
However, if you have public behavior referencing private B...well you can change that reference as well?

`this` is the only variable that gets rebound during cloning
Everything else, even scope and scope references, can be implemented on top
When cloning, you define a new dynamic property accessor `this[x] => f(x)` that determines how to combine the parent objects
Note that this means we need a way to reference the parents in the dynamic property, eg `parent1`, etc
Seems sorta ugly
Is this necessary?

Also, recall that we are generalizing cloning into dynamic property access
Instead of strictly defining the combining/merging process (right parent overrides left parent)
We let the programmer define it
However, seems circular
We need functional programs to make a dynamic property accessor
And we need property access and merging in order to make our first programs
So which comes first? Programs, or dynamic props?

Is it possible to implement the initial dynamic accessor, multiplexing, using only static references or static bindings?

The most basic combiner is a conditional, "pull value from A if it exists, otherwise pull from B"
Combiners are implemented in functional
However, remember that in functional, conditionals are implemented using function calls
But in our language, calls are implemented using dynamic property access, combiners
Circular


We don't need anything special to reference parents during cloning
If we did something like proxy(a, b)
Then the parents are just passed in as args
If we expose `merge` or `combine` as a global function
It would work the same
Just do something like

    merge: mom, dad >>
      [key] => mom[key] != undefined ? mom[key] else dad[key]

Wait but then
Aren't `mom` and `dad` also properties of `merge`?
That you have to override to pass in args?
It's confusing because now we have two ways of defining properties, through the dynamic accessor and through the static property definition

We can only retrieve values from `this`, so our input parents have to be put onto `this` before we can use them in the dynamic accessor
But the dynamic accessor is how we reference variables, so it has to be defined before we can access the input parents
Circular


I guess a fully defined version is
Everything functional
Everything private
Args are passed in like functions
Public values are defined via accessors
Any public node can be removed

The only weird thing about this is
We have to call via the functional method
Instead of using merging



Security and merging
If property access is dynamic, and controlled by the caller
Then caller can modify private properties


Virtual objects
Convert a function into an object that uses the function as the dynamic property accessor
Is it still secure?

The current idea is
Whenever you clone an object
The new object has its own `this` value
And its own dynamic accessor
And all nodes cloned from the parent object
All will reference some `this[key]`
And will check the dynamic accessor of the new object to get the appropriate value
This way, if there is private behavior referencing a public property, the new object can simply override the public property (by providing a custom value for that property in it's dynamic accessor), and doesn't need to modify/access the private behavior


Locker room analogy
Everything is in a locker, even private behavior
To delete, you set a locker to undefined
Even if private shared behavior runs into merge conflict , moves to a private locker


Maybe regular cloning is callee responsible, so that private shared props are preserved
Merging is caller responsible, dynamic access is supposed but private shared props are not preserved
Wait but callee responsible means the caller has to tell the callee all arguments, privacy concerns, see section // TODO: FIND REFERENCED SECTION

Does it make sense to use dynamic accessors to create a new object?
Every cloned referenced has to reference `this[key]` to get the clone's value for each parameter
But if you used a dynamic accessor and did something like `[key] => 5` then all private properties would get overridden too
Though I guess it would work fine with the default property muxer
Since private properties of the parents won't ever collide

Imagine a rogue computer, that tries to merge an object Bob and Joe
It knows Bob and Joe share some private properties
So it uses default property muxer to combine Bob and Joe, giving Joe's properties precedence
And all nodes cloned from Bob, during rebinding, it will check `this[key]` to get the new value, calling the rogue's property accessor
And for the shared private properties, the property muxer will retrieve the value from Joe
And so the rogue computer is able to modify the private behavior, without having access to the key

Note: I will be using **rebinding** as the term for when the nodes of the new object are resolving their references, looking for if a value has been overridden or not

Maybe we should only allow dynamic properties for "external access"
That is, access from the outside of the object
So stuff like proxies, only need to route requests coming from outside, to the correct internal object
But requests coming from the object itself, eg from its own cloned behavior
Don't use the dynamic accessor
This prevents the security concerns mentioned above

### Asking for Overrides vs Sending Them In

Or maybe the caller has to explicitly provide a list of variables to rebind
Just like they have to explicitly provide which nodes to remove

But according to the locker room analogy, removing nodes is the same as overriding properties (override with undefined)
Why did we separate it in the first place?
(Note: I think we separated it in the section "finite nodes infinite references"?)

Imagine each object as a giant spreadsheet, each cell representing an address, a property
All properties, private and public, are located somewhere in this spreadsheet

The caller can provide a proxy/virtual object as the arguments for the call/clone

The callee is probably the one responsible for the rebinding of it's private behavior
Since it doesn't want to expose it's private behavior to the caller
Now if the callee asks the arguments object to see if any private properties are being overridden
Recall that the caller can provide a proxy or a virtual object as the arguments object
Allowing the caller to provide an arguments object with private properties that the caller can't access itself

So the question is
During rebinding
Does the callee _ask_ for which properties are being overridden
Or does the caller _send over_ which properties are being overridden

Overriding is just one way of resolving merge conflicts
Recall that another method is to simply use `overdefined` for conflicts
So perhaps it should be up to the person doing the rebinding, how the parents should be merged
So maybe it makes the most sense for the callee to ask for which properties are being overridden?

Though actually, if we think in terms of merging/mixins
The person making the mixins, asks each parent for their properties
And in this case, the caller would be the one making the mixins


No matter how we choose to resolve merge conflicts
It will involve some sort of logic
But we can't expect to implement that logic using the language itself
Since it becomes circular (discussed earlier)
We have to choose a default method of resolving conflicts
And define it in the spec and hard code it in the interpreter
And the other methods of resolving conflicts can be implemented using the language itself
But at least one method has to be hardcoded into the interpreter

It's kind of like how for a turing machine
There are tons of variants
Eg a two-tape turing machine, or three tapes
But at the end of the day, we have to choose a specific number of tapes, and implement that into the turing machine spec
And all the other variants can be based on that


So I think in conclusion
Merging and cloning are implemented using mixins / dynamic properties
Callee has to be the one cloning private properties and rebinding
And when doing so, there is no reason for callee to ask the caller for anything
Because doing so could cause security issues
So by default, merging doesn't 

Mixing/merging doesn't create any nodes
Has to be done manually
Doesn't preserve private properties

Cloning, pass in keys for properties that you want to clone
Preserves caller's private properties, since the callee is doing the mixing, so they know about the private properties that need to be cloned


Mixins are caller responsible
Cloning is callee responsible
Cloning is a method on every object, implemented using mixins
An object can disable cloning by overriding it with undefined
Though there's not really any reason to do so...since if you wanted to prevent behavior from being clones, you could just define it externally and reference it in the object

Another clue for why cloning has to be callee responsible
Remember that tags are like virtual properties
What happens if we have a tag that is only visible to one parent?
It's like a private property
And only that parent can transfer it over to clones / child objects



Mixins have to be for two objects
Or maybe could do it with a list,keep going till undefined?
Has to be hardcoded in interpreter

### Mix - a Core Operator

So cloning is not actually a core operation
The three core operations are
Read, write, and **mix**
Mix: takes two objects, merges properties and uses `overdefined` on property collisions

Wait but does mix combine all private properties?
No, because that would be a security concern
Whoever calls mix should only be able to merge the properties that they can "see"
But how do we determine what properties can be "seen"?
If we use property lists...well then we have to iterate across the property list
And iteration uses function calls / cloning in the implementation (recall how iteration works in functional langs)
And function calls / cloning is implemented using "mix"
Circular


Whether or not an object can "see" a property
Is a vague concept
Just like scope, it is implemented using language constructs
perhaps every object needs a keyset that defines what they can "see"?

### Sets as a Primitive

maybe Sets are a primitive type
so we can use sets for property lists and such, and perform set operations
    and the iteration is handled in the interpreter
May seem ugly since it seems like a complex primitive (and primitives are usually simple)
And in functional, lists are not primitives, they are implemented
But it's kinda like how in turing machine
The turing machine tape is a "primitive" and a rather complex one at that

Sets are unordered
so how a set is traversed is up to the interpreter, but the language spec doesn't need to know about it
Already used by insertions

So perhaps mixins require two things: a set of keys and a set of objects
And the mixing will combine all the values for the keys in the keyset, across all objects


Wait but if cloning is callee-responsible
What if the caller wants to add private properties that the callee can't see
Caller doesn't want to provide those private keys, but the callee needs them to mix those private properties in

Previously, we said that the caller can simply check which private keys already exist on the callee, and only pass those in (since those are the ones that need to be overridden)
But if it doesn't pass in the other private keys, then they won't be added to the final object
At least if cloning is callee responsible
well, unless the caller keeps the private properties on the "caller side"? (recall the dicussions about distributed objects and "cloning over a network")

Actually recall that it isn't enough for the caller to check which keys exist on the callee
to figure out what overrides to send in
    as mentioned in section "Asking for Overrides vs Sending Them In"
Since the callee could have behavior referencing properties that aren't defined yet
(eg `sum: ( a b >> result: a+b)`, notice how `a` and `b` are like function args, not defined yet but the caller is meant to pass them in)
this is how function parameters often work

So maybe there is no choice but for the callee to _ask_ the caller for values, instead of the caller _sending_ them in
    see section "Asking for Overrides vs Sending Them In"
Along with all the security problems

### Reference / Parameter Declaration

What if we declared all references / parameters
so in the earlier example `sum: (a b >> result: a+b)`, `a` and `b` would be undefined, but would have a special undefined value, undefined parameter or something
thus, the caller could check and see that it needs to pass in values for `a` and `b`, even if they are private
Note that these declarations can still be private, since we aren't enumerating the private keys, just setting the value to something other than `undefined`
still seems a bit ugly that we are having this arbitrary special value though...

what if it's a dynamic reference?
eg `foo: (key >> result: this[key])`
now we don't know which property to declare as a parameter

Unless reference declaration was dynamic...?
so if we had `this[a+b]`, we figure out what `a+b` is and declare that as a parameter
if `a` or `b` changes, then we re-calculate and declare the new parameter
so what about in the earlier example, with the dynamic key `this[key]`, where `key` itself is a parameter
well first `key` will be declared as a parameter, and then when the caller provides `key`, then `this[key]` will get calculated and then declared as a parameter, and then the caller can provide `this[key]`
convergence

I guess this convergence could get arbitrarily long, if we have a chain of dynamic references depending on other dynamic references
eg `a: this[b], b: this[c], c: this[d], ...`
what if there was feedback?


### Preventing Dynamic Access and Proxies using Encryption

We previously talked about a rogue computer using routing to proxy private variables that it doesn't know about
    see section "Replicating Full Private Merging using Routing" and "Property Muxers"
But we can prevent this
Recall our discussions on anonymous reads
And capturing an object into a single function that is passed to the reader
    see section "Private Keys and Anonymous Reads, Property Bundles"

Well previously I thought that the rogue computer could simply retrieve the property access functions of it's victims (the objects it is proxying), wrap it in a property muxer, and then pass that to the reader
But if we instead forced every object to provide a property access object, a _static_ piece of data that is simply encrypted
Then we can prevent proxying
For example, let's assume that we have a giant encrypted piece of data
encrypted property bundle
And if you decrypt it using different keys, you will get the values for those keys
Now it's impossible for the rogue computer to encrypt and include the private properties that it can't access

// TODO: EXPLAIN THIS MORE


So we could prevent proxies and dynamic access in our language
Do we want to?

one thing we can do is
make static property access the default
and static property bundles are the default protocol
but if an object uses dynamic prop access, or proxying, or some other special protocol
they have to declare it
and the reader has to agree to use it, understanding that it might compromise anonymity or security


We need a clear and consistent spec of how we want privacy to work in our language

Note that even if we prevented proxies, we still can't guarantee that a property on an object is actually accessible by that object
The object could have inherited it

### "Frankensteins" and Mixed Private Spaces

in functional languages, many languages support type systems and private/public, and you can either
   * extend the type (giving you access to all private properties)
   * instantiate the type (passing in constructor args, and the instance has access to everything you pass in)

in my language, one of the main things I've been trying to achieve is for the caller and callee to both contribute private properties to the child
which does feel a bit weird
after a chain of clonings, with each caller contributing some private properties, you end up with a frankenstein of private properties
if we imagine the address space/matrix, it would look like a bunch of different colored regions mixed together, each "realm" being private and unable to see the other "realms"


What's about something like a phone
The phone has an OS, that is kept secret from the user
But the user also has personal data, that should be kept secret from the phone

Mixins vs inheritance vs member variables
Mixins: multiple objects combining into one with merged properties
Inheritance: overriding a single object with a set of properties
Member variables: 


Conceptually, it seems trivial to have the caller override callee properties without exposing private properties from the caller


**Mixed private spaces**, aka mixin where the parents each contribute private properties that the others are not aware of
Breaks single responsibility?
But then what's the difference between mixed private spaces, and just a network of objects (each containing private info)?

Difference is that for each object, there is a property mixer that needs to resolve merge conflicts across multiple parents
So with multiple private spaces mixed into one, which parent does the property mixing and binding?

so in that sense, perhaps there has to be single responsibility, and whoever is responsible has to be able to see all properties

Dynamic prop accessor / mixer seems too powerful
If it can create nodes and such
and do rebinding
Or does it do rebinding?
It's supposed to just be a function that is packaged for readers


if sets are a primitive
and lists are sets
and we allow dynamic properties
what if we have `x: ([key]: 5)` ? isn't `x` now an infinite list? so if we did `setFrom(x)` we would have an infinite set?
can our mixin operator (which takes in a set of keys and set of objects) handle infinite sets?

recall how booleans are implemented in pure functional
how would we implement booleans using our mixin operator?

not hard
basically works the same way as in pure functional
`True` and `False` are both functions that take two arguments, and have a `_return` value
`True` takes the first argument, and sets it as the `_return` value
`False` sets the second argument as the `_return` value

    True: branch1, branch2 >>
        => branch1
    False: branhh1, branch2 >>
        => branch2

and the syntax `if (cond) XXX else YYY`
becomes

    mix{cond, (branch1: XXX, branch2: YYY)}


i think this mixin / dynamic property stuff is too complicated
let's just think in terms of actors
and what makes intuitive sense

actors are bundles of behavior
you can read from them
you can send messages to them
they can spawn more actors?

maybe the callee isn't restricted to just cloning
when the caller passes in data, the callee can spawn multiple children, not just a single one

if cloning was callee-responsible, and implemented in the callee using the mixin operator
the caller still needs to somehow send in the arguments
how? insertion?
but insertion can only send data, the caller needs to somehow receive data as well

perhaps the callee puts the result of the clone operation, in a designated property that the caller can find
it can just use the id of the arguments object, as the key
so it would look like

    callee: ...args >>
        _clone: // create the clone here
        [args]: _clone

and then the caller can retrieve it because it has the id of the arguments object as well
I think I may have discussed this earlier as well (?)
Lets call this "insertion response retrieval"


recall that we used to view cloning as a two-way message passing system
a way to merge behaviors, like gene splicing or reproduction
see section "Combiners and Symmetry"

we also used to think that it was caller-responsible
// TODO: FIND REFERENCED SECTION
however, we noticed that there's no point to cloning unless private behavior is carried over
// TODO: FIND REFERENCED SECTION
which means the callee must be at least in part responsible
so is it callee-responsible, or a mix of caller+callee responsible?
(we mentioned recently how dynamic property mixers implies that it should follow single-responsibility principle)
// TODO: FIND REFERENCED SECTION

perhaps cloning conflates two ideas
when we define an object, we define how properties already on the object generate other properties
but when we introduce cloning, it means that we are also defining what behavior can be cloned
so now we have to worry about two things when defining an object

collectors / collections are actually special
doesn't seem to make sense to clone them
  or does it? we discussed cloning collectors previously in the section "Insertion and Cloning"
doesn't seem to make sense to read from them either
actors and collectors are distinct entities
though recall how we represented insertion using pure functional constructs
// TODO: FIND REFERENCED SECTION
basically a global flag-watcher system

note that such a system also doesn't have to reveal inserted data
if an actor wants to insert to a collector
the collector exposes its public key
the actor encrypts the data using the public key
and then the global flag-watcher system propagates the encrypted data to everybody
the collector tries to decrypt it, and is successful, so adds it to their collection


can we implement cloning using insertion?

What if we made it so that when you insert into one object, it inserts into another object, etc, and then eventually returns the result using the insertion-response-retrieval system discussed earlier
Can we implement the successor function this way
I guess maybe the integers are represented by how many insertions an object has received, and the successor just inserts another item (maybe an empty object) into the caller?

implementing cloning via insertion makes it so that
Objects become giant monoliths
Receiving insertions and sending insertions, and sending responses via insertion-response-retrieval
Instead of allowing an object to spawn an independent object, with independent behavior


Recall my theory that the key part of making a powerful language is repetition
A way to turn finite information into infinite behavior
// TODO: FIND REFERENCED SECTION (I think it was in my hand written notes)

The problem with trying to implement cloning with insertion
Is that we are not creating any new objects
(though insertion can be modeled using functions, so creating insertion is like creating behavior?
is there a way to generate infinite insertions?)

Note that with a turing machine, the "runtime" can be infinite, it can take an infinite number of steps for it to halt
For a functional or actor language, since there are no computational steps, and everything happens at once, what's infinite is the number of calls or spawned objects
What about a logic language?
Spawns an infinite number of logic queries

note that the wikipedia for Actor Model
mentions that an actor should be able to respond to a message by spawning ["a finite number of new actors"](https://en.wikipedia.org/wiki/Actor_model#Fundamental_concepts)
does not mention cloning, but does mention spawning

the wiki made me more confident that insertion isn't enough
we need a way to spawn actors
in addition, mixed responsibility is too complicated
only one parent actor for every spawned child actor
so what is the mechanism for spawning new actors?


what if actors had an `initializer` property
    kinda like a constructor in typed langs
that was a collector
and is only visible to the person spawning the actor
they insert arguments into it, and the child's behavior reads from those arguments


we want an actor to have the freedom to spawn children however they want (isn't restricted to just clones)
but how we define those children, is defined using templates defined externally, outside the actor
and the actor clones them
so maybe it comes down to cloning after all?


cloning external templates is a bit restrictive though
because it means the templates are pre-defined
what if we want to dynamically define the child's behavior

but if parent dynamically defines child's behavior
what about grandchild? is that defined by the grandparent?
the problem is, "spawning actors" is too vague
what behavior belongs on the parent? what behavior belongs on the child?
right now it seems like all behavior is in the parent

cloning made it simple
you separate behavior depending on what you want cloned
so you put behavior on the child, if you want people who clone the child to clone that behavior

however cloning is so asymmetric
two objects, callee and arguments object
the callee is responsible for spawning the child
the caller passes in the arguments object


the grandchild's behavior is created by the child, not the parent
so if the parent wants to dynamically define how the grandchild behaves, they have to define how to define it within the child
so the child can independently create the grandchild

In functional, we use functions to group behaviors for easy re-use and modularity
Grouping behaviors is very intuitive
When we think of an actor, we think of what behavior it contains
And when we break down behavior into smaller parts, its intuitive to make each part an actor

// TODO: Example with spawn3, an actor that spawns 3 children

One advantage of the spawn model, is that it's easy to prevent cloning
But it was pretty easy to do so already in the cloning model
Just move the behavior you don't want cloned, to an external private place
And expose the values publicly, not the behavior

passive (forced) spawning vs active (reactive) spawning

with the cloning model, any actor can be cloned, cloning behavior is default and passive
so any actor that wants to prevent it has to actively prevent it
with a "reactive spawning" model, where the parent reacts to inputs and spawns children actively, the parent can prevent cloning by simply not exposing it


With the spawn model, an object can spawn multiple children, and define them within the actor
But that is a curse as much as a blessing
Makes it confusing and complicated
With cloning, each separate child behavior, would be a separate actor
Simply and intuitive
With spawning we can do the same (recall that cloning can be implemented using spawning), but we can also define all behaviors in one actor
So now the programmer has to choose which to do

Maybe we need to take advantage of recursion
Every actor should represent a single behavior
We can still use the spawning model
But we need to make it simpler

We could have an object "spawnFactory" with three properties, "spawnA" "spawnB" and "spawnC"
All collectors
And when you insert into one, it spawns the corresponding type
But note that we could have done something very similar using cloning
Instead of inserting into "spawnA" you would clone "spawnA"
The difference is that when you clone "spawnA", you are guaranteed a response
With insertion, you arent

How do we make sure "spawnFactory" can see the insertions, but outsiders can't?
maybe a shared private property?
or maybe the collector inserts into "spawnFactory"? (eg every time "spawnA" gets an insertion, it inserts the data into "spawnFactory" with the tag `#spawnA`


### Choice to Spawn

one big problem with cloning
since it's callee-responsible
the callee is responsible for duplicating the behavior
duplicated private behavior, stored on the callee's server
takes up memory and cpu, and a malicious attacker can overload the callee with clone requests
the callee could try to prevent it by making all its behavior private, with zero input arguments
so that when you clone it, you can't change it's behavior, so it never needs to actually create a clone
it can just fake it by returning itself as the "clone"

Someday server goes down



Can this "choice to spawn" behavior be implemented in the cloning model?


### Choice to Exist

instead of the parent choosing for the children to spawn
each child can choose to exist
based on environmental conditions

reads from the environment and decides whether to spawn or not

so in something like

    if (x > 3):
        some behavior

`some behavior` is a child actor, that is listening to whether or not `x > 3` to determine whether to spawn itself or not

Not exactly free choice
As the person defining the child, ultimately gets to choose when the child exists or not
But it does group behavior more intuitively by making each child responsible for its own spawning behavior

Solves 3 problems
* Asymmetry of cloning
* Group behaviors for recursion
* Callee responsible, can choose not to clone/spawn

### Spawning from Sets (`set_spawn`)

Wait but
If we want to spawn the actor in a for-loop

    parent:
        for x in list:
            some behavior

This feels like the parent is spawning the children
Not the children spawning themselves

Well one way to think about it is
When we define objects normally, we are creating a single object that reads from single values around them
But sets are a primitive too
// TODO: FIND REFERENCES SECTION
So we can define a set of objects that read from a set of values
a `set_spawn`

kinda reminds me of the "fan-out" operation I had in the diagram syntax
    see section "Defaults for Select, Map, and Reduce"

In a sense, this turns everything into a template
Before, in the cloning model,
You create a single object, and the you can clone it multiple times
A 1-to-many model
Now, everything starts as a template, and can pop into existence multiple times
A 0-to-many model
Similar to functional (functions are templates, inert at first but can be called and executed multiple times)

But then what about depending on a product of sets? A powerset?
What about a single object depending on multiple values? Eg "foo exists if a && b"

This is like flipping the way we usually think
Instead of "if a && b then clone foo"
We think "foo exists if a && b"

how would we implement booleans using spawning?

In order to spawn
We have to bind an "existence" listener to some variable

### Sets and Loops instead of Recursion

Parent still has to create the existence listeners
So I guess you can think of it as the parent spawning the children

However, still very different from cloning
Recursion isn't possible in the spawn model
Because we can't clone/call actors to duplicate behavior
(And recursion requires cloning/calling oneself)
In order to duplicate behavior, we have to spawn off of a set
But an object can only be defined once, can't be duplicated
This way, the parent has full control over the creation of it

So there are two primitives in Firefly
Objects: key value pairs (unique keys)
Sets: group of values (can contain duplicates)


We mentioned previously how we could return undefined for cloning
Use functions, the clone function has a return value that can be undefined
// TODO: FIND REFERENCED SECTION

I guess we could have made a "clone operation" that just works like functional function calls
And then a "clone function" that uses the clone operation, but could return undefined if the callee doesn't have the resources to complete the clone or something

However, one core aspect of spawning
Is that the parent controls how many times a child is created
With cloning, the parent simply exposes the child behavior
And let's anybody duplicate it
Which is problematic if the child contains private behavior that must be executed by the parent,
And the parent has limited resources
This is a fundamental problem in the concept of cloning

Functional is caller-responsible
The caller executed the function itself
In order to do so, the caller has to have the source code
Which would be a security issue in our language, if the callee wanted to keep it's behavior private
Cloning has the same issue


Now that there are two primitives
How are they related?
With objects we can use dynamic keys to mimic infinite lists
But sets are finite
But we can also convert objects to sets
So what happens if we convert an infinite list to a set?

The point of sets is that they are unordered,
But are objects ordered?
Even arrays (objects where all the keys are integers) are only ordered because we traverse them in an ordered manner
But the concept of key value pairs isn't inherently ordered

### Spawning vs Cloning: What does it Solve?

One more thing that bothers me is
A lot of the supposed advantages of spawning over cloning, have quite elegant solutions in cloning
For example, with spawning, you cannot override properties like you do in cloning
So cloning may seem unsafe because any public property, you have to worry about it getting overridden
Which can be dangerous if you have private behavior that depends on that property
But there's a simple solution: move the value to a private property, and have the public property just point to it
(But the private behavior reads from the private property not the public one)

    foo:
        _val: 10
        val: _val
        someCollector <: _foo*_foo

That way, overriding the public property doesn't affect the behavior
And it makes a lot of sense too: keep all the behavior private, and expose values to the public using pointers
(we mentioned this technique previously in the section "Read-Only Private Variables, Public Mirrors")

one can also prevent objects from being cloned using proxies
see section "Cloning Authorization Revisited and Proxies"

in addition, spawning allows for private arguments
since cloning is implemented using insertion to send in arguments, and insertions are already private
however, we already achieved this using closures
(see section "Private Arguments and Closures". The example is repeated below)

    fooFactory: mypassword >>
        => input >>
            => input==mypassword? "success" : "wrong password"

It's clean and simply workarounds like this that made cloning seem like the right choice for so long

So why did we switch to spawning?
The security issues with merging?
But then we can simply allow cloning without allowing merging (as in you can't pass in an arguments object, you have to pass in arguments directly)
Maybe so parent can control child creation? Or to make some objects non-clonable?
But the parent can control that already, by controlling how much behavior is exposes to the public
Techniques like proxies, mirrors, aliases
Was it just because cloning felt asymmetric?

What's the point of implementing cloning using spawning,
If people end up using cloning 100% of the time
Might as well have just made cloning the default, and implemented it directly in the interpreter
and just specify in the spec that cloning can return undefined if the callee wants to

we could have other types of creation other than cloning, also implemented via spawning
eg mixins

Mentioned in previous section about how cloning feels more like caller responsibility, and is security concern

When we think of actors
We think of things we communicate with
Send messages to
Not something we duplicate
If everything were cloneable
It would feel weird to declare, say, an object that represents your profile info
Because you wouldn't want it being duplicated
Even if it were private (since it could technically still be cloned by actors that have the private key)
And it feels weird to have to create a "public mirror" of your profile that exposes public references to a few properties
Instead of just making your profile public (and having some private properties inside)

### Sets vs Actors: distinct or combined?

now that sets are a primitive
maybe we can separate the concept of objects and sets a bit further
specialize the roles a bit

sets are for collecting insertions
you can only insert into sets

objects are for defining properties

but then that prevents custom insertion behavior
for example, what if we wanted a collector that was public, but kept insertions in a shared private key for local access only
example:

    foo:
        _someKey: ()
        someCollector: collector
            [_someKey]: _insertions
    bar:
        foo.someCollector <: 10

(notice that we use `_insertions` to reference any insertions in the current object. It's a special keyword, similar to this)
we could have used object methods/modifiers instead

    foo:
        _someCollector: collector
        insertNum: num >>
            _someCollector <: num
    bar:
        foo.insertNum(10)

this could be a bit cleaner

feels a bit restrictive though
i think it would be nice to be able to insert into any object
and any object can retrieve its insertions using `_insertions`

### Consolidating Actors and Sets

there's a few advantages to combining actors and sets into the same type
Means you can use them interchangeably
esp important with dynamic typing
Don't have to worry about which type it is
Dont have to worry about using insertion for some objects, and modifiers/mutations for others

In fact it could be dangerous to have insertions fail on objects, because it doesn't return anything, so there's no way to indicate an error

Actually when we implemented cloning using insertion
We needed custom insertion
Arguments objects are inserted
Only visible to the callee

Almost the opposite of when we were trying to implement insert() using cloning
    see section "Implementing Insertion using Cloning and the `.clones` property"

Sets are the behavior of an object
Finite
Property accessor is how that behavior is mapped to the address space

However, sets and objects are used in completely different ways
You can use the `map` operator on sets, but not objects
You can use property access on objects, not sets
So i guess if you combine objects and sets, it would be like two completely different entities in one variable

Recall how a collector works
The insertions are public, so anybody can insert and anybody can read the insertions
However, right now an object's insertions start out private, only accessible via the `_insertions` keyword
How do we make an object's private insertions available to the public?
maybe Something like

    mycollector:
        insertions: _insertions

but then you would have to map across `mycollector.insertions`
How would we make it so you can map across `mycollector` directly?


### a note about keysets and valuesets

They have to be declared
Not generated
Since declaring them declared what keys are public

### Implementing Scope using Spawning



### Implementing Scope using Cloning - Circular

i was re-visiting about how we implemented scope using cloning
and I found a contradiction

1. scope is implemented using cloning (an external template is cloned with the scope passed in as an arg)
  1. // TODO: FIND REFERENCED SECTION
2. scope has to be passed in as a private argument
3. all references are transformed to property access on `this`
  1. // TODO: FIND REFERENCED SECTION
4. private arguments are implemented using closures, and scope
  1. see section "Private Arguments and Closures"

circular!

so perhaps implementing scope using the spawn model is the only way
because the spawning model doesn't require closures to pass in private data

either that or we can just make private arguments a core functionality

### Nicknames

One benefit of typed languages is function polymorphism

in javascript, you can use Sets() to easily filter dups from an array

    return new Set(my_array)

however, if you have a custom comparison function between array items to check for equality, it gets a lot more complicated

    let filtered = [];
    for (const item of my_array) {
        if (!filtered.some(el => el.id === item.id)) {
            filtered.push(item);
        }
    }

note that we can't even use `Array.includes()`, we have to use `Array.some()`, because we have a custom comparator function
which leads to some very unintuitive code
in a typed language with polymorphism, we could re-use `includes()` with a `Comparator` as the argument, and it could automatically switch to using the comparator version of the `includes()` function
in essence, typed languages are slightly more expressive because they can use the same function name to capture multiple different behaviors
instead of being forced to re-name the function every time you want to handle a different type of argument

in Firefly, perhaps we can allow nicknames, which are more like workspace settings
adds a `*` to the end of the name to show that it's just a nickname, eg `filtered.includes*(el => el.id === item.id)`
basically just a way of customizing how a program looks, to make it more readable
similar to the original ideas behind metaprogramming
// TODO: FIND REFERENCED SECTION


### Loaders (TODO check for duplicate name)

if we simply ignore all loading, and have something like

    someCollector
    webpage:
        for image in someCollector:
            <img src={image}/>

then imagine if someCollector contained 1 mil images
you want lazy loading + loading indicator
without cluttering the code



### // TODO: name these sections


Dynamic Access
    Who does the property access
    how powerful can it be?
    Property muxers
        see section "Property Muxers"
    Key transform: transform the key before re-routing
        eg, a proxy/wrapper around some `nested_object`, and when you access `wrapper[key]`, it accesses `nested_object[key+1]`
    Value transform: route to another object, then transform the returned value
        eg, a proxy/wrapper around some `nested_object`, and when you access `wrapper[key]`, it returns `nested_object[key]+1`

Secure computation
    You can run code without knowing what it does
    Almost like cloning, since the callee gives you the code to run


### Firewalls and Shallow Copies

(previously discussed in "Firewalls and Minimal Scope")

Like dynamic property access
You get the program, and you can use it however you like, anonymously
Without worrying about it sending messages out


You can't just firewall one node
A program is made up of a network of nodes
You have to firewall all of them


Whoever creates it controls it
So to firewall a program
You have to create it yourself
You have to be given the source code
So maybe the callee has to flag a program as "copy-supported", which tells the caller to create the clone themselves, and shares the code for it

Standard functions like `forEach` or `map`
Surely those can be run by the caller themselves


Sort of like javascript `eval()`
You can read the template/object, and then run it within your scope, using your environment
If you're given a network of nodes, you can put them in an address space so that each node can reference and insert and read from other nodes in the network, or nodes that you provide in the scope (eg standard functions like forEach or Map), but if they try to read/insert from an outside node, it fails


However, if it were truly encrypted, then references to forEach and Map would also be scrambled


shallow copy of behavior
would allow the caller to create and execute their own child
and they can do it within a firewall
also would be useful for open source templates
where the provider of the template doesn't want to bother with executing all calls themselves
eg the forEach function, whoever calls it should execute it on their own machine, and since it's completely public, there are no security issues with doing so

so then when to do callee-responsible spawning, vs caller-responsible copying?





### inheritance and source code ???

(this section is sorta weird, check out the note at the end)

How do we extend objects with more behavior
Has to be public?

    SomeService: name >>
        _computeVal: some complex computation
            => result
        [someKey]: "protected method"
        getVal: a,b >>
            result: _computeVal(a,b)->
            console.log(name + "finished")
            => result

    MyService: SomeService
        name: "myservice"
        _computeSecondVal: some complex computation
            => result
        getLargestVal: a,b
            result1: this.getVal(a,b)
            result2: _computeSecondVal(a,b)
            => Math.max(result1, result2)

seems to go back to our previous discussion about public code and behavior
if you make a property public
you make it's code public
and whoever wants to clone it can copy the code
so if you want to extend a service, you first tell it to spawn a clone, and then you spawn your own object with additional private behavior, and override any properties on the clone that you know of (by passing in a keyset)
but any private properties are not carried over to the extended object
since you can only create properties that you are aware of
And recall that by passing in a keyset, you are declaring what keys you are aware of, so the callee can safely override them, without worrying about proxies or dynamic property accessors causing security issues (discussed earlier)
(In reality what you are doing is creating new behavior on your end, and then telling the callee to delete its behavior and rebind to your behavior)

note 2/18/20:
* honestly I'm not sure exactly what I was talking about in this section lol
* a lot of this seems incorrect and inconsistent with some of my previous conclusions
* you don't need the source code of an object in order to extend it
* cloning an object is the same as extending it
* and you can clone objects with private behavior


### Sandboxing and Publishing

A better name instead of firewalling
Instead of the callee flagging itself as "copy-supported", the caller can copy any object they want
And it copies whatever behavior it can see
You use the keyword sandbox do to a copy



Callee still has to flag it
To obfuscate the behavior before making it public

flagging as "copy-supported" does three things:
  1. Obfuscates all private behavior within the scope
  2. Declares all keys for all behavior
  3. Sets a flag indicating that it is "published", and anybody who wants to use it has to copy it and execute it themselves


now when somebody copies it, they can be sure that it's not making any outside calls
Because due to how scoping works, any external references are accessed via `this`
    // TODO: FIND REFERENCED SECTION
And since the caller created the object themselves, they provide every variable in the object's scope
And even nested objects must get it from the outer scope, so ultimately the caller is aware of all bindings and references,
and can make sure it all stays within the sandbox

This is true for any copy
Even if the caller makes a copy of an object that isn't published
(Aka just copying any public behavior)
They can't guarantee that they copied everything (since they don't know if there is private behavior or not)
But they can guarantee that it is sandboxed


Notice that obfuscation is important for something like

    Foo:
        _bar: "hi"
        _private:
            a: 10
            b: 20

Technically `bar` is already obfuscated, because the key is private and generated and will probably look like some random string of digits like 8103573927492
The same with `_private`
But the stuff inside `_private` uses normal public keys, and while they are not normally accessible, a published package would have to expose all nested objects so that the caller can copy them, and so we would have to obfuscate


Note that a malicious callee could declare themselves as published, while keeping some behavior private (and thus unable to be copied)
However, all callers would be copying the callee, and wood end up with broken copies (that are still sandboxed)
And the callee gains nothing from it



### Summary of How Subclassing Works

creates clone of parent class
Spawns child with additional behavior
mixes clone and child to create subclass

Private properties are not carried over from the parent class (even though the behavior is carried over, it's unaccessible)

You can either carry over private properties (cloning), by exposing all additional properties to the parent class
Or you can have additional behavior that is private, and not carry over the parent's private properties
But you can't have both private properties of parent and subclass

This is because ultimately, there has to be a single actor that determines the property mapping of the result
Can't have two independent actors, or it may lead to conflicts (they both try to put values on the same key, without being aware of eachother)
Why not have some protocol to resolve conflicts? Eg using `overdefined`?
Because such a protocol is basically an actor itself. It needs to be aware of all private properties on each side, in order to resolve the conflicts
So it all ultimately has to be decided by a single actor

Note that we can have dynamic property accessor, a mux

What about secure cryptography and Secure two-party computation
Like the dating protocol
Could we use that to merge?
Well the problem is not the conflict resolution protocol
It's control and responsibility
Guarding against attacks like the "friendly fire attack"
A new name I came up for when the caller uses a reference to an external arguments object

### Restricted set_spawn - set_spawn restricted to `_insertions`

instead of the following:

```
someCollection
foo:
    for x in someCollection   // set_spawn off a public collection
        bar: x*x
        anotherCollection <: bar
```

can we design it so each actor can only set_spawn once, off of the actor's internal insertions?
aka, an object can't set_spawn off somebody else's set
this basically means public sets don't exist

maybe instead of using public collections, we can make the collection
accept "listeners", and then it inserts into each listener every item
in the collection, and each listener does it's own set_spawn

```
foo:
    collection.listeners <: _bla
    _bla:
        set_spawn x >>  // spawn a set from _insertions and name each item "x"
            bar: x*x
            anotherCollection <: bar
collection:
    listeners:
        set_spawn listener >>
            // we somehow need to insert every item
            // from the collection into each listener
```

however notice that we need a nested set_spawn
but that isn't possible if each actor can only set_spawn off their own insertions

in fact, right now our language only has 4 core operators

spawn
insertion
property access
set_spawn

### Infinite Behavior and Recursive Insertions

hmm the only way i can think of to create infinite behavior using these operators
is if scoping worked as well
or even if the child can access parent at least
or even if the parent can insert into each child

then you can do something like

```
foo:
    set_spawn x >>
        index: x.index+1
        foo <: this
foo <: (index: 0)
```

notice how, after the initial insertion, each insertion will
cause another insertion
in a sense, the insertions are recursive, like a loop

however, this either requires scope to be available
or, more simply, for the parent to insert itself into the child
    which only makes sense if you can only set_spawn off the actor itself
    because what would "parent" mean in the context of set_spawning off a public collector?
so in this case, `foo` is inserting itself into each child

actually, perhaps the parent can choose what to insert into the child
they provide the scope/environment for the child
and they have sole access to the child

in the section "Choice to Exist", we talked about how children can read from their environment
but the concept of "environment" is from scope, which is implemented
so it makes sense that the parent has to pass

### Restricted set_spawn - how to achieve nested maps?

(continued from prev section, "Restricted set_spawn - set_spawn restricted to `_insertions`")

could you leverage this to mimic nested set_spawns?
for example, could you replicate the following javascript behavior?

```js
for (var i = 0; i < array1; i++) {
    for (j = 0; j < array2; j++) {
        console.log(i + ',' + j);
    }
}
```

after experimenting around for a bit more
I think it makes sense to allow public sets
You should be able to read from a set anonymously
trying to mimic nested set_spawn using only self
Shouldn't have to do any weird insertion business just to map across a set
Maybe you can just put `_insertions` onto a public property
And that exposes it to the public
And you are accessing it like any other value
However that makes it so sets and actors are distinct
And we already talked about the disadvantages of that
// TODO: FIND REFERENCED SECTION
Spread operator allows actors to be read/mapped-across like sets
Also, set_spawn can act across public sets
The parent still inserts the environment into children spawned from set_spawn
publish insertions
It's like declaring properties

### Black Boxes

- Sometimes you need ordered execution to define a type of operation
- for example, to define addition across a set of items
- you first define addition across two items, and then use recursion to chain it across a set of items
- and then you can wrap it in a `setSum` function
- however, you then would want to treat the function as a "black box"
- abstract it
- where the internal implementation can change, all you care about is the behavior

### Ordering Sets

- in fact, in order to sum across a set in the first place, you have to introduce some sort of order
- so we would need some sort of operation to arbitrarily order the set
- maybe just use `[...mySet]`
- however, whoever uses this new ordered list, has to be aware that the order can change anytime

### Implicit Templates

Definitions are only spawned into objects if they are standalone `(some def)` objects
Otherwise they are templates, implied templates
For example, in `...(some def)` and `foo(some def)`, `(some def)` is a template
Only in `x: (some def)` and `foo(10, (some def))` are `(some def)` actual spawned objects

in something like `foo(some def)`, the template `some def` is passed to the callee, who spawns the child object using the overrides specified in `some def`
however, to do so, the callee has to be able to read the template
in the section "Templates and Property Access" and "Templates and Property Access 2", we talked about how all property values should be undefined (since the template has not run yet)
however, recall how if a property is public, you should be able to see the corresponding partition's source code (first mentioned in section "Cloning and Source Code")
otherwise the template would be unusable

### Copy Operator `...`

Spread operator `...` is copy operator
Works on templates

### Logging Example

In some other project, I was working on setting up some logging, and the structure of it looked kinda similar to this:

    LOG_LEVEL_MAP = { error: 5, warn: 4, ... };
    createConsoleLogger(level) {
    	if (global.isDevEnvironment && LOG_LEVEL_MAP[level] < LOG_LEVEL_MAP[global.level]) {
    		return null;
      }
      return new consoleLogger()
    }
    createFileLogger(options) {
    	...
    }
    export {
    	loggersForAlice: [
    		createConsoleLogger('info'),
    		createFileLogger({
    			prefix: 'alice_',
    		}),
    	].filter(Boolean),
    	loggersForBob: [
    		createConsoleLogger('warn'),
    		createFileLogger({
    			prefix: 'bob_',
    		}},
    	].filter(Boolean),
    }

I decided to refactor it to something like this:

    LOG_LEVEL_MAP = { error: 5, warn: 4, ... };
    consoleEnabledForLevel(level) {
    	if (global.isDevEnvironment) {
    		return false;
    	}
    	return LOG_LEVEL_MAP[level] < LOG_LEVEL_MAP[global.level];
    }
    createConsoleLogger() {
      return new consoleLogger()
    }
    createFileLogger(options) {
    	...
    }
    export {
    	loggersForAlice: [
    		consoleEnabledForLevel('info') && createConsoleLogger(),
    		createFileLogger({
    			prefix: 'alice_',
    		}),
    	].filter(Boolean),
    	loggersForBob: [
    		consoleEnabledForLevel('info') && createConsoleLogger(),
    		createFileLogger({
    			prefix: 'bob_',
    		}},
    	].filter(Boolean),
    }

feels a bit cleaner
but notice that I basically moved from the child determining whether or not to spawn itself
    (in `createConsoleLogger()`)
and moved some logic so that the parent determines whether or not to spawn the child
Often the child does not know the conditions that are necessary for each child to exist
and instead of passing it into the child, we just keep the logic in the parent and leave the child unaware
so what does this mean for our language? should firefly continue using the choice-to-exist model?

previously we talked about how parents being responsible for defining+spawning children, seemed too complicated
bloating the parent definition
because if the child spawns grandchildren, then technically the parent would have to define the children, and define how the children spawn grandchildren
however, I was only considering the possibility that each descendant is defined statically
but if we had a descendant that was defined dynamically, perhaps through computed properties and insertions
(almost like somebody else is live-coding the grandchild using insertions)
then the parent only needs to provide the framework for converting those insertions to properties
doesn't need to know what the grandchild ends up looking like
so it doesn't really bloat the parent definition

### Private Shared Clone() Function

maybe the `.clone()` function can be actually be a private property
accessible by a private key that the "machine" has (aka the machine or server that has all the resources, that is executing all the actors)
outsiders can't clone the actor
but any actors created on the same machine, can clone it all they want

### Moving and Re-mapping Properties 2

- could an actor turn a public clone() function into a private one themselves?
- clone an existing object with a public `.clone()` method
- into an object with a private but shareable `clone()` method?
- in order to "move" the behavior to a new property
- you would have to do "reference moving", discussed in section "Moving and Re-mapping Properties"

- however, recall that now that cloning and overriding is a behavior that the callee exposes (not a default behavior)
- the callee receives the clone request (with what properties the caller wants to override), and decides how to spawn the new child
- so if the callee wants to expose a way to specify reference moving, it can

anatomy of a module
outgoing: insertion
incoming: reads, insertions
internal: spawn, setspawn

### Cloning and Source Code 2?

now that cloning is a behavior exposed by the callee
the callee doesn't need to expose the source code anymore right?

templates represent source code

we don't need to expose source code and value on a public property

callee has a private property that stores the source code
uses that to spawn children
and passes it to children so the children can spawn grandchildren themselves

templates have to be full public
if they are meant to be copied, manual copied

but then what if you want a template with private behavior
aka, define a method on an object that is meant to be cloned, but is dormant in the beginning
has no initial object

### Ordering Sets 2: an alternative to set spawn?

what if instead of set spawning
we had a core `order_set` function that converts a set into an array of form `(0: ..., 1: ..., 2: ..., etc)`
and then we used that to spawn across a set
the numerical indices could possibly generated without recursion
something similar to church numerals?
a simple successor function like

    successor: num >>
    	=> (prev: num)
    zero: ()
    one: successor(zero)->

wait but we can't use cloning...
ultimately we need some sort of repeating behavior
so we need set_spawn

what if we used dynamic properties?

    startingKey: ()
    foo:
    	[key] => (prev: this[key.prev])
    	[startingKey]: ()

will generate something like

    foo:
    	_startingVal: ()
    	[startingKey]: _startingVal
    	_val1: (prev: _startingVal)
    	_key1: (prev: startingKey)
    	[_key1]: _val1
    	_val2: (prev: _val1)
    	_key2: (prev: _key1)
    	[_key2]: _val2
    	etc...

a few problems with this
i don't know if this works
there are infinite items
i don't know if it is it traversable
and recall that i suspect that dynamic property access is not anonymous



you can operate on an actor in 4 ways
insert into it, `insert{target,item}`
set_spawn, map across it, `map{target}: item >>`
read from it, `prop-access{target,key}`
convert it to an ordered set, `make_ordered{target}`

could we use `map` to implement property access?
so instead of doing something like `someExpr(foo.bar)`
we would package key-val pairs into set items and then do

    map{foo}: item >>
    	if (item.key = "bar")
    		someExpr(item.val)

however notice that we are using property access anyways, circular
also, how would you control public/private access?
we want some properties to be accessible to some outsiders
but with this, all outsiders have the same access

we also might want the operation `any` or `pick_one{target}`, which picks a single random item from the set
we could implement this using `make_ordered`, just do `make_ordered{target}[0]`
but could we do the opposite? implement `make_ordered` using `pick_one`?
this seems preferable because if we only want to pick one item, `make_ordered` introduces unnecessary order for the rest of them
maybe we can do

    make_ordered: someSet >>
    	val: pick_one{target}
    	remaining: collection
    	map{target}: item >>
    		if (item != chosen) remaining <: item
    	next: make_ordered(remaining)
    
    x: make_ordered((1,2,3,4,5)) // recall that pick_one chooses randomly
    x.val                        // returns 3
    x.next.val                   // returns 1
    x.next.next.val              // returns 4

something like this

### Reference Equality and Referential Transparency

(note: reference equality was previously mentioned in "Making the Case for Reference Equality", but this is a different topic)

is equality `=` also a core operator?

in pure functional, `=` is implemented using functions, as well as `and`, `or`, and `true` and `false`
there is no reference equality
doing so would break referential transparency (see [https://stackoverflow.com/a/27773792/1852456](https://stackoverflow.com/a/27773792/1852456))
eg if `f(x) = y`
then we should be able to replace `y = y` with `f(x) = f(x)`
however, if `f(x)` creates the function `y`, then each `f(x)` would create a different `y` with a different reference
and `f(x) != f(x)`

put another way, referential transparency means that a function call with the same arguments should produce the same value

This is actually an incredibly useful property because it means we can make optimizations like caching
Where, if a function is called with the same arguments
The interpreter can use a cached value
This is not possible if each call produced a different object

I guess one way to think about it is, every call has a unique identifier, so that way every call would have different arguments, so results could never be cached

so what about firefly?
Note that in Java, equality internally uses the `equals()` method, so `foo == bar` is actually `foo.equals(bar)`
However this mechanism feels a bit asymmetric and ugly
Also, `foo` might happen to be a bad actor that always returns `true`

### Identity Theft

we actually talked about referential transparency before
    see sections "Referential Transparency" and "Referential Transparency II - Referencing vs Nesting "
in addition, we talked about how to handle equality
using a unique hash, that actors can override if they want a custom equality function
    mentioned in previous sections "Part 1.5 (returned from yellowstone)" and "unified primitives?", but these section names might change

but this `hash` or `objectId` has to be visible to everybody who wants to check equality
but if it's visible, then what's to stop somebody else from creating an object with the same `objectId`?
identity theft

perhaps we need a central authority?
somebody that assigns everybody a unique address?
(i guess this is similar to how there is a centralized protocol for everybody to be assigned a unique IP)

this unique id would be hidden in a private variable that the central authority can access
and whenever you use the equality `=` operator, it sends both objects to the central authority, who checks the ids of each and compares them
note that just because the central authority needs access to the id, doesn't mean the central authority has to spawn every object
the parent can ask for an id from the authority, and the authority will give both an id and a private key
and the parent will spawn the child, storing the id using that private key

maybe when you define an entire program, there is a local id assigner,
and all vars local to that program can use local ids (kinda like local ips in a LAN subnet)
but once you want to publish an object, and you need to give it an id from the central authority

maybe ids work kinda like tags?
they aren't stored in the object themselves, they are stored in an external hashmap
but to retrieve it from the hashmap, you need the object's id
circular

also, it seems a bit intrusive to require all public objects to require a centralized id
what if you want to exchange messages with a friend?
do all those messages need to go through the CA (central authority)?

also seems a bit intrusive to send both objects to the CA to check equality
why can't the parent check the equality themselves?

what if the central authority was just an id generator
and it signed every id with it's private RSA key
and then you could use the central authority's public RSA key to verify that the id is valid
so the object never actually passes through the CA

seems a bit reliant on public-private key encryption though...
are we sure it's secure?

Also, if the equality function is executed by the parent
Then an bad actor can easily retrieve the ID of an object
And then spawn children with that ID
And since it's a copy, it also copies the CA's signature

So either:

1. Objects dont create their ID
2. 

We don't want a CA built into the language
Such a mechanism should be built on top of the language
So if somebody wanted to use something different, they can

However, we want objects to be able to publish their IDs for others to see
But prevent people from impersonating others by copying their ID
This sort of goes against many of the ideas that iv had before
That any piece of data can be copied and passed around anonymously
Though copying isn't bad, as long as it's obvious who the "author" or "owner" of the id is, and who's the imposter

### Double-Sided Equality

Perhaps the way it works is similar to the Java `equals()` method
Except it checks the result both ways
Aka, `foo = bar` turns into `foo.equals(bar) && bar.equals(foo)`
And then each object checks the id of the other against its own private internal id, and returns true if they are equal
If a bad actor always returns true, the other actor still has to agree in order for the equality operator to return true
And the internal id is hidden, in fact the entire behavior of the `equals()` method can be hidden, so the bad actor can't copy/replicate it

This method also guarantees that equality is commutative

But wait, if the internal id is hidden, then in `foo.equals(bar)`, how does `foo` compare its internal id to `bar`'s id if it can't even access `bar`'s id?
likewise for `bar.equals(foo)`
and if `bar` ever gives `foo` its id, then `foo` can copy it

What if instead of storing the id like `(id: fs8ubd9zq2e)`, we instead store it like `([fs89bd0zq2e]: true)`
that is, the secret id is stored as a key, not a value
in `foo.equals(bar)`, `foo` simply takes its internal id, `fooId`, and checks `bar[fooId]` to see if it exists
likewise for `bar.equals(foo)`
this way neither side reveals their id to the other
in addition, this takes advantage of anonymous reads, because if reads weren't anonymous, then each side would be revealing their IDs to the other

So I guess that shows that equality can be implemented via core operations
note that there still needs to be somebody that generates ids and prevents collisions

but this can happen in a distributed fashion:
    the parent generates unique ids for children,
    and then children generates unique ids for grandchildren using its own id as a prefix or something,
    etc etc

### Set Operations

(continued from Ordering Sets 2)

earlier we talked about implementing make_ordered using pick_one
but what if set contains duplicates?

instead, pick_one should return the picked item and the "rest"

what if we created a fn that was stable only when one item was removed
something like
    
    for item in set:
    	if (!

What about other set operations, should they be core operations as well?
Things like
cardinality? or `size()`?
is_empty? (This could be implemented using `size()`)

Even something like `set.contains(item)`
This is a little more complicated since sets can contain duplicates
So maybe `contains` should return the number of occurrences?
Or maybe we need another function for that, `occurrences`?

Now there are 4 operations on sets
`make_ordered`, `pick_one`, `occurrences`, and `size`
Note that they can all be implemented via `make_ordered`
But as mentioned previously, `make_ordered` introduces unnecessary order for most of them
// TODO: FIND REFERENCED SECTION

Or maybe we can fix that with post-optimizations
Eg `make_ordered{set}[0]` can be optimized to only retrieve the first item and ignore ordering the rest
But if we ever make the ordered set public, then we can't make any optimizations anymore
Though arguably once it's public, you shouldn't optimize it anyways
Since reads are anonymous

In fact, anonymous reads prevents lazy-loading
Since we don't know when to lazy load


set operations represent awareness of the set as a whole
if we only had insertion and set_spawn, then there is no awareness of the set

eg `foo` and `bar` insert into `master` , and `master` spawns `child` for each insertion
then we could instead simply have `foo` and `bar` spawn the `child` objects directly
no need to use insertion and set_spawn
if we think about it from a distributed processing perspective
lets say *n* objects insert into `master`, and then `master` spawns a `child` process for every insertion, and each process runs on a separate machine
instead, we could have had those *n* objects spawn those processes themselves, there is no point for a central `master` machine

so perhaps we can go the post-optimizations route
and make the only set operation `make_ordered` or `convert_to_array`
because all other set operations (cardinality, is_empty, pick_one) can all be implemented from that

### Ordering by a Given Key or Column

or maybe we can take inspiration from databases
databases are not inherently ordered
but you can pick a column (eg `timestamp`) and order by that
so maybe we can do the same? allow a set to be ordered by a given key?

perhaps has to be given a comparator too

what if there is no key/column to sort by? uses random numbers
will do the same if the comparator returns "=="

can we implement this using set_spawn?
Maybe we can define some rules that are only stable when a single item is chosen, otherwise it resets
Converges to a single item being chosen


Note that, even if we took the ordered column, and just converted that column to keys

    foo:
       for item in _insertions:
          [item.timestamp]: item

We still can't do much with it
Because we don't know where the keys are
If we had a starting key, like the smallest one
Then we could iterate upwards to find the rest
Even if we had a random key
We could iterate upwards and downwards to find the rest
But since we don't have a single key, we can't do this
Also how does this handle duplicate keys?

### Implementing pick_one (or pick_first) for ordered values

So it seems like the main thing is to implement pick_one
To get a single value from a set
After all, that is what reductions are all about
We need to reduce a set of values to a single value
Capture the set into a single value

What if we did

    pick_one:
      rest: collector
      for item in _insertions:
         if (this.first = undefined | (this.first != overdefined & item.someKey < this.first.someKey))
            first: item
         else
            rest <: item

Many things happening here
First, a random item is chosen and since `first` is undefined, the item will be placed on `first`
(this is sorta like mutual exclusivity. Something has to start, and the process has to go in discrete steps)
For all the rest of the items, if an item has a smaller value, then it will also be placed on `first`
This will cause `first` to become overdefined, and all items on `first` will be thrown off
Another random item will be chose to be placed on `first`
Rinse and repeat
The only time it will stabilize is if the item on `first` happens to be the smallest item
In addition, note how duplicates are handled
If the smallest item is on `first`, but there is a duplicate item with that value, it still won't be placed on first because we use `<` not `<=`
Will only cause a collision if it's smaller, not if it's equal or larger

This takes advantage of randomness
Has to be purely random
Kinda reminds me of atoms
Maybe a bunch of atoms vying for a single spot
But only one makes it

Though atoms usually have an affinity or something to compare
And the one with the largest affinity would win
Maybe we can just have a `min` or `max` function

### Nested Definitions and Alternative Syntaxes

this `pick_one` implementation also feels a little ugly because
notice how we are defining the `first` property for the `pick_one` object, 2 levels deeper than usual
we aren't defining it directly within the `pick_one` block
we are doing it within the `for` loop and within the `if` block
looks ugly
I call this "nested definitions" or "nested property definitions"
and we talked about these much earlier
    // TODO: FIND REFERENCED SECTION


what if we designed set-operations like graphql
in graphql, you query a set of objects just like you would query a single object
the operation is simply repeated for every item in the set
eg

    query students {
    	name
      id
      classes {
        classId
        teacher {
          name
        }
      }
    }

`classes` returns an array of classes
`teacher` returns a single teacher
yet the syntax for querying on each, looks the same
the query on `classes` just acts on every single item in the array

however we can't really do this if we want sets and objects to be combined
because if we access a property on an object/set, are we accessing the property on the object or every item in the set?


for the nested definition ugliness
maybe we can "carry out" the definition using spread operators

    foo:
    	...for item in someSet:
    		...if (cond)
    			[item.key]: item.value

I believe we actually used this method previously
// TODO: FIND REFERENCED SECTION

### Public Sets vs Public Properties

How are public set items accessed anyways
With properties, its simple: you give and key and it gives a value
Another way of doing it is: you decrypt it using the key to get the value
Maybe accessing public set items works the same way?
There is a special key used to access the items?
Or perhaps a common protocol for accessing items

What if you had to convert insertions to an ordered list in order to publish them
Aka, public sets don't exist,
instead you simply map the insertions to the properties `(0: ..., 1: ..., 2: ..., etc`
And thus, accessing these items is simple
The protocol is just start at `0` and go upwards
this is essentially making `make_ordered` the default behavior for publishing sets

One of the problems with ordered execution
That I mentioned in the Readme
Is the shopping example
Instead of saying the order to retrieve items, I simply declare what items need to be retrieved
And the interpreter retrieves them in whatever order is optimal

But perhaps this is still possible with `make_ordered`
because while the items are now "ordered" in a sense, that order is not determinate
it can change at any time
so if somebody did something like `foo: somePublicSet[0]`
the interpreter can still re-order the items in whatever order is optimal, and then return the first item to `foo`
in a sense, we can still think of `(0: ..., 1: ..., 2: ..., etc)` as simply an unordered set of key-value pairs
whether or not to treat the `0, 1, 2, etc` keys as ordered, is up to the person traversing/reading the object

### Order Forces Agreement/Consistency Across Readers

hmm but the problem is
it also forces multiple readers to agree on the same order
if we just had a public unordered collection, and had multiple readers take the first 5 items or something
each reader could end up with a different set of 5 items
perhaps this collection is a trillion items spread on datacenters across the globe
it would be fastest for each reader to simply ask the closest datacenter for 5 items
and as such, readers on opposite sides of the globe may get different items
however, if we mapped the items to properties
now every reader would have to get the same 5 items
because we are essentially declaring the order

Insertions and cloning
What does our spawn model imply about the relationship between insertions and cloning
Before we said insertions are cloned
But cloning is an insertion itself
So if all insertions are cloned, then we end up in an infinite loop of cloning


Possible to implement pick_one without any order?
So that each reader would possibly get a different item?

Two types of unordered set
1. Sets of Key-value pairs
2. Sets of values


Once you turn values into Key-value pairs, you introduce some order
And multiple readers have to start agreeing

### Representing Properties as Sets of Key-Value Pairs

What if key-value pairs were an ordering on top of value sets
As in, if you have a set of `(key: 5, value: "hi"), (key: 7, value: "bye")` then that corresponds to `(5: "hi", 7: "bye")`
This is basically how we implement hashmaps
// TODO: FIND REFERENCED SECTION
Also note that we are still using key-value pairs in each item
eg the item `(key: 7, value: "bye")` uses the keys  `key` and `value`
So it's circular
I feel like we explored this idea before
// TODO: FIND REFERENCED SECTION


Maybe this relates to the idea of black boxes
(see section // TODO: FIND REFERENCED SECTION)
You can implement set operations from other set operations
But there has to be at least one defined at the core
But instead of arbitrarily choosing one
We assume one has been defined and leave it up to the interpreter to choose one to define

You need Key-value pairs to establish order
Order and consistency
In functional, everything is ordered (function arguments thru currying, linked lists are ordered, etc)
Otherwise everybody accessing a set might get different behavior
Key-value pairs are to ensure a consistent result for all readers
Perhaps consistency can be achieved in other ways, eg reading the value of items and ordering it or something

Hmm, in the quantum world there is no "consistency" and "agreement"
Multiple readers might agree that an apple is red
But at the quantum level, everybody will get different measurements for position/velocity
According to Schrodinger's wave equations
It's all probabilistic

Likewise, `pick_one` is also probabilistic
If you want to increase the odds for a certain item being chosen
Simply include it multiple times in the set

Recall how by default, behavior defined inside an object goes into private variables
Eg if you did `foo: a+(b*c)`
The `*` operator would be in a private variable
This is kinda how I think about Key-value pairs
They define concepts and relationships
So they need to have addresses so that other concepts can reference them
So that bindings can be defined to create a giant graph of relationships
If everything were probabilistic, it would be really difficult to define these graphs
Since you can't reference concepts/nodes anymore, you can only reference probabilistic sets of nodes and you won't know which one you'll get

Another way of thinking is the locker room analogy

It honestly feels like this concept of unordered sets is worlds apart from Key-value pairs
And trying to mash them together into a single object type
Is too forced

Though recall that the only sensible way to separate objects and collectors
// TODO: FIND REFERENCED SECTION
Is to make collectors full-public (anyone can insert, anyone can view)
And if an actor wanted to accept insertions without making them publicly viewable
They would have to use modifiers/methods
Eg `myObject.insert(item)` instead of `myObject <: item`

Also you end up with two types of objects
Which feels ugly




### Non-determinism and Unordered Sets

I guess what makes these unordered sets different is
**nondeterminism**
This is something that functional and imperative languages don't have
One reader could get a difference answer than another reader
Though this is only true if we allow this `pick_one` or `pick_subset` behavior
If we forced the reader to define some ordering before picking a subset
Then it becomes deterministic again
Eg you can't say "gimme 5 items", but you can say "gimme the most recent 5 items"
This is sort of how databases work
And I guess for databases, if you don't specify an ordering, it has a default `_id` or `_key` that it uses

Also we don't need to force an ordering when operating on the entire set
Eg `set_spawn`
Since that's already deterministic

Also note that, even if we force an ordering when retrieving subsets
The interpreter can optimize it however it likes
Set itself doesn't need an internal ordering

So should we allow nondeterminism?

Note that the functional representation of insertions
// TODO: FIND REFERENCED SECTION
Basically flag watcher model
Would result in ordered sets
And ordered traversal
Since the sets would actually be linked lists

### 

Let's say we made sets separate from objects
And we made set operations deterministic
the only way to write to a set is via insertion
To read from a set, you can either `set_spawn` directly or use `make_ordered` and then act on it like you would a list
Well `size` and `occurrences_of` are both deterministic without needing `make_ordered`, so maybe we'll add those in as well
But at this point, wouldn't it make sense to make these properties of sets, so you could be like `mySet.occurrences_of(15)`
But that would make sets objects

So maybe it's like functions and objects in JavaScript
You can access properties on both objects and functions
But you can only call functions

Note that if we had completely separate operators for sets vs lists
(eg if sets used set_spawn and lists used forEach or something)
Would be basically like having two separate types
Even if we mashed them into the same type
Because if we had some function `foo` that operates on multiple items
We would have to worry about whether to pass in our items as a set or a list
(if `foo` used set operators, we'd have to pass in a set, and vice versa)

Ordering introduces a lot of unnecessary info
For example, if we used arrays, we would need to establish that arrays all start at 0 and have numerical indices
If we used linked lists, we would need to establish that `node.next` gives the next node and `node.value` gives the node value
All this is unnecessary info when it comes to set operations

### Ordered vs Unordered Sets - Speed

If it's deterministic
Maybe it doesn't matter if it's ordered
All optimizations would still work
for example, if we think of a database

    _key   firstname   lastname
    -----------------------------
    0      bob         the builder
    1      jane        doe
    2      alice       smith

`_key` might look like array indices
but that isn't necessarily how it's represented internally in the database
the database 

so is there any difference?
i guess difference would be whether or not to expose regular list operations like `slice()`, `indexOf()`, `last()`, etc, for public sets
also consistency: whether or not multiple readers should expect consistency

but remember, reads are anonymous
you have to give the reader some way to iterate/traverse across the set
and if you give them some method
then they can share that method with others
so it becomes consistent anyways
unless you could somehow make it so that every person who reads it could get a different result

there is another big difference
if an insertion gets removed
users would expect `make_ordered` to return a non-sparse array
but that would be suboptimal
since removals in an ordered array are O(N)
So maybe we should used a linked lists for public sets?

so i guess the main difference between making public sets unordered vs ordered
is expectation
if we make public sets the same as arrays, with indices `0, 1, 2, ...`
then users would expect to be able to access arbitrary indices in O(1) using familiar syntax like `mySet[15]`
but they also might expect updates (eg if an insertion is added/removed) to be O(1) as well, which isn't possible with ordered arrays

if public sets were linked lists
then users wouldn't expect to access arbitrary indices in O(1), because the syntax `mySet[15]` doesn't work anymore
in addition, the expectation for insertion addition/removals to be O(1) can also be maintained
however, users might also expect to be able to check existence of an item in O(1) as well (because usually sets have the method `mySet.has(item)`)

a third way we can represent sets is using a histogram
 aka a hashmap of `<item, # of occurrences>`
this keeps insertions/removals at O(1)
and also keeps `.has()` at O(1) as well
(note: to make this histogram iterable, it would have to be a linked hashmap, not just a hashmap)

so should we make all public sets internally represented using linked hashmaps?
well shouldn't it depend on how it's used?
if users are often accessing items at direct indices, like `mySet[15]`
then we should use an array
if insertions are constantly being added/removed
then we should use a linked hashmap or linked list

and if we are to be consistent with out idealogy
of keeping things at a high level of abstraction
and not worrying about internal implementation
then we should technically expose *all* of these methods, `.has()`, `.slice()`, direct indexed access, etc etc
so the users can use it however they like

so is that what publishing insertions does?
if you do

    publishedInsertions:
        ..._insertions

then it automatically adds all these methods onto the object
(which would also include mapping the items to indices `0, 1, 2...`, so that array access is possible as well)

hmm that makes sense for how the `Collection` class/object should work
kinda like how Javascript `Array` has so many methods on its prototype
likewise, when you declare a collection in Firefly, `foo: collection()`
you are instantiating a new instance of `Collection`
and it comes with all the methods
but when it comes to a raw unordered set, shouldn't it be as barebones as possible?
so when you do `..._insertions`, it just publishes the set, but then you can manually add methods like `slice()` or `has()` if you want?

well what if we made `_insertions` an instance of `Collection`
and then you can make it public by putting it on a public property

    foo:
        myInsertions: _insertions

or you can turn the containing object into a Collection itself

    foo:
        ..._insertions

or you can manually add methods to the containing object

    foo:
        forEach: _insertions.forEach
        slice: _insertions.slice
        occurrences: _insertions.occurrences
        size: _insertions.size

(actually having ordered array indices makes updates much slower, see the next section "Anonymous Reads and Lazy Evaluation" for details)

### Anonymous Reads and Lazy Evaluation

hmm recall that because reads are anonymous
we can't really optimize based on what methods are being called
so doesn't that make every collection object slow
because no matter what implementation we use (linked list, array, linked hashmap)
we will have to keep every property up to date
since we don't know which ones are being read
so for example, if we chose the linked hashmap implementation
we would still have to keep the array representation `0: ..., 1: ..., 2: ...` updated
which is an O(N) operation for insertion additions/removals

This seems like a big drawback
I guess maybe readers can self-report what properties they need
But if any single reader doesn't self report
Then the object has to update everything
Maybe a parent can keep track of all references and reads to a private variable?
Is that even possible?

well it gets complicated because a nested child can insert it into an outsider
    this is akin to sharing a private link with a group, but then a group member sends it to somebody outside the group

        parent:
            _somePrivateCollection
            child:
                someOusider <: _somePrivateCollection

or the child could publish it onto itself
this is akin to a group member posting the private link publicly

    parent:
        _somePrivateCollection
        child:
            myParentsPrivateCollection: _somePrivateCollection

however, if all the nested children and grandchildren are executed on the same machine, and by the same interpreter
then the interpreter can track every object that has access to that private collection
and can see if it is ever leaked (eg if it is inserted to an outsider, or published to a public property)

I wonder if it's possible to make it so reads are anonymous, but it's still possible to tell if a property is read or not
as in, an object can tell which properties are observed and which aren't
but for observed properties, they can't tell who is observing it, or how many people are observing it

very early on we talked about big library objects
with tons of properties
but using observability to only compute what's needed
    see section "Observed Outputs"
that might not be possible anymore, with anonymous reads

what about something like react-virtualized
where it only renders the visible part of a long list

### Collections vs Arrays

I think for now, we should simply make `Collection`s behave like linked hashmaps
so they don't have ordered indices, like an array
and you can convert a collection to an array if you want using `to_array()`
but you have to keep in mind that updates will be much slower for the array

### Using Keys to Store Information

something i noticed
originally we thought of values as actual behavior
and keys as just pointers to behavior
but actually, we can represent an array of values, `(0: "foo", 1: "bar", 2: "zed" ...)`
as a histogram, a hashmap of items-to-occurrences
so in this case it would be `(foo: 1, bar: 1, zed: 1, ...)`
this shows that keys represent just as much information as values
they are two sides of the same coin
**key-value duality**
or more accurately, array-hashmap duality

it shows that instead of using values to store information (like in an array)
we can also use keys to do so, like in a hashmap

I guess keys can be thought of as references
After all, it has to check for equality
"behavior" is any insertions or spawns
But what happens if a reference to a key goes "offline"
As in, the machine that owns the key literally goes offline
So anybody referencing the key can't check for equality
(recall that equality requires calling the `equals()` method on each operand)
    (see section "Double-Sided Equality")

Well I guess it should just return false
If it's offline, nothing can be equal to it
And this isn't really any different from a value going offline
In fact, this idea that keys are references
Is nothing novel

I guess all it shows is how simple properties work
It's really just an equality operator that checks against the internal keyset

### Calculator problem and tightening loops

problem: create a simple calculator app
* this is modeled after the iPhone calculator or Windows calculator
* 10 digit keys (0-9) and 4 operations (+,-,*,/), "=" key and reset "C" key
* display shows the last inputted number, or the result if "=" is pressed
* display never shows an operation
* pressing "=" multiple times will repeat the previous operation (no-op if no previous operation, eg only a number was inputted)
* pressing multiple operators after eachother, will just change the operator (eg if you press `+` and then `-`, it just switches the current operator to `-`)


normal approach: state diagram + react

my approach:
create state var of tokens
    eg if you press `1` `2` `+` `4` `=`,
    the states are `tokens: [12, "+", 4, "="]`
bind the display to states

    display: if (tokens.last = "=") result
        else tokens.filter(isNumber).last


visualizations:
start with button inputs
create state var, and show expanded view
map out what the display should show for each state in expanded view

something that I noticed state variables do
they "tighten loops"
instead of having a giant feedback loop for setting and getting values
(eg get some value, apply a bunch of transformations, and at the end we set it)
we tighten loops to basically each input
    inputs can be button presses, clicks, basically raw I/O
each input is a state var, a tight feedback loop of states over time
instead of applying transformations between getting the old value and setting the new value
we move the transformations out, so the state variable is just a list of raw captures of the input
and then the transformations are applied to that list of states
so that all the values in the main logic just trickle down from transformations on these chains of states


a good example of this is in the section "Optimizers"
but a similar and simpler example is rolling average
let's use a rolling window of size 3
in imperative:

```js
let window = [];

function onNewData(x) {
    window = window.push(x).slice(-3); // push and then get last 3
    updateDisplay(average(window));
}
```

in firefly using state variables

```
data: state
onNewData: @time x >>
    data.push(x)

window: data.slice(-3)
display: average(window)
```

imperative is uglier because you have to think about what operations you need to do every update
with firefly dataflow, you can just model it using simple relationships

let's say we now want a window of size 7
we probably want to optimize it now to keep track of the previous rolling average

```js
let window = [];
let prevSum = 0;

function onNewData(x) {
    if (window.length == 7) {
        prevSum -= window[0];
    }
    window = window.push(x).slice(-7); // push and then get last 7
    prevSum += x;
    updateDisplay(prevSum/window.length);
}
```

this might seem like it would be difficult in firefly
but it isn't


also maybe an alternating version
shows you rolling average of last 3, skipping one in between,
so `[1,2,3,4,5,6,7,8,9,10]` (`10` being the last datapoint), it would return `(6+8+10)/3`


or maybe it takes pairs
for the last 6 values `a,b,c,d,e,f`, it returns `a*b+c*d+e*f`

or maybe its a delayed rolling average
rolling average of indices `n-10` to `n-3`

all these are pretty trivial in imperative too tho
need some example where ordered execution is messy
perhaps one where order changes, or requires multiple updates/executions per item


### Source Code and Partitions

* previously we talked about how public properties = public source code
* but if you think about it
* normally, every property only corresponds to one node
* so it's really not much "source code" if it's just a single node
  * though it does include any bindings or references from that node to any other public properties
* however, with partitions it makes a bigger difference
* because you can see a whole group of nodes

* so i guess the significance of seeing source code
* is with partitions

### Implementing Choice to Exist

* started thinking about how to actually implement spawning and "choice to exist" (see section "Choice to Exist) in my interpreter

* something that was quite elegant about cloning
* templates and cloning matched almost 1-to-1 with source code and interpretation
* the source code is the template
* the interpreter clones the template to create a live object

* but now we have moved away from cloning, and are now using spawning
* is there a similar relationship?

* well actually, there's no reason why we have to use source code to spawn objects
* we can spawn objects however we like
* cloning is like, taking a Lego set and following the instructions to build a model
* but you don't have to follow the instructions, you can just create whatever comes to mind

* spawning is like that
* you aren't restricted to looking at some source code, and copying it
* spawning is just the raw ability to create objects
* but how you create those objects is left to the creator

* in our specific case though, for now, we want our interpreter to use source code
* so it will look very similar to cloning

        source code =[interpreter]=> object

* recall when we talked about how spawning felt ugly
* because the parent has to define child behavior, including how the child spawns the grandchild, and so on
* so it seemed like the topmost parent would basically have to define everything
* everything ends up being defined in one place, one mega object
* instead of having things defined in modules, like we have in functional
    // TODO: FIND REFERENCED SECTION

* but then we solved this using "choice to exist"

* well now, while designing the interpreter
* it does feel like everything is defined in one mega object
* the source code
* the source code defines the root program, which defines the nested modules, and the modules within those, etc
* it's all defined in one giant source code

* so how do we modularize and break this up?

### Recursive Interpreters

* well we can break it up into smaller interpreters
* an interpreter for each object
   * (which we were kinda already doing, see section "Modular Parsing - Localizing Syntax Errors")
* when an object wants to spawn a child
* it first has to have a reference to the source code for that child
* and then when it wants to spawn it, it calls the interpreter on the source code
* then that child, might contain references to more source code, for the grandchildren

* so instead of having one object contain the definition for everything
* instead, each definition holds a _reference_ to other definitions

* note that, theoretically, an object doesn't have to spawn children off source code
* as mentioned earlier
* this is just the mechanism we are using now

### Child Interpreters vs Static Compilation

* every parent object has two options
1. imbue the child with the ability to spawn their own turing complete objects
   * eg give the child a complete and unadultered interpreter
   * in which case, the child would spawn grandchildren by creating a new interpreter and running the grandchild's source code with it
   * something like `new_interpreter(grandchild_source_code)`
2. customize the child's interpreter, so that it can only spawn certain objects
   * maybe it is statically bound to a few source codes, those are the only objects it can spawn
   * we are essentially taking `new_interpreter(grandchild_source_code)` and static compiling it into `spawn_grandchild()`
   * so the child does not have the freedom to spawn any source code it wants anymore
   * the `spawn_grandchild` function spawns an interpreter specifically tailored to run the grandchild, nothing else

### Class Names and Reflection

* sometimes when writing object-oriented code
* it can be useful to be able to get the classname of the current class
* Java uses reflection for this
* javascript also has mechanisms to get the name of the current prototype
* can we have any mechanism for this?


### Lazy Evaluation, DIY Properties, Lazy Properties, Public Cache

* something like `.values`
* is an O(N) operation using `.keys`
* a bit slow, would be cumbersome to force an object to update it every time
	* (on second thought perhaps not because an object's keys changes rarely...?)

* perhaps we can make `.values` a function
* so any object that wants it actually has to call it themselves
* make it "copy-supported" (see section // FIND REFERENCED SECTION)
* so that the caller has to do the operation themselves
* retrieve the keys, and read every corresponding value

* but maybe the caller can keep a cache of it
* call it #values or something

* `.values()->` is a bit ugly
* would be nice if the syntax still looked like `.values`
* even though it's a function

* maybe instead of a property, an object can declare a pure public function
* so that readers can calculate the property themselves
* these are called **DIY properties**

* or maybe we can have **lazy properties**
* somebody has to request it, before it will get calculated
* but that makes it a non-anonymous read
* and the expectation should be that any read, aka any `.someProp` syntax is anonymous

* well actually we could make requests anonymous
* because insertions are also anonymous
* for some lazy prop `lazyProp`
* creates a corresponding `lazyPropRequests`
* and anybody requesting a read, inserts `true` into the request box
* so the object knows to calculate it

* this is not quite anonymous reads though
* because while the reader is anonymous
* the behavior of the object can change depending on if it is read or not
* (eg, the object could have some other prop `foo` that is disabled when `lazyProp` is enabled)

* whereas "DIY props" are truly anonymous reads


### Recursive Interpreters II

(continued from "Recursive Interpreters")

* its important to notice this distinction
* the parents spawn the child, but they don't necessarily define it
* they could pull the definition from somebody else, or from some public repo
* but they create the behavior, turn it alive
* every object has to have an "interpreter"
* in order to spawn child objects
* the power to spawn any object, frees them from the responsibility of defining any specific object
* the parent doesn't have to define every child explicitly
* because it has the power to create any child
* so the definitions can be stored elsewhere


* something i noticed while using notion
* they dont have great offline support
* but they treat everything as an object
* every line of text, every page, every collection of pages
   * this is pretty much what i wanted to achieve with Facets and Cono
* so right now you can only have one object offline at a time
* any single page, or collection of pages

* i realized that my language would work pretty much the same way
* server side rendering, client side rendering, and offline clientside caching
* all are just optimizations and modifications on the page

### Implementing Properties using Insertions?

* the wiki for actor model states that actors can only
  * send messages
  * spawn actors
  * receive messages

* but my model also has "properties"

* so it seems like properties should be able to be implemented using the above 3

* we want reads to be anonymous
* but maybe they could be implemented using insertions
* since insertions are also anonymous

* reader simply inserts an empty object and the key that they are requesting
* callee finds the value for that key, and then inserts it into the empty object

* basically pass-by-reference, commonly used in imperative:

```js
function foo(input, errorObj) {
    try {
        return someComplexCalculation(input);
    catch (e) {
        errorObj.error = e;
    }
}

var errorObj = {};
var result = foo(10, errorObj);
console.log(result ? `Success! ${result}` : `Error: ${errorObj.error}`);
```

### A Static `Message` Type

( continued from prev section, "Implementing Properties using Insertions?")

* but we talked previously about how
* in order for the callee to do anything useful with the insertion
* the insertion has to have properties itself, like `readRequest: (key: "foo", value: ())`
    * see section "Representing Properties as Sets of Key-Value Pairs"
* so circular??

* not quite actually
* because these insertions can have a static structure, like a `Message` type
* perhaps a two-value tuple like `key: ..., value: ...`
* and so it's different from objects with properties, which are dynamic and can have an arbitrary number of properties
* (and I suspect this is what standard actor model languages are doing)

### Property Access using Insertions - Nested Definitions and other Implications

* if we show that property access is just insertion,
* it shows that "nested property definitions" are totally valid
   * see section "Nested Definitions and Alternative Syntaxes"
* because if property access is just made up of functions that take in a key and return a value
* there's no reason why some of that behavior can't be defined in nested conditionals or for-loops

* but this also allows for dynamic prop accessors
* which is dangerous, allows for proxying and "friendly fire attack" and such (mentioned previously)

* remember how we wanted property access to be able to capture it into a single object
  * see section "Private Keys and Anonymous Reads, Property Bundles"
* note that this implies finite objects, objects must be finite


* this is interesting
* if we restrict inserted objects to be finite
* (forgot where I was going with this)

### Standard Actor Model vs My Actor Model - Inserting Actors

* so the actor model defined in wikipedia distinguishes "actors" from "messages"
* and I suspect that in standard actor models, there is a `Message` type with a static structure
  * (eg the `key,value` tuple mentioned in section "A Static `Message` Type")
* so that actors can filter for certain messages and such
* but I don't have this distinction
* perhaps I can come up with my own formulation

in my model, every actor can
1. send actors to other actors
2. display a finite number of properties / unordered set items
3. spawn a finite number of actors
4. traverse over all received actors
5. convert the set of received actors into an ordered array


* note that the last one (ordering sets) is required if we want to calc things like size as well
* note that reason why wiki's actor model doesn't require this ordering-sets requirement,
* is because the wiki's actor model isn't persistent and reactive like mine
* so messages are already ordered by time

### Where does scope come from?

* all references come from scope
* so where does scope come from

* we originally talked about it being "statically bound"
    * // TODO: FIND REFERENCED SECTION
* but we don't want scope to be special or integrated into the interpreter,
* because scoping is a tree-like mechanism
* and we talked about how the real world is graph-like, and tree-like mechanisms are mere approximations
* so these tree-like mechanisms are just utlities, libraries, that should be implemented on top of the core

### Inserting Scope and Static References

* perhaps scope can be inserted
* but how do we ensure that nobody else can insert a "fake" scope, and confuse the child
* if scope had some public identifier, `is_scope: true`,
  then a bad actor could insert a fake scope with the same identifier
* maybe use a private key that is generated by the parent
* and the child's definition is modified to statically reference that key

        parent:
            _scope_key // some generated private key
            _scope:
                [_scope_key]: true
                ...
            child <: _scope
            child:
                _scope: _insertions.filter(item => item[_scope_key] = true)

### set_spawn, scope, for-loops

* what about set_spawn?
* in a set_spawn, each child needs to be able to reference an individual item in the collection

        for item in someCollection:
            item * item // some behavior that references "item"

* we need to insert the item into the scope before passing the scope to the child

* note that the syntax for set_spawn is to simply do a for-loop on a Collection

* however, a for-loop isn't always a set_spawn
* for example, a for-loop uses `forEach` for arrays

* also note that `map` is different from `forEach`
* `map` takes in a function, not a template, and then aggregates the output of each function call
* this also prevents the input `item` from being exposed on the output object

        result: arr.map((item => item*item))

* notice that even though `item` is passed into every child function, the result objects don't see it anymore


* do we need a `forEach` or `map` for collections?
* what if we want to take the result of the set_spawn, and put it into another collection?
* you can just use insertion

        result: Collection
        for item in mySet:
            foo: item*2
            result <: this

* you can even use functions, and only collect the function results

        result: Collection
        for item in mySet:
            foo: item*2
            => foo + 100

            result <: this->

### if-statements exploration?

* how do if statements work?
* first, the parser transforms the if-else statement into a function call,
    * `if_else(condition, trueBranch, falseBranch)`
* then we define the function `if_else` as follows

        if_else: condition, trueBranch, falseBranch >>
            booleanFn: condition = true
            resultBranch: booleanFn(trueBranch, falseBranch)->
            => resultBranch()->

things to notice:
* just like functional, booleans are functions, they take two arguments and:
    * the `true` function will return the first arg,
    * the `false` function will return the second
* `condition = true` is not redundant, since `condition` can be _truthy_, it isn't necessarily a boolean
* so we use `condition = true` to convert it to a boolean
* and then we use the boolean as a function, to get the correct branch
* and then finally, we spawn the branch and then return the result

### References and Static Binding

(continued from section "Inserting Scope and Static References")

* passing in scope via insertions is a little ugly
* because when the child references `_insertions`
* we probably want to filter out the scope insertion from this collection of insertions

* also, having the parent create a private key,
* and then manually modify the child to sift through insertions to find it
  * as talked about in section "Inserting Scope and Static References"
* seems a little overkill
* can we just make the child reference it directly?

* lets assume the child filters through insertions to find the scope object
* then the child still has to retrieve references to all the other objects
* via the scope object
* so whatever mechanism the child is using to store these references to other objects
* can't it use the same mechanism to store a reference to scope
* instead of retrieving it from insertions?

* recall that we can model property access via insertion and a static `Message` type
  * see section "A Static `Message` Type"
  * where each `Message` is a tuple of `(key: ..., value: ...)`
* so maybe that's whats happening
* you get the scope insertion
* and then you send messages to the scope insertion asking for the objects/value in scope
* and then it sends them back by inserting them into the message you originally sent

* what are references?

* seems like we want pass-by-reference
* but we don't want centralized address system
* is it possible?


* actually isn't `[_scope_key]` a reference too
  * the key we mention in "Inserting Scope and Static References"
* and we are statically binding that
* somehow the child has to already have `_scope_key`
* in order to search the insertions and find the inserted scope


* duck typing
* all that matters is the interface
* if property access returns the same properties, and insertions go to the same place, its the same object
* how that property access is implemented may depend
* for example, if A was bound to B, and they were on the same machine, then it could use memory addresses
* however, if A and B were on different networks, it may need to use web APIs to connect to eachother

### Constants and Static Embedding

* in fact, i think it would be impossible _not_ to statically bind some constants
* even if we wanted to just retrieve the first insertion
* `make_ordered(_insertions)[0]`
* the `0` is a reference to a constant

* perhaps when we create the "definition" for the child
* creating these bindings between properties,
    * eg `foo: bar.zed` creates a property node `foo` that reads the reference `bar` and accesses the property `"zed"`
* defining the structure of these bindings
* is the same thing as statically hard-coding a reference

* note that for every child, scope is only passed in once
* and only passed in from the parent
* when you want to override references in that scope, you have to pass in an "arguments object"
* to specify what values to override
* and that arguments object is created with its own scope
* and notice that for the arguments object, the scope is only passed in once as well


* also notice that every child always has at least one reference: the reference to itself
* i guess it will also have the reference to its insertions

* if insertions were ordered, then the parent could make sure the scope was the first thing inserted
* and then the child would retrieve it from the first

* however, at that point, the parent and child are agreeing to some static protocol for passing scope
* so it's basically the same as statically binding the scope variable

* i guess the only difference between a static reference
* and a regular reference (that goes through scope)
* is that you can override scope

* the idea behind overriding scope
* was the ability to override anything, change anything
* is it possible to create objects, where absolutely anything is overridable?

### Constants and Static Embedding - Turtles All the Way Down

(continued from prev section "Constants and Static Embedding")

* we can get around the ugliness of the scope insertion getting mixed with all other insertions
* create a private collector that parent has access to
* this is exactly the `initializer` method i talked about earlier
* // TODO: FIND REFERENCES SECTION
* however, we still need a private shared key for this to work
* and we'll have to statically embed this key on the child

* even if we try to make constants passed in via scope
* we would want it in a private var, to prevent outsiders from overriding it
* but that private key is a constant itself
* so that will need to be statically embedded

* not to mention, if every constant is retrieved from scope, each will need a corresponding key
* eg, instead of `"foo"`, you would use `scope[_constant][_foo]`
* but `_foo` is another constant, where are we going to get that one?
* turtles all the way down

* so I think constants have to be statically embedded too

* however, constants like strings and numbers are still concepts that are technically defined by the user
* for example, in functional, numbers are implemented using successor functions
* they aren't special or anything

* so these constants have to come from somewhere, provided by somebody
* makes the most sense for the parent to provide them
* and the parent can get them from its own parent

* so when the parent spawns a child, it statically embeds/binds constants
* to it's own constants and values


* maybe every time you do a prop access
* it is done via static binding

* well we can use successor fn
* or some sort of iterator
* but we still need to access the successor fn first
* so that would have to be static

* think as if prop access was a function (like it would be in functional)
* to get any prop, you need a key
* so we need a key at least in the beginning
* each key can only get one value, so for every value we need a key
* well a value can be a set of values
* however, since its unordered, we would need another key to order it
* we can also use the same key over and over
* eg if the first value was an iterator, and we kept calling `next` to get all the values in order

* but we need at least one key
* and then possibly some protocol (eg iterator) for the rest of the keys

### Constants and Static Embedding - a Single Layer of Abstraction

(continued from prev section "Constants and Static Embedding - Turtles All the Way Down")

* well but whats nice is if we treat any constant as a reference
* and we need another constant to bind it
  * eg `"hello world"` becomes `_scope[_STRING_hello_world]`, requiring an additional constant `_STRING_hello_world`
* that new constant is abstracted away
* so all the behavior inside the definition is still mutable, overridable
* including constants referred to inside the definition
* and as mentioned in the section "Constants and Static Embedding", that was the point to begin with
  * the ability to override anything defined in the object

* so every reference is provided via static bindings/embeddings

* so really the only thing we need to provide is a mechanism for re-binding references
* a way to change or override any reference _that is declared in the body of the object definition_
* that is the mechanism provided by our syntax

* what we are basically doing is taking every reference in the object definition
* and propping them up one layer of abstraction, hoisting them
* propping these dynamic, mutable references onto a layer of static references
* so since these static references are just static keys generated by the parent and embedded in the child
* if somebody wanted to override one of these references
* they could get the corresponding static key from the parent

* if the user wanted to rebind/override a reference a level deeper
* eg in the example earlier, if they wanted to rebind the constant `_STRING_hello_world`
* well that constant would first be referenced in the object definition
  * because you can only override variables that are declared in the source code, naturally
* and since its referenced in the object definition
* the interpreter will hoist it, creating a static key and putting it on top
* and you would be able to override it using that static key

### Implementing Static Embeddings - Initializer vs Parent Reference

* so if scope is implemented, we still need a way for the parent to provide variables
* which is basically what these static bindings and embeddings come down to

* a child can bind directly to values in the parent
* scope is an extension of that
* providing the child with variables at any level in the scope, not just the direct parent
* and it does this by passing scope down the chain

* should we use initializer
    * parent figures out what values the child needs
    * puts them on the child's initializer list
    * and the child references the values from the initializer list
* or allow child to directly reference parent vars

* initializer requires a lot of intermediate variables

* how does it work when a child needs a value from the grandparent?
* if the child directly references the parent,
    the parent first has to put the value onto one of its properties so the child can reference it
* with the initializer, the parent doesn't need to put the value onto one of its properties
    it just needs to put the value on the child's initializer list

* how would the syntax look for each one?

* really, since all this is happening in the interpreter, it doesn't matter either way
* the programmer won't see it
* these are both just mechanisms for static binding

* i don't want to spend too much time creating another "core language"
* that runs underneath firefly

* so for now i'll go with the simplest solution
* allow the child to directly reference the parent
* using a `_parent` reference
* that gets transformed into static bindings by the interpreter

* so there are currently 3 special reference keywords
* `this`, `_insertions`, and `_parent`
* all other references, are short for `this[_scope_key].foo`

### Implementing Static Embeddings - exploration

* so lets see how this works out in the actual implementation:

        object:
            _scope:
                for key in _keyset:
                    [key]: this[key]
                for key in _parent.scope:
                    if (key in _keyset))
                        [key]: _parent.scope[key]

* wait but notice the `_parent.scope`
* this is problematic
* the parent's scope is private
* shouldn't be accessible via a public property

* it's not enough for the child to simply have a reference to the parent
* plenty of other actors and objects could also have a reference to the parent
* but the child should have special access
* to private values and variables in the parent

* or perhaps another way to put it is
* the parent can insert whatever values it wants to the child

### Implementing Static Embeddings - Passing a Mapping

* consider the following

        grandparent:
            _foo
            parent:
                child:
                    => _foo

* remember that `_foo` is a private variable,
* so it corresponds to some randomly generated address that is hidden from the public
* somehow, the child needs to be able to reference it
* the parent needs to be able to say, "any time the child references the string `_foo`,
  I need to map it to the corresponding address that `grandparent` generated"
* so the parent needs this mapping between the string "_foo" and the correponding address
* and the grandparent needs to pass this in

* so this mapping is how private variables work

* it actually seems separate from how scoping works
* scoping works even if all variables were public

* works in conjunction with scoping
* scoping determines who this address mapping is passed to

### Implementing Static Embeddings - static substitution

* this mapping between private vars declared in the child, and static addresses that the parent generates
* is used to substitute all references to these private vars with their corresponding static addresses
* but this substitution has to be static

* if we make it dynamic, can be dangerous
* lets say some child contains `_foo`, a static reference to a value in the parent
* and this substitution mechanism will replace it with a static binding to the value in the parent
* what if the child interpreter spawns a grandchild that happens to also have `_foo` in its source code
* these are different references, so we need to make sure the substitution mechanism doesn't touch it
* static bindings are between parent and child, shouldn't affect anybody else

* these bindings are created when the template is defined, not when the object is created

* mm actually i think it's fine if a child interpreter spawns some grandchild source code that contains "_foo"
* every object has it's own interpreter
* the parent doesn't have to pass in the address mapping for "_foo" to every child interpreter
* only to the children that were created within the scope

### Implementing Static Embeddings - exploration II

(continued from prev section "Implementing Static Embeddings - static substitution")

* hmm so `_foo` corresponds to some generated address
* can we represent that in code?
* so something like

        _foo: some value

* would get transformated to

        _fooKey: ()
        [_fooKey]: some value

* and then `_fooKey` would be passed to child scopes,
* and anytime they reference `_foo` it transforms to `_scope[_fooKey]`

* however, note that we have another private var, `_fooKey`, does that require the same transformation?
* circular
* (revisit: I think here I'm getting a little confused about what's happening in the program and what's happening in the interpreter)

### Keys Require Keys?

* so far we have been running under the assumption that every value/node needs an address
* locker room analogy
* and public values are just values whose addresses are declared in the public `keyset`

* however, we also noticed that keys represent the same information as values
    * see section "Using Keys to Store Information"
* so every key is also a value
* so if every value needs a key
* and keys are values
* that means every key needs a key
* circular!
* we end up creating a key for every key, turtles all the way down

* this is different from the circular logic we discussed in section
  "Constants and Static Embedding - Turtles All the Way Down"
* in that section, we shows that we need to static embedding some keys
* however, here, we show that keys themselves need keys
* so how can we static embed a key?

### A Base Library of Constants

(continued from prev section, "Keys Require Keys?")

* well perhaps...a key is a static reference to an outside value
* this is also mentioned in the section "Using Keys to Store Information"

* but then there needs to be some sort of "base" library of constants
* to reference against
* 
* how are those constants created?
* is it possible to generate numbers with a successor function, like in functional?

### Comparison with Functional, and how Functional handles References

* how does functional handle references?
* functions have ordered arguments, and the function body just references these arguments
* so in a sense, functions key their arguments by index `0`, `1`, `2`, ...
* and then the function body references those arguments by their index, `args.0`, `args.1`, etc
* and these natural number indices are provided at the interpreter level, provided from the start

* or even simpler, the function body probably binds directly to the arguments
* no need for these intermediate indices

* however, for our language, having these intermediate keys are useful
* because we are binding scope directly and accessing values on scope via these keys
* however, each key is a direct reference,
    * eg using the example explored in section "Implementing Static Embeddings - exploration II"
    * the reference `_foo` is replaced with `_scope[_fooKey]`,
    * where `_fooKey` is a direct reference to the address of `_foo`
* these addresses and constants are provided to the child interpreter


* also, sometimes local references can be replaced with a direct binding

        _foo: ( spawn something ... )
        bar: do something with _foo

* in the example above, we wouldn't need an address for `_foo`,
* we can just bind the reference in `bar` directly to the object created in `_foo`


* functional doesn't just bind to arguments
* also has scope, since functions need to be able to refer to other functions
* these references are also probably statically bound

* my scoping mechanism is recursive
* each nested scope references their direct parent
* so static references go to the direct parent as well

* however, for scope composition to work
	* (aka passing scope down hierarchy, inheriting scope from parent and adding+shadowing vars)
* we have to transform references into scope accesses

### Equality and Property Access - circular

* to create the constants and natural numbers in the top level scope
  * as we said was necessary in the section "A Base Library of Constants"
* we can create various empty objects
* and use those as keys
* maybe one represents the `next` key, and another represents the `value` key
* so we can create a linked list

* if they are empty objects though, how does an actor check equality with them
* because property access, is just checking the input key against the keyset

* to check equality, we use the method outlined in section "Double-Sided Equality"
* we first need two boolean values, `true` and `false`
    * (these are implemented like they are in pure functional)
* then, for a given object, we need a private var `_id` that stores the value `true`
    * the private key can just be an empty object
* and the object has an `equals()` function, that takes in another object,
  and checks `_id` of that object and returns the value
* note that we don't need the string `equals` for this to work,
* we can use another empty object to represent the `equals` key

* actually no, because we can't access `equals` or `_id` without equality
* because property access uses equality
* circular

### Syntax Exploration - Bracket-Notation Property Access

* when doing bracket-notation property access
* use `.[key]` instead of `[key]`
* looks cleaner when chaining multiple accesses, eg `foo.[key].[key2].[key3]`
* note that we don't want to use `.(key)` (as explored in an earlier section)
* because the sytax `(key)` could look like we are declarng a nwe object

### How does Functional Return Multiple Items?

* an equality check implies dynamic prop access
* which got me thinking about how to implement booleans without prop access

* note that in functional, booleans work by taking two functions and calling one of them
* but recall how we dont have cloning/calling, only spawning
* so the equivalent would be
* taking two objects, and inserting into one of them
* and each object is doing a set_spawn, so whichever one gets an insert, will spawn some behavior

* we can think of pure functional as similar to our objects
* except there is a default output
* whereas our objects have no default, every property acts as an output

* got me thinking, how does functional handle returning multiple items?

* you could return linked list
* but linked lists are complicated constructs on their own
* and you have to worry about retrieving `nextNode` and `currValue`and such


* it returns a function, and you call that function
* and inside that function it can have as many returns as it wants
* closure

    let res = returnMultiple()
    returnMultiple(function (a, b, c) {
        do stuff with a b c here
    })

* its interesting because its so different from a single return
* wth a single return, you just use it directly
* with multiple, you have to pass a callback
* i guess you could use the callback method for single returns too

        let res = returnSingle()
        doStuff(res)

        let fn = returnSingle
        fn(function (res) {
            doStuff(res)
        })

### Callbacks for Property Access

(continued from prev section "How does Functional Return Multiple Items")

* could we use the same method for prop access?
* every time you access an object, you call it like a function, and pass a callback
* and the callee calls your callback with all it's properties
* so instead of

        print(foo.a)
        print(foo.b)
        print(foo.c)

* you would do

        foo((a b c =>
            print(a)
            print(b)
            print(c)
        ))

* whats useful about this is
* the references to `a` `b` and `c` become static bindings
* so we don't need to worry about giving `foo` a key, doing some equality check to find
  the corresponding value, and then passing the value back
* there is no equality check or prop access mechanism necessary anymore
* you access properties simply by statically binding to the values passed back in the callback
* (note that this prop-access-function `foo` is pure functional,
   so you don't have to worry about calling it multiple times)

* these aren't static references, the child is not referencing the parent
* the parent directly sets some (private) vars on the child
* and the child accesses them
* the child only accesses itself, so the parent has to manually
  set some values on the child to initialize it

* if we think in terms of graphs
* the child is a graph of nodes referencing other nodes
* but some of these nodes don't have values, they are just referenced by other nodes
* almost like function arguments
* declared but not set
* the parent is responsible for setting those values, binding those nodes
* however, with high level constructs like scoping,
  the programmer largely doesnt have to deal with this mechanism directly

### Callbacks for Property Access - Private Props

* with this functional representation of prop access
* we could even add in the concept of private variables, shared private vars
* you pass in a keyset
* and it calls the callback with the corresponding values

    foo(("a" "b" "c"), (a b c =>
        print(a)
        print(b)
        print(c)
    ))

* well actually, we could simply make every prop access separate
* you pass a key, it passes back the value
    foo("a", (a => print(a))
    foo("b", (a => print(b))
    foo("c", (a => print(c))

* but i guess this comes back to the original problem with prop access
* how is it implemented
* how does it find the corresponding key
* equality check?

* so perhaps it's best to just return all the values in one callback
* note that there is an inherent ordering of the arguments too
* and the callee passes the values in that order

* but this can really just be syntactic
* when you declare an object, you declare the properties

    foo:
        a: 10
        b: 20

* the interpreter generates the property access function
* and then when you access the properties, internally the interpreter will transform it
* so `print(foo.b)` becomes

    foo((a b => print(b))

* how do private props work?

### Static Property Access

(continued from previous section "Callbacks for Property Access - Private Props")

* also this implies static prop access
* which may be exactly what we want
* seeing how dynamic prop access leads to so much circular logic

* also dynamic prop access prevents anonymous reads

* static prop access is also like the encryption method
  * see section "Private Keys and Anonymous Reads, Property Bundles"
* you get a giant encrypted package from the object
* eac key is a decryption key, use it on the package to get the corresponding value

### Common Protocols, Address Spaces

* static prop access requires a common protocol
* eg the decryption protocol
* whoever wants to read an object, has to know which protocol to use to read it

* eg if an entire group of objects is running on a single machine
* they might simply use addresses and reference equality to reference eachother, access properties

* objects on the world wide web, might use IP addresses, and GET requests to access eachother

* perhaps every object declares what protocol they are using to provide properties
* on some sort of special property
* so readers can see what protocol to use to retrieve those properties

* maybe the protocol is declared as a pure function
* and the readers just copy that function,
  and execute it on their own machine to access the properties it needs
* eg, Alice exposes the RSA decryption function,
  and a list of property values RSA-encrypted by their keys
* Bob, who has a list of keys that he wants to access,
  copies the RSA decryption function,
  and then goes through the list of encrypted prop values,
  decrypting whichever ones he can using the keys he has

### Equivalence of Address Spaces

* address spaces and references
* many different ways to represent an "address"
* you can use numbers
* or strings
* or some other kind of object, with custom defined equality and comparator function

* so maybe we should just choose one type of address space
* and convert all other types of addresses into that one

* order is a mapping
* really, any such address space can be mapped to any other
* each address space is just an ordered set
* so we can choose one address space, like the natural numbers
* and everything else can be mapped to it

### Alternatives to Fully Dynamic Prop Access

* i think we can say at least one thing for sure
* prop access cannot be fully dynamic

* maybe we can make one prop special
* that is, a special property that anybody can access statically
* eg the `_return` or `=>` property
* we could use this prop to represent the output of a function, and write functional code
* and then implement everything else on top of functional

* but is one special property enough?


* maybe we can have dot-accessed props be special
  * eg `foo.bla` is a static access, `foo['bar']` is a dynamic access
* because they are always going to be static strings
* kinda like how in python dictionaries, you access attributes like `myDict.items()` and values like `myDict['someKey']`


* maybe we can have reference equality

* maybe we can make a special property `_addr`
* you can set it
* but it has to be a number
* and the interpreter is responsible for the equality

### How many static properties is enough?

* in the prev section, "Alternatives to Fully Dynamic Prop Access"
* we asked if one static property was enough to fix our language mechanics

* one static property is not enough
* recall how we talked about implementing multiple returns in functional
* and we could use the multiple args
* or a linkedlist
* but a linkedlist requires two args
* `next` and `value`

* so maybe we need at least two
* because to establish order
* we need to compare objects against eachother
* same reason why comparator fn needs two args
* once we can establish the ordering of every pair of objs
* we can establish the total order

(actually wait but isnt it possible to formulate a fn with multiple args, into a curried chain of functions with single args?)
(well but currying still relies on statically binding each arg at each step)
(so thats equivalent to static binding multiple args)

* 2 is a weird number though
* relies on chaining to establish order
* but we previously talked about how we wanted to avoid using chaining everywhere
    // TODO: FIND REFERENCED SECTION
* eg we shouldnt think about 1+2+3+4 as ((1+2)+3)+4
* we should think of it as `sum(1 2 3 4)`
* order is treated as a high level construct
* we should be able to declare a list (1 2 3 4) as ordered
* instead of manually chaining together pairs to do so

* in fact, maybe we can think of order as a mapping between a list, and the natural numbers
* the natural numbers is just an arbitrary ordered list to map against

* we talked about this in the section "Equivalence of Address Spaces"

### Address Space as an Abstract Concept

(continued from sections "Equivalence of Address Spaces" and "How many static properties is enough?")

* actually an address space doesnt need to be ordered
* it just needs to prevent collisions
* basically just an infinite set of unique ids

* so all we need is this abstract concept of an address space
* and all possible addresses, eg numbers or strings, get converted to items in this address space

### Math and Order Theory

* though does an infinite unordered set exist?
* how would you generate infinite items without some sort of order?
* generating items using some sort of recursion, means some items are generated before others, implying order

* i feel like this is getting order theory, which is out of my domain

* the formal term for an "unordered set" is an [Antichain](https://en.wikipedia.org/wiki/Antichain)
* I believe infinite antichains probably exist

* the problem is, in order to use a key to retrieve a value, or in other words, to retrieve an item at an address,
  at the very least, addresses have to be able to be checked for equality


### Math, First Order Logic, and ZFC Set Theory Axioms

* I was looking at https://math.stackexchange.com/questions/877211/example-of-first-order-logic-without-equality
* and they mention that to test for equality of sets, they use this notation:

$$
X = Y \quad \text{means} \quad  (\forall n)(n \in X \leftrightarrow n \in Y).
$$

* I noticed that they have the notation $\forall$ and $\in$
* these are core operators
* in a sense, $\forall$ corresponds to `set_spawn`
* so what does $\in$ corresponds to?
* what about $\exists$? `pick_one`?


* note that along with the quantifiers $\forall$ and $\exists$, ZFC set theory only has one operator, the $\in$ operator
* you can actually implement set equality using it
* first define `subset`, and then define "A = B if A is subset of B and B is subset of A"

* in firefly, perhaps we should do the same
* set membership, `a in A` is a core predicate
* and to test equality, `a = b`, simply wrap `b` in a set `B` and check if `a in B`

* worth noting that the 3rd axiom of ZFC, the [Axiom Schema of Specification](https://en.wikipedia.org/wiki/Zermelo%E2%80%93Fraenkel_set_theory#3._Axiom_schema_of_specification_(also_called_the_axiom_schema_of_separation_or_of_restricted_comprehension))
* it says that set-builder notation has to be restricted to a domain
* which means this restricted set-builder notation can be implemented using `set_spawn` and conditionals
* note that set theory and set-builder notation only needs logical conjunction
* logical union can be achieved via the 5th axiom [Axiom of Union](https://en.wikipedia.org/wiki/Zermelo%E2%80%93Fraenkel_set_theory#5._Axiom_of_union) and the formula

$$
\cup {\mathcal {F}}:=\{x\in A:\exists Y(x\in Y\land Y\in {\mathcal {F}})\}
$$

* note that the axiom of infinity says there is at least one infinite set
* i think this is needed because with the 3rd axiom
* you need to restrict any set definition to a domain
* so if you want to define any infinite set, eg even numbers or something
* you need at least one infinite set to establish an infinite domain for other sets

* perhaps this is why firefly needs an address space
* establishes an infinite domain

### ZFC Set Theory vs Type Theory (Lambda Calculus)

* its interesting to note the difference between ZFC and lambda calculus (functional)
* heres a good summary
* https://math.stackexchange.com/questions/2130269/why-did-mathematicians-choose-zfc-set-theory-over-russells-type-theory

* bascally, set theory and ZFC is based on set membership
* but jt still required a foundation of predicate logic
* eg $\forall$, $\exists$, $\land$

* type theory and lambda calculus is a lot simpler
* only requires two operators:
1. abstraction (the $\lambda$ operator): function definition
2. application ($\.$ operator): apply the fn to an argument

### Generating Keys using Successor Function and Random Chance

* maybe a functional version of firefly wouldnt need addresses
* just a natural number generator (successor fn) with a random chance of stopping at any point
* generates keys for objects

### Wikipedia for Bound vs Free Variables

* to get a better idea of how functional does "static binding"
* worth mentioning the formal definition for [bound vs free vars on wikipedia](https://en.wikipedia.org/wiki/Free_variables_and_bound_variables)
* for an example like this:

$$
\sum_{k=1}^{10} f(k,n)
$$

* $n$ is a free variable and $k$ is a bound variable
* in other words, the value of this expression depends on a user-provided value of $n$
* but the value of $k$ is already defined

### Firefly vs Functional - Level of Abstraction

* if we can implement firefly using functional
* why not?
* why not just make everything ordered
* at the top level, with all the syntax sugar and abstractions
* we can still make it look unordered?

* because we want our language to start at that higher level of abstraction
* shouldn't matter how the lower level is implemented
* this is the level of abstraction we want
* eg, instead of trying to implement `spawn(...)`, or sets/collections
* just treat them as an axioms

### Why We Need Address Spaces - so we can reference more than one thing

* feels ugly to mix insertions and static bindings
* but insertions aren't enough

* by not having an address space
* we are effectively making it so every actor only has one thing they can reference:
* insertions
* and even though insertions is a set
* since it's unordered, its impossible to do anything useful with it
* without some sort of ordering system
* so effectively, every actor only has access to a single entity
* and i don't think that's useful

### Addresses as a Primitive

(continued from prev section "Why We Need Address Spaces")

* and yeah it does feel ugly to mix insertions and static bindings
* recall how we explored a model that uses a primitive Message object
  * see section "A Static `Message` Type"
* with two static keys, "key" and "value" or "address" and "message"
* in that model, we didn't need static bindings
* everything was done via insertions
* and the object just statically references the two special keys, "key" and "value"

* well now that we have made an address space basically a primitive
  * see section "Address Space as an Abstract Concept"
* there are an infinite number of these "special keys"
* these addresses can be used or referenced within every object
* and are statically bound

* but these keys are all shared across all objects
* any object can reference them, or use them

* addresses are a primitive that anybody can access

* so now we can use the `(key: ..., value: ...)` insertion system
* since `key` and `value` get converted to addresses
* so when the object is reading the `key` and `value` of insertions, it works like static references

* but now that we have infinite static keys to choose from,
* it is a lot more flexible
* and we don't have some arbitrary number of special keys

### Address Equality?

* in addition, for prop access to work properly
* we have to be able to check address equality
* i guess we could do this using set membership, the $\in$ operator
* but perhaps we should just make address equality a primitive operator, for simplicity

### Bound Variables vs Addresses as a Primitive

* like even in functional
* functions use currying so that each function only needs one argument
* however, in the body of the function, it takes a reference to another function,
  and statically binds the argument
* and then it returns that altered function
* it statically binds the arg
* by embedding the value in the source code
  * you can think of taking the source code of the referenced fn,
    and substituting the parameter with the arg value
  * this is why referential transparency is important in functional.
    its so we can do this substitution
* so in a sense, that source code is now referencing the arg
* the difference is that it's not a reference, it's embedded
* so it uses the language itself, (whether it be haskell, lisp, etc), to represent the value
* the source code, including the embedding, is static and standalone

* so even if we modeled actors like functional
* every actor gets a single argument, its insertions
  * which are unordered so it can't distinguish between each one
* and we give every actor a single output (some special property, eg the `=>` property)
* we would still need static binding

* in a sense, our address space _is_ the source code
* since we each node is stored at an address
  * just like in source code, every character is stored at a position in the document
* so static references, statically binding references to other actors
* is analogous to how functional embeds argument values into the source code

### How Are Actors Converted to Addresses?

* recall how we talked about how keys store as much info as values
    * see section "Using Keys to Store Information"
* well this was when keys could be objects/actors
* now, keys are addresses, a new primitive type
* separate from actors
* so now, actor/object keys are passed in like any other value (using insertions)
* but then...how are they converted to addresses

* how are actors converted to addresses

### Revisiting Object Keys and the `.equals()` method

* maybe our equality method could work now
  * see section "Double-Sided Equality"
* using `.equals()` and checking the input key against all other keys
* because now, we don't have to worry about the `.equals` method being a property access itself
* because maybe the `.equals` method could actually be a static address


* even tho addresses are primitive, they arent exposed to user
* more like internal mechanism

* if we could have a centralized address system
* all of this would be trivial
* would basically be like an id for every object

* but how to make decentralized?
* actor has to provide id? otherwise equality fails?
* but then identity theft
* reader provides list of keys that it wants
* readee returns corresponding list of addresses
* safe because it knows the reader has access to those keys
* also we want full anonymous reads
* forcing thr reader to provide the keys it wants access to, breaks anonymity
* can we tweak this mechanism to work

* using a `equals()` method is still bad because
* it is dynamic
* if an object overrides the `equals()` method to have side effects, it breaks anonymous reads

### How Are Actors Converted to Addresses? Part II

* imagine if we had objects that represent people, `Bob` and `Alice`
* imagine using them as keys
* how can you?

* what about webpages
* what if we wanted to tag webpages with content
* how could you?

* webpages do have a unique web address
* so maybe thats the id

* need some centralized id system
* or maybe at least if you want to be able to key using objects, those objects need an id

* but if we go back to the webpages example
* a webpage could be a single page app
* have internal state that you can't access
* so the web address isn't enough to uniquely identify it
* if you interact with the site, and it changes without changing the address
* then sending the address to somebody wouldn't send over that internal state

hmmm

### DataFlow and the React.js Model

* sometimes it can be tempting to try to render something based on
  whather some other component is being rendered
* but react does not allowing state changes during render
* we can think of UI is a system of events=>state vars=>state=>UI
* functional reactive

* now feedback can start to come into play when multiple actors interact with eachother
* but the UI system is a layer on top, and does not have feedback
* we can think of it as a bottom and top layer
* in the bottom layer we have a network of nodes interactig
* the top layer is how each node is displayed, the ui of each node
* and state flows from the bottom to the top
* and events flow from the top to the bottom

### An Argument Against a Single Source of Truth

* react redux forces a single source of truth
* but i think it's best to modularize it
* into multiple data stores

* one way to think about it is using state machines
* with $N$ states, $N^2$ transitions
* so if you have a ton of states, the number of transitions to worry about blows up
* and often we care about what happens during each transition
  * eg when the user opens the webpage, when they minimize the webpage, etc

* if you split it into smaller machines
* less transitions to worry about
* splitting it into two machines with $N/2$ states each, halves the total number of transitions
* even though you have the same amount of states

### Pass by Value vs Pass by Address

(continued from section "How Are Actors Converted to Addresses? Part II")

* actually sharing a web address isnt the same as sharing an object
* a web address points to a template for a web page
* tHe client's browser instantiates the template to create the dynamic web page

* sharing the web app object
* would be like sharing the browser + interpreter + client state
* which is feasibly possible

* however, the client would still have to give you some sort of id right?


* normally, if you have a reference to an actor/object
* you can use that reference all you like
* no need to use the object as a key and add extra tags/properties to it
* just use the object directly, and any extra info you need, just declare as properties in the scope or something
* the main use case for using it as a key and add extra tags/properties to it
* is if later you have dynamic reference, so you don't know which object it's pointing to right now
* (eg if it were an inserted object, you don't really have control over what is inserted)
* so you use the object as a key, to retrieve whatever info you had stored about that object earlier on

* in that sense, equality is rather important


* all this is crucial for tagging
* if the object has to provide an id in order to be addressable
* then anybody could easily prevent objects from being tagged
* could lead to a hostile ecosystem where everybody is preventing everybody else from tagging their objects
* almost like an internet system where websites prevented users from bookmarking them, or from posting the website to reddit

* but i think tagging is useful, i want people to be able to tag whatever they want

### Pass by Value vs Pass by Address II

* if bob gives alice an apple
* and then later gives an apple
* how does alice know its the same apple? 
* why cant bob create two instances of apple, but make the world treat them the same
* just like how 1+3 is treated the same as 4

* in the real world this isnt possible
* only one person can hold the object at a time
* the object only exists once
* so each instance is different

* however, if you want to be able to pass objects around
* well how do you tell two apples apart?
* by their properties?
* what if they have the same properties?
* i guess if you could hold them both at the same time, they are different

* pass by value or by reference
* pass by value is passing the apple around
* pass by reference would be like, passing the GPS coordinates of the apple
* passing around the address of the object
* which is useful because the address is unique and can be used for tagging
* requires the apple to be stationary
* and requires a global address system (in this case, GPS coords)

* this is why imperative langs can use pass by reference
* the interpreter runs in a single address space

### Passing Addresses Across Different Address Spaces

* well maybe it could work across address systems
* alice tells bob the position of the apple within her house
* however, this position only makes sense within alice's house
* bob is not in that address space, so he needs to convert it to his own address space
* bob knows where alice's house is, so prepends her house's address to the position given by alice
* to form a new address
* bob tells charlie that address
* charlie and bob are in the same address space (maybe in the same city or something)
* so the address provided by bob is enough for charlie to find the apple
* no need to prepend another address

### Creation Address, Insertions, and Identity Erasure

* but insertions
* are like passing around an object
* anonymous
* so you wouldnt be able to insert an address
* because you would have to provide the parent address space
* which would give away the parent


* another perspective:
* do we tag addresses or objects?
* because if we try to tag an objects by its address
* the object at that address might change

* every object is created by some parent
* so it does have some root address, some "creation address"
* and that address will only contain that object
* however, maintaining addresses across multiple address spaces
* requires a chain of addresses
* basically giving up the identity of all parents along the way


* "erasure"
* inserting an object erases it's identity in a way, since it has to be anonymous
* you can insert an object into multiple collectors
* and if its insertion-by-value and not by address
* then it's impossible for those collectors to tell if they were the same object or not

* in fact, the same could be said about inserting an object twice into a collector
* with "erasure", the collector has no way of telling if they are two different objects or a single one inserted twice

* what if its pass-by-reference until it gets inserted into a collector
* at which point the collector creates a new address for the object
* and then it gets passed-by-reference again
* in essence, every time you insert, it resets the address


* pass-by-value might make it impossible to address most objects
* because items have to provide their own address
* and everybody might use different systems or standards

* if we reset address during insertion
* breaks equality
* if you insert an item into a collector
* then compare the inserted item with the original
* different addresses, so equality fails
* so we would still need some internal object id or something to fix equality

* if we have erasure
* we need internal ids

### Pass by Value vs Pass by Address III

* another example
* if an actor publishes a private object onto two public properties
* then either:
  1. readers have to rely on the object's attributes to determine equality
  2. the public properties expose the address of the object, not the object itself


* if you want to talk to an object
* you need to talk to it's server+port+address
* so you have to know its address right?

* but that's more implementation
* from a high level perspective
* you are just talking to an object
* doesn't matter how you got to that object

### Property Access Mechanisms - Exploration

* maybe every object has a default hidden id and`equals()` implementation

* i think it's fine if we use dynamic prop access for object keys, eg using the `equals()` method
* basically, the actor contains a private keyset
* and a mapping between keys and addresses
* and whenever a prop access request comes in (via an insertion)
* the actor checks all keys to see if any match
* and if so, gets the corresponding address, retrieves the value at that address
* and gives it to the requester

* it's still anonymous?
* since insertions are anonymous?

* however, dynamic prop access means actors can record all requests
* and can record keys that it doesn't know about
* a danger alluded to in section "Caller-Provided Keylist"

* maybe actors provide an obfuscated keyset
* requesters can check if a key is in the keyset
* but they can't enumerate the keys
* can check membership, but can't set_spawn

### Embedded Addresses

* note that now that addresses are a primitive
* you can reference addresses directly within any object
* can be statically embedded inside objects too
* it's the only global primitive, everybody understands it

### Implementing Iteration using Spawning and Recursion

* maybe `set_spawn` is possible on set of addresses

* maybe iteration is possible
* we can use recursion
* and its fine because we are reading templates
* not cloning live objects

* an actor spawns children
* by reading from templates anyways
* every actor contains an interpreter
    * see section "Recursive Interpreters"

* so we could have an actor Bob that inserts into Alice
* and Alice returns the source code for Bob
* Bob spawns it
* and the cycle continues

* can result in infinite objects
* but this was possible with set_spawn too
* eg if for every insertion, Bob spawns Charlie,
* and every Charlie inserts an item into Bob

* however, infinite objects will cause the interpreter to hang

* luckily, while iteration does use recursion, it does not create infinite behavior
* you have to call "next()" to iterate

* but wait `next()` is a clone operation
* how do we implement this with insertion


* hmm how did we solve the issue with infinite recursion references
* every reference is prop access on scope
* but then that level deeper is implemented with static binding
* which we now know is just hard-coded addresses

* so what about object-keys
* well at some point you need to map the object to an address
* and it cant be hardcoded
* because the reader wont know what address you hard-coded
* the reader needs to map it to the same address that you did

### Functional Property Access - Implementing Property Access using Sandboxing and Equality

* man all of this would be a lot easier if all objects had a unique address
* that anybody could access but nobody could modify
* like how memory addresses work in normal imperative programs

* maybe im thinking about this too low level
* maybe i can just make prop access an axiom
* a protocol built into the interpreter that the language just references
* the protocol asks the object for the keyset
* the keyset is provided as an obfuscated black box
  * a mechanism we explored in the section "Private Keys and Anonymous Reads, Property Bundles"
* but what it does internally, is given a key, checks equality against the keys in the set
* but its pure functional, so the reader doesnt have to worry about leaking/exposing any private keys unnecessarily
  * since we don't want the object to be able to record property access requests, as discussed in section "Property Access Mechanisms - Exploration"
* the reader can execute the entire black box on their own machine, firewalled and sandboxed

* each object key in the keyset have to provide an `equals()` method
* so that the object can construct the black box that checks equality against each key in the keyset
* in addition this `equals()` method has to be pure functional (so that the black box can be pure functional)

* wait..then that's it!
* we just need a pure functional `equals()` method
* and then all of this can be implemented
* and a pure functional isEquals method is trivial, can use hard-coded addresses

### Implementing Sandboxing using Spawning and Restricted Scope

* i guess the last thing is
* spawning source code in a sandbox, has to be an axiom too
* in order to implement the property access protocol

* actually, sandboxing is trivial
* just control the scope
* even if the source code is obfuscated
* it will need a reference to external actors if it wants to insert into them
* so just don't provide those
* just provide primitives like numbers and strings, and some lib functions like `forEach()`

### the Connection between Addresses as a Primitive and Key-Value Duality

* we previously discussed how object-keys contain just as much information as values
    * see section "Using Keys to Store Information"
* because they are objects after all
* interestingly, addresses as a primitve, demonstrates key-value duality quite well
* object-keys are in fact just values
* values stored in a keyset,
* and when a reader asks for a property, they provide a key, which is checked against the keyset
* and if there's a match, a corresponding value is retrieved
* but ultimately, all values and object-keys are stored on top of addresses

### Is Spawning Source Code an Axiom?

* this is only possible because of one more axiom
* the ability to read and copy source code

* the object defines the function for accessing its properties
* and displays it on a designated property, the `_prop_access` property
* readers read from that property to get the property access function
* and copy it and run it sandboxed

### Universal Constants

(continued from prev section, "Is Spawning Source Code an Axiom?")

* note that this `_prop_access` property doesn't need to be "public"
* because its a static address that everybody already knows about
* in a sense, its a static address hard-coded into every interpreter
* a **universal constant**
* in addition, "public" doesn't exist anyways, "public" is just determined by what keys are exposed on the `keyset` property
* `keyset` being yet another universal constant


* if an object doesn't put anything on their `_prop_access` property, or puts a broken function there
* it will be as if the object doesn't expose any properties

### Sets of Addresses

* what about sets, `set_spawn`, and public sets?
* how do they fit in now that addresses are a primitive?

* maybe public sets are just sets of addresses
* and when you access them, it automatically retrieves the values at those addresses
* so something like

        foo:
            myset: ("hi", "bla", "foo")

* is internally represented as

        foo:
            myset: (_1, _2, _3) // note: these are addresses not private vars,
                                // I haven't decided how to represent addresses yet
            _1: "hi"
            _2: "bla"
            _3: "foo"

* but `console.log(foo.myset)` will still output `("hi", "bar", "foo")`

* so the values are actually still stored on the parent object
* which keeps to the tradition that all values are stored at an address

* however, this "flattening" of the structure, storing values in the parent
* what if we did this with nested objects
* what if nested objects were simply bundles of addresses to values in the parent
* feels wrong, but why?

* well if we took this to the extreme, and made _all_ objects just bundles of addresses pointing to values in a single mega-object
* well this is essentially like how java/javascript/imperative interpreters work
* but it requires a single address space
* centalized

* and that's the problem
* if nested objects contained addresses pointing to values in the parent
* then you couldn't pass those nested objects around, without also passing around the parent
* if you pass around a reference, the receiver has to know the context for that reference

* and so we would have the same problem is public sets were just sets of addresses
* you wouldn't be able to pass the set around, without passing around the context for those addresses, aka the parent

### A Reflection on The Past Month Exploring Circular Logic and Axioms

* I think it's worth mentioning
* my revelation about addresses as a primitive (section "Addresses as a Primitive")
* was just a week ago (3/7/2020)
* and it feels like since there, i've been making a ton of progress
* like all the pieces are falling into place

* i had been fumbling around with so much circular logic, constantly confusing me
* and it feels like once i put that axiom down, set down that first foundational block
* everything else could be built on top of it

* interestingly enough, I was actually really close to the idea of addresses as a primitive back in the section "A Base Library of Constants"
* I talked about how keys reference keys, so ultimately at the root we need a base library of constants
* that anybody could use as keys/addresses
* and they would statically bind to these addresses (aka static embedding)
* which is basically exactly what addresses as a primitive achieves

* perhaps if I had looked back at my notes
* I would have reaized this sooner

###

recall that earlier, I suspected that dynamic property access could compromise anonymity and security
    see sections "Property Muxers", "Preventing Dynamic Access and Proxies using Encryption", "Ordering Sets 2"
we thought it would allow bad actors to proxy or impersonate other objects,
    or impersonate private properties that it doesn't have access to (see "Property Muxers" section)
so I thought that we shouldn't have dynamic property access as an axiom

however, now we do
this "Functional Property Access" protocol is dynamic, it's a function

however, its run sandboxed
no danger of it leaking info to any actors
since you aren't providing those actors in the scope, when you are spawning the function

what about property muxers
which used dynamic property access 
the property mux function is pure functional
so if it is proxying another pure function (that could still contain private behavior)
it could embed that pure function within the property access function
and then when you copy it

however, ever since we made spawning the default, not cloning
we can design cloning such that actors can only re-bind references that they have access to
    // TODO: FIND REFERENCED SECTION
in addition, since it's run in a sandbox, there's literally no danger of a data leak, or exposing any of your private keys




### Firefly Model and Syntax - Primary, Secondary, and Tertiary Forms

I divide all the mechanisms/concepts into three layers:

axioms (primary forms):
* addresses (declare and access)
* actors
* insertion
* spawning
* sets/collections
* set_spawn
* set operations (pick_one, make_ordered)

corollaries (secondary forms, what people would _think_ are primary forms):
* equality
* object keys
* scoping
* cloning
* conditionals
* set cardinality/size

sugars (tertiary forms, relatively simple to implement using secondary forms):
* tags
* state variables
* for-loops
* lists/arrays
* functions


what is difference between primary secondary and tertiary?
the primary forms are necessary, form the foundation for the language
but they are too low level, so they mostly aren't exposed to the programmer
    (eg spawning, addresses, static references)
secondary forms are the core of the language, constructs used by the programmer that can only be constructed using primary forms
tertiary forms are forms that can be constructed via secondary forms


### Static Binding = Passing Values to the Child Interpreter

static binding
isn't actually static
since everything is reactive

what it means
is values passed from the parent to the child _interpreter_
not the child
but the interpreter that is creating the child

### Removing Insertions

* something worth mentioning
* i actually used to think that every insertion operation would also be stored at an address
    * // TODO: FIND REFERENCED SECTION ??
* just like every spawn/clone node is stored at an address:

        foo:
            _a: someObj()

* insertions would also look like that:

        foo:
            _a: someCollector <: someValue

* i did this so that you could override or remove insertions
  * just like you can override/remove spawn/clone operations by overriding the property where they are stored
  * so for the earlier example, you could do `foo(_a: undefined)` to remove the clone operation `someObj()`

* however, this seems unnecessarily complicated
* much simpler is to just make it so that actors can be receive or send any number of insertions
* completely separate from the address system
* if you want to allow callers to override/remove insertions
* just wrap it in another actor

        foo:
            _a:
                someCollector <: someValue


* note that all values have to be stored at an address
* so this includes insertions, inserted items
* but the insertion operation itself, is not something stored at an address

### 

what are Collections
they aren't an actual object
they are an interface
with the methods `set_spawn` and `pick_one` and `make_ordered`


might be possible now to actually only allow for restricted set_spawn
aka you can only set_spawn on the `_insertions` special object
and then insertions can be published on a special property/address
if you want to publish them

### Cloning vs Copying, Set_Spawn vs Recursion

now there are two ways to generate infinite behavior
1. set_spawn (spawn an object per insertion)
2. recursion (child reads its own source code and spawns another child from it)
arguably redundant

* note that recursion wasn't possible before (at least using "primary forms")
  because you could only spawn or set_spawn off a static source code
    * cloning was made a "secondary form", implemented using set_spawn,
    * so any recursion that uses cloning may look like recursion, but in reality it's just using set_spawn
* however, now that we allow actors to dynamically reference source code, an actor could theoretically reference
  its own source code, and spawn itself


* set_spawn and recursion represent different ways of creating infinite behavior
* set_spawn, the behavior is statically defined and created multiple times
    * spawned by the callee
* recursion, the template is passed around or referenced
    * spawned by the caller

this distinction of where something is being spawned
eg for cloning, happens on the callee, since they have the private behavior, the caller shouldn't have to create behavior that it doesn't have control over
but for copying/sandboxing, happens on the caller, since they have full control, they want to restrict the scope

really, we shouldn't think about it in terms of implementation
and where it is spawned, is thinking in terms of implementation

from a language standpoint, the main difference is
who is providing the environment
with cloning, the callee provides the environment, so they can provide private actors to insert into and such
with copying, the caller provides the environment, so it can restrict any side effects


this is different from functional
where after a variable has been bound
it can't be modified

note that templates are still a black box
you can't necessarily tweak and modify the internals however you like when you spawn it
however, you can choose what inputs and values to provide

wait but if you can't modify internals
how do you embed addresses?

well at least for nested children
the parent can't modify internals, because they are defining the child

however, if an actor imports a definition from elsewhere
then they only have access to the internals that are made public
and won't be able to do static binding otherwise


### Splitting Modules into Separate Files while Maintaining Scoping

this is also very powerful since you can do stuff like

        foo:
            ...someExternalFile.ffly

and you can basically split up objects into multiple files
but still have scoping!


### React and Lifting State

in react, parent components cannot directly access the state of child components
this might seem unintuitive
but it is to encourage child components to lift their state to the parents
if the parents use it
basically, instead of the child storing the state themselves
the parent passes event handlers to the child
and the child uses those to send updates to the parent

this way, instead of having state maintained in multiple places
this pattern encourages state to be maintained in a shared ancestor, the lower common ancestor

in firefly, parents would be able to access child state without issue
could encourage bad design?

### Implementing Initializers

* the way static binding/embedding works
* you reference `_some_name` in the code
* and then when the interpreter constructs an Actor
* they pass in a mapping `Actor(mapping)` where `mapping` looks something like

        _some_name: 178374229
        _some_other_name: 381947392

* and it substitutes the references with those addresses
* embeds the addresses in the child template

* so for initializers, we can just create a standard
* and make `_initializer` a convention for this sort of pattern
* and you would use it like

        fooDef:
            _static_props: _this.[_initializer].pick_one()
            print(_static_props.name)
            print(_static_props.age)

        parent:
            _initializer: Address.random()                 // generate a random address
            fooDef2: fooDef.embed(_initializer)            // embed that address into the definition
            foo: new Actor(fooDef2)                        // spawn an actor from the definition
            foo.[_initializer] <: (name: "Joe", age: 13)   // insert initial values into the initializer

* one neat thing about this is
* everything is self contained
* in functional, bound variables retain some knowledge of their environment
* in a way, they are bound to their parent function

* whereas, in firefly
* the child may have some hard-coded embedded addresses
* but that is it
* everything else is provided via insertions
* so the child does not have any static bindings to the parent
* or any bindings to the environment
* it just has some embedded addresses, and uses those addresses to extract data from insertions

### Anonymous Property Access - Language vs Implementation

when it comes to anonymous reads
it's important to distinguish between language and implementation

reads are anonymous in the language specification of firefly
eg, if somebody does `foo.bar`, there is no way for `foo` to specify some behavior to run when the property is read

this is very different from
say, running `foo` on a server the logs all requests
that is the implementation of the language

but the language specification, _assumes_ that reads are anonymous

all is important because, by assuming reads are anonymous
readers can make optimizations, like caching the value, and then on subsequent reads, just pull from the cache
and even if `foo` is on a server that logs all requests
they can't stop readers from caching values
from the reader's point of view, they are still following the language spec
so `foo` can't guarantee that the log contains all property accesses
if they try to add a side effect to the property access, it won't be accurate


contrast this with javascript, which allows you to create property getters and setters
with javascript objects, you don't know if a property access will have side effects
until the inspect the source code of the object

in a language like javascript, where reads are not necessarily anonymous
those optimizations cannot be made, because you might be breaking the language spec,
say if some property's getter has a side effect, but you don't execute that side effect when reading the property


this also means that, by the language specification
functions and property access are fundamentally different
in a functional language, they are the same



### Templates Revisited

in the section "Cloning vs Copying, Set_Spawn vs Recursion"
we talk about how the main difference between cloning and copying
which is who provides the environment

in fact, this ties back to templates


in a sense, they are all the same thing


notice how private behavior is handled


before we mentioned how templates are somehow "unbound" when they start
but then they get bound on the first clone
see section "Templates and Deferring Evaluation"

but that explanation was a bit weird and hand-wavy
we can do better now

if we bring this back to how cloning is implemented
it makes sense
since the original parent is a "factory" that is set_spawning each child
they can provide the environment

we can even consider templates as "live" actors
but since they aren't given an environment, they don't actually do anything

### Cloning and Source Code Revisited

(continued from prev section)

so everything is a template

this kinda goes against our prototypal mindset though

we can bring back the prototypal principles
by allowing live objects/actors to be copied

any node that is visible
you can read both it's value, and how that value is generated
you can see what template the node is spawned from, and its inputs/outputs
you can see both the node, and the edges going into/out of the node
with one big caveat: in order to see any edge, both endpoints have to be visible
so if we have `foo: a+_b`, when you read `foo` you can see the `+` operator as well as the input reference `a`
but since `_b` is private, not visible, we can't see that it is an input to the `+` operator

source code = value
    explained in section "Cloning and Source Code"
is sort of like how in functional
referential transparency, function calls can be substituted by their value

### Cloning and Source Code Revisited - Address and Indirect References

i need to formalize this idea of "spawning source code"
after all, it's an axiom
and it's necessary for object-key access to work properly

in earlier notes, we imagined that when you read a node
you can see its inputs
eg for a node like `foo(a, b, c)`, you would see the clone node with `a` `b` and `c` going into it

however, that was when we thought cloning was an axiom
in fact, now, the references `a` `b` and `c` are now indirect
they go through source
and now they use primitive addresses
so can we still see them?


locker room analogy
every property and node is stored at a locker, an address
and certain lockers are public
the "locker room" represents the entire source code of that actor

is there a point to having "semi-public" source code?
as in, make it so that actors can copy "what they see"
that's one of the major side effects of trying to combine value and source-code

but why not just have source code be a completely separate concept
and it's either all public or not at all

not to mention, this idea of "semi-public" doesn't make sense for templates
for templates, it's not like certain parts will be visible while certain parts aren't visible
remember, for templates, you shouldn't be able to access properties
    see section "Templates and Property Access 2"
if it's a template, you can only do one thing which is spawn it

### Dynamic Spawning, Modifying Templates, and Metaprogramming

it's worth noting that we don't use recursion yet
while spawning does require source code, the source code is static
we don't have syntax mechanisms for dynamically retrieving/creating source code and spawning it

however, we would need such mechanisms for sandboxing and copying


javascript doesn't need the concept of "source code" within the language
it does have `eval()`
but most stuff is just interpreted line by line
the language isn't aware of itself (aside from eval())

maybe we can do the same
most of the time you just set_spawn or spawn from static source code


however, one benefit of having this "source code" datatype being defined in the language
is that it provides tools for constructing and modifying source code
instead of having to modify it as a string
you can add properties, remove properties, move bindings, etc
_metaprogramming_

however, maybe we can save this for later
and for now, just work with static source code

we still need to make sandboxing/copying work (in order implement object-key property access)
but we can make it for static code templates
and assume that the template source is private, you can only copy the template, but you can't see its internals or figure out how it works
(in other words, the source code is always obfuscated)


###

another argument for making source code a primitive datatype
source code is a naturally recursive structure
you take the source code for an object and spawn it
and that object may reference more source code, and spawn child objects
recursive interpreters
and just using raw strings for source code, can't capture that pattern


what does it mean to control the environment
environment is passed in via insertions
so it's not really special
so what is the difference between cloning and copying?



### Object-Key Property Access Revisited - how are we accessing the keyset?

(continued from "Functional Property Access - Implementing Property Access using Sandboxing and Equality")

revisiting the object-key property access mechanism

for any spawned object
it can't directly reference external objects
they have to be passed in
most of the time they are passed in via the `_scope` object

however, recall how the object-key property access mechanism works
you spawn the function yourself
then pass in a key
and it will compare it against the list of internal keys
using the `.equals()` method of each key
and if it finds a match, it returns the corresponding address for that object-key

however, where does this prop-access function get this "list of internal keys"
if the reader is spawning the function themselves, then they need to pass these keys in somehow
but the reader doesn't necessarily know which keys these are
maybe the reader passes in the original object?
first: some terminology clarification

        Alice:
            val: obj[key]

in this case, the reader `Alice` is accessing the property `key` on object `obj`
(at times I may also refer to `obj` as the _readee_)
which can be represented as:

        Alice:
            val: obj.propAccess(key)->    // note: sandboxed function call

so the `propAccess()` function must compare the input `key` against all of the keys inside `obj`
and this `propAccess` function must be self-contained, so it can be sandboxed
so where does it get its list of keys?
perhaps when Alice spawns `propAccess`, she passes in `obj` and then `propAccess` can retrieve all keys privately
Alice doesn't need to know what keys are inside `obj`, or how `propAccess` is retrieving them
all that functionality is hidden inside `propAccess`

but then, if `propAccess` is given access to `obj`
how do we know that `propAccess` isn't doing any side effects?
how do we know it isn't leaking the input `key` to `obj`?

### 

maybe we don't need a reference to every object-key
if for a given key `someKey`, the `someKey.equals()` function checks the address `12345` of the input object to see if it contains `true`
we can just extract out that bit of code
so the `propAccess()` function just checks the `12345` address of the input key
and if it contains `true`, then we know that the input key must match `someKey`
and we return the corresponding address

however, the implementation of `someKey.equals()` is private, and might not be visible to the readee
so the readee can't just figure out that it accesses the address `12345`


notice that, while we do seem to need references to all object-keys
the functions that we are invoking on each object-key are pure functional

so perhaps we can embed references to other objects?
inside the source code?
kinda like a closure?

but if you can embed references
and the internal code of the `propAccess()` function is obfuscated
how does the reader know that `propAccess` isn't doing any insertions?

### Object-Key Property Access Revisited - how is the keyset accessing the input key?

maybe we only need to embed the `equals()` function for each object-key
    not the object-key itself
and even though the implementation is private, it can be obfuscated and extracted out
we may not know which address it accesses, but we can still copy it and call it safely

but recall that equality is "double-sided" (see section "Double-Sided Equality")
right now, the reader is passing the input key into the `equals()` function of every object-key
so now the only missing part is, we have to pass each object-key into the `equals()` method of the input key
how can this happen if the `propAccess` function doesn't even have references to the object-keys?

maybe the reader passes the `equals()` method of the input key to the readee?
but now the readee can use that method to impersonate the input key

and recall that a main point of anonymous reads is to prevent leaking input keys

we need to check `inputKey.equals(objectKey)`
so if `inputKey.equals()` is checking for a `true` value at a secret address
then we need `objectKey` so we can check its value at that secret address


how does this work in real life
in real life systems
are there systems where you can create dictionaries where prop access doesn't reveal the key
eg data banks where users can input a password and decrypt the data bank, without exposing the password

while such things are trivial, the difference is real-world cases, the input is a string or a number
whereas in our case, the input is an object, an actor
imagine using a live-running server, as a password

we can't just represent every server using an id of some sort, remember that we don't want a centralized id service
and having public id's allows for impersonation
// TODO: FIND REFERENCED SECTIONS

so instead of using static ids to identify objects
we instead use functions, the `equals()` function
so in a sense, this is what we are using as our "password"

### Tracking Keys - Keys with Built-in Tracking

* tracking keys
* we have to pass the input key into the `propAccess` function
* what if the key itself tracked its own usage, and leaked it
* for example, lets say that a readee creates a collection `usagesTracker`
* and then the readee creates a key `badKey` that has a special hidden address `777777` that references this `usagesTracker`
* in addition, the readee designs its `propAccess` function so that it takes the input key and tries to insert a `1` into the address `777777`
* now the readee distributes `badKey` to the public,
* and tells people to use it to store values inside the readee
* and now the readee can track any time somebody uses `badKey` on it

well maybe it can't be helped
at least it isn't leaking private keys

### Double-Sided Property Access (The Bilateral Protocol)

going back to our problem from earlier
    see section "Object-Key Property Access Revisited - how is the keyset accessing the input key?"
right now, the reader is passing the input key into the `equals()` function of every object-key
and we are only verifying that _______ before getting the address
but what if one of the object-keys has an `equals()` function that always returns `true`

we also can't just pass the `equals()` function of the input key to the readee
because then the readee can use the function to impersonate the input key,
    (TODO: FIND REFERENCED SECTION)
which is basically equivalent to leaking the input key to the readee

what if, instead of returning the address immediately
it returns two addresses, the address of the object-key that matched, and the address of the corresponding value
the reader wraps it in a function that has the `equals()` method of the input key embedded
and then when the readee passes itself to the function
it uses the address of the object-key to retrieve the object-key
and then passes it to the `equals()` method of the input key
and if it returns true, it will finally return the address of the corresponding value
(actually on second thought this method might not work, but the concept makes sense i think)

this way, we aren't directly using the `equals()` method of the input key, so it can't be used to impersonate the input key
in the same way the readee creates a black box `propAccess` function that contains the `equals()` method of every object-key, but its obfuscated and doesn't reveal the identity of any individual object-key

a better way to think about this is
the readee provides a function that runs sandboxed in the reader, and accesses the reader's private info (in this case, the input key)
the reader also provides a function that runs sandboxed in the readee, and accesses the readee's private info (in this case, the readee's keyset)

it is a bit unfortunate that the reader has to provide a function to the readee now
which loses one aspect of "anonymous reads"
but at least there isn't information leak to either side

this entire process is also starting to get more and more complicated (aka slower and less efficient)
but perhaps caching and other optimizations can help
it's merely a proof-of-concept, a proof that its possible


### Static Bindings, Parametized Templates, and Dynamic Substitution

(continued from section "Dynamic Spawning, Modifying Templates, and Metaprogramming")

going back to generating templates
the only reason we need this concept of dynamic templates and passing around templates
is for sandboxing/copying
because set_spawn and spawn can be done using static templates
so we don't need fully-fledged tools for template modification
we just need enough to make sandboxing/copying work

it seems like the only "dynamic" part of templates right now is static binding / address embedding
    necessary for the parent to pass in private data like `_scope`
a parametized template, that makes it easy for a template to specify that certain values are provided by the parent directly

though from the language standpoint, we are just generating a template and then spawning it
we don't need to go into details of how it is being generated

but this is still something we are adding to the language
a temporary rule/mechanism
that falls under the umbrella of "generating and creating templates"
javascript has `eval()`, but its not a part of the language
javascript doesn't need it
we are almost giving our language an awareness of the interpreter
by giving the ability to generate templates and execute them, within the language
why doesn't javascript need it? why do we need it?

i think it's because in javascript, the "templates" are static
you define a function, and then during interpretation, you can call it but you can't modify the definition
whereas in firefly, the implication with embedding and substitution is that you _can_ modify the template
which, in a sense, seems a bit redundant
considering cloning already provides a high-level way of modifying objects

### Transforming Static References to Embedded Addresses

(continued from prev section, "Static Bindings, Parametized Templates, and Dynamic Substitution")

actually dynamic substitution isn't necessary
and doesn't even need to be in the language syntax
technically one could simply just hard-code an address in a parent and child

        parent:
            child:
                console.log(this[777777])
            child[777777] <: "hello"

however, as a convenience, we can provide higher-level syntax sugars that _imply_ static binding
eg scoping and other "tertiary forms" (see previous section ___________)
and then when these higher level constructs get transformed into primitive operations
we can generate these hard-coded addresses

this distinction is important
we are generating these hard-coded addresses _during the transformation_
so the concept of static binding does not exist at the axiom level
it's a _dynamic syntax sugar_ that generates a random address during its transformation to primitive operations
the syntax sugar transformation is dynamic, but the template is static

in fact, the terminology I used earlier, with "parametized templates", and "dynamic spawning" and such
was confusing and misleading, and led me down the wrong path
we are not passing around templates and then providing parameters whenever we spawn the template
static bindings are bindings between **the template definition and the parent that is defining the template**

as an example, imagine I create the template `Foo` within the scope of `FooParent`
I can define a static binding between `Foo` and a value inside `FooParent`
and all this does is generate an address, and embed that address into both `Foo` and `FooParent`
    let's say this address is `777777`
this allows `FooParent` to provide values to `Foo` during spawn time,
    it allows `FooParent` to "initialize" `Foo`
and this basically means that `Foo` (and all spawns of `Foo`) will always look for the value at address `777777`
the address is already embedded, and can't be changed
now, lets say somebody comes along and wants to spawn `Foo` as well
and they also want to initialize `Foo`
they can't embed a new address in `Foo`, the template is already created
instead, they have to get the special address (in this case, `777777`) from `FooParent`

it's important to also note that this syntax sugar is optional
we could have manually hard-coded the address `777777` into `Foo` and `FooParent`
and it would work just the same
the syntax sugar is just to abstract away this process of generating arbitrary addresses and hardcoding them


the addresses are embedded when the template is defined
not when the template is spawned
templates themselves are static, and the spawning mechanism is also static
static bindings are just syntax sugar for embedded addresses


### Sets of Addresses II

* earlier we said that it doesn't make sense to use address sets
* because a set of addresses doesn't make sense without the context of the parent
    * see section "Sets of Addresses"
* so it doesnt make sense to pass it around by itself

* but isn't that the case with regular addresses too?
* yet we have no problem treating address as a primitive
* but often, addresses don't make sense without the context
* we just assume that the people passing around the address, are aware of the context

* or maybe
* instead of having public sets
* you pass in a function to the collection
* and it does the set_spawn for you


* right now sets feel like the ugliest part
* they feel so disconnected from the rest
* spawning and addresses and prop access all seem to work quite well
* but sets, with its special interface containing the three methods `set_spawn`, `make_ordered`, and `pick_one`
* could technically all be implemented using spawning and addresses
    * and a tiny bit of static binding
* if we implement sets as linked lists
* then `pick_one` and `make_ordered` are trivial
* and `set_spawn` can be implemented with recursion
* eg, store the template in the environment at some address, say `Environment[777777]: Footemplate`
* and then inside `FooTemplate`, access itself at `Environment[777777]` and spawn itself
* and then the last part would be to take some input linked-list and then at each step in the recursion,
* iterate through the linked-list and spawn
* note that the only caveat here is the reference to `Environment`, which is a static binding that is currently implemented via insertions and `pick_one`
    * see section "Implementing Initializers"

### Unordered-First Mindset

* the only reason why I want the concept of sets
* is because linked-lists are ordered
* and I want the concept of un-ordered
* so sets are more of a built-in object type, than an axiom
* without them, the language is still Turing Complete (well aside from the static binding part, which is currently implemented via insertions and `pick_one`)

* so it feels like our "base" language is ordered
* and sets are just an un-ordered interface on top of it

* but don't we want the opposite?
* make the "base" language un-ordered
* and add order on top of it?

### Recursion and Property Access vs Set-Builder Notation

* how does set theory work?
* sets are all unordered
* how are they able to model everything without using order?


* well sets are defined using set-builder notation
* uses predicates, instead of spawning/recursion
  * instead of using iteration, you use a predicate (a fn that returns true/false) and find items that match
* and uses set-membership, instead of trying to extract information using addresses and property access
  * so instead of say, looking through the insertions, filtering for items that have the prop `isPrime`,
    and then using `pick_one` to get the first one
  * you say $\exists n \in Primes such that ...$
* that way, the definitions are still un-ordered

* set-builder notation still reference other sets though
* so the concept of "references" is required
* which in our case is currently implemented using insertions, prop access, and pick_one
  * see section "Implementing Initializers"

* also need at least one infinite ordered set (the axiom of infinity)
* commonly provided using the set-theoretic definition of natural numbers
* (maybe we kinda have the axiom of infinity too, with our infinite address space?)

### Keysets, KeyChains and Object-Sets

* keychains
* computers often have a password management system called a "keychain"
* where it stores your passwords or authentication keys for apps
* and can log into them automatically for you
* this is actually very similar to my idea of "keysets"
* when you access an object, the items that you can access are determined by what keys you have
* in a sense, your keychain
* you have use own keychain to access the object
  (or use the one provided by the object itself, the object's public keys)
* and you can get all the corresponding values
* a keychain is a basically just a set of addresses

* so maybe "sets" are made up of addresses, not objects

* and we can actually implement object-sets
* you have an object that simply contains a keyset and a target object
* and it has the same interface as the keyset
* so you can also do `pick_one` on an object-set, and internally it will just call `pick_one` on the keyset 
* and access that key on the target object and return the corresponding object

* this is very similar to how we have addresses as a primitive
* but object-keys are implemented, even though they are used the same way

* in this case, keysets (or perhaps more aptly named: address-sets) are a primitive
* and object-sets are implemented, but have the same interface

### Set-Builder Notation and Query Languages

lets think from a clean slate
set builder notation
how would we create a programming language for it?

actually query languages like SQL are basically set builder notation languages

however, for our case, we can't just reference the environment
because in our decentralized network, people create their own isolated environments

this whole system of scoping
or parents passing in values to the child's initializer
to "initialize" the child's environment
seems like a completely different system from query languages or set-builder notation


so perhaps we can implement some query-language mechanics for creating sets

note that insertions and querying are two vastly different ways to create sets
for insertions, actors from different, isolated environments **push** into a single set
but for querying, the set itself **pulls** from multiple data sources

so query-languages don't really have a sense of privacy
and i feel like the whole functional-style actor model provides that
it allows multiple independent and anonymous actors to create a set
an analogy would be like posting to reddit
reddit does not need to know who is posting, it just receives posts from whoever wants to send them

### Query Model vs Actor Model - Feedback

* one thing about query langs and set-builder notation
* that sets it apart from functional / actor-model languages
* is that they don't allow for recursion/feedback
* whereas functional / actor-model languages do

* in a sense though
* feedback is inevitable in a decentralized network
* since you have no control over how information is handled outside your environment
* so you have no idea if the person giving you input data, is actually getting it from your output data
* I talked about this a while ago, in the section "Comparison With Other Reactive or Actor Model Languages"

### Query Mechanisms within Actor Model

* so it sort of makes sense that we need this actor-model layer
* that represents the decentralized nature of the system
* this ecosystem of distributed, isolated environments
* and then within each environment, we can use things like querying and set-builder notation


### Encrypted Behavior

Note that one of the assumptions I have been making a lot
is that behavior can be encrypted
this was first discussed in "Can Downloaded Code Contain Private Behavior?"
but the concept of sandboxed code and object-key access relies on it
    see section "Double-Sided Property Access (The Bilateral Protocol)"
however I believe that it's possible to encrypt behavior effectively
there are protocols such as the [garbled circuits protocol](https://en.wikipedia.org/wiki/Garbled_circuit)
also, it's [impossible to figure out if two programs are equal](https://stackoverflow.com/questions/1132051/is-finding-the-equivalence-of-two-functions-undecidable), undecidable


### `pick_one` vs $/exists$

set builder notation doesn't have `pick_one`
`pick_one` is rather ugly
feels like a hack to insert into a collection, and then `pick_one`
we are relying on the fact that only one person can insert into it
but then why not just directly pass it in

set-builder doesn't have `pick_one`
instead it uses things like $\exists$
for example, if we wanted to define `union`, which finds the union of a set of sets

$$
union: { n | /exists S in SetofSets s.t. n in S }
$$

in a sense, it's "backwards"
we define things in terms of the inputs
instead of `pick_one`, which is "forwards"
we take inputs and operate on them

### Using Set-Builder Notation instead of `pick_one`?

how would we define objects in a "backwards" sense, like set-builder?


maybe something like

    student:
        grade | gradeMap[test.score]

often when we want to define a new variable we can use /exists

how to do prop access
well maybe every property is represented using a set (address, value)
we represent the set of all addresses using A
so if we were trying to retrieve the property "foo"
like `bar: obj.foo`
and then we can do

$$
\{ bar | /exists prop in Obj, /exists addr /in prop, addr /in A \& addr = "foo" \& bar /in prop \& bar /notin A \}
$$

however note that due to the way set-builder notation works
if there are multiple items that satisfy the condition
then `bar` would represent multiple items
so we would still need `pick_one`



wiki https://en.wikipedia.org/wiki/Set-builder_notation#Parallels_in_programming_languages
functional has set-builder notation
list comprehension


### 

distributed collectors
right now the parent can control what messages a collector accepts
almost like a social network moderating the posts
which seems natural because the social network platform is the one responsible for hosting the posts, so they can control what they host
but what about a decentralized distributed collector like bitcoin
where nobody is in control, anybody can post, and the posts are hosted by everybody

well actually this is more about how the collection is implemented
but in terms of the language, there is nothing wrong with the idea of a "distributed collection"
whether a collection is distributed or centralized makes no difference from the language standpoint

### An Address for Every Value - Referenced Objects

starting to work on implementation
putting every value on an address, as we mentioned before
    // TODO: FIND REFERENCED SECTION
so every address access, the accessed value is stored on a separate address
insertions don't have an address, as mentioned earlier
    see section "Removing Insertions"

but sometimes values are passed in
through insertions
and we are just storing them on an address so that other people can access them via our object
but this is different from spawned objects, which we create

are these references, proxies or aliases?
    * proxy: all property access on the reference, goes _through_ the reference before hitting the source object
    * alias: property access goes directly to the source object
doesn't matter since reads are anonymous
even if they were proxies, they wouldn't be able to track what properties were being read, or try any man in the middle attacks

note that this is different from just creating a "mirror", an object that _looks_ like the original object by copying properties over
because that would require the mirror object to know all the private keys of the target object
so no security issues

### Defining the Template Format

exploring how to represent the axioms and primary constructs:

```js
const template = {
    'addr_255': { type: 'access', source: 'addr_101', address: 'addr_751' }, // equivalent to `this[addr_255] = this[addr_101].[addr_751]`
    'addr_231': { type: 'spawn', source: 'addr_255' },                       // equivalent to `this[addr_231] = spawn(this[addr_255])
    insertions: [
        { source: 'addr_509', target: 'addr_999' },                          // equivalent to `this[addr_999] <: this[addr_509]`
    ],
}
```

* we have a way of representing most of the main operations: insertion, access, and spawn
* all we need now is address sets

### Address Objects

(continued from prev section, "Defining the Template Format")

looking at our current template format
however something i noticed is
it's a bit weird to pass around address sets
because if you notice, we are actually never passing around addresses
the value stored at an address is always an object, never an address
the result of an `access` is always a value

one key advantage of this is, we'll never accidentally do try to access an address on an address
eg, we would never run into something like `addr_111: addr_222, this[addr_111].[addr_333]`

in fact, we can re-formulate all our secondary-forms to never pass around addresses as values
for example, cloning already follows this

if you want to allow other actors to initialize the template
instead of passing them the address of the initializer
you can do so by providing a pure function `initializeFn()` that takes in an object (spawned from the template),
a set of values, and then inserts that set of values into the correct address for the object

what about object-key access?
well right now we compare keySet.findMatch(inputKey) and inputKey.findMatch(keySet) and both will return the address of the match and then we see if the returned addresses are the same

        leftAddrEncrypted: spawn{keySet.findMatchTemplate}(inputKey)      // this happens securely on the inputKey side
        rightAddr: spawn{inputKey.findMatchTemplate}(keySet)              // this happens securely on the keySet side
        if (decrypt(leftAddrEncrypted) = rightAddr) return obj[rightAddr] // this happens securely on the keySet side

instead of passing around the address of the matching value
we instead create a unique object corresponding to each key, and spawn it within the equalsTemplate
        if (equalsKey1(inputKey)) return (addr_1: true)
        else if (equalsKey2(inputKey)) return (addr_2: true)
        else if (equalsKey3(inputKey)) return (addr_3: true)

and then do

        left: spawn{keySet.equalsTemplate}(inputKey)
        right: keySet.equals(inputKey.equalsTemplate)
        for (key in keyset) {
            if (left = right & left[the special addr eg addr_1]) return this[key]
        }


in fact we can generalize this transformation
instead of passing around addresses
we generate an addrObject for every address
and pass that around
and the original object can use the addrObject and get the corresponding value
but isn't that just the same as passing around addresses?
well while it behaves exactly the same, it shows that we don't need to pass around addresses

but wait, earlier when we created address objects like `addr_1: true`
that depends on the spawner providing the value `true`
what if they don't?

instead, we create a "mirror" function
that just outputs all of its inputs
note that it is completely self-contained, aka it can be embedded into templates
and we store that at the secret address, `(addr_1: mirror)`

now the original object can get the value at the addr_1
then pass it `true`, and if it gets it back, then it passes back `value_1`

actually if we implement `true` how functional langs implement it

    function True(branchA, branchB) {
        return branchA;
    }

(see section "Pure Functional Data Structures" and [this article](https://www.linkedin.com/pulse/function-data-structures-javascript-basics-kevin-greene/))
then is also fully self-contained, can be embedded
so no need for the mirror function



can this addrObject method work for hashmaps
where items are dynamically added?
we can't statically embed addresses for each value, when the values are dynamic
do we have to generate addresses on the fly when a new key-value pair is added to the hashmap?
I guess this falls under the broader category of computed properties

probably works though
we don't need to generate addresses on the fly and then pass them around
we just need to make sure the `propAccess` function supports these inserted properties



passing around address sets has a similar problem as passing around addresses
eg, we might accidentally do property access on an address set

so we might have to re-think address sets...


### Public Sets using Linked Lists

we talked earlier about how we need public sets
we can't just restrict set-spawns to `_insertions`
    see section "Restricted set_spawn - set_spawn restricted to `_insertions`"

hmmm
what if all sets were just linked lists?
what would that look like?

lets just try implementing it using linked-lists, templates, and recursion
the functional way
and perhaps that will give us an idea of how it might work in our language

        set_spawn: template, list >>
            spawn{template}(list.value)
            set_spawn(template, list.next)

clearly, if public sets were linked-lists, it makes things much easier
so it seems like the core thing we are trying to achieve
is for an actor to be able to take a public set, and spawn a template for each item in the list


hmm do intializers use public sets?
since the actor needs to do `_initializer.pick_one()` to get the initial values
actually no, it can be done with restricted set_spawn
`_initializer` can be implemented like:

        _initializer:
            [7777]: _insertions.pick_one()
        someValue: _initailizer[7777].someValue

(note that `7777` is a static address generated by interpreter)

### The collapse() Function

if we make pick_one necessary for lots of cases
it means that non-determinism will become prevalent
because `pick_one` is technically non-deterministic

really, in many cases all we need is a reducer function
some way to turn a set of items into a single item

`one_or_none` function
if the set only has 1 item, it returns it
otherwise returns undefined

this function has 4 properties that are desirable
1. reduces it to one item (unlike `map()` or `set_spawn`)
2. deterministic (unlike `pick_one()` or `make_ordered()`)
3. unordered (doesn't depend on the order of the items)
4. doesn't depend on object type (unlike sum, which expects items to be numbers)

we'll call it collapse() from now on


what about `make_ordered()[0]`?
still nondeterministic

`make_ordered().collapse()` is prob better

### 

(continued from "Address Objects")

the only reason to separate every public sets, into an address sets + the source object
is if we would pass around address sets separately,
and use one address set on different objects
but notice that since addresses are never passed around, and are generated in the interpreter
the same can be said for address sets
every address is specific to each object?

### Multiplicative Behavior

thinking about restricting set_spawn to private insertions, aka the `_insertions` object
    discussed previously in section "Restricted set_spawn - set_spawn restricted to `_insertions`"
these set operations are very special, so its nice to have them localized to the object internals
and then public sets would be implemented using protocols

it would also follow this pattern of having a low-level axiom and a corresponding high-level syntax sugar
eg how scoping works:
    * low level uses static binding, high level uses scope which is implemented using static bindings
and also prop access
    * low level uses addresses, high level uses object-keys which is implemented using addresses

however as we mentioned before, only allowing set_spawn on private insertions
    // TODO: FIND REFERENCED SECTION
doesn't allow for things like, double-nested loops, product spaces, multiplicative behavior
for example, if we were trying to mimic something like

```js
    for (r in rows)
        for (c in cols)
            console.log(`coordinate: ${r},${c}`);
```

attempts:

        foo([1,2,3,4])
        foo: rows >>
            _insertions
            for (col in insertions):
                // how do we access each row here?
        
        // we can try to insert col into rows, and make `rows` a special object that handles both rows and cols
        foo: rows >>
            _insertions
            for (col in insertions):
                rows <: col
        rows:
            _insertions
            // same issue, now _insertions contains both rows and cols, but we want to iterate across them separately


in fact, if set_spawn is only allowed on private insertions
that means that every insertion can only spawn a static number of items
and spawning a static N items, is like merging those N templates and just spawning the merged template
which effectively means that every insertion can only spawn one item
so it's clear why multiplicative behavior is impossible
(assuming we don't use feedback, aka inserting into oneself)

### Recursion/Iteration and Multiplicative Behavior

how does recursion enable multiplicative behavior
well if you have a function that takes two iterators as inputs
it can iterate the first one until reaches the end
and then reset the first one while iterating the second

```js
    function recurse(row_iter, col_iter) {
        if (row_iter.next()) {
            console.log(row_iter.value + ',' + col_iter.value);
        } else {
            row_iter.reset();
            col_iter.next();
            console.log(row_iter.value + ',' + col_iter.value);
        }
    }
```

essentially, you are traversing a grid
because you can iterate each iterator independently

for example, the ackermann function

```js
function ack(m, n) {
    if (m == 0)
        return n+1
    else if (n == 0)
        return ack(m-1, 1)
    else
        return ack(m-1, ack(m, n-1))
}
```

overall, the way recursion handles mapping across a "multi-dimensional" sample space
it's a rather "ordered" approach, basically breaking down the grid/space into a linear traversal

we can enable multiplicative behavior on set_spawn
if mimic set-builder notation like $/exists m /in S, /exists n /in S, m+n = 0$
so in syntax we would do something like

    for (m in _insertions, n in _insertions):
        ...

this is similar to the stuff we talked about in "Monads and Sample Spaces and Infinites.one"

it's an unordered approach to mapping across cartesian product spaces

now why do we need this, if we can already achieve multiplicative behavior using linked lists and recursion?
because this provides a way of doing it in an un-ordered way

this way, all behavior pertaining to parsing _insertions and applying set operations, is now localized within the actor
on the outside, outsiders can only do two things: read properties and insert data

so now how do we leverage this to emulate public sets?

is it possible to implement exponential behavior? eg power set?
what about something as complex as the ackermann function?

### Using Recursive Insertions to Emulate Functional Recursion/Iteration

something i realized while looking at the ackermann function
is that the reason recursion is so powerful
is that it can dynamically change its "path" on each iteration
eg, at every iteration, it can check its arguments and see where to go next

whereas, for the notation I introduced earlier, `for (m in _insertions, n in _insertions):`
i am establishing the sample space before doing the set_spawn
whereas with recursion, as you are spawning each child, you can dynamically construct the path/sample-space as you go

we can actually do something similar with self-insertions, or recursive insertions
an idea I actually explored earlier in section "Infinite Behavior and Recursive Insertions"


        ackermann:
            for ([m, n] in _insertions):
                if (m = 0):
                    => n+1
                else if (n = 0):
                    this <: (m-1, 1)
                    => ____ // get result of the above statement
                else:
                    this <: (m-1, n+1)
                    => ____ // get result of the above statement

well we still need a way to get the result of each insertion
so we pass in an address (or rather, an addrObject)
and then store the result and retrieve it from that address
since the result is inserted, it has to be retrieved using collapse()

still ugly
this pattern of storing values and then retrieving them using collapse()
seems very common
basically whenever we are trying to communicate one-to-one
so we know only one person is making the insertion

### Removing Order

what does this self-insertion style recursion achieve over regular recursion?
it's unordered
while technically, during execution, the insertions and spawnings happen in a certain order
but after everything is stabilized, if you just looked at `_insertions` you would not be able to tell what order everything happened

in fact, that seems to be the main purpose of sets and insertions
its a way of storing unordered information
which means it can be used to _remove_ order from a system
eg if we took a linked-list
and iterated through each item and inserted each item into a collection
that collection has now lost the ordering information that was in the linked-list

this is useful because it allows for more optimization
if order is unnecessary, we shouldn't have to specify it

is this possible in a functional language?
it seems like essentially what we are doing
is taking any unordered list of information
and then wrapping it in an `Unordered` interface
so any callers/readers have to treat it as unordered
and therefore, the interpreter/compiler can make optimizations because it doesn't have to maintain the original order

for example, if we had a huge list of store items
and we wanted to display 10 items to every customer
if the items were stored in a list, then we could write `list.slice(10)`


nondeterminism


we talked about all this before
see section "Order Forces Agreement/Consistency Across Readers" and "Nondeterminism and Unordered Sets"


well but i think nondeterminism is rarely used
even with databases, where order doesn't matter
usually when people retrieve them, they use an order
eg if you were to display store items
you would want to display them in a certain order

### Sets are an Interface?

so i think the best way to think of it is
sets are just lists with certain methods/properties removed
    eg, no array access, no iteration

if we go back to what we had earlier
when we explored what it would look like if sets were just linked lists
    see section "Public Sets using Linked Lists"
then it seems like the only method that sets need is `set_spawn`

then a public set would just be
exposing those methods to the public

but that's where the problem is
what does it mean to expose `set_spawn` to the public?
it's different from exposing a linked-list to the public
it would instead be like if every linked-list had a "forEach" function
and you exposed that
but that means that list/set itself is responsible for doing all the spawning
which we don't want right?

so it seems like this is actually the crux of the issue
what's been bugging me
if the caller is responsible for spawning, then how would that work if the Set isn't ordered and has no way of iterating through them?
if the Set itself is responsible for spawning, then how does the caller securely provide arguments to each spawn?

well since the caller provides the template, they know what address the initializer is at
so after the Set spawns the template for each item, it gives the spawned objects back
and the caller can pass values into the initializer of each object
in addition, for extra security, the caller needs to make sure that the objects returned are actually spawned from the original template
so the original template can have a hidden property that the caller can check on the returned objects

also recall that for a set_spawn functions similarly to forEach, eg `forEach(item => fn(item))`
in that every spawned object is given an item from the Set
to do this, the public Set and the caller has to agree upon some address
so during the set_spawn, the Set puts a set item onto that address in the spawned object
and the caller knows to define the template to pull from that address

last but not least, how is the Set spawning the template for each item?
if there are M callers calling a set of size N
then there are M*N total spawned objects
quadratic
can we leverage self-insertions?

        this <: callerListHead, itemListHead
        for ([caller, item] in _insertions)
            spawn{caller.template}(item)
            if (item.next() = undefined)
                this <: [caller.next(), itemListHead] // reached end of item list, move to next caller
            else
                this <: [caller, item.next()]

notice how in order to mimic recursion
the callers and items have to be ordered



another thing weird
is that the idea of public sets
is taking this method set_spawn and defining it as a public method
but we aren't actually defining it
because it seems like it's impossible to define
so i guess it's more as if we have a `_set_spawn` private method
and we are just doing `public_set_spawn: _set_spawn`
well but what is a "method" in this case?
remember functions don't exist in firefly (they are implemented using cloning)
is `_set_spawn` a template?


### Localized Orderings

something i've been thinking about
there are many cases where order seems necessary to define a function
reductions are a big example
eg, to sum a set of numbers

        setsum: nums >>
            => nums.reduce((x, acc, => x+acc), 0)

however, notice that the "order" is localized
from an outsider's perspective, they have no idea how setsum is implemented, and what order the set was traversed

maybe this is what removing order is all about
unordered sets isn't really about nondeterminism
its not really a mechanism or a specific data type
its a paradigm

we can define objects such that from the outside, there is no visible order
even if there is order on the inside
that ordering can be "removed" before exposing data to the public
this allows the internal implementation to be changed freely
without worrying about preserving some arbitrary ordering of items

the interface is unordered, even if the implementation is ordered


and public sets are just an example:

        [..._insertions].



contrast this with functional languages, where lists _must_ be ordered
since they are implemented using linked-lists (see "PureFunctionalDataStructures.js")

though i guess many languages do have unordered sets
like javascript and Java
it's really just a paradigm that Firefly is designed to encourage


if you don't need order, don't use it
if you need it, localize it


### Non-determinism and Unstable Sets

localizing it guarantees that readers can't expect the order to be the same every time
for example, take the implementation of public sets shown earlier
the input set `_insertions` is unordered, and the output set of spawned objects is also unordered
internally, the function orders the set, performs some operations, and then creates an unordered set

so note that there is an ordering that is created within the function
but multiple calls to this function can result in multiple different orderings
since `make_ordered` is non-deterministic, and **unstable**

to demonstrate this further, take the example:

        foo: nums >>
            => [...nums].reduce((x, acc, => x-acc), 0)
        
        someNums: Set(1,2,3)
        print(foo(someNums))
        print(foo(someNums))

lets say that in the first call to `foo`, `[...nums]` results in `[2,1,3]`
then the first output is $3-(1-(2-0))$ or $4$
lets say that in the second call to `foo`, `[...nums]` results in `[1,3,2]`
then the second output is $2-(3-(1-0))$ or $0$

so we can see that the output can change every time

contrast this with a functional language, where the input is a list, eg `[1,2,3]`
the output will be the same every time

contrast this with the javascript [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) object
where iteration across the Map will always happen in the order that items were originally inserted
from the outside, there is no indication that the Map has some inherent order
all the reader sees is a bunch of keys and values
however, if the reader iterates across it once, it can memorize that order
and it knows that every subsequent iteration will follow the same order!

this means that Javascript cannot make any optimizations that change the internal ordering of items
even though the interface is unordered, the javascript `Map` object is actually ordered!

so this shows why it's important that we specify that `make_ordered` is unstable
in a sense, because `make_ordered` is an axiom, and one of our first order constructs
it means that **non-determinism is an inherent part of our language**


### My Motivation behind Un-ordered Sets and Non-determinism

* I'm not sure if I mentioned this before
* but one of the main reason why I have been pushing for un-ordered sets in this language
* is that often when writing javascript/java code
* there will be times where order is un-necessary, but I am forced to specify one
* a simple case would be like, if i have to increment `foo` and `bar`
* it doesn't matter which order i increment them,
* but the way imperative code works is you have to write something like

        foo++
        bar++

* and I am kinda perfectionist
* so often times, if I'm forced to specify an order
* I want to specify the "best" order
* and i'll waste time trying to figure out what order I should put them in
* even though it doesn't really matter

* because in a sense, the way the language is designed
* is that it _does_ matter

* this is why declarative code is so nice
* you only specify what you need to specify
* you aren't forced to specify some arbitrary order


### Sets are an Interface II

(continued from section "Sets are an Interface" and "Non-determinism and Unstable Sets")

actually maybe functional languages can have this concept of un-ordered sets
they just need an interface `Set` that only exposes the method `map` and `make_ordered`
`map` returns another `Set`
and `make_ordered` returns a list but is not guaranteed to be the same order every time

if the interface is designed like this
then it's actually impossible to tell what the internal ordering is
even if the reader iterates across it once and memorizes the order
the way the `make_ordered` method is defined, it does not guarantee the same order every time
so the internal implementation is allowed to choose the order however it wants

so it seems like order vs unordered
is getting into type systems and category theory

though I guess to specify an "unstable" and non-deterministic `make_ordered()` function
you would need to have some inherent notion of randomness and non-determinism
which lambda calculus doesn't have
so perhaps that's what makes Firefly un-ordered sets special?
that non-determinism is part of our axioms?

### Privacy Implies Side Effects

in the prev section "Anonymous Reads and Lazy Evaluation"
we discussed how properties have to be kept up to date, eagerly evaluated
since 

we can take this one step further
with functional code, the caller can choose how the callee affects the environment
for example, a callee cannot directly send data to IO
the caller has to pass in the IOMonad, and the callee returns a modified IOMonad,
and that IOMonad has to be passed all the way up the chain in order to actually affect the IO

however, with privacy and anonymity
the caller cannot control what the callee does with the information that is passed to it
the callee is free to send data where ever it wants

this proves that Firefly and other actor languages can achieve something that functional langs can't

we actually discussed and debated this all before
where we talked about whether or not a drone/robot should be able to leak info
// TODO: FIND SECTION

### undefined as a type or a primitive?

if we go back to how an iterator would work
how would you know you're at the end?
when you reach the end, `item.next` will be undefined
but if `undefined` acts like any other object, how do you check that it's `undefined`?
maybe `undefined` has an equals() method?



### set_spawn vs Non-deterministic Iteration

set_spawn can also be implemented using make_ordered and iteration

so i guess we are representing unordered sets as simply nondeterministic iteration

but there is a slight difference between set_spawn and non-deterministic iteration
non-deterministic iteration allows for, say, retrieving 10 random items from a set
this is essentially a reduction function
it cannot be achieved via map
it cannot be distributed in perfect parallel


is this perhaps too powerful?
providing features that weren't possible before using set_spawn only?
and is it too ordered?
by providing all public readers the ability to iterate across the set
can we still optimize map operations to run in parallel?

* put another way
* we are forcing all sets to provide this functionality
* so we should try to keep it minimal
* as an analogy, imagine if we forced all sets to provide a _deterministic_ iterator
* then a lot of optimizations wouldn't be possible
* for example, the optimization talked about in section "Order Forces Agreement/Consistency Across Readers"
* where a Set could distributed across datacenters around the world
* and readers will access the nearest datacenter for the first couple items, and if they need more they start reaching out to further datacenters
* if we forced deterministic iterators, we couldn't make that optimization


can we run non-deterministic iteration in perfect parallel?
if we have something like

        somePublicSet.map(someTemplate)

but `map` is implemented using non-deterministic iteration, how can it run in parallel?
well we can first iterate to get all items, and then distribute the items to workers
so in the following code

        map: someSet, someTemplate >>
            head: someSet.order()
            recurse: list >>
                if (list != undefined):
                    item: list.value
                    spawn{someTemplate}(item)
                    recurse(list.next)

            recurse(head)

this may seem like each item has to be spawned in order
but since Firefly is an unordered language
statements in each block happen concurrently
so the `spawn{someTemplate}(item)` and `recurse(list.next)` statements happen at the same time
so if we imagine the `spawn` statement takes a long time
then the next iteration of `recurse` will finish running, which will start `spawn` and another `recurse` iteration
something like

        spawn...
        recurse
            spawn...
            recurse
                spawn...
                recurse

and the program will iterate through the entire list, spawning a bunch of children effectively in parallel
because the iteration happens so quick relative to the spawning


but the iteration is still happening linearly
can be slow with a million items

this still doesn't seem to solve the problem
where forcing every set to provide an iterator
can prevent certain optimizations
(though can we think of an optimization that is not possible with non-deterministic iteration?)

what if we optimized 

`map` can be optimized in the interpreter?
meta-programming?

but would be nice if could be specified in the language itself

what if we have a function that takes a condition and retrieves a random item that fulfils that condition
then, we can construct a linked list using that
basically, `head: someSet.pick_one(item => item not in tail)`



actually, it's up to the actor to publish the
actually, since `order()` is a function



### Lazy-Loaded DOM and Dynamic Hydration

i realized this from seeing how slow Coda and Notion get when notes get too long

react has something called hydration
takes static html provided during server-side rendering, and then attaches a virtual dom to it
basically, instead of constructing the components and virtual dom and _then_ generating the html (which is the usual flow)
show the user static html to start with, and then in the background start binding and attaching the reactive components
this way the page load looks a lot faster

but i can take this one step further
as you scroll up and down the page
elements that are not visible can be unbound to save memory and space


perhaps this is how react-virtualized works?
though react-virtualized i think doesn't render the elements at all if they are "above or below the fold"
whereas in this case you would still keep the static html, while removing the bindings

levels:
0. nothing, or maybe just an ID indicating what should be loaded
   1. kinda like pagination, the next page is nothing but a pagination id indicating what should be retrieved from the server
1. pure data from the server, static html and raw data
2. dynamic components


### State Variable Syntax and @-Blocks II

(note: a lot of this was actually covered in the section "State Variable Syntax and @-Blocks")

was thinking about state vars again
two ways to access an input

        input.value // reactive, gets the latest value

        @time
            input.value // gets the value at a certain moment of time

recall that the way state variables work is that it gets transformed into something like

        input.value[time] // gets the value at a certain moment of time

how does this even work? does `input.value` return a String or a list of states?

maybe we could do

        input.latest // reactive, gets the latest value

        @time
            input.value // gets the value at a certain moment of time


or maybe extend the Number and String types
from the outside it looks like a normal Number
but you can override a property `state` with something like `state: (time: 215214)`
and it will return a new Number
eg `print(x)` returns `4` but `print(x(state: (time: 123213)))` returns `7`


but using `input.value` for both use cases
this allows for code re-use

but actually we don't want code re-use here
because for stuff like

        input.value := input.value + 10

it wouldn't make sense to use this piece of code in regular code flow
only within an @-block

this is pretty much like how in javascript
async and sync code are incompatible
async uses `await` and `async`

except this is the opposite
all code is reactive and concurrent and asynchronous
except for @-blocks, which are synchronous


so what's the point of @-blocks?


well actually we can make it compatible
for an @-block function

        onClick: @time
            counter += 1

it is transformed into

        onClick: time >>
            counter <: (at: time, counter.at(time) + 1)

if a caller is also an @-block

        onPageLoad: @time
            onClick()

gets transformed into

        onPageLoad: time >>
            onClick(at: time)

because all function calls and object clones have the `at` property implicitely passed in

this way, we can explicitly call an @-block with no issue, eg `onClick(at: time)`

i guess javascript works similarly
async blocks can still call sync functions
and sync blocks can still call async functions, they just have to treat the return value as a Promise


### Deferred Update Framework

often we want to defer updates
esp when it comes to interaction with the backend
deferring also allows for batching, which is super useful

we can easily do so
if we have an "out of date" state
and during the outdated state, we show a spinner/loader
and then every few seconds we run a "refresh" lifecycle
that fulfills all pending updates

however, we don't want to bake this into the language itself
because the language is reactive
it shouldn't be aware of the update mechanism
from the language point of view, updates are instantaneous and always occurring

instead, we can have a framework for this
and anybody that wants semi-reactivity
and deferred updates
and build on top of the framework


### Explicit vs Implicit Random

if _insertions.order() is the only operation
we should just make every reference to _insertions, return a non-deterministic iteartor
however
the order can still be shared and agreed upon by multiple actors
    talked about in section "Order Forces Agreement/Consistency Across Readers"
if two people use the same iterator
tho that's within the actor, up to the actor to decide
the actor can create different iterators for each request if they want

explicit random:
we could make every call to _insertions be the same order
and then you can add randomness, _insertions.randomize()
and the interface would be the same

### Insertions Iteration Exploration


how to implement
reserved words for `next` and `value`?

it's weird because now we need three reserved words, `_insertion` `next` and `value`
for just one mechanism


_insertions iterator is almost both a first-order construct and a third-order construct
iterators and linked-lists are a pretty common data structure, just like a binary tree or a stack
so it feels like a third-order construct
however, the _insertions data structure is created in the interpreter,
so it

`next` and `value` are like constants,
but most constants are passed in
whereas `next` and `value` are like reserved constants
weird

maybe we can use the functional method for linked lists
like instead of accessing `list.head` and `list.tail`
`list` is a function, and you call it to access the head and tail passed in as arguments
eg `list((head, tail) => { do stuff })`

instead of private arguments, we have static bindings


perhaps the concept of iterators and linked lists should be reserved to third-level constructs
for first-level, we need something even more abstract?


use functional

    foo:
        templ: (next, value) => {
            next(templ)
        })
        _insertions(templ)

(note: )
i'm pretty sure works the same as iterators
also, don't need reserved keywords
still needs static bindings with two special arguments
but still feels more contained

actually, one small fix

    foo:
        someTemplate: (next, value, template) => {
            next(template)
        })
        _insertions(someTemplate)

### Actors as Templates

it looks like there are two things that can be passed around, actors and templates?

actually templates can be considered actors too
for now, they may be some special javascript object we are using in our interpreter
but from the language perspective
we can construct templates out of regular objects
as long as the `spawn` method can understand it
the `spawn` method is just a dynamic interpreter
a super-simple non-turing-complete interpreter might look like

        if (template.foo)
            => 1
        else
            => 2

so we can use whatever format we want for templates
as long as the `spawn` method agrees on the same format, and can interpret that format

in fact we could have just used strings for templates
and strings are actors as well

### Insertions Iteration Exploration II

wait, for _insertions iteration to actually work well
we need to be able to pass information between spawned templates
otherwise it's just a set_spawn
we introduced order for a reason
so maybe we can initialize?

    foo:
        someTemplate: (next, value, template) => {
            nextIteration: next(template)
            nextIteration._initializer <: stuff
        })
        _insertions(someTemplate)

but wait, static bindings and initializers depend on `collapse()` (formerly `pick_one`)
which depends on insertion iteration
circular!

maybe we can use reduction function, `_insertions(reduceFn)`
no, same problem


circular:
iteration/recursion requires static binding (we need to iterate to process any input information)
static binding requires iteration/recursion (we can't recurse without being able to process inputs)

perhaps what we need is a way for actors to process their insertions, without using recursion

### Static Insertion Processing

actually, `pick_one` doesn't require recursion or iteration
if `_insertions` was just a non-deterministic linked list structure
with a pre-defined address for `next` and `value`
we can just do `_insertions.value` to get the first item
if we want to implement `collapse()`, we can check `_insertions.next`,
    and make sure it's undefined, to ensure that there is only one item in the list

in this case, static bindings / static inputs because a static operation
doesn't require iteration or recursion, which are dynamic, turing-complete operations
this way, we can _build_ recursion on top of static bindings

it still feels a bit ugly, since, we first parse the first k items of the `_insertions` list to implement static binding
and then using that, we can implement recursion
which we can then use to parse the entire `_insertions` list


though i guess in a sense it can be kinda cool
we can think of _insertions as some weird non-deterministic moshpit of insertions that stabilizes into an ordered list
(kinda like if we mashed a bunch of protons and neutrons together, eventually they might stabilize and order themselves into a single atom)
and while the surface of this structure can be understood by an individual actor
the complex structure in its entirety can only be understood using a _group_ of actors


so we have this concept of **static insertion processing**
can't use recursion, so we can't use the functional syntax we were using before
    see section "Insertions Iteration Exploration"
instead, we have to use keywords
but we can actually do it using a single keyword

        foo:
            x: _next   // new non-deterministic iteration, retrieves first item
            y: x._next // retrieves next item in iteration

            z: _next   // new non-deterministic iteration, retrieves first item

actually we can't do `collapse()`
since that requires a conditional
and conditionals are function calls, which requires a mechanism for parsing inputs (which we are trying to implement)

but we can use `pick_one` if we know that we are only inserting one item

        _foo:
            initializer:
                pick_one: _next
            ...

        _foo.initializer <: (hello: "world")

notice that we make `_foo` private, so that we are the only ones that can insert into it,
thus we can ensure that there is only one insertion 

so now that we can pass in inputs and parse them
unfortunately, due to non-determinism, we can't simply parse multiple inputs like `a: _next, b: a._next, c: b._next`
(we have no idea what order the inputs will come)
instead, for multiple args, we have to do

        _foo:
            a: (pick_one: _next)
            b: (pick_one: _next)
            c: (pick_one: _next)
        _foo.a <: arg1
        _foo.b <: arg2
        _foo.c <: arg3


now how do we implement recursion?
well now it's rather trivial, if not a bit convoluted

        factorial:
            num: (pick_one: _next)
            self: (pick_one: _next)
            recurse: spawn{self}
            if (num > 0):
                recurse.num <: num-1
                recurse.self <: self
                => num * recurse->
            else:
                => 1


problem, trueBranch in conditional needs `recurse`, `num`, and `self`
so it actually needs to be custom conditional that can parse 3 arguments



can't use _next because within recursion, its now a new object
we use iterator, and `next` and `value` instead?


what if we only had pick_one
and we implemented order from that, probabilistic
we explored this previously
see section "Implementing pick_one (or pick_first) for ordered values"


### Other Actor Models and Non-deterministic Iteration

now that i think about it
this shift from un-ordered sets
to non-deterministic iteration
makes Firefly more similar to other actor model languages

because most actor model languages respond to each message individually
but the order at which each message arrives is non-deterministic
so it's basically the same as non-deterministic iteration

how do other languages handle input processing?
well most other actor models allow for mutation/assignment
you can do something like

        onMessage(x) {
            this.sum += x
        }

so it's essentially a reduce operation, a reduction

though in a sense it's cleaner than what I have
because my method of handling insertions,
    relies on exposing a linked-list that can only be iterated across using recursion and multiple actors
whereas using a reduction, means that it's all contained within the actor

though wait, reductions require recursion
how do they handle the circular logic issue i had,
    where passing inputs required recursion and recursion required passing inputs?
well mutation/assignment doesn't require recursion
and as long as there's only one message, then there's only one mutation, so it's essentially like pick_one


### How Smalltalk Handles Insertions

was looking into how smalltalk defines its actors

all behavior is defined with respect to a single message/insertion
no new actors are created
instead of recursion, sends messages to itself

whereas in my language
i try to separate actor behavior from insertions

which makes it ugly
how can i parse insertions without creating new behaviors?

this is all partially due to my separation between property access, and spawning behavior
in functional these are the same thing, property access is implemented using functions
in smalltalk, it's also the same, property access is implemented using message passing

but in my language, you can read properties without sending messages

in addition, in smalltalk, all messages have a response
whereas in my language, you can send a message without looking for a response
and you can read properties without sending messages

thus, in my language you can do stuff like

        square: input >>
            output: input * input

which is behavior defined without any insertions
which is why my language is kinda forced to separate actor behavior from insertions

it all stems from my decision to try and separate property access from insertions/spawning
though there is one major difference between my property access, and using message passing / function calls for property access
Firefly property access is _anonymous_
whereas in smalltalk, actors could change state based on messages



in smalltalk, how would you do something like

    scaledSum: multiplier >>
        => multiplier * sum(_insertions)

we need a behavior that triggers once for `multiplier`, but then multiple times for each insertion...
simple, we send a single message for `multiplier`, and multiple messages for insertions

```js
    scaledSum = (item, aggregator) => {
        if (item.type == 'multiplier')
            return item*aggregator
        else
            return aggregator+item
    }
```

(note that I am using a javascript reduction function to represent a smalltalk actor)

though we also need it to occur in a certain order right?
no, we can leverage the fact that smalltalk actors have internal state,
which is separate from the response of each insertion

```js
class ScaledSum {
    multiplier = null
    sum = 0

    onInsertion(item) {
        if (item.type == 'multiplier')
            this.multiplier = item
        else
            this.sum = this.sum + item

        return this.multiplier * this.sum
    }
}
```

### Handling Insertions Using a Reduction

smalltalk method
where no new actors created
feels centralized
every actor is like a factory, a silo
that generates a specific behavior for each message

in a sense though, we are also creating an actor for each message
since we are using a linked-list to store all insertions
but all data-structures in our language are made up of actors
so every item in that linked list is an actor


could we use the same method?
we could
every actor is a reduction across insertions
so for the `ScaledSum` example in the previous section, we would do

        ScaledSum: >>
            multiplier: item.type == 'multiplier' ? item.val : prev.multiplier
            sum: item.type != 'multiplier' ? prev.sum + item.val : prev.sum
            result: multiplier * sum

where the body of the actor represents a single step in the reduction,
and the special keywords `item` and `prev` refer to one insertion and the previous step respectively

we can still spawn actors, do prop access
and it's actually quite clean

note that instead of giving a response for each insertion, like smalltalk
other actors can simply read the current state of the actor


using a reduction as the base form
it's similar to how
we were using "pick k" before
and then recursion
I was looking for a non-turing complete method for parsing insertions

and in fact, a reduction is an example
it's basically a state machine
and state machines are not turing complete, but they can still process dynamic lists

### Handling Insertions Using a Reduction II

so should we use reduction to handle insertions?
well one problem
now we have reductions and spawning
but both are simply ways of representing/creating behavior

in smalltalk, all behavior is created through reductions
there is no spawning
in fact, there is a 1-to-1 relationship between messages and behaviors
every message creates a new behavior
and every behavior corresponds to a message

however, we don't have that 1-to-1 relationship
because we have anonymous reads
in firefly, anybody can iterate on a public linked list
and they would be creating behaviors, without doing any insertions

though i think the best way for us to handle it
is to just use an internal linked list for _insertions
keep it consistent


in firefly, spawning is manual, like a function call
    distinct from insertions, unlike smalltalk
thus, to keep it consistent
makes sense to use a data structure for _insertions
that you can read from and manually spawn behavior if you want to


### Superposition Values

recall that we can't just use a keyword, like `next` to retrieve the next value in the _insertions list
because we have to traverse using recursion, so spawned child actors have to be able to access the list as well

maybe we can have a non-deterministic address value
where `_insertions` corresponds to a single address within the actor
a superposition of all insertions for that actor
and every time you read from it, it returns one of those insertions at random

for `pick_one`, this works perfectly, since if you only insert one item, then you'll always get back that item
deterministic
so can be easily used for static bindings and passing inputs

also, since the superposition is stored at an address just like any other property
it can be accessed and read by spawned child actors
so it can be leveraged to convert the superposition into a linked list
just do a recursion, that keeps pulling a random values till it finds one that isn't already in the linked list,
and append it to the list
we explored this idea before
// TODO: FIND REFERENCED SECTION


tho it feels weird to have two types of values
a regular property definition, with a single value
and a non-deterministic property, with multiple values


what if all properties worked this way
every property definition, is just an actor inserting a value to an address

tho then we couldn't prevent bad actors from modifying any property they could read/access

somehow we need a way of only allowing one actor (aka the one "defining" the property) to insert
while everybody else can only read/access


also, when converting the superposition to a linked list
how would we know when we are finished?

also, recall that we allow duplicates in _insertions
but how would we handle this in a superposition?
there would be no way of telling whether you retrieved a two items that look the same, or just the same item twice

### React Server-Side Rendering and the Problem with Javascript Async

ran into issue with react server-side rendering (SSR)
normally when using react SSR
you pre-fetch all data used in your components
and then you do a single render pass and capture the markup into a static html string
pass it to the client, so that they can immediately see the webpage
while in the background (on client-side), you re-generate the component tree and "hydrate" the static html,
hooking the component tree to the html so it becomes dynamic

one of the annoying things about pre-fetching is
if any component adds / removes a data dependency
that change has to be reflected in the pre-fetching code as well
eg if component `Foo` now depends on `bar`, we have to modify the pre-fetching code to retrieve `bar`

in addition, every webpage that includes `Foo`, has to add Foo's dependencies to their pre-fetchers
which makes it annoying to quickly swap out components on webpages

i wanted to make lazy loading
basically, each component just has a method `get()`
that they use to request data
during the server-side render pass, while build the component tree, each component fetches whatever data they need
this way, there is no pre-fetching code

this way, components are decentralized
there is no central pre-fetching code, that needs to be modified every time we swap out components
we can mix and match components on a page however we please
individual components can be worked on by separate teams,
and they don't need to communicate their dependencies with eachother, or with a central pre-fetcher



however react SSR uses a function `renderToString`
and it's synchronous
whereas most data fetching requests are asynchronous
so it's actually impossible to achieve what I wanted
since if the `renderToString` initial render contains any async data requests,
the initial render will finish before those requests resolve


i realized the issue is actually with javascript
async code is like a virus
all you need is one async call
and it spreads throughout the entire function stack, making the top level function asynchronous

in this case, it allows a 3rd-party library, react SSR, to dictate how my program should run

let's say i have a function `getUser()`
it's asynchronous because when run from the client-side, it needs to make an ajax call
however, when run from the server side, it is extremely fast
even so, react SSR won't let me use it within my component initial rendering
because it's async

I could even add a timeout `setTimeout(cancelGetUser, 300)`
and now the call is guaranteed to resolve in 300 milliseconds
still, since `setTimeout` itself is an async call, the procedure still has to follow Javascript's async patterns
and react SSR won't allow it

one can argue that the purpose is to ensure that the SSR doesn't block for too long
and it's not like synchronous code can't block either
we can just as easily introduce an infinite loop, and block sync code as well

the issue is that, an async block of code can have any duration
it can be 2 minutes, or 2 milliseconds
if I know that it's 2 milliseconds, shouldn't I be able to treat it as synchronous?
but javascript doesn't allow mechanisms to turn async to sync code

perhaps whoever wrote react SSR thinks that async code is generally 10 seconds long, which is too long
so they don't allow async code during the initial pass
but then maybe whoever wrote `getUser()` thinks that 1ms is too long for sync code, so they made it async
because these two authors had different ideas on how long constitutes "async"
and the line between async and sync
now those two libraries are incompatible

which ultimately takes power away from the programmer

there are plenty of ways I can ensure that all my async calls resolve within 1ms on the SSR
eg doing test renders, checking what async calls are made, and then pre-fetching that data before the SSR
I build and check the system, I can make those guarantees
I should be able to decide 

in fact, perhaps the issue isn't that react SSR expects sync code
perhaps the issue is that `getUser()` is async
which is pretty much the same issue, because often 3rd party frameworks like fetching from MongoDB, uses async functions
even if I can guarantee that it happens so fast that it should be sync
but if a function is async, it heavily restricts what I can do with them


i found that issue is actually still in open discussion on github
https://github.com/facebook/react/issues/1739

one of the issues that was brought up was
normally, if a request is async, then shouldn't the user be shown a loader/spinner while the request is processing?
and if so, then wouldn't the initial render pass for the SSR, just show a loader/spinner?

i could solve this by having `get` behave differently if it's called from server or client
on client, it uses an ajax call (and maybe shows a spinner)
on server, it blocks the render, and waits for the request to finish
I say "maybe show a spinner" because in some cases,
    we can guarantee that the client will always have certain pieces of data
so that the client will never need to fetch it dynamically
so we don't actually have to add the loader/spinner logic
we only have to add it for data that the client _might_ fetch lazily, eg lazy-loaded components

does this break isomorphic rendering?
sort of,
because while the fetch is happening differently based on if it's on client vs server
the fetch is abstracted away from the front-end code
so from the front-end developer's perspective, it is isomorphic



how does functional handle this
because in functional, technically everything is asynchronous, right?
well functional doesn't really handle persistent apps well
so we should instead be looking at dataflow / data-flow


Firefly solves it in the same way


how can javascript solve this?
have a way to convert an async function to a sync function
`let result = toSync(asyncFunction())`

right now, it's trivial to turn a sync function to an async one
use `setTimeout`
so we naturally should have the opposite

### Defining the Template Format II

* for our revised template model
* for every actor/template, we need to specify an address for `next` and `val`
* these addresses will be used for the actor's linked-list of insertions
* and will likewise be used by others who want to iterate through those insertions

* basically the same as static binding, where the transformation step will generate an address and give it to parent and child
  * // TODO: FIND REFERENCED SECTION
* except in this case, these address bindings are special, and tell the actor how to structure its internal insertions list

```js
const template = {
    'addr_255': { type: 'access', source: 'addr_101', address: 'addr_751' }, // equivalent to `this[addr_255] = this[addr_101].[addr_751]`
    'addr_231': { type: 'spawn', source: 'addr_255' },                       // equivalent to `this[addr_231] = spawn(this[addr_255])
    insertions: [
        { source: 'addr_509', target: 'addr_999' },                          // equivalent to `this[addr_999] <: this[addr_509]`
    ],
    'addr_131': { type: 'insertions_next'},  // the address for retrieving the next node in the insertions iterator
    'addr_132': { type: 'insertions_value'}, // the address for retrieving the value at the current node in the insertions iterator
}
```

### Undefined as a Primitive

(continued from section "undefined as a type or a primitive?")

* should `undefined` be a primitive
* or can we make it an actor?
* if it's a primitive, then we have two primitives: actors and undefined
* so ideally it would be an actor so we would only have one primitive across the entire language

* how do other languages handle it?
* well pure functional languages only have one datatype
* functions
* every function returns another function, that's it

* how do other actor languages handle it?
* it seems like smalltalk has only one primitive: actors
* while the actors communicate via messages, the messages aren't really a datatype on their own
* they are more just a format for communication
* kind of like how functional langs need a way of passing arguments to other functions

* why doesn't smalltalk need `undefined`?
* well smalltalk doesn't have a primitive concept of property access / reads like Firefly does
* it's more like functional, where you define a response for every message
* so every response is defined

* Firefly has reads though
* and addresses that aren't defined, have to return undefined right?


* what if property access was functional
  * previously explored in sections "Dynamic Properties - Finite Objects with Infinite Properties?" and "Property Muxers"
* then an actor could define a default value to return

* we could easily define this at higher levels
* would be similar to how we define object-key access
  * see section "Functional Property Access - Implementing Property Access using Sandboxing and Equality" and
    "Double-Sided Property Access (The Bilateral Protocol)"
* we could have a special address for storing the "default value", eg address `456`
* and every time an actor tries to access a property on some object, and it returns undefined,
* then they check if the object has default value defined, and use that instead

* however, what about low-level reads
* can we have a default value built into the property access operation itself?

* remember, address access is a core part of the lang
* we need it to define how actors and functions work
* even the logic for a default value would involve a conditional
  * eg `if (key exist) return value else return default`
* circular
* we have to define property access before defining actors/functions
* so we can't use functions to define property access

* in addition, reads are anonymous
* the actor cannot know what address is being accessed
* and they can't modify their behavior based on what address is being accessed

* returning a default value
* the actor would have to know that the input key is not in the key space
* which would break anonymity

* thus, **`undefined` has to be a primitive**

### Operating on Undefined

(continued from prev section "Undefined as a Primitive")

* now that we know that `undefined` is a primitive
* since Firefly is dynamically typed, every primitive must be compatible with every operation
* thus, we have to define how it interacts with the core operators: insertion, spawn, and property access
* though it's actually quite simple

* any insertions to `undefined` have no effect
* accessing a property on `undefined` returns `undefined`
* spawning `undefined` returns `undefined`

------------------------------------------------------------------------

### fdsafdas

access is now static
at the core level

a static address

makes things a bit easier in the interpreter
since every binding only needs to monitor one source node

no need to unregister listeners anymore, except when de-spawning fireflies


### insertions is now either outbox or inbox

less confusing

eg we'll now use terms like "inbox iteration" and "inbox iterator"
    instead of _insertions iterator, like we used before


###  

firefly item type

feels a little ugly because
you can pass around this item type
so we have to define how operators work on this type as well

smalltalk keeps inbox processing internal
but we have to make it external
because we spawn slave actors to do the processing for us
recursion

required because
* actors can _proactively_ spawn other actors
* (compared to smalltalk, where behavior is spawned automatically from insertions)
* so the way we operate on inbox items is to proactively spawn from them
* instead of like in smalltalk, where behavior is spawned automatically

proactive spawning is important
because it allows an actor full control over the spawned child
full control over the environment
even if the actor has no idea what the template does, it can guarantee that the spawned child can't leak data to others
sandboxing
this is impossible in smalltalk, since each template is owned by a single actor and you spawn that behavior by sending data to the template owner
so you either have to trust that the template owner won't leak the data
or the template has to be open source so you can see that it doesn't leak the data
but in my model, the template can be a black box, and the spawner can still sandbox the result behavior


also if we just forced it, and allowed a reduction type definition within each actor
similarly would require two reserved words, `prev` and `item`, that the body of each reduction iteration would refer to


also, hard/impossible to send out an insertion only once in an actor
we could make it so it only sends one out for the first inbox item
but what if we want to send out the largest inbox item
eg

        foo: prev, item >>
            largestItem: Math.max(prev.largestItem, item)
            target <: this.largestItem

this would insert for every iteration

we would need a special syntax for only inserting once?


###


bindings are actually all static too
at least, the ones for spawn and access
they read from some address in the actor, either do a spawn or a prop access, and then put the result in another address
but those addresses are static
so the internal behavior of each actor is actually just a static network of bindings

well aside from the inbox linked-list / iterator
which is dynamic

