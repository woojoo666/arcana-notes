basic syntax


execution vs bindings (ordered vs unordered)

binary tree height example

distributed web asynchronous



Axis Programming Language
==========================

A reactive programming language for designing distributed systems, information networks, and web applications.


mapreduce
server herds
social networks
web apps

my final example, I show how Axis is able to blur the lines between dabatases, servers, and clients


before delving into the mechanics, a short preview of what's possible

	treeHeight: tree >>
		tag #height.
		for node in tree.nodes:
			node.#height: Math.max(node.left.#height | 0, node.right.#height | 0) + 1    // height of left or right subtree + 1
		=> tree.#height

Notice how this would normally require recursion in any imperative/functional language, but in Axis we only need a simple for-loop. This is explored more deeply in the "Feedback" section.

chatroom example



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

In addition, this allows Axis programs to define data structures and relationships, without worrying about how that data structure is evaluated. In Axis, we define _what_ the data structure is, not _how_ to create it. **Axis separates data from execution.** This makes programming more simple and intuitive.

Everything in Axis is data. There is no execution, no instantaneous actions. All behavior is persistent and asynchronous.


As mentioned in the philosophy section, Axis is about focusing on data relationships, and leaving all execution optimizations to the interpreter.


Mechanics
-----------------

### Basic Syntax

The basic syntax is rather intuitive, and looks similar to javascript objects definitions.

	x: 10     // define variables using ":"
	y: x + 3  // math expressions are supported

	someString: "hello world"
	someBoolean: true

Everything in Axis is an "object", which is just a collection of properties.

	someObject: (name: "Joe", age: 20)   // objects are collections of variables
	someList: (10, 20, 30)                  // lists are collections of values
	someList2: (10 20 30)                   // for lists, commas are optional

	someObject.name                      // use "." to access properties, so this will return "Joe"
	someObject.age = 20                  // "=" is the equality operator, so this will return true

note that indented blocks have "implied" parenthesis around them. So the above definition of `someObject` can also be rewritten like so:

	someObject:
		name: "Joe"
		age: 20

You can do the same with `someList`:

	someList:
		1
		2
		3

Lastly, the keyword `undefined` basically means that you are trying to access a value that hasn't been defined. For example, if we try to access `someObject.height`, it will return `undefined`.

Because everything in Axis is data, there are no "errors" like traditional imperative languages. Bad code will never result in a program crash or a runtime error. Instead, a value will simply evaluate to `undefined`. For example, even if you tried to use property access on `undefined`, eg `undefined.height`, it would simply return `undefined`.

### Cloning and Implicit Parameters

Axis is a prototypal language. So any object can be "cloned", allowing you to specify new properties and overwrite old ones. This is extremely similar to the concept of "extending classes" in object-oriented languages. For example:

	// define an object
	division:
		quotient: p / q
		remainder: p % q

	result: division(p: 16, q: 7) // clone it, overriding p and q

	result.remainder // returns 16 % 7, aka 2

First, notice that in `division`, `p` and `q` are not defined yet. This is not a problem, and just means that `quotient` and `remainder` will start out as undefined. However, in `result`, `p` and `q` _are_ defined, 

 These can be considered object parameters. When we "clone" the object, we can provide values for these parameters

* implicit inputs, and ordering

`>>` syntax, doesn't actually do anything
can override anywhere

fdsa

	Person:
		>> name
		greeting: "hello my name is " + name + "."

	Student: Person
		>> name, school
		greeting: Person.greeting(name) + " I go to " + school + "."


An important way to think about defining or extending objects, is that **any behavior defined inside the braces will be duplicated during cloning**. So for example, if we have

	joe: Student("Joe", "Harvard", console.log(this.greeting))    // create a new student, and automatically print his greeting to console
	bob: joe(name: "bob")                                         // creates a new student and also log his greeting

notice that when we clone `joe` to create `bob`, the function `console.log(this.greeting)` will be called again. This might seem counter-intuitive, because in imperative languages, functions are called before they are passed as arguments. However, remember that we are not really calling a function here, we are extending an object, and defining new behavior. This distinction becomes extremely important in the later sections "Insertion" and "Templates", but don't worry, those sections explain this in more detail.

### Insertion and Collectors

We can declare a `collector`, which allows us to insert values to it from anywhere, using the `<:` operator. For example

	foo: collector

	for num in (1 2 3)
		foo <: num * num

	console.log(foo)->       // will print "(1 4 9)"

It's important to note that insertions are unordered. The collector acts on an unordered set of all items inserted. We can almost think of insertion as unordered assignments. Insertions make it easy to construct objects, without introducing any unnecessary order.

Note that there are no restrictions to insertions. As long as you can see a variable, you can insert to it. However, by default, objects ignore insertions, so any insertions would not affect the object. In order for insertions to have an effect, the object has to either be a `collector` or any object that extends a `collector`. There are many useful ways we can declare a collector. For example:

	sum: collector(+)     // collector(fn) will apply fn to all insertions and return the output

	for num in (1 2 3)
		foo <: num * num

	console.log(sum)->       // will print 1+4+9, aka "13"

By leveraging insertion, we can also define "methods", ways to modify an object in specific patterns.

	Library:
		songs: collector

		artists: collector.noduplicates->
		album: collector.noduplicates->

		addSong: artist name album >>
			songs <: (name artist album)
			artists <: artist
			albums <: album

However, notice that `addSong` is an object, and because we are a prototypal language, that means it will be "executed". Because `artist`, `name`, and `album` are all `undefined` for this prototype, this initial call to `addSong` will cause these `undefined` values to be inserted.

Instead, we want to somehow define a module without "executing" it...

### Templates and Functions

Templates are simply a way of defining modules without "executing" them. More specifically, a template will not perform any clones or insertions. In addition, accessing any property of a template will return `undefined`. The point of a template is to defer execution until it is "called" using the call operator `->`.

So to tweak the example from before

	Library:
		songs: collector

		artists: collector.noduplicates->
		album: collector.noduplicates->

		addSong: template
			artist name album >>
			songs <: (name artist album)
			artists <: artist
			albums <: album

	myLib: Library()
	myLib.addSong('smash mouth' 'all star' 'shrek')->

remember how earlier (FIND SECTION) we mentioned that any container object can block all outgoing calls? Well that's exactly what template does


extending templates:


Functions

* just templates with a special property

### Private Keys

* not private vars

### Conditionals and Loops

Conditionals
Conditionals are a way of "enabling" or "disabling" blocks of properties.
Notice that they don't have `:` after them.

	if (someCondition)
		foo: 10
		bar: "hello"
	else
		foo: 20
		bar: "world"

Loops are actually just `mapreduce` functions in disguise.
You can use destructuring, just like you would for a function.

### Tags

Tags are actually just a syntax shorthand for defining and using hashmaps. To illustrate that:

	// using a hashmap

	isEcoFriendly: Hashmap()

	for car in cars
		isEcoFriendly.add(car, car.fuelEconomy > 30)     // cars over 30 miles/gallon are eco friendly

	console.log(isEcoFriendly[prius])->         // will print "true". Assume "prius" is in the set "cars"

	// using a tag

	tag #isEcoFriendly.

	for car in cars
		car.#isEcoFriendly: car.fuelEconomy > 30)

	console.log(prius.#isEcoFriendly)->         // will print "true". Assume "prius" is in the set "cars"

as you can see, oftentimes hashmaps are used to define additional attributes and properties for objects, without modifying the original objects. Tag syntax makes it actually look and feel like you are working with properties, even though you aren't actually modifying/retrieving properties from the object. This is why tags can also be thought of as "virtual properties".

### Errors

In a data-centric language like Axis, it doesn't make sense to throw errors like imperative languages do. Instead, we use the data type `undefined` to indicate that an error occured.
The `undefined` object may have an `#error` property attached, from which you can extract relevant error information.

### Extra Syntax

I recommend skipping this section and coming back to it, these are just syntax shorthands. The next sections on examples and use cases are much more interesting.

* `someVal.` = `someVal: true` = `someVal: ()`
* spread operator
* capture blocks
* array map access [[ ]]
* dynamic keys
* set deconstruction, matchers

Examples and Concepts
------------------------

### Timeless

one of the biggest things understand. For example, if we use an event-handler to create a variable to collect all mouseclicks:

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

Feedback is an extremely powerful tool that is only possible using dataflow languages like Axis. Although simpler forms are relatively common in imperative languages. For example, a cyclic data structure:

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
		tag #distance: (default: infinity)
		for node in graph.nodes:
			if (node = start)
				node.#distance: 0
			else
				node.#distance: node.neighbors[[#distance]].get(Math.min)-> + 1    // distance from the closest neighbor plus one

		=> end.#distance

Normally such an example would require recursion in any imperative/functional language. Not in Axis! We can use a simple for-loop to express the behavior. But how does this actually work?

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

This just demonstrates the power of abstracting data relationships away from implementation. We define the "implementation" once, to retrieve the data (in this case, using breadth first search to get all nodes). And then we can use the data without worrying about the implementation again. We maximize abstraction and minimize code duplication.


Note that divergent feedback would be like, if we tried to compute `longestDistance` by replacing `Math.min` with `Math.max`, and setting the default distance to `0`. What would happen is that every node would increase its neighbors, who would in turn increase their neighbors, and the feedback would cause the distance for all nodes to steadly increase, continuously until infinity. This sort of feedback is called "divergent", and is something to watch out for, just like one might want to watch out for infinite loops in imperative languages.

### Web Technologies API Calls

chatroom example

Let's take the chatroom example from the introduction, and tweak it a bit.

	chatrooms: load('chatroomData.axis')

	ChatroomServer: Web.Server

		port: '5000'

		chatpage: Web.Client
			route: '/'
			layout: pugLayout // using [pugjs](https://pugjs.org)			
				input.username
				input.chatroom
				button(onclick = enterRoom)

				div.conversations
					for (user, message) in currentRoom.conversation.orderBy('_timestamp')->:
						p {{user}}: {{message}}

				textarea.message-draft
				button(onclick = send)

			username: var
			chatroom: var
			messageDraft: $('.message-draft')->.value

			enterRoom: =>
				username := $('.username')->.@value
				chatroom := $('.chatroom')->.@value

			currentRoom: chatrooms[chatroom]

			if (connected)
				currentRoom.activeUsers <: username

			send: =>
				currentRoom.conversation <: (user: @username, message: @messageDraft)


everything is asynchronous
so no need to worry about javascript, synchronous vs callbacks vs promises vs async/await


Encapsulation

you can't modify variables out of scope
you can insert
but 

Testing and Mocking

everything is data
you can view all calls and clones going into a module

State Variables

`do` keyword

	joe: Student("Joe", "Harvard", do console.log(this.greeting)→)

(subject to change)

Firewalling

coming soon!

Meta-programming

coming soon!

## Final Words
