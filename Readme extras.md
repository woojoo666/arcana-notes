
A reactive programming language for designing distributed systems, information networks, and web applications

uses:

* mapreduce
* server herds
* social networks
* web apps



execution vs bindings (ordered vs unordered)


Philosophy
--------------

* reactive
* actor model
* prototypal
* dynamic typing

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



Every object defines a set of properties. And every object can interact with other objects in three ways: access properties, insert items, or clone the object.


### Cloning
An important way to think about defining or extending objects, is that **any behavior defined inside the braces will be duplicated during cloning**. So for example, if we have

	joe: Student("Joe", "Harvard", console.log(this.greeting)->)    // create a new student, and automatically print his greeting to console
	bob: joe(name: "bob")                                           // creates a new student and also log his greeting

notice that when we clone `joe` to create `bob`, the function `console.log(this.greeting)->` will be called again. This might seem counter-intuitive, because in imperative languages, function calls are executed before they are passed as arguments. However, remember that this is not a function call, we are extending an object, and defining new behavior. This distinction becomes extremely important in the later sections "Insertion" and "Templates", but don't worry, those sections explain this in more detail.



### Templates and Functions


this is useful for interacting with web apis and extending objects. For example, imagine if the Spotify API had a template for creating playlists, `playlist(name, description)`. What if we wanted to create a wrapper around this function, `datedPlaylist(name)` that automatically uses the current date in the description

	datedPlaylist: playlist template      // extend the playlist object without executing it
		name, timestamp >>
		description: "playlist created on " + Date.from(timestamp))
		console.log(description)->

	myPlaylist: datedPlaylist(name: 'my playlist', timestamp: Date.now())

Remember that when you clone an object, any behavior you pass in becomes part of the clone. Thus, if the clone is an object, then the behavior will be "executed". If the clone is a template, then it won't be executed. So in this example, `myPlaylist` is a regular object, it is "alive", so the `console.log` statement will be executed. On the other hand, `datedPlaylist` is a template, it is "inert", nothing will be printed to console.




We can declare templates inline, too:

	foo: playlist(template console.log("new playlist")->)


**functions**

A small note: if we did something like

	createPlaylist: playlist
		name, timestamp >>
		description: "playlist created on " + Date.from(timestamp))
		console.log(description)->
		=> this

Notice what is happening. We are creating a function from `playlist`, so it inherits all properties and behaviors from `playlist`, but doesn't execute. In addition, it won't execute when cloned. Only when we call it, will it return `this`, aka a "live" active version of the playlist. Using `=> this` syntax is a way to create "permanent" templates, aka templates that stay inert when cloned, and are only active when called using `->`.



### Private Variables as Keys

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


### Timeless

one of the biggest things understand, is that because everything in Axis is unordered and asynchronous, the language also doesn't have the concept of discrete execution steps, like imperative. Instead, we think of data as persistent and "timeless", and assume that every variable is constantly re-evaluated to keep the value up to date. To drive this point home, let's say we defined an event-handler to collect all mouseclicks:

	allClicks: collector

	onclick( click => allClicks <: click )

then we can treat this data as persistent and always up to date. Which allows us to do something like this:

	lightBulb: allClicks.length % 2 = 1   // lightBulb is true if there are an odd number of mouse clicks. So every click will toggle lightBulb



### Feedback


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


### Encapsulation

you can't modify variables out of scope
you can insert, but the object has to be a collector for them to have an effect

### Testing and Mocking

everything is data
you can view all calls and clones going into a module


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

