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

### Insertion

* 

Modifiers

we come to a very important 

`do` keyword

	joe: Student("Joe", "Harvard", do console.log(this.greeting)→)

### Templates

we introduce the syntax template is ....
remember how earlier (FIND SECTION) we mentioned that any container object can block all outgoing calls? Well that's exactly what template does

Functions

* call operator

Private Keys

* not private vars

### Tags / Virtual Properties


Loops and Conditionals

Extra Syntax

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

This might seem extremely inefficient, with these feedback loops going back and updating previous variables. However, note that the dependencies in this example actually form a DAG (directed acyclic graph). In other words, there is no feedback. The order we should compute the variables should be `all scores => sum => average => all #aboveAverage tags`. This way, nothing needs to be computed twice. And this optimization is exactly what the interpreter would leverage to achieve the same level of efficiency as imperative code, without sacrificing the elegance of Axis syntax.

However, there are times where we can introduce feedback, covered in the next section.

(Note that to compute the total sum we could have just used `sum: Math.sum(...testScores)`, which is perhaps simpler, but the point of the example is to show the "timeless" nature of Axis)


chatroom example



### Feedback - Convergent and Divergent

Feedback is an extremely powerful tool that is only possible using dataflow languages like Axis. Although simpler forms are relatively common in imperative languages. For example, a cyclic data structure is just a feedback loop

	Bob:
		child: Alice
	Alice:
		parent: Bob

	console.log( Bob.child.parent.child.parent )->   // we can do this because of feedback

however, this is just static feedback code. What if we did something like this?
		
	unit:
	    km: m*1000
	    m: km/1000 | cm*100 | mm*1000
	    cm: m/100
	    mm: m/1000

* tree height


distance

note that in order to actually compute `graph.nodes` we have to use some complex recursion

	nodes: breadthFirstSearch((), this.root)
	breadthFirstSearch: visited, currentNodes >>
		if (current.length = 0)
			=> visited      // no more nodes to process, return all visited nodes
		else
			nextNodes: currentNodes[['neighbors']].subtract(visited)     // get neighbors of current nodes, minus already visited nodes
			=> breadthFirstSearch(visited, nextNodes)


but imperative code requires similar complexity to retrieve all nodes from a graph (either using a loops or recursion). The difference is that in Axis, after we retrieve all the nodes, we can use them in a whole variety of use cases, like computing distances (as shown earlier) or finding connected pairs or filtering for certain nodes, etc. We only have to define this recursion once. But in imperative languages, in order to do stuff like computing distance or finding connected pairs, we would have to use recursion over and over again.

This just demonstrates the power of abstracting data relationships away from implementation. We define the "implementation" once, to retrieve the data (in this case, using breadth first search to get all nodes). And then we can use the data without worrying about the implementation again. We maximize abstraction and minimize code duplication.



divergent feedback is like infinite while loop

### Web Technologies API Calls

chatroom example

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

(subject to change)

Firewalling

coming soon!

Meta-programming

coming soon!

## Final Words
