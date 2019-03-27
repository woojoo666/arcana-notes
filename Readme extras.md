
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
