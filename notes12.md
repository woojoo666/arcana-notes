
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

### access bindings are static

* access is now static
* at the core level (lumino)

* a static address
* instead of a dynamic object-key

* makes things a bit easier in the interpreter
* since every binding (access, spawn, insertion) only needs to monitor one source node

* no need to re-assign listeners anymore, like we had to in the `MemberAccessNode` in the old interpreter
  * see `MemberAccessNode.updateTarget()` in `interpreter/interpreter.js` at commit 4e3461941c03041ca492ade12cd7bd4df16c1ac2

### insertions is now either outbox or inbox

using the terminology "insertions" is a bit confusing sometimes
eg if I say "Foo's insertions", does that mean the insertions that Foo is sending or receiving?
thus, to make it less confusing,
we'll sometimes refer to insertions as"inbox items" or "outbox items"

eg we'll now use terms like "inbox iteration" and "inbox iterator"
    instead of _insertions iterator, like we used before


###  Handling Insertions Using a Reduction III

lumino inbox item actor (see `InboxItem` in `lumino.js`)

* feels a little ugly because
* it's an actor that can be passed around just like regular actors and UNDEFINED
* so we have to define how operators work on this type as well

* smalltalk keeps inbox processing internal
* but we make it external
* because we spawn slave actors to do the processing for us
* using recursion

however this is unavoidable because
* actors can _proactively_ spawn other actors
* (compared to smalltalk, where behavior is spawned automatically from insertions)
* so the way we operate on inbox items is to proactively spawn from them
* instead of like in smalltalk, where behavior is spawned automatically

* proactive spawning is important
* because it allows an actor full control over the spawned child
* full control over the environment
* even if the actor has no idea what the template does, it can guarantee that the spawned child can't leak data to others
* sandboxing
* this is impossible in smalltalk, since each template is owned by a single actor
  and you spawn that behavior by sending data to the template owner
* so you either have to trust that the template owner won't leak the data
* or the template has to be open source so you can see that it doesn't leak the data
* but in my model, the template can be a black box, and the spawner can still sandbox the result behavior


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


### Lumino Exploration - Access and Spawn bindings are Static

(in this section I reference the pub-sub mechanisms that I use in the `lumino.js` interpreter.
These "bindings" are objects I use to store values and propagate changes throughout the network)


* bindings are actually all static too
* at least, the ones for spawn and access
* they read from some address in the actor, either do a spawn or a prop access, and then put the result in another address
* but those addresses are static
* so the internal behavior of each actor is actually just a static network of bindings

* well aside from the inbox linked-list / iterator
* which is dynamic

### Lumino Exploration - insertion binding

currently we have two binding classes and one actor class just for handling insertions

all this really is just to handle dynamic bindings that point to external actors

i considered re-using spawn bindings and storing next-item actors onto an address
and if i need to re-bind, change the address in the template, and then re-spawn
but that would also trigger any listeners attached to the inbox_value


one type of binding is for the insertion, whether or not the insertion exists
and the other type is for the insertion value
so if the insertion moves or gets destructed, the first binding gets triggered
if the insertion value changes, the second binding gets triggered

actually we may need to split insertion binding into two parts
1. binding to the target
2. binding to the source
because we need to listen to when the target changes (so we can remove our insertion from old target, and add insertion to new target)
and also when the source changes (tell the current target that the source value changed)

so actually we may need three types of bindings just for handling insertion:
1. one is for the target actor
2. one is for the source value
3. one is for existence

another thing to notice
spawn and access bindings are completely internal
insertion bindings and next-item bindings are the only bindings that go between actors


### Handling Insertions Using a Reduction IV

even with reduction
you are technically creating a new actor for every insertion
since in a reactive language like mine
you would have to keep every step in the reduction "alive"
in case, say, the first insertion changes
that change has to ripple through the entire reduction

### Lumino Exploration - insertion binding II

actually i think i'm thinking about insertion bindings wrong
it's true that we need to listen to when the target and source change
but actually, there are already bindings there that notify us of those changes
the target address should already contain a `Binding` object
and the source address too
so we first figure out what actor the target points to, and then insert to it the value at the source
in other words, we evaluate the `Binding` at the target address, get the actor, and then take the `Binding` at the source address and insert it into the actor
then we subscribe to the target address, so that if the target ever changes,
    we remove our insertion from the previous target and send it to the new target
since we are sending the source `Binding` to the target, the target can directly subscribe to when the source value changes

### Lumino Exploration - insertion binding III

* something I noticed
* right now at every address we store a `Binding` object
* but then we also have `Binding` objects subscribe to changes in other `Binding` objects
* as if we are binding bindings together
* weird naming!!

* in our old interpreter (see `interpreter.js`), we simply called these pub-sub objects `Node` objects
* but I kinda wanted to avoid that naming because the difference between an `Actor` and a `Node` can get confusing
* but at the same time, this `Binding` naming is just as bad...

* so I think we should just go back to calling them `Node`s


* however, it did make me notice something
* recall that in Firefly, every address stores either a value or a "virtual object"
    * see section "An Address for Every Value - Referenced Objects"
* and looking at the current implementation of lumino, it seems like every address stores a Node object
* so conversly, should every Node be stored at an address?
* eg insertions require a pub-sub mechanism, should they also be stored at addresses?

* actually insertions already have a Node that can be stored, the Inbox Item actor
* but actually, remember that Nodes and actors are different
* nodes are merely carriers for actors
* they just handle the pub-sub mechanism
* eg the spawn node subscribes to the value at the source address, and spawns the current value there,
  and returns the resulting actor

* so likewise, we just need a node that subscribes to the insertion target,
  spawns an inbox item actor from the insertion source, and gives it to the target

* this is pretty much what we had before, but now, instead of the Inbox Item actor being created by the target,
  we now create it in the insertion Node

* we still need one more
* nextitem node
* actually maybe this one is responsible for creating the inbox item actor

* actually instead of calling it InboxItem actor and NextItem node
* i think i'll call it OrderingActor and OrderingNode
* its a little more abstract, and feels less hacky

* actually we can make the base actor class support OrderingNodes and InsertionBindings
* and that way we don't need OrderingActors anymore
* we can just use regular actors for inbox items


* I need to formalize how these node bindings work a little more
* every node:
  * watches another node (the "subject")
  * computes a watch function on the subject node
  * if the watch function return value changes, triggers some behavior
  * then notifies all subscribers

* unlike the previous interpreter implementation,
* not every node has an output "value"
* some nodes just execute behavior when the subject changes,
* eg insertion nodes, which re-bind the target  


### Handling Undefined

* how to handle undefined
* like, somebody using the inbox iterator
* how would they know they reached the end
* they would need to be able to check if the next item is undefined

* but how do we check for undefined?
* and how would we specify something like `if (x is undefined) do y`
* do we have a special property in `undefined` that has a conditional
* eg

        undefined:
            ifUndefined: fn >>
                fn()

        x.ifUndefined(doSomething)   // will execute doSomething if x is undefined

* but notice how special this makes `undefined`
* just declaring an empty object, eg `x: ()`, is not the same as undefined
* even though from the outside, it may look the same (doesn't have properties, doesn't respond to insertions)

* this is different from how functional languages work
* where anything would be able to "act" like undefined
* there is no referential equality
* eg anything could act like the boolean `true`
    * aka in pure functional notation, `True: (trueBranch, falseBranch) => trueBranch())`
* if they simply acted the same way


* recall how functional languages handle linked-lists
* (see `PureFunctionalDataStructures.js` for a refresher)  
* the linked-list data structure is actually a function
* and you have to _call_ the function with two behaviors,
    * one behavior for if the list has more items, and one for if the list is empty

* in a sense, you pass control to the linked-list
* because only the linked-list knows whether or not they are empty or not

* whereas in my model, since you can read from the linked-list directly
* you have control
* and thus, it's your responsibility to figure out whether you have reached the end of the list
* likewise, it's your responsibility to figure out if a value is undefined or not

### Anonymous Reads and Data Persistence Networks

* previously I mentioned that anonymous reads are important
* so that readers don't "leak" their private keys to the object being read
* see section "Private Keys and Anonymous Reads, Property Bundles"

* but there's actually another reason why I believe anonymous reads are important
* that I realize I haven't mentioned yet
* I believe that nobody can and should be able to "control" the sharing of information
* eg like what snapchat tries to do, making a picture/video only available once

* anybody can simulate anonymous reads using a decentralized P2P network
* so even if you tried to only allow one person to read some data
* that person can share it to the p2p network, and now everybody has access
* with snapchat, somebody could just record their screen, and now they have a downloaded copy that they can share with whoever they wish
* so trying to control the sharing of information is futile
* so anonymous reads is natural, inevitable

* I call this model a **data persistence network**
* since all data in this network is persistent and available (as long as you have the private key)


* so how does this connect to handling undefined, "passing control", and pure functional languages?
* what if we modeled this p2p network in a pure functional language
* what would `undefined` be like?
* hmm

### Impersonating Undefined, Conditional Branching for Undefined/Defined

* technically something could act like undefined
* if they defined that same special property right?
* the `ifUndefined` property


* is a special property enough though?
* sure, you could make it so `undefined` has a special `ifUndefined` function stored in a special property
* and then you give it two args, `x(doIfDefined, doIfUndefined)`
* but this needs to work for defined objects too
* but say somebody just passed you an empty object, `x: ()`
* now what can you do?
* you need to make this empty object execute the `doIfDefined` template
* but how can you make this empty object "execute" behavior?

* actually we can leverage the fact that `undefined` is a default value
* we check some arbitrary address, eg `addr_777`
* and we make sure that the `undefined` primitive doesn't have anything
* so it will always return `undefined` at that address
* and now we are sure we have `undefined`, and we retrieve the `ifUndefined` function from it

* in a sense, we are making things _explicitly undefined_
* empty objects actually aren't the same as `undefined`
* in order to be considered `undefined`, it has to follow the same rules
* eg have the `ifUndefined` property, and also have nothing at address `addr_777`


* wait this isn't enough
* what if bad actor overrides the value at that arbitrary address, `addr_777`
* and puts empty object
* ultimately we are back to square one



* functional actually has same problem
* if you have some variable `x` of unknown type
* it's easy to execute behavior based on equality
* eg if you are checking if `x is true`, you simply implement the functionality in `true`
    * and then do `true(x)`
* but how would you execute behavior based on inequality?
* you pass control over to `x` and you have no idea what it will do

### Checking for End of List

* note that for linked-list though
    * which is where this discussion started, see section "Handling Undefined"
* we don't need to execute behavior at the end
* we need to _not_ execute behavior at the end
* and that is easier
* since we define secret `addr_next` and `addr_val` addresses used in the linked list
* bad actors can't impersonate and set those addresses (since they don't know them)
* thus, for every inbox item, we create a secret address `addr_execute` where store a function
  that just executes whatever template is given to it
* and during iteration, we pass our recursive template to `addr_execute` to iterate to the next inbox item
* and for the last inbox item, `addr_execute` will be undefined, so nothing will happen

### Combining Equality Check and Undefined Check

* actually we can combine equality with ifUndefined
* to kinda get what we want
* if we have some object `x`
* we create a hidden property at `addr_777`
* that executes whatever function is given to it, an "executor"
    * `addr_777: x => x()`
* so if we ever are given an unknown `input` object and we want to check it against `x`
* aka we want to do `if (input = x) trueBranch else falseBranch`
* then we get the value at `addr_777`, and then
1. we assume it is an "executor", so we call it with `trueBranch`
    * if `input` happened to be `x`, then `trueBranch` will be executed
    * if `input` was not `x`, then nothing will happen
2. we assume it is `undefined`, and we retrieve the `ifUndefined` property and call it with `falseBranch`
    * if `input` happened to be `x`, then the `ifUndefined` property wouldn't exist, so nothing happens
    * if `input` was not `x`, then `addr_777` is undefined, and `falseBranch` will get executed
* so notice how, by doing both (1) and (2) at the same time, we are guaranteed that either `trueBranch`
  will get executed or `falseBranch`


* this only works if we know the hidden property though
* but what about a generalized case
* where we want to check if the input `inputA` is equal to another input `inputB`
* we don't know how `inputA` or `inputB` implement isEquals()
* we don't know what hidden properties they use
* but we to trust that `inputA.isEquals(inputB)` returns a boolean (??)

### Impersonating Booleans

* the problem is booleans are public definitions
* anybody can impersonate a boolean
* so back to square one
* we can't trust whatever is returned from `isEquals()`
* `x` has full control over what is returned from `x.isEquals()`
* it could be a boolean, an empty object, undefined, or something else entirely

* also, even if they spawned the behavior you want
* what if they spanwed it multiple times?

* what if we leveraged insertion
* so you give `x` some behavior `ifDefined`
* and when `ifDefined` is spawned, it inserts into your private collector `mCollector`
* and `mCollector` takes the first insertion and spawns it
* you also give `mCollector` your function `ifUndefined`
* and if `mCollector` has no insertions, aka if the first insertion is `undefined`, it calls `ifUndefined`

* however, what if `x` doesn't allow outgoing insertions
* sandboxes the spawn
* well that's pretty much the same as `x` behaving like `undefined`
* though `x` could choose to allow certain outgoing insertions, and not allow others
* which is weird, we don't want that

* instead, we make `x` return a template
* that _we_ can sandbox
* and only send in the collector
* we know the return result should be a boolean ish


* functional seems to have all the same problems
* can functional handle complete isolation in a trustless environment?
* if you have a third party api like `fn()`
* and it tells you that it returns a boolean
* you can't trust it
* and it might not actually act like a boolean
* though it is a bit more safe since you don't have to worry about side effects
* you can call it without worrying about leaking info

### Normalizing Inputs and Type Coercion

* what i am basically trying to achieve

```js
if (input)
    trueBranch()
else
    falseBranch()
```

* this works in javascript because type coercion
* doesn't matter what `input` is, either `trueBranch` will be called once or `falseBranch` will be called once


* looking for some way to normalize the input
* coercion


* what do i want
* some function `coerce()` that lets me treat some generic fn `fn()` as a boolean
* so `coerce(fn)(trueBranch, falseBranch)`
* should guarantee that either trueBranch is called once or falseBranch is called once
* depending on fn


* well i guess number of times trueBranch and falseBranch are called don't really matter in functional
* since no side effects
* but the problem is that you can't guarantee that the output of `coerce(fn)(trueBranch, falseBranch)` is
* either the output of `trueBranch` or the output of `falseBranch`


* you can't even check the output of `coerce(fn)(trueBranch, falseBranch)`
* and try to do something like

        result: coerce(fn)(trueBranch, falseBranch)
        if (result != true || result != false)
            return false

* because again, `result` can be anything
* so checking `(result != true || result != false)` runs into the same problem

### Normalizing Inputs and Type Coercion - Memory as a Static Type

* in functional, the only way to gain information about something
* is to call it
* eg, for a boolean, to run conditional logic based on the boolean
* you have to call the boolean as a function
* thus, if you want to "coerce" an input into a boolean value
* you have to call the input (and give it the boolean values you want to coerce it into, True and False)
* but that gives the input the power to return whatever it wants
* and then you're back to square one


* the reason why it works in imperative languages
* is because the memory model acts as a "static type"
* even in dynamically typed languages
* if some API returns some unknown value
* you can still check if it is undefined
* because you can check its byte value in memory
* byte value is basically a "type", a shared protocol for communicating/understanding data

* in pure functional or lambda calculus, there are no shared protocols
* you have to construct them

* in Firefly, luckily, we do have a shared protocol
* the address system

### Coercing Defined/Undefined to a Boolean

* so how do we do type coercion in Firefly?
* how do we create some function `coerce()` that is guaranteed to either return `true` or `false`
* when anybody can impersonate booleans?
    * since they are public definitions, as mentioned earlier

* well we can define `true` to have a hidden executor
* and use the method explored earlier?? for equality?, eg just check `if (input == true)`
  * see section "Combining Equality Check and Undefined Check"
* but what about impersonation

* but this doesn't cover checking for defined
* implementing `if (input) doIfDefined else doIfUndefined`


* actually, we can "create our own booleans"
* instead of defining `undefined` to have a hidden executor
* we use a hidden "mirror", identity function

        undefined:
            ifUndefined: x => x

* then, any time we want to check if defined/undefined
* we create an object with a hidden executor, stored at an address that we randomly generate

        testObject:
            addr_248: x => x()

* then, we give this testObject to `input.ifUndefined`
* if `input` is undefined, we will get the testObject back
* so if we check `addr_248`, it will return an executor
* otherwise, if we don't get testObject back, then when we check `addr_248`, we will get `undefined`

* since `addr_248` was randomly generated
* very unlikely to be defined
* so we can assume that the return value is `undefined`


* (note that we explored "mirror" objects in the section "Address Objects")

### Iteration across Superposition Values

(continued from section "Superposition Values")

* was exploring superposition values again
* and had an idea

* instead of returning a random order and iterating along that order
* we return a superposition of _all_ orders
* and iterate across _all_ orders
* and this way, guaranteed order doesn't matter
* since all orders are being executed at the same time

* we can collapse too
* in case we do something that inserts
* and now, instead of inserting once, it inserted an exponential amount of times
* but we can design it so it gets collapsed?

### Checking for End of List II

* earlier in section "Checking for End of List" we talked about how we can check for the end of the inbox item list
* by adding a special property `addr_execute`
* but this is starting to feel like we are bloating the Inbox Item actor

* in fact, this is not necessary
* we can define the `ifUndefined` function/template within `Undefined` itself

* so every actor is only responsible for creating a linked-list for the inbox items
* it's up to the user to iterate through the linked-list using recursion and conditionals


* note that it's possible to achieve much functionality without iterating through insertions
* eg an executor function, that just executes the first insertion

        executeFirstInsertion:
            result: spawn{_inbox._next}

* does not require any recursion or any conditionals / undefined checking

### Reserved Addresses

* addr_0 reserved for undefined (the `ifUndefined` function)
* addr_1 reserved for function return

### Global vs Local Undefined

* `undefined` now has to have this special `isUndefined` property
* where we store a mirror / identity function
* also feels sort of arbitrary

* if `undefined` is just a default return value for the read operation
* then maybe every actor can specify their own default return value
* note that the _reader_ is specifying the default, not the _readee_
* because recall that the readee should have no idea that they are being read (anonymous reads)
* so it's up to the reader to say "oh, I can't find a value at this address, i'll just use the default value"

* if every actor defines their own default value
* this also gives every actor the freedom to store the `isUndefined` identity function
* in their own secret address
* so it's impossible to impersonate
* and it makes it easier for each actor to check if the result was `undefined`
* without worrying about complex protocols like the one mentioned in "Coercing Defined/Undefined to a Boolean"
    * that is mainly needed to handle impersonators

* though it also means that `undefined` can't be passed around right?
* like, you can't insert `undefined` to another actor
* because every actor has a different notion of `undefined`, a different definition

* is it circular?
* if every actor has to specify their own default value
* then that default value has to be passed in somehow right?
* so who defines the "first" default value

* well we kinda already have this issue
* if we have a global `undefined` definition (like the `Undefined` actor we currently have in lumino.js)
* that actor also has properties
* and those properties can also be undefined (in fact, most are)
* so this global `undefined` actor, returns itself when a reader tries to access a property on it


* maybe this is actually the default behavior
* every actor returns itself whenever it can't find a value during a read operation
* that way, an actor can specify `ifUndefined` on itself

        foo:
            ...
            ifUndefined: x => x   // identity function

* every actor acts as it's own `undefined`
* but then, how would an actor know the difference between a reference to `undefined`, and a reference to itself?
* for example, maybe some actor `foo` happens to pass `bar` to itself
* now `bar` thinks that it was passed `undefined`
* since it treats itself as `undefined`

* also, note that defining your own default read value
* is trivial as a second-order construct
* every time you do a read operation, just check if the result is `undefined`,
    * and if so, use a specified default value instead

* however, it doesn't change the fact that our global `undefined` value
* is starting to feel more and more arbitrary

* also, each actor having it's own default value
* feels less centralized than a global default value
    * though note that it isn't a global object that needs to be passed around
    * it's just an agreed upon template, but any interpreter can create their own `undefined` actor from the template
* though, certain parts of a language do have to be global
* eg the address system, and the way inbox items are converted to linked lists, etc
* aka all language rules are global
* so should we treat `undefined` as a language rule?

* note that if the definition for `undefined` is treated as a global language rule
* then the protocal for checking `ifUndefined`, also becomes a global language rule
    * see section "Coercing Defined/Undefined to a Boolean"
* because that's currently the only reason for having the identity function defined inside the actor
* having that arbitrary identity function property, doesn't make sense without the protocol for checking undefinedness
* they are intertwined

### Global vs Local Undefined II

* i guess a major question still is
* does `undefined` make sense as a globally understood value
* does it make sense to pass around `undefined`?

* actually, imagine if we did

        foo:
            x: input.someProp

* and assume `input.someProp` returns undefined
* if undefined was a local value
* then somebody reading `foo.x` would not also see it as `undefined`
* which is weird...

* i guess this would make more sense if the default object was just an empty object, `()`
* doesn't matter who reads it or sees it
* nobody can act on it
* it's basically a black hole

* it also kinda makes sense because, if an actor doesn't have access to any of the properties of some object
* it will also look like an empty object
* kinda like the idea of value-equality in functional
  * mentioned in section "Reference Equality and Referential Transparency"
  * in function, the notion of equality is based on if two functions act the same, not based on internal ids or reference equality like in Java/javascript
* if it looks undefined to you, then it _is_ undefined to you
* you can't understand it
* its "virtually undefined"

* but that also makes it virtually useless
* you can't check for undefined
* since you can't do anything with it


* what is "understanding"?
* what does it mean for one actor to "understand" an object, and another actor to "not understand" the same object?


* note that constants like booleans, numbers
* are also passed in through scope
    * mentioned in section "Constants and Static Embedding"
* what if two environments had different definitions for numbers, or booleans?
* would they also run into the same issues?

### A Tale of Two Truths

imagine two ways of defining a boolean

        TrueA: trueBranch, falseBranch >>
            => trueBranch()

        TrueB: ifBranch, elseBranch >>
            => ifBranch()

(note, they may look the same, but `trueBranch` and `ifBranch` are at different addresses,
 so if you don't know which address to use, you wouldn't be able to use that boolean)

* now imagine if some object Foo stored `trueA` on some property `bool`
* and some object `Bar` only knew about `TrueB`
* if `Bar` looked at property `bool`, he wouldn't understand it and wouldn't know how to use it


this goes back to functional and type coercion
these sorts of complications are why functional doesn't have a primitive concept of equality (eg no reference equality)
if something acts the same, it _is_ the same
so instead of worrying about different types of booleans
a functional program would just treat an input as a boolean and use it as if it were a boolean

### `undefined` is part of Property Access

* undefined only makes sense
* in the context of our dictionary / address / memory system
* it is a part of the protocol

* we are defining `undefined` as a part of the protocol

* this is important to recognize
* because the property access protocol is a fundamental difference between Firefly and other actor / functional languages
* most actor / functional languages just treat property access as just another function
* but by defining it as a language rule (like Firefly does), we are also forced to introduce the idea of `undefined`
* (and recall that we made it a core rule to enforce anonymous reads)

* so basically, the only reason why we have `undefined` is because we want anonymous reads


* so maybe we should just make property access functional
* but a couple problems we mentioned before
    * functions use prop access, so prop access can't use functions, circular
    * since actor can have side effects, functional prop access allows for infinite props, potentially infinite actors and side effects


* encryption example
* recall that for property access, we can capture all properties into an encrypted bundle, so property access becomes a matter of decryption using different keys
  * mentioned in sections "Private Keys and Anonymous Reads, Property Bundles" and "Preventing Dynamic Access and Proxies using Encryption"
* if you use the wrong key, the decrypted data could look like gibberish
* but with a "global undefined", the readee would have to tell the reader that it's not just gibberish, it's "undefined"
* for example, maybe the readee tells the reader that the decrypted data to start with `data-` to be valid


* the address protocol
* forces us to define some addresses, and leave other addresses undefined
* so the concept of `undefined` does seem built into the protocol

* but the protocol doesn't specify what value to use for undefined?

### Data Persistence Networks and Default Read Values

* data persistence network
    * (mentioned previously in "Anonymous Reads and Data Persistence Networks")
* means everybody has to agree on output
* so readers can't define their own default values

* so that pretty much resolves the issue mentioned in section "Global vs Local Undefined"

### Custom Default Property Values

* however, re-exploring idea that the _readee_ (the object being read) can define it's own default value
* (previously explored in section "Undefined as a Primitive")

previously we argued that
1. trivial to just specify a `default_val` property and let the reader do the replacement
2. prevents anonymous reads, since readee would have to know that the key is not defined, and then return the default value instead

* I realize now that there are a few issues

* for (1) there is a big difference actually
* who has control
* reader or readee?

* if readee object itself specifies default val, then reader doesn't have control
* a reader may not be able to understand / parse the default return value
* they might not understand that it is "undefined"
* note that all readers still see the same value, but some readers know how to handle it (eg they know where the `ifUndefined` prop is hidde)
* a side effect of this could be that, a reader iterating through a list but doesn't know how to parse the list end, will end up recursing infinitely

* if instead all readee objects return a global `undefined` value
* and the reader retroactively substitutes a default value on top of the `undefined` value returned
* this gives power to the reader to substitute or not
* and it actually _takes power away_ from the readee object
* because the object is now forced to specify to the world what addresses are undefined

* for (2), that's not necessary true
* it's up to the address-access protocol
* the reader can execute a property access anonymously
* but the default value can be embedded in that property access protocol?
* kinda like, when decrypting some data
* the readee object can design the encrypted object such that when decrypting with a key that wasn't defined, it returns the default value

### Reads / Property Access as an Interface

* however, if we give control to the readee object, and allow the readee to specify its own default value
* then why not generalize it all the way
* and allow dynamic properties and functional property access
  * mentioned in section "Property Muxers"

* well first of all, not possible, circular, since functions are built on top of prop access


* reads as an interface
  * similar to the idea discussed in "Sets as an Interface"
* the attributes that we want of property access:
    1. anonymous
    2. dynamic
    3. functional (no side effects)
* can be achieved at a higher level of abstraction
* as a second or third order construct
* at the axiom level, property access is static,
  but at higher levels we can achieve dynamic property access

* we already kinda demonstrated this
* in the section "Double-Sided Property Access (The Bilateral Protocol)"
* where we implemented object-key property access using a complex protocol built on top of the axioms

* address access is static
* object-key access is dynamic


* to prevent infinite behavior
  * an issue mentioned in "Property Muxers" and "Dynamic Properties - Finite Objects with Infinite Properties?"
* notice that dynamic property access always ends with an address, to finally retrieve the value at that address
* so all behavior and children are stored in addresses, which are static
* dynamic property access is just a dynamic way of getting to an address

### Operating on Undefined II

* if we use a reserved address for `undefined` for the `ifUndefined` function
    * (mentioned in sections "Handling Undefined" and "Reserved Addresses")
* that will allow people to override the property
* but as we showed in the section "`undefined` is part of Property Access"
* `undefined` is really a special value that is defined as part of the property access mechanism

* so checking for `undefined` is also special
* thus, we can define a special operator `check_undefined` that takes in three inputs, `input`, `doIfDefined`, `doIfUndefined`
* and it checks if the `input` is undefined, and if so, spawns `doIfUndefined`, otherwise it spawns `doIfDefined`
* then we don't need to do any of that funny business we defined in "Coercing Defined/Undefined to a Boolean"

* wait but then we would also have to integrate this special operator in higher level operators too
* like equality
  * eg what if I do `if (x = y)` and `x` or `y` is undefined?
* and truthy-checking
  * eg what if I do `if (x)` and `x` is undefined?
* in these cases, wouldn't it be easier to just use conventional methods to define equality (see section "Double-Sided Equality")
* so that higher level operators automatically work, without adding edge cases specifically for `undefined`?

* also what about adding properties to `undefined`, eg for error messages and such
* see section "random stuff - objects as keys, error codes, etc"
* though in later sections, eg "Errors and Virtual Properties" and "Errors and Special Properties"
* we talk about how this can be achieved using tags instead?

### Preventing Dynamic Access and Proxies using Encryption II

* previously we talked about how we can prevent dynamic property access using encrypted property bundles
  * see section "Preventing Dynamic Access and Proxies using Encryption"
* since the property bundle is a static piece of data
* however, in a sense, pure functional property access methods (like the one mentioned in "Double-Sided Property Access") can be seen as _part_ of the decryption protocol
* and if you don't use it, you won't be able to read the object

* I think as long as all decryption protocols are pure functional, don't leak data, no side effects
* then people won't mind custom decryption protocols

### tags and reference equality ?

not sure if this was mentioned before
since tags rely on hashmaps
basically relies on equality
but equality might not be defined for some objects
what should happen?

### Lumino Exploration - binding types

previously talked about only creating inbox item once per insertion
and inserting it around

but actually, the receiving actor has to create inbox item
because the receiving actor knows where the next_addr and val_addr should be defined

interestingly for the bindings:
* access - has a subject (the readee) and a value (the retrieved property)
* spawn - has a subject (the template) and a value (the spawned child)
* insertion - has a subject (the target) but no value (and no subscribers)
* ordering - has no subject but has a value (points to the next inbox item)

* so why the asymmetry?

* ultimately the subject and subscriber system is _static_
* during the `resolveReferences` stage, bindings are created between nodes inside an actor
* but afterwards, those bindings are static

* however, insertions are dynamic, we have no idea where the value is going to be inserted to
* thus, the insertion binding represents an "exit node", and has to manually send the value to the target
    * since it has to do so manually, doesn't use subscriber system
* the ordering binding represents an "enter node", it has to manually receive a value and integrate it into the network
    * since it has to do so manually, it doesn't have a subject

### Lumino Exploration - Null Bindings

* while writing lumino, I had to add the concept of a "null binding" or "null node"
* recall that every actor is made up of a reactive network of nodes,
  that store values and propagate updates to other nodes
* a "null node" is when a node references an address that wasn't defined in the spec
* eg

```js
const template = {
    properties: {
        'addr_10': { type: 'inbox_next' },
        'addr_11': { type: 'inbox_value' },
        'addr_12': { type: 'spawn', source: 'addr_777' },
    },
    outbox: [],
}
```

* notice that the `spawn` node references `addr_777`, which will _never be defined_
* so the `spawn` node is permanently undefined

* Note that null bindings are very different from UNDEFINED values.
* "undefined" is a value, it is dynamic and temporary
* a property value could be UNDEFINED one moment and then defined the next moment.
* On the other hand, a null binding is static and permanent, its value will always be undefined
  * recall that bindings are mostly static, see section "Lumino Exploration - Access and Spawn bindings are Static"
* So null bindings are rather useless, and should actually never occur when using higher-order constructs and syntax.
* with higher-order constructs like static binding, scope, etc, an actor would never be bound to a null address

* i realized that the way lumino works
* the only way you can get undefined
* is if inbox next item is undefined
* propery access and spawn and outbox items should always reference properties that already exist / defined

* so it looks like the only way to get an undefined value is when referencing insertions?
* so "undefined" basically means nothing has been inserted?
* maybe we should just call it "no_insertion"?

* actually no, you can also get undefined if you are doing a property access on an insertion
* and the insertion doesn't have that property defined

* such is the life of dynamically typed systems
