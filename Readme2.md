basic syntax


execution vs bindings (ordered vs unordered)

binary tree height example

distributed web asynchronous



Axis Programming Language
==========================

A reactive programming language for designing distributed systems, information networks, and web applications. Actor model


Axis programs are composed of objects. Every object is an "actor". Think of them as independent organisms, like cells in a body, or servers in a network. 



Every object defines a set of properties. And every object can interact with other objects in three ways: access properties, insert items, or clone the object.


mapreduce
server herds
social networks
web apps


simple and intuitive language for describing high level distributed applications

most concurrent actor-model languages based on message passing. Axis is based on bindings.


before delving into the mechanics, here's a brief taste of what's possible. These should be relatively understandable if you know javascript, 

	// returns the height of a binary tree
	binaryTreeHeight: tree >>
		tag #height.

		// calculate height of all nodes
		for node in tree.nodes:
			node.#height: Math.max(node.left.#height | 0, node.right.#height | 0) + 1    // return height of left or right subtree + 1

		=> tree.#height   // return height of root node

Notice how this would normally require recursion in any imperative/functional language, but in Axis we only need a simple for-loop. It doesn't matter in what "order" the nodes are being traversed in the for-loop, the result will always be the same. This is a core idea: in Axis, we don't specify order. With recursion, we would need to specify the traversal order, eg "first find the height of the left and right subtree, and then find the height of the parent". In Axis, we simply define the relationships between data, and the answer works itself out. This is explored more deeply in the "Feedback" section, where we give more examples showing how algorithms in Axis can be cleaner and simpler than their functional or imperative counterparts.

In addition, because everything is unordered, everything can execute independently and concurrently. This is perfect for defining web services and applications. 

my final example, I show how Axis is able to blur the lines between dabatases, servers, and clients

	messages: collector(file: 'messages.axis')   // all messages, saved to a file
	activeUsers: collector

	ChatServer: Web.Server
		index: Web.Client template  // main page

			layout: JSX(file: 'layout.jsx')

			username: layout.find('input.username').value
			draft: layout.find('text-area.message-draft').value
			
			activeUsers <: username    // insert user into list of active users

			send: => @timestamp
				messages <: (time: timestamp, user: username, text: draft)      // insert message into the list of messages




Philosophy
--------------

* reactive
* unordered
* separate data structure from execution
* what the data structure vs how it is created

Axis is a dataflow/reactive language, which means that we define programs through data bindings, not execution statements. For example, if we had something like

	sum: a+b

this is saying that the variable `sum` is bound to the sum of `a` and `b`. If the values of `a` or `b` change, then `sum` will automatically update to reflect that. Whereas in imperative, a statement like this is executed once. You can think of these "bindings" as continuously evaluated statements. You may have seen similar concepts if you have worked with AngularJS or ReactJS.

Because we are defining bindings, there is no execution order, like normal imperative languages. All bindings can be thought of as asynchronous and continuously evaluated. It does not matter in what order you defined bindings, they all "exist" at the same time. This makes Axis ideal for distributed applications, where everything is asynchronous.

In addition, this allows Axis programs to define data structures and relationships, without worrying about how that data structure is evaluated. In Axis, we define _what_ the data structure is, not _how_ to create it. **Axis separates data from execution.** This makes programming more elegant and intuitive.

Everything in Axis is data. There is no execution, no instantaneous actions. All behavior is persistent and asynchronous.


As mentioned in the philosophy section, Axis is about focusing on data relationships, and leaving all execution optimizations to the interpreter.

typing, can't change arbitrarily like with assignment. Restricting modifications to insertion means that the "type" of the object always stays the same. You can always refer back to the object definition to see how it should behave.


Mechanics
-----------------

### Basic Syntax

The basic syntax is rather intuitive, and looks similar to javascript objects definitions.

	x: 10     // define variables using ":"
	y: x + 3  // math expressions are supported

	someString: "hello world"
	someBoolean: true

Everything in Axis is an "object", which is just a collection of properties.

	someObject: (name: "Joe", age: 20)      // define an object using parenthesis
	someList: (10, 20, 30)                  // lists are ordered collections of values, but they are also just objects. This list is equivalent to (0: 10, 1: 20, 2: 30)
	someList2: (10 20 30)                   // for lists, commas are optional

	someObject.name                      // use "." to access properties, so this will return "Joe"
	someObject.age = 20                  // "=" is the equality operator, so this will return true

	console.log("hello world")->         // this prints "hello world" to the console. This syntax actually uses both "cloning" and "function calling", explained in later sections


	console.log( if (someObject.age > 18) "adult" else "child" )->     // conditionals use if...else, so this will print "adult"

	if (someObject) console.log( "someObject is defined" )->           // if you use an object as a condition, it is considered "truthy" unless it is undefined

	console.log( otherObject | "otherObject is not defined" )->        // short-circuit evaluation

Instead of defining objects using `()`, we can also just use indented blocks. In fact, an indented block acts like a set of parenthesis. So the above definition of `someObject` can also be rewritten like so:

	someObject:
		name: "Joe"
		age: 20

We can do the same with `someList`:

	someList:
		1
		2
		3

Indented blocks also allow for scoping

	Bob:
		_age: 25               // define private properties using the `_` prefix
		isAdult: _age > 25     // same scope as _age, so we can reference it

	isAdult       // not the same scope as isAdult, so this will return "undefined"
	Bob.isAdult   // however, "Bob" is in our scope, so this will work, returns "true"
	Bob._age      // _age is private, so this won't work, returns "undefined"

Lastly, the keyword `undefined` basically means that we are trying to access a value that hasn't been defined. For example, if we try to access `someObject.height`, it will return `undefined`.

Because everything in Axis is data, there are no "errors" like traditional imperative languages. Bad code will never result in a program crash or a runtime error. Instead, a value will simply evaluate to `undefined`. For example, even if we tried to use property access on `undefined`, eg `undefined.height`, it would simply return `undefined`.

### Cloning and Implicit Parameters

Axis is a prototypal language. So any object can be "cloned", allowing we to specify new properties and overwrite old ones. This is extremely similar to the concept of "extending classes" in object-oriented languages. For example, let's start with a simple object called `division`

	// define an object
	division:
		quotient: p / q
		remainder: p % q

	division.p           // returns undefined
	division.remainder   // returns undefined

	result: division(p: 16, q: 7)   // clone the object, overriding p and q

	result.remainder     // returns 16 modulo 7, aka 2

Let's break this down. First, notice that in the `division` object, `p` and `q` are not defined yet. This is actually valid syntax, and just means that `quotient` and `remainder` will be undefined as well. Note that if we wanted to, we could explicitly declare parameters using `>>` like so

	division: p, q >>
		quotient: p / q
		remainder: p % q

However, this is not necessary. By referencing variables that are not defined in the scope, we are implicitly declaring parameters. Then, when we "clone" the object, we can provide values for these parameters. Which is exactly what we did for `result`, providing values for `p` and `q`, and we can see that `quotient` and `remainder` automatically adjusted to use those new values.

We also don't need to provide names for the arguments we pass in. For example, we could have done `division(16, 7)`. These arguments would automatically map to the implicit paramters, in the order that the parameters show up in the object definition (so since `p` shows up first in `division`, then `p` is the first parameter, and will be mapped to the value `16`). Though if we want, we can use `>>` to explicitly declare the parameter order.

Cloning can do much more than just provide values for parameters, though. We can also use cloning to overwrite existing properties, and define new properties and behavior. All of this is done within the "arguments" of the clone operation, `someObject(<arguments>)`. Here is another example that is reminiscent of classical object-oriented inheritance

	Person:
		>> name
		greeting: "hello my name is " + name + "."

	Student: Person
		>> name, school
		greeting: Person.greeting(name) + " I go to " + school + "."


An important way to think about defining or extending objects, is that **any behavior defined inside the braces will be duplicated during cloning**. So for example, if we have

	joe: Student("Joe", "Harvard", console.log(this.greeting)->)    // create a new student, and automatically print his greeting to console
	bob: joe(name: "bob")                                           // creates a new student and also log his greeting

notice that when we clone `joe` to create `bob`, the function `console.log(this.greeting)->` will be called again. This might seem counter-intuitive, because in imperative languages, function calls are executed before they are passed as arguments. However, remember that this is not a function call, we are extending an object, and defining new behavior. This distinction becomes extremely important in the later sections "Insertion" and "Templates", but don't worry, those sections explain this in more detail.

### Insertion and Collectors

We can declare a `collector`, which allows us to insert values to it from anywhere using the `<:` operator. For example

	foo: collector

	for num in (1 2 3)
		foo <: num * num

	console.log(foo)->       // will print "(1 4 9)"

It's important to note that insertions are unordered. The collector acts on an unordered set of all items inserted. Insertions make it easy to construct objects, without introducing any unnecessary order.

Note that you can insert to any object, no restrictions. However, by default, objects ignore insertions, so any insertions would not affect the object. In order for insertions to have an effect, the object has to either be a `collector` or any object that extends a `collector`. There are many useful ways we can declare a collector. For example:

	sum: collector(+)     // collector(fn) will apply fn to all insertions and return the output

	for num in (1 2 3)
		foo <: num * num

	console.log(sum)->       // will print 1+4+9, aka "13"

By leveraging insertion, we can also define object methods (like class methods in Python/Java)

	Library:
		songs: hashset     // hashsets are simply collectors that filter out duplicates
		artists: hashset
		album: hashset

		song: artist name album >>
			songs <: (name, artist, album)
			artists <: artist
			albums <: album

	song1: Library.song('Never Gonna Give You Up', 'Rick Astley', 'Whenever You Need Somebody')

There is a small issue with this code. When we clone `song` to create new songs, it automatically inserts the song to our library. But since Axis is a prototypal language, that means the `song` declaration itself will also insert a song into our library. Because `artist`, `name`, and `album` are all `undefined` for this prototype, this initial `song` object will insert these `undefined` values. Definitely not something we want.

Instead, we want to somehow define a module without actually "executing" it...

### Templates and Functions

Templates are simply a way of defining modules without "executing" them. More specifically, a template will not perform any clones or insertions. In addition, accessing any property of a template will return `undefined`. However, while a template is completely inert, any clones of it will be "active".

So to tweak the example from before, we simply change `song` to a template:

		song: template
			artist name album >>
			songs <: (name, artist, album)
			artists <: artist
			albums <: album

	Library.song('Never Gonna Give You Up', 'Rick Astley', 'Whenever You Need Somebody')

this is useful for interacting with web apis and extending objects. For example, imagine if the Spotify API had a template for creating playlists, `playlist(name, description)`. What if we wanted to create a wrapper around this function, `datedPlaylist(name)` that automatically uses the current date in the description

	datedPlaylist: playlist template      // extend the playlist object without executing it
		name, timestamp >>
		description: "playlist created on " + Date.from(timestamp))
		console.log(description)->

	myPlaylist: datedPlaylist(name: 'my playlist', timestamp: Date.now())

Remember that when you clone an object, any behavior you pass in becomes part of the clone. Thus, if the clone is an object, then the behavior will be "executed". If the clone is a template, then it won't be executed. So in this example, `myPlaylist` is a regular object, it is "alive", so the `console.log` statement will be executed. On the other hand, `datedPlaylist` is a template, it is "inert", nothing will be printed to console.

We can declare templates inline, too:

	foo: playlist(template console.log("new playlist")->)

**Functions**

There is another special kind of object called a "function". The purpose of a function is to represent an action. The easiest way to explain it is through an example

	add: a b >>
		val: a+b
		=> val

	add(10, 7)->     // returns 17

To create a function, we define a return value using the `=>`. It works like defining a property, in fact, in the background we are just defining the `_return` property. In order to use a function, we use the "call" operator `->`, which just returns the return value. So here, `add(10, 7)` clones the `add` function with `a: 10, b: 7`, and returns the return value of `17`.

At first glance, it may seem like functions are just a bunch of syntax shorthands. We have a return property defined via `=>`, and then extracted via `->`. However, functions have one major other function: they act like "persistent" templates. If there are any insertions/clones defined in the function, they are not run until the function is **called**. In fact, the function can be cloned any amount of times without executing these insertions and clones. The function will wait until being _called_ before executing. This allows for something similar to currying, eg:

	step1: add(a: 10)
	step2: step1(b: 7)
	result: step2->

Because of this subtle difference between functions and templates, it is important to be mindful while naming them. Functions should be named using verbs, while objects and templates should use noun. For example, `createPlaylist` would be a function, while `playlist` would be an object or template.

A small note: if we did something like

	createPlaylist: playlist
		name, timestamp >>
		description: "playlist created on " + Date.from(timestamp))
		console.log(description)->
		=> this

Notice what is happening. We are creating a function from `playlist`, so it inherits all properties and behaviors from `playlist`, but doesn't execute. In addition, it won't execute when cloned. Only when we call it, will it return `this`, aka a "live" active version of the playlist. Using `=> this` syntax is a way to create "permanent" templates, aka templates that stay inert when cloned, and are only active when called using `->`.

Notice that in many ways, Axis functions work pretty much the same as the functions we are used to in functional and imperative. The only difference is that Axis functions allow us to modify the internal behavior of a function via cloning.

### Private Variables and Keys

using prefix `_`, `_privateKey` syntax
you can also use them as keys

### Conditionals and Loops

Conditionals are a way of "enabling" or "disabling" blocks of properties.
Notice that they don't have `:` after them.

	if (someCondition)
		foo: 10
		bar: "hello"
	else
		foo: 20
		bar: "world"

you can also put it on same line

	pet: if (introvert) cat else dog

Like javascript, Axis can coerce objects to booleans. Objects are "truthy" if they are not `undefined`. Likewise, any variable that is `undefined` resolves to `false` in conditionals.

Axis also uses short-circuit evaluation

	foo: undefined
	console.log(foo | "foo is not defined")->    // prints out "foo is not defined"

Loops are actually just `mapreduce` functions in disguise.
You can use destructuring, just like you would for a function.

	for key, val in mHashmap:
		console.log(key + ": " + val)->

is the same as

	mHashmap.map(key val => console.log(key + ": " + val)->)

### Tags

Tags are actually just a syntax shorthand for defining and using hashmaps. To illustrate that, take this example:

	isEcoFriendly: Hashmap()

	for car in cars
		isEcoFriendly.add(car, car.fuelEconomy > 30)     // cars over 30 miles/gallon are eco friendly

	console.log(isEcoFriendly[prius])->         // will print "true". Assume "prius" is in the set "cars"

This is what it looks like using tags

	tag #isEcoFriendly.

	for car in cars
		car.#isEcoFriendly: car.fuelEconomy > 30

	console.log(prius.#isEcoFriendly)->         // will print "true" (assume "prius" is somewhere in the set "cars")

as you can see, often times hashmaps are used to define additional attributes and properties for objects, without modifying the original objects. They are extremely common for data processing. Tag syntax makes it actually look and feel like you are working with properties, even though you aren't actually modifying/retrieving properties from the object. This is why tags can also be thought of as "virtual properties".

### Errors

check the end of the "Basic Syntax" section for overlap

In a data-centric language like Axis, it doesn't make sense to throw errors like imperative languages do. Instead, we use the data type `undefined` to indicate that an error occured.
The `undefined` object may have an `#error` property attached, from which you can extract relevant error information.

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

### State Variables

State variables are also just syntactic shorthand, useful in event handlers. State variables are just objects that represent an ordered list of states.

	numClicks: var 0      // state variable starting at "0"

	onClick: @timestamp
		numClicks := numClicks + 1


### Extra Syntax

I recommend skipping this section and coming back to it, these are just syntax shorthands. The next sections on examples and use cases are much more interesting.

* deconstruction: `(a, b): someObj` = `a: someObj.a, b: someObj.b`
* statements: `someProp.` = `someProp: true` = `someProp: ()`
* spread operator: `...object`
	
		foo: (10, 20, a: "hello")
		bar: (30, b: "world")

		zed(...foo ...bar) = zed( 10, 20, 30, a: "hello", b: "world" )     // spread operator will combine properties, and append list items

* capture blocks: `...`
	allows us to define functions using indented blocks
* array map access: `list[[prop]]`

		// mapped property access using [[ ]]
		someList: ( (a: 10), (a: 20), (a: 30) )
		extractedValues: someList[["a"]]          // extract the value of property "a" from each list item. So list[[prop]] is equivalent to list.map(item => item[prop])

		// extractedValues = (10, 20, 30)

* dynamic keys: `[key]: val`

		[key]: key*key

* matchers: `[matcher]: val`

```js


fn:
	for str in ("fda" "kekw" "jkdfie"):
		[str]: true


// infinite streams and matchers

evens:
	[key => key % 2 = 0].     // 

evens = (0. 2. 4. 6. 8. 10. ...)

```

* set deconstruction, matchers

Examples and Concepts
------------------------

### Timeless

one of the biggest things understand, is that because everything in Axis is unordered and asynchronous, the language also doesn't have the concept of discrete execution steps, like imperative. Instead, we think of data as persistent and "timeless", and assume that every variable is constantly re-evaluated to keep the value up to date. To drive this point home, let's say we defined an event-handler to collect all mouseclicks:

	allClicks: collector

	onclick( click => allClicks <: click )

then we can treat this data as persistent and always up to date. Which allows us to do something like this:

	lightBulb: allClicks.length % 2 = 1   // mouse clicks will toggle lightBulb


for example, let's say we were given a set of student test scores, and we wanted to find every test score that was above average. In imperative, this would take two steps, one for-loop to compute the average, and then another for-loop to find the test scores that are above average.

In Axis, it would look like this:

	testScores >>

	tag #aboveAverage.
	
	sum: collector(+)                          // sums up all insertions
	average: sum / testScores.length

	for score in testScores:
		sum <: score                           // insert score into sum collector
		score.#aboveAverage: score > average   // tag score with "true" if the score is above average

This might seem a little weird. Remember that in imperative code, we would need two loops, one to compute the average, and one to see if each test score is above average. So how are we doing this in one loop? In the first "iteration" of the `for` loop, how can we set `score.#aboveAverage` if we haven't finished computing `average` yet?

This is where you have to stop thinking in terms of execution, and instead think in terms of data relationships. All we are telling the interpeter, is that `sum` is the sum of all scores, `average` is the sum divided by the number of scores, and a score is `#aboveAverage` if it is bigger than `average`. That is all we need to specify, and the interpreter figures out the rest.

So let's explore how an interpreter _might_ go about computing this. When it reaches the `for` loop, it takes the first `score`, and inserts it into `sum`. `sum` notices the change, and updates accordingly. `average` notices the change in `sum`, and updates as well. Lastly, `score.#aboveAverage` notices the change in `average`, and updates accordingly. Now this is just for the first score. Then the interpreter moves onto the next score, and inserts it into `sum`. Again, `sum` gets updated, and then `average`, and then this update `#aboveAverage` for **both** the first score and the second score. Remember that bindings are persistent, so the first score is still listening for updates to `average`, even if the interpreter has moved onto the second score. This process will repeat until the interpreter has processed all scores.

This might seem extremely inefficient, with these feedback loops going back and updating previous variables. However, note that the dependencies in this example actually form a DAG (directed acyclic graph). In other words, there is no feedback. The order we should compute the variables should be `all scores => sum => average => all #aboveAverage tags`. This way, nothing needs to be computed twice. And this optimization is exactly what the interpreter would leverage to achieve the same level of efficiency as imperative code, without sacrificing the elegance of Axis syntax. As mentioned in the philosophy section, Axis is about focusing on data relationships, and leaving all execution optimizations to the interpreter.

However, there are times where the code _can_ introduce feedback, covered in the next section.

(Note that to compute the total sum we could have just used `sum: Math.sum(...testScores)`, which is perhaps simpler, but the point of the example is to show the "timeless" nature of Axis)

### Feedback - Convergent and Divergent

Feedback is an extremely powerful tool that is only possible using Actor-model languages like Axis. Although simpler forms are relatively common in imperative languages. For example, a cyclic data structure:

	Bob:
		child: Alice
	Alice:
		parent: Bob

	console.log( Bob.child.parent.child.parent )->   // we can do this because of feedback

Here, we have two objects referencing eachother. However, this is a pretty boring example of feedback, it's just a static structure. There is no cloning or calling. But what if we did something like this?
		
	distance:
		km: m*1000
		m: km/1000 | cm*100 | mm*1000
		cm: m/100
		mm: m/1000

	hikeDistance: distance(m: 1234)
	mountainHeight: distance(km: 1)

	console.log( "The hike is " +  hikeDistance.cm + " centimeters long" )->
	console.log( "The mountain is " + mountainHeight.m + " meters high" )->

Notice how you can initialize `distance` with any unit (km, m, cm, or mm), and the rest of the properties will automatically be computed. No need for getters.

The real power of feedback becomes apparent in more complicated cases. One example is actually the `treeHeight` example given in the introduction section. But let's go over an extremely similar but slightly more complex example. What if we wanted to get the shortest path distance from a start node to an end node in a given graph?

	shortestDistance: graph start end >>
		tag #distance: (default: infinity)      // stores each node's distance from the start node. Default value is infinity

		for node in graph.nodes:
			if (node = start)
				node.#distance: 0
			else
				node.#distance: node.neighbors[[#distance]].get(Math.min)-> + 1    // find neighbor closest to start (aka shortest #distance), and add one to its distance

		=> end.#distance

In an imperative or functional language, such an example would require recursion and keeping track of visited nodes throughout the traversal. Not in Axis! We can use a simple for-loop to express the behavior. But how does this actually work?

Think back to the `testScores` example in the "Timeless" section. We can analyze how the interpreter _might_ execute something like `shortestDistance`. First, all `#distance` values are by default set to infinity. Then, the first node to be updated will be the start node, whose `#distance` is set to 0. Then, the neighbors of the start node will be notified of the update, and each node will look for the closest neighbor, which should now be the start node, with a `#distance` of 0. Since the shortest distance for these neighbor nodes is 0, so the node will update its new `#distance` to be 1. This will in turn notify the neighbors of those nodes, and the cycle will repeat until all shortest distances are computed. Due to the way this function was defined, we know that eventually, every node `#distance` will reduce to some final value, and stop sending updates to other nodes. We call this type of feedback "convergent".

Note that this method was only possible because we had a list of all graph nodes available through `graph.nodes`. This is provided in the `Graph` data structure, but let's look at how we might implement it ourselves. In order to do so, we have to fall back to using recursion:

	nodes: breadthFirstSearch((), this.root)
	breadthFirstSearch: visited, currentNodes >>
		if (current.length = 0)
			=> visited      // no more nodes to process, return all visited nodes
		else
			nextNodes: currentNodes[['neighbors']].subtract(visited)     // get neighbors of current nodes, minus already visited nodes
			=> breadthFirstSearch(visited, nextNodes)

Imperative code requires similar complexity to retrieve all nodes from a graph (either using loops or recursion). The difference is that in Axis, after we retrieve all the nodes, we can use them in a whole variety of use cases, like computing distances (as shown earlier) or finding connected pairs or filtering for certain nodes, etc. We only have to define this recursion once. But in imperative languages, in order to do stuff like computing distance or finding connected pairs, we would have to use recursion over and over again.

This just demonstrates the power of abstracting data relationships away from implementation. We define the "implementation" once to retrieve the data (in this case, using breadth first search to get all nodes). Then we can use the data without worrying about the implementation again. We maximize abstraction and reduce code duplication.


Note that while feedback is very powerful, we do have to take care in using it. For example, if we did something like `x: x+1`, this would be a feedback loop that would constantly increment `x` until it reached infinity. Likewise, we would run into similar problems if we tried to modify our `shortestDistance` example to instead look for `longestDistance`. Intuitively, we know this wouldn't work, because imagine trying to find the longest distance in real life. We could just run around in circles before reaching the destination to make the path as long as we wanted. And this is exactly what would happen here with `shortestDistance` if we tried calculating longest distance by replacing `Math.min` with `Math.max` and setting the default distance to `0`. When the `#distance` of any node increases, the `#distance` of all of its neighbors will increase too, and the feedback would cause the distance for all nodes to steadly increase until infinity. This sort of feedback is called "divergent", and is something to watch out for, just like one might want to watch out for infinite loops in imperative languages.

### Web Technologies API Calls

chatroom example

Let's take the chatroom example from the introduction, and this time include the layout:

	messages: collector(file: 'messages.axis')   // all messages, saved to a file
	activeUsers: collector

	ChatServer: Web.Server
		'/chat': Web.Client template

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


everything is asynchronous
so no need to worry about javascript, synchronous vs callbacks vs promises vs async/await

keep things simple, optimizations in backgrond
don't need to specify where caching happens
for example, loading a long list of user photos
caching all of them on user side requires a lot of memory
loading them all dynamically is slow, requires high bandwidth
complicated caching mechanism should not sacrifice the readability of the code


this lets the interpreter make decisions about where to execute

Encapsulation

you can't modify variables out of scope
you can insert
but 

Testing and Mocking

everything is data
you can view all calls and clones going into a module


Firewalling

coming soon!

Meta-programming

coming soon!
