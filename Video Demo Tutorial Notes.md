Video DEMO/tutorial Notes


### 1st video

1. basic syntax, objects
2. cloning
3. insertion
4. tags
5. students example
6. tree example


insertion
basically like created a dropbox for other people to put stuff in
as far as I am aware, there are no other languages that don't support assignment, but do support insertion
shows the difference between axis and others
axis allows for side effects, but they have to be unordered
pushes for unordered


students example:

notice how it doesn't execute linearly like in imperative
instead of thinking in terms of linear execution
(show animation of highlighting lines of code from top to bottom, like linear execution)
we think of objects as existing in space, and they can interact with eachtoher freely
(show animation of first, variable names spreading out across the canvas and all other syntax disappearing,
and then rearrange the variable names and add connections/arrows depicting reads and writes)


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


why is unordered important
imagine you give your friend a shopping list
instead of asking your friend the order in which to buy objects
you just ask them to buy the objects

powerset example?

helps for optimization
say you actually only use certain objects from the shopping list
and ignore other items
the interpreter can tell the friend that they don't need to retrieve the ignored items

the less you specify, the more you can optimize


### 2nd video

classes and templates
state variables
chat server example
	for chat-server, start with pure insertion, show how you only need "time" and "order" in 2 places
	then use state variables to show how to implicitly specify order



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


after making the chat server, talk about how you might want to separate the server and client, if things get bigger and more complex
show how you can easily move the client to a separate module
and then show how you can easily move the client module to a separate file
and how you can easily navigate to the file and clone it, providing environment variables


this is what actor model provides
strong modularity, which makes it easy to move components around
extremely flexible
unordered

"this is the power of actor-model programming. We get concurrency for free"


maybe also give an example of calling web APIs



in readme, talk about how insertion allows for data mutation while prserving concurrency



### 3rd video


no syntax, no implementation, just talking about philosphy
why actor-model reactive programming is different, and better, than functional reactive programming
note that most things are functional reactive
	angular, react, reactiveX, mapreduce, dataflow

reactive is about thinking of things like dynamic persistent pieces of data
the internet works like this
every website, every user, is like a beacon of data

but functional programming, makes it so you can only define beacons in terms of old beacons
directed acyclic graph
this is not realistic

actor-model, allows you do define beacons that can accept data from anybody, even new beacons
kinda like a dropbox/mailbox
and this is actually more accurate representation of the internet
one example might be email, anybody that knows somebody's email address can send messages to that person
another example might be subreddits, anybody with a link to the subreddit can post to it
another might be a instagram tag, anybody can tag an image with the tag, and it will show up in the tag feed

compare actor-model to imperative and functional
forward vs backward construction


### 4th video - return to zork

Return to Zork example game
then make it multiplayer
then make it twitch-plays style (every 5 seconds it chooses a random input from all multiplayer inputs)
