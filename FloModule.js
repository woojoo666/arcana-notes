/*
 *	Structure:
 *
 *	values = {
 *		key1: "hello"
 *		key2: {
 *			subkey1: {...},
 *		},
 *		mArray: [
 *			{...},
 *			{...},
 *			{...},
 *		],
 *	};
 *
 *	bindings = {
 *		key1: [evals to trigger...]
 *		key2: [myeval, anothereval]
 *		key2.subkey1: [anothereval]
 *		mArray: [myarrayeval, mapFn, reduceFn, aliasFn],
 *		mArray.0: { mapDest: mapSubFn0, reduceDest: reduceSubFn },
 *		mArray.1: { mapDest: mapSubFn1, reduceDest: reduceSubFn },
 *		mArray.2: { mapDest: mapSubFn2, reduceDest: reduceSubFn },
 *	};
 *  
 *	aliases = {
 *		myalias: aliasSrc,
 *	};
 *
 *	submodules = {
 *		addmodule: FloModule {},
 *		__1: FloModule{}, // anonymous module
 *	}
 */

class FloModule {

	constructor (fn) {
		this.bindings = {};
		this.values = {};
		this.bindings.__aliases__ = {};
		this.bindings.__submodules__ = {};
		this.submoduleAnonId = 0;
		this.body = fn;
		this.body();
	}

	genModuleId () {
		return this.submoduleAnonId++;
	}

	getTimestamp () {
		return Date.now();
	}

	getVal (path) {
		var obj = this.values;
		if (!path) return obj;

		var keys = (''+path).split('.');
		while (keys.length > 0) {
			var head = keys.shift();
			obj = obj[head];
		}
		return obj;
	}

	getListeners (path) {
		return this.bindings[path] || (this.bindings[path] = []);
	}

	getId (dest) {
		// if multiple destinations, choose the first one? or maybe choose the namespace? wait but no namespace for non-dynamic binds
		// or maybe still namespace for multiple destinations
	}

	aliasbind (dest, src) {
		this.aliases[dest] = src;
		this.bind(dest, [src], x => x);
	}

	bind (arg1, arg2, arg3, arg4) {
		if (blablabla) {
			regularBind(arg1, arg2, arg3);
		} else {
			// dynamic bind
			var mapping = convertToMapping(arg2);
			dynamicBind(mapping.dest, mapping.mapping, arg3, arg4);
		}
	}

	regularBind (dest, triggers, fn) {
		var evaluator = () => {
			var triggerVals = triggers.map( trigger => this.getVal(trigger));
			var newVal = fn.apply(this, triggerVals);
			this.setVal(dest, newVal);
		};
		for (var i = 0; i < triggers.length; i++) {
			var parts = triggers[i].split('.');
	 		var head = parts.shift();
			var tail = parts.join('.');
			var trigger = (this.aliases[head] || head) + tail;
			this.getListeners(trigger).push(evaluator);
		}
		evaluator();
	}

	convertToMapping (arg2) {
		if (!arg2) {
			// arg2 is null or undefined

		} else if (typeof arg2 === 'string') {

		} else if (arg2) {

		}

		return { dest: xxxxxxxxxxxx, mapping: xxxxxxxxxxxxx };
	}

	dynamicBind (dest, mapping, triggers, module) {
		// TODO:
		var evaluator = () => {
			var triggerVals = triggers.map( trigger => this.getVal(trigger));
			triggerVals.shift(new FloModule());
			var newVal = fn.apply(this, triggerVals);
			this.setVal(dest, newVal);
		};
		for (var i = 0; i < triggers.length; i++) {
			var parts = triggers[i].split('.');
			var head = parts.shift();
			var tail = parts.join('.');
			var trigger = (this.aliases[head] || head) + tail;
			this.getListeners(trigger).push(evaluator);
		}
		evaluator();
	}

	separateLast (path) {
		var keys = path.split('.');
		var last = keys.pop();
		return {parentPath: keys.join('.'), key: last};
	}

	setVal (path, value) {
		var split = this.separateLast(path);
		var parent = this.getVal(split.parentPath);
		var prev = parent[split.key];
		parent[split.key] = value;
		if (prev === undefined) this.trigger(split.parentPath); // key added, trigger collection binding
		this.trigger(path); // trigger regular binding
	}

	deleteProp (path) {
		var split = this.separateLast(path);
		var parent = this.getVal(split.parentPath);
		delete parent[split.key];
		this.trigger(path); // trigger regular binding
		this.trigger(split.parentPath); // key removed, trigger collection binding
	}

	trigger (path) {
		var listeners = this.getListeners(path);
		for (var prop : listeners) {

		}
		for (var i = 0; i < listeners.length; i++) {
			listeners[i]();
		}
	}

	import (module, mapping, name) {
		if (!name) name = '__' + this.submoduleAnonId++;
		else if (name.slice(0, 2) == '__') throw "Error: submodule names starting with __ are reserved";


	}

	/******************************** Included Functions *******************************/

	// these functions are not part of FloModule operation, but are useful to have

	mapbind (dest, src, fn) {
		this.dynamicBind('devnull', [src], (module, ar) => {
			this.setVal(dest,new Array(ar.length));
			// do we need to remove the old bindings when rebinding?
			ar.forEach((_, i) => module.bind(dest+'.'+i, [src+'.'+i], fn));
		});
	}

	reducebind (dest, src, fn, start) {
		this.bind('devnull', [src], ar => {
			var triggers = ar.map((_,i) => src+'.'+i);
			// do we need to remove the old bindings when rebinding?
			this.bind(dest, triggers, () => ar.reduce(fn, start));
		});
	}

	filterbind (dest, src, fn) {
		this.reducebind(dest, src, (acc, x) => fn(x) ? acc.concat(x) : acc, []);
	}

	deepbind (dest, triggers, fn) {
		
	}
}


scope.bind('bar', 'foo', x => x*x);
scope.bind(null, ['dividend','divisor'], (x,y) => { scope.quotient = Math.floor(x/y); scope.remainder = x%y; });

scope.import(mapping, ['ar','reversed'], new FloModule(function () {
	
}));

scope.innerbind('out', ['ar','reversed'], function (innerscope, ar, reversed) {
	innerscope.out = [];
	for (var i = 0; i < ar.length; i++) {
		innerscope.out.push()
	}
});

scope.arraybind('out','in', function (output, input) {
	for (var i = 0; i < input.length; i++) {
		output.push(input[input.length-i-1]);
	}
});
 