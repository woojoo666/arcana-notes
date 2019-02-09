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

The basic syntax is rather intuitive.

	x: 10     // define variables using ":"
	y: x + 3  // math expressions are supported

	someString: "hello world"
	someBoolean: true

	someObject: (name: "Joe", age: 20)   // objects are collections of variables
	someList: (1, 2, 3)                  // lists are collections of values

note that indented blocks have "implied" parenthesis around them. So

	someObject:
		name: "Joe"
		age: 20

is equivalent to the earlier definition of `someObject`. You can do the same with `someList`:

	someList:
		1
		2
		3

Also note that you can omit the commas for a list

	someList: (1 2 3)

Access nested variables using the `.` accessor

	someObject.name  // this will give the value "Joe", as defined earlier

Lastly, the keyword `undefined` basically means that you are trying to access a value that hasn't been defined. For example, if we try to access `someObject.height`, it will return `undefined`.

Because everything in Axis is data, there are no "errors" like traditional imperative languages. Bad code will never result in a program crash or a runtime error. Instead, a value will simply evaluate to `undefined`. For example, even if you tried to use property access on `undefined`, eg `undefined.height`, it would simply return `undefined`.

Parameters and Cloning

* prototypal

In Axis, we can clone objects and overwrite the object's variables. For example:

	// define an object
	division:
		quotient: p / q
		remainder: p % q

	foo: division(p: 16, q: 7) // clone it, overriding p and q

First, notice that in `division`, `p` and `q` are not defined yet. These can be considered object parameters. When we "clone" the object, we can provide values for these parameters

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
