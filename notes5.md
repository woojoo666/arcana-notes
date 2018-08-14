Arcana Functions Brainstorm
---------------------------

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

### Part 1

Can't override lists
Use 0: 10, 1: 20 instead
This is how it's done in JavaScript as well

No distinction between "outputs" and properties
Properties are outputs
Check Implicit Outputs section
No need to "override" outputs
Output is -> someObject(args)
Wouldn't be able to access incomplete properties in someObject
veggero used notation like fn(-> someObject(args).myprop)
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

Even evaluated functions store input?
To make Turing machine, base lang only needs: properties, cloning
Doesn't even need dynamic keys

states:




Whether or not something is unbound, is up to the user. The function shouldn't know this
Though when yOu clone a function, it does preserve bindings
An object includes everything that is cloned
That includes inputs, and even inner unnamed expressions
So object properties can be bound yet unnamed

Just because you can override outputs doesn't mean you should - Vish
Doesn't really make sense to override an output
Just access it using property access

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


I've been kinda worried that intermediate properties and outputs might collide
You have to keep track of what properties are in the output object, and make sure your temp evaluation variables don't clash
But actually, if you want to be able to override evaluation variables, then you have to make sure they don't collide
When thinking about matrix.product.... input, intermediate steps, and output are all part of it
You can use special syntax so they don't show up in output?

Objects represent more than their output, they represent their input and evaluation too. "x: sum(a: 2, b: 3)" stores more than the number "5", it also remembers the inputs. Because everything is persistent and dataflow. If say "x"  was bound to  other inputs, and those inputs change, it doesn't call the function again. Because it retains those bindings. It keeps track of what is bound to it, because who else would keep track of that?

This also factors into memoization. If we have multiple functions using "sum(2,3)", they can all just reference "x". 

Does this mean we have to factor inputs into equality checking?

Drawing: I noticed how quickly I've been improving, at drawing smoke, trees, colors, etc. Being forced to doodle quickly and frequently is forcing me to just experiment and just go for it, instead of overanalyzing. Trial and error helps me learn surprisingly quickly. I try to have a goal that I'm trying to achieve for each trial, and I can see if it worked or not, and learn from each trial. Also, drawing in public forces me to just start drawing, and also to start simpler, so I get less stuck and unsure and frustrated. Starting simple also helps me focus on training one thing at a time, which speeds up learning and prevents me from getting overwhelmed and frustrated and disappointed. Drawing from reference (esp simple things like trees and mountains) helps a lot, and Yellowstone has a lot of cool stuff that constantly keeps inspiring me to doodle.

If a "function" outputs an object, but includes all the inputs, what happens when you clone the object? You don't want those inputs in the clone, right? Maybe it should only retain inputs for one level? Maybe expressions should be treated differently from objects? Cloning fn_result vs cloning the entire function. When/where are the inputs relevant? Are they relevant after cloning?

In this new model, either you can have the inputs permanently part of the object, or not at all. Functional's function model (and input propagation model) allows for inputs that disappear after being completed.

You can create a function model, just make an object that hides variables once complete (local variables). How does this work with equality? How to declare such variables?

Iterating across all properties of a mixed modules, usually you just want output values?
Mixed modules get ugly once you start considering multiple chains of operations, where inputs are getting preserved across all of them, littering the namespace. If you had "fillNthRow: matrix, row, value => temp: value*value,  matrix()"

Usually when you clone something you only want to clone the output. Cloning the input isn't necessary, as previously thought.

How to do Person.updateBMI

Mixed modules are unintuitive, they are not how we naturally think about data structures. The core concept of functions is the distinction between evaluation and output

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


Currying and default values contradict each other?
Currying: once you give an input a value, the function returns the output
Default values: inputs can have a value or not, doesn't matter

Maybe we can view default values not as inputs, but properties
So you can override them as much as you want
A function with properties is like a semi-complete function, where some of the inputs have been given already


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


### Part 2

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

### Part 3

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

### Part 4 - Cono and Knowledge Nets

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
