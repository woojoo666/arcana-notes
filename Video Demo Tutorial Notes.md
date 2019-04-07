Video DEMO/tutorial Notes


1st video:

1. basic syntax, objects
2. cloning
3. insertion
4. tags
5. students example
6. tree example



students example:


tree example:
show how, no matter what order you "attach" the height tags to each node
at the end, when the structure is complete, the result is always the same

we still have to use recursion to get `nodes`
but once we have it, we can use it for all kinds of purposes
in imperative you have to use recursion every time
in axis you only have to do it once

instead of defining a bunch of functions and behaviors
we define data and relationships
we define a bank of data
and we can combine data together to define more data
and we build this bank of data step by step


2nd video:

classes and templates
state variables
chat server example



talk about how easy it is to make APIs using insertion and methods (eg the Deck example)
this is one advantage over functional
functional doesn't allow you to create APIs, but I find the API pattern rather intuitive

start with a `messageBox` example, and manually create clients, and show that it works in client side
then turn the example into a chat server by turning the message box into a `Web.Client`
shows how malleable and flexible and independent the code is

show how current stacks (node + express + socket + mongo + client javascript) use a ton of message passing and boilerplate
imperative views programs as instructions or actions, a process that runs and then disappears
but in this new age of distributed networks, we are increasingly seeing programs as live persistent objects
in Axis, every object is "alive", you can modify them live, udpate them live, have some parts running while you modify other parts






in readme, talk about how insertion allows for data mutation while prserving concurrency
