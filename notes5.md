Arcana Functions Brainstorm
===========================

started these notes on yellowstone trip

### Flight Notes

benefits of javascript style functions?
    one function scope, intuitive
    overriding defaults
        inverse function example, which leverages defaults
    you can use builder pattern instead of currying
        but more work, ugly to use everywhere

no point is using an unbound variable anywhere in the flow, unless you were going to bind it later
otherwise could have just used undefined

what if you had a branching function (so not all inputs given)
    branching functions can be made in 3 ways
        defaults
        dynamic
is input traversal dynamic? if the branch switches, then the input switches? and the binding?
    that seems a little too confusing
    but also kinda makes sense
    maybe number of inputs should be static
        input order is shown to user when he calls a function
what is order of argument added, if its a traversal? depth first? breadth first?

explicit declaration should override input propagation?

because inputs and outputs are declares in same scope, possible to add feedback?
    make an input based on an output?


PART 1
--------------------------------------------

Can't override lists
Use 0: 10, 1: 20 instead
This is how it's done in JavaScript as well

No distinction between "outputs" and properties
Properties are outputs
Check Implicit Outputs section
No need to "override" outputs
Output is -> someObject(args)
Wouldn't be able to access incomplete properties in someObject
Nylo used notation like fn(-> someObject(args).myprop)
But doesn't that look like passing a function?

For my version, if you want to override fn's "function scope" (aka the original scope it was defined in), you could do

...fn.scope( args )

`fn.scope` gets the parent scope, then calls it with `args`, and then `...` extracts the output

if we want to go up another scope

fn.scope.scope(args)[0][0]

Maybe we could have a special function

fn.call(scope: ..., args)
By default the scope is fn.scope

Could you make "function" do the same thing as fn.call?
So you could do

fn: function x y =>
    ...

You could also do

fn: divide
    temp:
    temp2:
    a, b

Well maybe we could use some sorta do-nothing function at the top, and it would work the same way?

fn: ()
   temp: 
   temp2:
   ...expression


hmm, you can...

And this actually gets rid of the need for input propagation
Instead of using input propagation, just put the inputs in the output!
Feedback takes care of the rest
Also note that this also allows us to modify the temporary function scope variables

Weird, because this goes back to the idea of mixed modules
Literally mixing the evaluation structure with the output
Just in a manner that I didn't expect
Using feedback
What was the reason I abandoned mixed modules anyways?

What about something like
foo: a(b(c(x,y)))? Where x and y are unbound
x and y look like they are bound to c, but we want them bound to a
Just bind them to the nearest variable being defined
Equivalent to
foo: x,y => a(b(c(x,y)))

All unbound variables are attached to the nearest scope?

How does function splitting work?

a, b, c: ...(fn1(x), fn2(y), fn3(z))
a, b, c: ...(fngroup(x,y,z))

No input propagation is nice because means that "unbound" is just syntactic sugar, but ultimately there is no weird behind-the-scenes action
It just tells the interpreter to declare these undefined variables to the output
But after that, it acts like any other undefined variables
(Aside from auto argument binding)

Does multiple outputs work now?

In the "Mixed Modules" section, while I had the idea of mixing evaluation history and output, I used "hanging values" (aka list items) as outputs, and still had the concept of multiple outputs
It seems like I was thinking about functions in the imperative style, with functions as objects with outputs, so a function with multiple outputs seemed reasonable
This became a problem when I started dealing with property access (see section "Property Access for Mixed Modules")
Should it access the function or the output?
Now that I'm treating functions and outputs as the same thing, this isn't an issue
But it requires a complete mindset shift, away from the traditional "function scope + function output" idea

Problem with this is that the inputs and temp variables show up in the output, which can be unideal when iterating through all properties of the output
We could make it so function scope properties can only be overriden, but not accessed
Next time you use the object as a function output, it resets the inputs

When treating the output as always complete, it is more like a prototypal lang (clone existing evaluation structures)
When using the concept of incomplete, it's more like a template system (define templates, then use them)
Template system is how we naturally think about defining patterns

Both these ideas rely on the idea that the inputs are different than the outputs
So this has to be a system built on top of the base lang

You can use prototype system to take a complete object, and turn it into a function
Is this necessary?
Two way?

Cloning a complete function:
Have an object, with defined properties
Have some properties that are evaluated

Have a modified version of the object
Want to modify one of the evaluated properties
Modify one of the steps in the evaluation

fn: a,b =>
    x: a+b
    y: a-b
    ...x*y

foo(mymembervariable1, mymembervariable2)
modifiedfoo: foo(y: ^y+1)
Hmm...


Binding to the nearest scope is basically like input propagation? Except one level up?

Spread notation works for multiple outputs, which can get messy

fn:
    ...x(a,b)
    ...y(c,d)

Fix Map function diagram. Doesn't use outputs, uses the object itself
    as in, in the map implementation `for item in list: list.add(mapFn(item))`, the `mapFn(item)` does not return the output of a function
    rather it clones the mapFn object with `item` as input

Even evaluated functions store input?
To make Turing machine, base lang only needs: properties, cloning
Doesn't even need dynamic keys

states:




Whether or not something is unbound, is up to the user. The function shouldn't know this
Though when yOu clone a function, it does preserve bindings
An object includes everything that is cloned
anything that needs to be cloned to preserve the object's behavior, can be considered as part of the object
That includes inputs, and even inner unnamed expressions
So object properties can be bound yet unnamed

Just because you can override outputs doesn't mean you should - Vish
Doesn't really make sense to override an output
Just access it using property access

### Mixed Modules - Checking Equality

Normal objects, the input and evaluation steps are all properties of the output object

What about equality? If we did something like:
fn:
    tag: "branchswitch"
    cond ? ...output1
    else ? ...output2

fn(true) == output1 

This will give false. In fact, it seems impossible to pass around and use references, because once you create a reference, you also create a new object. This is a problem for dynamic object keys. And this also wouldn't be a problem if we just used "result: output1", and didn't mix evaluation with output
Equality shouldn't care about evaluation. Only output.
Object != Output?
Sum(1,3) = sum(2,2) even though different objects?

It seems like my objects are combining inputs/evaluation and outputs. Which can be confusing
Some properties are both inputs and outputs? You want to access and override them?

### Mixed Modules - Property Collision, Namespace Clutter

I've been kinda worried that intermediate properties and outputs might collide
You have to keep track of what properties are in the output object, and make sure your temp evaluation variables don't clash
But actually, if you want to be able to override evaluation variables, then you have to make sure they don't collide
When thinking about matrix.product.... input, intermediate steps, and output are all part of it
You can use special syntax so they don't show up in output?

Objects represent more than their output, they represent their input and evaluation too. "x: sum(a: 2, b: 3)" stores more than the number "5", it also remembers the inputs. Because everything is persistent and dataflow. If say "x"  was bound to  other inputs, and those inputs change, it doesn't call the function again. Because it retains those bindings. It keeps track of what is bound to it, because who else would keep track of that?

This also factors into memoization. If we have multiple functions using "sum(2,3)", they can all just reference "x". 

Does this mean we have to factor inputs into equality checking?

If a "function" outputs an object, but includes all the inputs, what happens when you clone the object? You don't want those inputs in the clone, right? Maybe it should only retain inputs for one level? Maybe expressions should be treated differently from objects? Cloning fn_result vs cloning the entire function. When/where are the inputs relevant? Are they relevant after cloning?

In this new model, either you can have the inputs permanently part of the object, or not at all. Functional's function model (and input propagation model) allows for inputs that disappear after being completed.

You can create a function model, just make an object that hides variables once complete (local variables). How does this work with equality? How to declare such variables?

Iterating across all properties of a mixed modules, usually you just want output values?
Mixed modules get ugly once you start considering multiple chains of operations, where inputs are getting preserved across all of them, cluttering the namespace. If you had "fillNthRow: matrix, row, value => temp: value*value,  matrix()"
// TODO: CLARIFY THIS

Usually when you clone something you only want to clone the output. Cloning the input isn't necessary, as previously thought.

How to do Person.updateBMI
    updateBMI needs height and weight as inputs, but it needs to output a person, so the input height and weight will be mixed in with the Person's properties
    however, that isn't a problem because luckily, the height and weight should be properties of the output Person anyways
    so this is an example of where mixed modules _does_ work

Mixed modules are unintuitive, they are not how we naturally think about data structures. The core concept of functions is the distinction between evaluation and output

### Sticky vs Loose Bindings

I keep thinking that incomplete vs complete, unbound vs bound, all don't matter because all that matters is a functions structure. sum(2,3) is the same as sum(4,6), just with different values. But then I remember that everything in an object can be considered a binding, eg what functions are being used. If Matrix.product used the sum function, we could rebind it to some other function. Then it has the same structure, but different bindings. Is it the same function though? No, because the structure, as well as the bindings, all matter. Otherwise, all operators would be the same because they have the same structure (two inputs, one output).

Objects connect ideas. Bindings matter.

But then, when defining outputs, it doesn't make sense to allow people to override intermediate values. Because then you could turn any function into any other. If a function is determined by it's structure and bindings, then you can't arbitrarily change the structure and bindings and call it the same function. You can change the inputs though, because those were left unbound for a reason.

You can only access and modify properties of the object/output. Unbound inputs are just a special case.

Is unbound necessary? In the core language? Or can we have a language without it, and just implement it as a system on top?

Actually, you could have a model where bindings don't matter, only structure. "Loose bindings", template based, everything is unbound, no closures (pure encapsulation), greedy scopes. The only thing that persists, the "structure", is internal bindings and property names (maybe even that could be dynamic). Even something like "sum" can be dependent on the current scope.
Ex: the cables on an engine

"Sticky bindings", clones bindings, has closures. Example: the properties of an engine (color, size)

In imperative, functions arguments are like loose bindings. Scoped variables are like sticky bindings. Pure functions are templates. Objects and classes are like sticky bindings.

In the sticky bindings model, if you want loose bindings, just create a template in the blank scope, and all variables will be "unbound"

Maybe sticky bindings should only persist if the variable is still in scope? Wait but that's just loose bindings...so how would we override things like "sum" and have everything inside now use the new sum function? Any function that is cloned from the outside will still use the outside "sum"

When you clone a variables that clones a binding that is out of scope, it re-references it, like: "outer: (foo: x+1)" becomes "fooClone: outer.x+1)

Evaluation variables can be (1) just used to facilitate binding and structure creation or (2) used to specify variables that can be overriden

If we use "foo(scope.tempvar: 10)" we can override temp variables. We can also use "foo(scope: scope(x: 10, y: 20 ))" for multipe vars. Shorthand, "foo(scope := (x: 10, y: 20))"

Shorthand for overriding all inputs with undefined, force it to complete? Should we have dynamic arguments like "foo(...bar)" complete all arguments?

....

Outputs
Of keyword, "sum of (...)"
sum only makes sense in context
So if you extract it, it should hold into it's context too
You are extracting the property, not the value


Template model:
• Functions and classes
• complete the template, and you get a value/instance
Prototype model:
• Everything is an object

Persistent binds make prototype model make more sense
force: product(mass, acceleration)
we are "calling" product, and giving it two values
But even thought it is now bound, we still might want to use "force" as a function too
"Force" is just an alias
force and product have the same "structure", they both internally use *, just with different inputs
But remember earlier we noticed that bindings are part of structure too
The fact that both use * is a binding too
But * is in both contexts


mappings are like Analogies
Cloning out of context
Unbound based on context

Special "___.copy()" function that extends references, sticky bindings, so they still reference their old spots?

When is prototype model better than template model?
Maybe when you want to create a modified version of an existing object

Two ways of "calling", loose copy vs sticky copy. Loose copy is for when you want to 


### Part 1.5 (returned from yellowstone)

Hash as property
allows for mixed-node equality

things can be viewed as both an object and a property, sum vs Operation.sum
(a:10, b:20)sum
Duality
Add vs sum, combine vs combination, function vs output (the fact that the english language has this indicates it's how we naturaly think)

only when object only has one output?
a **self-named output**

sum:

relationship between two numbers and one output number

Math: a, b =>
    sum: a+b

if you pull out sum
you get the sum function





actually, this is basically the same as the "everything is outputs" idea I had before yellowstone
* when I came up with the input propagation idea
* it's probably better to think about `sum` as an output, and not as a property (even though their pretty much the same)
* `sum` is just the output of a "template"

`sum: a+b`
`x: 2+3`

these two are analogous

so the difference isn't between functions and objects
the difference is actually between unbound/bound
we think about unbound variables differently
`unbound` is a static property, its in the structure
    * even for dynamic mux style statements, it's still bound to the output of the mux
they work differently, and we think about them differently
perhaps they should have a special naming/calling system?
because even though you want to bind `a` in `sum`, it isn't the same as setting a property of `sum`
so the names shouldn't collide?

perhaps it's up to the user
if its part of evaluation but not part of output, you should use `_` prefix, eg `sum: _a + _b` and `x: sum(10, _b: 20)`
that way, these ugly names aren't part of the output, so they don't take up any useful variable names
if they are part of the output, then you can use normal names: `Person: (age, sex, location)`
this is still kinda ugly
the IDE should also distinguish between unbound and bound, different color highlighting






note that it's possible to have defaults, with input propagation model
just declare a variable as unbound, and then later use something like `x => y: x || 10`


Defaults is ugly
Defaults are like variables that are bound, but that we want to be able to override
Maybe it shouldn't be unbound vs bound
Maybe it should be overridable vs fixed variables
You can specify which variables are overridable
But what if everything is overridable, then it's
Dynamic scoping, where it will clone the entire tree branch if needed
Scope as an input
Variable names have a certain meaning already by the time it gets to the leaf, there is a node already attached to that name, so overriding that name should override the node
However, this almost ruins the meaning of scopes
No encapsulation
If you override an outer variable, does it override all the dependents as well?

You can override all sorts of variables
Ruins encapsulation?

Think about objects as just outputs of the object creation function



what is being cloned vs what is being referenced? inheritance vs scope?

what are all the ideas so far?
* incomplete vs complete
    * functions will reference their scope, until they are complete
* object vs function
    * functions have a function scope, for objects the function scope and output are the same
* unbound vs bound, propagation
    * only outputs propagate
    * everything propagates ( and I guess everything is cloned as well )
* mixed modules
* template vs prototype

what are the key rules we are thinking about
* encapsulation
* everything is an object
* incomplete and complete are the same
* unbound is the same as bound
* inputs are outputs

what are my goals?
* distributed (encapsulation)
* concurrent
* intuitive (speed doesn't matter)


----- begin Discussion with Vish -------

random code stuffs that we did during discussion

```js
Operators:
    x: c*c
    add:
        a+b+x
    subtract:
        a-b-x

add(c,a,b, bla: 10)

Person(age: 10)

def foo(a,b):
    i = a + b 
    return i 

myfunction:
    -a
    -b : a + 4

function myfunction(a = 10, b = 20) {
    return a+b;
}


OLD

fn:
    a, c
    b: 20
    return a+b
varx: fn(7)

fn2:
    c
    a: 7
    b: 20
    return a+b

vary: fn2()

fn(7) != fn2

fny: fn2

varz: fny(30)

c: fn2(a: 17)

------------------

fn2:
    c
    a: 7
    b: 20
    return a+b

fn3:
    a:10
    fn2(a)

-----------------

fn:
    a: 7
    c
    b
    a+b

fn2:
    a
    b
    a+b

fn != fn2(a: 7)
fn != fn()


sum: a,b =>
    mag: a*a
    mag+b

sumModified: sum
    mag: a*a*a


fn: a, b, c:10 =>

fn(7)(c:5)(10)


bla : fn(a:3, b:4)
bla(a: 20)

obj:
    a: 10

varx : fn2 // Returns function
vary : fn2(10) // Returns value a+b
varz: fn3


myfunction(20, 30)

myfunction: ...
    ~a: 10
    b: 20
    c: a+b
    ~d: a-b
    c/d
    // (num: a+b+c, x: "hello", y: "world")

myobject:
    temp: a+b 
    x: temp+c
    y: temp+d

myfunction(a: 20)

divide:
    numerator,
    denominator =>
    ()
        quotient: Math.floor(numerator/denominator)
        remainder: numerator % denominator


myfunction(c => num, x, y)
myfunction(c: 10, x: "bla").num = 10+20+10
_


// No distinction between input and local

foo:
    a:
    mag: a * a
    mag

varx: foo (mag: 10) // 10


// No distinction between input and local part 2

foo:
    a:
    mag: a * a
    mag+10

mag2:
    b:
    b+b
varx: foo (mag : mag2()) // returning a lambda equivalent to mag2

square: a => a*a
sum(square,10) = x => sum(square(x),10)
map(square) = x => map(square(x))


// With distinction between input and local

foo:
    a:
    mag: a * a
    mag

varx: foo (mag: b * b * b) // Error -

foo:
    a:
    mag:
    mag2: mag || a*a
    mag2



fun:
    val:
    val

fun()()()()()()()()()(5) ==== fun(5)

;
```

the way vish views functions:
    Functions are when you don't want to care about internals
    Internals are dead, evaluated
    It always returns a new function
    Evaluates as much as it can

----- end Discussion with Vish -----


### Default Values vs Currying

Currying and default values contradict each other?
Currying: once you give an input a value, the function returns the output
Default values: inputs can have a value or not, doesn't matter

Maybe we can view default values not as inputs, but properties
So you can override them as much as you want
A function with properties is like a semi-complete function, where some of the inputs have been given already

### Prototypes vs Templates

Objects are for using
But when you create a function, you are doing so so you can use it to create other objects
Like a factory
Or a template (? Not really?)
You declare inputs so you can tune them and change them, and create new objects
That's why you make functions: to create objects

Mixed modules fits with prototype pattern
You use the output object, and create similar objects

If you have multiple outputs, like 2 inputs that lead to sum and product, then it starts to look more like a normal thing, instead of a weird mixed module

Prototype pattern and mixed module allows you to create objects that change itself, does this break single responsibility rule?

Maybe one allows you to modify all the steps leading to it (aka the scope), and other allows you to access the object properties? Outputs?

Pure prototypal model
Inputs and outputs are mixed (no such thing as a function, where you give inputs and it spits out an output)
Only objects
Coffee (prototype) vs makeCoffee (function)
BMI vs CalcBMI
webpage vs createWebpage


Function based:
Create functions for the express purpose of creating objects
Eg a recipe, you would never serve a recipe to a customer
You use recipe to create dishes, to serve to customers
In protoype model, you create a dish, and modify the dish

In life, most of the time, we create specific instances, before identifying a pattern and creating a template

Function based allows for more distinction, separation
Eg output is a separate object

Map example:
Prototype-map, the outputs have to contain the inputs
Functions-map, the inputs have to have exactly one input

### Random Syntax - Operators and Parenthesis, Mixed Modules, Namespace Clutter

Note: if an operator given a spread list, it only takes the first one
(1,2,3)+4 = 5

This is different from using a list tho, because operators consume parenthesis, not lists
X = (1,2,3)
X+4 = undefined

Also it's special because one might think it's equivalent to
(1,2,3)+4=sum(1,2,3,4)
But it's not


What if we want to do a chain of operations
Add 3, multiply by 6, subtract 2, take the log, square it
Will it have remnants (namespace clutter)?
Not really, but there are examples we talked about earlier where you will have remnants


Possible to make private variables easier?
foo([privateVarA] : 10)
Possible to make it foo(privateVarA: 10)?
we used to make it so privateVarA, if unbound, has a default unique hash, so that it doesn't just evaluate to undefined
But then when should it read as undefined? Sometimes we want unbound to be undefined
Like when adding numbers
But maybe we can make numeric_value undefined, while hash_id isn't undefined
Variable names represent nodes, ideas, and each of those has a unique id
Actually variable names represent a reference to something
This is where the scope search function comes in


It seems like mixed modules work, but it feels like a hack
There's a reason actions and verbs exist in our language
Words like "rotate, add", they represent relationships between objects, not objects themselves
When you do Triangle.rotate(10), you aren't creating a rotate object, you're creating a new triangle
Same when you do Car.wash()
Actions makes sense in imperative, where you have a sequence of actions
But in Arcana, everything is set of objects
So where do actions fit in?
In dynamic languages, we do treat variables differently based on what they are, mental baggage
So it's fine if we have to think about functions and objects differently, and keep track of whether an object is a function or an object
Perhaps the (a: 10, b: 20)sum makes sense after all? Models anonymous object and relationship to output



Broadcasting
Got this idea when I was thinking about wireless charging
With wired charging, you can choose how much power goes to each person
With wireless, you can only broadcast a bunch of power, and it's up to the appliance to pull however much it needs
Maybe data should work this way too?
You can still have "keys" to private data that you hand out to specific people


### Choosing Default Values Over Currying

currying implies that the behavior of the function depends on how many inputs you give
default values implies that the behavior of the function doesn't depend on how many 

so now that we have to choose one, default values makes more sense
default values seems to fit more with the prototypal nature of the language
    * instead of creating a template with blank values, we create a prototype with default values
    * then we can clone the prototype and then override those default values
in addition, if we want to emulate currying, we can always use builder pattern
    * it's also more explicit exactly when the output is finally extracted


PART 2
--------------------------------------------

Construct the object

Context based on arguments
Create an argument scope, and then call a function, dynamically uses function scope

Color of car: car.color
Sum of two numbers: (1,3).sum

Hmm this feels like it's getting into a type system though

What's a function that combines arguments of different types, but doesn't have a "main" argument?
Creating any object
But that's not an action or function
Hmm, perhaps functions only *act on* objects
"Sum" is creating an object
Triangle.rotate is acting on an object
Though triangle.rotate still has arguments

Arguments are just related objects
Use AI to piece together the correct result?
Can reach as far back through the evaluation structure as needed
Rotate(angle: 30) vs rotate(facing: north)

AI prototypal collaborative dynamic outputs
normally, I'll use the highest voted way for calculating LCD
but if chaitlins parameter is specified, I'll look around, and ultimately end up using the chaitlin algorithm

Bob.rotation sounds like it's referring to the rotation property, not a function output

Persistence and prototyping go hand in hand, because only in a functional persistent language, does it make sense to preserve history, and preserving history is conducive to prototyping

"Square" naturally has an "x" property that defines it's absolute x position.
When you do foo = mySquare.translate(x: 10), it creates a new Square. But what does foo.x refer to? The absolute position, or the x-translation?
people expect foo.x to refer to absolute, but they also expect mySquare.rotate(x: 10) to refer to x-translation. How can they be different things in a prototypal language?
There's all these different ways of making Squares, Square.rotate, Square.translate, Square.flip, Square.scale
But if they were all just prototypes of a new square, then you wouldn't need all these different functions, you could just use one
The point of different functions is that they reference different arguments and parameters and evaluation


mySquare.rotate()
mySquare.color
Transformation.rotate(target: mySquare)
Square(source: mySquare, transformation: rotation)

Functions as parametrized references
mySquare[rotate(angle: 20)]
Rotate and translate are relationships with other objects, just like color
foo: bar.rotateBy20Degrees
Just generalizing it using parameters
This way the parameters are separate from the output properties

Square.color: gives it's color in a list of 3 values, using rgb by default
Square.color(format: hsl): modifies the request

myShapes.square: gives a default square
myShapes.square(color: red): modifies the output

Ambiguity, does it modify the request or the output?
Sometimes this is the same thing, which is why mixed modules made sense
But sometimes, name conflicts like the one for translate, show that they are different

source object, translate, and output object are all nodes
each node has their own x,y,z properties
functions are just shorthand for this, helping create connections between these properties

going from generic to specific is easy
mySquare.translate uses Transformation.translate(source: mySquare)
going from specific to generic...
Transformation.translate uses mySquare.translate but using the scope of Transformation instead of mySquare
if there are specific parts of mySquare that it wants to inherit, it has to do so specifically
alternatively, it could use mySquare.translate directly, but if there are parts of Transformation that it wants to inherit, it has to do so specifically

every time we define a property, we are making a reference, and we are always being careful whether or not there are conflicts, whether or not its confusing/ambiguous, whether or not it makes sense
arcana is a discrete graph of connections
an approximation of the brain, where everything is interconnected with weights
in arcana, the weights can only be zero or one


PART 3
-----------------------------------------


if relationships can be parametized, doesn't that make relationships behave like objects?
so maybe we can model relationships using objects?
instead of
    mySquare ---(translate)---> translatedSquare
do
    mySquare --> translate --> translatedSquare

after all, in a graph, we only have nodes, we don't even label edges (note that we can model weighted graphs using graphs)

---------- arcana.txt ------------

parametized references? maybe object names are just objects as well
nodes in a graph, unnamed
just like a neural network

lets say you have a green car
you start at one state, lets say "car"
then somebody asks "what color is it"
and it activates the "color" node
the color node and car node both activate surrounding nodes
if there are any intersections, those light up
so in this case, "green"

slight difference between name and name parameters
name takes priority
eg, if we ask for Bob's a "green car"
we would do Bob.car(green)
not Bob.green(car)

names reference objects
parameters are like adjectives/adverbs
what about prepositions?

parametized references are like, instead of referencing a single object, you reference a group
each parameter you give, filters down that group

instead of parameters, you can also just filter based on the properties of the objects referenced
its filtering based on properties of sub objects
mixed modules
Bob.cars gives a group of car objects
Bob.cars(color:green) filters for car objects that contain the color green
it actually is a filter!
you can either explicitly define a list of cars, or you can define a car generator function
explicit vs implicit


mySquare.translate(x: 10)

full:
full2: 0003 0011 0013 0020 0032 0072


explicit to implicit
start with hardcoding everything, and then notice patterns as they come about
YAGNI, don't need to make everything a function if it's only used once
don't need to make a class if there's only one instance
template based languages are for defining patterns, and then creating instances of those patterns
but often it's the other way around, we create a bunch of instances, and then notice a pattern later


((( META
I noticed that I work a lot from motivation
"it would be nice to be able to do this, etc"
but a lot of the time my motivations aren't clear
I'm not exact on what I want, I just want it to be "better" and have all these features
I need to make my motivations more clear
-- observation (human behavior tends to hardcode, and then notice patterns)
--> motivation (we should have some sort of explicit to implicit)
--> research (try a bunch of cases)
--> conclusion
I'm good at the first 1.5 steps, making observations, and thinking about "what would be nice is..."
I need to work on defining my motivation better (notice that even above, it's not clear, "sort sort of explicit to implicit"))
and doing research
)))

----------- end arcana.txt ------------

multiple ways
pour(water, into: cup)
water.pourInto(cup)
cup.fillWith(water)

but if we just reference the object cupOfWater, then it doesn't matter how we get there

likewise
2+3 = 1+4 = 5+0 = 5

functions are constructive
that is why we focus on objects
there are multiple ways to construct an object
that is why it is better to reference the output object, instead of the path to that object

but we still need relationships right?

so is it always better to use output objects? are output objects always nonambiguous, while output functions are ambiguous?
by ambiguous, I mean multiple functions actually mean the same thing
it feels like objects and functions are duals of eachother
so objects should be ambiguous in some sense too

if we think about graphs and topology, we can think of objects as points, and functions as paths between points
for every pair of points, there are tons of paths that go between them
but if we think about translating/moving a path around, there are tons of pairs of points that correspond to the "same" path

this relates to the "template" model of functions
turning a hardcoded evaluation flow into a function with parameters
in the topology representation, it is like being able to translate/move a path around
every parameters represents a dimension of movement, a degree of freedom

thus, it seems like the template model has the most merit anyways
earlier I talked about how in real life, we first hardcode a bunch of explicit evaluations, and then later we notice a pattern and formalize it
but this doesn't actually fit prototypal model
because if we haven't noticed the pattern yet, then the pattern wouldn't be in any of the hardcoded evaluations, so we wouldn't be able to prototype from them
it's like, say we are recording a bunch of people's BMIs
and then we notice, hey, BMI = weight/(height^2)
well we can't use any of the existing objects as a prototype, because this formula wasn't used in any of the existing objects

prototyping is like mapping
you take an existing object, treat it as a template, and map new values to existing parameters

(((semi-unrelated:
it seems like what's hard about developing this language, is it's in between design and math
there's no correct answer, and a lot of it is about what feels right (so math can't really help)
but the reasoning behind it is math
maybe I should be doing more math research, and I'm just being stubborn
)))

(((semi-unrelated:
how does group/field theory relate to objects and functions?
can everything be represented using objects (aka sets)?
prototyping is just mapping
)))

open question: what is the relationship between hardcoded, and generated? eg "Joe.getGreenCar" and "Joe.getRedCar" vs "Joe.getCar(color: <red or green>)"
kinda like caching
does this relate to the ambiguity concept


PART 4 - Cono and Knowledge Nets
-------------------------------------------


wrote these after I wrote the google doc Cono about creating/reinforcing connections in Common Knowledge

• knowledge net: directed complete weighted graph
• programs strengthen connections
• AI programs use weights and search? Hardcoded programs use static references
• properties names and parameters are just a search function
• that means that no currying

So what about passing in implicit functions? Like
map(a+1)
Can we pass functions at all, in this model?

perhaps we can use
bar.foo to pass the function
and bar.foo() to call it with no parameters
but then, bar.foo should also return the property value if it's a property, not a function
this could possibly work, if we treat objects as functions that return themselves

how do functions and function passing work in Cono, where everything is just an unnamed node?
if we have three nodes, "7", "square", and "49", how does it know to traverse in that order?
you give "7" and "square" as initial state, how does it know to move on to "49"?
maybe there is a top-level procedure going on, "print(square(7))", and that indicates that we want the "result" property of "square(7)"
this top-level procedure is present in the background as "square" and "7" is going on, and nudges the flow of the program towards "49", instead of all the other paths

State variables and escape operator.?
how would you do "translate"? there are 3 different references to the variable "x"

dynamic keys and parametized references, they allow us to create connections dynamically
creating connections is like defining functions

knowledge networks don't have named nodes
just nodes and weighted connections
when we use named nodes with strict connections, we are doing an approximation
if normal knowledge networks use search to traverse, arcana uses these hardcoded search jumps
that is what these parametized references are, hardcoded search jumps
so its important to note that, names are not a part of knowledge networks
they are used to label these hardcoded jumps
and it's only natural for these labels to be parametized


PART 5
---------------------------------------


primary goals (syntax I definitely want):

search.results and search.results(paginated: true)
Point(x: 10, y: 20).translate(x: 3, y: 4) = Point(x: 13, y: 24)
list.map(x+1) // x is unbound, so implicit function
(a (b c)): a+b+c OR (a (b c)) => a+b+c // matchers

secondary goals:



implications (what should happen if...?):

list.doubleMap(x+1, x*2) // x is unbound. is it two functions? or a single function returning a list?

doubleMap: fn



myfn: // Nylo arrow syntax
    a, b
    => a + b

this is equivalent to

"myfn":
    (a, b): a + b

this("myfn")(10, 20) = 30

but if we allow implicit inputs, that means we can take out the (a, b) input declaration
but then it becomes

myfn:
    a + b

but this is ambiguous, because it looks like it could also be

myfn(a, b):
    a + b

I think it actually be equivalent to the above^^
the implicit inputs are attached to the nearest property key

in fact, for the earlier example:

myfn:
    (a, b): a + b

if we wanted to use implicit inputs, maybe it would be

myfn:
    : a + b

WEEIRDDDD
the arrow looks better here

myfn:
    => a + b

also, I think you might need ellipses for some of the earlier code snippets


myfn(a, b): ...
    a + b





how do we handle lots of default values

myfn(parameter1: 10, parameter2: "hello", parameter3: paramter1 + parameter2.length): parameter3*parameter3

this is super ugly

the ... notation is different because
the properties in between disappear
but is that how they should be handled
if we do something like
bla: a: 10, b: 20, a+b
are the properties in between ignored
or do we do it like Nylo's arrow syntax
where everything is kept, and everything after the `:` is treated as part of the output object

if we think about it in terms of structure, not syntax
we have:
1. source
2. reference
3. target

the multiple ways we have to represent
just going by intuition and seeing if we have an inconsistencies

name: output
name(parameters): output
"name"(parameters): output
(matcher): output
name
    parameters
        output

name
    parameters
        parameters
            parameters
                output

matcher
    matcher
        matcher
            output
    matcher
        output

notice the difference between the name+parameters syntax, and the matcher syntax
in the name+parameters syntax, we put different parameters on each line
we'll probably need a special marker for the output line (which is where Nylo uses the `->`)
in the matcher syntax, different matchers are on each line
so we need to be careful, to distinguish between whether we are treating each line as a parameter for the previous matcher, or an entirely new matcher

if we follow the rule that indentations = parenthesis, then we can represent name+parameters like so:

"name"
    parameter1
    parameter2
: output

though this is pretty ugly
maybe the arrow is short for this syntax

"name"
    parameter1
    parameter2
    => output

also, how does our old matcher syntax factor into this?
stuff like:

isEven(x): x+1

these use booleans

perhaps keys are actually references to matchers that match on equality (discussed earlier)
that way we can do stuff like

cat | dog: "animal"

or maybe we should just enforce strings everywhere

"cat" | "dog": "animal"

I think the main complications are coming from how we deal with unbound symbols
with something like this

foo(a, b): a+b

`foo`, `a`, and `b` are all unbound symbols, but `foo` is treated as a string


### Global Symbols II

maybe all symbols actually point to global symbols
and global symbols have string values
this kinda works into local variables
so something like

foo(a, b): a+b

`foo`, `a`, and `b` are all unbound symbols

when you call `foo(10,20)`, it passes the filter `foo` and then overrides/shadows the values for `a` and `b`
if you declare a local variable "foo" with a value, then it will use that value instead as the key

it works the same with the `.` accessor
if you did something like `foo.bar`, it's equivalent to `foo(bar)`, so if you declared a local variable giving a value for `bar`, then it will use that value as the key
so you have to be very careful about local variables

but this means that every time you want to explicitly declare a "public" property, you have to explicitly use strings, and use the parenthesis accessor

"foo":
    "bar": 5

x: ("foo")("bar")

this is super ugly

I guess in javascript, explicitly using strings is also pretty ugly

this["foo"]["bar"]

so I think we have to decide
are local variables going to be commmonly used enough, to be the default?
or should public variables be the default?

I think local variables get a bit messy, because often things aren't used in the same place they are defined
often we have objects that we pass around everywhere, and want to be able to access the properties from anywhere, without worrying about the surrounding scope

also, you wouldn't be able to do stuff like

foo.foo

because when you define it

foo: // this key uses the global "foo"
    foo: // this key references the previous "foo", not the global "foo"

but when you use it

foo.foo // these will both reference the same "foo" key





parametized references means the local key parameters aren't in the same scope as the output
so the output can't directly use the key parameters
seems counterintuitive
naturally we would want to be able to reference the parameters in the output
instead of having to do something like `key.myparameter` every time
maybe we can tweak scope to include key parameters
but we can't do that all the time, otherwise we always have to worry if a key is passed in with extra properties that collide with the variables used in the output
so maybe it should only look at key parameters declared in the scope of the output
this is kinda going against the whole "doesn't matter how you define it, only data matters" idea we were going for





name
    parameters
        parameters
            parameters
                output

the Square.translate translate.x example doesn't work past one level

Square:
    x, y
    translate: x, y
        => Square
            x, y // <----
            innerSquare:
                x, y
                // how do I reference the variables indicated by the arrow?



if `foo` is equivalent to `this("foo")`, then notice that, for scoping to work like normal, then it has to be able to search through the scope hierarchy, so `this` must contain all the variables of parents scopes as well
this relates to our earlier ideas about scope passing





name
    parameters
        name
            parameters
                name
                    parameters
                        output

if we can reference names higher up the hierarchy
then we should be able to reference matchers too
but that gets super messy
that means, any matcher in the hierarchy will basically override everything underneath

(x, y):
    mag: x*x + y*y
    foo:
        bar:
            (3, 4).mag = 25 // should this be possible?
            (10) // does this reference the top matcher?

actually, even more ambiguity
because (3,4) looks like it's creating an object
to maybe, to "call", you have to specify a source, like `this(3, 4)`
if you don't specify a source, it creates an object by default


I don't know why I didn't notice it before, but cloning clashes a lot with property access

strObj: "hello"(x: 10, y: 20)
foo: bar(strObj) // are we accessing the property "hello", or cloning using the string's properties?

though we could make cloning a special method, like in Java

foo: bar.clone(strObj)
foo: bar.extend(strObj) // alternative

it's a bit ugly to have to use a special keyword every time

maybe we can use the "+" operator

foo: bar+strObj
modifiedFoo: foo+(x: 10)

still a little ugly, but it kinda makes sense because you are "adding" properties
might present ambiguity when it comes to string/number objects though

ten: 10(msg: "hello")
twenty: 20(msg2: "world")
output: ten+twenty // are we adding the numbers? or merging the properties?

bar{strObj




scope is weird
using "parametized references" makes it seem like the parameters are passed in, and thus belong to the scope of the caller
but most of the time, we want the parameters to be in the scope of the callee, the source
keys are in the source scope
values are given by the caller
this was handled well with Nylo's model


alternative way of thinking about it
everything has a name, can't use objects as keys
parametized reference, but functions are just "result" parametized
so functions are just property access

myfn(10, 20) is just short for myfn.result(10, 20)
so everything is an object



another way of thinking about it
property access is just a special function call

myfn.result(10, 20) is just short for myfn(key: "result", 10, 20)

this way, it doesn't interfere with cloning, as long as you don't clone with the reserved property name "key" 



are there some fundamental differences between how we think of
1. references/properties
2. functions
3. cloning/extending/modifying

some difference off the top of my head:
* for references, you are asking the object for something, for functions, you are giving it something and getting the result
* for references, the "template" for the parameters is in the callee scope
* for functions, the "template" for the parameters is in the caller scope



functions have 3 parts, the parent scope (source scope), the body (intermediate scope), and the output

Square:
    x, y
    translate: x, y =>
        return Square
            x: Square.x + translate.x
            y: Square.y + translate.y



if the standard way of defining references is

foo:
    reference1:
        msg: "hello world"

then perhaps a parametized reference should look like

foo:
    reference1(x):
        msg: "hello " + x

to match the call to it

foo["reference1"(x: "bob")] or foo.reference1(x: "bob")

but then there isn't a scope for the function
also, what should reference1.x refer to?

This ^^ syntax allows for function parameters to be different from output properties
So you can do things like Point(x: 10).translate(x: 3) = Point(x: 13)
Not as powerful as an intermediate scope tho
Intermediate scope allows for private/local variables
But don't we already have a way for private/local variables?
Using symbol properties?
Is it really the same?
You can always just name your intermediate variables appropriately so they don't clash with the intentional output properties


if we don't allow extraction of the function, eg
foo.fn != foo.fn()

then it's not a first order object anymore
if theres no function passing

javascript has no currying, but it has function passing

if we follow Nylo's model, foo.fn(...) to get the output, but we can also do foo.fn.x to follow a reference
so the (...) is like another reference


We are used to thinking of fn(...) being a function call, where you need the parenthesis to "execute" the function
But maybe we can change that
The parenthesis is merely for modifying
So in this case we are modifying the reference
Though how would we modify the output of the reference?
if foo.bar returns the output of the reference, then doesn't foo.bar(...) modify the output, and not the reference itself?

Imagine a start house, and a destination house, and a taxi that takes you there
That is like a reference
Now imagine a row of destination houses, and you give the taxi a number indicating which destination house you want
That's the parameter

Difference is that, with intermediate scopes, you can construct structures while creating references, instead of only being able to reference things that are already constructed

Nylo's syntax is a simple way of separating function scope from output scope
notice how lone symbols evaluate differently if they are before or after the =>

foo:
    x, y // explicitly declared unbound symbols
    z: x+y // intermediate variable, or a default value, depending on how you look at it
    =>
        x: foo.x+10 // output
        y, z // list values

alternatively, maybe we can make the definition match the call

foo(x, y, z: x+y):
    x: args.x + 10
    y, z

foo(10, 20)

however, intermediate variables can get too long to fit on one line, and this will get ugly



we actually already had support for parametized references, because earlier we talked about how keys can have subproperties too
// FIND SECTION REFERENCE
in ^^^this section, we talked about how you can inspect a key to find out more about it
eg, a number, with a "type: time" property

in this case, it might make sense to be able to do things like
car.color => returns default color
car.color(format: cmyk)
because you are just adding properties to the "color" reference

sometimes, it shouldn't matter whether you have properties attached or not
if you had
Bob:
    name: "Bob"

it shouldn't matter if you have some small metadata tags attached to the key
eg Bob["name"] vs Bob["name"(origin: SpotifyApp)]

however, if you want to change behavior based on a parameter, you can

Bob:
    name: "Bob"
 
Bob:
    name(type: "String", length: n):
        "Bob" + n

this is starting to look like ocaml matchers

actually, in the above example, `type: "String"` acts like a filter, but suppose `n` already has a value in the current scope, then won't `length: n` act like a filter too?

Bob:
    n: 10
    name(type: "String", length: n):
        "Bob" + n

we should actually just be using "length" directly

Bob:
    n: 10
    name(type: "String", length):
        "Bob" + length

you can also leave out the property name and define a object key, like so:

Matrix:
    (x, y): this[x][y] // converts Matrix[10, 20] into Matrix[10][20]

however, note that there can only be one of these "nameless" references, because if we have multiple

Matrix:
    (x, y): x+y
    (x, y, z): x*y*z

then which one should it use? eg if we did Matrix[10], it could be calling either of them

so now, how do we pass functions around?
if passing functions is like passing references, then we should also be capable of passing parametized references
as in, not just passing around Math.sqrt, but also passing around Math.sqrt(tag: "hi")
this is starting to feel like currying

we could pass around the source and key separately

source: Math
key: "sqrt"(tag: "hi")

x: source[key(tag2: "world")]

actually, in the earlier example

Bob:
    name(type: "String", length):
        "Bob" + length

`type: "String"` is not a filter, it's a default value
a filter would be useful here though
maybe we can do

Bob:
    name(type = "String", length):
        "Bob" + length

note that this can help with nameless references

Matrix:
    (x, y): this[x][y]
    (x, y, z is defined): x*y*z // only called when z is given

we can always put these filters in the body of the output though...

Matrix:
    (x, y, z):
        if z is defined:
            x*y*z // only called when z is given
        else:
            this[x][y]

because sometimes we want to imply inputs without declaring them

Bob:
     greeting: // implicit input: otherPerson
        if otherPerson is defined:
            "hi " + otherPerson.name
        else:
            "hello."


yeah I think trying to combine filter and properties might be abusing property definition
trying to make it do too much

when we want to reference the reference scope, we can do

Square:
    x, y
    translate: x, y =>
        return Square
            x: Square.x + translate.x
            y: Square.y + translate.y

but how do we do this with nameless references?

Matrix:
    (x, y):
        x: ???.x + 10

note that something like car["color"(format: cmyk)] technically returns an object like any other
so its equivalent to
car[type: string, string_value: "color", format: cmyk]
so would it trigger the nameless reference blocks? should it? maybe nameless references automatically exclude objects of type "string"?

what is the point of a name anyways?
definitions vs usage

definitions have 3 parts: source scope, parameter scope, output scope
definition structure reflects this
usage has to be able to chain:
    bla(1).foo(10, y("hi")+2).bar

names are for creating bindings
parametized names for structuring binding creation
but filters/matchers sort of work into this too
the body/value of the property is the structure, the actual content
the name is just a way to refer to it
doesn't necessarily relate to the content
this is why we can use aliases, eg
    foo: 10
    bar: foo
in this sense, maybe filters/matchers make sense
just another way to refer to the content
instead of saying
foo: 10, bar: foo
say
(foo | bar): 10


perhaps we can pass around references, use them like first order objects
basically, we want to be able to do something like
Math:
    sqrt: x => internal_sqrt_fn(x)
foo: Math.sqrt
foo(16) = 4

the last call is equivalent to foo(x: 16)
which is almost like foo[x: 16]
so perhaps passing around referencing is just shorthand for creating an object with a dynamic key

foo:
    [key]: internal_sqrt_fn(key.x)

perhaps currying can use a similar mechanism

however, we don't necessarily have to treat foo(x: 16) the same as foo[x: 16]
we could enforce that the `.` accessor is needed for it to be treated as a reference
otherwise it's just cloning
if so, then we need to find some other way to pass around references

when we do Square.translate(x: 10), are we
returning Square.translate, and then cloning the result
parametizing translate before returning the result?
perhaps we need two types of parenthesis after all
that way, we can use the cloning parenthesis to indicate that we have finished the reference
other symbols, like `,` and `+`, also indicate that the reference is done
note that it doesn't make sense to parametize a reference multiple times consecutively, like Square.translate(x:10)(y:20)
so perhaps the first set of parenthesis also completes the reference



lets define some concrete examples for
* cloning complete objects
* using incomplete objects



a single statement can represent a many-to-one tree structure
if you want to create cycles, or create one-to-many structures, you need to use names and multiple statements


the concept of functions and parametized references comes from our desire to isolate the output from the construction parameters
for car.color vs car.color(format: cmyk), we could just make `format` a property of `color`, and this would work fine using current syntax
but for something like `Math.sum(a: 10, b: 20)`, we don't want `a` and `b` to appear in the output
at the same time, this also works using current syntax, because we would never just do `Math.sum` without parameters
can we find a reasonable example where we would want to isolate output from construction, but also have default values for the construction?
perhaps
Square.transform(scale: ..., rotate: ..., translate: ...)
each of these properties has defaults, so that you can omit them
default is (scale: 1, rotate: 0, translate: (x: 0, y: 0))
so you can do stuff like
Square.transform(scale: 2)
Square.transform(rotate: 10)
but technically, if you do Square.transform(), it just uses all defaults
how do we treat Square.translate vs Square.transform()?
how does this compare to car.color vs car.color()?
doesn't seem right because for Square.transform, nobody would leave _all_ inputs as default
can we think of an example where all construction values have defaults, and it is reasonable to leave them all as default during usage?

maybe HTMLElement.children
we can do
HTMLElement.children(type: "div")
in fact, many functions that return lists of objects, have construction values with defaults
like Search.results vs Search.results(paginated: true)
so is it a property or a function? can it be both?

note that, normally, the Search example is just done with Search.results vs Search.paginatedResults
that way, you don't have this property vs function confusion
but results(paginated: true) is just another way of saying resultsPaginated
they are both just references
the difference is that the behavior of Search.results(paginated: true) is defined within the behavior for Search.results

or maybe if you accidentally execute e a CLI script as an executable
can be thought of as a direct call without parameters?


maybe we can have a special property for cloning
like foo.clone(bar: 10))
or foo*(bar: 10)
this way, we can still use parenthesis
but calling and cloning don't interferere with eachother

do dynamic properties/keys interfere with cloning?
if we made Matrix[x: ... ,y ...], then what happens when when we do Matrix(x: ..., y: ...)?

doesn't make sense for references to have references/properties themselves
so when you pass around a reference, you shouldn't be able to access properties of it
you can only give it parameters and complete it

note that you can't pass in list values to a clone (doesn't do anything), but you can to a call

setting some ground rules:
you can't "call" objects
you can't clone references?
references don't have properties
objects don't have parameters?

does this give any insight to how the syntax should work?

"functions" are like incomplete references
all you can do is complete them

doesn't really make sense to access properties of a function
because how does that make sense in terms of incomplete references?
foo.bar(x: 10) is like foo[bar(x: 10)], but then what about
bar2: foo.bar
bar2.x
if bar2 is an incomplete reference, then after you extract the property, what happens to the reference?
foo[bar.x] isn't the same, how would you get "x" out of the brackets?

we need some way to indicate the "completion" of a reference
eg, if it was $, then we could do stuff like
foo.bar(10)$(hello: "world") // extracts the bar(10) property of foo, and then clones it with the property `hello: "world"`
foo.bar(10).x$ // equivalent to foo[bar(10).x]
bar2: foo.bar(10) // notice that the reference is left incomplete
y: bar2(20)$ // now it's complete
the last couple examples show an issue with this though
we have to add the $ every time theres a dot accessor, so the third line should actually be
`foo.bar(10).x$$`
    we have to complete the `x` reference first, before completing the `bar(10).x` reference

can objects have parameters?
isn't foo.bar(10) equivalent to foo["bar"(10)]
but what does 10 get mapped to? The string "bar" doesn't have any unbound parameters

Retroactive modification?
foo.bar returns the result of bar unparametized
Then foo.bar(10) adds parameters
It's kind of like how the statement "return my shirt" 

"Return my shirt washed" vs "return my shirt and then wash it"
First one modifies the request
Second one modifies the return
So perhaps, what we need is something to complete the reference, only if there if you are using the returned output in the same statement

Any actual examples where we would do complex statements as a key, and not in the function body?
Something like
foo[(bar(baz).hi+10).val]
And why couldn't we use bracket notation for this?
Simple function notation, "key(params)" works in 99% of cases I think, and we can use bracket notation for the rest

if functions don't have property access, then we can make property access immediately "complete" the reference
eg:
    Search.results(paginated: true).first // parametizes, then gets first result
    Search.results.first // completes the references without parameters, then gets the first result

fuzzy queries
so normally, references are strictly defined, and you call it directly, and it returns one thing
we can think of a more dynamic method, where even if the result isn't explicitly defined, the "closest matches" are returned
it will dynamically try to guess the most logical thing to return
first instinct is to return a list of possible results, like a Google query
but a list is a rather arbitrary structure
we could instead return a weighted list, weights based on "relevance" or "confidence"
but the most generalized behavior is to return a structure
the structure can be anything, a list or weighted list or single result
in fact, all three parts to the query are structures
1) the context
2) the query
3) the result
this is how the brain works
we have an initial set of activated nodes
external stimulus activates a different set of nodes
the result is a new set of activated nodes
this seems like an important concept for Cono
but can we integrate this into Arcana?


PART 6
-----------------------------------------------


right now we've been treating functions as parametized references
however, we can't just treat foo(...) the same as foo[...]
because foo["test"] is not the same as foo("test")
so previously, when I talked about doing using dynamic keys/properties to define function behavior, that doesn't really work

maybe we can use "foo()" "foo( )" or "foo(...)" to indicate that we want to return a function, not follow the reference

so what is a function? what does foo(args...) represent?
short for foo.ref(args...)
has a hidden source + query
completes the query, gives it to the source, and returns the result
note the existence of this "hidden" source

module:
    foo: a, b, c => a+b+c
    bar: Math.sqrt()

foo and bar do *not have the same source* (?)
foo is a normal query, source is `module`
bar is an incomplete reference, source is `Math`
well, note that foo uses syntax that we haven't fully decided on, and it looks like a function here, so maybe it does act like an incomplete reference...
so then, what is foo's source?


when defining references:
    foo:
       "bar": a, b, c => a+b+c
"bar" is like a filter
so if we want to handle arbitrary objects, maybe we should allow filters for that as well
aka matchers (which we kinda already have)

foo:
    isEven: a, b, c => a+b+c

foo[2(a: 10, b: 20, c: 30)] = 60
foo[3(a: 10, b: 20, c: 30)] = undefined
how do parameters play into this?
right now the reference in foo is structured with the filters first, and then the parameters
but what if we want to mix the filters and parameters? add a filter based on the parameters?
something like

bar:
    a > 20, b < 10, c = a/b => a+b+c

bar[a: 30, b: 5, c: a/b] = 41
bar[a: 30, b: 5, c: 0] = undefined

however, it's important to note that, in the foo example earlier, a,b,c are parameters of the first key
whereas in bar, a,b,c are all keys


remember that we established earlier that functions can't have properties
So maybe it's okay if functions look like brackets
The filter might overlap with dynamic properties and references but that's just something you have to handle
after all you aren't supposed to be using properties and reference names with functions anyways
but then how are you supposed to define intermediate properties? in the filter?


Continuations, why they are useful
Structure, easily add stuff to the leaves of computation
Builder pattern?

can you return functions using the current model?
_should_ you be able to return functions?

normally, in the old diagram based language, we only had objects
you went from object to object by following references
Alternating between object and reference
But now we are allowing variables to represent "partial references"
Which means we can pass these around as well
Does this allow us to go from object->reference->reference->reference? Breaking alternation?

Perhaps partial references are actually objects themselves
Except instead of lots of properties, they have one giant dynamic property
this might be why we need the special operator `(...)` to turn a reference into a partial reference
we are converting a reference into an object

in the implementation, I might use the OneBracket as base language and just use accessor pattern to implement functions and partial references
but that begs the question, are parametized references actually necessary?

Seems like we are overcomplicating things
Functional languages worked fine with just normal symbolic names
Is there any reason we actually need "parametized references"? Or is it just a useful construct?
Is there really a reason why functions can't have properties?
Why we cant make functions objects as well?
Even in the diagram syntax, we have objects with "unnamed" outputs that acted like functions, but they had properties too

Important to note how we got to the idea of functions as parametized references
It came after I realized functions should only have one output
And functions have one source too
References also have a source and an output, so it just seemed to match

However, functions don't necessarily have to have just one output
In the diagram syntax, objects could have multiple unnamed outputs
In retrospect, the "functions should only have one output" conclusion really came from the restrictions that typed syntax added
In typed syntax, it was hard to account for functions with multiple outputs

so it's important to note how the restrictions of typed syntax affected the structure of the language
there are all sorts of ways to represent computation
set theory, turing machines, lambda calculus, etc
right now, we are trying to find the balance between
    1. math and computation
    2. human intuition
    3. typed language

if we are treating functions and references the same (aka () and [] brackets are the same)...
then is there any interference?
now foo.hello = foo["hello"] = foo("hello")
is this ever a problem?

if we use can use filters for references, then what if two filters collide?
eg isEven and isPrime collide if input is "2"
this is like if you try to define two properties with the same name
it returns undefined?
this is more evidence that we can't just throw an error if a module contains properties with the same name
because if two filters collide, it's possible that case will never happen
eg if the module with isEven and isPrime never has to deal with the input "2"


earlier talking about mixing parameters and filters
perhaps we can use syntax like this

foo:
    isEven(a,b,c): a+b+c

i've actually been considering this syntax for a while now, but haven't explored it yet
this really emphasizes how a,b,c are parameters of the key, and not keys themselves
also, looks similar to function syntax, so it's familiar
works like a matcher, where unbound variables in the reference name are treated as parameters
so you can use this for multiple keys with parameters

baz:
    hello(a, b) world(c, d): a+b+c+d

baz("hello"(1,2) "world"(3,4)) = 10

or even filter complex structures

tinytreesum:
    ((a b) (c d)): a+b+c+d

tinytreesum((1 2) (3 4)) = 10
tinytreesum(1 2) = undefined

maybe we could even do recursive structures

binarytreesum:
    (a = binarytreesum, b = binarytreesum): a+b // hmm not sure if this works

ehh not sure if this is possible

note that the parenthesis syntax (eg `foo(a, b): a+b`) works nice for matchers
but it gets ugly if you have a lot of parameters, or parameters with long names or default value
and you have to break the parameters onto multiple lines
javascript, python, java, all have this problem
Nylo's arrow syntax shines in this regard
looks nice even if there are a ton of parameters



notice how we seem to be treating single tokens/hanging values

"foo"(a, b): a+b

if its undefined, like a and b, treat it as an input
if its defined, like "foo", treat it as a filter (testing for equality)
so in the above example, if we call "foo"(10, 20), it passes the filter, and 10,20 are passed in as inputs

so perhaps, we enforce this, and force property names to be strings, to make it clear that they are filters
so instead of 

BobPerson:
    name: "Bob"
    age: 32

which makes it look like BobPerson, name, and age are all inputs
we instead explicitly declare them as name filters

"BobPerson":
    "name": "Bob"
    "age": 32

this is starting to look like JSON

however, remember that we are extending the idea of variables/references into filters in general
so what about referencing variables in scope
eg, in old syntax:

a: 20
foo:
    b: a+10

notice that the `a+10` reference the variable `a` using a symbol, not a string
so if we turn property names into strings, what does this become?

"a": 20
"foo":
    "b": ("a")+10

hmm. this could work...but ugly as heck
also, ("a") could also be interpreted as a singleton set, so that could be an issue
    you could use this("a") instead, but now its even uglier
so I guess maybe this is what symbols are for
`a` is short for `this("a")`
actually, short for `scope("a")` because it could be referencing a variable in a parent scope

in foo(10, 20), the property key is a list of (10, 20)
in javascript, this would be foo[ [10, 20] ]
however, for foo.bar the property key shouldn't be thought of as a singleton list, foo[ ["bar"] ]
it should be foo["bar"], aka the key is the string itself
so maybe foo.bar is different from foo("bar")
but then again, sometimes we also want to use a variable directly as a key
foo[mykey]
and since we aren't using square brackets anymore, the only realistic way to represent this is foo(mykey)
so perhaps, when there is only one item, it's treated as the entire key
but once you have multiple items, it's treated as a list/set
if you actually want a singleton list, you have to specify it explicitly
foo( ("bar") )


Part 7
--------------------------------------------------


Now that references have their own parameter scope
It's all starting to seem a bit too complicated
Thinking back to the diagram syntax
I really only used labels, aka strings as property keys
Everytime I wanted to create a module inside a module, I just created one and gave it a name
Didn't worry about "parameters" or "parameter scope"
Sometimes I would use objects/modules as labels
Never really made it clear how that worked

If we have dynamic types
And no primitives
Everybody goes back to the "object" type
Then it doesn't make sense to restrict reference names to strings
Because the base language shouldnt have types
Types like strings and numbers are just implemented on top

Are labels/tags necessary?
Can we just use sets, unlabeled?
What functionality do labels give? Perhaps conditionals?
We need to develop a strict mathematical model
Kind of like the progression of FSM->PDA->TM
In our model, what is an output?


-------------- INSERT SKETCHBOOK NOTES 9/2 to 9/3 HERE ----------------

### Structure and Behavior 1

feedback vs recursion
recursion requires labels
also allows for copying
beyond explicit definition


function, labels can only be strings
can't be dynamic, or objects
what would our language look like without dynamic labels
only strings
can we still achieve everything?
yeah, using accessor pattern to emulate functions


intermediate scope

multiple layers
bla
   =>
        x: bla
        =>
            y: bla
            => x+y

if we have this idea that there are "default" outputs
how far out should it return
same issue with references, like Search.result


how does cloning work now?
if we have like, Shape.Square
Shape.Square(size: 10) won't actually clone a Square with size 10
it will modify the reference
Shape("Square"(size: 10))
though I guess you could make it "transfer" over to the output
but mentally, we are thinking that its a cloning
not a parametized creation
if theres a difference between cloning and parametized reference, we should have a way to get the reference, and clone it
currently there is no way to do so, without parametizing the reference, like
Shape.Square()(size: 10)
this is where it would be useful to have cloning as a property, eg Shape.Square.clone(size:10)
maybe we can use an operator like #
Shape.Square#(size: 10)
Actually this doesn't completely work because what if the result of Square() is a function
For example:
Math.getFn("add")(2,3)
Let's say the default of getFn returns add. So we try to use the default:
Math.getFn(2,3)
But now it looks like we are calling getFn with (2,3)
We can't use # here because we aren't cloning the result of getFn
Maybe we can use "." to finalize it
Math.getFn.(2,3)
Still kinda ugly, not too bad though



input/output
private variables
specify that certain variables shouldn't show up in output
that way you can simulate like private variables
however, translate() wouldn't work
because you want the output to be a normal Square object
that you can clone like any other Square object


What happens if we restrict to:
Finite number of static references
No parameters
No dynamic access either, so you can't do stuff like MyArray[10]
However, you can do MyArray.get(index: 10).result
I believe this can achieve everything a functional language can

Dynamic parametized references: alternates between object reference object reference
Static properties: object object object object (every parenthesized expression is a clone, resulting in another object)


When we are accessing variables, like so
Bla: foo
It is actually short for
Bla: this.foo
So if we want to call it
Bla: foo(10)
It looks like we are actually using parametized references
Bla: this.foo(10)
so when we define foo
foo: mylibrary.getFn(5)
We should specify that it's parametized
foo(): mylibrary.getFn(5)
hmmm

------------------------ INSERT SKETCHBOOK NOTES 9/5 HERE -----------------

Work in reverse

Multiplication and repeats
Program vs data

Logic lang and nondeter

Filters strict vs defaults

Named output

Function vs property access
transform example


Diagram (in sketchbook, "transition diagrams")
Cloning
Program and data


Its actually possible to do multiplication using structure (in sketchbook "multiplication circuit")

How we bind inputs, evaluate outputs, eg count the number of nodes in a tree
These are program behavior, not just structure anymore

Evaluation vs structure
Property access is where evaluation comes in? or maybe cloning... 
When you link a function, where does the evaluation stop? Stops after evaluating the function call, which clones the structure

Object model has 2 ops, clone and property access
Functional combines the two into one op, calling, which clones a function and "accesses" the output


Maybe if functional uses a single output for each function, we dont need labels
We can wire directly
And have a special operator for cloning
How can we represent functional using graph notation? 

Objects and functions are both atoms
We are trying to create a model with both atoms
We should stick to one

String references are like defaults
We want to be able to easily modify them, add complexity


Back to thinking in terms of brain
Currentstate(sensory input) => nextstate

If we want to be able to parametize everything, what if we wanted to parametize foo(bar)
but we dont want foo(bar, param), because that isn't the same as parametizing the entire foo(bar)
We can wrap it
(parameter: param, object: foo(bar))
Need some shorthand for this

We want to be able to modify everything
What is "modify"? 
Add/change properties
But what about in the context of functional
And properties are just shorthand for function behaviorWell 
If we think about it in terms of brain and neural nets
Add/change pathways
Its like learning
We "teach" it new behaviors and responses
However, note how this complicates "overriding" properties
Because if we generalize to parametized references and matchers, its hard to tell when to override vs add
When two matchers are the same
In the brain, its impossible, which is why we only reinforce connections, and other connections degrade over time

Its counterintuitive to define using dynamic properties, but modify properties using static

foo:
    bar(param): …
        param+10

modifiedfoo: foo(zed: "hello")

notice that during cloning, we've always been modifying static properties, and haven't really dealt with dynamic ones
How do we specify a dynamic property to modify? 
What do we do if two dynamic ones collide? Does it modify both of them? 
Maybe we can modify dynamic params if we use the same "signature" (aka same name and parameters)
but will this work for all filter matchers? 
Maybe we should stick to static property names after all



conditionals still seem special
functional needs it
static object needs it

dynamic property access kinda replicates it, using demux pattern
but we still need equality operator and booleans

deconstruction:
functional does it through function passing
objects use property access (object passing doesn't do anything because it will just return a clone of the original object, so the stuff passed in is still stuck inside)

program is finite
data is infinite
(turing machine is good example)

turing machines require so little
just a finite set of state transitions
everything else (the tape, behavior of the state machine), is hard coded in the interpreter

on the other hand, functional seems to require so much
special conditional function
special equality operator
boolean operators?

actually I think boolean operators can be implemented by chaining conditional functions and duplicating code
OR: if (cond1) doX else (if (cond2) doX else doY)
AND: if (cond1) (if (cond2) doX else doY) else doY

the only way to obtain info about a function is to call it

we might be able to do conditionals and equality using deconstruction as well...
basically, use callbacks to do conditionals
"call" the boolean, to deconstruct it and branch computation based on it's value
this means that every value needs to return a function, which can be used to check for equality
another way to think about it is, say we have some function foo:
foo() {
    ... bunch of stuff
}

somewhere inside foo, we get a boolean
we don't know the value of that boolean
so to actually use it, we have to call the boolean
thus, we design the boolean such that, depending on if it is "true" or "false", it will do different things

True(a, b): a
False(a, b): b

foo(bool): bool("it was true", "it was false")

so notice what happens:
* say we get a bool that either has the value True or False
• when we call the bool, it will behave differently depending on it's value
• so we leverage that, and give it two different behaviors, one for if it is true and one for if it is false

we can extend this to create boolean operators
we can combine this with the functional method for list datastructures to create binary numbers
finally, we can create a equals operator, that compares two binary numbers, and returns a boolean
so each of these comparators don't actually return a value
they return a function, which we call to figure out what the actual value was

```js
function True(trueVal, falseVal) {
  return trueVal;
}

function False(trueVal, falseVal) {
  return falseVal;
}

function Bin(head, tail) { // binary number constructor
  return function(listFn, nilVal) {
    return listFn(head, tail);
  }
}

function Nil(listFn, nilVal) {
  return nilVal;
}

var x = Bin(True, Bin(True, Bin(False, Nil)));

function boolToNum(bool) {
  return bool(1, 0);
}

// acc is accumulator
function binToNumHelp(binary, acc) {
  return binary((head, tail) => binToNumHelp(tail, (acc*2)+boolToNum(head)), acc);
}

function binToNum(binary) { return binToNumHelp(binary, 0); } // converts binary to integer

console.log(binToNum(x));
console.log(boolToNum(True))

function NOT(bool) {
  return bool(False, True);
  // return (trueVal, falseVal) => bool(falseVal, trueVal);
}

console.log(NOT(True)(1, 0));

function AND(bool1, bool2) {
  return bool1(bool2(True, False), False);
  //  return function(trueVal, falseVal) {
  //    return bool1(bool2(trueVal, falseVal), falseVal)
  //  }
}

function OR(bool1, bool2) {
  return bool1(True, bool2(True, False));
}

function EQL(bool1, bool2) {
  return bool1(bool2(True, False), bool2(False, True))
}

function equals(bin1, bin2) {
  return bin1(function (head1, tail1) {
    return bin2(function (head2, tail2) {
      return AND(EQL(head1, head2), equals(tail1, tail2))
    }, False);
  }, bin2(() => False, True));
}

var y = Bin(True, Bin(False, Bin(False, Nil)));

console.log(equals(x, y));
console.log(equals(x, x));
```

notice the two methods shown for AND
the first method is shorter
but the second method can be thought of as a lazy-evaluation method.
In the first, the expression is evaluated, and values returned by the expression are all functions, True and False
In the second, the entire expression is a function, and the values returned are all values, trueVal and falseVal
the methods achieve the same thing, but change the time of evaluation
So if bool1 and bool2 are computation expensive, then the second method might seem better.
however, once we need to "use" the boolean from the second method, we need to evaluate the expression
and we will almost always be "using" the boolean returned
so we will always be evaluating it anyways. So the lazy evaluation isn't very useful.
However, we can have a third method, a partial-evaluation
 
function AND(bool1, bool2) {
    return bool1((trueVal, falseVal) => bool2(trueVal, falseVal), False);
}
  
notice that in this method, if bool1 is false, then we don't evaluate bool2
short circuit evaluation
This means that 50% of the time, we don't evaluate bool2
This is better than both method 1 and 2.



now that we know how to do conditionals in functional, how does this translate to objects?
how would we transform a case statement like the one below, so that it doesn't use dynamic property access, and only static access and cloning?

coffeePrice:
    "small": 3
    "medium": 4
    "large": 5

print(coffeePrice[customerInput])

note that we already created a mapping between static object syntax and functional, so it should be possible
in order to follow the method we used for booleans, we need to treat customerInput as a function not a value, and pass in a bunch of different behaviors to it, so that it will "choose" the correct behavior based on it's own value
we also need to modify strings to be able to do this

"small": x =>
    equals: x.small
"medium": x =>
    equals: x.medium
"large": x =>
    equals: x.large

print( customerInput(x: coffeePrice).equals )

the reason this feels so weird and counterintuitive is because instead of getting a value, and testing or using it, we get a function, and give behaviors to it and let it choose what to do
we are passing control to the value itself
it's like, instead of retrieving a soda from the vending machine, and giving it to Bob if we don't like it, we instead tell the vending machine to decide whether or not to give it to Bob
instead of acting on the boolean, you let the boolean act for you



objects vs functions

objects retrieve values, and treat them like values
functions return functions
you can still emulate object-like syntax though


objects, modify properties
functions, modify inputs
objects, inputs can become outputs and vice versa
inputs and outputs are mixed together
function: inputs and output is fixed and separate
objects, you can modify everything
function: you can only modify inputs, there is stuff you can't modify
well local variables also create behavior in objects that you can't modify
making objects even more like functions, and making functions even more redundant

Search.use(paginated: true).results
actually could work
the intermediate scope "use(...)" belongs to Search
allows us to modify a property indirectly
scope is also isolated, so we can do
Square(x: 0, y: 2).use(x: 10, y:5).translate
though it does look a little backwards....
and it'll look ugly if we want to use indentation
though we could use capture blocks to make it a lil cleaner
Square(x: 0, y: 2).use(...).translate
    x: 10
    y: 5


for map, you could do something similar
mylist.map(item*2)
the way we can think about it is, item is an unbound input, that is actually part of mylist
so it's actually doing
mylist.for(item: ...).map
hmm

instead of Search.result(paginated:true)
why don't we just do
Search(paginated: true).result
this way, we don't need parametized references
though we need to make it clear that the parameters apply to "result" and not "Search", because for stuff like Square.translate, Square(x: 10).translate is different from Square.translate(x: 10)


Another possible syntax:

Square:
    x: ... , y: ...
    translate:
        x: ..., y: ...
        result:
    translation: translate(...).result
Square(x: 2, y: 3).use(x: 10, y: 20).translation

notice that "use()" looks ahead at the property being accessed (in this example, "translation") and then fills in the (...)


Either, we make objects and functions the same
or we need to make them achieve completely different purposes


PART 8
-----------------------------------------------------


note that despite the complications in syntax, it is usually quite obvious what the internal representation should be
for example, for translate, the internal representation should be
Square:
    x: ... , y: ...
    translateParams:
        x: ..., y: ...
        result:
          x: ..., y: ...
three scopes, one for the source, one for the params, one for the result
this is obviously how it should be represented internally
how it appears externally, is what we are having issues with
should it be
Square:
    translate(x, y): (x: ..., y: ...)
or should it be
Square:
    translate: x y => (x: ..., y: ...)
or something else?

maybe we should allow both
if the internal structure is the same, whether we treat it as an object or a function doesn't matter
just two sides of the same coin
two ways to see the same thing
we can declare something as an object, and then retrieve it as a function
or declare it as a function, and retrieve it as an object

this kinda goes back to the FACETS idea

we can declare a function using something similar to Nylo's arrow notation
foo: a, b => a+b
but if we retrieve it as an object, it will return it like
foo:
    a, b
    _result_: a+b

different syntax for retrieving as object vs function:
Square.translation // retrieves a object
Square->translate // retrieves a function
this way, it's obvious what you are retrieving
or maybe we can use syntax highlighting, that colors it differently depending on if it was declared as a function or an object
because the internal structure is the same, the IDE should allow you to easily convert a function declaration to it's equivalent object declaration, and vice versa

for example, if you start with
Search:
    results: ...
and you want to add parameters
the IDE will give you an option to "expand" the reference
Search:
    results: resultsWith(...).result
    resultsWith:
        paginated: false
        _result_: ...

you can turn any expression/object into a function using unbound symbols
you can turn any function into an object (not sure how yet)

### Comparing Our Different Mechanisms and Syntaxes

We should compare our different syntax options, using our core examples

Options:
* pure objects (no functions, no parametized references)
* objects + functions (add the concept of functions, like in Nylo)
* parametized references (functions and references are the same, property access is a function)
* duality (all variables can be treated as both an object and a function)

Core Examples:
* map
* currying / builder pattern
* Square.translate
* Search.results and Search.results(paginated: true)

Comparison ( UNFINISHED ):

```js
// pure objects

Square:
    x, y
    translate:
        x, y
        => x, y ...
Square(x: 0, y: 0).translate(x: 2, y: 3)

Search:
    results:
        paginated: false
        => ...

Search.results.
Search.results(paginated: true).

Map:

// objects + functions

Square:
    x, y
    translate:
        x, y
        => x, y ...
Square(x: 0, y: 0).translate(x: 2, y: 3)

Search:
    results: resultsWith()
    resultsWith:
        paginated: false
        => ...

Search.results
Search.resultsWith(paginated: true)

// parametized references

Square:
    x, y
    translate:
        x, y
        => x, y ...
Square(x: 0, y: 0).translate(x: 2, y: 3)

Search:
    results:
        paginated: false
        => ...

Search.results
Search.results(paginated: true)

// duality

;
```

Hmm I just realized
One of the core examples we always used to justify parametized references
Was the Search.results example
But you can always just use normal function syntax and use a proxy pattern: Search.results and Search.resultsWith()
Search:
    results: resultsWith(...)
    resultsWith:
        paginated: false
        => ...
In fact, this works fine with scalability
If you originally only have Search.results
And you want to parametize it later
You can just modify Search, adding Search.resultsWith and redirecting Search.results
This doesn't affect old code that uses Search.results, but in new code every time you want to use parameters just use resultsWith()
So effectively, this is just as easy as our parametized references method
Except with all the complications that parametized references comes with

### Implicit Inputs/Functions and Bounding Scope

* For implicit inputs/functions
* How do we know what scope it applies to?

for example:

        foo: list.map(n+1)

In this one we were restricting it to the parenthesis, so it's equivalent to

        foo: list.map(n => n+1)

However, for declaring functions, we restricted it to the property scope

        foo: n+1

is equivalent to

        foo: n => n + 1

For capture expressions, we were restricting it to the current line

    foo: a.get(b) 
        a: Array(size: 10).fill(index+1) // array of nums from 1-10
        b: Math.floor(Math.random()*10)

is equivalent to

    foo: ((a, b) => a.get(b))
        a: ...
        b: ...

So we've been super inconsistent
So what scope should we use?
Maybe we shouldn't allow implicit inputs after all?


Note that for inline functions, like
`list.reduce((a,b) => a+b)` (javascript notation)
we should wrap inputs in parenthesis if there are more than one
Otherwise it would look like:
list.reduce(a     ,     b => a+b)
which clearly looks like a list and not a single function

### Declaring Input Order For Objects

For objects, how do we declare inputs?
This is useful if we want to specify an order when mapping unnamed arguments

    foo: // inputs: a, b, c
        x: (b*b)+c*a
    f: foo(1, 2, 3)

which is equivalent to

    foo:
        a: undefined, b: undefined, c: undefined
        x: (b*b)+c*a
    f: foo(a: 1, b: 2, c: 3)

Note that this is different from a function that returns an object

    bar: a, b, c =>
        x: (b*b)+c*a
    b: bar(1, 2, 3)

because `b` has lost the declaration order?
after all, bar is equivalent to

    bar:
        a: undefined, b: undefined, c: undefined
        _result_: ( x: (b*b)+c*a )

though maybe we can preserve declaration order? carry it over?
but what if we are shadowing parameters in the output

    bar:
        a: undefined, b: undefined, c: undefined
        _result_: ( a: (b*b)+c* bar.a )

then `bar(a: 10)` is different from `bar()(a:10)`
whereas `foo(a: 10)` is the same as `foo()(a: 10)`
also, the whole point of function parameters is that they shouldn't show up in the output
so they shouldn't be preserved

### Declaring Input Order Using a Property

another way we can think about it is
the internal representation should be something like

    bar:
        _param_order_: a, b, c
        x: (b*b)+c* bar.a

what about functions? do they also have this `_param_order_` property?

actually, note you can use any property declared at the beginning to declare input order

    bar:
        myinputorder: a, b, c
        x: (b*b)+c* bar.a

after all, input order is determined by the order in which symbols appear in the scope
so if you declare a list of symbols at the beginning, the input order will follow the order of that list

note that for the same reason, you can leverage list elements to serve the same purpose

    bar:
        a, b, c
        x: (b*b)+c* bar.a

however, if you are planning to use `bar` as a list, then you can't do this

maybe we can use the same technique that we use for function output
use a symbol to represent a property `_param_order_`, used specifically for declaring input order

    bar:
        $ a, b, c
        x: (b*b)+c* bar.a
        => x*x

### Arrow Operator and Capturing Implicit Inputs

we can use => to specify the scope of the function (and implicit inputs)
by default, the implicit inputs are scoped to the property scope
but if we use =>, it declares it as a function, scoped to the current expression, and captures all implicit inputs
if you have multiple =>, then the inner one captures it's own implicit inputs, and does not pass them to the outer =>
so if you have
foo: => mylist.map(=> n+1)
this is equivalent to
foo: mylist => mylist.map(n => n+1)
note that the input "n" does not propagate to the outer function
if we instead had
foo: => mylist.map(n+1)
this would be equivalent to
foo: (mylist, n) => mylist.map(n+1)

we can use this to fix immediately-invoked functions aka IIFEs (note that we have to use the call operator too)
foo: (=> a.bar(b))#
    a: SomeObject
    b: 10
note that, we can still use ... for capture blocks
foo: SomeObject[...]
   10
the "..." capture block works like "=>", is scoped by the current expression

how does multiple inputs work?
works differently for inline expressions vs blocks?
for inline expressions, we are used to the javascript method:
parseFunctions((a b c) => a+b+c, (d e f) => d*e*f)
however, if we took a function defined using indentation blocks:
foo:
    a b c
    => a+b+c
and converted it to inline, it would look like
foo: (a b c => a+b+c)
so it seems like we are using two different methods:
1. js method: "=>" operator takes one object on the left and one object on the right
2. block method: "=>" operator acts like a property name, short for "_return:"
the block method isn't too bad for inline. if we wanted multiple functions:
parseFunctions((a b c => a+b+c) (d e f => d*e*f))
note that we can get rid of the comma separator between the two functions
and it's clear what the scope of the function is
however, if we wanted to use implicit inputs, the parenthesis look a bit cluttered
parseFunctions((=> a+b+c) (=> d*e*f))
not too bad though
js method with implied inputs:
parseFunctions(=> a+b+c, => d*e*f)
I actually like the block method, makes it clear where the functions start and end
however, what if we only have one function?
list.map(n => n+1)
this could be interpreted as
list.map(n, _return: n+1)
but clearly we want
list.map((n, _return: n+1)) or list.map((n => n+1))
double braces look ugly though
so maybe one function is a special case?


what happens when cloning, and we add implicit inputs to the declaration order?



going back to the facets idea, being able to treat things as both a function and an object
first off, the syntax
foo#myfn(x: 10) for calling and foo.myobj(x: 10) for cloning
doesn't it make more sense to have the "call" operator be after the property access? like so:
foo.myfn#(x:10) or something?
after all, we are accessing myfn like any other property, but then treating it like a function when we call it
actually, we already kinda had syntax like this a while ago
foo.myfn(x: 10) for calling and foo.myobj{x: 10} for cloning
why did we change it?
one reason was that we wanted one set of braces

but another reason is that, remember that veggero pointed out that you will never "call" an object
it doesn't make sense to "call" an object when it doesn't have the _return property
in fact, if there is a _return property, we probably want to use it, so it's rare to clone a function too (though this definitely does happen, like in currying)

So you will never treat an object as a function, but you can treat a function as an object?
This is not perfect duality
Asymmetric
Why is that?

If we think of functions as an object type
Do other object types have this behavior?
Numbers have a special _numval property
Also, the + operator only works on numbers
Also asymmetric
So maybe we can think of calling as an operator
for numbers it looks like mynum+10
for functions we can do
myfn#(10)
which combines myfn and (10)


for something like HTTPRequest
it's kinda ambiguous if its an object or a function
is it supposed to be
HTTPRequest(url: "google.com")
or
HTTPRequest(url: "google.com").execute()
if we used the call operator
HTTPRequest#(url: "google.com")
it's clearly a function
without it, it could be an object, or it could be a function that we are treating like an object
but it works without the call operator as well
if we have
HTTPRequest(url: "google.com").execute()
it's clearly an object
but without the ".execute()", it could be a function or an object

functions are a little different from numbers
in that functions are a natural part of language/linguistics?

numbers can have multiple operators, like + or * or /
functions only need one operator, the call operator
numbers (and strings and other objects/datatypes) are meant to be used, to be acted upon
functions are meant to use other objects, to do the action

actions?
"Bob, pick up the bucket" modifies Bob and bucket
modifies the environment state
maybe we should have another type of object specifically for modifying environment state
should we separate functions that modify state from functions that return output?
are there functions that do both?
yes, functions that modify state and then return true/false to indicate success/failure


natural human language has ways to indicate whether something is an object or a verb or a preposition
maybe we need that too
aka, maybe we should have a call operator

on the other hand, with dynamic typing, you're supposed to name your variables appropriately
to indicate what it is
if its a number, specify so
if its a function, likewise

"send the mail"
even though we know "send" is a verb, there are still rules on where in the sentence it has to go

hmm, but it's not the word's location in the sentence that determines it's type (aka part of speech)
in this case, the verb is at the beginning
but we could also put a noun at the beginning
"Bob sends the mail"

to the contrary, its the part of speech that determines where in the sentence it has to go
the way we did syntax trees, was we *first* determined each word's part of speech
and then we built the structure

the sentence structure is (i think) mainly for indicating what modifies what, like which adjective modifies which noun, etc
analogous to parenthesis in our language

I guess one major difference is that, in natural speech, you can't treat a verb as an object or vice versa
whereas in my language, you can treat a function as an object (and clone it, access properties)

but also, consider how long it took to learn a language like english
but the difficult part is understanding the syntax construction
but if the syntax tree were given to a foreign speaker...
i think they would be able to figure out the meaning, if they understood the vocab

also, note that i think human language needs to achieve more than what programming languages need to achieve
human language needs to be able to describe things like events in the past
"yesterday, bob went to the zoo"
programming languages only need to describe commands
no need for verb tenses
though I guess for describing data, you might have to do something like
"event(subject: bob, action: goes(to: zoo), time: yesterday )"

different langauges have different parts of speech though
so maybe having syntax based on parts of speech should be built on top of the base language

the base language more represents ideas and neural connections
super simple, fundamental
other stuff can be built on top

its a little less flexible than functional though
because in our language, `foo(...)` must return a clone of `foo`
whereas `foo(...)` in functional, can return pretty much anything, including a clone of `foo`

I think our language is pretty much complete though
It has a core mechanism, objects/dictionaries, that is Turing complete
It add a few mechanisms on top of it, like local variables and state variables
But it's main purpose is to be simple and elegant

It's most similar to functional
However, the main differences are:
Dictionaries
Local variables
State variables/eventlist blocks
Feedback
