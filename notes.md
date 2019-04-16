
### Structure

```js
root = {
	repeaters: [ {template, container}, ... ],
	listeners: [ {template, elem, property}, ... ],
	value: {
		key1: {
			repeaters: [...],
			listeners: [...],
			value: "hello"
		},
		key2: {
			repeaters: [...],
			listeners: [...],
			value: {
				subkey1: {...},
			},
		},
		mArray: {
			repeaters: [...],
			listeners: [...],
			value: {
				0: {...},
				1: {...},
				2: {...},
			},
		},
	},
};
```

Wijits
-------

### handlebars
```html
<div>{{foo}}</div>
```
* events:
	* #updated
		* default listeners: render()
* triggers
	* set() -> #updated
* attach more listeners using `<div updated="myListener">{{foo}}</div>`, and `scope.myListener()` will be called when update is triggered
* if your listener contains the call `this.preventDefault()`, it will prevent the default listener from being triggered (in this case, `render()`)

### list wijit
```html
<repeat items="index, item in items">
	<div>{{index}}: {{item}}</div>
</repeat>
```
* events:
	* #item_changed
	* #index_changed
* triggers:
	* set() -> #item_changed
	* insert(), remove() -> #index_changed
* if an item is inserted to beginning of the list, then everything after gets its index changed
	* each event will cause the entire element to re-render!
	* thats a lot of rendering!! pretty expensive
* thus, check if there are any #index_changed listeners in the first place, before sending out all the events
* this should generalize to all events. For example, if there are no #item_changed listeners, no need to send out any events after set()

### selection wijit
```html
<selection items="item, isSelected in items" selection="selection" onselectionchanged="onselectchanged">
	<div class="{{isSelected}}">{{item}}</div>
</selection>
```
* events
	* #item_changed
	* #item_selected
	* #selection_changed
* triggers
	* select() -> #item_selected, #selection_changed
* note that isSelected is NOT a property of item
	* "item" is a data structure defined by the user, we don't wanna restrict them with reserved properties
	* instead, we have a mirror array specifically for properties like these

Scopes
------

* for things like the listwijit, that declare new variable names, I suspected that I would need to start dealing with creating new scopes and such
* originally, my simple solution was to replace the new variable names with their absolute path
* for example, if I had this (assuming `items` and `foo` are already declared in the root scope)

```html
<repeat items="item in items">
	<p>{{item}} hello {{foo}}</p>
</repeat>
```
* I could render it as something like this

```html
<container>
	<p>{{items.0}} hello {{foo}}</p>
	<p>{{items.1}} hello {{foo}}</p>
	<p>{{items.2}} hello {{foo}}</p>
	etc...
</container>
```
* problem with this is that if I inserted an item at say, index 0, then all the items get their absolute path changed
* another tempting solution is to walk up the tree to find the first match
	* {{item}} will walk up all the way till the repeat wijit, where it finds a match
	* {{foo}} will walk all the way up till the root scope
* problem is when you have something like this

```html
<repeat items="item in [5,10,15]">
	<p>{{item}} hello {{foo}}</p>
</repeat>
```
* now the scope of the repeat wijit is completely separate from the root scope
* thus, whenever we create a new scope we need to explicitly hold onto a reference to the parent scope
* analagous to this

```js
repeat(items, function (item) {
	return handlebars(item + foo);
});
```
* more on scopes further down

Data vs Function-Based
------------------------

* should I make it more like angular, where I directly modify data and the widgets "listen" to the data and change on their own
	* allows me to attach multiple different widgets to the same piece of data
or should I make it more function-based, where widgets have an API and an internal piece of data, and you call the widget's API to modify the data
	* more object oriented, like `selectList[4].select()` instead of `selectList[4].isSelected = true;`
	* this makes sense with the "repeat" wijit, where you would have common array operations like "push" and "splice"
	* however, this means that I can only have one type of widget attached to a piece of data, otherwise the different APIs might clash
* example: music player

### Angular
```html
<repeat for="song in songs">
	<img src="song.cover"></img>
	<button onclick="play(song)">{{song == currentlyPlaying && song.playing ? pause : play}}</button>
	<p>{{song.title}}</p>
</repeat>
<script>
var songs = retrieveSongs();
var currentlyPlaying;

function play (song) {
	if (currentlyPlaying == song) {
		if (song.playing) {
			audioPlayer.pause();
			song.playing = false;
		} else {
			audioPlayer.resume();
			song.playing = true;
		}
	} else {
		audioPlayer.play(song.src);
		currentlyPlaying = song;
		song.playing = true;
	}
}
</script>
```

### Function Based
```html
<template name="song">
	<img src="cover"></img>
	<button onclick="events.play">{{playing ? pause : play}}</button>
	<p>{{title}}</p>
	<script>
	setPlaying = function (bool) {
		this.playing = bool;
	}
	</script>
</template>
<songlist for="song in songs">
	<song data="song" onplay="play(song)"></song>
</songlist>
<script>
scope.songs.setAll(retrieveSongs());

scope.play = function (song) {
	if (currentlyPlaying == song) {
		if (song.playing) {
			audioPlayer.pause();
			song.setPlaying(false);
		} else {
			audioPlayer.resume();
			song.setPlaying(true);
		}
	} else {
		if (currentlyPlaying) {
			currentlyPlaying.setPlaying(false);
		}
		audioPlayer.play(song.src);
		currentlyPlaying = song;
		song.setPlaying(true);
	}
}
</script>
```

Wijit Model
-------------

```html
<wijit name="song">
	<img src="{{cover}}"></img>
	<button onclick="{{onplay}}">{{active && playing ? pause : play}}</button>
	<p>{{title}}</p>
</wijit>
<repeat for="song in songs">
	<song data="song" active="song.src == audioPlayer.src" playing="audioPlayer.playing" onplay="(e) => play(song, e)"></song>
</repeat>
<script>
audioPlayer = {
	states: { loading, loaded, finished, error },
	playing: false,
	currentTime,
	src,

	play: function (src) {
		this.src = src;
		state = loading;
	},

	restart: function () {
		this.currentTime = 0;
		state = loaded;
		playing = true;
	},
}

songs = retrieveSongs();

function play (song, e) {
	if (song.active && song.state !== error) {
		if (song.state == finished) audioPlayer.restart();
		else audioPlayer.playing = !audioPlayer.playing;
	} else {
		audioPlayer.play(song.src);
	}
}
</script>
```

* originally I was writing array functions into the repeat wijit, like push() and insert()
* this way I could trigger the correct element listeners after modifying the underlying array
* also considered having <repeat> wijit like a library api, where you would pass in the array to modify, eg instead of push(item), do push(array, item)
	* this way the array wasn't "internal" to the <repeat> wijit, and multiple wijits could bind to one array
	* if other types of wijits wanted to use the push function, they could borrow the function: RepeatWijit.push.call(this, array, item)

* in the end, its not whether or not it should be data based or function based, everything has data and functions
* but for wijits, data is in the form of states, and functions are in the form of state transitions
* for the underlying data structures, data is just data, while functions are used for transforming the data
* the <repeat> wijit shouldn't have the push() or splice() functions because that is something inherent to the Array data structure
	* something only the Array data structure should have control over
* <repeat> wijit can attach listeners to the push() or splice() events to respond accordingly
* the <repeat> wijit can still respond to user events and modify the underlying Array, but it has to do so through the Array's transformation api

### Wijit Binding

* notice the `active="song.src == audioPlayer.src"` wiring, kind of like how in verilog you can do

```
SongModule song0 (
	.data (song),
	.active (song.src == audioPlayer.src),
	.playing (audioPlayer.playing),
	.onplay (play),
);
```

* `onclick="{{onplay}}"` declaring an outgoing event, and `onplay="(e) => play(song, e)"` is where it is bound
	* yeah I know arrow functions are for ES6, but it makes it way more concise
	* there's really nothing special going on here, "onplay" is just a property of song, so onclick calls song.onplay(e)
* note that handlebars are only needed with default html tags, and are implied in wijits

### Bind Expressions

```js
scope.bind([scope.var1, scope.var2], function () {
	scope.x = scope.var1 + scope.var2;
});
```
* this example will bind the result of `scope.var1 + scope.var2` to `scope.x`
* syntax for bind function: `bind(result_variable, [trigger_variables], evaluator)`
* all wijits internally use these bind expressions
* `<div>{{foo}}</div>` is just a special bind expression that, instead of setting a variable, sets the innerHTML of an element

shorthand:

```js
scope.bind('x = var1+var2');
```
* right hand side must be simple expression (single statement of words and operators, no "," or ";" or "function")
* also no function calls, because we can't determine which variables to watch from that (use long-form bind to manually specify trigger variables)
* take out left-hand-side -> "var1+var2"
* find all variables that consist of just letters and "."s: `[\w.]*`

dynamic trigger variables:

* problem: "x = a[b+c]", we shouldn't be watching if `a` changes, we have to watch if `a[b+c]` changes
* `a[b+c]` defines the trigger variable
* when it changes, we need to rebind this expression
	* remove listener from old trigger variable
	* attach to new trigger variable
* this is a bit complicated, so I won't allow `[]` characters in bind expressions for now

### Scopes and Binding

* so we don't have to explicitly hold onto each scope and variable name, we let javascript closures do the work for us

```js
function parse (scope, elem) {
	triggerVars = [];
	expression = elem.innerHTML.replace(/[\w.]+/g, function (match) {
		if (!match[0] || !isNaN(match[0])) return match; // skip names that start with a number (invalid)
		triggerVars.push(match); // add name to triggers
		return 'scope.' + match; // prepend "scope." to all variable names
	});
	var evaluator = eval('(function () { elem.innerHTML = ' + expression + ';})'); // enclose expression in a function, capturing the scope at the same time
	scope.bind(triggerVars, evaluator);
}
```

* when you need to create new scopes

```js
function parseRepeater (scope, container, template) {
	var repeatExpr = container.repeat.split(' in '), // given expression "item in items"
		data = scope[repeatExpr[0]],
		alias = repeatExpr[1]; // data: scope["items"], alias: "item"

	data.forEach(function (item) {
		var extendedScope = Object.create(scope); // create a new scope off the parent scope
		extendedScope[alias] = item; // add the extra "item" variable
		var elem = template.clone();
		parse(extendedScope, elem); // parse will create the listeners with the new scope, and bind listeners to the new element
		container.append(elem);
	});
}
```

* the function enclosure inside the `eval()` is the key to everything
	* pre-compiles the expression, which has [up to 18x performance benefits](http://jsperf.com/eval-vs-pre-compiled/4)
	* evaluates the expression for us so I don't have to make my own expression parser
	* holds onto the scope so I don't have to manually store a reference to it
	* leverages javascript's built in closure and scope mechanisms, ensuring consistency between my framework and doing everything in vanilla js

### Binders

* originally I was gonna try to leverage the `bind("x = a+b")` function for binding elements
* issue: different method signatures:
	* `bind (scope, 'x = a+b') => scope.x = scope.a + scope.b`
	* `bindElem (scope, '{{a+b}}', elem) => elem.innerHTML = scope.a + scope.b`
	* the left-hand side of bind() is within the scope, while bindElem() is not
	* maybe there's a way to coax one of the functions to look like other?
* realized that bind() and bindElem() do fundamentally different things
* bind() is meant for binding data together within the same scope
* bindElem() is meant for binding data between the app scope and the element scope
* thus, while the syntax is similar now, the syntax can diverge at any time, so bind() and bindElem() should be kept separate
* wijits and manual bind() expressions all are types of **binders**
* binders are responsible for maintaining data bindings
* internal binders like bind() expressions are for binding data within the same scope
* binders like bindElem() are for binding data across scopes
	* eg: a database binder that updates the database when the user changes data in the app
* wijits create new scopes and bind to the parent scope
* ultimately the wijit tree leads to elemwijits, special wijits that use bindElem() to bind directly to a DOM element

### Tracking Array Index

* say you have a repeater that keeps track of index
	`<repeat for="item,index in array">`
* should the index be handled by the array data structure, or the repeat wijit?
	* data structure: wrap item and index in a container `{ item: ..., index: ...}`
		* array stores these containers, not the items directly
		* when index of a container changes, container.index property updated to match
	* repeat: keep an array of all the extendedScopes, store an `index` property in each of these extended scopes
		* update affected extendedScopes.index properties when recieving #oninsert, #onremove events
* the problem with handling it in the array structure is that we have this indirect wrapper structure going on
* the problem with handling it in repeater, is if we have another wijit that wants to use indexes, we have to reimplement all the index updating functions when receiving #oninsert and #onremove
* SOLUTION:
* note that index is not a part of the item
* array uses it internally to get/set items, but the item itself is detached
* for this specific repeater, we want each item to contain both the item and the index
* use a special array that wraps the item and index
* thus, its not handled by the array structure or the repeat wijit, but a new data structure entirely

### Deep Property Binding

* `x = a.a.a`
* this can be seen as `x = a.get('a').get('a')`
* three ways to handle this
	* keep as one binding, with three triggers `[a, a.a, a.a.a]`
	* separate into two bindings `temp = a.get('a')`, `x = temp.get('a')` with two triggers each
	* one binding, one trigger `a.a.a`, but when triggering listeners, search the tree to trigger all child listeners too
		* eg if we have `x = {a: {a: 3}, b: 2 }`, and we set `x`, then trigger listeners for `x`, `x.a`, `x.a.a`, `x.b`

### Collection Listeners

* ignoring efficiency, whats the simplest collection listener?
	* if we start with `map = {a: 1, b: 2}`, and a collection listener `for key,val in map => map2[key] = val+1`
	* initially the collection listener creates 2 value listeners, `map2.a = map.a+1`, `map2.b = map.b+1`
	* set `map.b = 3` => value listener changes `map2.b`
	* set `map.c = 4` => collection listener notices keyset changes, destroys old `map2` and all value listeners, then re-evaluates entire collection to create 3 value listeners
* what about arrays?
* if we do `['a','b','c'].shift('x')`:
	* item 0 changes to 'x', item 1 changes to 'a', item 2 changes to 'b', item 3 changes (from undefined) to 'c', and length changes to '4'

### Separating Definitions from Data, Bindings from Values

* binding should happen at the definition level, not the data/value level
	* if we bound listeners to data/values:
		* say we bind `x = a.a.a` => `a = {a: {a: 5, _listeners: ["x = a.a.a"] }}`
		* then if we set `bla = a.a.a`, `bla` would inherit the listeners
		* in addition, if we set `a.a.a = 10`, then we would lose the listeners
* I already separated the listeners from the value at the tip level
	* `x = {listeners[], value}`, if you change x value, don't have to rebind the listener
* however, for `x = a.a.a`, if you set `a = {a: {a: 5}}`, have to rebind listeners for `a.a` and `a.a.a`
* thus, we need to completely separate the bindings tree from the value tree
* when setting a value:
	* set the value in the value tree
	* follow the same path in the bindings tree to retrieve the evaluators and run them
		* make sure to trigger any collection listeners directly above the path, eg `a.a.a = 5` will trigger collection listeners on `a.a`
	* this process is recursive; evaluators will set a value, which can trigger more evaluators

```js
a = {a: {a: 4}};
b = 11;
x = a.a.a; //binding 1
y = x+b; //binding 2
z = a.a*b; // binding 3
```
will result in:

```js
// eval1: (x = a.a.a), eval2: (y = x+b), eval3: (z = a.a*b)
bindings: { "a": [eval1], "a.a": [eval1, eval3], "a.a.a": [eval1], "b": [eval2, eval3], "x": [eval2] }
values: { a: {a: {a: 4} }, b: 11, x: 4, y: 15, z: 44};
```

### Event Listeners for Optimization, Re-evaluation by default

* bindings work purely on the current state of the data, regardless of the operations used to get to that state
* when the data changes, we simply re-evaluate the expression
* this is why my previous idea in "Tracking Array Index" with registering #oninsert and #onremove listeners is wrong
	* also my current implementation of ReactiveArray sends #onpush events to update listeners, which is also wrong
* listeners should not have to implement an interface or listen to events. This part is data based, not function based
* note that events can be used to optimize the re-evaluation

ReactiveArray.splice(4,2,["a"]) => onsplice
	ReactiveArray.remove(4,2) => onremove
		ReactiveArray.removeOne(4) => onremoveOne
		ReactiveArray.removeOne(4) => onremoveOne
	ReactiveArray.insert(4,["a"]) => oninsert
		ReactiveArray.insertOne(4,"a") => oninsertOne

* lets say this ReactiveArray has 3 listeners:
	* listener 1: implements onsplice
		* absorbs the #onsplice event, and is not called for subsequent events
	* listener 2: implements onremoveOne and oninsert
		* absorbs two #onremoveOne events and one #oninsert event
	* listener 3: implements onremove
		* can absorb the onremove tree but not the oninsert tree, default to re-evaluation

* a binding should always be able to default back to re-evaluating the expression
* note that setting a just one property can trigger a complete re-evaluation
* originally, in my repeat wijit, modifying one property just affected the corresponding item element
* however, that won't work for something like a summation function: `array => array.reduce((sum, item) => sum+item, 0)`
	* no #onset listeners so defaults to re-evaluation
* on the other hand, operations like map() can automatically generate #onset listeners

```js
bind('squared = array.map(x => x*x)');
// results in
var mapFn = (x => x*x)
evaluator = () => { scope.squared = scope.array.map(mapFn) }
evaluator.onset = (key, value) => { scope.squared[key] = mapFn(value) };
```

* map binds can also use item-to-item bindings in place of onset (which is how the repeat wijit works)

```js
bind('squared = array.map(x => x*x)');
// results in
var mapFn = (x => x*x)
evaluator = () => { scope.array.forEach(evaluator.onpush) } // use onpush to create item-to-item bindings between scope.array and scope.squared
evaluator.onset = () => true // don't do anything
evaluator.onpush = (value, index) => { scope.squared.push(value); scope.bind('squared['+index+'] = mapFn(scope.array['+index+']') };
```

### ReactiveArrays

* note that if we use an internal array and use array operations, we have to make sure to manually call listeners
* eg, ReactiveArray([1,2,3,4,5]).splice(2, 0, "x") has to both update any array/collection listeners, but also call value listeners for each array item after (and including) index 2

### Proxies and getters/setters

* use `defineProperty` to override get()/set() so you can use normal assignment notation while still triggering the listeners

```js
function createProxy(obj, prop) {
	var value = obj[prop];

	Object.defineProperty(obj, prop, {
		get: function () {
			return value;
		},
		set: function (newValue) {
			value = newValue;
			// call all listeners
			obj._listeners[prop].forEach(function (listener) { listener(); });
		},
		enumerable: true,
		configurable: true
	});
}

var test = {a: 10}; // not proxied yet
createProxy(test, 'a');
test.a = 5; // proxied, calls listeners
```

* during the bind() function, we can extract the trigger variable names and proxy them
* however, note that because we have to proxy one by one, we can't dynamically proxy every item in a collection
* thus, collections listeners won't be able to detect when new properties are added
* good try pupper

### Pre-parsing

* because proxies won't work, perhaps we can do pre-parsing
* all wijit script tags are within a `<template>`, so they won't automatically be run
* before running a wijit script, find all assignments and replace them with set()
* eg `scope.a = "hi"` => `scope._set('a', "hi")`
* make sure that set() returns the result to account for expressions like `var x = (scope.x = 5)` => `var x = (scope._set('x', 5))`
* a possible issue with this is finding where to close the parenthesis
* perhaps we can replace the assignments with proxies
* eg `scope.x = "hi"` => `scope._proxy('x').$ = "hi"`

```js
scope._proxy = function (path) {
	return {
		set $ (val) {
			return scope._set(path, val);
		}
	};
};
```

### Deep Property Binding Revisited

* consider a simple assignment, `foomirror = foo`
* due to javascript's reference-based model is that, if foo.x changes, bar.x will change too (foo and bar point to the same object)
* if foo itself changes though, bar won't, because now foo and bar point to different things
* our binding mechanism fixes this, and mirrors changes at the base level:
* however, while the reference-based model seems like a blessing, mirroring changes above the base level, this is actually a problem because it _silently_ mirrors changes
* for example, if we bind `x = foomirror.x`, and we change `foo.x`, `foomirror.x` changes without the binding mechanism knowing about it, and `x` won't be updated
* to fix this, when changing a value, don't just trigger the listeners on that value, trigger the listeners on any ancestors of that value as well
	* we also trigger the listeners on any descendents too, as noted in the "Deep Property Binding" section
* if "x" marks the set value, "a" marks every affected node

	       a
	      / \
	     a   .
	    / \   \
	   .   x   .
	      / \
	     a   a

* this is the full **#onset event propagation**
* tbh, this makes perfect sense. if foo.x changes, that means foo changed as well
* but what about collection listeners?

* consider if we bind `bar.x = foo`, and the later bind `bar = foo`
* this gives `bar.x` a double binding, because the binding `bar = foo` will also determine `bar.x`, BAD!!
* to fix all these issues, we force all binding results to be at the root level
* this also prevents multiple ways of defining identical bindings, which could happen before:
	* `bind(x = {a: foo, b: bar})` == `x = {}; bind(x.a = foo); bind(x.b = bar)`
* this also prevents mixed items, where some properties are bound and some aren't, eg `x = {a: 0}; bind(x.b = foo)`
* in fact, all bindings should belong in a separate domain entirely

```
module songelem (song, audioPlayer) {
	active: (song.src == audioPlayer.src)
	playing: audioPlayer.playing
} (active, playing)
```

* this also ensures that all bindings happen at once, at the beginning
	* if a binding didn't happen at the beginning, then the period of time which it was unbound will likely lead to unexpected behavior
* note that bound variables can't really be used in functional code, but functional code can be used to change bound variables

### Collection Listeners Revisited

* don't item-to-item bindings also create double bindings?
* they also won't be at the root level
* collection bindings actually are for defining collections of bindings, not just for binding collections
	* thus, the "reduce" function discussed in the "Collection Listeners" section is not actually a collection binding!
* collection bindings determine how and when to create/destroy bindings, and create a structure to store the values
* the bindings themselves determine the values
* that way there's no conflict of interest
* the indings they create "belong" to the collection, called **sub-bindings**
	* during #onset event propagation, the sub-bindings absorb the event for the collection listener
	* if no sub-bindings absorb the event, then it reaches the base collection listener, and the whole collection binding is re-evaluated
		* all old sub-bindings thrown away, new ones created
	* this is why the sub-bindings don't have to be at root level 
	* all sub-bindings have to be between children of the trigger collections and children of the output collection
		* ensures that the sub-bindings will absorb the #onset
* collection bindings are bindings themselves, so they can create recursive structures, like a 2d matrix bind

```js
function songlist (songs, audioPlayer) {
	songelem: function (song) {
		active: (song.src == audioPlayer.src)
		playing: audioPlayer.playing
	}
	elems: songs.map(songelem) // collection bind. if a single song changes, then the corresponding _songelem changes, nothing else
}
```

* a normal mirror bind, `bar = foo`, is also a collection bind!
	* in a value-based model, this would be a vital optimization
		* if `foo.x.x.x` changes, then we should only update `bar.x.x.x` and all it's subvalues
	* in a reference-based model, the optimization is unneeded

### Reference Based Models

* its important to note that binding makes the most sense in a value-based model
* a reference based model is useful for passing around data structures, which doesn't really happen in data binding
* reference based models are also useful for copying data structures
* in some ways, reference based model may seem like they have inherent data-binding

```js
var foo = [5];
var bar = foo;
foo[0] = 10;
console.log(bar[0]); // outputs 10
```

* however, this only works because we are copying values
* if we added any transformations, this would not work, and the distinction between reference-based models and data-binding becomes clear

```js
var foo = [5];
var bar = foo.map(x => x*x)
foo[0] = 10;
console.log(bar[0]); // outputs 25, not 100
```

* thus, pass-by-reference is merely an optimization, and when thinking about data-binding, it's useful to assume a pass-by-value model

### Defining Collection Binds and Functional Programming

* functional programming is optimal for defining collection binds because functional programming never modifies or moves around data
* likewise, it doesn't make sense to modify or move a binding (note: dynamic bindings do move around, but that's a weird exception)

```js
function concat (list1, list2) {
	var res = new Array(list1.length + list2.length)
	for (var i = 0; i < res.length; i++) {
		res[i] = (i < list1.length) ? list1[i] : list2[i-list1.length] // bind the beginning to list1, and the rest to list2
	}
	return res
}
function flatten (tree) {
	if (!tree.length) return tree; // either an empty list or a value
	var last = tree.last();
	return concat( flatten(tree.slice(0, tree.length-1)), flatten(last) )
}
```

### Deep Property Binding and Collection Listeners Revisited (Again)

* collection binders are responsible for creating/destroying bindings
* the "value" of a collection is its pointers, not the values pointed to by those pointers
* thus, only monitor the pointers (collection keys), and the bindings created for those pointers will be responsible for monitoring the values at each pointer
* that way no need to monitor "sub-bindings"
* collection bindings are just like normal bindings, just triggered in a different way
	* regular bindings get triggered when value changes
	* collection bindings are triggered when key added/removed

```js
scope.set = function (collectionPath, key, value) {
	collection = get(collectionPath);
	var prev = collection[key]
	collection[key] = value
	if (prev == undefined) trigger(collectionPath) // key added, trigger collection binding
	trigger(collectionPath + '.' + key) // trigger regular binding
}
scope.delete = function (collectionPath, key) {
	collection = get(collectionPath);
	delete collection[key]
	trigger(collectionPath + '.' + key) // trigger regular binding
	trigger(collectionPath) // trigger collection binding
};
```

* also events are no longer propagated to ancestors (b/c children are now responsible for monitoring their own values)
* this means the normal assignment operator won't work for collections anymore
	* if we do `foo = bar`, and then `bar.x = 5`, binding for `bar.x` will be triggered but not the binding for `bar`, so `foo` won't get updated
* overload the assignment operator `=` to do a recursive mirror bind when acting on collections
	* if `foo` and `bar` are collections, `bind(foo = bar)` => `mirrorbind(foo, bar)`

```js
function mirror(source, dest) {
	if (source instanceof Object) {
		for (var key in source) {
			mirror(source[key], dest[key]);
		}
	} else {
		bind(source, dest);
	}
}
```

* static collection assignments like `foo = { x: bar.x, y: bar.y }` are no longer collection bindings anymore, because `foo` is not monitoring anything

### Reduce Bindings

* so far our design has been based on map bindings, but what expressions that work on an entire collection, not each child individually
* to best understand this, look at the difference between a map binding and a reduce binding

```
map binding:

    / a - bar.a
foo - b - bar.b
    \ c - bar.c

reduce binding:

    / a \
foo - b - sum
    \ c /
```

* we need to implement the dynamic many-to-one binding seen in the "reduce binding"
* we leverage our collection listener again, except unlike in map-bind where we create a binding for each child, we create a trigger for each child, and all the triggers lead to one reduce expression
* we can extend this to "deep" reduce functions, that act on trees and not just arrays
* eg a `sumAll` function that sums all numbers in a collection
* just push all numbers into an auxiliary array that is used for the reduce function

```js
temp = []
function sumAll (obj) {
	if (obj.length) obj.mapbind(sumAll)
	else temp.push(obj)
}
sum = temp.collectionListener(function () {
	var res = 0
	for ( var i = 0; i < temp.length; i++)
		res += temp[i]
	return res
});

foo.mapbind(sumAll);
```

* note that we could have leveraged a shallow reduce function and used recursion to get the same functionality
* this way we wouldn't need an auxiliary array for the reduce binding, just listen to each layer in the collection directly

```
deep binding:

        / m \
    / a - n \|
foo - b --- sum
    \ c ---/

recursive shallow binding:

        / m \
    / a - n - temp \
foo - b ------------ sum
    \ c -----------/
```

### Non-Root Level Bindings

* assignments like `foo = { x: bar.x, y: bar.y }` are not collection bindings, and contain non-root level bindings
* to prevent double bindings, we force non-root level bindings (eg `foo.x`) to be created at the same time as the container (eg `foo`)
* thus, we are not allowed to do things like `foo = {}; foo.x = bar.x`
* if we want to have "changing" bindings, we can always do something like `foo = loaded ? bar : "loading..."`

### Dangling Deep Property Bindings and Entry Nodes

* lets say `foo = { x: bar.x, y: bar.y }` and `fizz = foo.x*foo.y`
* what happens to foo when we set `bar = 3`?
* what happens to fizz if we set `bar = {x: 5}`?

* two main possibilities to handle hanging bindings, defaulting to `undefined` or throwing an error
* default value of undefined
	* makes it easy to handle 
	* more flexible, objects like `foo` can change structure without throwing an error
	* silent failures :(
* throw error
	* matches javascript way (`x = {}; y = x.x.x` => throws error)
	* strict typing mindset. In above example, `foo` follows a `{ x: ..., y: ...}` structure, and should always follow that structure, otherwise throw error

* lets change `bar` into a bound variable,`bar = buzz`, with `buzz` starting with a value of `buzz = {x: 3, y: 3}`
* this is a mirror bind
* if we change `buzz = {x: 4, y: 5}`, then the mirror bind destroys bar's old child values and bindings, and creates new ones
* for `bar`, `bar.x` and `bar.y` are temporarily undefined
* because this temporary undefinedness is inevitable, we can't throw an error otherwise we would have errors all the time
* this extends to any level, e.g. if we do `a = b.x.x.x` and `b = null`, `a` should be undefined
	* this is different from javascript, where an error would be thrown

* note that an optimization would be to keep the `foo.x` and `foo.y` bindings and instead just replace the value (instead of having temporary undefinedness)
* in a strict typing mindset, perhaps this would not be an optimization, since the structure of the value that we set `foo` to should never change
* thus, in a strict typing mindset, perhaps throwing an error would be better

* in addition, note how event propagation is no longer needed to the children
	* when bar's new `x` and `y` children are created and bound to `buzz`, their values will be updated, which will in turn update `foo`
* mirror binds replace event propagation
* also slightly more efficient than event propagation
	* only updates the subtree that need updating, instead of moving up the tree and updating the entire tree
* **entry nodes**: nodes whose value we set directly
	* in above example, `buzz` is the entry node
* as shown above, for everything to work properly, entry nodes need event propagation
	* setting `buzz = { x: 4, y: 5}` should trigger all bindings to `buzz`, `buzz.x`, and `buzz.y`
* instead, we can insert a mirror binding after each entry node
* to do this, we create a separate tree for entry nodes, and then mirror bind a node in the main tree to the node in the entry tree

```js
FloModule.set = function (key, value) {
	this.get('inputs')[key] = value;
	this.mirrorbind(key, '_inputs.'+key);
};
```

### FilterBind, MapBind, ReduceBind

as implemented in FloModule.js:

```js
function mapbind (dest, src, fn) {
	this.bind('devnull', [src], ar => {
		this.setVal(dest,[]);
		ar.forEach((_, i) => this.bind(dest+'.'+i, [src+'.'+i], fn));
	});
}

function reducebind (dest, src, fn, start) {
	this.bind('devnull', [src], ar => {
		var triggers = ar.map((_,i) => src+'.'+i);
		test.bind(dest, triggers, () => ar.reduce(fn, start));
	});
}

function filterbind (dest, src, fn) {
	this.reducebind(dest, src, (acc, x) => fn(x) ? acc.concat(x) : acc, []);
}
```
* notice how each binding contains two levels: an outer bind and an inner bind
* this makes sense, because each binding monitors two things: the array pointers, and the values pointed to

### Mirrorbind Everywhere

* remember that we are using mirror binds instead of event propagation
* earlier we said that "input nodes" need propagation
* we can get around this by giving each input node a preliminary mirror bind
* more specifically, input n
	* `mFloModule.set('foo')`

```js
function concat (dest, src1, src2) {
	this.bind('devnull', [src1, src2], (ar1, ar2) => {
		var temp = [];
		temp.length = src1.length+src2.length
		this.set(dest, temp)
		for (var i = 0; i < temp.length; i++) {
			this.mirrorbind(dest+'.'+i, i < src1.length ? src1+'.'+i : src2+'.'+(i-src1.length))
		}
	});
}
```

### Circular References

* something I forgot to account for is circular references, eg `foo = { a: { x: 5 }}`, `foo.a.y = foo`
* this would not exist in a value based model
* a mirror bind will run infinitely
* remember, we are using a value-based model because we are monitoring values, not references
	* if we monitored references, then `foo = bar` would not be triggered when `bar.x` changes
* perhaps we can copy by reference, but monitor by value
* in order to prevent infinite loops, during the mirror bind we tag the nodes that we have already bound, so that we don't run indefinitely

### Aliases

* constantly monitoring and copying mirror bindings is slow and expensive, especially now that we have to do this extra tagging and checking
* mirror bindings are extremely common, eg filter function on an array of objects will have many mirror binds
* copying by reference is fast
* perhaps there's an alternative way for an alias to mirror bind and "inherit" all triggers
	* inherit: if `foo = bar`, and `a = foo.x`, `foo.x` should inherit all triggers from `bar.x`
* one idea is to trigger based on *memory location*, not by variable names
* if `foo = bar`, and `bar.x` is changed to 3, then `foo.x` is also triggered because it points to the same memory location as `bar.x`
* but to make bindings based on memory location, we have to ensure memory locations for every variable stay the same
* eg if `foo = JSON.parse(msg)`, then `foo` can be any object
	* `bar = foo.x`, if `foo.x` disappears and reappears, it must be assigned to the same memory location to ensure that `bar` is updated
* this could potentially be implemented in the hardware side

* however, for now, an alternative would be a cross between propagation and mirror bind: lazy mirror binding
* for `foo = bar`, initially, only the initial reference is copied, and a binding at the root
* when `bar.x` is changed, the event propagates upwards until it reaches the root binding, where it realizes it is part of a mirror binding, and updates foo accordingly
* in addition to updated foo accordingly, it creates a binding for every node that it touched during propagation
* this way, if any node is changed again, it will just trigger the binding instead of propagating
* if no binding is found during propagation, a flag is set on every one of the touched nodes to indicate that propagation is no longer needed
* remember that this all works because *bindings are all defined in the beginning*
	* so if no bindings were found during initial propagation, then there will never be a binding on those nodes

* hmmm...what if we redirected all alias bindings to the source
* eg if `foo = bar`, and `x = foo.x`, then internally `x` will actually be bound to `bar.x`
* this shouldn't cause any problems because bindings don't change, so the source never should change either
* this can be thought of as binding to data/memory instead of binding to variables
* we bind to the source of data/information
* eg, if `foo = JSON.parse(msg)`, then `foo` is a new source of information
	* if we then do `fooalias = foo`, `fooalias` is not a source, so the binding goes to `foo` (the real source) instead of `fooalias`
* sources are mainly entry nodes or the results of calculations/parsing
* but why does this work?

### Reductions

* this is an example of a reduction
* `x = foo.x`, `foo = bar`, so thus we can infer that `x = bar.x` (and make that binding directly)
* another example of a reduction would be `a = b+c`, `d = a+b`, so we can infer that `d = 2b+c` and skip `a` (if its not used elsewhere)
* reductions are all optimizations
* in addition, the more complex the reduction, the less value it has
* for now, the only reduction we'll use is the alias binding reduction mentioned earlier
* this is because its simple, but massively reduces computations (no more graph-traversal mirror binds)



foo = bar
x2 = foo.x**2

note that we can change foo.x in two ways:
	* `bar = {x: 5}`
	* `bar.x = 5`
however, usually in flo, being able to change a variable in two ways causes conflicts, eg `a = b, a = c`
* however, both these ways must update foo.x using the same mechanism!
* in Flo, we can never have two functions updating the same value, to prevent conflicts
* thus, we have to choose one: either `foo` updates `foo.x`, or `bar.x` updates `foo.x`
* obviously makes more sents to have `bar.x` update `foo.x`
* this

bar = {x: 5}
bar.x = 3

in a way, the `.` (reference) operator acts like any other function
however, unlike functions, they can both be set manually and automatically
they are the only thing that is able to do something like that

to prevent this double pointers, we choose one of them
makes the most sense to choose the `bar.x -> foo.x` instead of `foo -> foo.x`


so far I've been treating `foo.x` as data, just like `foo` and `bar`
however, `foo.x` acts like a function, something like `foo.get('x')`
just like any other function, the `.` operator has an internal implementation
	while it might be obvious to just store the "address" of the value, and then use `.` to dereference the address, we can think of variations
	eg, store 2*address, and then divide by 2 when dereferencing
thus, when you do `bar = foo.x`, its like saying `bar = foo.get('x')`
when you do `bar = foo.x.x`, its like saying `bar.get('x').get('x')`, so this seems like its actually creating a binding to foo!
when we do something like `foo.x = 5`, that's where things get weird, because its not like we can do `foo.get('x') = 5`

when `foo.x` changes, its really saying "change the value at the memory location pointed to by foo.x"
so if we had another binding, like `foo.x = sourceX`, then this would be like changing `sourceX`
when `sourceX` changes, we somehow need to recognize that `foo.get('x')` has changed as well

usually in functions, we can determine the triggers through the variable names
example: `xy = x*y` -> x and y are the triggers
another example: `xy = fn(), fn = () => x*y`, we inspect the body of `fn` to determine that once again, x and y are the triggers
however, in `foo.get('x')`, there are no variable names besides foo (which we already know is a trigger)
but what is inside the body of `get`? in this case, it should return the value at an anonymous memory location
that anonymous memory location is the trigger
thus, triggers are defined through memory locations, not variables!
in our memory based system, `foo.x` and `bar` point to the same memory location, so changing either triggers both
a memory based system makes sense when working with pointers and references
for a variable based system, `bar` would need to be bound to `foo.x`, which I guess might work, just not as efficiently
	a variable based system makes it look more like a value oriented language
	this is because in a value based system, each variable gets its own memory location (no two variables pointing to the same memory)
	however, remember that circular pointers don't work in a value-oriented language :/

using the `.` operator on the left hand side of an assignment is syntactic sugar!
it merely allows us to modify memory locations without giving an explicit name
however, if you think about it, this is not usually allowed
eg, we can't do `foo.getX() = 5` to set the first element, even though we can do `foo.x = 5`
theoretically, `foo.getX() = 5` could be implemented:
	foo.getX() returns a value at a memory location, change the value at that memory location to 5
	if the function happens to return a dynamically-created temporary value, like `foo.toString()`, then simply erase that memory location when you leave the scope
NAHHH this is not true, because usually when u do `foo = bar.x`, foo is a new memory location



usually for a function, like `foo.toString()`, we don't know if the output is a dynamically-created temporary value, so assigning to it might have no effect
	if its dynamically created every time, then after assigning to the memory at `foo.toString()`, there will be no way to access the new value
	because a second call to `foo.toString()` will just create a new temporary value
however, for `foo.x` or `foo.get('x')`, we know for sure that it points to a memory location, so we can always assign to it



`foo.x = 5` is syntactic sugar for `foo.set('x', 5)`
`foo.a.x = 5` is syntactic sugar for `foo.get('a').set('x')`
note that these setters and getters have no explicit implementation. the implementation is internal
once we declare foo as an object with `foo = {}`, it gains these special setters and getters




`bar = foo.a`, `foo.a.x = 5`
the way this would work in flo diagram: `foo.a.x => foo => foo.a => bar`
this follows the propagation method
however, with our memory-location based triggers, we can skip the intermediate `foo` step, and do `foo.a.x => foo.a => bar`
this is the difference between name based and memory based binding systems
is memory based just an optimization?
first must prove that they both work, and do exactly the same thing

this is the real reason why the alias system works: (not reduction)
the first variable "names" the memory location, all other aliases just point to it



Summary
so for, we have explored 3 types of binding systems for reference based models
1. graph-traversal (variable-name based, adapted from value-based ideology)
2. event propagation (variable-name based, the way flo seems to work?)
3. memory location based (optimization?)



memory location based is the only one whose complexity doesn't change no matter where in the tree it is
`foo = bar` and `foo.x.x.x.x = bar.x.x.x.x` will both work the same in memory location based
for event propagation, the deeper down the tree, the further the propagation, the slower it is
for mirror-copy, the further up the tree, the larger the copy, the slower it is


ITS NOT REALLY MEMORY LOCATION BIND, because bindings should not change, but memory and data structures do
easiest way to think about it is like wires, in flo diagrams
if `a = b, b = c, c = d`, then its one long wire from `a` to `d`, with `d` being the data source, and `a` through `c` being wires coming out of it



the main issue is
the data source gets changed through the setter, so all bindings to the data source is triggered
how to trigger all aliases of the data source?
we can make each alias another data source (mirror-copy method)
we can just force the trigger to propagate (propagation method)
or we can redirect all bindings to the alias, to the data source (memory location method)


remember that currently, bindings are based on variable names
this works fine if all variables point to values
javascript (as well as many other languages) also introduces the idea of collections
`bar[0] = foo.x` can be thought of as shorthand for `bar.set('0', foo.get('x'))`
the issue arises when we have "collection aliasing", aka `foo = bar` or `foo = bar.x`, where `bar` and `bar.x` are both collections
	note: this is a special case of collection bindings, where the right side is made up of one variable, and that variable refers to a collection
	doesn't apply to things like `foo = reverse(bar)`, because here a new collection is being made
	we'll go more in detail on this later

collection aliasing allow things to change "invisibly"
eg `foo = bar`, `bar.set('x', 5)` does not change `bar`, so the `foo = bar` binding is not triggered



easy way to identify an alias binding without parsing the right hand side: check if righthandside.head is in trigger dictionary

```js
foo = bar;
x = foo.x*2; // trigger on bar.x
```



test.bind(foo, [bar, bar[0], bar[1], ...], args => {
	for (var i = 0; i < bar.length; i++) {
		foo[i] = bar[i]; // how to detect aliasing here
	}
});


### Dynamic Bindings

* So far I have only been concerned with creating bindings
* however, I realized that for collection bindings, there are many cases where I will have to remove/reassign bindings
* for example, consider `mapbind(foo2, foo, x => x*x)`
* with our current implementation of `mapbind` (shown earlier), if you add another element to `foo`, then there will be double bindings on all the rest of the elements!
* also, consider `reversedFoo = reverse(foo)` where `foo` and `reversedFoo` are both collections, and `reverse` simply rewires `foo`
* what happens when `foo` starts out with one item and adds another?

```
  foo[0] ---> reversedFoo[0]                foo[0] -. .-> reversedFoo[0]
                                                     X
                                            foo[1] -' '-> reversedFoo[1]
```
* the alias binding of `foo[0]` needs to be reassigned!
* lastly, consider a multiplexor (mux for short): `output = x? foo : bar`

```
  foo --
          .----> output
  bar ---'
```
* this doesn't have any data collections, but it still has dynamic bindings!
* this helped me realize that *collection bindings are not about data collections*, or bindings involving arrays/sets
* collection bindings are about defining sets of inner, dynamic bindings
* when the input to a collection binding changes, the inner bindings change
* further discussed in the section "Grouping Bindings"

### Alias Graphs

* let's revisit what we said earlier: when the input to a collection binding changes, the inner bindings change
* compare this to a normal binding: when the input value to the binding changes, the output value changes
* for a collection binding, the output value is the set of inner bindings
* if you have multiple collection bindings chained after eachother, then binding changes propagate along the chain, just like value propagation in a chain of normal bindings
* lets see how the aliasing algorithm factors into this

* construct a graph of alias bindings

```
  foo --
          .----> output
  bar ---'
```
* when a early alias binding changes, the change propagates through the graph, so that the normal bindings at the ends can be triggered to re-compute the source aliases
* if you think about it, when the alias algorithm bindings something like `[foo.x] --> { barx2 = bar.x*2 }`, we are saying "the value of bar.x is foo.x"
* so when the alias bind changes, its like saying "the value of bar.x is now fizz.x"
* so alias bindings really do work very similarly to how normal bindings work, propagate through the graph and updating "values"

### Update Order **[+ KEY POINT!!!]**

* consider something like `foo = reverse(bar)` and `bar2 = bar[1]`
* we have one dynamic collection alias binding, and one regular alias binding
* lets say `bar` starts as `[4, 2, 5]` and gets reassigned to `[3, 4]`
* we expect the end result to be `foo = [4, 3]` and `bar2 = 4`
* notice that two (sets of) updates happen in parallel here
	* the dynamic binding for `foo` gets triggered, reconstructing the inner bindings
	* the value bindings (the inner bindings of `foo`, and the binding for `bar2`) get updated with new values
		* more specifically, we the updates `bar[0] = 3`, `bar[1] = 4`, and `bar[2] = undefined`
* first notice that, with our current model, the update order doesn't matter in regards to the end result (see key point below)
* however, note that if the value bindings update before the dynamic binding, then `foo[0]` will temporarily show `undefined`
* in addition, at least for `foo`, the value bindings can be completely ignored, because the dynamic binding re-evaluates the input values anyways
* however, for `bar2` the value bindings clearly can't be ignored
* so whats happening?
* we can think of Flo/Wijit as a hierarchy of stages, one static and two dynamic
	1. At the highest level, we have the Wijit code or Flo drawing. This definition is static, never changes
	2. The code defines dynamic bindings, how the values are "wired" together. These dynamic binding modules can change and reconstruct their inner bindings
		* this is the dynamic runtime graph directly defined by the code. While the modules may change, the graph between them does not
	3. The dynamic bindings create a graph of value bindings. This stage contains all the values for the current state of the program

	*  ================================================= WHAT ABOUT ALIAS BINDINGS =============================================================

* notice how everything consists of two dynamic components: the "wiring" between the values, and the values themselves
* when `bar` updates and the dynamic binding for `foo` updates, that is the wiring changing
* when the inner bindings from `bar` update, that is the values updating
* now we see why the value updates for `foo` are redundant:
	* conceptually, wiring and values change independently of eachother
	* however, for our implementation, when wiring changes (dynamic bindings re-evaluate), the values get re-evaluated too!


key point:
* as long as we always default to re-evaluation, then update order won't matter
* if at any time, a node is "invalidated" with no other information, it should be able to re-evaluate the outputs and fully recover
* this also means that events don't need to (and should try not to) carry any information





### Grouping Bindings

* we need to group the inner bindings, so that can be cleared and reassigned easily
* we can have a "binding controller" that manages all the inner bindings
	* so when an inner binding is triggered, it first triggers the "binding controller", which in turn triggers the inner binding
* for example, if we have `mapbind(foo2, foo, x => x*x)`, and currently `foo = [3,5]`, then currently there are two inner bindings
* instead of doing `bind(foo2.0, [foo.0], x => x*x)`, `bind(foo2.1, [foo.1], x => x*x)`, we instead do `bind(null, [foo.0, foo.1], controllerfn)`
* hmm, this still won't work, because the binding controller still needs to keep track of what bindings point to it
* instead, have the collection bind keep track of all triggers that point to it
* in addition, instead of storing the binding directly inside each trigger, store it under a unique id, so that the collection bind knows which bindings belongs to it
* for the unique id, just use the destination of the collection bind!
* so if we have `mapbind(foo2, foo, x => x*x)`, and currently `foo = [3,5]`:
	* the collection bind will make two bindings with the triggers `foo.0` and `foo.1` respectively
	* each of those triggers will store `foo2: innerBindingEvalFn`
	* when `foo` pops off the `5`, then the collection bind goes to `foo.1` and removes FDSAFDSA

	*  ================================================= FINISH THIS =============================================================

* another method would be to store a remove() function in each binding
* the collection bind would just store all of its bindings, and call remove() on each of them
* giving each binding a remove() function implies that the bindings can be passed around, and anybody can call remove()
* however, this breaks encapsulation: all inner bindings belong to the collection bind, so that collection bind should be responsible for creation and destruction
* note that both of these methods require a special "bind" function for inner binds

### Modules

* I need to pass in a special alias and normal bind function to the inside of the collection bind
* for example, a "reverse" collection bind would look like:

```js
FloModule.bind(dest, [src], (innerbind, inneraliasbind, array) => {
	for (var i = 0; i < array.length; i++) {
		inneraliasbind(dest+'.'+(array.length-i), src+'.'+i);
	}
});
```
* I could group `innerbind` and `inneraliasbind` into a object:

```js
FloModule.bind(dest, [src], (innerscope, array) => {
	for (var i = 0; i < array.length; i++) {
		innerscope.aliasbind(dest+'.'+(array.length-i), src+'.'+i);
	}
});
```
* notice that FloModule already has the `bind` and `aliasbind` functions, so it seems like for `innerscope` I could just pass in a new FloModule object
* this made me realize that thats exactly what dynamic binds do
* dynamic binds create new binding modules
	* kind of like how in javascript, functions define new scopes
* for example, in the `reverse` bind above, lets assume `src` is an array of length 10
* the `reverse` bind will create a FloModule that has alias bindings that rewire 10 inputs to 10 outputs
* when `src` changes to length 11, then the `reverse` bind needs to destroy the old FloModule, and recreate one with 11 inputs and 11 outputs
* now let's consider what should make up a FloModule

### Modules (continued)

* A FloModule should be a self-contained definition of bindings/aliasbindings
* when you connect two modules together, you need to define how to map the outputs of the first, to the inputs of the second
* for example, if you had two FloModules `add(a,b) { c = a+b }` and `square(x) { x2 = x*x }`
* to connect them, we first define a new module and its inputs and outputs
* lets give it 2 inputs `m,n` and 1 output `p`
* then we map `m,n` to `a,b` of the `add` module, and map the `c` output of the add module to `x` of the `square` module, then map `x2` to `p`
* notice how these mappings prevent variable collision
	* Eg if `square` also defined its output as `c`, it wouldn't collide with `add` because the outer module maps both `c`s to different variables
* so whenever you import and use a module, you have to define the mappings between the variables in your module, and the inputs/outputs of 
* collection and dynamic bindings are special in that they should automatically map the inner module

### Garbage Collection

* if inner FloModules are like javascript scopes, then perhaps we can use javascripts method for cleaning up scopes
* in javascript, when variables are defined in a scope, and then control leaves the scope, then all the variables are "marked" for garbage collection
	* "marked" as in no more pointers to it
* so in our case, when a dynamic bind needs to recreate its inner module, it could simply invalidate the old module, insteaad of removing all the old bindings
* we also need to ensure that triggers do not trigger the invalidated bindings
* to solve this, we can have a timestamp as an id for each created module, and each binding in that module also contains that id
* when a trigger leads to a inner module, it first checks the timestamp of the binding and the module, and if it doesn't match, then that binding is invalidated and gets removed
* this "lazy" removal that only occurs during a trigger should save a lot of time, in case some invalidated bindings are never triggered, they don't need to be removed





### Alias Method uses Dynamic Bindings

* an important thing to note is that, while dynamic bindings and value bindings are a fundamental way Flo works, alias bindings is an optimization in the implementation
	* consider `foo = bar` and `x = foo.x`, and `bar.x` changes
	* most logical response: `foo` updates (including all its children), which in turn updates `x` when `foo.x` updates
	* this is the "event propagation" method discussed earlier
	* the "copy value" method and "alias binding" methods are both optimizations
* notice that alias bindings involve removing and recreating bindings
	* eg, `output = mux ? inputA : inputB`, `x = output.foo`
	* when `mux` changes, `x` switches between binding with `inputA` and `inputB`
* thus, any binding attached to an alias is a dynamic binding!
* another way of looking at it is, using the previous mux (short for multiplexor) examples, `x = aliasSource[output].foo`





notice that value bindings, dynamic bindings, and alias bindings have rather different mechanisms
what if we mix them?
`foo = mux ? myValue : myArray`
the issue is that, bindings to `foo` are different based on whether `foo` is an alias or not
if `foo` is an alias, we use a dynamic bind, otherwise we just use a static bind

solution: everything is an alias bind? because everything is based off memory based binding?



* note that for the following statements, "outer" refers to the scope of the containing module, and "inner" refers to the scope of the inner module
* to make modules (aka dynamic bindings) simple, we reserve a namespace in the outer module's `bindings` dictionary specifically for inner modules
	* so no need for anything special when creating the module's inner bindings, just prepend the namespace prefix
* we identify each inner module by the outer variable mapped to its first output, which is guaranteed to be unique (because each output maps to exactly one binding)
* we only store the dynamic binding's local inner variables in the reserved namespace
	* inputs and outputs are simply replaced by the outer variables that are mapped to them
	* so if we have `InnerModule { y = x*x; z = y % 5 }` and `OuterModule { InnerModule(foo = x, bar = y); fizz = bar+5; }`, the outer bindings would look like:
	`values: { foo: 3, bar: 9, fizz: 14, __innerBindings: { bar: { z: 4 } } }`
	* notice that "local inner variables" are just outputs that are not mapped to any outer variables
	* also notice that `z` is never used, so it can be discarded. This is discussed in the later section "Observed Outputs"



* 




for now we've only been considering binds with a single output
but it's possible for binds to have multiple outputs
consider a function `quotient_remainder(a,b)` which finds the quotient and remainder of `a/b`
while this could be done with two bindings, but a single bind makes more sense and is more efficient
	another, more complex example would be a left+inner+right join of two sets, where there would be three outputs:
		1. elements only in the left set
		2. elements in both sets
		3. elements only in the right set






```js
new FloModule('integer_divider', function () {
	this.bind('my_divider_module', ['dividend','divisor'], (output, dividend, divisor) => {
		output.remainder = dividend%divisor;
		output.quotient = (dividend-output.remainder)/divisor;
	});
});

// which is equivalent to

new FloModule('integer_divider', function () {
	this.bind({__namespace__: 'my_divider_module'}, ['dividend','divisor'], (output, dividend, divisor) => {
		output.remainder = dividend%divisor;
		output.quotient = (dividend-output.remainder)/divisor;
	});
});
```


```js

new FloModule('integer_divider', function () {
	this.bind(['quotient','remainder'], ['dividend','divisor'], (output, dividend, divisor) => {
		output.remainder = dividend%divisor;
		output.quotient = (dividend-output.remainder)/divisor;
	});
});

// which is equivalent to

new FloModule('integer_divider', function () {
	this.bind({quotient: null, remainder: null}, ['dividend','divisor'], (output, dividend, divisor) => {
		output.remainder = dividend%divisor;
		output.quotient = (dividend-output.remainder)/divisor;
	});
});

// which is equivalent to

new FloModule('integer_divide', function () {
	this.bind({quotient: 'quotient', remainder: 'remainder'}, ['dividend','divisor'], (output, dividend, divisor) => {
		output.remainder = dividend%divisor;
		output.quotient = (dividend-output.remainder)/divisor;
	});
});
```




* notice that timestamps are only needed for alias binds and binding references/collections
* consider what it would look like with primitive value bindings (no references/collections), but still with dynamic bindings


```
code:

   b = a*2
   d = x ? b : c
   e = d+5

value graph:

  a ---> b ---.
               '----> d --> e
         c --
```

* notice how, even though there is a dynamic bind, if we think of the dynamic bind as a switch, and visualize update-events propagating through each node from left to right, then there is no need for timestamps
* however, notice how alias bindings complicate things:

```
code:

   b = {myprop: a}
   d = x ? b : c
   e = d.myprop

value graph:

   .-----(alias child)---.
  a ---> b ---.           '.
               '----> d --> e
         c --

(note: "alias child" refers to a child binding dynamically created by alias bindings)
(note: there are unshown alias child bindings between a->b and a->d)
```
* notice how when `x` changes, the `d` will switch from `b` to `c`, but when `a` updates, `e` will still get updated
* because alias bindings create a "jump" from `a` to `e`, even if we somehow propagate updated alias information along the normal route, it will be too late
	* the "alias child" bind allows the value propagation to jump ahead of the normal route
	* by the time we can update `e` with the new alias information, it will have already been updated with `a`'s value, so there will be a flicker in time where `e` has the wrong value
* this is why we have timestamps, so that the "alias child" binding gets invalidated instantly after `x` changes
* however, note that adding timestamps means now before triggering any binding, we have the check the timestamp
* this slows down every trigger and update event
* we could restrict timestamps to alias child bindings, but that complicates things further
* remember that we considered another solution to updating alias-child bindings:
	* have whoever created the alias-child binding keep track of it, and when the alias bindings change, remove the outdated alias-child binding
* this is better, because it doesn't slow down the update-events, and only slows down alias-child-binding creation by a tiny bit (to keep track of created bindings)



### Lazy Evaluation


### Observed Outputs

* we don't need to update outputs that are not being observed
* for example, for a mux, `foo = x ? a : b`, only one output is being observed at a time
* whichever output is not being observed, does not need to be updated
* this property traverses backwards as well
* if `a` is not being observed, and `a = m + n`, then `m` and `n` don't need to be updated as well

### More Efficient Event Propagation (Set-Route Event Propagation)

* in the previous section, we looked at how update events propagate through a network of only primitive value bindings
* update events simply propagate through each node in the value graph
* this is the simplest and most intuitive way of thinking about how Flo/WIjit works
* conceivably, we can extend this to reference/collection bindings
* consider this graph

```
code:

   b = {myprop: a}
   d = x ? b : c
   e = d.myprop

value graph:

  a ---> b ---.
               '----> d --> e
         c --
```
* lets say `a` changes from  3 to 5
* this triggers `b`, which doesn't do anything, but passes the event to `d`, who also doesn't do anything, but continues passing it to `e`, who updates to the new value of 5
* note that `d` needs to know that the update originated from the `myprop` child of `a`, so that `d` knows to trigger `e`, which is bound to `myprop`
* thus, when the update event "escalates" from `a` to its parent `b`, the event carries the information of which child was updated, so at the end of the line `d` knows which child binding to trigger
* for this type of event propagation to work, **these events need to carry information**
* notice the distinction between this event propagation, and the event propagation discussed much earlier (in the section "Deep Property Binding Revisited")
* in the old event propagation, events are just propagated everywhere during run time
* in this new method, the routes for event propagation are set during "compile time" (when the dynamic=bindings creates the value graph)
* thus, there are no "wasted" events. An event will only propagate up to parents if a binding is explicity defined for it
* in addition, an event can "jump" multiple parents, eg if in the example above `b = {foo: {bar: a}}`, then when the event propagates from `a` to `b`, its jumping to the grandparent
* this event propagation strictly follows the value graph, so it is much more efficient, and also very intuitive

* also, set-route event propagation always follows the graph, instead of creating "jumps" like in the alias binding method
* thus, there is no need to worry about timestamps or removing "jump" bindings

### Alias Bindings vs Set-Route Event Propagtion


```
code:

   b = {myprop: a}
   d = x ? b : c
   e = d
   f = e
   g = f.myprop

value graph:

  a ---> b ---.
               '----> d --> e --> f --> g
         c --
```


* in the first





### Triggering Nested Property Bindings

* we have talked about the copy method, event-propagation method, and alias method to solve the issue of aliases
* more specifically, the issue of `foomirror = foo` and being able to trigger `foomirror.x` when `foo.x` changes
* however, there is one last issue we need to solve
* `x = a.a.a`, we need to trigger this binding whenever `a`, `a.a`, and `a.a.a` changes
* from a different perspective: if `foo = {a, b: {x, y}}`, and `b` changes, we need to trigger bindings on `b`,`x` and `y`
* in essence, this is a reverse-prefix lookup problem:
	* given a prefix, return all words in the dictionary with that prefix
	* (in our case, given a node in a tree, return all bindings that are attached to descendents of that node)
* we actually discussed this exact issue much earlier in the section "Deep Property Binding", and came up with 3 solutions:

1. funnel bind: keep as one binding, with three triggers `[a, a.a, a.a.a]`
2. incremental bind: separate into two bindings `temp = a.get('a')`, `x = temp.get('a')` with two triggers each
3. runtime propagation: during runtime, when a parent is updated, trigger all children (and all their children, etc...)

* consider a network with M nested property bindings, each nested to N layers deep
* the last solution is the simplest to analyze: takes up no space, but event propagation is O(N) at worst (updating the highest ancestor)
	* however, every object in the value graph is impacted, with events propagating through the properties of every object, even if there are no nested property bindings
	* thus, event propagation is significantly slowed down, and there is a lot of wasted propagation
* the first solution requires N triggers for every property binding, so M*N space, but event propagation is instantaneous, O(1)
* the second solution, at worst, also requires N triggers for every property binding. However, event propation is O(N) (has to go through all intermediate ancestors)
	* no wasted propagation though. Kind of similar to the set-route event propagation method
* the second solution gets more interesting when the network becomes more interconnected
* consider a tree-like network, with nested property bindings at every leaf node:

```
                         _ a _
                        /     \
                       a       b
                      / \     / \
                     a   b   c   d
                    / \ / \ / \ / \
                    a b c d e f g h
```
* here, the first method would still take up O(M*N) space
* however, the second method would only have one binding at each node, so a total of 2M-1, or O(M) space
* the second method only reaches its worse case of O(M*N) space in a completely disjoint network, where every nested property is completely separate from each other
* the more interconnected the network, the lower the space cost, and the more sparse the network, the higher the space cost
* the second solution is like a compromise between the first and third: not as much space as the first, but not as slow as the third
* it seems like the first solution is more advantageous for shallower networks (N << M)
* the third solution is better for populated networks (# of bindings >> # of nodes)
	* imagine a very popular data channel, like the weather forecast, where tons of websites and apps have bound to this data
	* every node in this value graph would have thousands of bindings, so in the third method where every update propagates to all descendants, there would be no wasted propagations
	* in this case, the first and second methods would be extremely inefficient space-wise

### Deep Bindings

* Note that so far, we have been considering nested property bindings, aka binding to nested properties of an object, eg `foo.a.a = x`
* as with any bind, this only detects when that specific reference/value changes
* for imperative code, we oftentimes want to detect when any nested property changes, not just when the top-most reference changes
* eg if we have some imperative code module that adds up all the integer-value descendants of `foo`
* if we just created a binding to to `foo`, then our module wouldn't be triggered when `foo.x` changes
* thus, we need a "deep bind", a binding that gets triggered whenever a descendant of `foo` changes
* note that if we deep bind `foo.a.a`, it will also be triggered when `foo` or `foo.a` changes, but that's just a part of nested property binding, not a part of deep binding
	* deep binding only monitors descendants

Two ways to implement deep binding:
1. prefix checking
	* check if changed node is descendant of deep bind root (the input to the deep bind)
	* aka if we deepbind `foo.a.a`, then we need to trigger on things that `foo.a.a.` is a prefix of, eg `foo.a.a.bar`
	* if we are deepbinding X and we change Y, we trigger the binding if X is a prefix of Y
2. recursive bind
	* same mechanism as the copy/mirror bind mentioned earlier
	* create a listener at the deep bind root that clones itself for each child (which will clone to grandchildren etc etc until all descendants have  a copy of that listener)
	* this method will monitor every single node under the deep-bound tree, and if any node changes, it will automatically re-configure itself to monitor any new nodes added to the tree
	* eg if we deepbind `foo.a.a`, and `foo.a.a.bar` changes, all listeners from the old descendants of `foo.a.a.bar` are removed, and new listeners are added for each of the current descendants of `foo.a.a.bar`
	* to account for circular references, we do a graph search (keep track of visited nodes when adding listeners)

Comparison:
* prefix checking requires a new check for every single "set" operation
* recursive bind is pretty slow and expensive, but only affects the deep bind
* recursive bind also doesn't introduce any new mechanisms

* **deep bindings are syntactic sugar**
* notice how deep bindings can be created from recursive dynamic bindings
* they are an added feature that makes it easier to mix and embed imperative code into Flo modules
	* eg, instead of using a complicated recursive dynamic bind to flatten a tree into an array, just do a depth-first-search with imperative code
* later, in the "pure" version of Flo, deep bindings should not be possible
* deep bindings lack the advantages that recursive dynamic binds have: tracking internal changes without affecting the whole object
	* after flattening a tree into an array, if you change one value in the tree, you only need to change one value in the array, but the imperative deep-bind version will re-run the depth-first-search and reconstruct the entire array
* thus, we should use the 2nd method (recursive binding) so deep binding is a built-in function that requires no special mechanism, and can be removed easily


================================================== CHECK UR GOOGLE KEEP NOTES ===================================================================




### Dynamic Collections Bindings are Based on Structure

* consider the dynamic `reverse` bind, which takes an array and wires an output array such that the output elements are the input elements in reverse order
* `reverseFoo = reverse(foo)`
* when do we want the dynamic bind to be triggered, aka when do we need to re-wire the value graph?
* we need to know when `foo` has been re-assigned, but that isn't enough
* we also need to know when an element has been added or removed
* however, we can't just simply listen to all properties+values of `foo`, because we don't need to know when an existing element's value changes
	* the value graph will handle that
* notice that essentially, we are listening to when the _structure_ of `foo` changes
* this makes sense, because when the structure changes, the wiring would have to change too
* thus, for javascript objects, the structure changes when
	1. the main pointer is reassigned
	2. a property is added
	3. a property is removed
* this is only for dynamic binds though. Normal binds would just check the value of the pointer
	* because in normal binds, you can't monitor structure in the first place
	* if you tried to make a normal bind monitor a structure, it wouldn't work, because you wouldn't know when child values change
	* eg if you made a normal bind that 
* this gets a little ugly for something like `output = foo == bar ? 1 : 2` (assuming foo and bar are both objects), because this binding is based only on the value of the pointers, not on the actual structure
	* wasted re-evaluations when foo/bar change structure, because the value of the pointers don't change
	* ideally, the compiler would be able to detect this and use a normal bind instead of a dynamic bind

### Nested Binding vs Dynamic BInding

* remember how much earlier (in the section "Collection Listeners Revisited"), we talked about how collection bindings create "sub-bindings" which absorb the onset event?
* lets revisit that with an example:
* lets say you have a collection binding, that binds to the array of phrases `savage[]` and:
	* counts the number of phrases with the word `rekt`, outputting it to `rektCount`
	* constantly outputs elements 1,3, and 5 to the object `onethreefive = {one: ___ , three: ___ ,five: ___ }`
* lets say for some reason, element three constantly alternates between `undefined` and `0`
* because a value of `undefined` implies the structure has changed (key-value entry was removed), then this means that the dynamic binding constantly gets updated
* however, notice that we can make things a little more efficient by separating the `onethreefive` output to separate, non-dynamic binding
* this was, when element 3 alternates, it doesn't need to recreate the entire `onethreefive` object over and over again
* we can use a normal binding because `onethreefive` is not based on structure, it is based on value
* this is the difference between a nested binding (value based) and a dynamic binding (structure based)

### Automatic Detection of Dynamic Binds

* from the example in the previous example, notice how normal bindings and dynamic bindings respond to `undefined` values a little differently
	* normal bindings (bound to nested values in this case) stay attached to the memory location, and the output is set to undefined
	* dynamically created bindings disappear when the value goes undefined, so the output doesn't exist anymore (also undefined, but for a different reason)
* non-nested normal bindings work too
* consider two ways of defining `x2`:
	* `bind(x2 = x*2)`
	* `dynamicbind { if (x !== undefined) then bind(x2 = x*2) }`
* both result in the same output
* while its normal for a language to have multiple ways of defining the same behavior, this feels like it needs more inspection
* it seems like the main difference is that when x is undefined:
	* with the normal binding, the binding is still there, but the value of `x2` is set to undefined
	* with the dynamic binding, the binding disappears, and the value of `x2` is implicitely undefined
* perhaps determining whether a binding is dynamic or normal should be implicit, not explicit
* in order to automatically detect dynamic bindings, we need to identify and categorize a few key cases
* some indisputably dynamic bindings include:
	* reverse bind: `for (n in foo) { reversed[foo.length-n-1] = foo[n] }`
	* mux: `a = x ? b : c` where `b` and `c` are collections (or perhaps it shouldn't matter if `b` and `c` are collections, because variables can change between value/collection at any time)
* it seems like **any time the memory location of a variable is dynamic, you need a dynamic bind**
* thus, in the case of `x2`, the memory location never changes (even in the dynamic bind, because without a binding, `x2` just becomes undefined), so it should be a normal bind

### Optimizations: Breakdown into Atomic Statements, Joining Shared Paths, and Reducing Paths

* statements can be broken down to atomic parts, helping to isolate dynamic and normal binds
* eg `a = x ? b : c*5` can be broken down to `c5 = c*5` (normal bind) and `a = x ? b : c5` (dynamic bind)
* breaking bindings into atomic parts allows the compiler to determine which variables can be shared and which paths can be joined
* eg `a = x ? b : c*5` and `d = a+c*5` can be broken down to `c5 = c*5`, `a = x ? b : c5`, `d = a*c5`, thus allowing `c5` to be shared
* in addition, bindings can be joined together if they are part of a "single path"
* eg, if `a = b*5`, `b = c+1`, and `c = d%3`, and there are no other bindings to `b` and `c`, then we can reduce the three statemens to `a = ((d%3)+1)*5`
* notice how a "single path" occurs when output variables are used as input to only one binding, allowing us to substitute that input with the expression for that input
	* in the most recent example, we substituted `c` for `d%3` in the second statement, and then substituted `b` for `(d%3)+1` in the first statement
* thus, the order of steps is

1. Deconstruction: Break statements down into atomic binds
2. Comprehension: Find shared variables, and join the paths
3. Reduction: substitute single-use variables with their binding expression

### Combined Funnel and Incremental Bind: 

* remember:
	* funnel bind: one binding with three triggers `[a, a.a, a.a.a]`
	* incremental bind: separate into two bindings `temp = a.get('a')`, `x = temp.get('a')` with two triggers each
* minor optimization: if one funnel bind completely "encloses" another funnel bind, then use the smaller funnel bind in the larger one
* if we have `x = a.a.a` and `y = a.a.a.a.a`, then instead of making `[a, a.a, a.a.a, a.a.a.a, a.a.a.a.a]` the triggers for `y`, just make it `[x, a.a.a.a, a.a.a.a.a]`

```
    a -.
    a --\
    a ---- x -.
    a ---------\
    a ----------- y
```

* while this means `y` is delayed by one step, this extra step is being used to trigger `x`, so there's no waste (at least in a single-threaded system)
* note that this only works for "linear structures", aka when one funnel completely encloses the other because their triggers are along the same path
* note that for if `y` only partially enclosed `x` (not fully enclosed but some shared ancestors), then no optimization is used
	* see "Tree Variant" below for a different take
* advantages:
	* for single-threaded systems, same speed as funnel bind
	* for linear structures, takes up the same space as incremental bind (same number of triggers)
* disadvantages:
	* slower setup time in some cases (if `x` is bound after `y`, then `y`'s funnel has to be restructured)
	* in a multithreaded system, this prevents `x` and `y` from being triggered at the same time
	* more complicated to remove bindings in some cases (if `x` is removed, then `y`'s funnel has to be restructured)
	* for tree structures, takes up more space than incremental bind

Tree Variant:
* if a funnel bind doesn't completely enclose another funnel bind, but shares some ancestors, than create an intermediate binding for the shared ancestors
* eg for `x = a.a.a` and `y = a.a.b.b`, then add intermediate binding `z = a.a` and use `z` in the triggers of `x` and `y`
* advantages: always uses the same amount of space as incremental
* disadvantages: every intermediate binding slows it down a little

### Nested Property Binding: Graph Representation

* what would nested property binding look like in a Flo network? how would it propagate through the value graph?
* the value graph is the most intuitive way of looking at Flo, and is what Flo is based on, so studying how it works in the graph helps understand the core issue
	* note: set-route event propagation adheres closest to the Flo graph representation
* consider `bind(y = foo.x.x`
* as we mentioned in the section "Deep Property Binding", this can be thought of as `bind(y = foo.get('x').get('x')`
* instead of having a funnel bind with 3 triggers, we have three atomic bindings (including the one that creates `foo`): `foo = ...`, `temp = foo.x`, `y = temp.x`
* any one of `foo`, `foo.x`, and `foo.x.x` changing will correspond to an update of exactly one of those atomic bindings
* the funnel bind is just a reduction optimization that compresses those three atomic binds into one bind with 3 triggers
* if we decompose all nested property bindings into atomic bindings, and follow this reduction optimization, the graph turns into the tree-optimization-variant of funnel bind

### Reference Binds vs Alias Method

* the name "alias binding" makes it seem like they are a special case of a object binding, where the left side exactly equals the right side
* doesn't make it obvious that alias binds and normal binds are all that are needed to create a complete binding model for a reference based data system
* this is because alias bindings are really "reference" bindings, analogous to pointers or references
* thus, any data structure can be decomposed into values and references

* value bindings are for defining values
* reference bindings are for defining structures

* note that alias method is different from reference binds
* alias method is a way of triggering reference binds, by keeping track of the "reference root", aka the first variable in a chain of reference bindings

### Main Interface

* in order to actually complete a working implementation of Flo/Wijit without worrying about this optimizations, we have to create a high level interface that we can roughly implement now, and optimize later, without too much refactoring
* thus, we need to summarize all findings so far:

Bindings:
	1. Value bindings: creates a value
	2. Reference bindings: creates a reference
	3. Dynamic bindings: creates more bindings
Triggers:
	1. Normal triggers
	2. Nested binding triggers
Modules: multiple dynamic bindings
Built-ins:
	* Map bind
	* Reduce bind
	* Filter bind
	* Deep bind

* this is re-iterated in the section: Summary>Mechanisms

### Atomic Bindings

* ideally, we only create one binding at a time (corresponding to one output at a time)
* this should be possible because the value graph is a DAG, so we'll just be building the DAG one node at a time in the "forward" direction
* however, this gets a little complicated with dynamic bindings, because currently for list bindings (eg map bind), we use a for-loop and some imperative code to create all the output bindings at once
* the solution to this is covered in the next section

### Collection Binding/Iteration Using Linked-List Dynamic Bindings

* one way to get rid of for-loops is to use linked-list-style array iteration, like how most functional and logic languages work (eg lisp, prolog)
* this way instead of accessing elements by index, we do as follows:
	1. create a binding for the current element
	2. create a dynamic binding to check for the existence of a next element
		* and if the element exists, execute these steps for the next element
* thus, instead of a giant dynamic binding that uses for-loops (aka imperative code), we use a chain of dynamic bindings
* in addition, this means we only create one binding at a time, achieving atomic dynamic bindings (at least for list iteration)
* we also aren't introducing any new mechanics, just leveraging object properties
* iterating across object properties will follow the same convention
	* maintain a linked list of all registered properties for each object
* will automatically detect when a property is added or removed
	* takes care of "structure listening" as discussed in the section "Dynamic Collections Bindings are Based on Structure", without introducing any new mechanisms

### List Iteration - Optimized without Indexes

* as mentioned in the last section, we can implement a dynamic list bind using something like this:

```
module ListBind(list, index, fn) {
	if (list[index] == undefined) return;

	bind(   )
}
```








### Can all dynamic binds be atomic binds?

* we just showed how to decompose a for-loop iterated list bind into a linked-list style dynamic bind, made up of completely atomic binds
* modules create multiple bindings, though modules seem like a special case altogether, like a whole new abstraction layer on top of dynamic bindings
* simple muxes use multiple bindings as well: `out = a ? x : y` either creates a binding between `x->out` or `y->out`
* if we try to decompose it into two binds: `if (a) then bind(out = x)`, `if (!a) then bind(out = y)`, now it looks like `out` can be bound to two variables (even though it never actually happens)
* we could use a priority queue method of resolving multiple bindings for one output (first non-undefined binding determines the output, everything else ignored), but does this make sense?
* or perhaps by atomic, we could mean "one output variable", so even though muxes control multiple bindings, they only create one output variable
* doesn't make sense to split up a mux's bindings, because each binding needs to know about eachother to ensure they never break rule 3 (every output is determined by exactly one binding)
... ehhh hold onto that thought



### fdsfdsafdsa

* dynamic bindings are like control statements and loops
* modules are like functions
	* not necessary, but allows for code reuse


### Modules Don't Need Triggers ============ CHANGE THIS TITLE?!?! =============

* note that my original views on dynamic binding and modules have changed quite a bit
* before I thought dynamic binding and modules were the same thing (see the section "Modules")
	* dynamic binds/modules create a group of bindings based on the values of the "triggers"
	* when a "trigger" to the module changes, all the bindings are re-created
	* for example, a group of bindings where each binding maps to an element of the input collection
* this made the most sense for collection bindings, where the bindings are based off the structure of a single collection (see "Dynamic Collections Bindings are Based on Structure")
* however, this gets complicated for situations like muxes, where we might have multiple triggers, and the triggers are separate from the inputs to the bindings
	* eg `out = ar[x+y/z]`, where input is `ar`, and the triggers are `x`, `y`, and `z`
	* (note: yes, if we extract `x+y/z` and use the result for the dynamic bind, we are left with only one trigger. This is covered later in this section)
* note that this meant modules would have both inputs and triggers, and they would need to be specified
* something like

```js
//function signature
function dynamicBind (dest, mapping, triggers, module) {
	// implementation stuff
}

//usage
dynamicBind('reversedFoo', {input: 'foo'}, ['foo.length'], reverseModule);
```

* on the upside, this was simple and made sense (at least for collection binds)
* on the downside, it was a little ugly
* this interpretation of dynamic binds and modules persisted all the way to the section "Nested Binding vs Dynamic Binding"

* however, beginning with the section "Collection Binding/Iteration Using Linked-List Dynamic Bindings", I now think about them differently
* think about them in terms of the Flo graph, and relate them to imperative and functional languages
* dynamic binds aren't just for creating bindings
* they are analogous to control structures in imperative languages
* modules are a separate idea, analogous to functions in imperative languages
* they are purely used to group code for re-use and A E S T H E T I C S
* they are **not necessary**, just like how in imperative languages we don't need functions (just have one monilithic `main()`)
* if the value graph is the first layer and dynamic bindings are the second layer, then modules make up the third layer
	* they don't change the functionality of the program, just used for modularization
* thus, dynamic bindings are separate from modules
* they are atomic expressions (not created in groups) for defining how/when a binding is created

### Two Types of Dynamic Bindings: Conditional Binds and Dynamic-Memory-Location Binds

* note that there are two types of dynamic bindings
	1. a binding created based on a single condition, eg `if (x) then bind(y = z)`
		* commonly occurs in recursive data structures, like linked-lists or trees, where the tail end points to undefined (aka not bound to anything)
	2. a binding where the memory locations of some inputs are dynamic, eg a mux: `out = x ? a : b`
		* commonly occurs in muxes or array operations, eg binary search
* we can reduce this into one mechanism in 2 ways:
	1. reduce (2) into (1): an input with dynamic memory location is just a one-hot conditional bind
		* eg. `out = x ? a : b` becomes `if (x) then bind(out = a) else bind(out = b)`
		* this has 2 possible input memory locations. If we increase it to 3, like `out = x ? a : (y ? b : c)`, now we have 3 conditionals
		* gets uglier as we increase the number possible memory locations
		* infinite possibilities: `out = myArray[x]`
	2. reduce (1) into (2): a conditional bind is just a dynamic-memory-location binding where the memory location is "undefined" when the condition is false
		* a reserved memory location that means "don't create this binding", kind of like `/dev/null`
* IMPORTANT: both these reductions are based on the assumption that no-binding is the same as undefined output, and vice versa
	* discussed further in the later section "Persistence"
* both these reductions are kind of ugly
* perhaps we should just keep these two types distinct
* after all, (1) determines when we create the binding, and (2) determines how we create the binding
* put another way, (1) affects the output, while (2) affects an input

* this still feels a little off though
* the fact that there are reductions between the two means that the two rely on the same internal mechanism
* thus, there is redundancy, and redundancy leads to ambiguity (when to use conditional binds vs dynamic-memory-location binds, if they're essentially the same thing?)


* note how in imperative languages, both these are handled through one mechanism
1. `if (x) then bind`
2. `if (a) then bind(out = x) else if (b) then bind(out = y) ... else bind(out = zzz)`
* the only difference is that in the first, not all cases are specified
* thus we need a default case????



* no binding means undefined value



* in imperative languages, we defined a bunch of statements that execute in sequence
* in Flo, we define how outputs are created from inputs
* so if in imperative language, we have something like this: `if (x > 0) then y = 5`
* then in Flo, we are saying that `y = 5` if `x > 0`, otherwise `y = undefined`
* this follows reduction (2) mentioned in previous section
* this also ensures that we don't have to worry about when binds appear/disappear
* whenever an output is declared, it is always bound to some input expression
* defines the output in terms of inputs, instead of in terms of bindings



* if any input is undefined, then output is undefined
	* makes stuff simpler
	============= WRONG, CONSIDER A MODULE THAT INTERNALLY USES AN `if undefined` STATEMENT TO HANDLE UNDEFINED INPUTS =================
	* perhaps special case when input is fed into an `if undefined` module?
	* depends on what operations/modules can handle undefined inputs, and which can't
	* think about this later, this is just for convenience, not an integral part of the language

### Switches == Dynamic Bindings ========================= DOES THIS STILL MAKE SENSE IN THE CONTEXT OF THE SECTION ABOVE ============================

* as mentioned in the previous section, dynamic bindings are not really bindings
* a dynamic binding just combines two components: a condition and a binding
* the condition is really just a modifier to the binding
* we can take any binding (value or reference), and add this condition





* think about it in terms of outputs, in the Flo graph
* if we have a set # of outputs, then at any moment of time, each output must have a binding, like a value or maybe some default value (aka base case)
	* note: a default value of "undefined" still counts as a binding, because an output needs a binding to have a value

	=============== NO THIS IS WRONG, UNDEFINED SHOULD MEAN NO BINDING, ESP FOR THINGS LIKE LINKED LISTS EG `linkedListElem.next == undefined` =========================

* in this case, all bindings are dynamic memory location binds
* only when we have a dynamic # of outputs, like in a map bind, do we have to worry about creating/destroying bindings
* however, if we have a dynamic # of outputs, we need to be able to iterate through those outputs
	* otherwise how would we reference these dynamically created outputs? Without a name to reference them by, they are useless
* we need to wrap these dynamically created outputs in a named collection so we can iterate through them
* this named collection represents one output, so once again we are left with a set # of outputs
* consider a doubly linked list: the head and tail are the only outputs
	* even though there is a dynamic # of elements, there are only 2 outputs, all other elements are reached from this set # of outputs
* in summary, in order to be able to reference all outputs, there has to be a set number of outputs, and if there's a set number of outputs, then we always use dynamic memory location binds




### Don't Throw Errors, Output Undefined

* throwing errors is an action/event, meant for imperative/functional languages
* Flo is about data and persistent definitions
* for cases that are not accounted for, output should be undefined

### Persistence, Muxes and Branches

* imperative code is forward moving
* a sequence of statements executed in forward direction (forward in time)
* uses muxes, aka if-else statements

```
x ---.--- if x > 3 ----- do something
      '-- else --------- do another thing
```

* in Flo, update events move fowards, but conditionals are "backwards" in a sense
* define outputs in terms of inputs
* uses muxes

```
```

* notice how both branches are evaluated, but only one branch's output is used at the end
* this makes switching between the two outputs very fast
* however, sometimes you might want to save space/computation, and prevent a branch from being computed until needed
* this can be solved with "observability" (discussed)

* you can do this with a mux, combined with the fact that binds are not evaluated if the input is undefined (and the output is automatically undefined)
	* note: if-undefined modules are a special case, discussed later
* something like

```
```








* 




### Persistence


* currently modules and bindings are persistent

* from assumption that undefined = no binding

* different from imperative code, where stuff can be conditionally executed

* currently, everything in the graph is executed

* how to prevent infinite recursion?

* forward-moving: a conditional binding that disables/removes all bindings after it
	* unless it reaches an if-undefined input to a binding? in order to explicitely define persistent modules

======================================= BREAK =========================================

* observation-based is another solution
* modules are needed for recursion, works at the module level
* to prevent infinite recursion, this mechanism needs to work at the module level too
* observation-based currently works at the reference-binding level
* needs to work at module level
* what happens for case like

```
        ______
  ---->|      |-----
    ,->|______|--,
    '------------'
```

* observation-based won't work, because technically this module will always be observed (by itself)
* we could modify the definition of observation-based to not include inputs that come from the same module's outputs
* this won't work in all cases, what if we just inserted a do-nothing module inside the output-to-input loop

```
        ______
  ---->|      |-----
    ,->|______|--,
    |     __     |
    '----|__|<---'
```


* conditional-bind method moves foward
* observation-based method moves backwards
* oftentimes we will be dealing with branches, like

```
      ,-----.
  ---<------->---
      `-----'
```

* in this case, both conditional-bind and observation-based will do the same thing (removing a branch from the front or the back will do the same thing in this case)
* distinction arises with tree-style branches
* conditional-bind works on trees with multiple outputs

```
      ,----
  ---<-----
      `----
```

* observation-based works on trees with multiple inputs

```
  ----.
  ----->---
  ----'
```

======================================= BREAK =========================================

* another special case

```
            __            __
        ,--|__|---.----->|  |--.
       /           \ .-->|__|   \
  ----<             X     __     >---->
       \    __     / '-->|  |   /
        `--|__|---'----->|__|--'

```

* what should happen in this case?



### Passive Language vs Active Language

* many optimizations have been discussed so far, each with their own tradeoffs
	* alias binding: slow alias index updates (eg when mux switches inputs), fast alias value updates
	* lazy updates: fewer unnecessary updates, more memory usage (needs a timestamp for every binding)
	* nested property triggers: funnel method vs incremental method vs funnel tree-variant
* a passive language picks and chooses which optimizations to use, and makes a single compiler/interpreter
* an active language has an active interpreter, and continuously analyzes the inputs and use cases of the program (AKA module in the case of Flo) to determine which optimizations are best, dynamically changing the interpreter itself
* note that this is an optimization in itself, which also has its drawbacks
* namely, this slows down the interpreter because it needs to run analysis on the inputs, and dynamically change itself
* note that the more a module is used, the more data the interpreter can analyze, and the more efficient and effective the interpreter becomes
* after a module has been used millions of times, the interpreter is very confident in its choice of optimizations, and will rarely need to change them
* thus, the interpreter will become faster and better over time, and the slowdowns due to restructuring itself will also reduce over time
* a network of modules, where each machine is assigned a module, and any program with dependencies on that module makes a remote call to that machine, where the output is calculated and returned to the caller
* this way, all usages of a module are localized, so that the interpreter maximizes the number of data points it gets, and this optimization's benefit is maximized
* also, instead of having dependencies installed on every machine, this means it only needs to be install once, reducing total memory usage
* if a module is used extremely often, then it can be distributed across multiple machines, as long as analysis data is shared between interpreters
* perhaps if there are two drastically different use cases for a module, then there would be two different interpreters, and the analysis data would go to a different interpreter depending on the apparent use case
* eg if a certain module is used often in both server-side and UI-side code, the server-side use case would use lazy-evaluation, and the UI-side code (which is constantly observed) would not
* this starts getting into machine learning...

### Persistence Continued

* Actually, observation-based works for all cases, and can completely replace conditional binds
* rule is simple: a node is created if it can reach an observed node
* algorithm: traverse backwards from observed nodes, adding more and more nodes into the "observed nodes" set until no more can be added
* proof: if a node can reach an observed node, then it needs to be evaluated, if a node cannot reach an observed node, then it doesn't need to evaluated
	* thus, a node can reach an observed node <=> that node needs to be evaluated
* it sort of makes sense that we don't need conditional bindings, because Prolog doesn't have if-else blocks, and traverses backwards as well (queries)
* math also uses the same sort of "backwards" conditional style:

```
       / 1 : x > 5
f(x) = |
       \ 0 : otherwise
```

$$ f(x) = \begin{cases} 1 & : x > 5 \\ 0 & : otherwise \end{cases} $$

### Execution Order

* I was thinking more about forward-moving vs backward-moving conditional binds
* I realized that there isn't really an inherent direction fdsafdsa
* bla
* bla
* bla
* manual chaining:
* single output per change:
	* looks at previous modules
		* prone to deadlocks (show cycle example)
		* how far back do we go?
	* looks at inner modules
		* just check if any inner modules still running/updating
			* aka if a change is still propagating inside
		* no deadlocks, even if theres recursion, because recusion creates a copy of the module inside, doesn't create a cycle

### Pass Through Chaining

if we want to force the execution order of 3 independent modules dependent on one input `x`, we do "pass-through chaining", like so:

```
      ,--[1]--
x ---<---[2]--
      `--[3]--
```

```
      __________       __________
x ---|-.--------|-----|-.--------|----[3]--
     |  `--[1]--|--   |  `--[2]--|--
     |__________|     |__________|
     synchronized     synchronized
```

* note: "synchronized" modules are ones that update the output only if there are no changes still propagating inside
* notice that, while simple and powerful, trying to synchronize everything can become quite ugly and unreadable

### Perspectives 2? 3? Domains?

* herd server example
* html/xml layout example
* languages nowadays try to do everything
* talk about domains in math
* relationships (they are natural way we see things)
* bindings between domains, converters
* async and sync are different domains
* html/css/javascript already use this paradigm
* most server-side code is written using a single language, eg Java or C++
* however, even server-side code can have many different features, expressed best in different ways
* eg state machines, algorithms, class/interface structure and relationships
file formats




////////////////

   F A C E T S

////////////////


### Turing Completeness / Equivalence





### Alias Bindings and Verilog Wires

* all outputs like registers, store values/pointers
* alias bindings make the outputs act like wires
	* automatically update and propagate when the root value changes
* so in Flo, `a = b` will automatically create a "wire" between `a` and `b`
* in a way, Flo has "wires" and "registers", but they are automatically assigned
* but in Verilog, sometimes you want to manually assign a register instead of a wire
* eg in `a = b`, maybe we want `a` to hold the value after the assignment, even if `b` changes, so we set `a` to be a register even though the assignment implies a wire
* note that in Flo, this would automatically be an alias binding
* perhaps we could add a similar mechanism, where we "copy" the value instead of creating an alias binding
* basically have a system for "manual updating"
* kind of like a "latch" (in EE terms), where `b` can be set to the value of `a` and then hold it while `a` changes
* note that most common programming languages have this already, since manual updating and setting values is already the norm
* but since Flo is Turing complete, shouldn't Flo be able to do this as well?
* turns out, yes, this is how Flo would implement a latch

```
    .-------------------------.
    |     ________________    |
    '----|1               |   |
         |   mux  |---*--- Q
D -------|0               |
         |________________|
                  |
hold -------------'
```

* basically uses a mux to switch between `D` or holding its current value (using a feedback loop)
* note that while doable, these loops and EE tricks are not very intuitive...

### Metaprogramming

* meta-programming
	* maybe allow modules to be modified in layers?
	* first create a simple, inefficient but very readable flow
	* then add modifications, rearrange inner modules, add optimizations
	* need a system for defining "rearrangements" and substitutions and stuff
	* kind of like Java reflection
	* is this needed tho? in Javascript we just have everything be an object and modify it directly
	* however, in javascript we can only modify properties and stuff, we can't modify the code inside a function
	* so if we want to have a section of a function be modifiable, we have to pull it out into another function, and then override that new function

### Classes?

* classes
	* a new system for classes? or just use dictionaries like Flo
	* stuff like Array.map and Array.reduce, built-in functions, should they be segregated or just exist as regular properties like in javascript

### Dynamic Modules

* functions as objects
	* what syntax to use when turning a module definition into a variable, and vice versa?
		* in javascript, this is like `var x = function () {...}`
	* when you define a module, you can easily use it within the same context just by drawing another module with the same name
	* but what if you want to use the module outside the context? aka pass it around
		* in javascript, this is like returning a function, `function outer() { ... return function inner() {...} }`
	* libraries would leverage the same system
	* note that this isn't totally necessary
		* functions can't be "returned" or "pulled out" in C++ or Java, only in langs like Javascript
* dynamic functions
	* this is actually less about "functions as objects" and more about having dynamic functions, aka being able to create functions dynamically and then pass them around
* context and scope
	* there are two types of contexts to worry about: the context the function was created in, and the context the function was called from
	* the context the function was created in is more important, the function can be called from anywhere, if its passed around it becomes more like a "remote" that can be called from anywhere, but runs within its original environment
	* one example would be like, a button that makes a robot wave his arm, created within the robot but passed outside the robot so that anybody can make the robot wave his arm
	* we can have similar functionality by passing around modules in Flo

### Flag-Watcher Model

* flags and watchers
	* perhaps in Flo, it doesn't make sense to pass around functions and letting other people call them
	* Flo is about communicating through data, not through function calls
	* instead, we can raise "flags" and have a "watcher" register the flags and act appropriately
	* this is similar to the event+listener model of imperative langs
		* things like button presses create events (data) and then the listener consumes the event
* robot example
	* going back to the robot example of the previous section:
	* instead of pressing a button to make the robot to wave his arm, we do:
		* the button-press raises a flag, which is registered by the robot, who waves his arm
* encapsulation
	* this is possibly better as well because the locus of control remains within the robot, instead of being controlled from outside
	* better interface isolation, loose coupling
	* everything is asynchronous too, because the person pressing the button wouldn't have to wait until the robot waves to move onto the next thing
		* in synchronous code, when you call a function you have to wait for it to return to continue
* multiple listeners
	* this can get complicated tho if, for example, the button press flag needs to get registered by multiple robots who all need to wave their arms
	* to handle multiple listeners, you have each of the listeners register the event and then create another event indicating that the event was registered
	* then you have a garbage collector for the original event that waits for the event to get registered by all listeners, before deleting the event
	* the garbage collector on the listener side waits for the event to get deleted, then deletes the event-registered event
	* this is truly decoupled, each side only acts on their own data
	* no race conditions
	* even for just one listener, this method is more loosely coupled than the method of having the listener "consume" the event
		* though much more complicated
currying?
	* vishvanand brought up that functions are passed around not just for passing control, but also for currying
	* how does this fit into Flo?
	* currying is really just for convenience
	* all about dynamic creation of functions that were created with different scopes
	* a way of "hiding" inputs

### Closures and Dynamic Functions

* scopes and closures and enviroments
	* in Javascript we have closures, aka a function can be "pulled out" of its environment, but it still holds onto its environment
	* it makes sense to have implicit environments/scoping, aka not every variable used in a module has to be declared as an input
		* modules can pull variables from its outer modules
		* problems and solutions often only make sense within a certain context, and its unreasonable for the entire context to be declared as inputs
	* but when you "return" a module, aka use a module outside of where it was defined, does it still hold onto the scope?
	* useful, but counter-intuitive? Maybe theres a better way?

### Modifying Data: Imperative vs Dataflow

* one of the annoying things about Flo is that it takes a lot of work to modify data
	* for example, in imperative languages, anybody can modify a piece of data using something like `myScope.data = 10`
	* however, in Flo, the "controller" in charge of the data has to be aware of every single actor that might want to change the data
	* even if you use the flag based system, the actor in charge of the data has to know where the flags are to monitor them
		* if Alice, Bob, and Clare all want to modify Joe's data, Joe has to monitor Alice, Bob, and Clare
		* this is static, has to be registered **in the code**
		* if we want to allow Dave to modify the data as well, we have to change Joe's code
		* in Javascript, we can just modify Dave's code to anonymously modify the data, `Joe.data = 10`
		* a less destruvtive method would be to have Dave put in a request, `Joe.requests.push({data: 10})`
		* this request queue method is still not possible in Flo without modifying Joe's code
	* every piece of data needs a central controller that is aware of every actor that might want to modify the data
	* I mean technically, I guess imperative languages have the same thing, their central controller is the CPU and Memory Controller
	* every program is aware of the CPU, and the CPU is aware of every program
	* whenever a program wants to modify a piece of data, `Joe.data = 10`, then ..................
	* we can sort of imitate this with a universal memory controller in Flo
		* so instead of needing to bind every actor-data pair, we just bind each actor to the universal memory controller, and the universal memory controller to each piece of data
		* 2 methods
			1. special flag and special receiver
				* set a flag being like `Joe.data: 10`, and the universal memory controller will look for anybody raising that special flag
				* special receiver node that has no inputs, is set by the universal memory controller
			2. dynamic inputs, multi-wire input, anybody can plug into that input, takes the latest value
				EXPLAIN.................


* the "backwards" nature of Flo (outputs are defined in terms of inputs)
	* in javascript, we have like a bunch of little robots that go to a memory location and writes at that location
	* in Flo, we start at the memory location, and then define which robots and which actions affect the data at that location
* the "dynamic inputs" are a kind of way of adding pseudo-forward logic into Flo

* variables are not memory
* we are used to re-using variables to save memory
* but in Flo, that makes things more complicated and ugly

### Synchronization using States and Lock->Flush System

* turing machine using Flo, 2 complications
	* ensuring simultaneous operations (write at tape head, move tape head, change state)
	* "modifying" data, overwriting existing data, infinite tape
* time is an input

* synchronization can be implemented using states!
	* just have a master-slave lock system, kind of like [master-slave flip flops](http://www10.edacafe.com/book/ASIC/Book/CH02/CH02.5.php) in EE, or [canal locks](https://en.wikipedia.org/wiki/Lock_(water_navigation)) and [airlocks](https://en.wikipedia.org/wiki/Airlock) in mechanical systems
	* all outputs initially start as `null`
	* one state waits for all outputs to be ready (aka non-`null`), then the other state "flushes" the outputs and resets them to `null`

* stack reduction should only occur for time-insensitive inputs
	* if an input gets tons of "update" events, just calculate ....................

### Flag-Watcher Model - Interfaces

* "public" objects and contract systems:
	* in Flo its impossible to make an object "public", aka modifiable by anybody
		* e.g. a light switch that anybody can turn on/off
	* in Javascript this is easily doable, as variables are public so any function can just modify the data representing the light switch
	* in Flo, instead we can have a contract system where the public object provides an interface through which actors can submit requests to change the object
	* each actor just "implements" the interface, and the public object automatically monitors all active instances of the interface

	* this is just another way of looking at the flag-watcher model
	* the interface is just a set of flags provided and recognized by the watcher

### Flo - Reviewing Original Motivations

* the original ideas behind Flo
	* be able to draw anything high level
		* like the connections between a server herd
			* zoom in on the nodes to see the server definition, or zoom in on the connections to see how they are communicating
		* like a high level procedure including synchronous and asynchronous operations
			* zoom in on the arrow to see how it is actually implemented, eg if its synchronous or asynchronous
			* zoom out to see the high level procedure, where we don't care if the method is synchronous or asynchronous, as long as we have a procedural execution order
		* like state machine
		* "sketch" programs, starting with high level diagrams and slowly filling in details
	* persistent underlying layer of data, upper layer of transformations on that data
	* tags?
		* how to apply a map operation to every element of a tree structure

### Defaults for Select, Map, and Reduce

* select, map, reduce
	* so far, in our diagram syntax, we use a fan-out to select/filter items in a list, and a "fan-in" to reduce/combine the items

		    /             \
		---<----  map  ---->----
		    \             /
		 select         reduce

	* we can specify start/end and filters for the `select`, and similar parameters for `reduce`
	* but we also have defaults in case none of those are specified
	* default select: each property of the object
	* default reduce: append all to a list
	* connect select and reduce
		* do things like rebuild the structure of a tree after applying an operation on each node

### READ THE NOTES FROM ONENOTE!!

* "Flo Brainstorm and Discussion.one"
* "Monads and Sample Spaces and Infinities.one"
* "More Flo Notes.one"
* "Sequential Logic in Dataflow Languages.one"
* "Wijit Brainstorm.one"

### Event Lists

* context: "Collecting an array of Changes" and "Timelines and Event Lists" in "More Flo Notes.one"

* often we have a time-varying input and we want to listen for changes in that input
* for example, incrementing a counter every time the mouse is clicked

* to handle these cases, we have a special module, `changetracker`, that tracks changes and creates a list of them
* you can then use `filter` and `reduce` to operate on the list, just like any other list
* eg if we wanted to count the number of spacebar presses

```js
keypresses = changetracker(keyboard)
spaceBarPresses = keypresses.filter(event => event.key == spacebar).length
```

* this is not really a language feature, and more of a programming paradigm
* instead of trying to handle the time-varying input using synchronization and sequential logic, we convert it to a list of events
* anytime we are working with time-based data, we probably want to use event lists

* we treat time as just another piece of data to work with
* event lists are just lists that are indexed by time
* we turn dynamic changing data into a persistent static timeline of those changes
* kind of like treating time as just another dimension, another facet of our data
* once time is integrated into the language as data, we can operate on time just like any other piece of data

### Event Lists vs Sequential Logic Blocks

* Verilog and other dataflow languages often use some special syntax for sequential logic like this
	* Verilog uses the `@ (myinput) { stuff to do when myinput changes }`

* in these languages, sequential blocks are isolated from combinational blocks
* they operate on different rules (using operations like assignment and `+=` and stuff)
* represent instantaneous operations, unlike the persistent bindings of combinational logic

* eventlists provide an easy way to bring sequential logic back into the domain of combinational logic
* just treat time as data (as noted in the previous section)
* no need to define special blocks with special operations
* intuitive
* can leverage existing constructs like `filter` and `reduce`
* allows "sequential" logic to be interwoven and integrated into combinational logic, into one unified dataflow graph

* even has some possible performance benefits, as discussed in "Sequential Logic in Dataflow Languages.one"

revisit 1/12/2019:
* I don't know why I never gave a good example of the benefits of using regular list traversal over event listeners / sequential blocks
* so here's an example I used in my reddit thread with veggero [here](https://www.reddit.com/r/ProgrammingLanguages/comments/8g8mru/monthly_what_are_you_working_on_how_is_it_coming/dya5uw2/)

```js
for keypresses.filter(value = "p"):
    print("hello"); // print hello every time the p key is pressed
```

* it's simple an intuitive, and leverages list comprehension techniques
* in addition, event
* note that you can even do things like

```js
for keypresses.filter(index % 3 = 0):
    print("hello"); // print hello every 3 keypresses
```

* if you wanted to do this using event listeners or sequential blocks, you would need a counter
* something like

```js
var counter = 0;
addEventListener('keypress', event => {
	if (counter++ >= 3) {
		print("hello");
		counter = 0;
	}
});
```

* which is clearly uglier
* also, you can't really do operations on previous events without explicitly saving them
* eg if you wanted a running average of the last 3 mouse positions (just the x-coordinates)

```js
var runningAverage = 0;
var lastThreeEvents = [];
addEventListener('mouseMoved', event => {
	lastThreeEvents.push(event);
	lastThreeEvents.slice(-3);
	runningAverage = 0;
	for (i in lastThreeEvents) {
		runningAverage += lastThreeEvents[i].mouseX;
	}
	runningAverage /= 3;
});
```

* whereas using list comprehensions, we can easily achieve this in one line

```js
runningAverage: Math.sum(...mouseMovedEvents.slice(-3)) / 3
```

* another example is in the later section "Optimizers"
* where we take a running list of temperatures, square the last term, and sum all of them together
* there is also some examples in the section "Random Syntax Stuff",
	* where we use the `.calls` syntax to get a list of all calls to a function, and then filter for certain calls

### Muxes, Execution Order, and Infinite Loops

* currently, everything is forward-evaluated for simplicity (as in, no observation-based/call-by-need stuff)
* this forces us to evaluate both blocks of a conditional mux

```
 -[ TRUE BLOCK  ]---|\
 -[ FALSE BLOCK ]---|_|---
    -[ CONDITION ]---'
```

* however, notice how for recursion, this results in an infinite loop
	* eg: `function fac(n) => n > 0 ? n*fac(n-1) : 1`
	* if we always have to evaluate both conditional blocks, we'll be evaluating fac(-1) -> fac(-2) -> fac(-3) etc etc
* thus, for true-false muxes, we use backward evaluation

* note that the internal of the TRUE, FALSE, and CONDITIONAL blocks are still forward evaluated
* the conditional is evaluated first to determine which true/false block is "observed", and then that block is created and evaluated
	* just like for an mux, where first the value of the pointer is determined, and then the value at the pointer's destination
* note that this is exactly like an if-else conditional
* essentially, an if-else conditional is just a true-false mux with lazy evaluation!

* ok actually, one issue
* in a large network graph, how do we determine which part of the graph is part of the "TRUE BLOCK" and "FALSE BLOCK"?
* for example, where would you define the blocks for the network below?

```
        ,------|\
--[ ]--<       | |
        `--[ ]-|_|---
----------------'
```

* it's somewhat arbitrary where the blocks are
* imperative works the same way. Compare:

```js
a = b+c;
if (conditional)
	a++;
else
	a--;
```

```js
if (conditional)
	a = b+c;
	a++;
else
	a = b+c;
	a--;
```

* I guess it makes the most sense to just make the blocks extend to the last divergence
* this has to be computed before runtime though
* an example of "execution metadata"
* what if we have something like this

```
      _____
   --|     |-|\
   --|     | | |
   --|_____|-|_|---
              |
   -----------'
```

* the recusion could be hidden inside the big block
* thus, naively forward evaluating the big block could result in an infinite loop
* lazy evaluation would have no problem dealing with this case though
* imperative languages would consider this a programmer mistake, and always infinite loop

```js
if (condition)
	x = bigBlock(a,b,c)[0]
else
	x = bigBlock(a,b,c)[1]
```

* so either we can:
	* not worry about it
	* enforce backward execution on the big block
	* something else?
* I don't think we should be allowed to enforce execution order on inner modules
* after all, the whole point is that execution order doesn't matter
* so if one execution order possibly leads to an infinite loop, it's up to the programmer to fix it

* a good example of this
* program that attaches a unique id to every page of search results
	* one loop retrieves page after page of search results until there's no more
	* one loop generates a unique id (maybe cranks out rsa hashes)
	* zipper fn to zip the results of the two loops together
	* id generator loop should technically end after there's no more results
	* one method: synchronize the generator with the search results, generator waits for each page of search result
	* another method: generate ids in batches of 100 before waiting for search results to catch up
		* if not enough search results, will "clip off" the extra ids
	* bad method: one thread generates ids without waiting at all, one thread pulls search results, first thread will infinite loop but oh well
	* technically all methods are valid, represent different execution methods

* in fact, we can extend lazy evaluation to all muxes
* all muxes have the potential of containing conditional recursion, that would lead to infinite recursion if evaluated forward
* we could either try to detect these loops, 
* or something else?
* I'll have to think about this more...

(continued in "Muxes, Execution Order, and Infinite Loops - Part II")

### Context and Environment

* in imperative languages, the "global variables" are the context and environment
* they represent values in a function that are
	* relatively static (relative to values in the function)
	* shared across functions

* in javascript, "global" variable use is detected at runtime
	* if a line of code referenced an undefined variable, it'll throw an error at runtime
* in Flo, it kinda depends
* for forwards evaluation, the binding is created before runtime so that changes to the global variable will propagate properly
* for lazy evaluation, the binding is created only when needed, so missing global dependencies will be detected at runtime

* (6/22/18 revisit)
* I'm not entirely sure where I was going with this lol
* might have been exploring how and when variables should be bound to their context/scope?

### Angular, React, Vue?

* wijit is probably going to look very similar to angular
* so what will make wijit stand out from the rest?
	* (aside from the underlying language of Flo instead of javascript, which will probably drive people away tbh)
* the IDE interface needs to change
* reading [this debate](https://www.reddit.com/r/webdev/comments/6xehrj/why_we_moved_from_angular_2_to_vuejs_and_why_we/dmfefim/?utm_content=permalink&utm_medium=front&utm_source=reddit&utm_name=webdev) about JSX and "separation of concern" made me realize the core problem is the IDE
* people like JSX because it allows creation of small components where you can see the javascript+html all at once
* people like Angular because for complicated programs, it separates the html from javascript
* what would be nice is for the IDE to dynamically adapt to the best way of presenting code and information
* this really shouldn't be an issue that the language/framework should solve, but a problem that the IDE should solve

### PowerSet - Nondeterministic Monads and Sample Sapces

* see "Monads and Sample Spaces and Infinities.one" for a visualization of what I'm talking about here

* Haskell has something called a "list monad" that uses nondeterminism to do cool shit
* more specifically, using list monads to define `powerset()` is extremely elegant
* so how does it do it?
* List monad powerset is just a way of converting a set of sets into exponentiation
* List monad == multiplication/exponentiation
* Multiplication is a way of combining sets
* An alternative to recursion (which is another way of combining sets)
* Multiplication is a fully valid alternative
* Multiplication == repeating, for-loops
* Turing complete
	* Multiply Turing function by infinity to make it loop infinitely
* binary tree example
	* $2*2*2*2...$ n times, creates an n-dimensional space with $2^n$ cells, each corresponding to a leaf in a binary tree with $n$ height
* Permutations example
	* similarly, create a n-dimensional space using $n*(n-1)*(n-2)...*2*1$
* any time map an item to a set, eg `for 0<i<N, do ... with i`, you are adding a dimension
* Actually cleaner than recursion, separates logic from sample space, less spaghetti
* Allows accumulation of values at leaves?
* Order-agnostic multi-dimensional iteration?
* Extension to data types? How to create an order-agnostic multi-dimensional array without using "set of sets"?
	* Use properties. Instead of using Grid[5][7] use Grid[row: 5][col: 7], and optimize the datatype in the background to fit the use case

### Variable Number of Inputs

* imperative languages like to use "stacking", taking operations with fixed number of inputs, and stacking them to allow for variable number of inputs
	* recursion, nested for-loops, arrays of arrays, etc
* however, many of these operations are commutative, aka order doesn't matter
* so it creates order where there doesn't need to be any

* sets allows us to define a "repeat" operator, which repeats any module/operation
* "repeat" operator enables us to do multiplication and exponentiation
* the hard part is defining all the different ways of combining these "repeated" modules
* maybe have a "multi" input which takes a normal operator and, when fed multiple inputs, automatically stacks them?

### Powerset - Sample Spaces and Preserving Labels

* context
* filterM (list monad version) preserves the link between list element and include/exclude

* objects == modules
	* modules are just objects, with properties that are dynamic generated based on rules
	* i guess this is kinda already covered since we said earlier that objects are just bare modules with 1-to-1 wires

* replace order with labels
	* in stacked for-loops, we can specifically reference each for-loop by their respecive depths, or by their unique "i" "j" "k" labeling
	* when we lose order, we have to reference them explicitely by labeling them

* one issue with powerset is that, after the exponentiation module blows up all the individual [true,false] lists into a set of all sequences of [true/false, true/false, true/false...], we have to map the elements of these sequences back to the elements of the original list in order to include/exclude them during the filter operation
* for example, if the input list was `["a","b","c"]` and one of the sequences is `[true, false, false]`, how do we know which letter is mapped to which boolean? after all, these are unordered sets
* in haskell, the list monad uses recursion and scopes to "keep track" of which boolean corresponds to which element
* however, the exponentiation module loses that information
* I was trying to think of how to extend scopes/context in Flo to handle this
* after talking with vishvanand, realized that I was trying to make the language do too much
* instead, the exponentiation module should allow for optional labels to each input list, and each element of the output sequences retain that label
* eg: if the input is `[1, 2]  (foo)` and `[a, b]  (bar)`, then the outputs would be `[1 (foo), a (bar)]  [1 (foo), b (bar)]  [2 (foo), a (bar)]  [2(foo), b (bar)]`
* an ordered exponentiation module could be slightly cleaner, with the output sequences simple matching the order of the inputs, so no labels are needed

### Node datatype

* in Flo, instead of objects, we have "Nodes"
* Nodes have a value, and a dictionary of tags (key-value pairs)
* this allows for stuff like numbers with tags, sets with tags, etc
* this is the most natural way to represent nodes in a graph
	* every node has a value, and graph edges are the tags
	* instead of cutting up the world into objects, we think of the world as a giant web of relationships, every object is just a node in that web
	* this is why Flo and Common Knowledge work so well together
	* eg: instead of creating a "song" object, we have the mp3 file as the value, and tags that link to the artist, the album, the album art, etc

* almost identical to objects tbh
	* you can convert any javascript object to a Node just by wrapping it in `{value: ____, tags: ____}`
	* but making it a default datatype removes the need to wrap it
* objects can be thought of as Nodes without a value
* the "value" of a Node can be thought of as corresponding to a default/empty key of a dictionary
* extension: because modules are just "objects" with dynamically rendered properties, they can also have an unnamed input/output
	* in other words, because "objects" are just modules with wires connecting each input to an output, there is also the unnamed input/output

* allows for tagging/labeling
	* adding properties to objects without changing everything else
* eg if we have `myArray.concat([1,2,3])`, we can add tags to `myArray` without having to change it to `myObject.myArray.concat([1,2,3])`

? how to we specify whether an operation works on the Node's value or on the tags?
	* only the property accessor operator works on tags (think the `.` and `[]` operator in javascript)
	* every other operator works on the value
	* property accessor can use regex and pattern matching as well
	? perhaps we have a class of functions that are for pattern matching? or perhaps we allow any module to be used as a pattern matcher, as long as it has a boolean output? (if it has multiple inputs it will try every combination of sets of keys as inputs)
		* the `[]` operator takes a matcher as the input, and applies it to the key-value pairs of Node
		* eg `myNode[myMatcher]`
		? if the matcher only takes in single value inputs, then it acts on keys
		? if the matcher takes in sets as inputs, then it acts on [key value] pairs?
		* if the matcher is a string or a number or set, then simply checks for equality (on the keys, not values)
		* `.` operator is shorthand for string matcher, eg `foo.bar == foo["bar"]`
	? what assignment? should it by default pass on only the value? or the entire node?
	? what about combination operators

### Types as Tags

* "types" are tags as well
	* can implement a type system by adding "type" tags to everything
	* operations like `+` and `*` would be modified to pass on the type tag
		? how to make the modified operators the default? maybe override them in the namespace?
	* create an "extend" module to handle inheritance
	? polymorphism?
* in this vein, tags should be passed on by default during assignment
? namespace?
	* the operators `+` and `*` and assignment `=`, are all imported operations, provided by the environment
	* to actually enforce the type system, you would re-define/override those operators, and then create a module with the new environment
	* everything inside that module now follows the type system

* technically, primitive types like Numbers and Strings are not "inherent" primitive types, they are defined by us
* eg Regex is a primitive type in Javascript, but not in Java
* eg we can define a new primitive type like "user", and we would only need to do a few things
	* define it's binary representation, and a syntax to declare it, eg `<name, age>`
	* define it's behavior for primitive operators like `+` and `*` (or throw an "unsupported" error if appropriate)
* given this, does it still make sense for Nodes to have a primitive value?
* seems more like Nodes are just the same thing as Java objects, just with special behavior when the object is a Number or String and the operation is `+` or `*`

### Node datatype: to keep or not to keep?

* Pros:
	* less wrappers
* Cons:
	* complexity: equality (are you checking if the Node value is equal? or if all the tags are equal as well?)

### Sets vs Array

* in addition to the de factor "Number", "Node", and "String" base datatypes, we also have "Set" and "Array"
* sets are unordered sets of objects
	* can have duplicates (unlike when you use dictionaries as hashsets)
	* note: doesn't use commas, eg `(1 2 4)`
* arrays are ordered sets
	* mostly for matrix and math operations
	* `+` and `*` operators are geared towards matrix operations when operating on arrays

? how to create a hashset (no duplicates)??

### The `+` and `*` Operators

* `+` sign works differently for each primitive
	* Numbers: addition
	* String: concatenation
	* Set: concatenation
	* Array: matrix addition
* `*` symbol is kind of like a repeat operator
	* note that for numbers, it represents adding itself a given number of times
	* thus, it works similarly for other primitive datatypes
	* Numbers: multiplication
	* String: repeats the string, `"a"*3 == "aaa"`
	* Set: repeats the set wrapped in a larger set: `(a b c)*3 == ((a b c) (a b c) (a b c)`
		? exception: single item sets don't get wrapped in a larger set: `(a)*3 == (a a a)`
	* Array: matrix multiplication
	? Module: repeats the module?
? exponentiation? how to extend the `**` methodology?

### Equality

* the concept of Nodes introduces a complication: does the equality operator check if the Node values are equal, or does it check if all the tags are equal as well?
* just like javascript
	there are two equality operators, `==` and `===`
	* `==` checks value equality, ignores tags
	* `===` checks reference equality, aka if they are referencing the same Node
* in order to check if two different Nodes are "equal", you need to do a recursive deep check, going through all the tags and checking for equality within them
* this has its own special function, `isIdentical(node1, node2, ...)`

? note: following this, if you do `a == b`, and `a` and `b` are different null Nodes, then this equality check will still return true, because it checks the values (which are both null)
* but if null Nodes are supposed to be analogous to javascript objects, then `a == b` should behave like javascript object equality, which will check if the references are the same
* I guess we could create "object" Nodes, whose value is just a reference to itself, so `a == b` would check if the references are the same if `a` and `b` are both object Nodes
* sort of makes sense. an object is different from a null node with tags. An object is meant to contain a set of properties. A null node is just meant to represent "null", and the tags are optional add-ons
? this sort of removes the need for `===` as well: just make the default node an Object Node instead of a null Node

? this brings up another complication: what if we want to check for equality of some tags, but not others? eg, equal "type" tag, but nothing else
* perhaps this is where the type system comes in? If you want to implement a type system, then you would override the value equality operator `==` to also check if the "type" tags are equal

? what about nested objects? like if i have an object {song, name, length, artist}, perhaps i want the node value to be this object, amd add some tags to the node, not the object
? node value can be used as a "default" value?
	eg if you have a node `sizes = {100, small: 10, medium: 100, large: 1000}`, then you can do `my_size = sizes[]` or `my_size = sizes.small`???

### Symbols

* in Scheme, symbols are like unique identifiers, useful for creating enums for states and such
	* eg the `filter.INCLUDE` and `filter.EXCLUDE` example in the OneNote doc
* Java/C++ have a similar construct for enums
* Ocaml has [Variants and Tags](https://realworldocaml.org/v1/en/html/variants.html)
* Javascript can actually create ad-hoc symbols using pointers, just create a variable that points to an arbitrary object, eg `
	* eg `color.BLACK = {}`, now you can use `color.BLACK` as a unique value
* Java, C++, and other imperative languages can technically use this trick as well

* however, in javascript you can't use these pointers as property names (`filter.INCLUDE` will be cast to the string `"[object Object]"`)
* in Java, you can. Using objects as keys in a `Map` will by default use the object's reference (aka memory location) as the key

* symbols can help preventing key name collision as well
* let's say you have a flow that inspects/modifies/rearranges some objects
* how can you add a tag while ensuring that it won't interfere with existing object properties?
* eg: traversing a graph of nodes, where each node has a `children` property, but each node stores an object
	* traditionally, you'd have a `node` object that has a `children` property and a `value` property, where the object is stored in `value`
	* now, if you want to do a BFS traversal, you might want to add a `visited` tag, which you could add onto `node`
	* but for a generic BFS traversal function, we don't know if the input `node` objects already have the `visited` property
	* so we have to add yet another wrapper, `BFS_node`, that is just used for the traversal, and has a `node` property and a `visited` property
* so instead of making wrappers, we use "local" properties
	* local properties are using local symbols as property keys
	* guaranteed not to collide with existing properties
		* just like Scheme symbols
* localized to the scope of the symbol
* if you can't see the symbol, you can't retrieve the symbol property


? we can also use symbols as namespaces?

### Symbols as Tags and Local Properties

* symbols can be tags as well

? context follows a naturally tree structure, but tags are more of a undirected graph structure...does this make sense
	* like it could just be better to just use wrappers, which are also a tree structure

? local properties are how Arcane internally implements caching/memoization
	* not visible from the outside

? should they be considered or copied over when checking for object equality or doing object deep-copies?

### RENAME!! Flo is now Arcane

* renamed Flo to Arcane! Flo is a bit generic and doesn't really capture the concepts of the language very well
* Arcane was actually inspired by the magic references in the sidebar of a diagram-based dataflow language similar to mine, [unseen programming](https://www.reddit.com/r/unseen_programming/)
* I was reminding of my own fascinations with magic, and I realized that combined with the spoken word commands and drawings that look like runes or magic circles, my language could really look like the magic of ye olden times
* this language is also meant to speed up programming, quickly tying together a global database of data and APIs, kind of like casting spells
* thus, Arcane seemed like a fitting name, and doesn't seem taken yet

### Arcane as a Distributed Language

* most imperative languages don't work well in distributed systems simply because they use too many non-serializable constructs
	* threads, pointers, classes, etc
* javascript kind of gets around this by using strings for almost everything, eg object properties and class methods (which are technically the same thing)
* however, this is also not very conducive for distributed systems because you have to be careful for name collisions
	* eg when adding a property to a object, have to make sure you're not overriding existing properties
	* collisions become much more likely at a global distributed scale
* Arcane however is designed to be a distributed language, encouraging collaboration between live processes across the internet
* thus, Arcane needs to have a system to ensure program namespaces don't collide with eachother across the internet
* generate a unique namespace for each program
* we can use a system like IP addresses to add prefixes to program namespaces
	* when passing data across the internet, as the data reaches broader and broader scopes, prefixes are added to keep it unique
* eg, when passing mail between two home addresses
	* mail starts with just the street address
	* if recipient is in the same city, then that's all that is needed
	* once the mail leaves the city, the city's name is added to the address on the mail
	* once the mail leaves the state, the state's name is added to the address
	* etc...
	* the address contains the minimum amount of information needed to reach it's destination

### Add-ons

* community plugins simply check if certain variables/properties exist, and then generate outputs/data/more properties
* can be used to extend the functionality of an object
? uses local properties so they don't affect the general behavior of the object? doesn't affect the current flow?

### Two-Sided Bindings/Tags??

* makes sense to have it because it removes unnecessary order
* wouldn't be hard to implement it as a system on top of Arcane though
* just create `Edge` objects between nodes
* create local property `neighbors` for each node, that calculates each node's neighbors using the edge objects

### Local Properties (brainstorm)

* local properties are kind of like local variables
* except instead of local variables, they're like local bindings (think: graph edges vs graph nodes)

* for local properties, should they be factored into things like assignment? counting the number of tags/properties?

* two conflicting ideas:
	* tag things without changing the rest of the flow, especially when passing the object to sub-modules
		* wrappers change the flow, because instead of doing stuff like `obj.isAlive` you have to do `wrapper.obj.isAlive`
	* access and use local properties within the flow, just like with normal tags
* these are conflicting ideas, because either the local properties should be visible or not visible to the flow/submodules
	* if it's visible, it'll affect the flow. If it's invisible, you can't access or use them within the flow
* maybe we can make it invisible unless you explicitly reference it?
	* might involve some backtracking, but how far back should we backtrack?


? have two ways of declaring/referencing local properties, `myModule.localProp` and `this.localProp`?
	? `myModule.localProp` is a normal local property, visible within the module, including submodules
	? this.localProp is only visible directly within the module, excluding submodules
		? even though an object might be tagged `myObj[this.localProp] = 5`, it will be invisible within submodules, until it comes out of the submodule


* technically we can think of everything as local properties
* eg types, or other kinds of environments we might want to create
* we don't really want `type` to be visible when we iterate through object properties
* whether or not a tag is visible or invisible should be up to the programmer

* only transferred through assignment?
* local properties are for creating systems, eg a type system
	* for creating an invisible layer of rules for the data to follow
* they aren't part of the data, rather, they are part of the system
* like metadata
* kind of like non-enumerable properties in javascript


? local properties can still collide with local properties from ancestors
	* eg if module called `TypeSystem` has local property `type`, then even though it's hidden, we can't make another local property `type` inside submodules simply because the variable names collide
	* how would we know which `type` symbol we are referring to, when we want to use one of them?
* revisit 6/22/18:
	* not sure why I thought this
	* preventing name collisions was one of the main motivations behind local properties
	* descendent variable names will "shadow" ancestor variable names
	* to explicitly access ancestor local properties, just use `mObject[mAncestor.prop]`
	* to explicitly access descendent local properties: `mObject[mDescendent.prop]`

* programmer needs a way to specify particular aspects to change, while leaving the rest untouched
* for example, a type system changes the way operators behave (numbers => addition, strings => concatenation)
* local properties are important, because they allow a programmer to add properties without changing property enumeration or causing collisions
* lets programmer explicitly define where the behavior needs to change, without changing anything else
* Flo programs can be thought of as data, and operated on, re-arranging and modifying the program behavior

python decorations?

### Synchronization, Event Lists, and ChangeTracker

* Vish and Vincent mentioned chaining multiple changelists, and the complications around that (check gopro footage)
* most changelists are provided by the system, eg mouse-clicks and key-presses
* however, what if we wanted to use the changelist converter ourselves
	* recall that the changelist converter takes a changing value and converts it to a list of changes/events
* let's say we wanted to create a graph of how a poll winner changes over time

```
votes --->[ballot box]--->[counter]--->[current winner]----(changetracker)-->[winner over time]
```

* the `current winner` just counts up the votes and outputs the current winning candidate
* then the `(changelist)` tracks how the current winner changes over time, and gives the array of changes to `winner over time`
* however, note that depending on how `current winner` is implemented, there could be transient noise every time a vote is submitted
	* takes some time for the final result to stabilize
* the changelist will track these irrelevant changes
* so instead of tracking all changes, we synchronize the output of `current winner` to `votes`
	* so that every vote only creates a single change in output
* that way, the winner over time graphs only a single change per vote

* in fact, `changetracker` is probably almost always used with synchronizations
* inputs to `changetracker` should be synchronized to something, to distinguish between legitimate changes and noise

### Javascript Symbol Properties

* aw shit looks like javascript has local properties, called "symbol properties"
* found it when going through [Mozilla's javascript inheritance tutorial](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Inheritance), and I looked up [`Object.getOwnPropertyNames()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyNames)
* looks like it stemmed from the same exact motivation that I had, [see this](https://www.keithcirkel.co.uk/metaprogramming-in-es6-symbols/)
* damn, beat to the punch :(

* I guess the only difference between symbol properties and local properties is the concept of locality
* when I first came up with local properties, it was about properties that were only visible inside a module
* the local properties would be disappear when the data went outside the module
* I guess javascript symbol properties can work the same way:
	* if a symbol is defined in a function, then once data leaves the function, the symbol property would get garbage collected
* I also have the concept of `this.localProp`, which is kind of like an anonymous local property
	* the container module doesn't need to have a name, `this` refers to the current container
	* on the other hand, it's impossible to reference the local property inside submodules unless the container module has a name
* hmm I guess javascript has this as well, just do `this.localProp = new Symbol()` inside a function

* Java already had this concept of symbol properties
* you can use objects as keys in a hashmap, and it will use the object's reference address (which serves as a unique id for that object)
* I think this is where I got the idea

### Optimizers

* optimizers are basically metaprogramming, reconfiguring code to make it more efficient
* below, we'll use javascript-like Flo pseudocode to explain how they work

```js
// time varying input temperature
// adds up all the changes in the temperature, squaring the last term before adding it
// result = t_1 + t_2 ... + t_(n-1) + (t_n)^2
// note: list.split() function takes an array of selectors, and returns an array of sets,
//       each set containing matches from the input list found for that selector
//       split.rest is a special selector that selects everything not selected from previous selectors
// note that because split() returns multiple lists, map() needs to provide a map fn for each list
function sum_changes_with_last_squared(temperature) {
	var changes = changelist(temperature)
	return changes.split([n => n == changes.last, split.rest]).map([x => x*x, x => x]).concat().reduce(sum)
}

// a more efficient state-based version written in javascript
// --------- begin javascript code -------------
var last = 0
var sum_of_before_last = 0
function on_temperature_changed(temperature) {
	sum_of_before_last = sum_of_before_last + last
	last = temperature
	return sum_of_before_last + last*last
}
// -----------end javascript code ----------

// the same thing written in Flo
// we can imagine an "optimizer" that we can apply to the original to re-configure it to this efficient version
// notice that each step in the changelist is only dependent on the previous step
// thus, once each step is computed, the results can be cached for the next step
// put a different way, because the data in previous steps aren't used anymore, they are garbage collected
function optimized_version(temperature) {
	return changelist(temperature).reduce((current, [last, sum_of_before_last, result]) => [current, sum_of_before_last+last, sum_of_before_last+last+current*current], [0,0,0])
}

// note that this optimization is completely predicated on the fact that changelist() implementation maintains state
// note that while it may look like javascript, this is Flo code
synchronized function changelist(input) {
	feedback var list
	synchronized function (list, input) {
		list = input == list.last ? list : list.push(input)
	}
	return list
}

// thus, we can imagine an even more high level optimizer, one that inspects synchronized feedback mechanisms
// however, while more generalized, such an optimizer would be slower, having to reach into the changelist() implmentation
// to figure out that it can re-configure the module like it was done above
// so instead of having the optimizer reach all the way into the changelist() implementation to figure this out,
// we can "memoize" this rule! cache this specific case for whenever dealing with changelist()

// note the process we just went through. We first wrote our optimizer. Then we found a higher-level optimizer,
// for which our original optimizer was just a special case of this higher-level optimizer. In a way, we are
// "memoizing backwards", replacing our original code with a memoization of higher level code.

// this is a core development process in Flo. For example, imagine if we had come up with the optimized, state-based
// version of sum_changes_with_last_squared() first. Then later, we realize that it's just an optimization of the
// stateless high-level version. Then we replace our original code with the higher level version (which is easier to
// understand), and record the specific optimization to use in the metadata.
```

* Arcane's internal caching and memoization system is also a metaprogramming optimization
* however, optimizations shouldn't be visible from the top-level diagram of the structure
* metaprogramming is about hiding complexity behind layers of increasingly high-level code
	* a lot of the time, complexity is implied
* we can also use machine learning to figure out when to apply these optimizations, and which optimizations to apply
* we briefly touched on this in the "Passive Language vs Active Language" section much earlier

### Local Properties vs Regular Properties

* notice that regular properties can actually be thought of as local properties as well
* they are "local" to the global environment
* any time you reference a regular property, eg `obj["prop"] = 5`, it's can be thought of as shorthand for `obj[global."prop"] = 5`
* any time you are enumerating across properties, you are by default enumerating across all global properties
	* `for (var prop in obj)` == `for (var prop in obj.global)`
* so in a way, regular properties are just a way of declaring properties in the default, global namespace

### Local Properties and Local Variables

* we can think of local variables as local properties too
* local properties are kind of like local variables that are tied to an object
* in the same way, we can think of local variables as just local properties that are attached to a "default" object, the module/namespace itself

* every local variable can be accessed outside the module by using `moduleName.localVariableName`

* thus, local variables are the same as regular object properties
* stuff inside an object/module is "in the namespace", and doesn't need the prefix when referencing that module's properties
* local variables are just properties that are referenced in the same namespace

### Local Properties and Extensions

* objects are not static, we can think of many "add-on" properties that are not always needed
* eg, we can ask a Student object for his highest test grade, and it'll go through all the Student's tests and find the highest grade
* however, it's impractical to make `highest_test_grade` a default property of Student
* instead, it's more of an attachment, attached and evaluated when we ask for it
* local properties are a perfect fit for this situation/use case
* note that alternatively we could have a hashtable storing Student/test-grade pairs, and use a library function that takes a Student object and returns their test grade from the table
* however, this is just a convoluted way binding the Student object to the test-grade object

* we can dynamically add properties to an object, and it'll backtrace to load the property

* perhaps optimizations can be viewed as extensions as well
* when an optimization is applied, it's actually loaded as a module property

### Metaprogramming II

* treating programs as data
* we can treat input data as part of the program
* everything is data, everything is program
	* object-module duality

* example of optimization:
	* module A always makes sure output words don't have leading/trailing spaces
	* module B always strips leading/trailing spaces of input words
	* when combining A->B, module B doesn't need to strip spaces anymore

* the hard part about metaprogramming is the syntax
* three parts to metaprogramming:
	* input program, transformation, and output program
* kinda the same as viewing unit tests, where you have the input data, program, and output data

### Metaprogramming and Version Control, Mods, Plugins, etc

* version control, mods, and many other things can all be thought of as metaprogramming
* all involve taking a piece of the program and modifying it
* in many cases, the modifications are explicit, manually changing program flow or adding functionality

* renaming a variable shouldn't create an entire diff of every line of code changed, like it does in Git
* instead, should just record the variable that was changed, and the name it was changed to


* swappable parts
* inheritance system?
	* program A
	* program A+ is A optimized
	* program B is A modified
	* program B+ is A's optimization applied to B
* kind of like a type system

example:

* programmer A comes along and needs to scrape Soundcloud.com pages for song info
* writes a simple one like this:

```
songName = html.search(type: h1, contains: "song name:").first.innerHTML
artist = html.search(type: p, contains: "artist:").first.innerHTML
album = html.search(type: p, contains: "album:").first.innerHTML
albumArtUrl = html.search(type: image, tag: "album art").first.src
```

* programmer B comes along and realizes they can optimize this by doing it all in one left-to-right scan, instead of four separate scans
* this involves some complicated conditional logic that is not shown here
* programmer C comes along and realizes this optimization can be generalized with a multi-search combiner algorithm

* later, programmer A decides to add a field, "song duration", and once again simply searches for it in the html
* because of programmer C, the search is automically optimized
* if programmer C hadn't come along, then programmer B's optimization wouldn't work anymore
	* however, can automatically fall back to programmer A's unoptimized code

edge cases:
* accounting for edge cases is another use case of metaprogramming
* the normal flow shouldn't show edge cases for simplicity
* edge cases can be accounted for later, tweaking the base flow to factor in the edge case
* base flow can still be viewed and modified without the added complexity of the edge cases
* edge case is like a plugin, that modifies the base flow dynamically
* if base flow is modified such that the plugin is no longer compatible, then could cause some bugs
* in that case, edge case can be removed or fixed
* test cases are important in this case to continuously check if the edge cases are working

### Two-Way Relationships vs Input/Output

* Prolog and other logic languages have an interesting property in that the relationships they define are two-way, and have no defined "input" or "output"
* in other words, you simply give it a set of constraints, and then it determines possible outputs based on those constraints
* if you constrain `a=b+c`, and you give `a` and `b`, it'll calculate `c`
	* if you give `b` and `c`, it'll calculate `a`
* in this sense, there is no order to the relationships, which is quite elegant
* in the OneNote doc "Monads and Sample Spaces and Infinities", I actually already talked about this
* I also talk about how I decided to stick with the input/output model, because it is intuitive
* while unordered relationships are elegant, logic/constraint-based programming is hard to define and understand
* perhaps I can still have syntax for defining two-way bindings, for when it's convenient

### Two-Way Relationships vs Input/Output - Metaprogramming

* the input/output model has different implications in metaprogramming though
* remember that we have an AI analyzing our metaprograms and learning how to optimize and transform code
* if we have high-level program A transforming into optimized program B, shouldn't the AI learn both ways?
	* if it sees A, it suggests optimization B
	* if it sees B, it suggests high-level view A
* I guess there are certain cases where two way relationships make sense in regular programming as well
* for now I will probably just keep metaprogramming one-way, just like the rest of Arcane

### Synchronization vs Clock Triggers in EE

* synchronization is kind of like how in EE, engineers ensure that timing constraints are met in sequential logic systems
* ensuring that all output signals are stable by the next clock signal

### Metaprogramming vs Extensions

* remember that extensions were like local property add-ons, dynamically added when needed
* I guess extensions can be viewed as a subset of metaprogramming
* we are changing the object dynamically, and objects == modules == programs, so changing an object == changing a program

### The Human Element

* Arcane modules and connections are mostly static
* they need to know the inputs going in and outputs going out
* in order to change a module, you need to stop the program, modify the source code, and re-run the program
	* this is true even with metaprogramming
* humans, on the other hand, can be thought of as completely dynamic agents
* they can modify any program, change the inputs to any program, re-route the outputs of any program, etc
* however, humans can be thought of as "metaprogrammers"
	* their work, changing and reorganizing programs, can be thought of metaprogramming over time
* so they should be able to fit into this Arcane network as Arcane modules themselves
* how do we model humans in the Arcane system?

* in Arcane, variable definitions are static
* but variable usage is dynamic: dynamic programs and flows will constantly change which variables they're referencing and using
* once a variable is defined, its in public domain (or whatever local domain it was defined in) and any module can see it and use it
* a human modifying a module is just a metaprogram creating a new version of the module, and discarding the old one
	* all other modules depending on that module are automatically wired to get the latest version

### Metaprogramming vs Type Systems - Flexibility

* in sketching, the rough initial base sketch is not necessarily what the end result looks like
* oftentimes none of the base sketch makes it to the final draft
* the base sketch just provides a foundation, a structure, to add detail on top of
* music is the same
* painting is the same
* type systems are not the same, too rigid
* metaprogramming is a better way of creating flexible and rough sketches of programming, and then refining it detail by detail until the final product

### Events as Actions, outputting Actions

* sometimes we don't just want to output data, we want to output actions
* for example, if a person is in the room, turn on the light
* just like when we treated events as data, we can use the same idea to treat data as events
* output a list of events

```js
// for every personEntered event, create a lights.onEvent
for (event in room.personEnteredEvents)
	lights.onEvent
```

* note that we can actually model this simply as

```js
light.on = room.hasPerson
```

* but sometimes actions/events are simpler and easier to understand than data

### Timelines

* changelist/eventlists give us a way to treat events/actions as data, for both inputs and outputs
* not enough, we need ways of specifying time and duration, not just events
* for example, if we were designing an app like Guitar Hero
* maybe we want to display a message for 2 seconds after the user hits a note
* we also want to define the hitbox of each note as 1 second before and after the note

* I guess an easy way to define these timelines is using events, eg "start" and "stop"
	* `messageTimeline = { start: now(), stop: now() + 1 }`
* see "Piano App Design.one" for more details

### Versioning

(see "Piano App Design.one" for more details on my thought process behind this)

* we are used to thinking about programs in terms of changes and events
* eg "for every click, increment the counter"
* this is why imperative languages can feel natural
* we can usually solve this using a mapreduce

```js
for (click in clicks) {
	next.counter = prev.counter + 1
}
```

* the `counter` variable is actually a sequence of states that "flows" from the first click event to the last
* we can manually remove an event, and the mapreduce will rearrange and change the output accordingly
* we can't do this in imperative languages

* however, it gets complicated when we introduce multiple events that affect the same variable
* for example, "for every click or keypress, increment the counter"
* in imperative langs, it's simple: just increment the counter in the click eventlistener and keypress eventlistener
* in dataflow however, we would need to share a variable across mapreduces
	* but how should the sequence of states "flow" between the two mapreduces?
	* if the sequence of events is [click, keypress, click, click, keypress], then the states need to flow between the mapreduces accordingly
* we need some way to order the states by time
* in imperative langs, variable modifications are already time-based
	* always holds the value of the most recent modification
* we can create a similar construct for dataflow, a special variable that:
	* when assigned a new value during an event, pushes the new version onto the version stack, along with the event time
	* when referenced during an event, peeks at the latest version of the variable that occured before the event
* notice that this variable can only be assigned and referenced during events, because it needs timestamps to order the versions

Sidenote:

* note that we _could_ combine the events and mapreduce across the entire group
	* `for (event in {clicks, keypresses}) ...`)
* however, if we have other actions that occur on only clicks, or only keypresses, then we have to create separate mapreduces
* in complex scenarios involving $n$ events, we could require up to $2^n$ mapreduces for every possible combination of events
* another way we could solve it is using a single large mapreduce that combines all events, and then inside the mapreduce, filter for different kinds of events
* also pretty ugly

### Versioning and Indexes

* we can extend versioning to work outside of time-based contexts
* after all, in Arcane, time is just data
* versions need an "index", a way to order the versions
* most cases, the index is time
* but it could be something else
* if we were creating a card counting algorithm, the index might be the sequence in which the cards were dealt
* then we create separate mapreduces for cards > 10 and cards < 5
	* increment the counter for cards > 10
	* decrement the counter for cards < 5

### Implicit Arguments

* if some arguments can be implied from context (as long as its named the same as the argument), then they don't to be specified
* for example:

```
module calcBMI (name, age, height, weight, gender, ethnicity) {
	bmi = ...
} (bmi)
```

```js
import BMI

name = "charlie"
age = 13
height = 60
weight = 100

bmi = calcBMI(gender: male, ethnicity: white)
_
```

* this process is called **autofilling arguments**

### Inferring Context

* in versioning variables, we saw how the versioning index in many cases can be inferred, to keep the code from getting too cluttered
* this is similar to how scopes work in imperative languages, to create a sense of contextt
* however, in many cases, the context is not so obvious, and not as simple as just pulling from scope
* especially when one is "sketching" code
* one can explicitely define these contexts in the more detailed sketches
* an AI can look at the rough sketches and the detailed sketches and start to learn how to infer these contexts automatically
* this is the same mechanism by which optimizer AI works as well
* so in a way, this is just an extension of the optimizer AI
* this is similar to how, in the English language and other human languages, much grammatical detail can be left out and inferred through context

### Layers of Complexity, not Abstraction

* Arcane is based on creating layers of complexity, not abstraction
* abstraction requires details and edge cases to still be referenced
	* indirectly referenced through functions and variables but still specified in the top-level code
* Arcane allows these details to be left out completely
* An analogy using a set of classroom guidelines

Simple (Arcane) version:
* pay attention
* do your homework
* don't be late

Abstract (Imperative) version:
* while (teaching), focus()
* do homework before dueDate
* sit in seat by 2nd bell

Full specification:
* while teacher is actively teaching, focus on the material
* finish homework by due date
* be in your designated seat by the second bell

### Metaprogramming and Syntactic Sugar 

* in the above section, "Layers of Complexity, not Abstraction", we discussed the differences between metaprogramming vs abstraction
* another way of thinking about it:
* abstraction allows encapsulation of long procedures into a single object, eg a function or a class
* represents a complex structure with a single name/reference
* Arcane and metaprogramming allows us to represent complex structures using simple structures
* we are not just restricted to using a name to represent structures
* we have the full expressive power of the language itself to represent a structure

* for example we can use `for (nums) addAll(num == prime-1)` to represent

```js
var sum = 0
for (num in nums) {
	if (isPrime(num+1)) {
		sum += num
	}
}
return sum
```

* this is much better than encapsulating it in a function `addAllNumbersOneLessThanAPrime()`
* in a way, syntactic sugar is just metaprogramming
* creating a flexible system for metaprogramming allows programmers to create their own syntactic sugars
* kind of like macros

### Inferring Context is Natural Extension of Optimizer AI

* Optimizer works by analyzing how programmers add complexity between layers
* optimizations are an example of the complexity added by programmers
* context is also another example of complexity added
* often times an optimization changes the output in small ways, adds small side effects
* thus, optimizations are often just added detail and edge cases and complexity

* to train the AI, I was going to have it observe how programmers metaprogram and optimize their programs
* basically, just feed the AI a lot of regular programs and their (manually) optimized counterparts
* basically, any time a user uses metaprogramming, have the AI observe what changes the user makes
* and over time, start to suggest similar changes to similar scenarios
* but users aren't just using metaprogramming for optimization, they also use it to turn sketches into implementation
* so the AI is learning how to do that as well
* the AI was already capable of learning how to infer context and interpretting code sketches

### Array Operations

* operations like array.push() and stuff require time to be taken into account
	* uses timestamp as an index
* this is where implicit indexing by timestamp can be useful
* however, note that arrays and array.push() use a numerical index, not a timestamp index
* we are actually mapping timestamps to numbers
* so what should the syntax look like?

### Versioning is just Arrays/Maps

* remember that every "version" needs a value and an index
* and usually those indexes don't collide (eg. timestamps)
* so we aren't really changing or reassigning a variable, we are just defining an array/map of versions
* dataflow languages aren't suited for variable modification anyways
* this is a paradigm for defining variables, not changing them

* arrays and maps are the data equivalent of mapreduces (which represent program flow)
* data/flow duality

### Functional vs Dataflow

* data flow is just functional with continuously updating inputs
* functional has all the same benefits
	* parallelization
	* lazy evaluation
	* data/procedure duality
* dataflow has to account for streaming data though
* one way is to convert data streams into events, like Arcane does
* so in a way, Arcane is more functional than dataflow
* however, the philosophy of Arcane is more about dataflow

### Functional: caching and parallelizing
* seems like functional already has caching and parallelization optimization
* see https://mostly-adequate.gitbooks.io/mostly-adequate-guide/ch03.html#the-case-for-purity

### Haskell vs Arcane

* Haskell
	* Haskell seems like a very powerful language with ways to represent very abstract and generic ideas
	* eg monads and functors
	* however, rarely does a programmer put in the time to understand the mathematical structure behind his program to utilize these tools
	* for example, nondeterministic list monads can be useful in some cases, but a programmer will rarely think to use it

### Constraints and Type Systems - Possible Issues

* constraints and type systems
	? what happens when data leaves the constraint system, gets modified, and re-enters the system?
		* those modificatioms might not follow the rules of the system
		* allows for loopholes, bad data
	* if everybody defines their own systems, then it can be hard to make code compatible between systems
		* eg javascript "strict" and "non-strict" mode
		* though I guess in a way this already happens, with everybody using corporate domain-specific languages

### Versioning Mechanics?

* defining arrays and objects
	? how to map timestamps to numerical indexes
	* in order for Arcane to mimic state variables using version arrays, we need to be able to push new versions from anywhere (analogous to being able to reassign a variable almost anywhere)
		* this is basically allowing object properties to be defined from anywhere within the object context
		* seems useful enough
		? however, should we prevent feedback, aka using an object to define its own properties?

? is it always possible to infer version timetamps from event contexts?

* objects often follow this model (for the way data travels through the object):
	* events -> state variables -> dataflow variables -> outputs
	* should we distinguish between state variables and dataflow variables?

### Satellites?

* satellites
	* in imperative languages, classes can contain many methods, each with their own inputs
	* in Arcane, every input to every method has to be an input to the entire module
	* thus, large classes/modules like `Person` can have tons and tons of inputs and outputs
	* we need a way to separate them
	* satellites are like pieces of a module that are visually separate from the main module, but share scope
	* eg `Person.arm`, `Person.mouth`, etc
	* or maybe these can just be normal submodules?
	? inputs to these sub-modules are inferred inputs of the main module?

### Versioning Types

* different types of versioning
	* main type: timestamps and events
	* versioning in program flow (how to deal with feedback)?
	* versioning in mapreduce
	* versioning in recursion (based on recursion depth)?
* a single variable spanning multiple types of versioning?
* are any of these other types of versioning really necessary?
	* while we could have versioning in regular flow, we don't need it
	* we can always just use multiple variable names
	* only place it seems useful is in MapReduces and recursion
		* variables are dynamically created, so in order to tie them all together, there has to be a shared variable name

### Metaprogramming Uses

* metaprogramming allows for defining your own syntactic sugar
	* could this be too flexible? allows for hiding malicious code?
	* see the section "Metaprogramming and Syntactic Sugar" for more on this

* Facades
	* Sometimes you want to view the simple definition based view, sometimes you want to view the action based view.
	* Stuff like caching and stuff is possible in imperative langauges using annotations, eg @memoize


### summary of Conditionals.one

* see "Conditionals.one" for full context
* recall that conditionals and muxes achieve the same thing
* also, conditionals are forward moving, and muxes are backward moving (see section "Persistence, Multiplexors and Branches")
* recall that I also decided to stick with muxes because they don't require any new constructs, and I can fake conditional blocks like those in imperative languages using UI tricks
	* just wrap each input of the mux into blocks, and when you hover over each block, show what conditional "enables" that block
	* I can't seem to find where I discussed this, but I do recall discussing it with Vish about a year ago
* dynamic conditional blocks seemed like they required new constructs, because it required bindings to be dynamically created and destroyed
* however, note that mapreduces already have dynamically created/destroyed bindings, eg if a list changes size
* 


### Undefined Inputs

* one of the other issues was that dynamically created binds could result in "undefined" inputs

For example, assume `a` is true:

```
      ,-- if (a) ----[ m1 ]----
x ---<--- else -    -[ m2 ]----
```

* notice that the input to m2 is undefined

* many other ways to get undefined inputs
* eg, referencing an undefined property, or an out of bounds array index

```js
factorial = (linkedlist) => (linkedlist == undefined) ? 1 : linkedlist.value*factorial (linkedlist.next)
_
```

* no need for a special `if undefined` construct...just treat `undefined` like any other symbol
* no infinite loops here either
* note that in most cases, `undefined` passed to an operator will give `undefined` output
* 	eg `+`, `concat`, `mapreduce`etc
* this is simply because the case hasn't been defined yet
* but for `==`, `undefined == undefined => true`
* `==` has implemented the case for all symbols, whereas `+` and `concat` haven't
* datatypes: number, string, symbol/object, char, set, array

### Carrying Out Deeply Nested Outputs

local variables as properties
* runs danger of overshadowing inner module outputs
* we need a way of easily carrying nested module outputs all the way out, so they don't get overshadowed
* also need a way to reference local variables even if they are overshadowed by nested module outputs being carried out
	* essentially, we need a way of referencing program structure directly, that isn't affected by scoping and shadowing rules

### State Variables and Versioning in Other Languages

* note that imperative provides an easy way to define state-ful objects and processes
* state-ful objects and processes are intuitive and natural
* in functional, the common way to handle state is to use recursive function stacks ([source](https://stackoverflow.com/q/1020653/1852456))
* this is pretty similar to versioning
* however function stacks are normally executed level-by-level, whereas a version stack has more flexibility in execution arrangements
	* though this is really just implementation issues
* though it's easier to make version lists in Arcane because they're dictionaries, so properties can be added/removed from anywhere, instead of pushing/popping from top of stack

* functional languages create the same structures as Arcane
* do it in a different way
* Arcane allows for easier methods for constructing those structures
* it seems like Arcane and functional are the same: defining graphs backwards
	* dataflow is just functional re-evaluated when inputs change
	* so how come the part with version lists is different?
	* you can actually define it in the same way using 

```js
combine( // combines both arrays into a single ordered array
	clicks.map((timestamp) => { // create an array of <timestamp, fn> items for each click
		return {timestamp: (x) => x+1}
	}),
	keypresses.map((timestamp) => { // create an array of <timestamp, fn> items for each keypress
		return {timestamp: (x) => x*x}
	}),
).values() // extract the ordered list of functions
.apply(10); // input a starting value into the chain of functions
```

* though it's a little uglier because you have to pass around functions instead of directly assigning to variables
* see the next section for how Arcane does it

### Versioning Syntax Brainstorm

* the previous section showed how functional languages would implement a versioning-like syntax
* Arcane would be more like

```js
x[0] = 10
clicks.map((timestamp) => {
	x[timestamp] = x[<timestamp]+1
})
keypresses.map((timestamp) => {
	x[timestamp] = x[<timestamp]*x[<timestamp]
})
_
```

* we can make it a little cleaner if we create a special type of block scope for these things

```js
x[0] = 10
clicks.mapBy('timestamp', () => {
	x[] = x[]+1
})
keypresses.mapBy('timestamp', () => {
	x[] = x[]*x[]
})
_
```

* additionally, because mapping by timestamp is so common, it should be the default

```js
x. = 10
clicks.map(() => {
	x. = x.+1
})
keypresses.map(() => {
	x. = x.*x.
})
_
```

? dataflow allows data to be mutated and changed, without manually triggering or knowing about who's listening for updates
	? how does this work for functional?
	* i think in functional, while inputs might be "impure" and implemented using imperative (manually triggering updates through the graph), the graph can be created using function calls, created in a "backwards" manner, just like Arcane
	* so its still the same?

### Fundamental Components of a Module/Node

* the most reduced form:
	* each node contains:
		* input edges, arrows going into the node
		* set of rules that generate output edges?
		* the rules are created from conditionals?
		* undefined means a certain input doesn't exist?
		* I think the only conditional requires is Node equality, whether or not two inputs point to the same node
* is undefined necessary?

### Specificity and Context

* the more you specify, the less context you need
* this is true for human languages as well
* eg in weakly typed languages, you might have to backtrace to last assignment of the variable to figure out what type it is
	* in strongly typed languages, the compiler already knows the type at any given line of the execution
* there might be stuff that an AI can infer though, eg if the programmer is only doing array operations, then the variable is most likely an array

### Preview View

* instead of viewing the program, sometimes its more intuitive to see the structure of the program with a test input
* for example, with the fibonacci program
	* input an example input number
	* as you are writing code, it not only generates the output, but the resulting recursional structure
	* including all the submodules created when calculating the output
* for example:

```js
// definition
fibo = (n) => n > 1 ? fibo(n-1)+fibo(n-2) : n

// test case visualization
fibo(3) = 
	3 > 1 => fibo(2)+fibo(1) => 2
		fibo(2) = 
			2 > 1 => fibo(1) + fibo(0) => 1
			fibo(1) = 1 !> 1 => 1
			fibo(0) = 0 !> 1 => 0
		fibo(1) = 1 !> 1 => 1
_
```

### Cloning and Branching

* cloning is:
	* used for creating a separate state variable
	* used for instantiating class instances
	* used for "calling" a function with different arguments

* normally, in imperative languages this is achieved through function definitions vs function calls
* distinction between definition and usage
* we need a `extend` operator that goes from definition to usage
* basically what this operator does is "wraps" the definition into a new object

* makes sense for versioning because when you wrap the original state variable, it stores the timestamp, and so it knows exactly what version of the original state variable to branch from, and new versions are stored in the new wrapper, not modifying the original state variable
* also, unlike the assignment/versioning operator, which can be used anywhere, the `extend` operator can only be used once to create the new variable
* perhaps the `extend` variable is like rebinding in elixir, and like graph-order versioning (eh not sure about this)

* take a module, `extend` it and bind some inputs, then `extend` it again and use it multiple times
* eg Person module, `extend` it with the inputs 

* very similar to prototypal inheritance in javascript
* or function.bind()


* in imperative langs, assignment and extension both use the same operator: `=`
* eg `x = 5; x = 10; y = x; y = 15` => `x: 10, y: 15`
	* notice that the first two statements were assignment, the 3rd was extension, and the 4th was another assignment
* Arcane uses different operators for these two operations
* this creates another distinction when using modules (in imperative terms, "calling functions")
* java and javascript use "call-by-reference", aka any assignments done to function arguments will simply rebind the variable, not affect the original variable
* in Arcane, revisions made to the variable affect the original (because it's actually modifying the properties of the original, eg `myVar[timestamp] = 5`)
* in javascript, if you want to modify a variable passed into a function, you have to wrap it, eg `(wrapper) => wrapper.myVar = 5`
* in Arcane, if you don't want to modify the original variable passed in, you have to extend it, eg `onClick(myVar) => newVar. = myVar.`
	* and then you can change the new variable however you want: `newVar. = 10` => `myVar: 5, newVar: 10`
	* if you do `onClick(myVar) => newVar = myVar`, now `newVar` tracks `myVar`: `newVar. = 10` => `myVar: 10, newVar = 10`


### AI and the Future of Programming

* using AI to create programs is not a new idea
* there has been a lot of research recently into AI programming
	* using neural nets to generate other neural nets, etc
* people dream about being able to give pseudocode to AI, and have the AI convert it into a real program
* but I think it's important to realize that AI cannot fully replace human programming
* because ultimately, **programming is art**
* AI is a tool to help us: to fill in gaps and edge cases, to suggest solutions, to optimize code
* however, there is no objectively right way for a program to behave, so we have to decide that for ourselves
* in addition, the AI's result has to be understandable by humans:
	* so that we can assess it and modify it further
	* to support collaboration, eg if somebody wants to improve upon the project or repurpose it for a different project
* as an analogy, AI can help an artist paint, suggest colors and straighten lines and such, but ultimately it is up to the artist what the finished product will look like

### Cloning and Scopes - Clone Equivalence

should local variables be carried into the scope of all nested modules, of any depth?
* in imperative, variables are only in scope in nested definitions, not nested usage

```js
function nestedUsage() {
	console.log(localVar);
}

function fn() {
	var localVar = 10;
	function nested() {
		console.log(localVar);
	}
	nested(); // output: 10
	nestedUsage(); // output: undefined
}
```

* however, so far in Arcane we haven't cared where a module is defined
* every module is created equal, there is no difference between a clone and a definition (aside from arguments)
* this is called **Clone Equivalence**
* also makes it simpler: we don't have to treat definitions differently from clones
* another perspective: a function definition is (1) defining a function in blank space and (2) calling it in the definition context
* in the section "Implicit Arguments" we talked about how modules inherit arguments from context
* this is a natural consequence of Cloning Equivalence

* however, if we allow deeply nested modules to inherit top-level local variables, then it could cause unexpected behavior
	* cause modules to change based on context created far away

```js
function a () { b(); }
function b () { c(); }
function c () { d(); }
function d () { e(); }
// ... continued
function y () { z(); }
function z () { console.log(foo); }

function main() {
	a(); // output: undefined
	foo = 10;
	a(); // output: 10
}
```

* maybe it should matter where modules are defined, because modules are data, so modules can be defined programmatically

```js
function fn(localVar) {
	localVar = 'bar';
	var modules = [10,11,12,13].map((item) => {
		return (a) => a+localVar+item;
	})
	modules[2]('foo'); //output: 'foobar12'
}
```
* note that this might affect autofill arguments and also versioning

* in Arcane, modules are created in a similar fashion as Javascript prototyping
* there is no distinction of "definition" and "usage", every module is a "definition", and any module can be extended to create another one
	* think of it as every function call being a new function definition

### Scope as a Search Function

* scopes and context are one of the things that would probably benefit the most from AI
* because our brains don't process scope/context in the hiearchal fashion that programming languages do
* (i think) our brains work like a network/graph, reaching out to connected neurons up to a certain (and kinda arbitrary) depth
* that means that context is more flexible, but also less deterministic
* with the hierarchal model, less flexible but we know exactly what is in scope and what isn't

* scope is actually an adirected graph, so searching for a variable is actually a finite operation
* in hierarchal model, scope only expands as you go deeper
	* scope starts at zero (no variables)
	* as you go deeper and deeper into nested modules, more variables get added to the scope
* in graph model, this is also true, as you navigate the graph finding linked variables and adding them to your collection
	* even if there's a cycle, you just stop when you hit a variable you already added to the collection
* scope is really just a _search_ for a variable of a certain name
* it's possible for variables to have the same name, but the search ends when it finds the closest one
* the key part of scope is how that search is performed and what structure we are searching
	* could be a hierarchal model, or a breadth-first-search through a graph, or a neural net, etc
* so it's not necessarily finite, if you are searching for a variable that could be generated, eg a lazy-generated stream of propery names+values
	* most imperative languages don't even allow the generation of variables
	* in javascript, object properties can be generated, and prototypal inheritance is kind of like scope, but properties cannot be generated at the same time as the scope search (the scope search happens "instantaneously" and only searches already generated variables)

* however, in a language where all data is public, scope is really just for convenience
* even data that is private (like local properties), can be made public simply by making it an output

### Infinite Streams

* Haskell and other languages have the concept of [streams](https://hackage.haskell.org/package/Stream-0.4.7.2/docs/Data-Stream.html), infinite lists (generating values by need, lazy-evaluation)
* eg `primeNumbers` could be a stream, generating more primes when needed using sieve of eranthoses
* I was debating for a while whether or not to include streams
* however, streams naturally arise if we consider modules that generate infinite lists, and that module outputs are supposed to be "persistent"
* essentially, if we have a module that generates an infinite list, then the "persistent" output of that module is the "stream"
* thus, streams are already a part of Arcane
* in fact, Arcane streams are more powerful than infinite lists, because they are infinite objects
	* the property keys can be anything, not just numbers
	* infinite list: `[2,3,5,7,11...]`
	* infinite object: `[a: 2, aa: 3, aaa: 5, aaaa: 7...]`

### Implementing Streams

* programmer starts by making a simple infinite generator, e.g. natural numbers: `out = [i: 0 < i < infinity]`
* to turn it into lazy-evaluation, we need to track which list elements are actually being queried
* instead of outputting a simple object, we output a special object with a special property accessor
* special property accessor doesn't just access properties, it generates them if needed

* streams are a great example of where meta-programming can be useful, because the low-level implementation is quite different from the high-level sketch
* the `out = [i: 0 < i < infinity]` is an "extremely slow" (read: non-halting) version of the program
* the lazy-evaluation + special property accessor version is faster, but much more complicated

### Metaprogramming Thoughts

there is the main layer of program, input and output
but it's more than just input/output
metaprogramming is about how a program was created, and how it's presented to the user
the IDE plays a big factor in this
	for example, sketches (see section "Layers of Complexity, not Abstraction" and "Metaprogramming and Syntactic Sugar")
	for example, displaying examples (see section "Preview View")



----------------------------------------------------------------------------------------------------

Summary
--------

All findings so far...

### Language Rules

1. Outputs (at least, when observed) always reflect the current state of the inputs
	* no matter how the language is implemented, the observed outputs should always look as if the entire network is continuously being re-evaluated
2. Bindings, by default, execute re-evaluations. This means update order doesn't matter, and update events don't need to carry any information
3. Every output is determined by exactly one binding
4. Dynamic binding definitions are static, and create/define value bindings
5. Modules are self contained. A module can have any internal implementation as long as the inputs/outputs follow these rules
6. All inputs and outputs are key/value pairs (just like in javascript), and values can point to modules (aka values can be collections)
7. Output values with no input binding are implicitly undefined
8. No errors, only special output values like `undefined`
9. Value bindings are for defining values
10. Reference bindings are for defining structures
11. Dynamic bindings are for conditional logic
12. Modules can be treated as data and vice versa
13. All local variables are properties
14. Encapsulation: modules can only modify and control things inside the module, no control over anything external
15. All properties are public information (aside from symbol properties)

vvvv move this to philosophy section? vvvv

16. every peripheral, anything entering the Entangle domain, has to be a state variable, an event list
	* timeless - Time is data
	* unwraps cyclic feedback loops into acyclic directed graphs
	* turns a circle into a helix
	* allows us to model everything using combinational logic
	* all events and actions have a timestamp when entering the Entangle ecosystem, eg mouse events and such
	* assume execution is instantaneous, and can happen in any order/fashion
17. Prototypal - no currying, functions are simple objects
18. Abstract data structures away from execution order. Model everything in terms of structure
19. Introduce orderings only when necessary
20. Private keys, not private vars
	* more in line with the the directed-graph mindset
	* private keys are shareable, allows for more flexible privacy/security
	* relevant sections: "Secret Keys", "Private Keys not Private Vars", // TODO: ADD MORE
21. Flexible Scoping
	* scope is a variable that can be passed around
	* you can dynamically "enter" a scope and view private keys, as well as modify/insert properties
22. Private keys are like vars bound to scope???
	* // TODO: clarify this. we are trying to capture the idea of how private variables work, basically summarize the section "Static Bindings vs Secret Urls"
	* relevant sections: "Separating Referencing and Scoping", "Private IDEs and Browsing Contexts", "Private Variables Revisited", "Static Bindings vs Secret Urls"
23. anything public can be overriden, including references to collectors
	* section: 
24. templates have no inputs or outputs
	aka you can't access properties of templates, and they make no clones, calls, or insertions
	* section: "Property Access vs Insertion"
	* follows from input-output symmetry and equality (see philosophy section)
	* you also can't insert into them
25. unified access: if you have access to a variable, you can access properties, clone it, or insert to it
25. every module has two parts: the environment and the body
	* environment: the scope, defined by declaration scope, arguments passed during calling/cloning, and insertions
	* body: behavior + properties, carried over during cloning, defined by expressions + property assignment
	* section: "Anatomy of a Module"
25. when you have access to a variable, assume direct communication (private and secure argument passing, insertion, etc)
	* section: "Indirect Writes, and Pass-By-Reference Model"
25. insertions are inherited during cloning
	* section "Insertion and Cloning"
25. `callee(arguments)` will automatically clone both the `callee` and the `arguments` object, and combine the two
	* so be careful of both insertions in the `callee` and `arguments` object
25. arguments object is a template, and behavior declared inside is deferred until the combiner returns the result
	* this means that, insertions and cloning defined in the arguments, will not be evaluated if the callee is a template
	* section: "Arguments as a Template", "Clones and Calls Declared Inside the Arguments", "Defining Behavior That Should be Duplicated"
25. when we declare or extend objects, we define behavior that should be duplicated
	* section: "Defining Behavior That Should be Duplicated"
25. modifications "Actor Model vs Functional - Modifications and State", "Referential Transparency"

### Implementation Rules

1. Reference based, and circular references are allowed
2. Bindings are based on memory location
3. Iteration is done using dynamic binds, in a linked-list fashion (see "Collection Binding/Iteration Using Linked-List Dynamic Bindings")

see section "Cloning and Reference Transfer"

### Implementation Assumptions

1. Value updates happen more than dynamic bind updates
2. sparse vs interconnected?
3. densely populated (many bindings per object property)?

### Mechanisms

* Bindings
	1. Value bindings: creates a value
	2. Reference bindings: creates a reference
	3. Dynamic bindings: creates a binding
* Triggers
	1. Normal triggers
	2. Nested-property triggers
* Modules: a set of bindings
* Built-ins
	* Map bind
	* Reduce bind
	* Filter bind
	* Deep bind

### Mechanism Implementation

Reference Binding:
* Copy
* Event propagation
* Set-Route Event Propagation
* Alias index

Nested Property Triggers:
* Funnel
	* variant: path-incremental
	* variant: tree-incremental
* Incremental
* Event propagation
* Copy

Muxes
* 

Lazy evaluation, dont-call-by-dont-need
	section: "Detecting Unobserved Nodes, Dont-Call-By-Dont-Need"

### Operations

* property access
	* by name
	* using variable
		* mux
* declare object
* modify property
* declare module
* use module
* changetracker
* pattern match / for loop
* combine

### Text-Based Syntax

	x = a + b
	set = (3 5 7)
	out = mymodule(a b)
	obj = { (a b), a: 5, b: 10 }
	prop = obj["a"] || obj.a
	obj2 = set(obj.a, 6)
	obj3 = for (x in obj) {
	}

	module funtimes (in1, in2) {

	} (out1, out2, out3)

	module demoDefaultOutput (in1, in2) {
		out = in1 + int2
	}

	allBinaryLength = paragraph.match(/[01]+/g).foreach(module (e) {
		x = e.length
	} (x)).combine(module (curr, prev) {
		out = curr + prev
	})

* how to minimize stacking in the "reduce" operation
* take advantage of the fact that "void" functions don't exist, maybe we can make some syntax cleaner?
* `+` operator is for concatenation
* `*` operator is for repeat
* `[]` operator is for matchers
	* `.` operator is shorthand for a string matcher

use `list.filter(someCondition).any` or `list.any(someCondition)` to retrieve single item from list
`is` is short for `... = true`, so you can say `if (node is #visited)` to say `if (node.#visited = true)`
`not` is the opposite, short for `... = false`, so you can say `if (node not #visited)` to say `if (node.#visited = false)`

capture blocks stay as three big dots ...
spread operator is shrunk down to …

### Copy Bind

* when binding to an object, use a recursive bind to create bindings between every descendant of the input and the corresponding descendant of the output
* to account for circular references, keep track of visited nodes during the recursive bind

something like

```js
function mirror(source, dest, visited) {
	if (visited.contains(source))
		return;
	visited.add(source);
	if (source instanceof Object) {
		for (var key in source) {
			mirror(source[key], dest[key], visited);
		}
	} else {
		bind(source, dest);
	}
}
```

* because it creates a listener at every single descendant of every object that has bindings, this also (almost) takes care of nested property triggers without needing a separate mechanism
	* doesn't account for dangling bindings, aka if `y = bar.x.x`, and we set `bar = 5`, `y` doesn't get updated to undefined
* however, extremely slow and expensive

### Other Optimizations

Decomposition and Analyzing Shared Paths
1. Deconstruction: Break statements down into atomic binds
2. Comprehension: Find shared variables, and join the paths
3. Reduction: substitute single-use variables with their binding expression

### Philosophy

* start by defining states, not state transitions
* bindings/relationships, not functions
* data, not actions (represent actions through the data they modify)
* variables and relationships are _time-independent_
	* "coding" can now be time-independent, where ..........................................
	* more holistic, rough, like painting
* while there can be multiple ways to achieve one output, so focus on the output and less on the implementation
* define the structure and the relationships between the data, and let the compiler/interpreter determine the optimal procedure
	* interpretted? compiled for single-threaded systems? compiled for multiple-threaded systems? etc...
* programming is an art
	* we should be comfortable expressing incomplete, rough, high-level ideas
	* details can be filled in over time
	* programs are built in layers of increasing complexity
	* AI can be used to suggest how to fill in those details, generating the lower levels
* code should speak for itself
	* less comments, hide extraneous details and complexity
* tagging, marking, labeling
	* relevant sections:
		* "Revisiting Core Concepts - Tagging and Labeling"
		* "Using Tags to Create Sets, Combining Tags"
		* "Tag Queries"
* inputs = outputs
	* allows for feedback


### Advantages

* easier to debug, because every "line of code" is accompanied with some sort of data change
	* imperative languages have "void" functions, how to determine if they were actually executed in a unit test?
* more collaborative
	* loose coupling and no "side-effects" means that you can import modules with less worry
	* the community can compete to optimize popular modules, and everybody can benefit without changing their code
* flexible, allows sketching of rough and incomplete ideas
	* mathematical languages like prolog and haskell allow for very elegant representation of complex ideas, but require a deep understanding of the structure of those ideas before they can be represented as such
* simpler, because objects = functions
	* no callbacks or closures or weird patterns, just declaring variables and relationships 

### Acknowledgements
* Javascript - simplicity, dynamic typing, everything is either an object or function
	* AngularJS - data binding
* Functional programming - everything is a function, elegant
	* no complications from block scopes, race conditions, call by value vs reference, etc
* Prolog - persistence, focus on data/logic, not procedure
* Verilog - dataflow programming
* CSS Matchers and OCaml - pattern matching
* Haskell - nondeterministic list monads (elegant, prolog-like )
