Axis Programming Language
==========================

A reactive programming language for designing distributed systems and full-stack web applications.

### Philosophy

* reactive
* unordered
* separate data structure from execution
* what the data structure vs how it is created

Axis is a dataflow/reactive language, which means that we define programs through data bindings, not execution statements. For example, if we had something like

	c: a+b

this is saying that the variable `c` is bound to the sum of `a` and `b`. If the values of `a` or `b` change, then `c` will automatically update to reflect that. Whereas in imperative, a statement like this is executed once. You can think of these "bindings" as continuously evaluated statements. You may have seen similar concepts if you have worked with AngularJS or ReactJS.

Because we are defining bindings, there is no execution order, like normal imperative languages. All bindings can be thought of as asynchronous and continuously evaluated. It does not matter in what order you defined bindings, they all "exist" at the same time. This makes Axis ideal for distributed applications, where everything is asynchronous.

In addition, this allows Axis programs to define data structures and relationships, without worrying about how that data structure is evaluated. In Axis, we define _what_ the data structure is, not _how_ to create it. **Axis separates data from execution.** This makes programming more simple and intuitive.

Everything in Axis is data. There is no execution, no instantaneous actions. All behavior is persistent and asynchronous.

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
	someObject.age = 20                  // equality operator is a single "=", so this will return true

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

### Parameters and Cloning

Axis is a prototypal language. So any object can be "cloned", allowing you to specify new properties and overwrite old ones. For example:

	// define an object
	division:
		quotient: p / q
		remainder: p % q

	foo: division(p: 16, q: 7) // clone it, overriding p and q

	foo.remainder // returns 16 % 7, aka 2

First, notice that in `division`, `p` and `q` are not defined yet. This is not a problem, and just means that `quotient` and `remainder` will start out as undefined. However, in `foo`, `p` and `q` _are_ defined, 

 These can be considered object parameters. When we "clone" the object, we can provide values for these parameters

* implicit inputs

Functions

* call operator

Private Keys

* not private vars

Loops and Conditionals

Modifiers


Timeless

Extra Syntax

* `someVal.` = `someVal: true` = `someVal: ()`
* spread operator
* capture blocks
* array map access
* dynamic keys

Examples

* test scores
* tree height

API Calls

Encapsulation

Testing and Mocking

State Variables




	DoogleDocs: WebServer
		client: session >> WebClient
			doctype: 'html' // default doctype for all layouts declared here
			layout: "..."
				<html>
				<body>
					{{user ? homepage else loginpage}}
				</body>
				</html>
			style: ""
			user: Users.find(session.user) // session is provided by the Browser
			homepage: Component
				layout:
			loginpage: Component
				layout:
