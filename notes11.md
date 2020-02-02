
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
Could we do the same for merging and mixins? The caller provides it's keylist to all objects being merged, so they know which properties are getting overriden, and which properties are carried over?
But then what if two objects try to carry over private properties with the same private key?

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

### Private Keys and Anonymous Reads

But reads should ideally be private (mentioned this before, //TODO: FIND REFERENCED SECTION)
So maybe, every time somebody makes a request, they actually retrieve a full copy of the object, and then privately try accessing the property on their own server
Or maybe it bundles the object into a single pure function, that when given a key, responds with the value, and has no side effects
And anybody can retrieve this function and read from it privately on their own machine


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

Using Core Functions instead of Javascript Transformations

instead of defining transformations in javascript
do it in the language itself
and compile it to functions, that are used in the AST
this was inspired by when I was browsing Nylo's source code and came across their std/base.ny (see commit d81d3eb368366c93eaae3973883c766d4b51829e)
though for Nylo it's just a standard library of functions
whereas I am using it for syntax transformations
for example, in Nylo to do a conditional you literally call the if() function
in my language, you would use the if (...) ... else ... syntax, but it gets transformed into a ifElse() function call
I might not even expose the ifElse() function to the public, and just use it during interpretation
but then, how do we transform scope and references?
use this
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
If we expose merge or combine as a global function
It would work the same
Just do something like

merge: mom, dad >>
  [key] => mom[key] != undefined ? mom[key] else dad[key]
Wait but then
Aren't mom and dad also properties of merge?
That you have to override to pass in args?
It's confusing because now we have two ways of defining properties, through the dynamic accessor and through the static property definition

We can only retrieve values from this  , so our input parents have to be put onto this before we can use them in the dynamic accessor
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
The new object has its own this value
And its own dynamic accessor
And all nodes cloned from the parent object
All will reference some this[key] 
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
Every cloned referenced has to reference this[key] to get the clone's value for each parameter
But if you used a dynamic accessor and did something like `[key] => 5` then all private properties would get overridden too
Though I guess it would work fine with the default property muxer
Since private properties of the parents won't ever collide

Imagine a rogue computer, that tries to merge an object Bob and Joe
It knows Bob and Joe share some private properties
So it uses default property muxer to combine Bob and Joe, giving Joe's properties precedence
And all nodes cloned from Bob, during rebinding, it will check this[key] to get the new value, calling the rogue's property accessor
And for the shared private properties, the property muxer will retrieve the value from Joe
And so the rogue computer is able to modify the private behavior, without having access to the key

Note: I will be using rebinding as the term for when the nodes of the new object are resolving their references, looking for if a value has been overridden or not

Maybe we should only allow dynamic properties for "external access"
That is, access from the outside of the object
So stuff like proxies, only need to route requests coming from outside, to the correct internal object
But requests coming from the object itself, eg from its own cloned behavior
Don't use the dynamic accessor
This prevents the security concerns mentioned above


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
Does the callee ask for which properties are being overridden
Or does the caller send over which properties are being overridden

Overriding is just one way of resolving merge conflicts
Recall that another method is to simply use overdefined for conflicts
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


So cloning is not actually a core operation
The three core operations are
Read, write, and mix
Mix: takes two objects, merges properties and uses overdefined on property collisions

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

Sets as a Primitive

maybe Sets are a primitive type
so we can use sets for property lists and such, and perform set operations
    and the iteration is handled in the interpreter
May seem ugly since it seems like a complex primitive (and primitives are usually simple)
And in functional, lists are not primitives, they are implemented
But it's kinda like how in turing machine
The turing machine tape is a "primitive" and a rather complex one at that

Sets are unordered
so how a set is traversed is up to the interpreter, but the language spec doesn't need to know about it
Already used by insertionsviewDiscussionLinkEx

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
// TODO: FIND REFERENCED SECTION
Since the callee could have behavior referencing properties that aren't defined yet
(eg sum: ( a b >> result: a+b), notice how a and b are like function args, not defined yet but the caller is meant to pass them in)
this is how function parameters often work

So maybe there is no choice but for the callee to ask the caller for values, instead of the caller sending them in
    // TODO: FIND REFERENCED SECTION
Along with all the security problems

Reference / Parameter Declaration

What if we declared all references / parameters
so in the earlier example sum: (a b >> result: a+b), a and b would be undefined, but would have a special undefined value, undefined parameter or something
thus, the caller could check and see that it needs to pass in values for a and b, even if they are private
Note that these declarations can still be private, since we aren't enumerating the private keys, just setting the value to something other than undefined
still seems a bit ugly that we are having this arbitrary special value though...

what if it's a dynamic reference?
eg foo: (key >> result: this[key])
now we don't know which property to declare as a parameter

Unless reference declaration was dynamic...?
so if we had this[a+b], we figure out what a+b is and declare that as a parameter
if a or b changes, then we re-calculate and declare the new parameter
so what about in the earlier example, with the dynamic key this[key], where key itself is a parameter
well first key will be declared as a parameter, and then when the caller provides key, then this[key] will get calculated and then declared as a parameter, and then the caller can provide this[key]
convergence

I guess this convergence could get arbitrarily long, if we have a chain of dynamic references depending on other dynamic references
eg a: this[b], b: this[c], c: this[d], ...
what if there was feedback?


Preventing Dynamic Access and Proxies using Encryption

We previously talked about a rogue computer using routing to proxy private variables that it doesn't know about
// TODO: FIND REFERENCED SECTION
But we can prevent this
Recall our discussions on anonymous reads
And capturing an object into a single function that is passed to the reader
// TODO: FIND REFERENCED SECTION

Well previously I thought that the rogue computer could simply retrieve the property access functions of it's victims (the objects it is proxying), wrap it in a property muxer, and then pass that to the reader
But if we instead forced every object to provide a property access object, a static piece of data that is simply encrypted
Then we can prevent proxying
For example, let's assume that we have a giant encrypted piece of data
And if you decrypt it using different keys, you will get the values for those keys
Now it's impossible for the rogue computer to encrypt and include the private properties that it can't access

// TODO: EXPLAIN THIS MORE


So we could prevent proxies and dynamic access in our language
Do we want to?


We need a clear and consistent spec of how we want privacy to work in our language

Note that even if we prevented proxies, we still can't guarantee that a property on an object is actually accessible by that object
The object could have inherited it


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


"Mixed private spaces", aka mixin where the parents each contribute private properties that the others are not aware of
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
what if we have x: ([key]: 5) ? isn't x now an infinite list? so if we did setFrom(x) we would have an infinite set?
can our mixin operator (which takes in a set of keys and set of objects) handle infinite sets?

recall how booleans are implemented in pure functional
how would we implement booleans using our mixin operator?

not hard:
TODO: SHOW PROOF

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
mentions that an actor should be able to respond to a message by spawning a finite number of actors
does not mention cloning, but does mention spawning

the wiki made me more confident that insertion isn't enough
we need a way to spawn actors
in addition, mixed responsibility is too complicated
only one parent actor for every spawned child actor
so what is the mechanism for spawning new actors?


what if actors had an "initializer" property
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

// TODO: Example with spawn3

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
or maybe the collector inserts into "spawnFactory"? (eg every time "spawnA" gets an insertion, it inserts the data into "spawnFactory" with the tag spawnA


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

// TODO: Explain more??

Not exactly free choice
As the person defining the child, ultimately gets to choose when the child exists or not
But it does group behavior more intuitively by making each child responsible for its own spawning behavior

Solves 3 problems
* Asymmetry of cloning
* Group behaviors for recursion
* Callee responsible, can choose not to clone/spawn

Spawning from Sets

Wait but
If we want to spawn the actor in a for loop

// Code example

This feels like the parent is spawning the children
Not the children spawning themselves

Well one way to think about it is
When we define objects normally, we are creating a single object that reads from single values around them
But sets are a primitive too
// TODO: FIND REFERENCES SECTION
So we can define a set of objects that read from a set of values

kinda reminds me of the "fan-out" operation I had in the diagram syntax

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
Sets and Loops instead of Recursion
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

Spawning vs Cloning: What does it Solve?

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

Consolidate actors and sets
Means you can use them interchangeably
Dynamic typing
Don't have to worry about which type it is
Dont have to worry about using insertion for some objects, and modifiers/mutations for others

In fact it could be dangerous to have insertions fail on objects, because it doesn't return anything, so there's no way to indicate an error

Actually when we implemented cloning using insertion
We needed custom insertion
Arguments objects are inserted
Only Visible to the callee

Almost the opposite of when we were trying to implement insert() using cloning
// TODO: FIND REFERENCED SECTION

Sets are the behavior of an object
Finite
Property accessor is how that behavior is mapped to the address space

However, sets and objects are used in completely different ways
You can use the map operator on sets, but not objects
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
How would we make it so you can map across mycollector directly?


A note about keysets and valuesets
They have to be declared
Not generated
Since declaring them declared what keys are public
Implementing Scope using Spawning



Implementing Scope using Cloning - Circular
i was re-visiting about how we implemented scope using cloning
and I found a contradiction

1. scope is implemented using cloning (an external template is cloned with the scope passed in as an arg)
  1. // TODO: FIND REFERENCED SECTION
2. scope has to be passed in as a private argument
3. all references are transformed to property access on this
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

note that we can't even use Array.includes(), we have to use Array.some(), because we have a custom comparator function
which leads to some very unintuitive code
in a typed language with polymorphism, we could re-use includes() with a Comparator as the argument, and it could automatically switch to using the comparator version of the includes() function
in essence, typed languages are slightly more expressive because they can use the same function name to capture multiple different behaviors
instead of being forced to re-name the function every time you want to handle a different type of argument

in Firefly, perhaps we can allow nicknames, which are more like workspace settings
adds a * to the end of the name to show that it's just a nickname, eg filtered.includes*(el => el.id === item.id)
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
Mix example
Key transform (take your key and +1)
Value transform

Secure computation
You can run code without knowing what it does
Almost like cloning, since the callee gives you the code to run


Firewalls
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

Standard functions like forEach or Map
Surely those can be run by the caller themselves



Sort of like javascript eval()
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





Inheritance
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




Sandboxing and Publishing
A better name instead of firewalling
Instead of the callee flagging itself as "copy-supported", the caller can copy any object they want
And it copies whatever behavior it can see
You use the keyword sandbox do to a copy



Callee still has to flag it
To obfuscate the behavior before making it public

Does three things:
Obfuscates all private behavior within the scope
Declares all keys for all behavior
Sets a flag indicating that it is "published", and anybody who wants to use it has to copy it and execute it themselves


now when somebody copies it, they can be sure that it's not making any outside calls
Because due to how scoping works, any external references are accessed via this 
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

Technically bar is already obfuscated, because the key is private and generated and will probably look like some random string of digits like 8103573927492
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
Why not have some protocol to resolve conflicts? Eg using overdefined?
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

### Set_spawn Restricted to Self Insertions

instead of the following:

```
someCollection
foo:
    for x in someCollection   // set_spawn off a public collection
        bar: x*x
        anotherCollection <: bar
```

can we design it so each actor can only set_spawn once, off of the actor's internal insertions?

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


could you leverage this to mimic nested set_spawns?
for example, could you replicate the following javascript behavior?

```js
for (var i = 0; i < array1; i++) {
    for (j = 0; j < array2; j++) {
        console.log(i + ',' + j);
    }
}
```
